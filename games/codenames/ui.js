const socket = window.app.socket;
const state = window.app.state;

const screen = document.getElementById('codenames-screen');

screen.innerHTML = `
  <div class="game-layout" id="cn-layout">
    
    <!-- TOP BAR -->
    <div class="cn-topbar">
      <div id="cn-score-red" class="cn-score cn-red-text">RED: 0 / 9</div>
      
      <div id="cn-status-banner" class="cn-status-banner">
        <span class="glitch-text" data-text="CLASSIFIED INTEL">CLASSIFIED INTEL</span>
      </div>
      
      <div id="cn-score-blue" class="cn-score cn-blue-text">BLUE: 0 / 8</div>
    </div>

    <!-- TEAM SELECTION VIEW -->
    <div id="cn-team-selection" class="cn-dossier-view">
      
      <!-- RED TEAM DOSSIER -->
      <div class="cn-dossier cn-dossier-red">
        <div class="dossier-header">RED AGENCY</div>
        <div class="dossier-content">
          <div class="role-section">
            <h3 class="role-title">SPYMASTER (1)</h3>
            <ul id="cn-red-spymasters" class="agent-list"></ul>
            <button class="cn-btn cn-btn-red" onclick="joinTeam('red', 'spymaster')">ASSIGN SPYMASTER</button>
          </div>
          <div class="role-section flex-1">
            <h3 class="role-title">FIELD AGENTS</h3>
            <ul id="cn-red-operatives" class="agent-list"></ul>
            <button class="cn-btn cn-btn-red" onclick="joinTeam('red', 'operative')">ASSIGN AGENT</button>
          </div>
        </div>
      </div>

      <!-- BLUE TEAM DOSSIER -->
      <div class="cn-dossier cn-dossier-blue">
        <div class="dossier-header">BLUE AGENCY</div>
        <div class="dossier-content">
          <div class="role-section">
            <h3 class="role-title">SPYMASTER (1)</h3>
            <ul id="cn-blue-spymasters" class="agent-list"></ul>
            <button class="cn-btn cn-btn-blue" onclick="joinTeam('blue', 'spymaster')">ASSIGN SPYMASTER</button>
          </div>
          <div class="role-section flex-1">
            <h3 class="role-title">FIELD AGENTS</h3>
            <ul id="cn-blue-operatives" class="agent-list"></ul>
            <button class="cn-btn cn-btn-blue" onclick="joinTeam('blue', 'operative')">ASSIGN AGENT</button>
          </div>
        </div>
      </div>
      
      <!-- UNASSIGNED -->
      <div class="cn-dossier cn-dossier-neutral">
        <div class="dossier-header">PENDING CLEARANCE</div>
        <div class="dossier-content">
          <div class="role-section flex-1">
            <ul id="cn-unassigned" class="agent-list"></ul>
          </div>
          <button class="cn-btn cn-btn-gold" id="cn-btn-start-match" style="display: none;">INITIATE OPERATION</button>
          <p id="cn-waiting-host" class="typewriter-text">Awaiting Commander...</p>
        </div>
      </div>
    </div>

    <!-- PLAYING VIEW -->
    <div id="cn-playing-view" style="display: none; flex-direction: column; flex: 1; position: relative;">
      
      <!-- BOARD GRID -->
      <div id="cn-board-grid"></div>
      
      <!-- ACTION BAR (Floating Bottom) -->
      <div id="cn-action-bar" class="cn-floating-controls">
        
        <!-- Spymaster Clue Input -->
        <div id="cn-spymaster-controls" style="display: none; gap: 15px; width: 100%; max-width: 700px; margin: 0 auto;">
          <input type="text" id="cn-clue-word" placeholder="TRANSMIT CLUE..." class="cn-input" autocomplete="off">
          <input type="number" id="cn-clue-count" placeholder="#" min="0" max="9" class="cn-input cn-input-num">
          <button class="cn-btn cn-btn-gold" id="cn-btn-submit-clue">TRANSMIT</button>
        </div>
        
        <!-- Operative Guess Controls -->
        <div id="cn-operative-controls" style="display: none; gap: 30px; align-items: center; justify-content: center; width: 100%;">
          <div class="cn-intel-display">
            INTEL: <span id="cn-clue-text" class="intel-highlight">NONE</span> 
            <span class="intel-divider">|</span> 
            REMAINING: <span id="cn-guesses-text" class="intel-highlight">0</span>
          </div>
          <button class="cn-btn cn-btn-outline" id="cn-btn-end-guess">CEASE ACTION</button>
        </div>
        
      </div>
    </div>
  </div>

  <style>
    /* Global Codenames Theme */
    @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Share+Tech+Mono&display=swap');

    #cn-layout {
      font-family: 'Courier Prime', monospace;
      background: radial-gradient(circle at center, #1a1a1a, #0a0a0a);
      color: #e5e5e5;
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 100vh;
      padding: 20px;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
    }

    /* Scanline overlay */
    #cn-layout::before {
      content: " ";
      display: block;
      position: absolute;
      top: 0; left: 0; bottom: 0; right: 0;
      background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
      z-index: 2;
      background-size: 100% 2px, 3px 100%;
      pointer-events: none;
    }

    /* Topbar */
    .cn-topbar {
      position: relative;
      z-index: 10;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 30px;
      background: rgba(0,0,0,0.6);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 4px;
      margin-bottom: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    }

    .cn-score {
      font-size: 1.8rem;
      font-weight: bold;
      flex: 1;
      font-family: 'Share Tech Mono', monospace;
    }
    
    .cn-red-text { color: #ef4444; text-shadow: 0 0 10px rgba(239,68,68,0.5); }
    .cn-blue-text { color: #3b82f6; text-shadow: 0 0 10px rgba(59,130,246,0.5); text-align: right; }

    .cn-status-banner {
      flex: 2;
      text-align: center;
      font-size: 2rem;
      font-weight: bold;
      letter-spacing: 4px;
      font-family: 'Share Tech Mono', monospace;
      text-transform: uppercase;
      transition: color 0.3s;
    }

    /* Dossier Views */
    .cn-dossier-view {
      display: flex;
      gap: 20px;
      flex: 1;
      position: relative;
      z-index: 10;
      padding-bottom: 20px;
    }

    .cn-dossier {
      flex: 1;
      background: #e6dfd3; /* Manila folder color */
      border-radius: 4px 20px 4px 4px;
      box-shadow: 5px 5px 15px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      position: relative;
      color: #222;
    }

    .cn-dossier::before {
      content: '';
      position: absolute;
      top: -10px;
      left: 10px;
      width: 80px;
      height: 20px;
      background: inherit;
      border-radius: 5px 5px 0 0;
      box-shadow: inset 0 5px 5px rgba(0,0,0,0.05);
    }

    .dossier-header {
      padding: 15px 20px;
      font-size: 1.8rem;
      font-weight: bold;
      border-bottom: 2px solid rgba(0,0,0,0.1);
      text-align: center;
      letter-spacing: 2px;
      text-transform: uppercase;
      font-family: 'Share Tech Mono', monospace;
    }

    .cn-dossier-red .dossier-header { color: #b91c1c; border-bottom-color: #fca5a5; }
    .cn-dossier-blue .dossier-header { color: #1d4ed8; border-bottom-color: #93c5fd; }
    .cn-dossier-neutral .dossier-header { color: #444; border-bottom-color: #ccc; }

    .dossier-content {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 15px;
      flex: 1;
    }

    .role-section {
      background: rgba(255,255,255,0.4);
      padding: 15px;
      border: 1px dashed rgba(0,0,0,0.2);
      border-radius: 2px;
    }
    
    .flex-1 { flex: 1; }

    .role-title {
      margin: 0 0 10px 0;
      font-size: 1.1rem;
      color: #555;
      text-decoration: underline;
    }

    .agent-list {
      list-style: none;
      padding: 0;
      margin: 0 0 15px 0;
      min-height: 24px;
    }

    .cn-player-item {
      padding: 8px 10px;
      margin-bottom: 5px;
      background: rgba(0,0,0,0.05);
      border-left: 3px solid transparent;
      font-family: 'Courier Prime', monospace;
      font-weight: bold;
      display: flex;
      align-items: center;
    }
    .cn-player-item::before { content: '>'; margin-right: 8px; color: #888; }
    .cn-player-item.me { border-left-color: #fbbf24; background: rgba(251,191,36,0.1); }

    /* Buttons */
    .cn-btn {
      width: 100%;
      padding: 12px;
      font-family: 'Share Tech Mono', monospace;
      font-size: 1.1rem;
      font-weight: bold;
      border: none;
      border-radius: 2px;
      cursor: pointer;
      text-transform: uppercase;
      transition: all 0.2s;
      letter-spacing: 1px;
    }

    .cn-btn-red { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
    .cn-btn-red:hover { background: #fecaca; transform: translateY(-2px); box-shadow: 0 4px 8px rgba(239,68,68,0.2); }
    
    .cn-btn-blue { background: #dbeafe; color: #1e3a8a; border: 1px solid #93c5fd; }
    .cn-btn-blue:hover { background: #bfdbfe; transform: translateY(-2px); box-shadow: 0 4px 8px rgba(59,130,246,0.2); }
    
    .cn-btn-gold { background: #fbbf24; color: #000; box-shadow: 0 0 10px rgba(251,191,36,0.3); }
    .cn-btn-gold:hover { background: #f59e0b; transform: translateY(-2px); box-shadow: 0 4px 15px rgba(251,191,36,0.5); }
    
    .cn-btn-outline { background: transparent; color: #e5e5e5; border: 1px solid #e5e5e5; }
    .cn-btn-outline:hover { background: rgba(255,255,255,0.1); transform: translateY(-2px); }

    .typewriter-text { text-align: center; color: #555; font-style: italic; }

    /* Floating Controls */
    .cn-floating-controls {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 90%;
      max-width: 800px;
      background: rgba(10, 10, 10, 0.85);
      border: 1px solid rgba(255,255,255,0.1);
      border-bottom: none;
      border-radius: 8px 8px 0 0;
      padding: 20px;
      box-shadow: 0 -10px 30px rgba(0,0,0,0.8);
      z-index: 20;
      backdrop-filter: blur(5px);
    }

    .cn-input {
      padding: 12px 15px;
      border-radius: 4px;
      border: 1px solid rgba(255,255,255,0.2);
      background: rgba(0,0,0,0.6);
      color: #fbbf24;
      font-family: 'Share Tech Mono', monospace;
      font-size: 1.2rem;
      flex: 2;
      text-transform: uppercase;
      outline: none;
    }
    .cn-input:focus { border-color: #fbbf24; box-shadow: 0 0 10px rgba(251,191,36,0.2); }
    .cn-input-num { flex: 1; text-align: center; }

    .cn-intel-display {
      font-family: 'Share Tech Mono', monospace;
      font-size: 1.5rem;
      letter-spacing: 2px;
      color: #ccc;
    }
    .intel-highlight { color: #fbbf24; font-weight: bold; text-shadow: 0 0 8px rgba(251,191,36,0.4); }
    .intel-divider { color: #444; margin: 0 15px; }

    /* Board Grid & Cards */
    #cn-board-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 15px;
      width: 100%;
      max-width: 1000px;
      margin: 0 auto;
      padding-bottom: 100px; /* space for floating controls */
      perspective: 1200px;
      z-index: 10;
    }

    .cn-card-wrapper {
      position: relative;
      width: 100%;
      aspect-ratio: 1.8 / 1;
      cursor: pointer;
    }

    .cn-card-inner {
      position: relative;
      width: 100%;
      height: 100%;
      text-align: center;
      transition: transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
      transform-style: preserve-3d;
      box-shadow: 0 4px 8px rgba(0,0,0,0.4);
      border-radius: 4px;
    }

    .cn-card-wrapper:hover .cn-card-inner:not(.is-flipped) {
      transform: translateY(-5px) rotateX(5deg);
      box-shadow: 0 8px 16px rgba(0,0,0,0.6);
    }

    .cn-card-front, .cn-card-back {
      position: absolute;
      width: 100%;
      height: 100%;
      backface-visibility: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      font-size: 1.1rem;
      font-weight: bold;
      text-transform: uppercase;
      user-select: none;
      padding: 10px;
      box-sizing: border-box;
      word-break: break-word;
    }

    /* Front (Manila Folder style) */
    .cn-card-front {
      background: #e6dfd3 url('data:image/svg+xml;utf8,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/></filter><rect width="100" height="100" filter="url(%23noise)" opacity="0.05"/></svg>');
      color: #111;
      border: 1px solid #ccc;
    }
    
    /* Typewriter text styling */
    .cn-word-text {
      background: rgba(255,255,255,0.5);
      padding: 5px 10px;
      border-radius: 2px;
      box-shadow: inset 0 0 5px rgba(0,0,0,0.1);
      border: 1px dotted #aaa;
      letter-spacing: 1px;
    }

    /* Spymaster Front Hints */
    .spy-view .spy-red { border: 3px solid #ef4444; box-shadow: inset 0 0 15px rgba(239,68,68,0.3); }
    .spy-view .spy-blue { border: 3px solid #3b82f6; box-shadow: inset 0 0 15px rgba(59,130,246,0.3); }
    .spy-view .spy-neutral { border: 3px solid #78716c; box-shadow: inset 0 0 15px rgba(120,113,108,0.3); }
    .spy-view .spy-black { border: 3px solid #111; box-shadow: inset 0 0 15px rgba(0,0,0,0.5); background-color: #d6d3d1; }
    
    .spy-view .spy-red .cn-word-text { color: #b91c1c; }
    .spy-view .spy-blue .cn-word-text { color: #1d4ed8; }
    .spy-view .spy-neutral .cn-word-text { color: #444; }
    .spy-view .spy-black .cn-word-text { color: #000; text-decoration: line-through; }

    /* Back (Revealed states) */
    .cn-card-back {
      transform: rotateY(180deg);
      border: 2px solid transparent;
      display: flex;
      flex-direction: column;
    }

    .is-flipped { transform: rotateY(180deg); }

    .rev-red { background: #7f1d1d; color: #fca5a5; border-color: #ef4444; box-shadow: inset 0 0 20px rgba(239,68,68,0.5); }
    .rev-blue { background: #1e3a8a; color: #93c5fd; border-color: #3b82f6; box-shadow: inset 0 0 20px rgba(59,130,246,0.5); }
    .rev-neutral { background: #292524; color: #a8a29e; border-color: #78716c; }
    .rev-black { background: #000000; color: #ef4444; border-color: #ef4444; box-shadow: 0 0 15px #ef4444; }

    .stamp {
      font-family: 'Share Tech Mono', monospace;
      font-size: 1.5rem;
      border: 3px solid currentColor;
      padding: 5px 10px;
      border-radius: 5px;
      transform: rotate(-15deg);
      opacity: 0.8;
      margin-top: 5px;
    }

    /* Pulse animation for active turn */
    @keyframes pulse-red { 0% { box-shadow: 0 0 10px rgba(239,68,68,0.5); } 50% { box-shadow: 0 0 25px rgba(239,68,68,0.9); } 100% { box-shadow: 0 0 10px rgba(239,68,68,0.5); } }
    @keyframes pulse-blue { 0% { box-shadow: 0 0 10px rgba(59,130,246,0.5); } 50% { box-shadow: 0 0 25px rgba(59,130,246,0.9); } 100% { box-shadow: 0 0 10px rgba(59,130,246,0.5); } }
    
    .turn-red { animation: pulse-red 2s infinite; border-bottom: 2px solid #ef4444; }
    .turn-blue { animation: pulse-blue 2s infinite; border-bottom: 2px solid #3b82f6; }

  </style>
`;

