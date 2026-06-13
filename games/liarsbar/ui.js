/**
 * Uwongo's Bar (Liar's Bar) Client UI Module
 * Dynamically loaded when the game starts.
 */

let socket = null;
let initialized = false;
let initRetry = null;

// Local state refs (pulled from window.app.state)
function getState() { return window.app?.state || {}; }
function getSocket() { return window.app?.socket; }
function $(id) { return document.getElementById(id); }
function showToast(msg, type) { window.app?.showToast?.(msg, type); }

// Card symbols
const rankSymbols = {
  'Ace': { symbol: 'A', icon: '♠️' },
  'King': { symbol: 'K', icon: '👑' },
  'Queen': { symbol: 'Q', icon: '⚜️' },
  'Joker': { symbol: 'J', icon: '🃏' },
  'Chaos': { symbol: 'C', icon: '🌪️' },
  'Master': { symbol: 'M', icon: '🏆' }
};

const avatarColors = ['#818cf8', '#f59e0b', '#ec4899', '#10b981', '#a855f7', '#06b6d4'];
const avatarEmojis = ['🦁', '🐺', '🦊', '🐉', '🦅', '🐙', '🦈', '🐻'];

// DOM element refs (populated after DOM is built)
let els = {};

if (typeof window !== 'undefined') {
  window.initLiarsBar = initLiarsBar;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLiarsBar, { once: true });
  } else {
    initLiarsBar();
  }
}

function initLiarsBar() {
  const appSocket = getSocket();
  if (!appSocket) {
    if (!initRetry) initRetry = setTimeout(() => { initRetry = null; initLiarsBar(); }, 100);
    return;
  }

  if (initialized && socket === appSocket) {
    return;
  }

  socket = appSocket;
  initialized = true;

  // Load stylesheet if not already loaded
  if (!document.getElementById('liarsbar-style')) {
    const link = document.createElement('link');
    link.id = 'liarsbar-style';
    link.rel = 'stylesheet';
    link.href = '/games/liarsbar/style.css';
    document.head.appendChild(link);
  }

  ensureDOMStructure();
  registerSocketListeners();
}

