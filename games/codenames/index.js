const CodenamesEngine = require('./engine');

module.exports = {
  id: "codenames",
  name: "Codenames",
  description: "Two rival spymasters know the secret identities of 25 agents. Their teammates know the agents only by their CODENAMES.",
  minPlayers: 2, // Technically 4 is best, but 2 works for testing/co-op
  maxPlayers: 12,
  settings: {},
  engine: CodenamesEngine,
  clientEvents: {
    join_team: (engine, socket, data, io, roomCode) => {
      engine.handleJoinTeam(socket.id, data.team, data.role);
    },
    start_match: (engine, socket, data, io, roomCode) => {
      engine.handleStartMatch(socket.id);
    },
    submit_clue: (engine, socket, data, io, roomCode) => {
      engine.handleSubmitClue(socket.id, data.word, data.count);
    },
    click_card: (engine, socket, data, io, roomCode) => {
      engine.handleClickCard(socket.id, data.cardIndex);
    },
    end_guessing: (engine, socket, data, io, roomCode) => {
      engine.handleEndGuessing(socket.id);
    }
  }
};
