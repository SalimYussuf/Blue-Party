const socket = window.app.socket;
const state = window.app.state;

const screen = document.getElementById('spyfall-screen');

screen.innerHTML = `
  <div id="spyfall-layout" style="display: flex; flex-direction: column; height: 100vh; padding: 20px; box-sizing: border-box; max-width: 1200px; margin: 0 auto; gap: 15px;">

    <!-- TOP BAR: Timer & Status -->
    <div class="glass" style="display: flex; justify-content: space-between; align-items: center; padding: 15px 25px; border-radius: 12px;">
      <div id="sf-timer" style="font-size: 2rem; font-weight: bold; color: var(--emerald); font-family: monospace; min-width: 80px;">8:00</div>
      <div id="sf-status" style="flex: 1; text-align: center; font-size: 1.3rem; font-weight: bold; letter-spacing: 2px;">LOADING...</div>
      <div style="min-width: 80px; text-align: right;">
        <button class="btn btn-outline btn-sm" id="sf-btn-toggle-card" style="font-size: 0.85rem;">👁 MY CARD</button>
      </div>
    </div>

    <!-- MAIN CONTENT -->
    <div style="display: flex; gap: 15px; flex: 1; min-height: 0;">

      <!-- LEFT: Players & Actions -->
      <div style="flex: 1; display: flex; flex-direction: column; gap: 15px; min-width: 280px; max-width: 350px;">

        <!-- Player Card (hidden by default) -->
        <div class="glass" id="sf-my-card" style="display: none; padding: 20px; border-radius: 12px; text-align: center; border: 2px solid var(--gold);">
          <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 2px; color: var(--text-dim); margin-bottom: 8px;">YOUR CARD</div>
          <div id="sf-card-location" style="font-size: 1.6rem; font-weight: bold; color: var(--gold); margin-bottom: 8px;">---</div>
          <div id="sf-card-role" style="font-size: 1.1rem; color: var(--text-dim);">---</div>
        </div>

        <!-- Players List -->
        <div class="glass" style="padding: 15px; border-radius: 12px; flex: 1; overflow-y: auto;">
          <h3 style="margin: 0 0 12px 0;">Players</h3>
          <ul id="sf-player-list" style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px;"></ul>
        </div>

        <!-- Spy Actions -->
        <div class="glass" id="sf-spy-actions" style="display: none; padding: 15px; border-radius: 12px;">
          <button class="btn btn-outline btn-block" id="sf-btn-spy-reveal" style="border-color: #a855f7; color: #a855f7;">🕵️ I AM THE SPY — Guess Location</button>
        </div>
      </div>

      <!-- CENTER: Activity Feed & Question Area -->
      <div style="flex: 2; display: flex; flex-direction: column; gap: 15px; min-width: 300px;">

        <!-- Activity Feed -->
        <div class="glass" style="flex: 1; padding: 15px; border-radius: 12px; display: flex; flex-direction: column; overflow: hidden;">
          <h3 style="margin: 0 0 10px 0;">Activity</h3>
          <div id="sf-activity-feed" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 5px;"></div>
        </div>

        <!-- Accusation Button -->
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-outline btn-block" id="sf-btn-accuse" style="border-color: #ef4444; color: #ef4444; font-size: 1rem;">⚠️ CALL VOTE — Accuse Someone</button>
        </div>
      </div>

      <!-- RIGHT: Location Reference -->
      <div class="glass" style="flex: 1; padding: 15px; border-radius: 12px; min-width: 220px; max-width: 280px; overflow-y: auto;">
        <h3 style="margin: 0 0 12px 0;">Possible Locations</h3>
        <ul id="sf-location-list" style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px;"></ul>
      </div>
    </div>

    <!-- VOTE OVERLAY -->
    <div id="sf-vote-overlay" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 100; display: none; align-items: center; justify-content: center;">
      <div class="glass" style="padding: 30px 40px; border-radius: 16px; text-align: center; max-width: 500px; width: 90%;">
        <h2 id="sf-vote-title" style="margin: 0 0 10px 0; color: #ef4444;">⚠️ VOTE CALLED</h2>
        <p id="sf-vote-desc" style="font-size: 1.1rem; margin-bottom: 20px;"></p>
        <div id="sf-vote-status" style="margin-bottom: 20px;"></div>
        <div id="sf-vote-buttons" style="display: flex; gap: 15px; justify-content: center;">
          <button class="btn" id="sf-btn-vote-guilty" style="background: #ef4444; color: white; padding: 12px 30px; font-size: 1.1rem;">GUILTY</button>
          <button class="btn" id="sf-btn-vote-innocent" style="background: var(--emerald); color: white; padding: 12px 30px; font-size: 1.1rem;">NOT GUILTY</button>
        </div>
      </div>
    </div>

    <!-- SPY GUESS OVERLAY -->
    <div id="sf-spy-guess-overlay" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 100; align-items: center; justify-content: center;">
      <div class="glass" style="padding: 30px 40px; border-radius: 16px; text-align: center; max-width: 600px; width: 90%;">
        <h2 style="margin: 0 0 10px 0; color: #a855f7;">🕵️ SPY'S FINAL GUESS</h2>
        <p id="sf-spy-guess-desc" style="font-size: 1.1rem; margin-bottom: 20px; color: var(--text-dim);"></p>
        <div id="sf-spy-guess-input-area" style="display: none; margin-bottom: 20px;">
          <select id="sf-spy-guess-select" style="width: 100%; padding: 12px; background: rgba(0,0,0,0.6); color: white; border: 2px solid #a855f7; border-radius: 8px; font-size: 1.1rem; margin-bottom: 15px;"></select>
          <button class="btn btn-block" id="sf-btn-spy-confirm-guess" style="background: #a855f7; color: white; font-size: 1.1rem; padding: 12px;">CONFIRM GUESS</button>
        </div>
        <p id="sf-spy-guess-waiting" style="color: var(--text-dim);">Waiting for the Spy to guess...</p>
      </div>
    </div>

    <!-- GAME OVER OVERLAY -->
    <div id="sf-game-over-overlay" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 100; align-items: center; justify-content: center;">
      <div class="glass" style="padding: 30px 40px; border-radius: 16px; text-align: center; max-width: 600px; width: 90%;">
        <h2 id="sf-gameover-title" style="margin: 0 0 10px 0; font-size: 2rem;"></h2>
        <p id="sf-gameover-reason" style="font-size: 1.1rem; margin-bottom: 15px; color: var(--text-dim);"></p>
        <div id="sf-gameover-reveal" style="margin-bottom: 20px;"></div>
        <button class="btn btn-gold btn-block" id="sf-btn-play-again" style="display: none; font-size: 1.1rem; padding: 12px;">BACK TO LOBBY</button>
      </div>
    </div>
  </div>

  <style>
    .sf-player-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 12px; border-radius: 6px; background: rgba(255,255,255,0.05);
      transition: background 0.15s;
    }
    .sf-player-item:hover { background: rgba(255,255,255,0.1); }
    .sf-player-item.me { border-left: 3px solid var(--emerald); }
    .sf-player-item .sf-player-name { font-weight: 500; }
    .sf-player-item .sf-player-actions { display: flex; gap: 6px; }
    .sf-player-item .sf-player-actions button {
      padding: 4px 10px; border-radius: 4px; font-size: 0.75rem;
      cursor: pointer; border: 1px solid rgba(255,255,255,0.2);
      background: rgba(0,0,0,0.3); color: white; transition: background 0.15s;
    }
    .sf-player-item .sf-player-actions button:hover { background: rgba(255,255,255,0.15); }
    .sf-player-item .sf-player-actions button.btn-ask { border-color: var(--emerald); color: var(--emerald); }
    .sf-player-item .sf-player-actions button.btn-suspect { border-color: #ef4444; color: #ef4444; }

    .sf-activity-msg { font-size: 0.9rem; padding: 6px 10px; border-radius: 6px; background: rgba(0,0,0,0.2); word-break: break-word; }
    .sf-activity-msg.system { color: var(--text-dim); font-style: italic; }
    .sf-activity-msg.question { color: var(--gold); border-left: 3px solid var(--gold); }
    .sf-activity-msg.vote { color: #ef4444; border-left: 3px solid #ef4444; }
    .sf-activity-msg.spy { color: #a855f7; border-left: 3px solid #a855f7; }

    .sf-location-item {
      padding: 5px 10px; border-radius: 4px; font-size: 0.85rem;
      background: rgba(255,255,255,0.05); color: var(--text-dim);
      transition: background 0.1s;
    }
    .sf-location-item:hover { background: rgba(255,255,255,0.1); }
    .sf-location-item.current-location { background: rgba(16, 185, 129, 0.2); color: var(--emerald); font-weight: bold; }

    .sf-vote-player { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 0.9rem; }
  </style>
`;

