import { GameState } from './GameState.js';

/**
 * Manages all active game rooms.
 */
class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  createRoom(roomId, hostId) {
    const game = new GameState(roomId, hostId);
    this.rooms.set(roomId, game);
    return game;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  deleteRoom(roomId) {
    this.rooms.delete(roomId);
  }

  getAllRooms() {
    return Array.from(this.rooms.values());
  }
}

export const roomManager = new RoomManager();
