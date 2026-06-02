const SecretHitlerEngine = require('./engine');

module.exports = {
  id: "secrethitler",
  name: "Secret Hitler",
  description: "A social deduction game where liberals try to stop fascists before Hitler comes to power. Hidden identities and deception required.",
  minPlayers: 5,
  maxPlayers: 10,
  settings: {},
  engine: SecretHitlerEngine,
  clientEvents: {
    sync_state: (engine, socket, data, io, roomCode) => {
      engine.broadcastState();
    },
    start_game: (engine, socket, data, io, roomCode) => {
      const result = engine.startGame();
      if (!result.success) {
        io.to(socket.id).emit('error', { message: result.error });
      }
    },
    nominate_chancellor: (engine, socket, data, io, roomCode) => {
      engine.handleNominateChancellor(socket.id, data.chancellorId);
    },
    cast_vote: (engine, socket, data, io, roomCode) => {
      engine.handleCastVote(socket.id, data.voteYes);
    },
    president_discard: (engine, socket, data, io, roomCode) => {
      engine.handlePresidentDiscard(socket.id, data.cardIndex);
    },
    chancellor_enact: (engine, socket, data, io, roomCode) => {
      engine.handleChancellorEnact(socket.id, data.cardIndex);
    },
    chancellor_veto: (engine, socket, data, io, roomCode) => {
      engine.handleChancellorVeto(socket.id);
    },
    president_veto_response: (engine, socket, data, io, roomCode) => {
      engine.handlePresidentVetoResponse(socket.id, data.allowVeto);
    },
    execute_player: (engine, socket, data, io, roomCode) => {
      engine.handleExecutePlayer(socket.id, data.targetId);
    },
    investigate_player: (engine, socket, data, io, roomCode) => {
      engine.handleInvestigatePlayer(socket.id, data.targetId);
    },
    peek_cards: (engine, socket, data, io, roomCode) => {
      engine.handlePeekCards(socket.id);
    },
    call_election: (engine, socket, data, io, roomCode) => {
      engine.handleCallElection(socket.id, data.nextPresidentId);
    }
  }
};
