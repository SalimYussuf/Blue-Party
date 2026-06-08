/**
 * Secret Hitler engine for Bluewongo.
 *
 * This is a native JavaScript port of the original Java state machine from
 * Secret-Hitler-Online-development/backend/src/main/java/game/SecretHitlerGame.java,
 * adapted to Bluewongo socket events and room lifecycle hooks.
 */

const MIN_PLAYERS = 5;
const MAX_PLAYERS = 10;
const FASCIST_POLICIES_IN_DECK = 11;
const LIBERAL_POLICIES_IN_DECK = 6;
const FASCIST_POLICIES_TO_WIN = 6;
const LIBERAL_POLICIES_TO_WIN = 5;
const MAX_FAILED_ELECTIONS = 3;
const MIN_DRAW_DECK_SIZE = 3;
const PRESIDENT_DRAW_SIZE = 3;
const CHANCELLOR_DRAW_SIZE = 2;

const NUM_FASCISTS_FOR_PLAYERS = {
  5: 1,
  6: 1,
  7: 2,
  8: 2,
  9: 3,
  10: 3,
};

class SecretHitlerEngine {
  constructor(room, io) {
    this.room = room;
    this.io = io;

    this.players = new Map();
    this.playerOrder = [];

    for (const [id, rp] of this.room.players.entries()) {
      this.players.set(id, {
        id,
        name: rp.name,
        role: null,
        alive: true,
        isConnected: rp.isConnected !== false,
        investigated: false,
      });
      this.playerOrder.push(id);
    }

    this.resetRuntimeState();
  }

  resetRuntimeState() {
    this.state = 'setup';
    this.lastState = 'setup';
    this.round = 1;

    this.drawPile = [];
    this.discardPile = [];
    this.legislativePolicies = [];

    this.liberalPolicies = 0;
    this.fascistPolicies = 0;
    this.electionTracker = 0;

    this.currentPresident = null;
    this.currentChancellor = null;
    this.lastPresident = null;
    this.lastChancellor = null;
    this.nextPresident = null;
    this.electedPresident = null;
    this.target = null;

    this.voteMap = {};
    this.didElectionTrackerAdvance = false;
    this.didVetoOccurThisTurn = false;
    this.lastEnactedPolicy = null;
    this.presidentialPower = null;

    this.winner = null;
    this.winReason = null;
  }

  startGame() {
    const playerCount = this.players.size;
    if (playerCount < MIN_PLAYERS) {
      return { success: false, error: `Need at least ${MIN_PLAYERS} players` };
    }
    if (playerCount > MAX_PLAYERS) {
      return { success: false, error: `Maximum ${MAX_PLAYERS} players` };
    }

    this.resetRuntimeState();
    for (const player of this.players.values()) {
      player.role = 'liberal';
      player.alive = true;
      player.investigated = false;
      player.isConnected = true;
    }

    this.resetDeck();
    this.assignRoles();

    this.currentPresident = this.getFirstLivingPlayer();
    this.currentChancellor = null;
    this.state = 'role_reveal';
    this.broadcastState();

    setTimeout(() => {
      if (this.state === 'role_reveal') {
        this.setState('chancellor_nomination');
        this.broadcastState();
      }
    }, 3000);

    return { success: true };
  }

  resetDeck() {
    this.drawPile = [];
    this.discardPile = [];

    for (let i = 0; i < FASCIST_POLICIES_IN_DECK; i++) {
      this.drawPile.push('fascist');
    }
    for (let i = 0; i < LIBERAL_POLICIES_IN_DECK; i++) {
      this.drawPile.push('liberal');
    }

    this.drawPile = this.shuffle(this.drawPile);
  }

  assignRoles() {
    const ids = this.shuffle(this.playerOrder);
    const hitlerId = ids[0];
    const numFascists = NUM_FASCISTS_FOR_PLAYERS[this.players.size];

    this.players.get(hitlerId).role = 'hitler';
    for (let i = 1; i <= numFascists; i++) {
      this.players.get(ids[i]).role = 'fascist';
    }
  }