// DOM REFS
const timerEl = document.getElementById('sf-timer');
const statusEl = document.getElementById('sf-status');
const btnToggleCard = document.getElementById('sf-btn-toggle-card');
const myCard = document.getElementById('sf-my-card');
const cardLocation = document.getElementById('sf-card-location');
const cardRole = document.getElementById('sf-card-role');
const playerListEl = document.getElementById('sf-player-list');
const spyActions = document.getElementById('sf-spy-actions');
const btnSpyReveal = document.getElementById('sf-btn-spy-reveal');
const activityFeed = document.getElementById('sf-activity-feed');
const btnAccuse = document.getElementById('sf-btn-accuse');
const locationList = document.getElementById('sf-location-list');

// Overlays
const voteOverlay = document.getElementById('sf-vote-overlay');
const voteTitle = document.getElementById('sf-vote-title');
const voteDesc = document.getElementById('sf-vote-desc');
const voteStatus = document.getElementById('sf-vote-status');
const voteButtons = document.getElementById('sf-vote-buttons');
const btnVoteGuilty = document.getElementById('sf-btn-vote-guilty');
const btnVoteInnocent = document.getElementById('sf-btn-vote-innocent');

const spyGuessOverlay = document.getElementById('sf-spy-guess-overlay');
const spyGuessDesc = document.getElementById('sf-spy-guess-desc');
const spyGuessInputArea = document.getElementById('sf-spy-guess-input-area');
const spyGuessSelect = document.getElementById('sf-spy-guess-select');
const btnSpyConfirmGuess = document.getElementById('sf-btn-spy-confirm-guess');
const spyGuessWaiting = document.getElementById('sf-spy-guess-waiting');