// ===== DOM STRUCTURE =====
function ensureDOMStructure() {
  const screen = $('liars-bar-screen');
  if (!screen) return;
  if ($('casino-table-root')) {
    populateEls();
    return;
  }

  screen.innerHTML = `
    <!-- Russian Roulette Animation Container -->
    <div id="roulette-container" class="hidden">
      <div class="chamber"></div>
      <div class="glass-shatter hidden"></div>
      <div class="flash hidden"></div>
    </div>

    <!-- Spectator Banner -->
    <div class="spectator-banner hidden" id="spectator-banner">
      💀 Spectating — You have been eliminated
    </div>

    <!-- REVEAL OVERLAY -->
    <div class="reveal-overlay hidden" id="reveal-overlay">
      <div class="pile-timeline" id="pile-timeline"></div>
      <div class="reveal-title" id="reveal-title"></div>
      <div class="reveal-cards" id="reveal-cards"></div>
      <div class="reveal-result" id="reveal-result"></div>
    </div>

    <!-- REVOLVER OVERLAY -->
    <div class="revolver-overlay hidden" id="revolver-overlay">
      <div class="revolver-emoji">🔫</div>
      <div class="revolver-player" id="revolver-player"></div>
      <div class="revolver-result" id="revolver-result"></div>
    </div>

    <!-- COUNTDOWN OVERLAY -->
    <div class="countdown-overlay hidden" id="countdown-overlay">
      <div class="countdown-number" id="countdown-number">3</div>
    </div>

    <div class="casino-table" id="casino-table-root">
      <!-- Top-Right Settings -->
      <div class="top-right-settings">
        <button class="btn-icon gear-icon" id="btn-settings-toggle" title="Settings">⚙️</button>
        <div class="settings-dropdown glass hidden" id="settings-dropdown">
          <div class="dropdown-item room-info">Room: <span id="game-room-code"></span></div>
          <div class="dropdown-item round-info">Round <span id="game-round">1</span></div>
          <div class="dropdown-item volume-control">
            <button class="btn-icon" id="btn-mute" title="Mute/Unmute Sounds">🔊</button>
            <input type="range" id="volume-slider" min="0" max="100" value="100" class="volume-slider">
          </div>
          <button class="btn btn-outline btn-sm btn-block mt-2" id="btn-leave-room-dropdown">Leave Room</button>
        </div>
      </div>

      <!-- Devil Mode Banner -->
      <div class="devil-mode-banner hidden" id="devil-banner">
        <span>😈 Devil Mode Active — Someone has the card...</span>
      </div>

      <!-- Targeting Banner -->
      <div class="targeting-banner hidden" id="targeting-banner">
        <span id="targeting-text">🔥 Select a player to shoot!</span>
      </div>

      <!-- Flat Table Layout -->
      <div class="table-edges-layout">
        <div class="edge-left" id="edge-left"></div>

        <div class="table-middle">
          <div class="edge-top" id="edge-top"></div>

          <!-- Center of table (Pile and Turn Timer) -->
          <div class="game-center">
            <div class="turn-timer" id="turn-timer" style="display:none">
              <svg width="56" height="56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="4" />
                <circle cx="28" cy="28" r="24" class="turn-timer-circle" id="timer-circle" stroke-dasharray="150.8"
                  stroke-dashoffset="0" />
              </svg>
              <div class="turn-timer-text" id="timer-text">20</div>
            </div>

            <div class="status-message" id="status-message">Waiting...</div>

            <div class="current-rank-badge glass" id="current-rank-badge" style="display:none">
              Declare: <span id="current-rank-text"></span>
            </div>

            <div class="pile-area" id="pile-area">
              <div class="pile-stack" id="pile-stack"></div>
              <div class="pile-label"><span id="pile-count">0</span> cards in pile</div>
            </div>

            <div class="last-play-info" id="last-play-info"></div>
          </div>
        </div>

        <div class="edge-right" id="edge-right"></div>
      </div>

      <!-- Actions Drawer -->
      <div class="actions-drawer glass closed" id="actions-drawer">
        <button class="drawer-handle" id="btn-toggle-actions-drawer">
          <span class="handle-bar"></span>
        </button>
        
        <div class="drawer-content">
          <!-- Player's Own Bullets -->
          <div class="player-lives-panel">
            <div class="lives-title">Shots Taken</div>
            <div class="player-shots-text" id="player-shots-text">0 / 6</div>
          </div>

          <!-- Declaration panel -->
          <div class="declaration-panel hidden" id="declaration-panel">
            <div class="rank-buttons" id="rank-buttons"></div>
          </div>

          <div class="action-buttons" id="action-buttons">
            <button class="btn btn-emerald" id="btn-play-cards" disabled>Play Cards</button>
            <button class="btn-liar" id="btn-call-liar" disabled>🃏 UWONGO!</button>
          </div>

          <div class="emoji-bar" id="emoji-bar">
            <button class="emoji-btn" data-emoji="😂">😂</button>
            <button class="emoji-btn" data-emoji="😱">😱</button>
            <button class="emoji-btn" data-emoji="🤥">🤥</button>
            <button class="emoji-btn" data-emoji="👀">👀</button>
            <button class="emoji-btn" data-emoji="🔥">🔥</button>
          </div>
        </div>
      </div>

      <!-- Hand -->
      <div class="player-dashboard">
        <div class="hand-area">
          <div class="hand-container" id="hand-container"></div>
        </div>
      </div>
    </div>

    <!-- Mobile/Desktop Bottom Sheet: Chat & Log -->
    <button class="btn-bottom-sheet-toggle" id="btn-toggle-bottom-sheet">💬 Chat & Log</button>
    <div class="bottom-sheet glass closed" id="bottom-sheet">
      <div class="bottom-sheet-header">
        <div class="bottom-sheet-tabs">
          <button class="sheet-tab active" data-tab="log">Log</button>
          <button class="sheet-tab" data-tab="chat">Chat</button>
        </div>
        <button class="sheet-close" id="btn-close-bottom-sheet">▼</button>
      </div>

      <div class="bottom-sheet-content">
        <!-- Log Section -->
        <div class="sheet-section active" id="sheet-section-log">
          <div class="game-log-container" id="game-log-mobile"></div>
        </div>
        <!-- Chat Section -->
        <div class="sheet-section" id="sheet-section-chat">
          <div class="game-chat-messages" id="game-chat-messages-mobile"></div>
          <div class="input-row">
            <input type="text" id="game-chat-input-mobile" placeholder="Message..." maxlength="100" autocomplete="off">
            <button class="btn btn-emerald btn-sm" id="btn-send-game-chat-mobile">Send</button>
          </div>
        </div>
      </div>
    </div>
  `;

  populateEls();
  bindLocalEvents();
}

function populateEls() {
  els.handContainer = $('hand-container');
  els.pileStack = $('pile-stack');
  els.pileCount = $('pile-count');
  els.statusMessage = $('status-message');
  els.lastPlayInfo = $('last-play-info');
  els.currentRankBadge = $('current-rank-badge');
  els.currentRankText = $('current-rank-text');
  els.declarationPanel = $('declaration-panel');
  els.rankButtons = $('rank-buttons');
  els.btnPlayCards = $('btn-play-cards');
  els.btnCallLiar = $('btn-call-liar');
  els.turnTimer = $('turn-timer');
  els.timerCircle = $('timer-circle');
  els.timerText = $('timer-text');
  els.gameRound = $('game-round');
  els.gameRoomCode = $('game-room-code');
  els.devilBanner = $('devil-banner');
  els.targetingBanner = $('targeting-banner');
  els.revealOverlay = $('reveal-overlay');
  els.revealTitle = $('reveal-title');
  els.revealCards = $('reveal-cards');
  els.revealResult = $('reveal-result');
  els.revolverOverlay = $('revolver-overlay');
  els.revolverPlayer = $('revolver-player');
  els.revolverResult = $('revolver-result');
  els.spectatorBanner = $('spectator-banner');
  els.pileTimeline = $('pile-timeline');
  els.countdownOverlay = $('countdown-overlay');
  els.countdownNumber = $('countdown-number');
  els.actionsDrawer = $('actions-drawer');
  els.bottomSheet = $('bottom-sheet');
  els.btnMute = $('btn-mute');
  els.volumeSlider = $('volume-slider');
}

