/**
 * RoomManager - Appwrite Realtime room-based multiplayer
 * 
 * Flow:
 * 1. Host creates a room → gets a 6-char room code
 * 2. Other players join with room code + their display name
 * 3. All players see each other in the lobby via Appwrite Realtime
 * 4. Host starts the match when everyone is ready
 * 5. During gameplay, scores sync via Appwrite document updates + Realtime
 * 6. If a player quits, their status is set to 'left' and shown in the leaderboard
 */

import { databases, client, ensureSession } from '@lib/appwrite';
import { ID, Query } from 'appwrite';
import { appwriteConfig } from '@/config';
import type { Room, RoomPlayer, RoomPlayerStatus, LobbyPlayer } from '../types/game';

export type LobbyUpdateCallback = (players: RoomPlayer[]) => void;
export type MatchStartCallback = () => void;
export type ScoreUpdateCallback = (players: RoomPlayer[]) => void;
export type PlayerLeftCallback = (player: RoomPlayer) => void;

const DB = appwriteConfig.databaseId;
const ROOMS_COL = appwriteConfig.roomsCollectionId;
const PLAYERS_COL = appwriteConfig.roomPlayersCollectionId;

export class RoomManager {
  private currentRoomId: string | null = null;
  private currentPlayerId: string | null = null; // document $id in room-players
  private localId: string | null = null; // generated unique id for this session

  // Realtime unsubscribe handles
  private unsubRoom: (() => void) | null = null;
  private unsubPlayers: (() => void) | null = null;

  // Callbacks
  private lobbyUpdateCb: LobbyUpdateCallback | null = null;
  private matchStartCb: MatchStartCallback | null = null;
  private scoreUpdateCb: ScoreUpdateCallback | null = null;
  private playerLeftCb: PlayerLeftCallback | null = null;

  // Heartbeat
  private heartbeatInterval: number | null = null;

  // Score emit throttle
  private lastScoreEmitMs = 0;
  private scoreEmitThrottleMs = 800;

