const { getRandomLocation, getAllLocationNames } = require('./locations');

class SpyfallEngine {
  constructor(room, io) {
    this.room = room;
    this.io = io;
    this.state = 'lobby'; // lobby, playing, voting, spy_guessing, game_over
    this.players = new Map(); // id -> { id, name, role, isSpy, isConnected }

    this.location = null;
    this.spyId = null;
    this.roundTime = 480; // 8 minutes in seconds
    this.timeLeft = 0;
    this.timerInterval = null;

    this.currentQuestionerId = null;
    this.currentResponderId = null;
    this.questionPhase = false; // true = someone is asking, false = free period

    // Voting
    this.votes = new Map(); // voterId -> targetId
    this.voteInProgress = false;
    this.voteCallerId = null;

    this.winner = null; // 'spy' or 'players'
    this.winReason = '';

    // Initialize players from room
    for (const [id, rp] of this.room.players.entries()) {
      this.players.set(id, {
        id: rp.id,
        name: rp.name,
        role: null,
        isSpy: false,
        isConnected: rp.isConnected
      });
    }
  }

  startGame() {
    this.state = 'playing';

    // Pick a random location
    this.location = getRandomLocation();

    // Pick a random spy
    const playerIds = [...this.players.keys()];
    const spyIndex = Math.floor(Math.random() * playerIds.length);
    this.spyId = playerIds[spyIndex];

    // Assign roles
    const availableRoles = [...this.location.roles];
    // Shuffle roles
    for (let i = availableRoles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableRoles[i], availableRoles[j]] = [availableRoles[j], availableRoles[i]];
    }

    let roleIndex = 0;
    for (const [id, p] of this.players.entries()) {
      if (id === this.spyId) {
        p.isSpy = true;
        p.role = 'SPY';
      } else {
        p.role = availableRoles[roleIndex % availableRoles.length];
        roleIndex++;
      }
    }

    // Pick first questioner randomly
    const nonSpyIds = playerIds.filter(id => id !== this.spyId);
    this.currentQuestionerId = playerIds[Math.floor(Math.random() * playerIds.length)];

    // Start timer
    this.timeLeft = this.roundTime;
    if (this.timerInterval) clearInterval(this.timerInterval);

    // Delay to let UI load
    setTimeout(() => {
      // Send each player their private card
      for (const [id, p] of this.players.entries()) {
        this.io.to(id).emit('spyfall_your_card', {
          role: p.role,
          location: p.isSpy ? null : this.location.name,
          isSpy: p.isSpy,
          allLocations: getAllLocationNames()
        });
      }

      this.broadcastState();
      this.broadcast('sound_event', { type: 'spyfall_round_start' });

      this.timerInterval = setInterval(() => {
        this.timeLeft--;
        if (this.timeLeft <= 0) {
          // Time ran out — spy wins!
          this.winner = 'spy';
          this.winReason = 'Time ran out! The Spy escaped undetected.';
          this.endGame();
        } else if (this.timeLeft % 10 === 0) {
          this.broadcast('spyfall_timer_sync', { timeLeft: this.timeLeft });
        }
      }, 1000);
    }, 3000);