  handleNominateChancellor(playerId, chancellorId) {
    if (this.state !== 'chancellor_nomination') {
      return this.emitError(playerId, 'Cannot nominate a chancellor right now.');
    }
    if (playerId !== this.currentPresident) {
      return this.emitError(playerId, 'Only the president can nominate a chancellor.');
    }
    if (!this.players.has(chancellorId)) {
      return this.emitError(playerId, 'That player is not in the game.');
    }
    if (playerId === chancellorId) {
      return this.emitError(playerId, 'President cannot nominate themselves.');
    }

    const candidate = this.players.get(chancellorId);
    if (!candidate.alive) {
      return this.emitError(playerId, 'Dead players cannot be nominated.');
    }
    if (chancellorId === this.lastChancellor || (chancellorId === this.lastPresident && this.getLivingPlayerCount() > 5)) {
      return this.emitError(playerId, 'That player is term-limited from becoming chancellor.');
    }

    this.didElectionTrackerAdvance = false;
    this.currentChancellor = chancellorId;
    this.voteMap = {};
    this.setState('voting');
    this.broadcastState();
    return true;
  }

  handleCastVote(playerId, voteYes) {
    if (this.state !== 'voting') {
      return this.emitError(playerId, 'There is no active vote.');
    }
    const voter = this.players.get(playerId);
    if (!voter || !voter.alive) {
      return this.emitError(playerId, 'Only living players can vote.');
    }
    if (Object.prototype.hasOwnProperty.call(this.voteMap, playerId)) {
      return this.emitError(playerId, 'You already voted.');
    }

    this.voteMap[playerId] = !!voteYes;

    if (this.haveAllLivingPlayersVoted()) {
      this.setState('voting_results');
      this.broadcastState();
      setTimeout(() => {
        this.resolveVote();
        this.broadcastState();
      }, 5000);
      return true;
    }

    this.broadcastState();
    return true;
  }

  resolveVote() {
    const livingPlayers = this.getLivingPlayers();
    const yesVotes = livingPlayers.reduce((count, player) => count + (this.voteMap[player.id] ? 1 : 0), 0);
    const votePassed = yesVotes / livingPlayers.length > 0.5;

    if (votePassed) {
      this.lastChancellor = this.currentChancellor;
      this.lastPresident = this.currentPresident;

      if (this.players.get(this.currentChancellor).role === 'hitler' && this.fascistPolicies >= 3) {
        this.finishGame('fascist', 'hitler_chancellor');
      } else {
        this.startLegislativeSession();
      }
    } else {
      this.advanceElectionTracker();
    }
  }

  startLegislativeSession() {
    this.setState('legislative_president');
    this.ensureDrawDeck();
    this.legislativePolicies = [];

    for (let i = 0; i < PRESIDENT_DRAW_SIZE; i++) {
      this.legislativePolicies.push(this.drawPolicy());
    }
  }

  handlePresidentDiscard(playerId, cardIndex) {
    if (this.state !== 'legislative_president') {
      return this.emitError(playerId, 'The president is not choosing policies right now.');
    }
    if (playerId !== this.currentPresident) {
      return this.emitError(playerId, 'Only the president can discard a policy.');
    }
    if (!Number.isInteger(cardIndex) || cardIndex < 0 || cardIndex >= PRESIDENT_DRAW_SIZE) {
      return this.emitError(playerId, 'Invalid policy selection.');
    }

    const discarded = this.legislativePolicies.splice(cardIndex, 1)[0];
    this.discardPolicy(discarded);
    this.setState('legislative_chancellor');
    this.broadcastState();
    return true;
  }

  handleChancellorEnact(playerId, cardIndex) {
    if (this.state !== 'legislative_chancellor') {
      return this.emitError(playerId, 'The chancellor is not choosing policies right now.');
    }
    if (playerId !== this.currentChancellor) {
      return this.emitError(playerId, 'Only the chancellor can enact a policy.');
    }
    if (!Number.isInteger(cardIndex) || cardIndex < 0 || cardIndex >= CHANCELLOR_DRAW_SIZE) {
      return this.emitError(playerId, 'Invalid policy selection.');
    }

    const enacted = this.legislativePolicies.splice(cardIndex, 1)[0];
    while (this.legislativePolicies.length > 0) {
      this.discardPolicy(this.legislativePolicies.shift());
    }

    this.didVetoOccurThisTurn = false;
    this.lastEnactedPolicy = enacted;
    this.setState('policy_enacted');
    this.broadcastState();

    setTimeout(() => {
      this.enactPolicy(enacted);
      this.onEnactPolicy(enacted);
      this.broadcastState();
    }, 4000);

    return true;
  }