  /**
   * Generate a random 6-char room code
   */
  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No ambiguous chars (0/O, 1/I)
    let code = '';
    const array = new Uint8Array(6);
    crypto.getRandomValues(array);
    for (let i = 0; i < 6; i++) {
      code += chars[array[i] % chars.length];
    }
    return code;
  }

  /**
   * Generate a unique local player ID for this session
   */
  private generateLocalId(): string {
    return 'p_' + crypto.randomUUID().slice(0, 12);
  }

  // ─── ROOM CREATION & JOINING ────────────────────────────────────

  /**
   * Create a new room (host)
   */
  async createRoom(hostName: string, maxPlayers: number = 8): Promise<{ room: Room; roomCode: string }> {
    await ensureSession();
    const roomCode = this.generateRoomCode();
    this.localId = this.generateLocalId();

    const roomDoc = await databases.createDocument(DB, ROOMS_COL, ID.unique(), {
      roomCode,
      hostId: this.localId,
      hostName,
      status: 'waiting',
      maxPlayers,
      playerCount: 1,
    });

    const room = roomDoc as unknown as Room;
    this.currentRoomId = room.$id;

    // Add host as first player
    const playerDoc = await databases.createDocument(DB, PLAYERS_COL, ID.unique(), {
      roomId: room.$id,
      odplayerName: hostName,
      odplayerId: this.localId,
      score: 0,
      status: 'waiting' as RoomPlayerStatus,
      isHost: true,
    });

    this.currentPlayerId = playerDoc.$id;

    return { room, roomCode };
  }

  /**
   * Join an existing room by code
   */
  async joinRoom(roomCode: string, playerName: string): Promise<{ room: Room; players: RoomPlayer[] }> {
    await ensureSession();
    // Find room by code
    const response = await databases.listDocuments(DB, ROOMS_COL, [
      Query.equal('roomCode', roomCode.toUpperCase()),
      Query.equal('status', 'waiting'),
      Query.limit(1),
    ]);

    if (response.documents.length === 0) {
      throw new Error('Room not found or game already started');
    }

    const room = response.documents[0] as unknown as Room;

    // Check player count
    if (room.playerCount >= room.maxPlayers) {
      throw new Error('Room is full');
    }

    this.localId = this.generateLocalId();
    this.currentRoomId = room.$id;

    // Add player to room
    const playerDoc = await databases.createDocument(DB, PLAYERS_COL, ID.unique(), {
      roomId: room.$id,
      odplayerName: playerName,
      odplayerId: this.localId,
      score: 0,
      status: 'waiting' as RoomPlayerStatus,
      isHost: false,
    });

    this.currentPlayerId = playerDoc.$id;

    // Update room player count
    await databases.updateDocument(DB, ROOMS_COL, room.$id, {
      playerCount: room.playerCount + 1,
    });

    // Get all current players
    const players = await this.fetchRoomPlayers(room.$id);

    return { room, players };
  }

  // ─── LOBBY ──────────────────────────────────────────────────────

  /**
   * Subscribe to lobby updates via Appwrite Realtime
   */
  subscribeLobby(
    onLobbyUpdate: LobbyUpdateCallback,
    onMatchStart: MatchStartCallback,
  ): void {
    if (!this.currentRoomId) return;

    this.lobbyUpdateCb = onLobbyUpdate;
    this.matchStartCb = onMatchStart;

    const roomId = this.currentRoomId;

    // Subscribe to room-players collection changes for this room
    this.unsubPlayers = client.subscribe(
      `databases.${DB}.collections.${PLAYERS_COL}.documents`,
      (response) => {
        const payload = response.payload as any;
        // Only react to players in our room
        if (payload.roomId !== roomId) return;

        // Re-fetch all players for consistency
        void this.fetchRoomPlayers(roomId).then((players) => {
          if (this.lobbyUpdateCb) this.lobbyUpdateCb(players);
        });
      },
    );

    // Subscribe to room document changes (for status change to 'playing')
    this.unsubRoom = client.subscribe(
      `databases.${DB}.collections.${ROOMS_COL}.documents.${roomId}`,
      (response) => {
        const payload = response.payload as any;
        if (payload.status === 'playing' && this.matchStartCb) {
          this.matchStartCb();
        }
      },
    );
  }

  /**
   * Toggle ready status
   */
  async toggleReady(): Promise<boolean> {
    if (!this.currentPlayerId) return false;

    const doc = await databases.getDocument(DB, PLAYERS_COL, this.currentPlayerId);
    const currentStatus = doc.status as RoomPlayerStatus;
    const newStatus: RoomPlayerStatus = currentStatus === 'ready' ? 'waiting' : 'ready';

    await databases.updateDocument(DB, PLAYERS_COL, this.currentPlayerId, {
      status: newStatus,
    });

    return newStatus === 'ready';
  }

  /**
   * Start the match (host only) — sets room status to 'playing' and all player statuses
   */
  async startMatch(): Promise<void> {
    if (!this.currentRoomId || !this.localId) return;

    // Verify we are host
    const room = await databases.getDocument(DB, ROOMS_COL, this.currentRoomId);
    if (room.hostId !== this.localId) {
      throw new Error('Only the host can start the match');
    }

    // Check all non-host players are ready
    const players = await this.fetchRoomPlayers(this.currentRoomId);
    const allReady = players.every((p) => p.isHost || p.status === 'ready');
    if (!allReady) {
      throw new Error('Not all players are ready');
    }

    // Set all players to 'playing'
    for (const player of players) {
      await databases.updateDocument(DB, PLAYERS_COL, player.$id, {
        status: 'playing' as RoomPlayerStatus,
        score: 0,
      });
    }

    // Set room status to 'playing' — triggers realtime event for all subscribers
    await databases.updateDocument(DB, ROOMS_COL, this.currentRoomId, {
      status: 'playing',
    });
  }

  // ─── GAMEPLAY SCORE SYNC ───────────────────────────────────────

  /**
   * Subscribe to real-time score updates during gameplay
   */
  subscribeScoreUpdates(
    onScoreUpdate: ScoreUpdateCallback,
    onPlayerLeft: PlayerLeftCallback,
  ): void {
    if (!this.currentRoomId) return;

    this.scoreUpdateCb = onScoreUpdate;
    this.playerLeftCb = onPlayerLeft;

    const roomId = this.currentRoomId;

    // Unsubscribe old lobby subscription (replace with score-focused one)
    this.unsubscribeAll();

    this.unsubPlayers = client.subscribe(
      `databases.${DB}.collections.${PLAYERS_COL}.documents`,
      (response) => {
        const payload = response.payload as any;
        if (payload.roomId !== roomId) return;

        // Check if a player left
        if (payload.status === 'left' && this.playerLeftCb) {
          this.playerLeftCb(payload as unknown as RoomPlayer);
        }

        // Re-fetch all players and emit scores
        void this.fetchRoomPlayers(roomId).then((players) => {
          if (this.scoreUpdateCb) this.scoreUpdateCb(players);
        });
      },
    );

    // Start heartbeat to detect disconnects
    this.startHeartbeat();
  }

  /**
   * Emit local score update (throttled)
   */
  async emitScore(score: number): Promise<void> {
    if (!this.currentPlayerId) return;

    const now = Date.now();
    if (now - this.lastScoreEmitMs < this.scoreEmitThrottleMs) return;
    this.lastScoreEmitMs = now;

    try {
      await databases.updateDocument(DB, PLAYERS_COL, this.currentPlayerId, {
        score,
      });
    } catch {
      // Silently fail — network hiccup, will retry on next emit
    }
  }

  /**
   * Mark local player as finished (game over)
   */
  async finishGame(finalScore: number): Promise<void> {
    if (!this.currentPlayerId) return;

    try {
      await databases.updateDocument(DB, PLAYERS_COL, this.currentPlayerId, {
        score: finalScore,
        status: 'finished' as RoomPlayerStatus,
      });
    } catch {
      // Silently fail
    }
  }

  /**
   * Mark local player as left (quit mid-game)
   */
  async leaveRoom(): Promise<void> {
    if (!this.currentPlayerId) return;

    try {
      await databases.updateDocument(DB, PLAYERS_COL, this.currentPlayerId, {
        status: 'left' as RoomPlayerStatus,
      });
    } catch {
      // Silently fail
    }

    // If we are host and room is waiting, clean up
    if (this.currentRoomId) {
      try {
        const room = await databases.getDocument(DB, ROOMS_COL, this.currentRoomId);
        if (room.status === 'waiting' && room.hostId === this.localId) {
          // Update room player count
          const activePlayers = await this.fetchActivePlayers(this.currentRoomId);
          if (activePlayers.length === 0) {
            await databases.updateDocument(DB, ROOMS_COL, this.currentRoomId, {
              status: 'finished',
              playerCount: 0,
            });
          } else {
            await databases.updateDocument(DB, ROOMS_COL, this.currentRoomId, {
              playerCount: activePlayers.length,
            });
          }
        }
      } catch {
        // Silently fail
      }
    }

    this.cleanup();
  }

  // ─── QUERIES ────────────────────────────────────────────────────

  /**
   * Fetch all players in a room
   */
  async fetchRoomPlayers(roomId: string): Promise<RoomPlayer[]> {
    const response = await databases.listDocuments(DB, PLAYERS_COL, [
      Query.equal('roomId', roomId),
      Query.limit(20),
    ]);

    return response.documents as unknown as RoomPlayer[];
  }

  /**
   * Fetch active (non-left) players
   */
  private async fetchActivePlayers(roomId: string): Promise<RoomPlayer[]> {
    const response = await databases.listDocuments(DB, PLAYERS_COL, [
      Query.equal('roomId', roomId),
      Query.notEqual('status', 'left'),
      Query.limit(20),
    ]);

    return response.documents as unknown as RoomPlayer[];
  }

  /**
   * Get final game results for the room
   */
  async getGameResults(): Promise<RoomPlayer[]> {
    if (!this.currentRoomId) return [];

    return this.fetchRoomPlayers(this.currentRoomId);
  }

  // ─── HEARTBEAT ─────────────────────────────────────────────────

  /**
   * Periodically touch our player doc to prove we are alive
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) return;

    this.heartbeatInterval = window.setInterval(async () => {
      if (!this.currentPlayerId) return;

      try {
        // Read our own doc to keep the connection alive
        await databases.getDocument(DB, PLAYERS_COL, this.currentPlayerId);
      } catch {
        // Our doc was deleted or server unreachable
      }
    }, 15000);
  }

  // ─── HELPERS ────────────────────────────────────────────────────

  /**
   * Convert RoomPlayer[] to LobbyPlayer[] for UI compatibility
   */
  toLobbyPlayers(roomPlayers: RoomPlayer[]): LobbyPlayer[] {
    return roomPlayers
      .filter((p) => p.status !== 'left')
      .map((p) => ({
        userId: p.odplayerId,
        userName: p.odplayerName,
        isReady: p.status === 'ready' || p.isHost,
        isHost: p.isHost,
      }));
  }

  /**
   * Unsubscribe from all realtime channels
   */
  private unsubscribeAll(): void {
    if (this.unsubRoom) {
      this.unsubRoom();
      this.unsubRoom = null;
    }
    if (this.unsubPlayers) {
      this.unsubPlayers();
      this.unsubPlayers = null;
    }
  }

  /**
   * Full cleanup
   */
  cleanup(): void {
    this.unsubscribeAll();

    if (this.heartbeatInterval) {
      window.clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    this.currentRoomId = null;
    this.currentPlayerId = null;
    this.lobbyUpdateCb = null;
    this.matchStartCb = null;
    this.scoreUpdateCb = null;
    this.playerLeftCb = null;
    this.lastScoreEmitMs = 0;
  }

  // ─── GETTERS ────────────────────────────────────────────────────

  getRoomId(): string | null {
    return this.currentRoomId;
  }

  getPlayerId(): string | null {
    return this.currentPlayerId;
  }

  getLocalId(): string | null {
    return this.localId;
  }

  // ─── DIFFICULTY SELECTION ───────────────────────────────────────

  /**
   * Set difficulty for the room (host only)
   */
  async setDifficulty(difficulty: string): Promise<void> {
    if (!this.currentRoomId || !this.localId) {
      throw new Error('No active room');
    }

    // Verify we are host
    const room = await databases.getDocument(DB, ROOMS_COL, this.currentRoomId);
    if (room.hostId !== this.localId) {
      throw new Error('Only the host can set difficulty');
    }

    // Update room with difficulty
    await databases.updateDocument(DB, ROOMS_COL, this.currentRoomId, {
      difficulty,
    });
  }

  /**
   * Get current room difficulty
   */
  async getDifficulty(): Promise<string | null> {
    if (!this.currentRoomId) return null;

    const room = await databases.getDocument(DB, ROOMS_COL, this.currentRoomId);
    return (room as any).difficulty || null;
  }

  /**
   * Check if local player is host
   */
  async isLocalPlayerHost(): Promise<boolean> {
    if (!this.currentRoomId || !this.localId) return false;

    const room = await databases.getDocument(DB, ROOMS_COL, this.currentRoomId);
    return room.hostId === this.localId;
  }
}
