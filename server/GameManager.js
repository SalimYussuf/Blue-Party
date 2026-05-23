const fs = require('fs');
const path = require('path');

class GameManager {
  constructor() {
    this.games = new Map(); // gameId -> gameModule
    this.activeGames = new Map(); // roomCode -> activeGameEngine
    this.activeGameModules = new Map(); // roomCode -> gameModule

    this.loadGames();
  }

  loadGames() {
    const gamesDir = path.join(__dirname, '../games');
    const folders = fs.readdirSync(gamesDir);
    for (const folder of folders) {
      if (folder === 'common') continue;
      const indexPath = path.join(gamesDir, folder, 'index.js');
      if (fs.existsSync(indexPath)) {
        try {
          const gameModule = require(indexPath);
          this.games.set(gameModule.id, gameModule);
          console.log(`Loaded game module: ${gameModule.name} (${gameModule.id})`);
        } catch (err) {
          console.error(`Failed to load game module ${folder}:`, err);
        }
      }
    }
  }

  getAvailableGames() {
    return Array.from(this.games.values()).map(g => ({
      id: g.id,
      name: g.name,
      description: g.description,
      minPlayers: g.minPlayers,
      maxPlayers: g.maxPlayers,
    }));
  }

  startGame(roomCode, gameId, room, io) {
    const gameModule = this.games.get(gameId);
    if (!gameModule) {
      return { success: false, error: 'Game not found' };
    }

    const engine = new gameModule.engine(room, io);
    this.activeGames.set(roomCode, engine);
    this.activeGameModules.set(roomCode, gameModule);

    return engine.startGame();
  }

  getEngine(roomCode) {
    return this.activeGames.get(roomCode);
  }

  getModule(roomCode) {
    return this.activeGameModules.get(roomCode);
  }

  endGame(roomCode) {
    this.activeGames.delete(roomCode);
    this.activeGameModules.delete(roomCode);
  }

  handleSocketEvent(socket, eventName, data, io, roomCode) {
    const gameModule = this.getModule(roomCode);
    const engine = this.getEngine(roomCode);
    if (gameModule && gameModule.clientEvents && gameModule.clientEvents[eventName]) {
      gameModule.clientEvents[eventName](engine, socket, data, io, roomCode);
      return true;
    }
    return false;
  }
}

module.exports = new GameManager();