  handleChancellorVeto(playerId) {
    if (this.state !== 'legislative_chancellor') {
      return this.emitError(playerId, 'Cannot veto right now.');
    }
    if (playerId !== this.currentChancellor) {
      return this.emitError(playerId, 'Only the chancellor can propose a veto.');
    }
    if (this.fascistPolicies !== 5) {
      return this.emitError(playerId, 'Veto power unlocks only at five fascist policies.');
    }
    if (this.didVetoOccurThisTurn) {
      return this.emitError(playerId, 'Veto cannot be proposed again this turn.');
    }

    this.didVetoOccurThisTurn = true;
    this.setState('legislative_president_veto');
    this.broadcastState();
    return true;
  }

  handlePresidentVetoResponse(playerId, allowVeto) {
    if (this.state !== 'legislative_president_veto') {
      return this.emitError(playerId, 'There is no veto request to answer.');
    }
    if (playerId !== this.currentPresident) {
      return this.emitError(playerId, 'Only the president can answer a veto request.');
    }

    if (allowVeto) {
      while (this.legislativePolicies.length > 0) {
        this.discardPolicy(this.legislativePolicies.shift());
      }
      this.didVetoOccurThisTurn = false;
      this.advanceElectionTracker();
    } else {
      this.setState('legislative_chancellor');
    }

    this.broadcastState();
    return true;
  }

  handlePeekCards(playerId) {
    if (this.state !== 'presidential_power_peek') {
      return this.emitError(playerId, 'The president cannot peek right now.');
    }
    if (playerId !== this.currentPresident) {
      return this.emitError(playerId, 'Only the president can peek.');
    }

    this.io.to(playerId).emit('peek_result', { cards: this.drawPile.slice(0, 3) });
    this.concludePresidentialActions();
    this.broadcastState();
    return true;
  }

  handleInvestigatePlayer(playerId, targetId) {
    if (this.state !== 'presidential_power_investigate') {
      return this.emitError(playerId, 'The president cannot investigate right now.');
    }
    if (playerId !== this.currentPresident) {
      return this.emitError(playerId, 'Only the president can investigate.');
    }

    const target = this.players.get(targetId);
    if (!target) {
      return this.emitError(playerId, 'That player is not in the game.');
    }
    if (!target.alive) {
      return this.emitError(playerId, 'Dead players cannot be investigated.');
    }
    if (target.investigated) {
      return this.emitError(playerId, 'That player has already been investigated.');
    }

    target.investigated = true;
    this.target = targetId;

    const party = target.role === 'liberal' ? 'liberal' : 'fascist';
    this.io.to(playerId).emit('investigation_result', {
      playerId: targetId,
      playerName: target.name,
      role: party,
    });

    this.concludePresidentialActions();
    this.broadcastState();
    return true;
  }

  handleExecutePlayer(playerId, targetId) {
    if (this.state !== 'presidential_power_execute') {
      return this.emitError(playerId, 'The president cannot execute right now.');
    }
    if (playerId !== this.currentPresident) {
      return this.emitError(playerId, 'Only the president can execute a player.');
    }

    const target = this.players.get(targetId);
    if (!target) {
      return this.emitError(playerId, 'That player is not in the game.');
    }
    if (!target.alive) {
      return this.emitError(playerId, 'That player is already dead.');
    }

    target.alive = false;
    this.target = targetId;

    if (target.role === 'hitler') {
      this.finishGame('liberal', 'executed_hitler');
    } else {
      this.concludePresidentialActions();
    }

    this.broadcastState();
    return true;
  }

  handleCallElection(playerId, nextPresidentId) {
    if (this.state !== 'presidential_power_election') {
      return this.emitError(playerId, 'The president cannot call a special election right now.');
    }
    if (playerId !== this.currentPresident) {
      return this.emitError(playerId, 'Only the president can call a special election.');
    }
    if (nextPresidentId === this.currentPresident) {
      return this.emitError(playerId, 'President cannot elect themselves during a special election.');
    }

    const chosen = this.players.get(nextPresidentId);
    if (!chosen) {
      return this.emitError(playerId, 'That player is not in the game.');
    }
    if (!chosen.alive) {
      return this.emitError(playerId, 'Dead players cannot be elected president.');
    }

    this.target = nextPresidentId;
    this.nextPresident = this.getNextActivePlayer(this.currentPresident);
    this.electedPresident = nextPresidentId;
    this.concludePresidentialActions();
    this.broadcastState();
    return true;
  }