// Expose joinTeam globally for inline onclick
window.joinTeam = function(team, role) {
  socket.emit('join_team', { roomCode: state.roomCode, team, role });
};

// DOM REFS
const ui = {
  teamView: document.getElementById('cn-team-selection'),
  playView: document.getElementById('cn-playing-view'),
  scoreRed: document.getElementById('cn-score-red'),
  scoreBlue: document.getElementById('cn-score-blue'),
  statusBanner: document.getElementById('cn-status-banner'),
  
  // Lobby
  redSpy: document.getElementById('cn-red-spymasters'),
  redOp: document.getElementById('cn-red-operatives'),
  blueSpy: document.getElementById('cn-blue-spymasters'),
  blueOp: document.getElementById('cn-blue-operatives'),
  unassigned: document.getElementById('cn-unassigned'),
  btnStartMatch: document.getElementById('cn-btn-start-match'),
  waitingHost: document.getElementById('cn-waiting-host'),
  
  // Controls
  spyControls: document.getElementById('cn-spymaster-controls'),
  opControls: document.getElementById('cn-operative-controls'),
  clueWord: document.getElementById('cn-clue-word'),
  clueCount: document.getElementById('cn-clue-count'),
  btnSubmitClue: document.getElementById('cn-btn-submit-clue'),
  clueText: document.getElementById('cn-clue-text'),
  guessesText: document.getElementById('cn-guesses-text'),
  btnEndGuess: document.getElementById('cn-btn-end-guess'),
  
  boardGrid: document.getElementById('cn-board-grid'),
  actionBar: document.getElementById('cn-action-bar')
};

