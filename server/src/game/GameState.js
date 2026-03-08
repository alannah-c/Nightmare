import { CardDeck } from './CardDeck.js';
import { getCharacterById, getRandomCharacterAssignments } from './characters.js';
import { OUTER_RING, BOARD_SIZE, getDestination, getInnerPathEntry } from './board.js';

/**
 * Game phases:
 *   'waiting'            — lobby, players joining
 *   'setup'              — characters assigned, fears being submitted
 *   'playing'            — active gameplay
 *   'gatekeeper_active'  — Gatekeeper is on screen, all actions frozen
 *   'nightmare_attempt'  — a player is attempting the NIGHTMARE square
 *   'game_over'          — someone won or timer expired
 */

export class GameState {
  constructor(roomId, hostId) {
    this.roomId = roomId;
    this.hostId = hostId;
    this.players = new Map();
    this.phase = 'waiting';

    // Turn management
    this.turnOrder = [];        // array of playerIds in clockwise order
    this.turnIndex = 0;
    this.freeTurns = new Map(); // playerId -> number of free turns remaining
    this.missedTurns = new Map(); // playerId -> number of turns to skip
    this.cannotPlayUntil = new Map(); // playerId -> video timestamp (seconds)

    // Card decks
    this.timeDeck = null;
    this.fateDeck = null;
    this.chanceDeck = null;

    // NIGHTMARE fear cards (submitted by players, hidden)
    this.nightmareCards = []; // { playerId, fear } — shuffled face-down

    // Video sync
    this.videoTimestamp = 0;   // current video time in seconds (from host)
    this.videoStartedAt = null; // Date.now() when video was started
    this.gameDurationSec = 3600; // 60 minutes

    // Special designations
    this.chosenOneId = null;
    this.youngestPlayerId = null;
    this.oldestPlayerId = null;

    // SCREAM voting state
    this.screamVote = null; // { initiatorId, targetId?, votes: Map, timeout }

    // Event log
    this.eventLog = [];
  }

  // ─── Player Management ───────────────────────────────────────

  addPlayer(playerId, name) {
    this.players.set(playerId, {
      id: playerId,
      name,
      character: null,      // assigned at setup
      numberToken: null,     // 1-6, assigned at setup
      age: null,             // for young/old one determination
      position: 0,           // outer ring index
      onInnerPath: null,     // null or { pathId, pathPosition }
      onNightmareSquare: false,
      inBlackHole: false,
      keys: new Set(),       // set of key ids held
      cards: {
        time: [],
        fate: [],
        chance: [],
      },
      keyHalves: {           // for Key Half chance cards
        front: 0,
        back: 0,
      },
      isEliminated: false,
      isActive: true,        // false if disconnected
    });
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
    this.turnOrder = this.turnOrder.filter((id) => id !== playerId);
  }

  getPlayer(playerId) {
    return this.players.get(playerId);
  }

  getAllPlayers() {
    return Array.from(this.players.values());
  }

  getActivePlayers() {
    return this.getAllPlayers().filter((p) => p.isActive && !p.isEliminated);
  }

  get playerCount() {
    return this.players.size;
  }

  // ─── Game Setup ──────────────────────────────────────────────

  assignCharacters() {
    const activePlayers = this.getActivePlayers();
    const assignments = getRandomCharacterAssignments(activePlayers.length);

    activePlayers.forEach((player, i) => {
      const { character, numberToken } = assignments[i];
      player.character = character;
      player.numberToken = numberToken;
      player.position = character.gravestoneIndex;
    });

    // Set turn order (clockwise by gravestone position)
    this.turnOrder = activePlayers
      .sort((a, b) => a.position - b.position)
      .map((p) => p.id);
  }

  setPlayerAge(playerId, age) {
    const player = this.getPlayer(playerId);
    if (player) player.age = age;
    this._updateAgeDesignations();
  }

  _updateAgeDesignations() {
    const withAges = this.getActivePlayers().filter((p) => p.age !== null);
    if (withAges.length === 0) return;

    withAges.sort((a, b) => a.age - b.age);
    this.youngestPlayerId = withAges[0].id;
    this.oldestPlayerId = withAges[withAges.length - 1].id;
  }

  submitFear(playerId, fear) {
    this.nightmareCards.push({ playerId, fear });
  }

