import { useEffect } from 'react';
import { socket } from '../services/socket.js';
import { useGameDispatch } from '../context/GameContext.jsx';

export function useSocket() {
  const dispatch = useGameDispatch();

  useEffect(() => {
    socket.connect();

    // Set local player ID once connected
    socket.on('connect', () => {
      dispatch({ type: 'SET_LOCAL_PLAYER', playerId: socket.id });
    });

    // Lobby events
    socket.on('lobby:updated', (game) => {
      dispatch({ type: 'UPDATE_GAME', game });
    });

    socket.on('lobby:allFearsSubmitted', () => {
      dispatch({ type: 'ADD_EVENT', event: { source: 'system', message: 'All fears submitted!' } });
    });

    // Game start — receives both public state and private hand
    socket.on('game:started', ({ game, hand }) => {
      dispatch({ type: 'UPDATE_GAME', game });
      dispatch({ type: 'UPDATE_HAND', hand });
    });

    // Full state update (sent after most actions)
    socket.on('game:stateUpdated', ({ game, hand }) => {
      dispatch({ type: 'UPDATE_GAME', game });
      if (hand) dispatch({ type: 'UPDATE_HAND', hand });
    });

    // Private hand update
    socket.on('game:handUpdated', (hand) => {
      dispatch({ type: 'UPDATE_HAND', hand });
    });

    // Dice
    socket.on('game:diceRolled', ({ playerId, roll }) => {
      dispatch({ type: 'ADD_EVENT', event: { source: 'action', message: `Player rolled a ${roll}` } });
    });

    // Card drawn (public notification — card details are private)
    socket.on('game:cardDrawn', ({ playerId, deckType, expired, noMatch, keyHalfMatched }) => {
      // Public-facing event only
    });

    // Card played
    socket.on('game:cardPlayed', ({ playerId, card, targetPlayerId }) => {
      dispatch({ type: 'ADD_EVENT', event: { source: 'action', message: `A ${card.type} card was played.` } });
    });

    // Coin flip
    socket.on('game:coinFlipped', ({ playerId, result }) => {
      dispatch({ type: 'ADD_EVENT', event: { source: 'action', message: `Coin flip: ${result.toUpperCase()}!` } });
    });

    // SCREAM
    socket.on('game:screamInitiated', ({ initiatorId, targetId, durationMs }) => {
      dispatch({
        type: 'SET_SCREAM',
        screamVote: { initiatorId, targetId, durationMs, startedAt: Date.now() },
      });
    });

    socket.on('game:screamResolved', (result) => {
      dispatch({ type: 'SET_SCREAM', screamVote: null });
      dispatch({
        type: 'ADD_EVENT',
        event: {
          source: 'action',
          message: result.success
            ? `SCREAM succeeded! ${result.scaredCount} scared.`
            : `SCREAM failed. Not enough players scared.`,
        },
      });
    });

    // NIGHTMARE attempt
    socket.on('game:nightmareAttempt', (result) => {
      dispatch({
        type: 'ADD_EVENT',
        event: { source: 'nightmare', message: result.message },
      });
    });

    // Gatekeeper
    socket.on('game:gatekeeperStatus', ({ active }) => {
      dispatch({ type: 'SET_GATEKEEPER_ACTIVE', active });
    });

    socket.on('game:gatekeeperWins', ({ message }) => {
      dispatch({ type: 'SET_PHASE', phase: 'game_over' });
      dispatch({ type: 'ADD_EVENT', event: { source: 'gatekeeper', message } });
    });

    // Video sync (for non-host clients)
    socket.on('game:videoSync', ({ timestamp }) => {
      dispatch({ type: 'SET_VIDEO_TIMESTAMP', timestamp });
    });

    // Gravestone landing notification
    socket.on('game:opponentOnGravestone', ({ landingPlayerId }) => {
      dispatch({
        type: 'ADD_EVENT',
        event: { source: 'system', message: 'An opponent has landed on your gravestone! Play a Fate card?' },
      });
    });

    // Disconnect
    socket.on('game:playerDisconnected', ({ playerId }) => {
      dispatch({ type: 'ADD_EVENT', event: { source: 'system', message: 'A player disconnected.' } });
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [dispatch]);

  return socket;
}
