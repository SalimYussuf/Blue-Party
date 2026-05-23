const HotJokerEngine = require('./engine');

module.exports = {
  id: "hotjoker",
  name: "Hot Joker",
  description: "Pass the bomb before it explodes! Last player standing wins.",
  minPlayers: 2,
  maxPlayers: 8,
  settings: {},
  engine: HotJokerEngine,
  clientEvents: {
    pass_joker: (engine, socket, data, io, roomCode) => {
      const result = engine.passJoker(socket.id, data.targetId);
      if (!result.success) {
        socket.emit('error', { message: result.error });
      }
    }
  }
};