  shuffleNightmareCards() {
    for (let i = this.nightmareCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.nightmareCards[i], this.nightmareCards[j]] =
        [this.nightmareCards[j], this.nightmareCards[i]];
    }
  }

  initDecks() {
    this.timeDeck = new CardDeck('time');
    this.fateDeck = new CardDeck('fate');
    this.chanceDeck = new CardDeck('chance');
  }

  startGame() {
    this.initDecks();
    this.shuffleNightmareCards();
    this.phase = 'playing';
    this.videoStartedAt = Date.now();
    this.addEvent('system', 'The game has begun. The Gatekeeper awaits…');
  }

  // ─── Turn Management ────────────────────────────────────────

  getCurrentTurnPlayerId() {
    if (this.turnOrder.length === 0) return null;
    return this.turnOrder[this.turnIndex % this.turnOrder.length];
  }

  advanceTurn() {
    const maxIterations = this.turnOrder.length;
    let iterations = 0;

    do {
      // Check for free turns first
      const currentId = this.getCurrentTurnPlayerId();
      const freeTurnsLeft = this.freeTurns.get(currentId) || 0;
      if (freeTurnsLeft > 0) {
        this.freeTurns.set(currentId, freeTurnsLeft - 1);
        return; // same player goes again
      }

      this.turnIndex = (this.turnIndex + 1) % this.turnOrder.length;
      iterations++;

      const nextId = this.getCurrentTurnPlayerId();
      const nextPlayer = this.getPlayer(nextId);

      // Skip eliminated players
      if (nextPlayer.isEliminated) continue;

      // Skip players in Black Hole
      if (nextPlayer.inBlackHole) continue;

      // Skip players with missed turns
      const missedLeft = this.missedTurns.get(nextId) || 0;
      if (missedLeft > 0) {
        this.missedTurns.set(nextId, missedLeft - 1);
        continue;
      }

      // Skip players who cannot play until a certain timestamp
      const blockedUntil = this.cannotPlayUntil.get(nextId);
      if (blockedUntil && this.videoTimestamp < blockedUntil) {
        continue;
      } else if (blockedUntil) {
        this.cannotPlayUntil.delete(nextId);
      }

      break; // valid player found
    } while (iterations < maxIterations);
  }

  grantFreeTurns(playerId, count) {
    const current = this.freeTurns.get(playerId) || 0;
    this.freeTurns.set(playerId, current + count);
  }

  imposeMissedTurns(playerId, count) {
    const current = this.missedTurns.get(playerId) || 0;
    this.missedTurns.set(playerId, current + count);
  }

  blockPlayerUntil(playerId, videoSeconds) {
    this.cannotPlayUntil.set(playerId, videoSeconds);
  }

  // ─── Dice ────────────────────────────────────────────────────

  rollDice() {
    return Math.floor(Math.random() * 6) + 1;
  }

  // ─── Movement ────────────────────────────────────────────────

  movePlayer(playerId, steps) {
    const player = this.getPlayer(playerId);
    if (!player || player.inBlackHole) return null;

    if (player.onInnerPath) {
      // Moving along inner path toward NIGHTMARE square
      const newPos = player.onInnerPath.pathPosition + steps;
      if (newPos > 4) {
        // Overshot — need exact roll. Stay put.
        return { overshot: true };
      } else if (newPos === 4) {
        // Landed on NIGHTMARE square (inner path has 4 squares, position 4 = center)
        player.onNightmareSquare = true;
        player.onInnerPath.pathPosition = 4;
        return { landed: 'nightmare_center' };
      } else {
        player.onInnerPath.pathPosition = newPos;
        return { landed: `inner_path_${player.onInnerPath.pathId}_${newPos}` };
      }
    }

    // Normal outer ring movement (clockwise)
    const newPosition = getDestination(player.position, steps);
    player.position = newPosition;

    const square = OUTER_RING[newPosition];
    return { landed: square.type, square };
  }

  enterInnerPath(playerId) {
    const player = this.getPlayer(playerId);
    if (!player) return false;
    if (player.keys.size < 6) return false;

    const pathEntry = getInnerPathEntry(player.position);
    if (!pathEntry) return false;

    player.onInnerPath = {
      pathId: pathEntry.id,
      pathPosition: 0, // at the entrance
    };
    return true;
  }

  returnToGravestone(playerId) {
    const player = this.getPlayer(playerId);
    if (!player) return;

    player.position = player.character.gravestoneIndex;
    player.onInnerPath = null;
    player.onNightmareSquare = false;
  }

  // ─── Keys ────────────────────────────────────────────────────

  giveKey(playerId, count = 1) {
    const player = this.getPlayer(playerId);
    if (!player) return;

    const char = player.character;
    const allKeys = char.keys;
    let given = 0;

    for (const key of allKeys) {
      if (given >= count) break;
      if (!player.keys.has(key.id)) {
        player.keys.add(key.id);
        given++;
      }
    }

    return given;
  }

  removeKey(playerId, count = 1) {
    const player = this.getPlayer(playerId);
    if (!player) return 0;

    const keysArray = Array.from(player.keys);
    let removed = 0;

    for (let i = keysArray.length - 1; i >= 0 && removed < count; i--) {
      player.keys.delete(keysArray[i]);
      removed++;
    }

    // If player lost a key while on inner path, send back to gravestone
    if (player.keys.size < 6 && player.onInnerPath) {
      this.returnToGravestone(playerId);
      this.addEvent('system', `${player.name} lost a key on the inner path and must return to their gravestone!`);
    }

    return removed;
  }

  getPlayerKeyCount(playerId) {
    const player = this.getPlayer(playerId);
    return player ? player.keys.size : 0;
  }

  // ─── Black Hole ──────────────────────────────────────────────

  banishToBlackHole(playerId) {
    const player = this.getPlayer(playerId);
    if (!player) return;

    player.inBlackHole = true;
    player.onInnerPath = null;
    player.onNightmareSquare = false;
    this.addEvent('system', `${player.name} has been BANISHED to the Black Hole!`);
  }

  releaseFromBlackHole(playerId) {
    const player = this.getPlayer(playerId);
    if (!player) return;

    player.inBlackHole = false;
    this.addEvent('system', `${player.name} has been released from the Black Hole!`);
  }

  releaseAllFromBlackHole() {
    for (const player of this.getAllPlayers()) {
      if (player.inBlackHole) {
        this.releaseFromBlackHole(player.id);
      }
    }
  }

  // ─── Cards ───────────────────────────────────────────────────

  drawCard(playerId, deckType) {
    const player = this.getPlayer(playerId);
    if (!player) return null;

    let deck;
    switch (deckType) {
      case 'time': deck = this.timeDeck; break;
      case 'fate': deck = this.fateDeck; break;
      case 'chance': deck = this.chanceDeck; break;
      default: return null;
    }

    const card = deck.draw();
    if (!card) return null;

    // Time cards: check if activation time has passed
    if (card.type === 'time' && !card.activationAny && !card.activationFrom
        && card.activationTime !== null && this.videoTimestamp > card.activationTime) {
      // Time has expired — return to back of pack
      deck.returnToBack(card);
      this.addEvent('system', `${player.name} drew a Time card but the time has expired. Returned to pack.`);
      return { card, expired: true };
    }

    // Chance cards: check character+number match
    if (card.type === 'chance' && card.subtype === 'character_number') {
      if (card.character !== player.character.id || card.number !== player.numberToken) {
        deck.returnToBack(card);
        this.addEvent('system', `${player.name} drew a Chance card but it doesn't match. Returned to pack.`);
        return { card, noMatch: true };
      }
    }

    // Key Half handling
    if (card.type === 'chance' && card.subtype === 'key_half') {
      player.keyHalves[card.half]++;
      if (player.keyHalves.front > 0 && player.keyHalves.back > 0) {
        player.keyHalves.front--;
        player.keyHalves.back--;
        this.giveKey(playerId);
        this.addEvent('system', `${player.name} matched Key Halves and receives a key!`);
        return { card, keyHalfMatched: true };
      }
      player.cards.chance.push(card);
      return { card, keyHalfStored: true };
    }

    player.cards[deckType].push(card);
    return { card };
  }

  playCard(playerId, cardId) {
    const player = this.getPlayer(playerId);
    if (!player) return null;

    for (const deckType of ['time', 'fate', 'chance']) {
      const idx = player.cards[deckType].findIndex((c) => c.id === cardId && c.type === deckType);
      if (idx !== -1) {
        const [card] = player.cards[deckType].splice(idx, 1);
        return card;
      }
    }
    return null;
  }

  returnCardToDeck(card) {
    switch (card.type) {
      case 'time': this.timeDeck.returnToBack(card); break;
      case 'fate': this.fateDeck.returnToBack(card); break;
      case 'chance': this.chanceDeck.returnToBack(card); break;
    }
  }

  transferCards(fromId, toId, cardType) {
    const from = this.getPlayer(fromId);
    const to = this.getPlayer(toId);
    if (!from || !to) return [];

    const cards = from.cards[cardType].splice(0);
    to.cards[cardType].push(...cards);
    return cards;
  }

  // ─── Coin Flip ───────────────────────────────────────────────

  flipCoin() {
    return Math.random() < 0.5 ? 'heads' : 'tails';
  }

  // ─── SCREAM Mechanic ────────────────────────────────────────

  initiateScream(initiatorId, targetId) {
    this.screamVote = {
      initiatorId,
      targetId: targetId || null, // null = scare all opponents
      votes: new Map(),
      startedAt: Date.now(),
      durationMs: 5000, // 5-second window
    };
    return this.screamVote;
  }

  submitScreamVote(playerId, isScared) {
    if (!this.screamVote) return false;
    this.screamVote.votes.set(playerId, isScared);
    return true;
  }

  resolveScream() {
    if (!this.screamVote) return null;

    const votes = Array.from(this.screamVote.votes.values());
    const scaredCount = votes.filter((v) => v).length;
    const totalVoters = votes.length;
    const success = scaredCount > totalVoters / 2;

    const result = {
      initiatorId: this.screamVote.initiatorId,
      targetId: this.screamVote.targetId,
      success,
      scaredCount,
      totalVoters,
    };

    this.screamVote = null;
    return result;
  }

  // ─── NIGHTMARE Attempt ──────────────────────────────────────

  attemptNightmare(playerId) {
    const player = this.getPlayer(playerId);
    if (!player || !player.onNightmareSquare) return { error: 'Not on NIGHTMARE square' };
    if (player.keys.size < 6) return { error: 'Need all 6 keys' };

    // Must roll a 6
    const roll = this.rollDice();
    if (roll !== 6) {
      return { success: false, roll, message: 'You need to roll a 6!' };
    }

    // Draw top NIGHTMARE card
    if (this.nightmareCards.length === 0) {
      return { error: 'No NIGHTMARE cards remaining' };
    }

    const drawn = this.nightmareCards.shift();

    // Check if it's the player's own fear
    if (drawn.playerId === playerId) {
      // Drew own fear — ELIMINATED
      player.isEliminated = true;
      this.addEvent('system', `${player.name} drew their own greatest fear and is ELIMINATED!`);

      // Check if any other player shares the same fear
      const otherSameFear = this.getAllPlayers().find(
        (p) => p.id !== playerId && !p.isEliminated
          && this.nightmareCards.some((nc) => nc.playerId === p.id && nc.fear === drawn.fear)
      );
      if (otherSameFear) {
        otherSameFear.isEliminated = true;
        this.addEvent('system', `${otherSameFear.name} shares the same fear and is also ELIMINATED!`);
      }

      return {
        success: false,
        roll: 6,
        fear: drawn.fear,
        eliminated: true,
        message: `Your greatest fear: "${drawn.fear}". You are ELIMINATED!`,
      };
    }

    // Not their fear — WINNER!
    this.phase = 'game_over';
    this.addEvent('system', `${player.name} has CONQUERED their nightmare and WINS THE GAME!`);

    return {
      success: true,
      roll: 6,
      fear: drawn.fear,
      winner: true,
      message: `The fear "${drawn.fear}" is not yours. YOU WIN!`,
    };
  }

  // ─── Video Sync ──────────────────────────────────────────────

  updateVideoTimestamp(seconds) {
    this.videoTimestamp = seconds;

    // Check if game time expired
    if (seconds >= this.gameDurationSec && this.phase === 'playing') {
      this.phase = 'game_over';
      this.addEvent('system', 'Time has expired! The Gatekeeper WINS!');
    }
  }

  setGatekeeperActive(active) {
    if (active && this.phase === 'playing') {
      this.phase = 'gatekeeper_active';
      this.addEvent('gatekeeper', 'The Gatekeeper has appeared! All players must stop!');
    } else if (!active && this.phase === 'gatekeeper_active') {
      this.phase = 'playing';
      this.addEvent('gatekeeper', 'The Gatekeeper has departed.');
    }
  }

  assignChosenOne(playerId) {
    this.chosenOneId = playerId;
    const player = this.getPlayer(playerId);
    if (player) {
      this.addEvent('gatekeeper', `${player.name} has been designated as the Chosen One!`);
    }
  }

  // ─── Event Log ───────────────────────────────────────────────

  addEvent(source, message) {
    this.eventLog.push({
      timestamp: Date.now(),
      videoTime: this.videoTimestamp,
      source,
      message,
    });
    // Keep last 100 events
    if (this.eventLog.length > 100) {
      this.eventLog.shift();
    }
  }

  // ─── Utility: find players by special attributes ─────────────

  getPlayerByNumber(num) {
    return this.getAllPlayers().find((p) => p.numberToken === num && !p.isEliminated);
  }

  getPlayerWithMostKeys() {
    return this.getActivePlayers()
      .filter((p) => !p.isEliminated)
      .sort((a, b) => b.keys.size - a.keys.size)[0] || null;
  }

  getPlayerWithFewestKeys() {
    return this.getActivePlayers()
      .filter((p) => !p.isEliminated)
      .sort((a, b) => a.keys.size - b.keys.size)[0] || null;
  }

  getPlayerWithHighestNumber() {
    return this.getActivePlayers()
      .filter((p) => !p.isEliminated)
      .sort((a, b) => b.numberToken - a.numberToken)[0] || null;
  }

  getPlayerWithLowestNumber() {
    return this.getActivePlayers()
      .filter((p) => !p.isEliminated)
      .sort((a, b) => a.numberToken - b.numberToken)[0] || null;
  }

  getPlayersOnSquareType(squareType) {
    return this.getActivePlayers().filter((p) => {
      if (p.onInnerPath || p.inBlackHole) return false;
      const square = OUTER_RING[p.position];
      return square && square.type === squareType;
    });
  }

  getPlayersOnInnerPath() {
    return this.getActivePlayers().filter((p) => p.onInnerPath !== null);
  }

  // ─── Serialization ──────────────────────────────────────────

  toJSON() {
    return {
      roomId: this.roomId,
      hostId: this.hostId,
      phase: this.phase,
      players: this.getAllPlayers().map((p) => ({
        id: p.id,
        name: p.name,
        character: p.character ? {
          id: p.character.id,
          name: p.character.name,
          color: p.character.color,
          description: p.character.description,
        } : null,
        numberToken: p.numberToken,
        position: p.position,
        onInnerPath: p.onInnerPath,
        onNightmareSquare: p.onNightmareSquare,
        inBlackHole: p.inBlackHole,
        keyCount: p.keys.size,
        cardCounts: {
          time: p.cards.time.length,
          fate: p.cards.fate.length,
          chance: p.cards.chance.length,
        },
        keyHalves: p.keyHalves,
        isEliminated: p.isEliminated,
        isActive: p.isActive,
      })),
      turnOrder: this.turnOrder,
      turnIndex: this.turnIndex,
      currentTurnPlayerId: this.getCurrentTurnPlayerId(),
      videoTimestamp: this.videoTimestamp,
      videoStartedAt: this.videoStartedAt,
      chosenOneId: this.chosenOneId,
      youngestPlayerId: this.youngestPlayerId,
      oldestPlayerId: this.oldestPlayerId,
      deckStatus: {
        time: this.timeDeck ? this.timeDeck.remaining : null,
        fate: this.fateDeck ? this.fateDeck.remaining : null,
        chance: this.chanceDeck ? this.chanceDeck.remaining : null,
      },
      nightmareCardsRemaining: this.nightmareCards.length,
      screamVote: this.screamVote ? {
        initiatorId: this.screamVote.initiatorId,
        targetId: this.screamVote.targetId,
        votedCount: this.screamVote.votes.size,
        startedAt: this.screamVote.startedAt,
        durationMs: this.screamVote.durationMs,
      } : null,
      eventLog: this.eventLog.slice(-20),
    };
  }

  /**
   * Return the private hand for a specific player (only they should see this).
   */
  getPlayerHand(playerId) {
    const player = this.getPlayer(playerId);
    if (!player) return null;

    return {
      time: player.cards.time,
      fate: player.cards.fate,
      chance: player.cards.chance,
      keys: Array.from(player.keys),
      keyHalves: player.keyHalves,
    };
  }
}