function bindLocalEvents() {
  const state = getState();

  // Settings toggle
  $('btn-settings-toggle')?.addEventListener('click', () => {
    $('settings-dropdown')?.classList.toggle('hidden');
  });

  $('btn-leave-room-dropdown')?.addEventListener('click', () => {
    socket.emit('leave_room', { roomCode: state.roomCode });
    window.app?.resetToJoin?.();
    $('settings-dropdown')?.classList.add('hidden');
  });

  $('btn-toggle-actions-drawer')?.addEventListener('click', () => {
    els.actionsDrawer?.classList.toggle('closed');
  });

  // Play cards
  els.btnPlayCards?.addEventListener('click', () => {
    const s = getState();
    if (!s.isMyTurn || s.selectedCardIds.length === 0) return;
    const rank = s.declaredRank || s.currentRank;
    if (!rank) {
      showToast('Select a rank to declare!', 'warning');
      return;
    }
    socket.emit('play_cards', {
      roomCode: s.roomCode,
      cardIds: s.selectedCardIds,
      declaredRank: rank,
      declaredCount: s.selectedCardIds.length,
    });
    s.selectedCardIds = [];
    s.declaredRank = null;
  });

  // Call liar
  els.btnCallLiar?.addEventListener('click', () => {
    const s = getState();
    if (!s.canCallLiar || !s.isMyTurn) return;
    socket.emit('call_liar', { roomCode: s.roomCode });
    els.btnCallLiar.disabled = true;
  });

  // Emoji buttons
  document.querySelectorAll('#liars-bar-screen .emoji-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      socket.emit('send_emoji', { roomCode: getState().roomCode, emoji: btn.dataset.emoji });
    });
  });

  // Mute button
  els.btnMute?.addEventListener('click', () => {
    const s = getState();
    if (s.volume > 0) {
      s.lastVolume = s.volume;
      s.volume = 0;
    } else {
      s.volume = s.lastVolume || 1.0;
    }
    updateVolumeUI();
  });

  els.volumeSlider?.addEventListener('input', () => {
    const s = getState();
    s.volume = els.volumeSlider.value / 100;
    updateVolumeUI();
  });

  // Bottom sheet
  $('btn-toggle-bottom-sheet')?.addEventListener('click', () => {
    els.bottomSheet?.classList.toggle('closed');
  });
  $('btn-close-bottom-sheet')?.addEventListener('click', () => {
    els.bottomSheet?.classList.add('closed');
  });

  // Sheet tabs
  document.querySelectorAll('#liars-bar-screen .sheet-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      document.querySelectorAll('#liars-bar-screen .sheet-tab').forEach(t => t.classList.toggle('active', t === tab));
      document.querySelectorAll('#liars-bar-screen .sheet-section').forEach(sec => {
        sec.classList.toggle('active', sec.id === `sheet-section-${target}`);
      });
    });
  });

  // Chat
  const btnSendChat = $('btn-send-game-chat-mobile');
  const chatInput = $('game-chat-input-mobile');
  function sendChat() {
    const msg = chatInput?.value.trim();
    if (!msg || !getState().roomCode) return;
    socket.emit('lobby_chat', { roomCode: getState().roomCode, message: msg });
    chatInput.value = '';
  }
  btnSendChat?.addEventListener('click', sendChat);
  chatInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChat(); });
}

function updateVolumeUI() {
  const s = getState();
  if (els.volumeSlider) els.volumeSlider.value = s.volume * 100;
  if (els.btnMute) {
    if (s.volume === 0) els.btnMute.textContent = '🔇';
    else if (s.volume < 0.5) els.btnMute.textContent = '🔉';
    else els.btnMute.textContent = '🔊';
    els.btnMute.classList.toggle('muted', s.volume === 0);
  }
}

// ===== AUDIO =====
function playSound(type) {
  const s = getState();
  if (!s.soundEnabled) return;
  let fileName = type;
  if (type === 'liar_caught') {
    const rand = Math.floor(Math.random() * 3) + 1;
    fileName = `${type}${rand}`;
  }
  const audio = new Audio(`sounds/${fileName}.mp3`);
  audio.volume = s.volume;
  audio.play().catch(e => {
    if (fileName !== type) {
      const fallback = new Audio(`sounds/${type}.mp3`);
      fallback.volume = s.volume;
      fallback.play().catch(() => {});
    }
  });
}

// ===== RENDERING =====
function renderHand() {
  const state = getState();
  if (!els.handContainer) return;
  els.handContainer.innerHTML = '';
  const order = { Ace: 0, King: 1, Queen: 2, Joker: 3 };
  const sorted = [...state.hand].sort((a, b) => (order[a.rank] ?? 9) - (order[b.rank] ?? 9));

  sorted.forEach(card => {
    const el = document.createElement('div');
    el.className = 'card' + (state.selectedCardIds.includes(card.id) ? ' selected' : '');
    if (!state.isMyTurn) el.classList.add('disabled');
    el.dataset.rank = card.rank;
    el.dataset.cardId = card.id;

    const info = rankSymbols[card.rank] || { symbol: '?', icon: '' };
    el.innerHTML = `
      <span class="card-corner top">${info.symbol}</span>
      <span class="card-rank">${info.icon}</span>
      <span class="card-label">${card.rank}</span>
      <span class="card-corner bottom">${info.symbol}</span>
    `;

    if (card.isDevil) {
      el.classList.add('devil-card');
      el.title = "DEVIL CARD — If challenged while telling the truth, all opponents shoot!";
      const devilIcon = document.createElement('span');
      devilIcon.className = 'devil-icon';
      devilIcon.textContent = '😈';
      el.appendChild(devilIcon);
    }

    el.addEventListener('click', () => toggleCard(card.id));
    els.handContainer.appendChild(el);
  });
}