    return { success: true };
  }

  handleAskQuestion(askerId, targetId) {
    if (this.state !== 'playing') return;
    if (this.voteInProgress) return;
    if (askerId === targetId) return;

    const asker = this.players.get(askerId);
    const target = this.players.get(targetId);
    if (!asker || !target) return;

    this.currentQuestionerId = askerId;
    this.currentResponderId = targetId;

    this.broadcast('spyfall_question', {
      askerId,
      askerName: asker.name,
      targetId,
      targetName: target.name
    });
  }

  handleCallVote(callerId, suspectId) {
    if (this.state !== 'playing') return;
    if (this.voteInProgress) return;

    const caller = this.players.get(callerId);
    const suspect = this.players.get(suspectId);
    if (!caller || !suspect) return;
    if (callerId === suspectId) return;

    this.voteInProgress = true;
    this.voteCallerId = callerId;
    this.votes.clear();

    // Caller automatically votes for the suspect
    this.votes.set(callerId, suspectId);

    this.broadcast('spyfall_vote_called', {
      callerId,
      callerName: caller.name,
      suspectId,
      suspectName: suspect.name
    });
    this.broadcast('sound_event', { type: 'spyfall_vote_called' });

    this.broadcastVoteState(suspectId);
  }

  handleVote(voterId, guilty) {
    if (!this.voteInProgress) return;
    const voter = this.players.get(voterId);
    if (!voter) return;

    if (guilty) {
      // Find the suspect from the vote caller's accusation
      const suspectId = this.votes.get(this.voteCallerId);
      this.votes.set(voterId, suspectId);
    } else {
      this.votes.set(voterId, 'innocent');
    }

    const suspectId = this.votes.get(this.voteCallerId);
    this.broadcastVoteState(suspectId);

    // Check if all players have voted
    if (this.votes.size >= this.players.size) {
      this.resolveVote(suspectId);
    }
  }

  broadcastVoteState(suspectId) {
    const voteStatus = [];
    for (const [id, p] of this.players.entries()) {
      voteStatus.push({
        id,
        name: p.name,
        voted: this.votes.has(id),
        votedGuilty: this.votes.get(id) === suspectId
      });
    }
    this.broadcast('spyfall_vote_update', {
      suspectId,
      votes: voteStatus,
      totalVoters: this.players.size,
      votesIn: this.votes.size
    });
  }

  resolveVote(suspectId) {
    const guiltyVotes = [...this.votes.values()].filter(v => v === suspectId).length;
    const majority = Math.floor(this.players.size / 2) + 1;

    if (guiltyVotes >= majority) {
      // Majority voted guilty
      if (suspectId === this.spyId) {
        // Correct! But the spy gets one last chance to guess the location
        this.state = 'spy_guessing';
        this.voteInProgress = false;

        const spy = this.players.get(this.spyId);
        this.broadcast('spyfall_spy_caught', {
          spyId: this.spyId,
          spyName: spy.name,
          message: `${spy.name} has been caught! The Spy gets one final chance to guess the location...`
        });
        this.broadcast('sound_event', { type: 'spyfall_spy_caught' });
        this.broadcastState();
      } else {
        // Wrong person! Spy wins!
        this.winner = 'spy';
        const wrongTarget = this.players.get(suspectId);
        this.winReason = `Players accused ${wrongTarget.name}, but they were innocent! The Spy wins!`;
        this.endGame();
      }
    } else {
      // Vote failed — not enough guilty votes
      this.voteInProgress = false;
      this.broadcast('spyfall_vote_failed', {
        message: 'Vote failed — not enough players agreed.'
      });
      this.broadcastState();
    }
  }

  handleSpyGuessLocation(playerId, locationGuess) {
    if (this.state !== 'spy_guessing' && this.state !== 'playing') return;
    if (playerId !== this.spyId) return;

    const normalizedGuess = locationGuess.trim().toLowerCase();
    const normalizedLocation = this.location.name.toLowerCase();

    if (normalizedGuess === normalizedLocation) {
      this.winner = 'spy';
      this.winReason = `The Spy correctly guessed the location: ${this.location.name}!`;
    } else {
      this.winner = 'players';
      this.winReason = `The Spy guessed "${locationGuess}" but the location was ${this.location.name}!`;
    }
    this.endGame();
  }

  handleSpyReveal(playerId) {
    // Spy voluntarily reveals themselves and guesses location
    if (this.state !== 'playing') return;
    if (playerId !== this.spyId) return;

    this.state = 'spy_guessing';
    this.voteInProgress = false;

    const spy = this.players.get(this.spyId);
    this.broadcast('spyfall_spy_reveal', {
      spyId: this.spyId,
      spyName: spy.name,
      message: `${spy.name} reveals themselves as the Spy! They must now guess the location...`
    });
    this.broadcast('sound_event', { type: 'spyfall_spy_caught' });
    this.broadcastState();
  }

  endGame() {
    this.state = 'game_over';
    if (this.timerInterval) clearInterval(this.timerInterval);

    const spy = this.players.get(this.spyId);

    this.broadcast('spyfall_game_over', {
      winner: this.winner,
      reason: this.winReason,
      spyId: this.spyId,
      spyName: spy.name,
      location: this.location.name,
      players: [...this.players.values()].map(p => ({
        id: p.id,
        name: p.name,
        role: p.role,
        isSpy: p.isSpy
      }))
    });
    this.broadcast('sound_event', { type: 'spyfall_game_over' });
    this.broadcastState();
  }

  broadcastState() {
    this.broadcast('spyfall_state', {
      state: this.state,
      timeLeft: this.timeLeft,
      players: [...this.players.values()].map(p => ({
        id: p.id,
        name: p.name,
        isConnected: p.isConnected
      })),
      currentQuestionerId: this.currentQuestionerId,
      currentResponderId: this.currentResponderId,
      voteInProgress: this.voteInProgress,
      winner: this.winner,
      spyId: this.state === 'game_over' ? this.spyId : null
    });
  }

  broadcast(event, data) {
    this.io.to(this.room.code).emit(event, data);
  }

  getState() {
    return {};
  }

  handleDisconnect(playerId) {
    const p = this.players.get(playerId);
    if (p) p.isConnected = false;
    this.broadcastState();
  }

  handleReconnect(oldId, newId) {
    const p = this.players.get(oldId);
    if (p) {
      p.id = newId;
      p.isConnected = true;
      this.players.delete(oldId);
      this.players.set(newId, p);

      if (this.spyId === oldId) this.spyId = newId;
      if (this.currentQuestionerId === oldId) this.currentQuestionerId = newId;
      if (this.currentResponderId === oldId) this.currentResponderId = newId;
      if (this.voteCallerId === oldId) this.voteCallerId = newId;

      setTimeout(() => {
        this.broadcastState();
        // Re-send their card
        this.io.to(newId).emit('spyfall_your_card', {
          role: p.role,
          location: p.isSpy ? null : this.location.name,
          isSpy: p.isSpy,
          allLocations: getAllLocationNames()
        });
      }, 500);
      return true;
    }
    return false;
  }

  handleReconnectTimeout(playerId) {
    // No elimination in Spyfall
  }
}

module.exports = SpyfallEngine;
