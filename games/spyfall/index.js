const SpyfallEngine = require('./engine');

module.exports = {
  id: "spyfall",
  name: "Spyfall",
  description: "One player is the Spy — everyone else knows the secret location. Ask questions, find the Spy, or guess the location!",
  minPlayers: 3,
  maxPlayers: 8,
  settings: {},
  engine: SpyfallEngine,
  clientEvents: {
    ask_question: (engine, socket, data, io, roomCode) => {
      engine.handleAskQuestion(socket.id, data.targetId);
    },
    call_vote: (engine, socket, data, io, roomCode) => {
      engine.handleCallVote(socket.id, data.suspectId);
    },
    cast_vote: (engine, socket, data, io, roomCode) => {
      engine.handleVote(socket.id, data.guilty);
    },
    spy_guess_location: (engine, socket, data, io, roomCode) => {
      engine.handleSpyGuessLocation(socket.id, data.location);
    },
    spy_reveal: (engine, socket, data, io, roomCode) => {
      engine.handleSpyReveal(socket.id);
    }
  }
};
