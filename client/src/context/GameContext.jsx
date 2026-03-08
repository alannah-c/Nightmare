import { createContext, useContext, useReducer } from 'react';

const GameContext = createContext(null);
const GameDispatchContext = createContext(null);

const initialState = {
  roomId: null,
  localPlayerId: null,

  // Game state from server
  phase: 'idle', // idle | lobby | setup | playing | gatekeeper_active | nightmare_attempt | game_over
  players: [],
  turnOrder: [],
  turnIndex: 0,
  currentTurnPlayerId: null,
  hostId: null,

  // Video
  videoTimestamp: 0,
  videoStartedAt: null,

  // Special designations
  chosenOneId: null,
  youngestPlayerId: null,
  oldestPlayerId: null,

  // Deck status
  deckStatus: { time: null, fate: null, chance: null },
  nightmareCardsRemaining: 0,

  // Private hand (only for local player)
  hand: { time: [], fate: [], chance: [], keys: [], keyHalves: { front: 0, back: 0 } },

  // SCREAM state
  screamVote: null,

  // Event log
  eventLog: [],

  // Gatekeeper
  gatekeeperActive: false,
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_ROOM':
      return { ...state, roomId: action.roomId };

    case 'SET_LOCAL_PLAYER':
      return { ...state, localPlayerId: action.playerId };

    case 'UPDATE_GAME':
      return {
        ...state,
        phase: mapPhase(action.game.phase),
        players: action.game.players,
        turnOrder: action.game.turnOrder,
        turnIndex: action.game.turnIndex,
        currentTurnPlayerId: action.game.currentTurnPlayerId,
        hostId: action.game.hostId,
        videoTimestamp: action.game.videoTimestamp,
        videoStartedAt: action.game.videoStartedAt,
        chosenOneId: action.game.chosenOneId,
        youngestPlayerId: action.game.youngestPlayerId,
        oldestPlayerId: action.game.oldestPlayerId,
        deckStatus: action.game.deckStatus,
        nightmareCardsRemaining: action.game.nightmareCardsRemaining,
        screamVote: action.game.screamVote,
        eventLog: action.game.eventLog || state.eventLog,
      };

    case 'UPDATE_HAND':
      return { ...state, hand: action.hand };

    case 'SET_PHASE':
      return { ...state, phase: action.phase };

    case 'SET_GATEKEEPER_ACTIVE':
      return { ...state, gatekeeperActive: action.active };

    case 'SET_SCREAM':
      return { ...state, screamVote: action.screamVote };

    case 'ADD_EVENT':
      return {
        ...state,
        eventLog: [...state.eventLog.slice(-99), action.event],
      };

    case 'SET_VIDEO_TIMESTAMP':
      return { ...state, videoTimestamp: action.timestamp };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

function mapPhase(serverPhase) {
  if (serverPhase === 'waiting') return 'lobby';
  return serverPhase;
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={state}>
      <GameDispatchContext.Provider value={dispatch}>
        {children}
      </GameDispatchContext.Provider>
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}

export function useGameDispatch() {
  return useContext(GameDispatchContext);
}
