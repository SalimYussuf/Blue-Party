class HotJokerEngine {
  constructor(room, io) {
    this.room = room;
    this.io = io;
    this.state = 'lobby';
    this.jokerHolderId = null;
    this.bombTimer = null;
    this.roundTimeout = null;
  }

  startGame() {
    this.state = 'playing';
    this.room.state = 'in_game';
    
    // Reset players
    for (const player of this.room.players.values()) {
      player.shotsTaken = 0;
      player.isEliminated = false;
    }

    this.startRound();
    return { success: true };
  }

  startRound() {
    const activePlayers = this.room.getActivePlayers();
    if (activePlayers.length <= 1) {
      this.endGame();
      return;
    }

    // Pick random holder
    const holder = activePlayers[Math.floor(Math.random() * activePlayers.length)];
    this.jokerHolderId = holder.id;

    // Set random timer between 10 and 30 seconds
    const duration = Math.floor(Math.random() * 20000) + 10000;
    
    this.io.to(this.room.code).emit('hotjoker_round_start', {
      jokerHolderId: this.jokerHolderId,
      players: this.getPlayersInfo()
    });

    if (this.roundTimeout) clearTimeout(this.roundTimeout);
    this.roundTimeout = setTimeout(() => {
      this.explodeBomb();
    }, duration);
  }

  passJoker(playerId, targetId) {
    if (this.state !== 'playing') return { success: false, error: 'Game not active' };
    if (this.jokerHolderId !== playerId) return { success: false, error: 'You do not hold the joker' };
    
    const target = this.room.getPlayer(targetId);
    if (!target || target.isEliminated) return { success: false, error: 'Invalid target' };
    
    if (targetId === playerId) return { success: false, error: 'Cannot pass to yourself' };

    this.jokerHolderId = targetId;
    
    this.io.to(this.room.code).emit('hotjoker_passed', {
      fromId: playerId,
      toId: targetId
    });
    this.io.to(this.room.code).emit('sound_event', { type: 'hotjoker_passed' });

    return { success: true };
  }

  explodeBomb() {
    const victim = this.room.getPlayer(this.jokerHolderId);
    if (victim) {
      // Pull trigger using the common logic from player
      const fired = victim.pullTrigger();
      
      this.io.to(this.room.code).emit('hotjoker_exploded', {
        victimId: victim.id,
        victimName: victim.name,
        shotsTaken: victim.shotsTaken,
        isEliminated: victim.isEliminated
      });
      this.io.to(this.room.code).emit('sound_event', { type: 'hotjoker_exploded' });

      setTimeout(() => {
        this.startRound();
      }, 3000);
    }
  }

  getPlayersInfo() {
    return this.room.getActivePlayers().map(p => ({
      id: p.id,
      name: p.name,
      shotsTaken: p.shotsTaken,
      isEliminated: p.isEliminated,
      teamIndex: p.teamIndex
    }));
  }

  endGame() {
    this.state = 'game_over';
    this.room.state = 'waiting';
    if (this.roundTimeout) clearTimeout(this.roundTimeout);
    
    const activePlayers = this.room.getActivePlayers();
    const winner = activePlayers.length === 1 ? activePlayers[0] : null;

    this.io.to(this.room.code).emit('hotjoker_game_over', {
      winnerId: winner ? winner.id : null,
      winnerName: winner ? winner.name : null,
    });
  }

  handleDisconnect(playerId) {
    if (playerId === this.jokerHolderId) {
      // If the disconnected player holds the joker, give it to someone else immediately
      const activePlayers = this.room.getActivePlayers().filter(p => p.id !== playerId);
      if (activePlayers.length > 0) {
        this.jokerHolderId = activePlayers[Math.floor(Math.random() * activePlayers.length)].id;
        this.io.to(this.room.code).emit('hotjoker_passed', {
          fromId: playerId,
          toId: this.jokerHolderId
        });
      }
    }
  }

  handleReconnectTimeout(playerId) {
    const p = this.room.getPlayer(playerId);
    if (p) p.isEliminated = true;
    // Check if game over
    if (this.room.getActivePlayers().length <= 1) {
      this.endGame();
    }
  }

  handleReconnect(oldId, newId) {
    if (this.jokerHolderId === oldId) {
      this.jokerHolderId = newId;
    }
    return true;
  }

  getState() {
    return {
      jokerHolderId: this.jokerHolderId,
    };
  }
}

module.exports = HotJokerEngine;
