const GameRoom = require('./GameRoom');

class RoomManager {
  constructor() {
    this.rooms = new Map();  // roomCode → GameRoom
    this.socketToRoom = new Map();  // socketId → roomCode
    
    // Clean up old rooms every 10 minutes
    setInterval(() => this.cleanupRooms(), 10 * 60 * 1000);
  }

  createRoom() {
    const roomCode = this.generateRoomCode();
    const room = new GameRoom(roomCode);
    this.rooms.set(roomCode, room);
    
    console.log(`✅ Room created: ${roomCode}`);
    return roomCode;
  }

  joinRoom(roomCode, socketId, userId, playerName) {
    const normalizedCode = roomCode.toUpperCase();
    const room = this.rooms.get(normalizedCode);
    
    if (!room) {
      throw new Error('Room not found. Check the code and try again.');
    }

    const players = room.addPlayer(socketId, userId, playerName);
    this.socketToRoom.set(socketId, normalizedCode);
    
    console.log(`👤 ${playerName} joined room ${normalizedCode} (${players.length}/${room.maxPlayers})`);
    
    return { room, players };
  }

  leaveRoom(socketId) {
    const roomCode = this.socketToRoom.get(socketId);
    if (!roomCode) return null;

    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const removedPlayer = room.removePlayer(socketId);
    this.socketToRoom.delete(socketId);

    console.log(`👋 ${removedPlayer?.name || 'Player'} left room ${roomCode}`);

    // Delete room if empty
    if (room.isEmpty()) {
      this.rooms.delete(roomCode);
      console.log(`🗑️  Room deleted: ${roomCode}`);
    }

    return { room, removedPlayer };
  }

  getRoom(socketId) {
    const roomCode = this.socketToRoom.get(socketId);
    return roomCode ? this.rooms.get(roomCode) : null;
  }

  getRoomByCode(roomCode) {
    return this.rooms.get(roomCode.toUpperCase());
  }

  generateRoomCode() {
    let code;
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
      // Generate 6-character alphanumeric code
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      attempts++;
      
      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique room code');
      }
    } while (this.rooms.has(code));
    
    return code;
  }

  cleanupRooms() {
    let cleaned = 0;
    
    for (const [code, room] of this.rooms) {
      if (room.isEmpty() || room.isExpired()) {
        this.rooms.delete(code);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} room(s)`);
    }
  }

  getStats() {
    return {
      totalRooms: this.rooms.size,
      activeGames: Array.from(this.rooms.values()).filter(r => r.status === 'playing').length,
      totalPlayers: Array.from(this.rooms.values()).reduce((sum, room) => sum + room.players.length, 0)
    };
  }
}

module.exports = new RoomManager();