function toggleCard(cardId) {
  const state = getState();
  if (!state.isMyTurn) return;
  const idx = state.selectedCardIds.indexOf(cardId);
  if (idx > -1) {
    state.selectedCardIds.splice(idx, 1);
  } else {
    const limit = state.settings.isChaosMode ? 1 : 3;
    if (state.selectedCardIds.length < limit) {
      state.selectedCardIds.push(cardId);
    } else {
      showToast(`Max ${limit} cards!`, 'warning');
      return;
    }
  }
  renderHand();
  updateControls();
}

function renderOpponents(players, currentTurnTeamIndex) {
  const state = getState();
  const edgeLeft = $('edge-left');
  const edgeTop = $('edge-top');
  const edgeRight = $('edge-right');
  if (!edgeLeft || !edgeTop || !edgeRight) return;

  edgeLeft.innerHTML = '';
  edgeTop.innerHTML = '';
  edgeRight.innerHTML = '';

  const me = players.find(p => p.id === state.playerId);
  const myTeamIndex = me ? me.teamIndex : -1;

  const teams = {};
  players.forEach(p => {
    if (p.teamIndex === myTeamIndex) return;
    if (!teams[p.teamIndex]) teams[p.teamIndex] = [];
    teams[p.teamIndex].push(p);
  });

  const opponentTeamIndices = Object.keys(teams).sort((a, b) => parseInt(a) - parseInt(b));
  const count = opponentTeamIndices.length;
  if (count === 0) return;

  const edgeAssignments = [];
  if (count === 1) {
    edgeAssignments.push('top');
  } else if (count === 2) {
    edgeAssignments.push('left', 'right');
  } else if (count === 3) {
    edgeAssignments.push('left', 'top', 'right');
  } else {
    const sideCount = Math.floor((count - 1) / 2);
    for (let i = 0; i < sideCount; i++) edgeAssignments.push('left');
    const topCount = count - sideCount * 2;
    for (let i = 0; i < topCount; i++) edgeAssignments.push('top');
    for (let i = 0; i < sideCount; i++) edgeAssignments.push('right');
  }

  opponentTeamIndices.forEach((tIdxStr, i) => {
    const tIdx = parseInt(tIdxStr);
    const teamPlayers = teams[tIdxStr];
    const p = teamPlayers[0];
    const names = teamPlayers.map(tp => tp.name).join(' & ');
    const isEliminated = teamPlayers.every(tp => tp.isEliminated);
    const isDisconnected = teamPlayers.every(tp => !tp.isConnected);

    const card = document.createElement('div');
    card.className = 'opponent-card';
    if (isEliminated) card.classList.add('eliminated');
    if (isDisconnected) card.classList.add('disconnected');
    if (tIdx === currentTurnTeamIndex) card.classList.add('active-turn');

    const isTargetable = (state.targetingMode || state.chaosTargetingMode) && !isEliminated;
    if (isTargetable) card.classList.add('targetable');
    card.id = `opponent-team-${tIdx}`;

    // Turn Order Badge
    if (state.turnOrder && state.turnOrder.length > 0) {
      const orderIdx = state.turnOrder.indexOf(tIdx);
      if (orderIdx !== -1) {
        const badge = document.createElement('div');
        badge.className = 'turn-order-badge';
        badge.textContent = orderIdx + 1;
        card.appendChild(badge);

        const currentIdx = state.turnOrder.indexOf(currentTurnTeamIndex);
        const nextIdx = (currentIdx + 1) % state.turnOrder.length;
        if (orderIdx === nextIdx && !isEliminated) {
          const nextLabel = document.createElement('div');
          nextLabel.className = 'next-turn-label';
          nextLabel.textContent = '→ Next';
          card.appendChild(nextLabel);
        }
      }
    }

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'player-avatar';
    avatarDiv.style.background = avatarColors[tIdx % avatarColors.length];
    avatarDiv.style.margin = '0 auto 10px';
    avatarDiv.textContent = avatarEmojis[tIdx % avatarEmojis.length];
    card.appendChild(avatarDiv);

    const nameDiv = document.createElement('div');
    nameDiv.className = 'opponent-name';
    nameDiv.textContent = names + (isDisconnected ? ' ⚡' : '') + (isEliminated ? ' 💀' : '');
    card.appendChild(nameDiv);

    const cardsRow = document.createElement('div');
    cardsRow.className = 'opponent-cards-row';
    const handSize = p.handSize;
    const miniCount = Math.min(handSize, 10);
    for (let c = 0; c < miniCount; c++) {
      const back = document.createElement('div');
      back.className = 'mini-card-back';
      cardsRow.appendChild(back);
    }
    card.appendChild(cardsRow);

    const countDiv = document.createElement('div');
    countDiv.style.fontSize = '.75rem';
    countDiv.style.color = 'var(--text-dim)';
    countDiv.style.margin = '4px 0';
    countDiv.textContent = `${handSize} cards`;
    card.appendChild(countDiv);

    const shotsDiv = document.createElement('div');
    shotsDiv.className = 'opponent-shots';
    shotsDiv.style.fontSize = '.8rem';
    shotsDiv.style.fontWeight = 'bold';
    shotsDiv.style.color = 'var(--gold)';
    shotsDiv.textContent = `Shots: ${p.shotsTaken} / 6`;
    card.appendChild(shotsDiv);

    card.addEventListener('click', () => {
      if (isTargetable) {
        const target = teamPlayers.find(tp => !tp.isEliminated);
        if (target) {
          socket.emit('select_target', { roomCode: state.roomCode, targetId: target.id });
          state.targetingMode = false;
          state.chaosTargetingMode = false;
          const tb = $('targeting-banner');
          if (tb) tb.classList.add('hidden');
          renderOpponents(state.players, null);
          showToast(`Targeting team: ${names}`, 'info');
        }
      }
    });

    const edge = edgeAssignments[i];
    if (edge === 'left') edgeLeft.appendChild(card);
    else if (edge === 'right') edgeRight.appendChild(card);
    else edgeTop.appendChild(card);
  });
}

