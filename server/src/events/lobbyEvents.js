import { roomManager } from '../game/RoomManager.js';
import { generateRoomCode } from '../utils/roomCode.js';

export function registerLobbyEvents(io, socket) {

  socket.on('lobby:create', ({ playerName }, callback) => {
    const roomId = generateRoomCode();
    const game = roomManager.createRoom(roomId, socket.id);
    game.addPlayer(socket.id, playerName);
    socket.join(roomId);
    callback({ success: true, roomId, game: game.toJSON() });
  });

  socket.on('lobby:join', ({ roomId, playerName }, callback) => {
    const game = roomManager.getRoom(roomId);
    if (!game) return callback({ success: false, error: 'Room not found' });
    if (game.phase !== 'waiting') return callback({ success: false, error: 'Game already in progress' });
    if (game.playerCount >= 6) return callback({ success: false, error: 'Room is full' });

    game.addPlayer(socket.id, playerName);
    socket.join(roomId);

    io.to(roomId).emit('lobby:updated', game.toJSON());
    callback({ success: true, roomId, game: game.toJSON() });
  });

  socket.on('lobby:leave', ({ roomId }) => {
    const game = roomManager.getRoom(roomId);
    if (!game) return;

    game.removePlayer(socket.id);
    socket.leave(roomId);

    if (game.playerCount === 0) {
      roomManager.deleteRoom(roomId);
    } else {
      if (game.hostId === socket.id) {
        const remaining = game.getAllPlayers();
        game.hostId = remaining[0].id;
      }
      io.to(roomId).emit('lobby:updated', game.toJSON());
    }
  });

  socket.on('lobby:setAge', ({ roomId, age }, callback) => {
    const game = roomManager.getRoom(roomId);
    if (!game) return callback({ success: false, error: 'Room not found' });

    game.setPlayerAge(socket.id, age);
    io.to(roomId).emit('lobby:updated', game.toJSON());
    callback({ success: true });
  });

  socket.on('lobby:submitFear', ({ roomId, fear }, callback) => {
    const game = roomManager.getRoom(roomId);
    if (!game) return callback({ success: false, error: 'Room not found' });

    game.submitFear(socket.id, fear);
    callback({ success: true });

    const allSubmitted = game.getAllPlayers().every((p) =>
      game.nightmareCards.some((nc) => nc.playerId === p.id)
    );
    if (allSubmitted) {
      io.to(roomId).emit('lobby:allFearsSubmitted');
    }
  });

  socket.on('lobby:startGame', ({ roomId }, callback) => {
    const game = roomManager.getRoom(roomId);
    if (!game) return callback({ success: false, error: 'Room not found' });
    if (socket.id !== game.hostId) return callback({ success: false, error: 'Only the host can start' });
    if (game.playerCount < 3) return callback({ success: false, error: 'Need at least 3 players' });

    const allSubmitted = game.getAllPlayers().every((p) =>
      game.nightmareCards.some((nc) => nc.playerId === p.id)
    );
    if (!allSubmitted) return callback({ success: false, error: 'All players must submit their greatest fear' });

    const allAges = game.getAllPlayers().every((p) => p.age !== null);
    if (!allAges) return callback({ success: false, error: 'All players must enter their age' });

    game.assignCharacters();
    game.startGame();

    for (const player of game.getAllPlayers()) {
      io.to(player.id).emit('game:started', {
        game: game.toJSON(),
        hand: game.getPlayerHand(player.id),
      });
    }

    callback({ success: true });
  });

  socket.on('lobby:startTestMode', ({ roomId }, callback) => {
    const game = roomManager.getRoom(roomId);
    if (!game) return callback({ success: false, error: 'Room not found' });
    if (socket.id !== game.hostId) return callback({ success: false, error: 'Only the host can start' });

    // Fill in missing age/fear for all players so startGame() doesn't choke
    for (const player of game.getAllPlayers()) {
      if (player.age === null) game.setPlayerAge(player.id, 25);
      if (!game.nightmareCards.some((nc) => nc.playerId === player.id)) {
        game.submitFear(player.id, 'the unknown');
      }
    }

    game.assignCharacters();
    game.startGame();

    for (const player of game.getAllPlayers()) {
      io.to(player.id).emit('game:started', {
        game: game.toJSON(),
        hand: game.getPlayerHand(player.id),
      });
    }

    callback({ success: true });
  });
}
