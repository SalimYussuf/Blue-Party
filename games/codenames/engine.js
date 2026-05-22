const wordBank = require('../common/wordbank');

class CodenamesEngine {
  constructor(room, io) {
    this.room = room;
    this.io = io;
    this.state = 'team_selection'; // team_selection, playing, game_over
    this.players = new Map(); // id -> { id, name, team: 'red'|'blue'|null, role: 'spymaster'|'operative'|null }
    
    this.board = [];
    this.currentTurn = 'red'; // red, blue
    this.turnPhase = 'clue'; // clue, guess
    this.currentClue = null; // { word: string, count: number }
    this.guessesLeft = 0;
    
    this.winner = null;
    this.score = { red: 0, blue: 0 };
    this.totalToWin = { red: 0, blue: 0 };

    // Initialize players
    for (const [id, rp] of this.room.players.entries()) {
      this.players.set(id, {
        id: rp.id,
        name: rp.name,
        team: null,
        role: null,
        isConnected: rp.isConnected
      });
    }
  }

  startGame() {
    this.state = 'team_selection';
    this.broadcastState();
    return { success: true };
  }

  handleJoinTeam(playerId, team, role) {
    if (this.state !== 'team_selection') return;
    const p = this.players.get(playerId);
    if (!p) return;

    if (team !== 'red' && team !== 'blue' && team !== null) return;
    if (role !== 'spymaster' && role !== 'operative' && role !== null) return;

    // Only one spymaster per team
    if (role === 'spymaster') {
      const existing = [...this.players.values()].find(x => x.team === team && x.role === 'spymaster' && x.id !== playerId);
      if (existing) {
        this.io.to(playerId).emit('error', { message: `${team.toUpperCase()} already has a Spymaster` });
        return;
      }
    }

    p.team = team;
    p.role = role;
    this.broadcastState();
  }

  handleStartMatch(playerId) {
    if (this.state !== 'team_selection') return;
    if (playerId !== this.room.hostId) {
      this.io.to(playerId).emit('error', { message: 'Only host can start the match' });
      return;
    }

    // Validate teams
    const reds = [...this.players.values()].filter(x => x.team === 'red');
    const blues = [...this.players.values()].filter(x => x.team === 'blue');

    if (reds.length < 1 || blues.length < 1) {
      this.io.to(playerId).emit('error', { message: 'Both teams need at least 1 player' });
      return;
    }

    this.setupBoard();
    this.state = 'playing';
    this.broadcastState();
    
    this.room.players.forEach(p => {
      this.sendPrivateBoard(p.id);
    });
  }

  setupBoard() {
    const words = wordBank.getRandomWords(25);
    
    // Determine who goes first (random)
    this.currentTurn = Math.random() < 0.5 ? 'red' : 'blue';
    this.turnPhase = 'clue';
    this.currentClue = null;
    this.guessesLeft = 0;

    const firstColor = this.currentTurn;
    const secondColor = firstColor === 'red' ? 'blue' : 'red';
    
    this.totalToWin = {
      [firstColor]: 9,
      [secondColor]: 8
    };
    this.score = { red: 0, blue: 0 };

    let colors = [];
    for(let i=0; i<9; i++) colors.push(firstColor);
    for(let i=0; i<8; i++) colors.push(secondColor);
    colors.push('black'); // Assassin
    for(let i=0; i<7; i++) colors.push('neutral');
    
    // Shuffle colors
    colors.sort(() => Math.random() - 0.5);

    this.board = words.map((w, i) => ({
      index: i,
      word: w.toUpperCase(),
      color: colors[i],
      revealed: false
    }));
  }

  handleSubmitClue(playerId, word, count) {
    if (this.state !== 'playing' || this.turnPhase !== 'clue') return;
    const p = this.players.get(playerId);
    
    if (!p || p.team !== this.currentTurn || p.role !== 'spymaster') {
      this.io.to(playerId).emit('error', { message: "It's not your turn or you are not a Spymaster." });
      return;
    }

    const c = parseInt(count);
    if (isNaN(c) || c < 0) {
      this.io.to(playerId).emit('error', { message: 'Invalid clue count.' });
      return;
    }

    if (!word || word.trim().length === 0) {
      this.io.to(playerId).emit('error', { message: 'Clue word cannot be empty.' });
      return;
    }

    // Optionally check if clue is a word on the board (not allowed)
    const upperWord = word.trim().toUpperCase();
    if (this.board.some(c => !c.revealed && c.word === upperWord)) {
      this.io.to(playerId).emit('error', { message: 'Clue cannot be an unrevealed word on the board.' });
      return;
    }

    this.currentClue = { word: upperWord, count: c };
    this.guessesLeft = c === 0 ? 99 : c + 1; // 0 or unlimited -> allow up to 99
    this.turnPhase = 'guess';

    this.broadcast('codenames_clue_given', { team: this.currentTurn, clue: this.currentClue, guessesLeft: this.guessesLeft });
    this.broadcast('sound_event', { type: 'codenames_clue_given' });
    this.broadcastState();
  }