// LISTENERS
ui.btnStartMatch.addEventListener('click', () => {
  socket.emit('start_match', { roomCode: state.roomCode });
});

ui.btnSubmitClue.addEventListener('click', () => {
  const word = ui.clueWord.value.trim();
  const count = ui.clueCount.value;
  if (!word || count === '') return;
  socket.emit('submit_clue', { roomCode: state.roomCode, word, count: parseInt(count) });
});

ui.btnEndGuess.addEventListener('click', () => {
  socket.emit('end_guessing', { roomCode: state.roomCode });
});

function handleCardClick(index) {
  socket.emit('click_card', { roomCode: state.roomCode, cardIndex: index });
}

// SOCKET EVENTS
socket.on('codenames_state', (data) => {
  // Update Scores
  if (data.totalToWin.red > 0) {
    ui.scoreRed.textContent = `RED: ${data.score.red} / ${data.totalToWin.red}`;
    ui.scoreBlue.textContent = `BLUE: ${data.score.blue} / ${data.totalToWin.blue}`;
  }
  
  const me = data.players.find(p => p.id === state.playerId);
  
  if (data.state === 'team_selection') {
    ui.teamView.style.display = 'flex';
    ui.playView.style.display = 'none';
    ui.statusBanner.innerHTML = '<span class="glitch-text" data-text="AGENT ASSIGNMENT">AGENT ASSIGNMENT</span>';
    ui.statusBanner.style.color = '#e5e5e5';
    ui.actionBar.classList.remove('turn-red', 'turn-blue');
    
    // Clear lists
    ui.redSpy.innerHTML = ''; ui.redOp.innerHTML = '';
    ui.blueSpy.innerHTML = ''; ui.blueOp.innerHTML = '';
    ui.unassigned.innerHTML = '';
    
    data.players.forEach(p => {
      const li = document.createElement('li');
      li.className = `cn-player-item ${p.id === state.playerId ? 'me' : ''}`;
      li.textContent = p.name;
      
      if (p.team === 'red' && p.role === 'spymaster') ui.redSpy.appendChild(li);
      else if (p.team === 'red' && p.role === 'operative') ui.redOp.appendChild(li);
      else if (p.team === 'blue' && p.role === 'spymaster') ui.blueSpy.appendChild(li);
      else if (p.team === 'blue' && p.role === 'operative') ui.blueOp.appendChild(li);
      else ui.unassigned.appendChild(li);
    });
    
    if (state.isHost) {
      ui.btnStartMatch.style.display = 'block';
      ui.waitingHost.style.display = 'none';
      
      const reds = data.players.filter(p => p.team === 'red').length;
      const blues = data.players.filter(p => p.team === 'blue').length;
      ui.btnStartMatch.disabled = (reds === 0 || blues === 0);
    } else {
      ui.btnStartMatch.style.display = 'none';
      ui.waitingHost.style.display = 'block';
    }
  } 
  else if (data.state === 'playing') {
    ui.teamView.style.display = 'none';
    ui.playView.style.display = 'flex';
    
    const isMyTurn = (me && me.team === data.currentTurn);
    
    if (data.currentTurn === 'red') {
      ui.statusBanner.innerHTML = data.turnPhase === 'clue' ? 'RED SPYMASTER TURN' : 'RED TEAM GUESSING';
      ui.statusBanner.style.color = '#ef4444';
      ui.actionBar.classList.remove('turn-blue');
      ui.actionBar.classList.add('turn-red');
    } else {
      ui.statusBanner.innerHTML = data.turnPhase === 'clue' ? 'BLUE SPYMASTER TURN' : 'BLUE TEAM GUESSING';
      ui.statusBanner.style.color = '#3b82f6';
      ui.actionBar.classList.remove('turn-red');
      ui.actionBar.classList.add('turn-blue');
    }
    
    // Controls
    ui.spyControls.style.display = 'none';
    ui.opControls.style.display = 'none';
    
    if (data.turnPhase === 'clue') {
      if (isMyTurn && me.role === 'spymaster') {
        ui.spyControls.style.display = 'flex';
        ui.clueWord.value = '';
        ui.clueCount.value = '';
      }
    } else if (data.turnPhase === 'guess') {
      ui.opControls.style.display = 'flex';
      ui.clueText.textContent = `${data.currentClue.word} (${data.currentClue.count})`;
      ui.guessesText.textContent = data.guessesLeft > 90 ? 'UNLIMITED' : data.guessesLeft;
      
      if (isMyTurn && me.role === 'operative') {
        ui.btnEndGuess.style.display = 'block';
      } else {
        ui.btnEndGuess.style.display = 'none';
      }
    }
  }
  else if (data.state === 'game_over') {
    ui.statusBanner.textContent = `${data.winner.toUpperCase()} TEAM WINS!`;
    ui.statusBanner.style.color = data.winner === 'red' ? '#ef4444' : '#3b82f6';
    ui.actionBar.classList.remove('turn-red', 'turn-blue');
    
    ui.spyControls.style.display = 'none';
    ui.opControls.style.display = 'none';
    
    if (state.isHost && !document.getElementById('cn-btn-play-again')) {
      const btn = document.createElement('button');
      btn.id = 'cn-btn-play-again';
      btn.className = 'cn-btn cn-btn-gold';
      btn.textContent = 'PLAY AGAIN / BACK TO LOBBY';
      btn.style.width = 'auto';
      btn.style.margin = '0 auto';
      btn.style.display = 'block';
      btn.onclick = () => window.app.socket.emit('play_again', { roomCode: state.roomCode });
      ui.actionBar.appendChild(btn);
    }
  }
});