function renderPlayerLives(playerInfo) {
  const shotsText = $('player-shots-text');
  if (!playerInfo || !shotsText) return;
  shotsText.textContent = `${playerInfo.shotsTaken} / ${playerInfo.maxShots || 6}`;
  const livesTitle = document.querySelector('#liars-bar-screen .lives-title');
  if (livesTitle) livesTitle.textContent = "Shots Taken";
}

function getTeamGrammar(teamIndex) {
  const state = getState();
  const members = state.players.filter(p => p.teamIndex === teamIndex);
  const isMe = members.some(p => p.id === state.playerId);
  const names = members.map(p => p.name).join(' & ');

  if (members.length === 1) {
    return {
      who: isMe ? 'You' : names,
      whom: isMe ? 'you' : names,
      possessive: isMe ? 'Your' : `${names}'s`,
      is: 'is', has: 'has', was: 'was'
    };
  } else {
    return {
      who: isMe ? 'Your Team' : names,
      whom: isMe ? 'your team' : names,
      possessive: isMe ? 'Your Team\'s' : `${names}'s`,
      is: 'are', has: 'have', was: 'were'
    };
  }
}

function updatePile(size) {
  if (!els.pileStack) return;
  els.pileStack.innerHTML = '';
  const displayed = Math.min(size, 5);
  for (let i = 0; i < displayed; i++) {
    const card = document.createElement('div');
    card.className = 'pile-card-back';
    card.style.top = `${-i * 3}px`;
    card.style.left = `${(Math.random() - 0.5) * 6}px`;
    card.style.transform = `rotate(${(Math.random() - 0.5) * 8}deg)`;
    els.pileStack.appendChild(card);
  }
  if (size > 0) {
    const countEl = document.createElement('div');
    countEl.className = 'pile-count';
    countEl.textContent = size;
    els.pileStack.appendChild(countEl);
  }
  if (els.pileCount) els.pileCount.textContent = size;
}

function updateControls() {
  const state = getState();
  const hasSelected = state.selectedCardIds.length > 0;

  if (els.declarationPanel) els.declarationPanel.classList.add('hidden');
  state.declaredRank = state.currentRank;
  if (els.btnPlayCards) els.btnPlayCards.disabled = !(state.isMyTurn && hasSelected && state.currentRank);
  if (els.btnCallLiar) els.btnCallLiar.disabled = !state.canCallLiar || !state.isMyTurn;
  if (els.btnPlayCards) els.btnPlayCards.style.display = state.isMyTurn ? 'inline-flex' : 'none';

  if (els.actionsDrawer) {
    if (state.isMyTurn) {
      els.actionsDrawer.classList.remove('closed');
    } else {
      els.actionsDrawer.classList.add('closed');
    }
  }
}

function updateSpectatorMode() {
  const state = getState();
  const banner = $('spectator-banner');
  const layout = $('casino-table-root');
  if (state.isEliminated) {
    banner?.classList.remove('hidden');
    layout?.classList.add('spectating');
  } else {
    banner?.classList.add('hidden');
    layout?.classList.remove('spectating');
  }
}