  advanceElectionTracker() {
    this.didElectionTrackerAdvance = true;
    this.electionTracker += 1;

    if (this.electionTracker >= MAX_FAILED_ELECTIONS) {
      this.ensureDrawDeck();
      const enacted = this.drawPolicy();
      this.enactPolicy(enacted);
      this.electionTracker = 0;
      this.onEnactPolicy(enacted);
    } else {
      this.concludePresidentialActions();
    }
  }

  onEnactPolicy(policyType) {
    this.electionTracker = 0;
    this.lastEnactedPolicy = policyType;
    this.ensureDrawDeck();

    if (this.checkPolicyVictory()) {
      return;
    }

    if (this.didElectionTrackerAdvance) {
      this.lastChancellor = null;
      this.lastPresident = null;
      this.didElectionTrackerAdvance = false;
      this.concludePresidentialActions();
      return;
    }

    const power = this.getActivatedPower(policyType);
    this.presidentialPower = power;

    switch (power) {
      case 'peek':
        this.setState('presidential_power_peek');
        break;
      case 'investigate':
        this.setState('presidential_power_investigate');
        break;
      case 'execute':
        this.setState('presidential_power_execute');
        break;
      case 'election':
        this.setState('presidential_power_election');
        break;
      default:
        this.presidentialPower = null;
        this.concludePresidentialActions();
    }
  }

  concludePresidentialActions() {
    if (this.state === 'game_over') return;
    this.endPresidentialTerm();
  }

  endPresidentialTerm() {
    if (this.electedPresident) {
      this.currentPresident = this.electedPresident;
      this.electedPresident = null;
    } else if (this.nextPresident) {
      this.currentPresident = this.nextPresident;
      while (this.currentPresident && !this.players.get(this.currentPresident)?.alive) {
        this.currentPresident = this.getNextActivePlayer(this.currentPresident);
      }
      this.nextPresident = null;
    } else {
      this.currentPresident = this.getNextActivePlayer(this.currentPresident);
    }

    this.currentChancellor = null;
    this.legislativePolicies = [];
    this.voteMap = {};
    this.presidentialPower = null;
    this.round += 1;

    if (!this.currentPresident) {
      this.finishGame(this.fascistPolicies >= this.liberalPolicies ? 'fascist' : 'liberal', 'players_eliminated');
    } else {
      this.setState('chancellor_nomination');
    }
  }

  enactPolicy(policyType) {
    if (policyType === 'liberal') {
      this.liberalPolicies += 1;
    } else {
      this.fascistPolicies += 1;
    }
    this.lastEnactedPolicy = policyType;
  }

  checkPolicyVictory() {
    if (this.liberalPolicies >= LIBERAL_POLICIES_TO_WIN) {
      this.finishGame('liberal', 'enacted_liberal_policies');
      return true;
    }
    if (this.fascistPolicies >= FASCIST_POLICIES_TO_WIN) {
      this.finishGame('fascist', 'enacted_fascist_policies');
      return true;
    }
    return false;
  }

  finishGame(winner, reason) {
    this.winner = winner;
    this.winReason = reason;
    this.setState('game_over');
  }

  getActivatedPower(policyType) {
    if (policyType !== 'fascist') return null;

    const count = this.fascistPolicies;
    const players = this.players.size;

    if (players <= 6) {
      if (count === 3) return 'peek';
      if (count === 4 || count === 5) return 'execute';
      return null;
    }

    if (players <= 8) {
      if (count === 2) return 'investigate';
      if (count === 3) return 'election';
      if (count === 4 || count === 5) return 'execute';
      return null;
    }

    if (count === 1 || count === 2) return 'investigate';
    if (count === 3) return 'election';
    if (count === 4 || count === 5) return 'execute';
    return null;
  }

  ensureDrawDeck() {
    if (this.drawPile.length >= MIN_DRAW_DECK_SIZE) return;
    this.drawPile = this.drawPile.concat(this.shuffle(this.discardPile));
    this.discardPile = [];
  }

  drawPolicy() {
    if (this.drawPile.length === 0) {
      this.ensureDrawDeck();
    }
    return this.drawPile.shift();
  }

