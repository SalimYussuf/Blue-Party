const GameEngine = require('./GameEngine');

module.exports = {
  id: "liars-bar",
  name: "Uwongo's Bar", // Using the updated name Uwongo's Bar
  description: "Bluffing card game with a Russian Roulette twist.",
  minPlayers: 2,
  maxPlayers: 8,
  settings: {
    isDevilCardMode: false,
    isChaosMode: false,
  },
  engine: GameEngine,
  clientEvents: {
    play_cards: (engine, socket, data, io, roomCode) => {
      const result = engine.playCards(socket.id, data.cardIds, data.declaredRank, data.declaredCount);
      if (!result.success) {
        socket.emit('error', { message: 'Invalid action' });
      }
    },
    call_liar: (engine, socket, data, io, roomCode) => {
      const result = engine.callLiar(socket.id);
      if (!result.success) {
        socket.emit('error', { message: 'Invalid action' });
      }
    },
    select_target: (engine, socket, data, io, roomCode) => {
      const result = engine.selectTarget(socket.id, data.targetId);
      if (!result.success) {
        socket.emit('error', { message: 'Invalid action' });
      }
    }
  }
};