function addLogEntry(message, type) {
  const logContainers = document.querySelectorAll('#liars-bar-screen .game-log-container');
  logContainers.forEach(container => {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type || ''}`;
    entry.textContent = message;
    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;
  });
}

function showFloatingEmoji(emoji) {
  const el = document.createElement('div');
  el.className = 'floating-emoji';
  el.textContent = emoji;
  el.style.left = `${30 + Math.random() * 40}%`;
  el.style.top = `${20 + Math.random() * 30}%`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

// ===== TIMER =====
let turnTimerInterval = null;
let turnTimeLeft = 0;

function startTimer(duration) {
  clearTimer();
  turnTimeLeft = Math.ceil(duration / 1000);
  if (els.turnTimer) els.turnTimer.style.display = 'block';
  const total = turnTimeLeft;
  const circumference = 150.8;

  updateTimerDisplay();

  turnTimerInterval = setInterval(() => {
    turnTimeLeft--;
    if (turnTimeLeft <= 0) {
      clearTimer();
      return;
    }
    updateTimerDisplay();
  }, 1000);

  function updateTimerDisplay() {
    const pct = turnTimeLeft / total;
    if (els.timerCircle) els.timerCircle.style.strokeDashoffset = circumference * (1 - pct);
    if (els.timerText) els.timerText.textContent = turnTimeLeft;

    if (els.timerCircle) {
      els.timerCircle.classList.remove('warning', 'danger');
      if (els.timerText) els.timerText.classList.remove('danger');
      if (turnTimeLeft <= 5) {
        els.timerCircle.classList.add('danger');
        if (els.timerText) els.timerText.classList.add('danger');
      } else if (turnTimeLeft <= 10) {
        els.timerCircle.classList.add('warning');
      }
    }
  }
}

function clearTimer() {
  if (turnTimerInterval) clearInterval(turnTimerInterval);
  turnTimerInterval = null;
  if (els.turnTimer) els.turnTimer.style.display = 'none';
}

// ===== RESULTS =====
function showResults(rankings) {
  const state = getState();
  const rankingsList = $('rankings-list');
  if (!rankingsList) return;
  rankingsList.innerHTML = '';
  const posColors = ['gold', 'silver', 'bronze'];

  rankings.forEach((r, i) => {
    const li = document.createElement('li');
    li.className = 'ranking-item glass';
    li.style.flexDirection = 'column';
    li.style.alignItems = 'flex-start';

    const topRow = document.createElement('div');
    topRow.style.display = 'flex';
    topRow.style.alignItems = 'center';
    topRow.style.gap = '16px';
    topRow.style.width = '100%';

    const pos = document.createElement('div');
    pos.className = `ranking-position ${posColors[i] || ''}`;
    pos.textContent = `#${r.position}`;

    const name = document.createElement('div');
    name.className = 'ranking-name';
    const isMyTeam = r.memberIds && r.memberIds.includes(state.playerId);
    const suffix = isMyTeam ? (r.memberIds.length > 1 ? ' (Your Team)' : ' (You)') : '';
    name.textContent = r.names + suffix;

    const status = document.createElement('div');
    status.className = 'ranking-status';
    status.textContent = r.eliminated ? '💀 Eliminated' : (r.position === 1 ? '🏆 Winner!' : `${r.cardsLeft} cards left`);

    topRow.appendChild(pos);
    topRow.appendChild(name);
    topRow.appendChild(status);
    li.appendChild(topRow);

    if (r.stats) {
      const statsGrid = document.createElement('div');
      statsGrid.className = 'ranking-stats';
      const statData = [
        { label: 'Rounds Survived', value: r.stats.roundsSurvived },
        { label: 'Caught Liars', value: r.stats.caughtLiar },
        { label: 'Times Lied', value: r.stats.timesLied },
        { label: 'Times Truthful', value: r.stats.timesTruthful },
        { label: 'Shots Taken', value: r.stats.shotsTaken },
      ];
      statData.forEach(s => {
        const pill = document.createElement('div');
        pill.className = 'stat-pill';
        pill.innerHTML = `<span>${s.label}</span><span>${s.value}</span>`;
        statsGrid.appendChild(pill);
      });
      li.appendChild(statsGrid);
    }
    rankingsList.appendChild(li);
  });

  // Show the results screen
  window.app?.showScreen?.('results');
}