  discardPolicy(policyType) {
    if (policyType) {
      this.discardPile.unshift(policyType);
    }
  }

  haveAllLivingPlayersVoted() {
    return this.getLivingPlayers().every(player => Object.prototype.hasOwnProperty.call(this.voteMap, player.id));
  }

  getLivingPlayers() {
    return this.playerOrder
      .map(id => this.players.get(id))
      .filter(player => player && player.alive);
  }

  getLivingPlayerCount() {
    return this.getLivingPlayers().length;
  }

  getFirstLivingPlayer() {
    return this.getLivingPlayers()[0]?.id || null;
  }

  getNextActivePlayer(playerId) {
    if (!playerId || this.playerOrder.length === 0) return null;
    const start = this.playerOrder.indexOf(playerId);
    if (start === -1) return this.getFirstLivingPlayer();

    for (let i = 1; i <= this.playerOrder.length; i++) {
      const id = this.playerOrder[(start + i) % this.playerOrder.length];
      const player = this.players.get(id);
      if (player && player.alive) {
        return id;
      }
    }

    return null;
  }

  setState(nextState) {
    this.lastState = this.state;
    this.state = nextState;
  }

  emitError(playerId, message) {
    this.io.to(playerId).emit('error', { message });
    return false;
  }

  broadcastState() {
    for (const player of this.players.values()) {
      if (player.isConnected !== false) {
        this.io.to(player.id).emit('game_state', this.getPlayerState(player.id));
      }
    }
  }

  getPublicState() {
    const livingPlayers = this.getLivingPlayers();
    const voteCount = livingPlayers.reduce((acc, player) => {
      if (Object.prototype.hasOwnProperty.call(this.voteMap, player.id)) {
        acc.total += 1;
        if (this.voteMap[player.id]) acc.yes += 1;
        else acc.no += 1;
      }
      return acc;
    }, { total: 0, yes: 0, no: 0 });

    return {
      state: this.state,
      lastState: this.lastState,
      round: this.round,
      liberalPolicies: this.liberalPolicies,
      fascistPolicies: this.fascistPolicies,
      electionTracker: this.electionTracker,
      currentPresident: this.currentPresident,
      currentChancellor: this.currentChancellor,
      lastPresident: this.lastPresident,
      lastChancellor: this.lastChancellor,
      target: this.target,
      voteMap: this.voteMap,
      voteCount,
      presidentialPower: this.presidentialPower,
      vetoProposed: this.state === 'legislative_president_veto',
      didElectionTrackerAdvance: this.didElectionTrackerAdvance,
      didVetoOccurThisTurn: this.didVetoOccurThisTurn,
      lastEnactedPolicy: this.lastEnactedPolicy,
      drawSize: this.drawPile.length,
      discardSize: this.discardPile.length,
      presidentCardCount: this.state === 'legislative_president' ? this.legislativePolicies.length : 0,
      chancellorCardCount: this.state === 'legislative_chancellor' || this.state === 'legislative_president_veto'
        ? this.legislativePolicies.length
        : 0,
      winner: this.winner,
      winReason: this.winReason,
      playerCount: this.players.size,
      playersAlive: livingPlayers.length,
    };
  }

  getPlayerState(playerId) {
    const viewer = this.players.get(playerId);
    const publicState = this.getPublicState();
    const myCards = this.getCardsForPlayer(playerId);

    return {
      ...publicState,
      myRole: viewer?.role || null,
      myParty: viewer ? this.getParty(viewer.role) : null,
      fascistIntel: this.getFascistIntel(playerId),
      myCards,
      players: this.playerOrder.map((id, index) => {
        const player = this.players.get(id);
        const knownRole = this.getKnownRoleForViewer(playerId, id);
        const hasVoted = Object.prototype.hasOwnProperty.call(this.voteMap, id);
        return {
          id,
          index,
          name: player.name,
          alive: player.alive,
          isConnected: player.isConnected,
          investigated: player.investigated,
          hasVoted,
          votedYes: this.state === 'voting' ? null : this.voteMap[id],
          role: knownRole,
          knownRole,
          party: knownRole ? this.getParty(knownRole) : null,
          isPresident: id === this.currentPresident,
          isChancellor: id === this.currentChancellor,
          isLastPresident: id === this.lastPresident,
          isLastChancellor: id === this.lastChancellor,
        };
      }),
    };
  }