const gameOverOverlay = document.getElementById('sf-game-over-overlay');
const gameOverTitle = document.getElementById('sf-gameover-title');
const gameOverReason = document.getElementById('sf-gameover-reason');
const gameOverReveal = document.getElementById('sf-gameover-reveal');
const btnPlayAgain = document.getElementById('sf-btn-play-again');

// LOCAL STATE
let cardVisible = false;
let isSpy = false;
let hasVoted = false;
let myLocation = null;
let allLocations = [];

// TOGGLE CARD
btnToggleCard.addEventListener('click', () => {
  cardVisible = !cardVisible;
  myCard.style.display = cardVisible ? 'block' : 'none';
  btnToggleCard.textContent = cardVisible ? '🙈 HIDE CARD' : '👁 MY CARD';
});

// SPY REVEAL
btnSpyReveal.addEventListener('click', () => {
  socket.emit('spy_reveal', { roomCode: state.roomCode });
});

// ACCUSE
btnAccuse.addEventListener('click', () => {
  // Show a mini picker — just use prompt for now, or better: show inline list
  const players = [...playerListEl.querySelectorAll('.sf-player-item')];
  // Toggle accuse mode — highlight player buttons
  document.querySelectorAll('.sf-player-item .btn-suspect').forEach(b => {
    b.style.display = b.style.display === 'none' ? 'inline-block' : 'none';
  });
});

// VOTE
btnVoteGuilty.addEventListener('click', () => {
  if (hasVoted) return;
  hasVoted = true;
  socket.emit('cast_vote', { roomCode: state.roomCode, guilty: true });
  voteButtons.style.display = 'none';
});
btnVoteInnocent.addEventListener('click', () => {
  if (hasVoted) return;
  hasVoted = true;
  socket.emit('cast_vote', { roomCode: state.roomCode, guilty: false });
  voteButtons.style.display = 'none';
});

