class GameRoom {
  constructor(roomCode) {
    this.roomCode = roomCode;
    this.hostSocketId = null;
    this.players = [];
    this.maxPlayers = 8;
    this.status = 'waiting'; // waiting, locked, playing, finished
    this.createdAt = Date.now();
    this.gameStartedAt = null;
  }

  addPlayer(socketId, userId, userName) {
    if (this.status !== 'waiting') {
      throw new Error('Game already started. Cannot join.');
    }

    if (this.players.length >= this.maxPlayers) {
      throw new Error('Room is full');
    }

    // Check for duplicate names in room
    if (this.players.some(p => p.name === userName)) {
      throw new Error(`Name "${userName}" is already taken in this room`);
    }

    // First player becomes host
    if (this.players.length === 0) {
      this.hostSocketId = socketId;
    }

    this.players.push({
      socketId: socketId,
      userId: userId,
      name: userName,
      score: 0,
      lives: 3,
      isAlive: true,
      isHost: socketId === this.hostSocketId
    });

    return this.players;
  }

  removePlayer(socketId) {
    const index = this.players.findIndex(p => p.socketId === socketId);
    if (index === -1) return null;

    const removedPlayer = this.players[index];
    this.players.splice(index, 1);

    // If host left, assign new host to first player
    if (socketId === this.hostSocketId && this.players.length > 0) {
      this.hostSocketId = this.players[0].socketId;
      this.players[0].isHost = true;
    }

    return removedPlayer;
  }

  lockRoom() {
    this.status = 'locked';
  }

  startGame() {
    this.lockRoom();
    this.status = 'playing';
    this.gameStartedAt = Date.now();
    
    return {
      players: this.players.map(p => ({ 
        name: p.name, 
        isHost: p.isHost 
      }))
    };
  }

  updatePlayerState(socketId, state) {
    const player = this.players.find(p => p.socketId === socketId);
    if (!player) return null;

    // Basic validation - prevent impossible score jumps
    const maxScorePerSecond = 5000;
    const timeSinceStart = (Date.now() - this.gameStartedAt) / 1000;
    
    if (state.score > maxScorePerSecond * timeSinceStart * 1.5) {
      console.warn(`Suspicious score from ${player.name}: ${state.score}`);
      return null;
    }

    player.score = state.score;
    player.lives = state.lives;
    player.isAlive = state.isAlive;

    return player;
  }

  getPlayer(socketId) {
    return this.players.find(p => p.socketId === socketId);
  }

  isEmpty() {
    return this.players.length === 0;
  }

  isExpired() {
    // Clean up rooms older than 2 hours
    return Date.now() - this.createdAt > 2 * 60 * 60 * 1000;
  }
}

module.exports = GameRoom;
