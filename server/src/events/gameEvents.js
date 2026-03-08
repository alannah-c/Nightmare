import { roomManager } from '../game/RoomManager.js';
import { OUTER_RING } from '../game/board.js';

function getGame(roomId) {
  const game = roomManager.getRoom(roomId);
  if (!game || (game.phase !== 'playing' && game.phase !== 'gatekeeper_active')) return null;
  return game;
}

function broadcastState(io, game) {
  for (const player of game.getAllPlayers()) {
    io.to(player.id).emit('game:stateUpdated', {
      game: game.toJSON(),
      hand: game.getPlayerHand(player.id),
    });
  }
}

export function registerGameEvents(io, socket) {

  // ─── Dice & Movement ────────────────────────────────────────

  socket.on('game:rollDice', ({ roomId }, callback) => {
    const game = getGame(roomId);
    if (!game) return callback?.({ success: false, error: 'No active game' });
    if (game.phase === 'gatekeeper_active') return callback?.({ success: false, error: 'The Gatekeeper is speaking!' });
    if (game.getCurrentTurnPlayerId() !== socket.id) return callback?.({ success: false, error: 'Not your turn' });

    const roll = game.rollDice();
    const player = game.getPlayer(socket.id);
    game.addEvent('action', `${player.name} rolled a ${roll}.`);

    io.to(roomId).emit('game:diceRolled', { playerId: socket.id, roll });
    callback?.({ success: true, roll });
  });

  socket.on('game:movePiece', ({ roomId, steps }, callback) => {
    const game = getGame(roomId);
    if (!game) return callback?.({ success: false });

    const result = game.movePlayer(socket.id, steps);
    if (!result) return callback?.({ success: false });

    const player = game.getPlayer(socket.id);

    // Handle landing effects on outer ring
    if (result.square) {
      const sq = result.square;

      if (sq.type === 'time' || sq.type === 'fate' || sq.type === 'chance') {
        // Auto-draw from the matching deck
        const drawResult = game.drawCard(socket.id, sq.type);
        io.to(roomId).emit('game:cardDrawn', {
          playerId: socket.id,
          deckType: sq.type,
          result: drawResult,
        });
        // Send private hand update
        io.to(socket.id).emit('game:handUpdated', game.getPlayerHand(socket.id));
      }

      if (sq.type === 'black_hole') {
        game.banishToBlackHole(socket.id);
      }

      // Landing on an opponent's named gravestone
      if (sq.type === 'gravestone' && sq.character) {
        const owner = game.getAllPlayers().find(
          (p) => p.character && p.character.id === sq.character && p.id !== socket.id
        );
        if (owner) {
          io.to(owner.id).emit('game:opponentOnGravestone', {
            landingPlayerId: socket.id,
            gravestoneOwner: owner.id,
          });
        }
      }
    }

    game.addEvent('action', `${player.name} moved ${steps} spaces.`);
    broadcastState(io, game);
    callback?.({ success: true, result });
  });

  socket.on('game:enterInnerPath', ({ roomId }, callback) => {
    const game = getGame(roomId);
    if (!game) return callback?.({ success: false });

    const entered = game.enterInnerPath(socket.id);
    if (!entered) return callback?.({ success: false, error: 'Cannot enter inner path (need all 6 keys and be at an entry point)' });

    const player = game.getPlayer(socket.id);
    game.addEvent('action', `${player.name} enters the inner path toward NIGHTMARE!`);
    broadcastState(io, game);
    callback?.({ success: true });
  });

  // ─── End Turn ────────────────────────────────────────────────

  socket.on('game:endTurn', ({ roomId }) => {
    const game = getGame(roomId);
    if (!game) return;
    if (game.getCurrentTurnPlayerId() !== socket.id) return;

    game.advanceTurn();
    game.addEvent('action', `It is now ${game.getPlayer(game.getCurrentTurnPlayerId())?.name}'s turn.`);

    broadcastState(io, game);
  });

  // ─── Cards ───────────────────────────────────────────────────

  socket.on('game:drawCard', ({ roomId, deckType }, callback) => {
    const game = getGame(roomId);
    if (!game) return callback?.({ success: false });

    const result = game.drawCard(socket.id, deckType);
    if (!result) return callback?.({ success: false, error: 'Could not draw card' });

    io.to(roomId).emit('game:cardDrawn', {
      playerId: socket.id,
      deckType,
      expired: result.expired || false,
      noMatch: result.noMatch || false,
      keyHalfMatched: result.keyHalfMatched || false,
    });

    io.to(socket.id).emit('game:handUpdated', game.getPlayerHand(socket.id));
    broadcastState(io, game);
    callback?.({ success: true, result });
  });

  socket.on('game:playCard', ({ roomId, cardId, targetPlayerId }, callback) => {
    const game = getGame(roomId);
    if (!game) return callback?.({ success: false });

    const card = game.playCard(socket.id, cardId);
    if (!card) return callback?.({ success: false, error: 'Card not found in hand' });

    const player = game.getPlayer(socket.id);
    game.addEvent('action', `${player.name} played a ${card.type} card.`);

    // Return to back of pack if applicable
    if (card.returnsToBack) {
      game.returnCardToDeck(card);
    }

    io.to(roomId).emit('game:cardPlayed', {
      playerId: socket.id,
      card,
      targetPlayerId,
    });

    io.to(socket.id).emit('game:handUpdated', game.getPlayerHand(socket.id));
    broadcastState(io, game);
    callback?.({ success: true, card });
  });

  socket.on('game:transferCards', ({ roomId, fromId, toId, cardType }, callback) => {
    const game = getGame(roomId);
    if (!game) return callback?.({ success: false });

    const transferred = game.transferCards(fromId, toId, cardType);
    game.addEvent('action', `${transferred.length} ${cardType} card(s) transferred.`);

    io.to(fromId).emit('game:handUpdated', game.getPlayerHand(fromId));
    io.to(toId).emit('game:handUpdated', game.getPlayerHand(toId));
    broadcastState(io, game);
    callback?.({ success: true, count: transferred.length });
  });

  // ─── Keys ────────────────────────────────────────────────────

  socket.on('game:giveKey', ({ roomId, playerId, count }, callback) => {
    const game = getGame(roomId);
    if (!game) return callback?.({ success: false });

    const given = game.giveKey(playerId, count || 1);
    const player = game.getPlayer(playerId);
    game.addEvent('action', `${player.name} received ${given} key(s). (${player.keys.size}/6)`);

    broadcastState(io, game);
    callback?.({ success: true, given });
  });

  socket.on('game:removeKey', ({ roomId, playerId, count }, callback) => {
    const game = getGame(roomId);
    if (!game) return callback?.({ success: false });

    const removed = game.removeKey(playerId, count || 1);
    const player = game.getPlayer(playerId);
    game.addEvent('action', `${player.name} lost ${removed} key(s). (${player.keys.size}/6)`);

    broadcastState(io, game);
    callback?.({ success: true, removed });
  });

  // ─── Coin Flip ───────────────────────────────────────────────

  socket.on('game:flipCoin', ({ roomId }, callback) => {
    const game = getGame(roomId);
    if (!game) return callback?.({ success: false });

    const result = game.flipCoin();
    game.addEvent('action', `Coin flip: ${result.toUpperCase()}!`);

    io.to(roomId).emit('game:coinFlipped', { playerId: socket.id, result });
    callback?.({ success: true, result });
  });

  // ─── Black Hole ──────────────────────────────────────────────

  socket.on('game:banishPlayer', ({ roomId, playerId }, callback) => {
    const game = getGame(roomId);
    if (!game) return callback?.({ success: false });

    game.banishToBlackHole(playerId);
    broadcastState(io, game);
    callback?.({ success: true });
  });

  socket.on('game:releasePlayer', ({ roomId, playerId }, callback) => {
    const game = getGame(roomId);
    if (!game) return callback?.({ success: false });

    game.releaseFromBlackHole(playerId);
    broadcastState(io, game);
    callback?.({ success: true });
  });

  socket.on('game:releaseAllFromBlackHole', ({ roomId }, callback) => {
    const game = getGame(roomId);
    if (!game) return callback?.({ success: false });

    game.releaseAllFromBlackHole();
    broadcastState(io, game);
    callback?.({ success: true });
  });

  // ─── Return to Gravestone ────────────────────────────────────

  socket.on('game:returnToGravestone', ({ roomId, playerId }, callback) => {
    const game = getGame(roomId);
    if (!game) return callback?.({ success: false });

    game.returnToGravestone(playerId);
    const player = game.getPlayer(playerId);
    game.addEvent('action', `${player.name} was sent back to their gravestone.`);

    broadcastState(io, game);
    callback?.({ success: true });
  });

  // ─── SCREAM Mechanic ────────────────────────────────────────

  socket.on('game:initiateScream', ({ roomId, targetPlayerId }, callback) => {
    const game = getGame(roomId);
    if (!game) return callback?.({ success: false });

    const scream = game.initiateScream(socket.id, targetPlayerId);
    const player = game.getPlayer(socket.id);
    game.addEvent('action', `${player.name} SCREAMS! Vote now — are you scared?`);

    io.to(roomId).emit('game:screamInitiated', {
      initiatorId: socket.id,
      targetId: targetPlayerId,
      durationMs: scream.durationMs,
    });
    callback?.({ success: true });

    // Auto-resolve after timeout
    setTimeout(() => {
      if (game.screamVote) {
        const result = game.resolveScream();
        io.to(roomId).emit('game:screamResolved', result);
        broadcastState(io, game);
      }
    }, scream.durationMs);
  });

  socket.on('game:screamVote', ({ roomId, isScared }, callback) => {
    const game = getGame(roomId);
    if (!game) return callback?.({ success: false });

    game.submitScreamVote(socket.id, isScared);
    callback?.({ success: true });

    // Check if all eligible voters have voted
    const eligibleVoters = game.getActivePlayers().filter(
      (p) => p.id !== game.screamVote?.initiatorId && !p.isEliminated
    );
    if (game.screamVote && game.screamVote.votes.size >= eligibleVoters.length) {
      const result = game.resolveScream();
      io.to(roomId).emit('game:screamResolved', result);
      broadcastState(io, game);
    }
  });

  // ─── NIGHTMARE Attempt ──────────────────────────────────────

  socket.on('game:attemptNightmare', ({ roomId }, callback) => {
    const game = getGame(roomId);
    if (!game) return callback?.({ success: false });
    if (game.getCurrentTurnPlayerId() !== socket.id) {
      return callback?.({ success: false, error: 'Not your turn' });
    }

    game.phase = 'nightmare_attempt';
    const result = game.attemptNightmare(socket.id);

    if (result.error) {
      game.phase = 'playing';
      return callback?.({ success: false, error: result.error });
    }

    io.to(roomId).emit('game:nightmareAttempt', {
      playerId: socket.id,
      ...result,
    });

    if (!result.winner) {
      game.phase = 'playing';
    }

    broadcastState(io, game);
    callback?.({ success: true, ...result });
  });

  // ─── Video Sync ──────────────────────────────────────────────

  socket.on('game:videoTimestamp', ({ roomId, timestamp }) => {
    const game = roomManager.getRoom(roomId);
    if (!game) return;
    if (socket.id !== game.hostId) return; // only host syncs

    game.updateVideoTimestamp(timestamp);

    // Broadcast to all other clients
    socket.to(roomId).emit('game:videoSync', { timestamp });

    // Check if game over due to time
    if (game.phase === 'game_over') {
      io.to(roomId).emit('game:gatekeeperWins', { message: 'Time has expired! The Gatekeeper WINS!' });
    }
  });

  socket.on('game:videoResync', ({ roomId }, callback) => {
    const game = roomManager.getRoom(roomId);
    if (!game) return callback?.({ success: false });

    callback?.({ success: true, timestamp: game.videoTimestamp });
  });

  // ─── Gatekeeper ──────────────────────────────────────────────

  socket.on('game:gatekeeperActive', ({ roomId, active }) => {
    const game = roomManager.getRoom(roomId);
    if (!game) return;
    if (socket.id !== game.hostId) return;

    game.setGatekeeperActive(active);
    io.to(roomId).emit('game:gatekeeperStatus', { active });
    broadcastState(io, game);
  });

  socket.on('game:assignChosenOne', ({ roomId, playerId }, callback) => {
    const game = roomManager.getRoom(roomId);
    if (!game) return callback?.({ success: false });
    if (socket.id !== game.hostId) return callback?.({ success: false, error: 'Only host can assign' });

    game.assignChosenOne(playerId);
    broadcastState(io, game);
    callback?.({ success: true });
  });

  // ─── Free Turns / Missed Turns / Block Until ────────────────

  socket.on('game:grantFreeTurns', ({ roomId, playerId, count }, callback) => {
    const game = getGame(roomId);
    if (!game) return callback?.({ success: false });

    game.grantFreeTurns(playerId, count);
    const player = game.getPlayer(playerId);
    game.addEvent('action', `${player.name} receives ${count} free turn(s)!`);

    broadcastState(io, game);
    callback?.({ success: true });
  });

  socket.on('game:imposeMissedTurns', ({ roomId, playerId, count }, callback) => {
    const game = getGame(roomId);
    if (!game) return callback?.({ success: false });

    game.imposeMissedTurns(playerId, count);
    const player = game.getPlayer(playerId);
    game.addEvent('action', `${player.name} must miss ${count} turn(s)!`);

    broadcastState(io, game);
    callback?.({ success: true });
  });

  socket.on('game:blockPlayerUntil', ({ roomId, playerId, untilTimestamp }, callback) => {
    const game = getGame(roomId);
    if (!game) return callback?.({ success: false });

    game.blockPlayerUntil(playerId, untilTimestamp);
    const player = game.getPlayer(playerId);
    const mins = Math.floor(untilTimestamp / 60);
    const secs = untilTimestamp % 60;
    game.addEvent('action', `${player.name} cannot play until ${mins}:${String(secs).padStart(2, '0')}!`);

    broadcastState(io, game);
    callback?.({ success: true });
  });

  // ─── Disconnect Handling ────────────────────────────────────

  socket.on('disconnect', () => {
    for (const game of roomManager.getAllRooms()) {
      const player = game.getPlayer(socket.id);
      if (player) {
        player.isActive = false;
        game.addEvent('system', `${player.name} disconnected.`);
        io.to(game.roomId).emit('game:playerDisconnected', { playerId: socket.id });

        if (game.phase === 'waiting') {
          game.removePlayer(socket.id);
          if (game.playerCount === 0) {
            roomManager.deleteRoom(game.roomId);
          } else {
            if (game.hostId === socket.id) {
              game.hostId = game.getAllPlayers()[0].id;
            }
            io.to(game.roomId).emit('lobby:updated', game.toJSON());
          }
        }
      }
    }
  });
}
