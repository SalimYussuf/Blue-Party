const ScribbleEngine = require('./engine');

module.exports = {
  id: "scribble",
  name: "Scribble Charades",
  description: "Draw and guess the secret word before time runs out!",
  minPlayers: 2,
  maxPlayers: 12,
  settings: {
    rounds: 3,
    drawTimeSeconds: 60
  },
  engine: ScribbleEngine,
  clientEvents: {
    draw_stroke: (engine, socket, data, io, roomCode) => {
      engine.handleDrawStroke(socket.id, data.stroke);
    },
    clear_canvas: (engine, socket, data, io, roomCode) => {
      engine.handleClearCanvas(socket.id);
    },
    submit_guess: (engine, socket, data, io, roomCode) => {
      engine.handleGuess(socket.id, data.guess);
    }
  }
};