socket.on('codenames_board', (data) => {
  const me = state.players.find(p => p.id === state.playerId) || { role: null, team: null };
  const isSpy = data.isSpymaster;
  
  if (isSpy) {
    ui.boardGrid.classList.add('spy-view');
  } else {
    ui.boardGrid.classList.remove('spy-view');
  }
  
  ui.boardGrid.innerHTML = '';
  data.board.forEach(card => {
    // Wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'cn-card-wrapper';
    
    // Inner (for 3D flip)
    const inner = document.createElement('div');
    inner.className = 'cn-card-inner';
    if (card.revealed) inner.classList.add('is-flipped');
    
    // Front (Manila Folder)
    const front = document.createElement('div');
    front.className = 'cn-card-front';
    if (!card.revealed && isSpy && card.color) {
      front.classList.add(`spy-${card.color}`);
    }
    const wordText = document.createElement('div');
    wordText.className = 'cn-word-text';
    wordText.textContent = card.word;
    front.appendChild(wordText);
    
    // Back (Revealed state)
    const back = document.createElement('div');
    back.className = 'cn-card-back';
    
    const backWordText = document.createElement('div');
    backWordText.textContent = card.word;
    backWordText.style.fontSize = '0.9rem';
    backWordText.style.opacity = '0.7';
    back.appendChild(backWordText);
    
    if (card.revealed || isSpy) {
      back.classList.add(`rev-${card.color}`);
      const stamp = document.createElement('div');
      stamp.className = 'stamp';
      if (card.color === 'red') stamp.textContent = 'RED TEAM';
      if (card.color === 'blue') stamp.textContent = 'BLUE TEAM';
      if (card.color === 'neutral') stamp.textContent = 'BYSTANDER';
      if (card.color === 'black') stamp.textContent = 'ASSASSIN';
      back.appendChild(stamp);
    }
    
    if (!card.revealed && !isSpy) {
      wrapper.onclick = () => handleCardClick(card.index);
    }
    
    inner.appendChild(front);
    inner.appendChild(back);
    wrapper.appendChild(inner);
    ui.boardGrid.appendChild(wrapper);
  });
});

socket.on('codenames_clue_given', (data) => {
  const color = data.team === 'red' ? '#ef4444' : '#3b82f6';
  window.app.showToast(`<span style="color: ${color}; font-family: monospace;">[TRANSMISSION] ${data.team.toUpperCase()} CLUE:</span> ${data.clue.word} (${data.clue.count})`, 'info');
});

socket.on('codenames_card_revealed', (data) => {
  // Animation is handled by re-rendering the board with 'revealed: true', triggering the CSS 3D flip.
});

socket.on('codenames_game_over', (data) => {
  window.app.showToast(`[ALERT] ${data.reason}`, 'warning');
});
