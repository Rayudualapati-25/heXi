/**
 * SocketManager — singleton wrapper around socket.io-client
 *
 * Provides a typed, promise-based API for all multiplayer events.
 * The server URL is configured via VITE_SOCKET_URL env var (falls back to /socket.io proxy).
 */

import { io, Socket } from 'socket.io-client';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface SocketPlayer {
  playerId: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  score: number;
  status: 'waiting' | 'ready' | 'playing' | 'finished' | 'left';
}

export interface SocketRoom {
  roomId: string;
  roomCode: string;
  hostId: string;
  status: 'waiting' | 'playing' | 'finished';
  difficulty: string | null;
  players: SocketPlayer[];
  maxPlayers: number;
}

export interface ScoreEntry {
  playerId: string;
  name: string;
  score: number;
}

export interface GameResult {
  rank: number;
  playerId: string;
  name: string;
  score: number;
}

// ─── EVENT CALLBACKS ─────────────────────────────────────────────────────────

type LobbyUpdateCb     = (room: SocketRoom) => void;
type MatchStartedCb    = () => void;
type DifficultyCb      = (difficulty: string) => void;
type ScoreUpdateCb     = (scores: ScoreEntry[]) => void;
type PlayerLeftCb      = (data: { playerId: string; name: string }) => void;
type PlayerFinishedCb  = (data: { playerId: string; name: string; score: number }) => void;
type GameResultsCb     = (results: GameResult[]) => void;

// ─── SOCKET MANAGER ──────────────────────────────────────────────────────────

class SocketManager {
  private static instance: SocketManager;
  private socket: Socket | null = null;

  // Callbacks
  private onLobbyUpdate: LobbyUpdateCb | null = null;
  private onMatchStarted: MatchStartedCb | null = null;
  private onDifficulty: DifficultyCb | null = null;
  private onScoreUpdate: ScoreUpdateCb | null = null;
  private onPlayerLeft: PlayerLeftCb | null = null;
  private onPlayerFinished: PlayerFinishedCb | null = null;
  private onGameResults: GameResultsCb | null = null;

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  // ── CONNECTION ─────────────────────────────────────────────────

  connect(): Socket {
    if (this.socket?.connected) return this.socket;

    const url = (import.meta as any).env?.VITE_SOCKET_URL || '';
    console.log('[SocketManager] Connecting to:', url || 'same-origin (proxy)');

    this.socket = io(url, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('[SocketManager] Connected:', this.socket!.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[SocketManager] Disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[SocketManager] Connection error:', err.message);
    });

    this.registerServerEvents();
    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('[SocketManager] Manually disconnected');
    }
  }

  get connected(): boolean {
    return this.socket?.connected ?? false;
  }

  get socketId(): string | null {
    return this.socket?.id ?? null;
  }

  // ── REGISTER SERVER-PUSH EVENTS ───────────────────────────────

  private registerServerEvents(): void {
    if (!this.socket) return;

    this.socket.on('lobby:update', (room: SocketRoom) => {
      console.log('[SocketManager] lobby:update', room.players.length, 'players');
      this.onLobbyUpdate?.(room);
    });

    this.socket.on('match:started', () => {
      console.log('[SocketManager] match:started');
      this.onMatchStarted?.();
    });

    this.socket.on('room:difficulty', ({ difficulty }: { difficulty: string }) => {
      console.log('[SocketManager] room:difficulty', difficulty);
      this.onDifficulty?.(difficulty);
    });

    this.socket.on('game:scores', ({ scores }: { scores: ScoreEntry[] }) => {
      this.onScoreUpdate?.(scores);
    });

    this.socket.on('player:left', (data: { playerId: string; name: string }) => {
      console.log('[SocketManager] player:left', data.name);
      this.onPlayerLeft?.(data);
    });

    this.socket.on('game:player_finished', (data: { playerId: string; name: string; score: number }) => {
      console.log('[SocketManager] game:player_finished', data.name, data.score);
      this.onPlayerFinished?.(data);
    });

    this.socket.on('game:results', ({ results }: { results: GameResult[] }) => {
      console.log('[SocketManager] game:results');
      this.onGameResults?.(results);
    });
  }

  // ── CALLBACK SETTERS ──────────────────────────────────────────

  setLobbyUpdateCallback(cb: LobbyUpdateCb): void { this.onLobbyUpdate = cb; }
  setMatchStartedCallback(cb: MatchStartedCb): void { this.onMatchStarted = cb; }
  setDifficultyCallback(cb: DifficultyCb): void { this.onDifficulty = cb; }
  setScoreUpdateCallback(cb: ScoreUpdateCb): void { this.onScoreUpdate = cb; }
  setPlayerLeftCallback(cb: PlayerLeftCb): void { this.onPlayerLeft = cb; }
  setPlayerFinishedCallback(cb: PlayerFinishedCb): void { this.onPlayerFinished = cb; }
  setGameResultsCallback(cb: GameResultsCb): void { this.onGameResults = cb; }

  clearCallbacks(): void {
    this.onLobbyUpdate = null;
    this.onMatchStarted = null;
    this.onDifficulty = null;
    this.onScoreUpdate = null;
    this.onPlayerLeft = null;
    this.onPlayerFinished = null;
    this.onGameResults = null;
  }

  // ── EMIT ACTIONS (Promise-based) ──────────────────────────────

  createRoom(playerId: string, name: string, maxPlayers = 8): Promise<{ roomId: string; roomCode: string; room: SocketRoom }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error('Not connected'));
      this.socket.emit('room:create', { playerId, name, maxPlayers }, (res: any) => {
        if (res.ok) resolve({ roomId: res.roomId, roomCode: res.roomCode, room: res.room });
        else reject(new Error(res.error || 'Failed to create room'));
      });
    });
  }

  joinRoom(roomCode: string, playerId: string, name: string): Promise<{ roomId: string; roomCode: string; room: SocketRoom }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error('Not connected'));
      this.socket.emit('room:join', { roomCode, playerId, name }, (res: any) => {
        if (res.ok) resolve({ roomId: res.roomId, roomCode: res.roomCode, room: res.room });
        else reject(new Error(res.error || 'Failed to join room'));
      });
    });
  }

  toggleReady(): Promise<{ isReady: boolean }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error('Not connected'));
      this.socket.emit('player:ready', {}, (res: any) => {
        if (res.ok) resolve({ isReady: res.isReady });
        else reject(new Error(res.error || 'Failed to toggle ready'));
      });
    });
  }

  startMatch(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error('Not connected'));
      this.socket.emit('room:start', {}, (res: any) => {
        if (res.ok) resolve();
        else reject(new Error(res.error || 'Failed to start match'));
      });
    });
  }

  setDifficulty(difficulty: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error('Not connected'));
      this.socket.emit('room:difficulty', { difficulty }, (res: any) => {
        if (res?.ok) resolve();
        else reject(new Error(res?.error || 'Failed to set difficulty'));
      });
    });
  }

  emitScore(score: number): void {
    if (!this.socket?.connected) return;
    this.socket.emit('game:score', { score });
  }

  emitGameOver(score: number): void {
    if (!this.socket?.connected) return;
    this.socket.emit('game:over', { score });
  }

  leaveRoom(): void {
    if (!this.socket?.connected) return;
    this.socket.emit('room:leave', {}, () => {});
  }

  getRoomState(): Promise<SocketRoom> {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error('Not connected'));
      this.socket.emit('room:state', {}, (res: any) => {
        if (res.ok) resolve(res.room);
        else reject(new Error(res.error || 'Failed to get room state'));
      });
    });
  }
}

export const socketManager = SocketManager.getInstance();
