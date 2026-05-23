const socket = window.app.socket;
const state = window.app.state;

const screen = document.getElementById('hotjoker-screen');

screen.innerHTML = `
  <div class="game-layout" id="hotjoker-layout">
    <!-- Top bar -->
    <div class="game-top-bar glass">
      <div style="display:flex;align-items:center;gap:12px">
        <div class="room-info">Room: <span id="hotjoker-room-code"></span></div>
      </div>
    </div>

    <!-- Target Banner -->
    <div class="targeting-banner hidden" id="hotjoker-targeting-banner">
      <span id="hotjoker-targeting-text">Pass the joker! Select a player!</span>
    </div>

    <!-- Dashboard -->
    <div class="opponents-dashboard" id="hotjoker-dashboard" style="margin-top: 40px; flex: 1; align-items: center;">
      <!-- players will be injected here -->
    </div>
  </div>
`;

const dashboard = document.getElementById('hotjoker-dashboard');
const roomCodeEl = document.getElementById('hotjoker-room-code');
const targetingBanner = document.getElementById('hotjoker-targeting-banner');
let currentJokerHolderId = null;
let currentPlayers = [];

function renderPlayers() {
  dashboard.innerHTML = '';
  
  currentPlayers.forEach(p => {
    const card = document.createElement('div');
    card.className = 'opponent-card';
    if (p.isEliminated) card.classList.add('eliminated');
    
    // Joker styling
    if (p.id === currentJokerHolderId && !p.isEliminated) {
      card.style.borderColor = 'var(--crimson)';
      card.style.boxShadow = '0 0 20px var(--crimson-glow)';
      card.style.animation = 'pulse-liar 0.5s infinite';
    }

    // Pass target styling
    const canTarget = (currentJokerHolderId === state.playerId) && (p.id !== state.playerId) && !p.isEliminated;
    if (canTarget) {
      card.classList.add('targetable');
    }

    card.innerHTML = `
      <div class="player-avatar" style="background: var(--bg-secondary); margin: 0 auto 10px;">
        ${p.id === currentJokerHolderId ? '🤡' : '👤'}
      </div>
      <div class="opponent-name">${p.name} ${p.id === state.playerId ? '(You)' : ''}</div>
      <div class="opponent-shots" style="font-size:.8rem; font-weight:bold; color:var(--gold); margin-top:10px;">
        Shots: ${p.shotsTaken} / 6
      </div>
    `;

    if (canTarget) {
      card.addEventListener('click', () => {
        socket.emit('pass_joker', { roomCode: state.roomCode, targetId: p.id });
      });
    }

    dashboard.appendChild(card);
  });
}

// SOCKET EVENTS
socket.on('hotjoker_round_start', (data) => {
  roomCodeEl.textContent = state.roomCode;
  currentPlayers = data.players;
  currentJokerHolderId = data.jokerHolderId;
  
  if (currentJokerHolderId === state.playerId) {
    targetingBanner.classList.remove('hidden');
  } else {
    targetingBanner.classList.add('hidden');
  }

  renderPlayers();
});

socket.on('hotjoker_passed', (data) => {
  currentJokerHolderId = data.toId;
  
  if (currentJokerHolderId === state.playerId) {
    targetingBanner.classList.remove('hidden');
  } else {
    targetingBanner.classList.add('hidden');
  }
  
  renderPlayers();
});

socket.on('hotjoker_exploded', (data) => {
  // Show explosion
  const card = Array.from(dashboard.children).find(c => c.textContent.includes(data.victimName));
  if (card) {
    card.style.background = 'var(--crimson)';
    setTimeout(() => {
      card.style.background = 'var(--bg-glass)';
    }, 500);
  }
  
  // Wait for next round to re-render
});

socket.on('hotjoker_game_over', (data) => {
  // Can reuse existing results screen logic
  window.app.socket.emit('play_again', { roomCode: state.roomCode });
});