// SPY GUESS
btnSpyConfirmGuess.addEventListener('click', () => {
  const loc = spyGuessSelect.value;
  if (!loc) return;
  socket.emit('spy_guess_location', { roomCode: state.roomCode, location: loc });
  btnSpyConfirmGuess.disabled = true;
  btnSpyConfirmGuess.textContent = 'GUESSING...';
});

// PLAY AGAIN
btnPlayAgain.addEventListener('click', () => {
  socket.emit('play_again', { roomCode: state.roomCode });
});

// HELPERS
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function addActivity(text, type = '') {
  const div = document.createElement('div');
  div.className = `sf-activity-msg ${type}`;
  div.textContent = text;
  activityFeed.appendChild(div);
  activityFeed.scrollTop = activityFeed.scrollHeight;
}

function renderPlayers(players) {
  playerListEl.innerHTML = '';
  players.forEach(p => {
    const li = document.createElement('li');
    li.className = `sf-player-item ${p.id === state.playerId ? 'me' : ''}`;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'sf-player-name';
    nameSpan.textContent = p.name + (p.id === state.playerId ? ' (You)' : '');
    li.appendChild(nameSpan);

    if (p.id !== state.playerId) {
      const actions = document.createElement('span');
      actions.className = 'sf-player-actions';

      const askBtn = document.createElement('button');
      askBtn.className = 'btn-ask';
      askBtn.textContent = '❓ Ask';
      askBtn.onclick = () => socket.emit('ask_question', { roomCode: state.roomCode, targetId: p.id });

      const suspectBtn = document.createElement('button');
      suspectBtn.className = 'btn-suspect';
      suspectBtn.textContent = '🔎 Accuse';
      suspectBtn.style.display = 'none';
      suspectBtn.onclick = () => socket.emit('call_vote', { roomCode: state.roomCode, suspectId: p.id });

      actions.appendChild(askBtn);
      actions.appendChild(suspectBtn);
      li.appendChild(actions);
    }
    playerListEl.appendChild(li);
  });
}

// SOCKET EVENTS
socket.on('spyfall_your_card', (data) => {
  isSpy = data.isSpy;
  myLocation = data.location;
  allLocations = data.allLocations || [];

  if (isSpy) {
    cardLocation.textContent = '🕵️ YOU ARE THE SPY';
    cardLocation.style.color = '#a855f7';
    cardRole.textContent = 'Figure out the location!';
    spyActions.style.display = 'block';
  } else {
    cardLocation.textContent = data.location;
    cardLocation.style.color = 'var(--gold)';
    cardRole.textContent = `Role: ${data.role}`;
    spyActions.style.display = 'none';
  }

  // Populate location list
  locationList.innerHTML = '';
  allLocations.forEach(loc => {
    const li = document.createElement('li');
    li.className = `sf-location-item ${(!isSpy && loc === data.location) ? 'current-location' : ''}`;
    li.textContent = loc;
    locationList.appendChild(li);
  });

  // Populate spy guess dropdown
  spyGuessSelect.innerHTML = '<option value="">-- Select Location --</option>';
  allLocations.forEach(loc => {
    const opt = document.createElement('option');
    opt.value = loc;
    opt.textContent = loc;
    spyGuessSelect.appendChild(opt);
  });
});

socket.on('spyfall_state', (data) => {
  timerEl.textContent = formatTime(data.timeLeft);
  if (data.timeLeft <= 60) {
    timerEl.style.color = '#ef4444';
  } else if (data.timeLeft <= 120) {
    timerEl.style.color = 'var(--gold)';
  } else {
    timerEl.style.color = 'var(--emerald)';
  }

  if (data.state === 'playing') {
    statusEl.textContent = 'ASK QUESTIONS — FIND THE SPY';
    voteOverlay.style.display = 'none';
    spyGuessOverlay.style.display = 'none';
    gameOverOverlay.style.display = 'none';
    btnAccuse.style.display = 'block';
  } else if (data.state === 'spy_guessing') {
    statusEl.textContent = 'SPY IS GUESSING THE LOCATION...';
    voteOverlay.style.display = 'none';
    spyGuessOverlay.style.display = 'flex';
    btnAccuse.style.display = 'none';

    if (isSpy) {
      spyGuessDesc.textContent = 'You have been caught! Guess the location to steal the win.';
      spyGuessInputArea.style.display = 'block';
      spyGuessWaiting.style.display = 'none';
    } else {
      spyGuessDesc.textContent = 'The Spy is deciding their guess...';
      spyGuessInputArea.style.display = 'none';
      spyGuessWaiting.style.display = 'block';
    }
  } else if (data.state === 'game_over') {
    statusEl.textContent = 'GAME OVER';
    btnAccuse.style.display = 'none';
  }

  if (data.voteInProgress) {
    btnAccuse.disabled = true;
  } else {
    btnAccuse.disabled = false;
  }

  renderPlayers(data.players);
});

