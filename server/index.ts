/**
 * heXi Multiplayer Socket.io Server
 *
 * Handles all real-time multiplayer events:
 * - Room creation / joining
 * - Lobby ready state
 * - Match start + difficulty sync
 * - Live score broadcasts during gameplay
 * - Disconnect / leave detection
 */

import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface ServerPlayer {
  socketId: string;
  playerId: string;   // generated uuid on client
  name: string;
  isHost: boolean;
  isReady: boolean;
  score: number;
  status: 'waiting' | 'ready' | 'playing' | 'finished' | 'left';
}

interface ServerRoom {
  roomId: string;
  roomCode: string;
  hostId: string;
  status: 'waiting' | 'playing' | 'finished';
  difficulty: string | null;
  players: Map<string, ServerPlayer>; // keyed by playerId
  maxPlayers: number;
  createdAt: number;
}

// ─── IN-MEMORY STORE ─────────────────────────────────────────────────────────

const rooms = new Map<string, ServerRoom>();         // roomId → room
const codeToRoomId = new Map<string, string>();      // roomCode → roomId
const socketToPlayer = new Map<string, { roomId: string; playerId: string }>(); // socketId → {roomId, playerId}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  // Ensure unique
  if (codeToRoomId.has(code)) return generateRoomCode();
  return code;
}

function generateRoomId(): string {
  return 'room_' + Math.random().toString(36).slice(2, 14);
}

function roomToPayload(room: ServerRoom): object {
  return {
    roomId: room.roomId,
    roomCode: room.roomCode,
    hostId: room.hostId,
    status: room.status,
    difficulty: room.difficulty,
    players: Array.from(room.players.values()).map(playerToPayload),
    maxPlayers: room.maxPlayers,
  };
}

function playerToPayload(p: ServerPlayer): object {
  return {
    playerId: p.playerId,
    name: p.name,
    isHost: p.isHost,
    isReady: p.isReady,
    score: p.score,
    status: p.status,
  };
}

function broadcastLobbyUpdate(io: Server, room: ServerRoom): void {
  const payload = roomToPayload(room);
  io.to(room.roomId).emit('lobby:update', payload);
}

// Clean up stale rooms (older than 2 hours and status finished/waiting with 0 players)
function cleanStaleRooms(): void {
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  for (const [roomId, room] of rooms) {
    const allLeft = Array.from(room.players.values()).every(p => p.status === 'left');
    if (allLeft || room.createdAt < twoHoursAgo) {
      codeToRoomId.delete(room.roomCode);
      rooms.delete(roomId);
      console.log(`[Server] Cleaned up stale room: ${room.roomCode}`);
    }
  }
}

// ─── SERVER SETUP ─────────────────────────────────────────────────────────────

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    rooms: rooms.size,
    players: socketToPlayer.size,
    uptime: process.uptime(),
  });
});

// Room info endpoint (debug)
app.get('/rooms', (_req, res) => {
  const list = Array.from(rooms.values()).map(r => ({
    roomCode: r.roomCode,
    status: r.status,
    players: Array.from(r.players.values()).map(p => p.name),
    difficulty: r.difficulty,
  }));
  res.json(list);
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 20000,
  pingInterval: 10000,
});

// ─── SOCKET EVENTS ────────────────────────────────────────────────────────────