// ===== SOCKET LISTENERS =====
function registerSocketListeners() {
  const state = getState();

  socket.on('game_started', (data) => {
    state.gameActive = true;
    if (els.gameRoomCode) els.gameRoomCode.textContent = state.roomCode;
    document.querySelectorAll('#liars-bar-screen .game-log-container').forEach(c => c.innerHTML = '');
    els.revealOverlay?.classList.add('hidden');
    els.revolverOverlay?.classList.add('hidden');

    if (state.settings.isDevilCardMode) {
      els.devilBanner?.classList.remove('hidden');
    } else {
      els.devilBanner?.classList.add('hidden');
    }
  });

  socket.on('cards_dealt', (data) => {
    state.hand = data.hand;
    state.players = data.players;
    state.selectedCardIds = [];
    state.declaredRank = null;
    state.currentRank = data.currentRank || null;
    if (els.gameRound) els.gameRound.textContent = data.roundNumber;

    els.revealOverlay?.classList.add('hidden');
    els.revolverOverlay?.classList.add('hidden');

    renderHand();
    renderOpponents(data.players, data.firstTeamIndex);
    const me = data.players.find(p => p.id === state.playerId);
    state.isEliminated = me ? me.isEliminated : false;
    state.turnOrder = data.turnOrder || [];

    updateSpectatorMode();
    renderPlayerLives(me);
    updatePile(0);
    if (els.lastPlayInfo) els.lastPlayInfo.textContent = '';

    if (state.currentRank) {
      if (els.currentRankBadge) els.currentRankBadge.style.display = 'inline-flex';
      if (els.currentRankText) els.currentRankText.textContent = state.currentRank + 's';
    }
  });

  socket.on('round_countdown', () => {
    els.countdownOverlay?.classList.remove('hidden');
    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count === 0) {
        els.countdownNumber.textContent = 'GO!';
      } else if (count < 0) {
        clearInterval(interval);
        els.countdownOverlay?.classList.add('hidden');
        els.countdownNumber.textContent = '3';
      } else {
        els.countdownNumber.textContent = count;
      }
    }, 1000);
  });

  socket.on('turn_start', (data) => {
    const me = state.players.find(p => p.id === state.playerId);
    state.isMyTurn = (me && me.teamIndex === data.teamIndex);
    state.canCallLiar = data.canCallLiar && state.isMyTurn;
    state.currentRank = data.currentRank;
    state.isFirstPlay = data.isFirstPlay;
    state.selectedCardIds = [];
    state.declaredRank = null;

    if (state.isMyTurn) {
      els.statusMessage.className = 'status-message status-your-turn';
      els.statusMessage.textContent = state.canCallLiar ? 'Your turn — Play or call UWONGO!' : 'Your turn — Play cards!';
    } else {
      els.statusMessage.className = 'status-message status-waiting';
      els.statusMessage.textContent = `${data.teamNames}'s turn...`;
    }

    if (data.currentRank) {
      if (els.currentRankBadge) els.currentRankBadge.style.display = 'inline-flex';
      if (els.currentRankText) els.currentRankText.textContent = data.currentRank + 's';
    }

    renderOpponents(state.players, data.teamIndex);
    updatePile(data.pileSize);
    renderHand();
    updateControls();
    startTimer(data.timeLimit);
  });

  socket.on('cards_played', (data) => {
    const grammar = getTeamGrammar(data.teamIndex);
    if (els.lastPlayInfo) els.lastPlayInfo.textContent = `${grammar.who} played ${data.declaredCount} ${data.declaredRank}${data.declaredCount > 1 ? 's' : ''}`;
    updatePile(data.pileSize);
  });

  socket.on('hand_update', (data) => {
    state.hand = data.hand;
    state.selectedCardIds = [];
    renderHand();
  });

  socket.on('players_update', (data) => {
    state.players = data.players;
    renderOpponents(data.players, data.currentTeamIndex);
    const me = data.players.find(p => p.id === state.playerId);
    renderPlayerLives(me);
  });

  socket.on('liar_called', (data) => {
    clearTimer();
    const challengerGrammar = getTeamGrammar(data.challengerTeamIndex);
    const challengedGrammar = getTeamGrammar(data.challengedTeamIndex);
    const who = challengerGrammar.who;
    const whom = challengedGrammar.whom;

    showToast(`${who} called UWONGO on ${whom}!`, 'warning');
    if (els.statusMessage) els.statusMessage.className = 'status-message';

    if (data.pileHistory && data.pileHistory.length > 0 && els.pileTimeline) {
      els.pileTimeline.innerHTML = '';
      data.pileHistory.forEach((entry, idx) => {
        const item = document.createElement('div');
        item.className = 'timeline-entry';
        item.style.animationDelay = `${idx * 0.1}s`;
        const pSpan = document.createElement('span');
        pSpan.className = 'player';
        pSpan.textContent = entry.playerName;
        const cSpan = document.createElement('span');
        cSpan.className = 'count';
        cSpan.textContent = `${entry.cardCount} card${entry.cardCount > 1 ? 's' : ''}`;
        item.appendChild(pSpan);
        item.appendChild(cSpan);
        els.pileTimeline.appendChild(item);
        if (idx < data.pileHistory.length - 1) {
          const arrow = document.createElement('div');
          arrow.className = 'timeline-arrow';
          arrow.textContent = '→';
          els.pileTimeline.appendChild(arrow);
        }
      });
      els.revealOverlay?.classList.remove('hidden');
      if (els.revealTitle) els.revealTitle.textContent = '';
      if (els.revealCards) els.revealCards.innerHTML = '';
      if (els.revealResult) els.revealResult.textContent = '';
    }
    if (els.statusMessage) els.statusMessage.textContent = '🔍 Revealing cards...';
    if (els.btnPlayCards) els.btnPlayCards.disabled = true;
    if (els.btnCallLiar) els.btnCallLiar.disabled = true;
  });

  socket.on('cards_revealed', (data) => {
    els.revealOverlay?.classList.remove('hidden');
    if (els.revealTitle) els.revealTitle.textContent = `Declared: ${data.declaredRank}s`;
    if (els.revealCards) {
      els.revealCards.innerHTML = '';
      data.cards.forEach(card => {
        const el = document.createElement('div');
        el.className = 'reveal-card';
        const info = rankSymbols[card.rank] || { symbol: '?', icon: '' };
        const color = card.rank === 'Ace' ? 'var(--accent-ace)' :
          card.rank === 'King' ? 'var(--accent-king)' :
            card.rank === 'Queen' ? 'var(--accent-queen)' :
              card.rank === 'Chaos' ? 'var(--crimson)' :
                card.rank === 'Master' ? 'var(--gold)' : 'var(--accent-joker)';
        el.style.borderColor = color;
        el.style.color = color;
        el.innerHTML = `<span>${info.icon}</span><span style="font-size:.8rem">${card.rank}</span>`;
        els.revealCards.appendChild(el);
      });
    }

    const challengedTeamPlayers = state.players.filter(p => p.teamIndex === data.challengedTeamIndex);
    const challengedTeamNames = challengedTeamPlayers.map(p => p.name).join(' & ');

    if (els.revealResult) {
      if (data.wasLying) {
        els.revealResult.className = 'reveal-result liar';
        els.revealResult.textContent = `🤥 ${challengedTeamNames} were caught BLUFFING!`;
      } else {
        els.revealResult.className = 'reveal-result truth';
        els.revealResult.textContent = `✅ ${challengedTeamNames} told the truth!`;
        if (data.hasDevilCard) {
          els.revealResult.innerHTML += `<br><span style="color:var(--crimson); font-weight:900; font-size:1.2rem; animation: pulse-liar 1s infinite;">😈 DEVIL CARD TRIGGERED! 😈</span>`;
          playSound('devil_laugh');
        }
      }
    }
  });

  socket.on('challenge_result', (data) => {
    const isLoserMe = data.loserId === state.playerId;
    const loserTeamPlayers = state.players.filter(p => p.teamIndex === data.teamIndex);
    const loserTeamNames = loserTeamPlayers.map(p => p.name).join(' & ');
    const loserText = isLoserMe ? 'Your team picks' : `${loserTeamNames} pick`;
    showToast(`${loserText} up the pile!`, 'info');
  });

  socket.on('targeting_started', (data) => {
    els.revealOverlay?.classList.add('hidden');
    if (data.shooterId === state.playerId) {
      if (data.isChaosMass) {
        state.chaosTargetingMode = true;
      } else {
        state.targetingMode = true;
      }
      els.targetingBanner?.classList.remove('hidden');
      if (els.statusMessage) {
        els.statusMessage.className = 'status-message status-your-turn';
        els.statusMessage.textContent = '🔥 Your turn to SHOOT! Select a target!';
      }
      renderOpponents(state.players, null);
      showToast('Select a player to shoot!', 'warning');
    } else {
      if (els.statusMessage) {
        els.statusMessage.className = 'status-message status-waiting';
        els.statusMessage.textContent = `Waiting for ${data.shooterName} to pick a target...`;
      }
      showToast(`${data.shooterName} is choosing a target!`, 'warning');
    }
  });

  socket.on('devil_card_triggered', (data) => {
    console.log('Devil Card Triggered', data);
  });

  socket.on('revolver_result', (data) => {
    els.revealOverlay?.classList.add('hidden');
    els.revolverOverlay?.classList.remove('hidden');

    els.revolverOverlay?.querySelectorAll('.glass-crack, .muzzle-flash').forEach(el => el.remove());
    els.revolverOverlay?.classList.remove('screen-shake');

    const revolverEmoji = els.revolverOverlay?.querySelector('.revolver-emoji');
    if (revolverEmoji) {
      revolverEmoji.textContent = '🔫';
      revolverEmoji.className = 'revolver-emoji spinning';
    }

    const teamPlayers = state.players.filter(p => p.teamIndex === data.teamIndex);
    const teamNames = teamPlayers.length > 0 ? teamPlayers.map(p => p.name).join(' & ') : data.playerName;
    const verb = teamPlayers.length > 1 ? 'are' : 'is';
    if (els.revolverPlayer) els.revolverPlayer.textContent = `${teamNames} ${verb} taking the shot...`;
    if (els.revolverResult) els.revolverResult.textContent = '';

    setTimeout(() => {
      const flash = document.createElement('div');
      flash.className = 'muzzle-flash fire';
      els.revolverOverlay?.appendChild(flash);

      if (data.fired) {
        if (revolverEmoji) {
          revolverEmoji.textContent = data.isEliminated ? '💀' : '💥';
          revolverEmoji.className = 'revolver-emoji ' + (data.isEliminated ? 'eliminated' : 'fired');
        }
        if (els.revolverResult) {
          els.revolverResult.className = 'revolver-result eliminated';
          els.revolverResult.textContent = data.isEliminated ? 'BANG! Eliminated!' : 'BANG! haha ded';
        }
        els.revolverOverlay?.classList.add('screen-shake');
        if (data.isEliminated) {
          playSound('player_eliminated');
          const crack = document.createElement('div');
          crack.className = 'glass-crack';
          els.revolverOverlay?.appendChild(crack);
          setTimeout(() => crack.classList.add('visible'), 100);
        }
      } else {
        if (revolverEmoji) {
          revolverEmoji.textContent = '😮‍💨';
          revolverEmoji.className = 'revolver-emoji safe';
        }
        if (els.revolverResult) {
          els.revolverResult.className = 'revolver-result survived';
          els.revolverResult.textContent = 'Click... Survived!';
        }
      }
    }, 1800);

    setTimeout(() => {
      els.revolverOverlay?.classList.add('hidden');
      els.revolverOverlay?.classList.remove('screen-shake');
      els.revolverOverlay?.querySelectorAll('.glass-crack, .muzzle-flash').forEach(el => el.remove());
    }, 5000);
  });

  socket.on('player_eliminated', (data) => {
    const who = data.playerId === state.playerId ? 'You were' : `${data.playerName} was`;
    showToast(`${who} eliminated!`, 'error');
  });

  socket.on('round_over', (data) => {
    clearTimer();
    els.revealOverlay?.classList.add('hidden');
    els.revolverOverlay?.classList.add('hidden');
    const who = data.winnerId === state.playerId ? 'You' : data.winnerName;
    showToast(`${who} won the round!`, 'success');
    if (els.statusMessage) els.statusMessage.textContent = data.reason;
  });

  socket.on('game_over', (data) => {
    clearTimer();
    state.gameActive = false;
    playSound('game_over');
    setTimeout(() => showResults(data.rankings), 1500);
  });

  socket.on('turn_timeout', (data) => {
    const who = data.playerId === state.playerId ? 'You' : data.playerName;
    showToast(`⏰ ${who} ran out of time!`, 'warning');
  });

  socket.on('game_log', (data) => {
    addLogEntry(data.message, data.type);
  });

  socket.on('emoji_received', (data) => {
    showFloatingEmoji(data.emoji);
  });

  socket.on('sound_event', (data) => {
    playSound(data.type);
  });

  socket.on('reconnect_success', (data) => {
    state.playerId = data.playerId;
    state.roomCode = data.roomCode;
    state.hand = data.hand;
    state.players = data.players;
    state.gameActive = true;

    window.app?.showScreen?.('liars-bar');
    if (els.gameRoomCode) els.gameRoomCode.textContent = state.roomCode;
    renderHand();
    renderOpponents(data.players, data.gameState?.currentTeamIndex);
    const me = data.players.find(p => p.id === state.playerId);
    renderPlayerLives(me);

    showToast('Reconnected!', 'success');
  });
}
