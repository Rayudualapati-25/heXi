/**
 * GroupManager - Appwrite-backed group/room system
 */

import { databases, client } from '@lib/appwrite';
import { ID, Query } from 'appwrite';
import type { Group, GroupScore, LobbyPlayer } from '../types/game';
import type { RealtimeResponseEvent } from 'appwrite';

interface LiveScore {
  userId: string;
  userName: string;
  score: number;
  timestamp: number;
}

type ScoreSyncCallback = (opponentScore: number, opponentName: string) => void;
type DisconnectCallback = () => void;
type PlayerLeftCallback = (userName: string, remainingPlayers: string[]) => void;
type LobbyUpdateCallback = (players: LobbyPlayer[]) => void;
type MatchStartCallback = () => void;

export class GroupManager {
  private databaseId: string;
  private groupsCollectionId: string;
  private groupScoresCollectionId: string;
  
  // Competitive score sync state
  private liveScores: Map<string, LiveScore> = new Map();
  private scoreUpdateInterval: number | null = null;
  private realtimeUnsubscribe: (() => void) | null = null;
  private currentUserId: string | null = null;
  private currentGroupId: string | null = null;
  private scoreSyncCallback: ScoreSyncCallback | null = null;
  private disconnectCallback: DisconnectCallback | null = null;
  private playerLeftCallback: PlayerLeftCallback | null = null;
  private lastScoreEmitMs = 0;
  private scoreEmitThrottleMs = 1000; // Emit at most once per second
  
  // Lobby state
  private lobbyPlayers: Map<string, LobbyPlayer> = new Map();
  private lobbyUpdateCallback: LobbyUpdateCallback | null = null;
  private matchStartCallback: MatchStartCallback | null = null;
  private lobbyUpdateInterval: number | null = null;
  private storageListener: ((event: StorageEvent) => void) | null = null;

  constructor() {
    this.databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    this.groupsCollectionId = import.meta.env.VITE_APPWRITE_GROUPS_COLLECTION_ID;
    this.groupScoresCollectionId = import.meta.env.VITE_APPWRITE_GROUPSCORES_COLLECTION_ID;

    if (!this.databaseId || !this.groupsCollectionId || !this.groupScoresCollectionId) {
      console.error('Missing Appwrite group collection configuration.');
    }
  }