  getCardsForPlayer(playerId) {
    if (this.state === 'legislative_president' && playerId === this.currentPresident) {
      return [...this.legislativePolicies];
    }
    if (
      (this.state === 'legislative_chancellor' || this.state === 'legislative_president_veto')
      && playerId === this.currentChancellor
    ) {
      return [...this.legislativePolicies];
    }
    return [];
  }

  getKnownRoleForViewer(viewerId, targetId) {
    const viewer = this.players.get(viewerId);
    const target = this.players.get(targetId);
    if (!viewer || !target) return null;
    if (viewerId === targetId || this.state === 'game_over') return target.role;

    const smallGame = this.players.size <= 6;
    if (viewer.role === 'fascist') {
      return target.role === 'fascist' || target.role === 'hitler' ? target.role : null;
    }
    if (viewer.role === 'hitler' && smallGame) {
      return target.role === 'fascist' ? target.role : null;
    }
    return null;
  }

  getFascistIntel(playerId) {
    const viewer = this.players.get(playerId);
    if (!viewer) return [];
    const smallGame = this.players.size <= 6;

    if (viewer.role !== 'fascist' && !(viewer.role === 'hitler' && smallGame)) {
      return [];
    }

    return this.playerOrder
      .map(id => this.players.get(id))
      .filter(player => {
        if (!player || player.id === playerId) return false;
        if (viewer.role === 'fascist') return player.role === 'fascist' || player.role === 'hitler';
        return player.role === 'fascist';
      })
      .map(player => ({ id: player.id, name: player.name, role: player.role }));
  }

  getParty(role) {
    if (role === 'liberal') return 'liberal';
    if (role === 'fascist' || role === 'hitler') return 'fascist';
    return null;
  }

  getPlayersInfo(forPlayerId) {
    return this.getPlayerState(forPlayerId).players;
  }

  getState() {
    return this.getPublicState();
  }

  handleDisconnect(playerId) {
    const player = this.players.get(playerId);
    if (player) {
      player.isConnected = false;
      this.broadcastState();
    }
  }

  handleReconnect(oldId, newId) {
    const player = this.players.get(oldId);
    if (!player) return false;

    const roomPlayer = this.room.getPlayer(oldId);
    if (roomPlayer) {
      roomPlayer.socketId = newId;
      roomPlayer.id = newId;
      roomPlayer.isConnected = true;
      roomPlayer.disconnectedAt = null;
      this.room.players.delete(oldId);
      this.room.players.set(newId, roomPlayer);
    }

    if (this.room.hostId === oldId) {
      this.room.hostId = newId;
    }

    player.id = newId;
    player.isConnected = true;
    this.players.delete(oldId);
    this.players.set(newId, player);
    this.playerOrder = this.playerOrder.map(id => (id === oldId ? newId : id));
    this.replacePlayerId(oldId, newId);

    setTimeout(() => this.broadcastState(), 250);
    return true;
  }

  handleReconnectTimeout(playerId) {
    const player = this.players.get(playerId);
    if (!player || this.state === 'game_over') return;

    player.isConnected = false;
    player.alive = false;

    if (player.role === 'hitler') {
      this.finishGame('liberal', 'executed_hitler');
    } else if (this.getLivingPlayerCount() < 2) {
      this.finishGame('fascist', 'players_eliminated');
    } else if (playerId === this.currentPresident || playerId === this.currentChancellor) {
      this.concludePresidentialActions();
    }

    this.broadcastState();
  }

  endGame() {
    if (this.state !== 'game_over') {
      this.finishGame(this.fascistPolicies >= this.liberalPolicies ? 'fascist' : 'liberal', 'players_eliminated');
      this.broadcastState();
    }
  }

  replacePlayerId(oldId, newId) {
    const fields = [
      'currentPresident',
      'currentChancellor',
      'lastPresident',
      'lastChancellor',
      'nextPresident',
      'electedPresident',
      'target',
    ];

    for (const field of fields) {
      if (this[field] === oldId) this[field] = newId;
    }

    if (Object.prototype.hasOwnProperty.call(this.voteMap, oldId)) {
      this.voteMap[newId] = this.voteMap[oldId];
      delete this.voteMap[oldId];
    }
  }

  shuffle(array) {
    const out = [...array];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
}

module.exports = SecretHitlerEngine;