socket.on('spyfall_timer_sync', (data) => {
  timerEl.textContent = formatTime(data.timeLeft);
  if (data.timeLeft <= 60) {
    timerEl.style.color = '#ef4444';
  } else if (data.timeLeft <= 120) {
    timerEl.style.color = 'var(--gold)';
  }
});

socket.on('spyfall_question', (data) => {
  addActivity(`${data.askerName} is questioning ${data.targetName}...`, 'question');
});

socket.on('spyfall_vote_called', (data) => {
  hasVoted = false;
  voteOverlay.style.display = 'flex';
  voteTitle.textContent = '⚠️ VOTE CALLED';
  voteDesc.textContent = `${data.callerName} accuses ${data.suspectName} of being the Spy!`;
  voteButtons.style.display = 'flex';

  addActivity(`${data.callerName} accuses ${data.suspectName}!`, 'vote');
});

socket.on('spyfall_vote_update', (data) => {
  voteStatus.innerHTML = '';
  data.votes.forEach(v => {
    const div = document.createElement('div');
    div.className = 'sf-vote-player';
    const statusText = v.voted ? (v.votedGuilty ? '🔴 Guilty' : '🟢 Not Guilty') : '⏳ Voting...';
    div.innerHTML = `<span>${v.name}</span><span>${statusText}</span>`;
    voteStatus.appendChild(div);
  });
});

socket.on('spyfall_vote_failed', (data) => {
  voteOverlay.style.display = 'none';
  addActivity(data.message, 'system');
  if (window.app.showToast) window.app.showToast(data.message, 'info');
});

socket.on('spyfall_spy_caught', (data) => {
  voteOverlay.style.display = 'none';
  addActivity(data.message, 'spy');
});

socket.on('spyfall_spy_reveal', (data) => {
  addActivity(data.message, 'spy');
});

socket.on('spyfall_game_over', (data) => {
  spyGuessOverlay.style.display = 'none';
  voteOverlay.style.display = 'none';
  gameOverOverlay.style.display = 'flex';

  if (data.winner === 'spy') {
    gameOverTitle.textContent = '🕵️ SPY WINS!';
    gameOverTitle.style.color = '#a855f7';
  } else {
    gameOverTitle.textContent = '🎉 PLAYERS WIN!';
    gameOverTitle.style.color = 'var(--emerald)';
  }

  gameOverReason.textContent = data.reason;

  // Reveal all roles
  gameOverReveal.innerHTML = `
    <div style="margin-bottom: 15px; font-size: 1.2rem;">
      📍 Location: <span style="color: var(--gold); font-weight: bold;">${data.location}</span>
    </div>
    <div style="display: flex; flex-direction: column; gap: 6px; text-align: left; max-width: 350px; margin: 0 auto;">
      ${data.players.map(p => `
        <div style="display: flex; justify-content: space-between; padding: 6px 12px; border-radius: 4px; background: rgba(${p.isSpy ? '168,85,247' : '255,255,255'},0.1);">
          <span>${p.name}</span>
          <span style="color: ${p.isSpy ? '#a855f7' : 'var(--text-dim)'}; font-weight: ${p.isSpy ? 'bold' : 'normal'};">${p.role}</span>
        </div>
      `).join('')}
    </div>
  `;

  if (state.isHost) {
    btnPlayAgain.style.display = 'block';
  }
});