  public generateRoomCode(length: number = 6): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i += 1) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  public async createGroup(userId: string, groupName: string, userName: string): Promise<Group> {
    const roomCode = this.generateRoomCode();

    const group = await databases.createDocument(
      this.databaseId,
      this.groupsCollectionId,
      ID.unique(),
      {
        roomCode,
        groupName,
        createdBy: userId,
        memberIds: [userId],
        memberCount: 1,
        isActive: true,
      }
    );

    await this.ensureGroupScore(userId, userName, group.$id);

    return group as unknown as Group;
  }

  public async joinGroup(userId: string, userName: string, roomCode: string): Promise<Group> {
    const response = await databases.listDocuments(
      this.databaseId,
      this.groupsCollectionId,
      [Query.equal('roomCode', roomCode), Query.limit(1)]
    );

    if (response.documents.length === 0) {
      throw new Error('Room code not found');
    }

    const group = response.documents[0] as unknown as Group;

    if (!group.memberIds.includes(userId)) {
      const memberIds = [...group.memberIds, userId];
      await databases.updateDocument(
        this.databaseId,
        this.groupsCollectionId,
        group.$id,
        {
          memberIds,
          memberCount: memberIds.length,
        }
      );
    }

    await this.ensureGroupScore(userId, userName, group.$id);

    return group;
  }

  public async leaveGroup(userId: string, groupId: string): Promise<void> {
    const group = await databases.getDocument(
      this.databaseId,
      this.groupsCollectionId,
      groupId
    );

    const memberIds = (group.memberIds || []).filter((id: string) => id !== userId);
    await databases.updateDocument(
      this.databaseId,
      this.groupsCollectionId,
      groupId,
      {
        memberIds,
        memberCount: memberIds.length,
      }
    );
  }

  public async getGroupInfo(groupId: string): Promise<Group> {
    const group = await databases.getDocument(
      this.databaseId,
      this.groupsCollectionId,
      groupId
    );

    return group as unknown as Group;
  }

  public async getGroupLeaderboard(groupId: string): Promise<GroupScore[]> {
    const response = await databases.listDocuments(
      this.databaseId,
      this.groupScoresCollectionId,
      [Query.equal('groupId', groupId), Query.orderDesc('bestScore'), Query.limit(100)]
    );

    return response.documents.map((doc) => ({
      $id: doc.$id,
      userId: doc.userId as string,
      groupId: doc.groupId as string,
      userName: doc.userName as string,
      bestScore: doc.bestScore as number,
      gamesPlayed: doc.gamesPlayed as number,
      lastPlayedAt: doc.lastPlayedAt as string | undefined,
      difficulty: doc.difficulty as string | undefined,
    }));
  }

  public async recordGroupScore(
    userId: string,
    userName: string,
    groupId: string,
    score: number,
    difficulty: string
  ): Promise<void> {
    try {
      const existing = await this.getGroupScore(userId, groupId);

      if (!existing) {
        try {
          await databases.createDocument(
            this.databaseId,
            this.groupScoresCollectionId,
            ID.unique(),
            {
              userId,
              groupId,
              userName,
              bestScore: score,
              gamesPlayed: 1,
              difficulty,
            }
          );
          return;
        } catch (createError: any) {
          // If document already exists (race condition), fetch it and update
          if (createError.code === 409 || createError.message?.includes('already exists')) {
            const refetched = await this.getGroupScore(userId, groupId);
            if (refetched) {
              const bestScore = Math.max(refetched.bestScore, score);
              await databases.updateDocument(
                this.databaseId,
                this.groupScoresCollectionId,
                refetched.$id,
                {
                  bestScore,
                  gamesPlayed: refetched.gamesPlayed + 1,
                  difficulty,
                }
              );
              return;
            }
          }
          throw createError;
        }
      }

      const bestScore = Math.max(existing.bestScore, score);
      await databases.updateDocument(
        this.databaseId,
        this.groupScoresCollectionId,
        existing.$id,
        {
          bestScore,
          gamesPlayed: existing.gamesPlayed + 1,
          difficulty,
        }
      );
    } catch (error) {
      console.error('Error recording group score:', error);
      // Don't throw - just log the error so the game can continue
    }
  }

  public async getUserGroups(userId: string): Promise<Group[]> {
    const response = await databases.listDocuments(
      this.databaseId,
      this.groupsCollectionId,
      [Query.contains('memberIds', userId), Query.orderDesc('$createdAt')]
    );

    return response.documents as unknown as Group[];
  }

  /**
   * Mark player as left in group score (for tracking who quit during game)
   */
  public async markPlayerLeftInScore(userId: string, groupId: string): Promise<void> {
    try {
      const existing = await this.getGroupScore(userId, groupId);
      if (!existing) return;

      await databases.updateDocument(
        this.databaseId,
        this.groupScoresCollectionId,
        existing.$id,
        {
          hasLeft: true,
          leftAt: new Date().toISOString(),
        }
      );

      console.log('[GroupManager] Player marked as left in score:', userId);
    } catch (error) {
      console.error('Error marking player as left:', error);
    }
  }

  private async getGroupScore(userId: string, groupId: string): Promise<GroupScore | null> {
    const response = await databases.listDocuments(
      this.databaseId,
      this.groupScoresCollectionId,
      [Query.equal('userId', userId), Query.equal('groupId', groupId), Query.limit(1)]
    );

    if (response.documents.length === 0) return null;

    const doc = response.documents[0];
    return {
      $id: doc.$id,
      userId: doc.userId as string,
      groupId: doc.groupId as string,
      userName: doc.userName as string,
      bestScore: doc.bestScore as number,
      gamesPlayed: doc.gamesPlayed as number,
      lastPlayedAt: doc.lastPlayedAt as string | undefined,
      difficulty: doc.difficulty as string | undefined,
      hasLeft: doc.hasLeft as boolean | undefined,
      leftAt: doc.leftAt as string | undefined,
    };
  }

  private async ensureGroupScore(userId: string, userName: string, groupId: string): Promise<void> {
    const existing = await this.getGroupScore(userId, groupId);
    if (existing) return;

    await databases.createDocument(
      this.databaseId,
      this.groupScoresCollectionId,
      ID.unique(),
      {
        userId,
        groupId,
        userName,
        bestScore: 0,
        gamesPlayed: 0,
        lastPlayedAt: new Date().toISOString(),
        difficulty: 'standard',
        hasLeft: false,
      }
    );
  }
  
  /**
   * Start competitive score sync for multiplayer session
   * Emits local scores and receives opponent scores via realtime
   */
  public startScoreSync(
    userId: string,
    userName: string,
    groupId: string,
    onScoreUpdate: ScoreSyncCallback,
    onDisconnect: DisconnectCallback,
    onPlayerLeft?: PlayerLeftCallback
  ): void {
    this.currentUserId = userId;
    this.currentGroupId = groupId;
    this.scoreSyncCallback = onScoreUpdate;
    this.disconnectCallback = onDisconnect;
    this.playerLeftCallback = onPlayerLeft ?? null;
    this.liveScores.clear();
    this.lastScoreEmitMs = 0;
    
    // Add self to live scores
    this.liveScores.set(userId, {
      userId,
      userName,
      score: 0,
      timestamp: Date.now(),
    });
    
    // Start periodic polling and cleanup
    this.scoreUpdateInterval = window.setInterval(() => {
      this.pollOpponentScores();
      this.cleanupStaleScores();
    }, 1500);
    
    console.log('[GroupManager] Score sync started for group:', groupId);
  }
  
  /**
   * Stop score sync and cleanup
   */
  public stopScoreSync(): void {
    if (this.scoreUpdateInterval) {
      window.clearInterval(this.scoreUpdateInterval);
      this.scoreUpdateInterval = null;
    }
    
    if (this.realtimeUnsubscribe) {
      this.realtimeUnsubscribe();
      this.realtimeUnsubscribe = null;
    }
    
    // Cleanup localStorage
    if (this.currentGroupId && this.currentUserId) {
      const key = `score_${this.currentGroupId}_${this.currentUserId}`;
      localStorage.removeItem(key);
    }
    
    this.liveScores.clear();
    this.currentUserId = null;
    this.currentGroupId = null;
    this.scoreSyncCallback = null;
    this.disconnectCallback = null;
    this.playerLeftCallback = null;
    
    console.log('[GroupManager] Score sync stopped');
  }
  
  /**
   * Emit local player score (throttled to reduce network load)
   */
  public emitScore(score: number): void {
    if (!this.currentUserId || !this.currentGroupId) return;
    
    const now = Date.now();
    if (now - this.lastScoreEmitMs < this.scoreEmitThrottleMs) return;
    
    this.lastScoreEmitMs = now;
    
    // Update local live score
    const existing = this.liveScores.get(this.currentUserId);
    if (existing) {
      existing.score = score;
      existing.timestamp = now;
    }
    
    // Broadcast via localStorage (lightweight local sync)
    this.broadcastScoreUpdate(score);
  }
  
  /**
   * Get highest opponent score (ghostScore)
   */
  public getGhostScore(): { score: number; name: string } | null {
    if (!this.currentUserId) return null;
    
    let highestScore = 0;
    let highestName = '';
    
    for (const [userId, liveScore] of this.liveScores) {
      if (userId !== this.currentUserId && liveScore.score > highestScore) {
        highestScore = liveScore.score;
        highestName = liveScore.userName;
      }
    }
    
    return highestScore > 0 ? { score: highestScore, name: highestName } : null;
  }
  
  /**
   * Broadcast score via lightweight mechanism (localStorage)
   */
  private broadcastScoreUpdate(score: number): void {
    const key = `score_${this.currentGroupId}_${this.currentUserId}`;
    localStorage.setItem(key, JSON.stringify({
      score,
      timestamp: Date.now(),
    }));
  }
  
  /**
   * Poll opponent scores from localStorage
   */
  private pollOpponentScores(): void {
    if (!this.currentGroupId || !this.currentUserId || !this.scoreSyncCallback) return;
    
    const prefix = `score_${this.currentGroupId}_`;
    const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix) && !k.endsWith(this.currentUserId));
    
    let updated = false;
    for (const key of keys) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        const userId = key.replace(prefix, '');
        
        if (data.score !== undefined) {
          const existing = this.liveScores.get(userId);
          const userName = existing?.userName || 'Opponent';
          
          this.liveScores.set(userId, {
            userId,
            userName,
            score: data.score,
            timestamp: data.timestamp,
          });
          
          updated = true;
        }
      } catch (error) {
        // Ignore parse errors
      }
    }
    
    // Notify callback with highest opponent score
    if (updated) {
      const ghost = this.getGhostScore();
      if (ghost) {
        this.scoreSyncCallback(ghost.score, ghost.name);
      }
    }
  }
  
  /**
   * Clean up stale scores (detect disconnects)
   */
  private cleanupStaleScores(): void {
    const now = Date.now();
    const staleThresholdMs = 10000; // 10 seconds without update = disconnected
    
    let hadOpponents = false;
    let hasOpponents = false;
    const leftPlayers: string[] = [];
    
    for (const [userId, liveScore] of this.liveScores) {
      if (userId === this.currentUserId) continue;
      
      hadOpponents = true;
      
      if (now - liveScore.timestamp > staleThresholdMs) {
        this.liveScores.delete(userId);
        console.log('[GroupManager] Opponent disconnected:', userId, liveScore.userName);
        
        // Mark player as left
        leftPlayers.push(liveScore.userName);
        
        // Mark in database
        if (this.currentGroupId) {
          void this.markPlayerLeftInScore(userId, this.currentGroupId);
        }
        
        // Clean up their localStorage entry
        const key = `score_${this.currentGroupId}_${userId}`;
        localStorage.removeItem(key);
      } else {
        hasOpponents = true;
      }
    }
    
    // Notify about players who left
    if (leftPlayers.length > 0 && this.playerLeftCallback) {
      const remainingPlayers = Array.from(this.liveScores.values())
        .filter(s => s.userId !== this.currentUserId)
        .map(s => s.userName);
      
      leftPlayers.forEach(playerName => {
        this.playerLeftCallback!(playerName, remainingPlayers);
      });
    }
    
    // Trigger disconnect callback if all opponents are gone
    if (hadOpponents && !hasOpponents && this.disconnectCallback) {
      console.log('[GroupManager] All opponents disconnected - converting to single-player');
      this.disconnectCallback();
    }
  }
  
  /**
   * ===== LOBBY SYSTEM =====
   */
  
  /**
   * Create lobby for a group
   */
  public async createLobby(
    userId: string,
    userName: string,
    groupId: string,
    roomCode: string,
    onLobbyUpdate: LobbyUpdateCallback,
    onMatchStart: MatchStartCallback
  ): Promise<void> {
    this.currentUserId = userId;
    this.currentGroupId = groupId;
    this.lobbyUpdateCallback = onLobbyUpdate;
    this.matchStartCallback = onMatchStart;
    this.lobbyPlayers.clear();
    
    // Add self as host
    const hostPlayer: LobbyPlayer = {
      userId,
      userName,
      isReady: false,
      isHost: true,
      isActive: true,
      hasLeft: false,
    };
    this.lobbyPlayers.set(userId, hostPlayer);
    
    // Broadcast lobby state
    this.broadcastLobbyState();
    
    // Setup event-driven updates via localStorage
    this.setupLobbyStorageListener();
    
    console.log('[GroupManager] Lobby created:', roomCode);
  }
  
  /**
   * Join existing lobby
   */
  public async joinLobby(
    userId: string,
    userName: string,
    groupId: string,
    onLobbyUpdate: LobbyUpdateCallback,
    onMatchStart: MatchStartCallback
  ): Promise<void> {
    this.currentUserId = userId;
    this.currentGroupId = groupId;
    this.lobbyUpdateCallback = onLobbyUpdate;
    this.matchStartCallback = onMatchStart;
    this.lobbyPlayers.clear();
    
    // Poll existing lobby state
    await this.pollLobbyState();
    
    // Add self as player
    const player: LobbyPlayer = {
      userId,
      userName,
      isReady: false,
      isHost: false,
      isActive: true,
      hasLeft: false,
    };
    this.lobbyPlayers.set(userId, player);
    
    // Broadcast updated state
    this.broadcastLobbyState();
    
    // Setup event-driven updates
    this.setupLobbyStorageListener();
    
    console.log('[GroupManager] Joined lobby:', groupId);
  }
  
  /**
   * Toggle player ready status
   */
  public toggleReady(): void {
    if (!this.currentUserId) return;
    
    const player = this.lobbyPlayers.get(this.currentUserId);
    if (!player) return;
    
    player.isReady = !player.isReady;
    this.lobbyPlayers.set(this.currentUserId, player);
    
    // Broadcast updated state
    this.broadcastLobbyState();
    
    console.log('[GroupManager] Player ready status:', player.isReady);
  }
  
  /**
   * Start match (host only)
   */
  public startMatch(): void {
    if (!this.currentUserId || !this.currentGroupId) return;
    
    const player = this.lobbyPlayers.get(this.currentUserId);
    if (!player || !player.isHost) {
      console.warn('[GroupManager] Only host can start match');
      return;
    }
    
    // Check if all players are ready
    const allReady = Array.from(this.lobbyPlayers.values()).every(p => p.isReady || p.isHost);
    if (!allReady) {
      console.warn('[GroupManager] Not all players are ready');
      return;
    }
    
    // Broadcast match start event
    const key = `lobby_start_${this.currentGroupId}`;
    localStorage.setItem(key, JSON.stringify({
      timestamp: Date.now(),
    }));
    
    // Trigger local callback
    if (this.matchStartCallback) {
      this.matchStartCallback();
    }
    
    console.log('[GroupManager] Match started');
  }
  
  /**
   * Leave lobby
   */
  public leaveLobby(): void {
    if (!this.currentUserId || !this.currentGroupId) return;
    
    // Mark self as having left
    const player = this.lobbyPlayers.get(this.currentUserId);
    if (player) {
      player.hasLeft = true;
      player.isActive = false;
      this.lobbyPlayers.set(this.currentUserId, player);
    }
    
    // Broadcast updated state to notify others
    this.broadcastLobbyState();
    
    // Cleanup after a short delay to allow broadcast
    const userId = this.currentUserId;
    setTimeout(() => {
      if (userId) {
        this.lobbyPlayers.delete(userId);
      }
      this.cleanupLobby();
    }, 500);
    
    console.log('[GroupManager] Left lobby');
  }
  
  /**
   * Mark player as left during active game
   */
  public markPlayerAsLeft(userId: string): void {
    const player = this.lobbyPlayers.get(userId);
    if (player) {
      player.hasLeft = true;
      player.isActive = false;
      this.lobbyPlayers.set(userId, player);
      this.broadcastLobbyState();
      console.log('[GroupManager] Player marked as left:', userId);
    }
  }
  
  /**
   * Get active players (not left)
   */
  public getActivePlayers(): LobbyPlayer[] {
    return Array.from(this.lobbyPlayers.values()).filter(p => p.isActive !== false);
  }
  
  /**
   * Get current lobby players
   */
  public getLobbyPlayers(): LobbyPlayer[] {
    return Array.from(this.lobbyPlayers.values());
  }
  
  /**
   * Broadcast lobby state via localStorage
   */
  private broadcastLobbyState(): void {
    if (!this.currentGroupId || !this.currentUserId) return;
    
    const key = `lobby_${this.currentGroupId}_${this.currentUserId}`;
    localStorage.setItem(key, JSON.stringify({
      players: Array.from(this.lobbyPlayers.values()),
      timestamp: Date.now(),
    }));
  }
  
  /**
   * Poll lobby state from all players
   */
  private async pollLobbyState(): Promise<void> {
    if (!this.currentGroupId) return;
    
    const prefix = `lobby_${this.currentGroupId}_`;
    const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
    
    const allPlayers = new Map<string, LobbyPlayer>();
    
    for (const key of keys) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        if (data.players && Array.isArray(data.players)) {
          for (const player of data.players) {
            allPlayers.set(player.userId, player);
          }
        }
      } catch (error) {
        // Ignore parse errors
      }
    }
    
    // Merge into local lobby state
    for (const [userId, player] of allPlayers) {
      if (userId !== this.currentUserId) {
        this.lobbyPlayers.set(userId, player);
      }
    }
    
    // Notify callback
    if (this.lobbyUpdateCallback) {
      this.lobbyUpdateCallback(Array.from(this.lobbyPlayers.values()));
    }
  }
  
  /**
   * Setup event-driven lobby updates via storage events
   */
  private setupLobbyStorageListener(): void {
    if (this.storageListener) return;
    
    this.storageListener = (event: StorageEvent) => {
      if (!this.currentGroupId) return;
      
      // Lobby state update
      if (event.key?.startsWith(`lobby_${this.currentGroupId}_`)) {
        this.pollLobbyState();
      }
      
      // Match start event
      if (event.key === `lobby_start_${this.currentGroupId}`) {
        if (this.matchStartCallback) {
          this.matchStartCallback();
        }
      }
    };
    
    window.addEventListener('storage', this.storageListener);
    
    // Fallback: periodic polling (only as backup)
    this.lobbyUpdateInterval = window.setInterval(() => {
      this.pollLobbyState();
    }, 2000);
  }
  
  /**
   * Cleanup lobby
   */
  private cleanupLobby(): void {
    if (this.storageListener) {
      window.removeEventListener('storage', this.storageListener);
      this.storageListener = null;
    }
    
    if (this.lobbyUpdateInterval) {
      window.clearInterval(this.lobbyUpdateInterval);
      this.lobbyUpdateInterval = null;
    }
    
    // Cleanup localStorage
    if (this.currentGroupId && this.currentUserId) {
      const key = `lobby_${this.currentGroupId}_${this.currentUserId}`;
      localStorage.removeItem(key);
    }
    
    this.lobbyPlayers.clear();
    this.currentUserId = null;
    this.currentGroupId = null;
    this.lobbyUpdateCallback = null;
    this.matchStartCallback = null;
  }
}

