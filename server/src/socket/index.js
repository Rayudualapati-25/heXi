const socketIO = require('socket.io');
const roomManager = require('../RoomManager');

function setupSocketServer(server) {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Create room
    socket.on('createRoom', ({ userId, userName }) => {
      try {
        const roomCode = roomManager.createRoom();
        const { players } = roomManager.joinRoom(roomCode, socket.id, userId, userName);
        
        socket.join(roomCode);
        socket.emit('roomCreated', { roomCode, players });
        
        console.log(`🎮 ${userName} created room ${roomCode}`);
      } catch (err) {
        console.error('Error creating room:', err.message);
        socket.emit('error', { message: err.message });
      }
    });

    // Join room
    socket.on('joinRoom', ({ roomCode, userId, userName }) => {
      try {
        const { room, players } = roomManager.joinRoom(roomCode, socket.id, userId, userName);
        
        socket.join(roomCode);
        
        // Tell the joiner they joined successfully
        socket.emit('roomJoined', { 
          roomCode, 
          players,
          isHost: players[players.length - 1].isHost
        });
        
        // Tell everyone else in the room
        socket.to(roomCode).emit('playerJoined', { 
          userName,
          players 
        });
        
        console.log(`🚪 ${userName} joined room ${roomCode}`);
      } catch (err) {
        console.error('Error joining room:', err.message);
        socket.emit('error', { message: err.message });
      }
    });

    // Start game (host only)
    socket.on('startGame', () => {
      const room = roomManager.getRoom(socket.id);
      
      if (!room) {
        socket.emit('error', { message: 'You are not in a room' });
        return;
      }

      if (room.hostSocketId !== socket.id) {
        socket.emit('error', { message: 'Only the host can start the game' });
        return;
      }

      if (room.players.length < 2) {
        socket.emit('error', { message: 'Need at least 2 players to start' });
        return;
      }

      // Start game countdown
      io.to(room.roomCode).emit('gameStarting', { countdown: 3 });
      
      setTimeout(() => {
        const gameData = room.startGame();
        io.to(room.roomCode).emit('gameStarted', gameData);
        console.log(`🎯 Game started in room ${room.roomCode}`);
      }, 3000);
    });

    // Game state update
    socket.on('gameState', (state) => {
      const room = roomManager.getRoom(socket.id);
      if (!room || room.status !== 'playing') return;

      const player = room.updatePlayerState(socket.id, state);
      if (!player) return;

      // Generate live leaderboard
      const leaderboard = room.players
        .filter(p => p.isAlive)
        .sort((a, b) => b.score - a.score)
        .map((p, index) => ({
          rank: index + 1,
          name: p.name,
          score: p.score,
          lives: p.lives,
          isYou: p.socketId === socket.id
        }));

      // Broadcast to everyone in room
      io.to(room.roomCode).emit('leaderboardUpdate', leaderboard);

      // Check if player just got eliminated
      if (!player.isAlive && state.wasAlive) {
        io.to(room.roomCode).emit('playerEliminated', {
          name: player.name,
          score: player.score
        });

        // Check if game should end
        const alivePlayers = room.players.filter(p => p.isAlive);
        if (alivePlayers.length <= 1) {
          const finalRankings = room.players
            .sort((a, b) => b.score - a.score)
            .map((p, i) => ({
              rank: i + 1,
              name: p.name,
              userId: p.userId,
              score: p.score,
              isAlive: p.isAlive
            }));
          
          room.status = 'finished';
          io.to(room.roomCode).emit('gameEnded', { rankings: finalRankings });
          
          console.log(`🏁 Game ended in room ${room.roomCode}`);
        }
      }
    });

    // Leave room
    socket.on('leaveRoom', () => {
      const result = roomManager.leaveRoom(socket.id);
      
      if (result) {
        socket.leave(result.room.roomCode);
        
        if (result.removedPlayer) {
          socket.to(result.room.roomCode).emit('playerLeft', {
            name: result.removedPlayer.name,
            players: result.room.players
          });
        }
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
      
      const result = roomManager.leaveRoom(socket.id);
      
      if (result && result.removedPlayer) {
        io.to(result.room.roomCode).emit('playerLeft', {
          name: result.removedPlayer.name,
          players: result.room.players
        });
      }
    });

    // Get server stats (for monitoring)
    socket.on('getStats', () => {
      const stats = roomManager.getStats();
      socket.emit('stats', stats);
    });
  });

  // Log server stats every 5 minutes
  setInterval(() => {
    const stats = roomManager.getStats();
    console.log(`📊 Stats: ${stats.totalRooms} rooms, ${stats.activeGames} active games, ${stats.totalPlayers} players`);
  }, 5 * 60 * 1000);

  return io;
}

module.exports = setupSocketServer;
