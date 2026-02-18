/**
 * RoomManager — Socket.io-based multiplayer room management
 *
 * All real-time communication now goes through the Socket.io server.
 * Appwrite is kept only for persisting final scores to the leaderboard.
 */

import { socketManager } from './SocketManager';
import type { SocketRoom, SocketPlayer, ScoreEntry, GameResult } from './SocketManager';
import type { LobbyPlayer } from '../types/game';

export type LobbyUpdateCallback  = (players: LobbyPlayer[]) => void;
export type MatchStartCallback   = () => void;
export type ScoreUpdateCallback  = (entries: ScoreEntry[]) => void;
export type PlayerLeftCallback   = (data: { playerId: string; name: string }) => void;
export type GameResultsCallback  = (results: GameResult[]) => void;

// Re-export for consumers
export type { SocketRoom, SocketPlayer, ScoreEntry, GameResult };

// ────────────────────────────────────────────────────────────────────────────
// STUB types kept so the old RoomPlayer references in game.d.ts still compile.
// They are no longer used at runtime.
// ────────────────────────────────────────────────────────────────────────────

export class RoomManager {
  private roomId: string | null = null;
  private roomCode: string | null = null;
  private localId: string | null = null;
  private localName: string | null = null;
  private isHostFlag = false;
  private currentRoom: SocketRoom | null = null;

  // Score emit throttle
  private lastScoreEmitMs = 0;
  private readonly scoreEmitThrottleMs = 500;

  // ── CONNECTION ──────────────────────────────────────────────

  private ensureConnected(): void {
    if (!socketManager.connected) {
      socketManager.connect();
    }
  }

  // ── ROOM CREATION & JOINING ─────────────────────────────────

  async createRoom(hostName: string, maxPlayers = 8): Promise<{ roomCode: string }> {
    this.ensureConnected();
    this.localId = this.generateLocalId();
    this.localName = hostName;

    console.log('[RoomManager] Creating room as:', hostName);
    const res = await socketManager.createRoom(this.localId, hostName, maxPlayers);

    this.roomId   = res.roomId;
    this.roomCode = res.roomCode;
    this.isHostFlag = true;
    this.currentRoom = res.room;

    console.log('[RoomManager] Room created:', this.roomCode);
    return { roomCode: res.roomCode };
  }

  async joinRoom(roomCode: string, playerName: string): Promise<{ roomCode: string }> {
    this.ensureConnected();
    this.localId   = this.generateLocalId();
    this.localName = playerName;

    console.log('[RoomManager] Joining room:', roomCode);
    const res = await socketManager.joinRoom(roomCode.toUpperCase(), this.localId, playerName);

    this.roomId   = res.roomId;
    this.roomCode = res.roomCode;
    this.isHostFlag = false;
    this.currentRoom = res.room;

    console.log('[RoomManager] Joined room:', this.roomCode);
    return { roomCode: res.roomCode };
  }

  // ── LOBBY ───────────────────────────────────────────────────

  subscribeLobby(
    onLobbyUpdate: LobbyUpdateCallback,
    onMatchStart: MatchStartCallback,
  ): void {
    console.log('[RoomManager] Subscribing to lobby');

    socketManager.setLobbyUpdateCallback((room: SocketRoom) => {
      this.currentRoom = room;
      onLobbyUpdate(this.toLobbyPlayers(room.players));
    });

    socketManager.setMatchStartedCallback(() => {
      console.log('[RoomManager] Match started!');
      onMatchStart();
    });
  }

  async toggleReady(): Promise<boolean> {
    console.log('[RoomManager] Toggling ready');
    const { isReady } = await socketManager.toggleReady();
    return isReady;
  }

  async startMatch(): Promise<void> {
    console.log('[RoomManager] Starting match');
    await socketManager.startMatch();
  }

  // ── DIFFICULTY ──────────────────────────────────────────────

  async setDifficulty(difficulty: string): Promise<void> {
    console.log('[RoomManager] Setting difficulty:', difficulty);
    await socketManager.setDifficulty(difficulty);
  }

  getDifficulty(): string | null {
    return this.currentRoom?.difficulty ?? null;
  }

  subscribeToDifficulty(cb: (difficulty: string) => void): void {
    socketManager.setDifficultyCallback(cb);
  }

  // ── SCORE SYNC ──────────────────────────────────────────────

  subscribeScoreUpdates(
    onScoreUpdate: ScoreUpdateCallback,
    onPlayerLeft: PlayerLeftCallback,
    onGameResults?: GameResultsCallback,
  ): void {
    socketManager.setScoreUpdateCallback(onScoreUpdate);
    socketManager.setPlayerLeftCallback(onPlayerLeft);
    if (onGameResults) {
      socketManager.setGameResultsCallback(onGameResults);
    }
  }

  emitScore(score: number): void {
    const now = Date.now();
    if (now - this.lastScoreEmitMs < this.scoreEmitThrottleMs) return;
    this.lastScoreEmitMs = now;
    socketManager.emitScore(score);
  }

  finishGame(finalScore: number): void {
    socketManager.emitGameOver(finalScore);
  }

  // ── LEAVE ───────────────────────────────────────────────────

  leaveRoom(): void {
    socketManager.leaveRoom();
    this.cleanup();
  }

  // ── HELPERS ─────────────────────────────────────────────────

  toLobbyPlayers(socketPlayers: SocketPlayer[]): LobbyPlayer[] {
    return socketPlayers
      .filter(p => p.status !== 'left')
      .map(p => ({
        userId: p.playerId,
        userName: p.name,
        isReady: p.isReady || p.isHost,
        isHost: p.isHost,
      }));
  }

  private generateLocalId(): string {
    return 'p_' + crypto.randomUUID().slice(0, 12);
  }

  cleanup(): void {
    socketManager.clearCallbacks();
    this.roomId   = null;
    this.roomCode = null;
    this.isHostFlag = false;
    this.currentRoom = null;
    this.lastScoreEmitMs = 0;
  }

  // ── GETTERS ─────────────────────────────────────────────────

  getRoomId(): string | null    { return this.roomId; }
  getRoomCode(): string | null  { return this.roomCode; }
  getLocalId(): string | null   { return this.localId; }
  getLocalName(): string | null { return this.localName; }
  isHost(): boolean             { return this.isHostFlag; }
  getCurrentRoom(): SocketRoom | null { return this.currentRoom; }

  /** @deprecated kept for callers that use getLocalId() interchangeably */
  getPlayerId(): string | null { return this.localId; }
}

