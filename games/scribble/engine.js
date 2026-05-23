const wordBank = require('../common/wordbank');

function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

class ScribbleEngine {
  constructor(room, io) {
    this.room = room;
    this.io = io;
    this.state = 'lobby'; // lobby, drawing, round_over, game_over
    this.players = [];
    
    this.round = 1;
    this.maxRounds = 3;
    this.drawerIndex = 0;
    this.currentWord = '';
    this.drawTimeLeft = 0;
    this.timerInterval = null;
    
    this.strokes = [];
    this.correctGuessers = new Set();
    
    // Convert room players to scribble players with scores
    for (const [id, rp] of this.room.players.entries()) {
      this.players.push({
        id: rp.id,
        name: rp.name,
        score: 0,
        isConnected: rp.isConnected
      });
    }
  }

  startGame() {
    this.state = 'drawing';
    this.round = 1;
    this.drawerIndex = 0;
    
    // Wait 3 seconds to allow clients to load the UI before starting the first turn
    setTimeout(() => {
      this.startTurn();
    }, 3000);
    
    return { success: true };
  }

  startTurn() {
    this.state = 'drawing';
    this.strokes = [];
    this.correctGuessers.clear();
    this.currentWord = wordBank.getRandomWord();
    this.drawTimeLeft = 60; // 60 seconds

    const drawer = this.players[this.drawerIndex];

    this.broadcast('scribble_turn_start', {
      drawerId: drawer.id,
      drawerName: drawer.name,
      round: this.round,
      maxRounds: this.maxRounds,
      wordLength: this.currentWord.length,
      timeLimit: this.drawTimeLeft,
      scores: this.getScores()
    });
    this.broadcast('sound_event', { type: 'scribble_turn_start' });

    // Send the actual word only to the drawer
    this.io.to(drawer.id).emit('scribble_your_turn', {
      word: this.currentWord
    });

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.drawTimeLeft--;
      if (this.drawTimeLeft <= 0) {
        this.endTurn(false);
      } else if (this.drawTimeLeft % 10 === 0) {
        // Sync timer every 10s just in case
        this.broadcast('scribble_timer_sync', { timeLeft: this.drawTimeLeft });
      }
    }, 1000);
  }

  endTurn(allGuessed) {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.state = 'round_over';

    this.broadcast('scribble_turn_over', {
      word: this.currentWord,
      allGuessed: allGuessed,
      scores: this.getScores()
    });
    this.broadcast('sound_event', { type: 'scribble_turn_over' });

    setTimeout(() => {
      this.drawerIndex++;
      if (this.drawerIndex >= this.players.length) {
        this.drawerIndex = 0;
        this.round++;
      }

      if (this.round > this.maxRounds) {
        this.endGame();
      } else {
        this.startTurn();
      }
    }, 5000); // 5 second break between turns
  }

  endGame() {
    this.state = 'game_over';
    
    // Sort players by score
    const rankings = [...this.players].sort((a, b) => b.score - a.score).map((p, idx) => ({
      position: idx + 1,
      names: p.name,
      stats: {
        points: p.score
      }
    }));

    this.broadcast('game_over', { rankings });
  }

  handleDrawStroke(playerId, stroke) {
    if (this.state !== 'drawing') return;
    const drawer = this.players[this.drawerIndex];
    if (drawer.id !== playerId) return;

    this.strokes.push(stroke);
    // Broadcast to everyone else
    this.room.players.forEach(p => {
      if (p.id !== playerId && p.isConnected) {
        this.io.to(p.id).emit('scribble_draw_stroke', { stroke });
      }
    });
  }

  handleClearCanvas(playerId) {
    if (this.state !== 'drawing') return;
    const drawer = this.players[this.drawerIndex];
    if (drawer.id !== playerId) return;

    this.strokes = [];
    this.broadcast('scribble_clear_canvas', {});
  }

  handleGuess(playerId, guess) {
    if (this.state !== 'drawing') return;
    
    const drawer = this.players[this.drawerIndex];
    if (playerId === drawer.id) return; // Drawer can't guess
    if (this.correctGuessers.has(playerId)) return; // Already guessed

    const player = this.players.find(p => p.id === playerId);
    if (!player) return;

    const normalizedGuess = guess.trim().toLowerCase();
    const normalizedWord = this.currentWord.toLowerCase();

    if (normalizedGuess === normalizedWord) {
      // Correct!
      this.correctGuessers.add(playerId);
      
      // Calculate points based on time left
      const points = Math.max(10, Math.floor((this.drawTimeLeft / 60) * 100));
      player.score += points;
      
      // Drawer gets some points too
      drawer.score += 10;

      this.broadcast('scribble_correct_guess', {
        playerId: playerId,
        playerName: player.name,
        points: points
      });
      this.broadcast('sound_event', { type: 'scribble_correct_guess' });

      // Check if everyone guessed
      const activeGuessers = this.players.filter(p => p.id !== drawer.id && p.isConnected);
      if (this.correctGuessers.size >= activeGuessers.length) {
        this.endTurn(true);
      }
    } else {
      // Check for close guess
      const distance = levenshteinDistance(normalizedGuess, normalizedWord);
      
      // A guess is "close" if it's within 1 or 2 typos, relative to word length
      const isClose = (normalizedWord.length > 4 && distance <= 2) || (normalizedWord.length <= 4 && distance === 1);

      if (isClose) {
        this.io.to(playerId).emit('scribble_close_guess', { guess: guess });
      }

      // Broadcast the chat message to everyone
      this.broadcast('scribble_chat_message', {
        playerName: player.name,
        message: guess,
        isClose: isClose
      });
    }
  }

  getScores() {
    return this.players.map(p => ({
      id: p.id,
      name: p.name,
      score: p.score
    }));
  }

  broadcast(event, data) {
    this.io.to(this.room.code).emit(event, data);
  }

  getState() {
    return {
      state: this.state,
      round: this.round,
      maxRounds: this.maxRounds,
      drawerId: this.players[this.drawerIndex]?.id,
      drawTimeLeft: this.drawTimeLeft,
      scores: this.getScores(),
      strokes: this.strokes
    };
  }

  handleDisconnect(playerId) {
    const p = this.players.find(x => x.id === playerId);
    if (p) p.isConnected = false;
    
    // If it was the drawer who disconnected, end the turn
    if (this.state === 'drawing' && this.players[this.drawerIndex]?.id === playerId) {
      this.endTurn(false);
    }
  }

  handleReconnect(oldId, newId) {
    const p = this.players.find(x => x.id === oldId);
    if (p) {
      p.id = newId;
      p.isConnected = true;
      return true;
    }
    return false;
  }

  handleReconnectTimeout(playerId) {
    // We don't eliminate players in Scribble, they just don't get points
  }
}

module.exports = ScribbleEngine;