io.on('connection', (socket: Socket) => {
  console.log(`[Server] Client connected: ${socket.id}`);

  // ── CREATE ROOM ────────────────────────────────────────────────
  socket.on('room:create', ({ playerId, name, maxPlayers = 8 }, callback) => {
    try {
      const roomCode = generateRoomCode();
      const roomId = generateRoomId();

      const hostPlayer: ServerPlayer = {
        socketId: socket.id,
        playerId,
        name,
        isHost: true,
        isReady: true, // host is always ready
        score: 0,
        status: 'waiting',
      };

      const room: ServerRoom = {
        roomId,
        roomCode,
        hostId: playerId,
        status: 'waiting',
        difficulty: null,
        players: new Map([[playerId, hostPlayer]]),
        maxPlayers,
        createdAt: Date.now(),
      };

      rooms.set(roomId, room);
      codeToRoomId.set(roomCode, roomId);
      socketToPlayer.set(socket.id, { roomId, playerId });

      socket.join(roomId);

      console.log(`[Server] Room created: ${roomCode} by ${name}`);
      callback({ ok: true, roomId, roomCode, room: roomToPayload(room) });
    } catch (err: any) {
      console.error('[Server] Error creating room:', err);
      callback({ ok: false, error: err.message });
    }
  });

  // ── JOIN ROOM ──────────────────────────────────────────────────
  socket.on('room:join', ({ roomCode, playerId, name }, callback) => {
    try {
      const code = roomCode.toUpperCase();
      const roomId = codeToRoomId.get(code);

      if (!roomId) {
        return callback({ ok: false, error: 'Room not found. Check the code and try again.' });
      }

      const room = rooms.get(roomId);
      if (!room) {
        return callback({ ok: false, error: 'Room not found.' });
      }

      if (room.status !== 'waiting') {
        return callback({ ok: false, error: 'Game already started. You cannot join now.' });
      }

      if (room.players.size >= room.maxPlayers) {
        return callback({ ok: false, error: 'Room is full.' });
      }

      // Check if playerId is already in room (reconnect case)
      if (room.players.has(playerId)) {
        const existing = room.players.get(playerId)!;
        existing.socketId = socket.id;
        existing.status = 'waiting';
        socketToPlayer.set(socket.id, { roomId, playerId });
        socket.join(roomId);
        broadcastLobbyUpdate(io, room);
        return callback({ ok: true, roomId, roomCode: code, room: roomToPayload(room) });
      }

      const player: ServerPlayer = {
        socketId: socket.id,
        playerId,
        name,
        isHost: false,
        isReady: false,
        score: 0,
        status: 'waiting',
      };

      room.players.set(playerId, player);
      socketToPlayer.set(socket.id, { roomId, playerId });
      socket.join(roomId);

      console.log(`[Server] ${name} joined room: ${code}`);
      broadcastLobbyUpdate(io, room);
      callback({ ok: true, roomId, roomCode: code, room: roomToPayload(room) });
    } catch (err: any) {
      console.error('[Server] Error joining room:', err);
      callback({ ok: false, error: err.message });
    }
  });

  // ── TOGGLE READY ───────────────────────────────────────────────
  socket.on('player:ready', ({}, callback) => {
    try {
      const ctx = socketToPlayer.get(socket.id);
      if (!ctx) return callback?.({ ok: false, error: 'Not in a room' });

      const room = rooms.get(ctx.roomId);
      if (!room) return callback?.({ ok: false, error: 'Room not found' });

      const player = room.players.get(ctx.playerId);
      if (!player) return callback?.({ ok: false, error: 'Player not found' });

      player.isReady = !player.isReady;
      player.status = player.isReady ? 'ready' : 'waiting';

      console.log(`[Server] ${player.name} is ${player.isReady ? 'READY' : 'NOT READY'}`);
      broadcastLobbyUpdate(io, room);
      callback?.({ ok: true, isReady: player.isReady });
    } catch (err: any) {
      callback?.({ ok: false, error: err.message });
    }
  });

  // ── START MATCH ────────────────────────────────────────────────
  socket.on('room:start', ({}, callback) => {
    try {
      const ctx = socketToPlayer.get(socket.id);
      if (!ctx) return callback?.({ ok: false, error: 'Not in a room' });

      const room = rooms.get(ctx.roomId);
      if (!room) return callback?.({ ok: false, error: 'Room not found' });

      const player = room.players.get(ctx.playerId);
      if (!player?.isHost) return callback?.({ ok: false, error: 'Only the host can start the match' });

      const allReady = Array.from(room.players.values()).every(p => p.isHost || p.isReady);
      if (!allReady) return callback?.({ ok: false, error: 'Not all players are ready' });

      room.status = 'playing';
      for (const p of room.players.values()) {
        p.status = 'playing';
        p.score = 0;
      }

      console.log(`[Server] Match started in room: ${room.roomCode}`);
      io.to(room.roomId).emit('match:started', { roomId: room.roomId });
      callback?.({ ok: true });
    } catch (err: any) {
      callback?.({ ok: false, error: err.message });
    }
  });

  // ── SET DIFFICULTY (host selects, all players get notified) ────
  socket.on('room:difficulty', ({ difficulty }, callback) => {
    try {
      const ctx = socketToPlayer.get(socket.id);
      if (!ctx) return callback?.({ ok: false, error: 'Not in a room' });

      const room = rooms.get(ctx.roomId);
      if (!room) return callback?.({ ok: false, error: 'Room not found' });

      const player = room.players.get(ctx.playerId);
      if (!player?.isHost) return callback?.({ ok: false, error: 'Only the host can set difficulty' });

      room.difficulty = difficulty;

      console.log(`[Server] Difficulty set to ${difficulty} in room ${room.roomCode}`);
      // Broadcast to ALL players in room (including host themselves)
      io.to(room.roomId).emit('room:difficulty', { difficulty });
      callback?.({ ok: true });
    } catch (err: any) {
      callback?.({ ok: false, error: err.message });
    }
  });

  // ── SCORE UPDATE ───────────────────────────────────────────────
  socket.on('game:score', ({ score }) => {
    const ctx = socketToPlayer.get(socket.id);
    if (!ctx) return;

    const room = rooms.get(ctx.roomId);
    if (!room || room.status !== 'playing') return;

    const player = room.players.get(ctx.playerId);
    if (!player) return;

    player.score = score;

    // Broadcast updated scores to all OTHER players in room
    const scores = Array.from(room.players.values())
      .filter(p => p.status !== 'left')
      .map(p => ({ playerId: p.playerId, name: p.name, score: p.score }));

    socket.to(room.roomId).emit('game:scores', { scores });
  });

  // ── GAME OVER (player finished or died) ───────────────────────
  socket.on('game:over', ({ score }) => {
    const ctx = socketToPlayer.get(socket.id);
    if (!ctx) return;

    const room = rooms.get(ctx.roomId);
    if (!room) return;

    const player = room.players.get(ctx.playerId);
    if (!player) return;

    player.score = score;
    player.status = 'finished';

    console.log(`[Server] ${player.name} finished with score: ${score}`);

    // Notify others
    io.to(room.roomId).emit('game:player_finished', {
      playerId: player.playerId,
      name: player.name,
      score,
    });

    // Check if all players finished
    const activePlayers = Array.from(room.players.values()).filter(p => p.status !== 'left');
    const allDone = activePlayers.every(p => p.status === 'finished');

    if (allDone) {
      room.status = 'finished';
      const results = activePlayers
        .sort((a, b) => b.score - a.score)
        .map((p, i) => ({ rank: i + 1, playerId: p.playerId, name: p.name, score: p.score }));

      console.log(`[Server] All players finished in room: ${room.roomCode}`);
      io.to(room.roomId).emit('game:results', { results });
    }
  });

  // ── LEAVE ROOM ─────────────────────────────────────────────────
  socket.on('room:leave', ({}, callback) => {
    handleDisconnect(socket, 'leave');
    callback?.({ ok: true });
  });

  // ── FETCH ROOM STATE ───────────────────────────────────────────
  socket.on('room:state', ({}, callback) => {
    const ctx = socketToPlayer.get(socket.id);
    if (!ctx) return callback?.({ ok: false, error: 'Not in a room' });

    const room = rooms.get(ctx.roomId);
    if (!room) return callback?.({ ok: false, error: 'Room not found' });

    callback?.({ ok: true, room: roomToPayload(room) });
  });

  // ── DISCONNECT ─────────────────────────────────────────────────
  socket.on('disconnect', (reason) => {
    console.log(`[Server] Client disconnected: ${socket.id} (${reason})`);
    handleDisconnect(socket, 'disconnect');
  });
});