  handleClickCard(playerId, cardIndex) {
    if (this.state !== 'playing' || this.turnPhase !== 'guess') return;
    const p = this.players.get(playerId);
    
    if (!p || p.team !== this.currentTurn || p.role !== 'operative') {
      return; // Ignore clicks from wrong people silently
    }

    const card = this.board[cardIndex];
    if (!card || card.revealed) return;

    card.revealed = true;
    this.guessesLeft--;

    this.broadcast('codenames_card_revealed', {
      cardIndex,
      card: { ...card }, // Send full card now
      guesserName: p.name,
      team: this.currentTurn
    });
    this.broadcast('sound_event', { type: 'codenames_card_revealed' });

    if (card.color === 'black') {
      // Assassin! Game over, other team wins
      this.winner = this.currentTurn === 'red' ? 'blue' : 'red';
      this.endGame(`${p.name} clicked the Assassin! ${this.winner.toUpperCase()} Team wins!`);
    } else if (card.color === this.currentTurn) {
      // Correct guess
      this.score[this.currentTurn]++;
      if (this.score[this.currentTurn] >= this.totalToWin[this.currentTurn]) {
        this.winner = this.currentTurn;
        this.endGame(`${this.winner.toUpperCase()} Team found all their agents!`);
      } else if (this.guessesLeft <= 0) {
        this.switchTurn();
      } else {
        this.broadcastState();
      }
    } else {
      // Wrong guess (Neutral or Enemy)
      if (card.color === 'red' || card.color === 'blue') {
        this.score[card.color]++;
        if (this.score[card.color] >= this.totalToWin[card.color]) {
          this.winner = card.color;
          this.endGame(`Enemy found their last agent! ${this.winner.toUpperCase()} Team wins!`);
          return;
        }
      }
      this.switchTurn();
    }
  }

  handleEndGuessing(playerId) {
    if (this.state !== 'playing' || this.turnPhase !== 'guess') return;
    const p = this.players.get(playerId);
    if (!p || p.team !== this.currentTurn || p.role !== 'operative') return;

    this.broadcast('codenames_turn_ended', { team: this.currentTurn, playerName: p.name });
    this.switchTurn();
  }

  switchTurn() {
    this.currentTurn = this.currentTurn === 'red' ? 'blue' : 'red';
    this.turnPhase = 'clue';
    this.currentClue = null;
    this.guessesLeft = 0;
    this.broadcastState();
  }

  endGame(reason) {
    this.state = 'game_over';
    this.broadcastState();
    this.broadcast('codenames_game_over', { winner: this.winner, reason });
    this.broadcast('sound_event', { type: 'codenames_game_over' });
  }

  getPublicBoard() {
    return this.board.map(c => ({
      index: c.index,
      word: c.word,
      color: c.revealed ? c.color : null,
      revealed: c.revealed
    }));
  }

  getPrivateBoard() {
    return this.board;
  }

  sendPrivateBoard(playerId) {
    const p = this.players.get(playerId);
    if (!p) return;

    if (this.state === 'playing' && p.role === 'spymaster') {
      this.io.to(playerId).emit('codenames_board', { board: this.getPrivateBoard(), isSpymaster: true });
    } else {
      this.io.to(playerId).emit('codenames_board', { board: this.getPublicBoard(), isSpymaster: false });
    }
  }

  broadcastState() {
    const stateData = {
      state: this.state,
      players: Array.from(this.players.values()),
      currentTurn: this.currentTurn,
      turnPhase: this.turnPhase,
      currentClue: this.currentClue,
      guessesLeft: this.guessesLeft,
      score: this.score,
      totalToWin: this.totalToWin,
      winner: this.winner
    };

    this.broadcast('codenames_state', stateData);
    
    // Also re-send board to everyone in case of state change (like game over where everyone sees everything)
    if (this.state === 'game_over') {
      this.broadcast('codenames_board', { board: this.getPrivateBoard(), isSpymaster: true });
    } else if (this.state === 'playing') {
      this.room.players.forEach(p => this.sendPrivateBoard(p.id));
    }
  }

  broadcast(event, data) {
    this.io.to(this.room.code).emit(event, data);
  }

  getState() {
    // Only used for initial reconnect
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
      
      setTimeout(() => {
        this.broadcastState();
        if (this.state === 'playing' || this.state === 'game_over') {
           this.sendPrivateBoard(newId);
        }
      }, 500);
      return true;
    }
    return false;
  }

  handleReconnectTimeout(playerId) {
    // No elimination in codenames
  }
}

module.exports = CodenamesEngine;
