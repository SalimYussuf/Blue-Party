const socket = window.app.socket;
const state = window.app.state;

const screen = document.getElementById('codenames-screen');

screen.innerHTML = `
  <div class="game-layout" id="codenames-layout" style="display: flex; flex-direction: column; height: 100vh; padding: 20px; box-sizing: border-box;">
    
    <!-- TOP BAR -->
    <div class="glass" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-radius: 12px; margin-bottom: 20px;">
      <div id="cn-score-red" style="color: #ef4444; font-size: 1.5rem; font-weight: bold; flex: 1;">RED: 0 / 9</div>
      
      <div id="cn-status-banner" style="flex: 2; text-align: center; font-size: 1.5rem; font-weight: bold; letter-spacing: 2px;">
        TEAM SELECTION
      </div>
      
      <div id="cn-score-blue" style="color: #3b82f6; font-size: 1.5rem; font-weight: bold; flex: 1; text-align: right;">BLUE: 0 / 8</div>
    </div>

    <!-- TEAM SELECTION VIEW -->
    <div id="cn-team-selection" style="display: flex; gap: 20px; flex: 1;">
      
      <!-- RED TEAM -->
      <div class="glass" style="flex: 1; border-top: 5px solid #ef4444; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 20px;">
        <h2 style="color: #ef4444; text-align: center; margin: 0;">RED TEAM</h2>
        
        <div style="flex: 1; display: flex; flex-direction: column; gap: 10px;">
          <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px;">
            <h3 style="margin: 0 0 10px 0; color: #fca5a5;">Spymaster (Max 1)</h3>
            <ul id="cn-red-spymasters" style="list-style: none; padding: 0; margin: 0 0 15px 0; min-height: 24px;"></ul>
            <button class="btn btn-outline btn-block btn-sm" onclick="joinTeam('red', 'spymaster')">Join as Spymaster</button>
          </div>
          
          <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; flex: 1;">
            <h3 style="margin: 0 0 10px 0; color: #fca5a5;">Operatives</h3>
            <ul id="cn-red-operatives" style="list-style: none; padding: 0; margin: 0 0 15px 0; min-height: 24px;"></ul>
            <button class="btn btn-outline btn-block btn-sm" onclick="joinTeam('red', 'operative')">Join as Operative</button>
          </div>
        </div>
      </div>

      <!-- BLUE TEAM -->
      <div class="glass" style="flex: 1; border-top: 5px solid #3b82f6; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 20px;">
        <h2 style="color: #3b82f6; text-align: center; margin: 0;">BLUE TEAM</h2>
        
        <div style="flex: 1; display: flex; flex-direction: column; gap: 10px;">
          <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px;">
            <h3 style="margin: 0 0 10px 0; color: #93c5fd;">Spymaster (Max 1)</h3>
            <ul id="cn-blue-spymasters" style="list-style: none; padding: 0; margin: 0 0 15px 0; min-height: 24px;"></ul>
            <button class="btn btn-outline btn-block btn-sm" onclick="joinTeam('blue', 'spymaster')">Join as Spymaster</button>
          </div>
          
          <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; flex: 1;">
            <h3 style="margin: 0 0 10px 0; color: #93c5fd;">Operatives</h3>
            <ul id="cn-blue-operatives" style="list-style: none; padding: 0; margin: 0 0 15px 0; min-height: 24px;"></ul>
            <button class="btn btn-outline btn-block btn-sm" onclick="joinTeam('blue', 'operative')">Join as Operative</button>
          </div>
        </div>
      </div>
      
      <!-- SPECTATORS & START -->
      <div class="glass" style="flex: 1; border-top: 5px solid var(--emerald); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 20px;">
        <h2 style="color: var(--emerald); text-align: center; margin: 0;">UNASSIGNED</h2>
        
        <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; flex: 1;">
          <ul id="cn-unassigned" style="list-style: none; padding: 0; margin: 0;"></ul>
        </div>
        
        <button class="btn btn-gold btn-block" id="cn-btn-start-match" style="display: none; font-size: 1.2rem; padding: 15px;">START MATCH</button>
        <p id="cn-waiting-host" style="text-align: center; color: var(--text-dim);">Waiting for host to start...</p>
      </div>
    </div>

    <!-- PLAYING VIEW -->
    <div id="cn-playing-view" style="display: none; flex-direction: column; flex: 1; gap: 20px;">
      
      <!-- ACTION BAR -->
      <div class="glass" id="cn-action-bar" style="padding: 15px; border-radius: 12px; display: flex; gap: 15px; align-items: center; justify-content: center; background: rgba(0,0,0,0.5);">
        
        <!-- Spymaster Clue Input -->
        <div id="cn-spymaster-controls" style="display: none; gap: 10px; width: 100%; max-width: 600px;">
          <input type="text" id="cn-clue-word" placeholder="One Word Clue..." style="flex: 2; padding: 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.8); color: white; font-size: 1.1rem; text-transform: uppercase;">
          <input type="number" id="cn-clue-count" placeholder="#" min="0" max="9" style="flex: 1; padding: 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.8); color: white; font-size: 1.1rem;">
          <button class="btn btn-emerald" id="cn-btn-submit-clue" style="flex: 1;">GIVE CLUE</button>
        </div>
        
        <!-- Operative Guess Controls -->
        <div id="cn-operative-controls" style="display: none; gap: 20px; align-items: center;">
          <div id="cn-current-clue-display" style="font-size: 1.5rem; letter-spacing: 2px;">
            CLUE: <span id="cn-clue-text" style="color: var(--gold); font-weight: bold;">NONE</span> 
            <span style="color: var(--text-dim);">|</span> 
            GUESSES LEFT: <span id="cn-guesses-text" style="color: var(--gold); font-weight: bold;">0</span>
          </div>
          <button class="btn btn-outline" id="cn-btn-end-guess">END GUESSING</button>
        </div>
        
      </div>

      <!-- BOARD GRID -->
      <div id="cn-board-grid" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; flex: 1; margin: 0 auto; width: 100%; max-width: 1000px; padding-bottom: 20px;">
        <!-- Cards injected here -->
      </div>
      
    </div>
  </div>

  <style>
    .cn-card {
      background: #e5e5e5;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      font-weight: 900;
      color: #333;
      text-transform: uppercase;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
      transition: transform 0.1s, box-shadow 0.1s;
      user-select: none;
      position: relative;
      overflow: hidden;
      min-height: 80px;
    }
    
    .cn-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 10px rgba(0,0,0,0.4);
    }
    
    /* Spymaster hints (unrevealed) */
    .cn-card.spy-red { background: #fecaca; color: #991b1b; border: 2px solid #ef4444; box-shadow: inset 0 0 8px rgba(239,68,68,0.3); }
    .cn-card.spy-blue { background: #bfdbfe; color: #1e3a8a; border: 2px solid #3b82f6; box-shadow: inset 0 0 8px rgba(59,130,246,0.3); }
    .cn-card.spy-neutral { background: #e7e5e4; color: #57534e; border: 2px solid #a8a29e; box-shadow: inset 0 0 8px rgba(168,162,158,0.3); }
    .cn-card.spy-black { background: #9ca3af; color: #111827; border: 2px solid #374151; box-shadow: inset 0 0 8px rgba(17,17,17,0.3); }
    
    /* Revealed states */
    .cn-card.rev-red { background: #ef4444; color: white; border: none; cursor: default; }
    .cn-card.rev-blue { background: #3b82f6; color: white; border: none; cursor: default; }
    .cn-card.rev-neutral { background: #d6d3d1; color: #666; border: none; cursor: default; }
    .cn-card.rev-black { background: #1f2937; color: white; border: none; cursor: default; }
    
    .cn-card.revealed:hover { transform: none; box-shadow: none; }
    
    /* Role tags in lobby */
    .cn-player-item { padding: 5px; margin-bottom: 5px; border-radius: 4px; background: rgba(255,255,255,0.1); }
    .cn-player-item.me { border-left: 3px solid var(--emerald); font-weight: bold; }
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
  
  boardGrid: document.getElementById('cn-board-grid')
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
    ui.statusBanner.textContent = 'TEAM SELECTION';
    ui.statusBanner.style.color = 'white';
    
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
      ui.statusBanner.textContent = data.turnPhase === 'clue' ? 'RED SPYMASTER TURN' : 'RED TEAM GUESSING';
      ui.statusBanner.style.color = '#ef4444';
    } else {
      ui.statusBanner.textContent = data.turnPhase === 'clue' ? 'BLUE SPYMASTER TURN' : 'BLUE TEAM GUESSING';
      ui.statusBanner.style.color = '#3b82f6';
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
    
    ui.spyControls.style.display = 'none';
    ui.opControls.style.display = 'none';
    
    // In a real flow, we'd maybe emit play_again from host, but here host can just click play_again from standard results if we had it,
    // Or we just leave the board visible. For Party Box, usually we want a Back To Lobby.
    // Let's add a button dynamically for the host
    if (state.isHost && !document.getElementById('cn-btn-play-again')) {
      const btn = document.createElement('button');
      btn.id = 'cn-btn-play-again';
      btn.className = 'btn btn-gold';
      btn.textContent = 'PLAY AGAIN / BACK TO LOBBY';
      btn.onclick = () => window.app.socket.emit('play_again', { roomCode: state.roomCode });
      document.getElementById('cn-action-bar').appendChild(btn);
    }
  }
});

socket.on('codenames_board', (data) => {
  const me = state.players.find(p => p.id === state.playerId) || { role: null, team: null };
  const isSpy = data.isSpymaster;
  
  ui.boardGrid.innerHTML = '';
  data.board.forEach(card => {
    const div = document.createElement('div');
    div.className = 'cn-card';
    div.textContent = card.word;
    
    if (card.revealed) {
      div.classList.add('revealed', `rev-${card.color}`);
    } else {
      if (isSpy && card.color) {
        div.classList.add(`spy-${card.color}`);
      } else {
        // Can click if operative and it's our turn to guess
        div.onclick = () => handleCardClick(card.index);
      }
    }
    
    ui.boardGrid.appendChild(div);
  });
});

socket.on('codenames_clue_given', (data) => {
  const color = data.team === 'red' ? 'color: #ef4444' : 'color: #3b82f6';
  window.app.showToast(`<span style="${color}">${data.team.toUpperCase()} Clue:</span> ${data.clue.word} (${data.clue.count})`, 'info');
  // Hacky toast html support if it exists, otherwise it strips tags (our sanitize doesn't strip toast strings because it's client side).
});

socket.on('codenames_card_revealed', (data) => {
  const color = data.team === 'red' ? 'color: #ef4444' : 'color: #3b82f6';
  const cColor = data.card.color === 'red' ? '#ef4444' : data.card.color === 'blue' ? '#3b82f6' : data.card.color === 'neutral' ? '#a8a29e' : '#111';
  // Optional: could add an animation here or toast
});

socket.on('codenames_game_over', (data) => {
  window.app.showToast(data.reason, 'warning');
});