// ─── DISCONNECT HANDLER ───────────────────────────────────────────────────────

function handleDisconnect(socket: Socket, reason: string): void {
  const ctx = socketToPlayer.get(socket.id);
  if (!ctx) return;

  const { roomId, playerId } = ctx;
  const room = rooms.get(roomId);

  socketToPlayer.delete(socket.id);

  if (!room) return;

  const player = room.players.get(playerId);
  if (!player) return;

  player.status = 'left';
  console.log(`[Server] ${player.name} left room ${room.roomCode} (${reason})`);

  // If host left, assign new host
  if (player.isHost) {
    player.isHost = false;
    const nextPlayer = Array.from(room.players.values()).find(p => p.status !== 'left');
    if (nextPlayer) {
      nextPlayer.isHost = true;
      room.hostId = nextPlayer.playerId;
      console.log(`[Server] New host: ${nextPlayer.name}`);
    }
  }

  // Notify room of player leaving
  io.to(roomId).emit('player:left', { playerId, name: player.name });
  broadcastLobbyUpdate(io, room);
}

// ─── CLEANUP INTERVAL ────────────────────────────────────────────────────────

setInterval(cleanStaleRooms, 30 * 60 * 1000); // Every 30 minutes

// ─── START SERVER ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`\n🎮 heXi Multiplayer Server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Rooms:  http://localhost:${PORT}/rooms\n`);
});

export { io, app };
