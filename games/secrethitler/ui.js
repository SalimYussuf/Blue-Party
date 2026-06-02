/**
 * Secret Hitler Client UI
 * Renders the game board, cards, and interaction elements
 */

// Game state from server
let currentGameState = null;
let myPlayerId = null;
let socket = null;
let initRetry = null;
let initialized = false;

// Dynamically-loaded game scripts usually arrive after page load.
if (typeof window !== 'undefined') {
  window.initSecretHitler = initSecretHitler;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSecretHitler, { once: true });
  } else {
    initSecretHitler();
  }
}

function initSecretHitler() {
  // Get socket from parent app if available
  const appSocket = window.app?.socket;
  if (!appSocket) {
    console.log('Waiting for socket...');
    if (!initRetry) {
      initRetry = setTimeout(() => {
        initRetry = null;
        initSecretHitler();
      }, 100);
    }
    return;
  }

  if (initialized && socket === appSocket) {
    myPlayerId = window.app?.state?.playerId;
    renderGame();
    return;
  }

  socket = appSocket;
  myPlayerId = window.app?.state?.playerId;
  
  // Listen to game_state events
  socket.off('game_state', handleGameState);
  socket.on('game_state', handleGameState);
  initialized = true;

  // Initial render
  renderGame();
  requestLatestState();
}

function handleGameState(gameState) {
  currentGameState = gameState;
  myPlayerId = window.app?.state?.playerId;
  renderGame();
}

function requestLatestState() {
  const roomCode = window.app?.state?.roomCode;
  if (socket && roomCode) {
    socket.emit('sync_state', { roomCode });
  }
}

function renderGame() {
  const gameBoard = document.getElementById('secrethitler-board-root') || createGameBoard();
  if (!gameBoard) return;
  gameBoard.innerHTML = renderGameBoard(currentGameState, myPlayerId);
}

function createGameBoard() {
  const screen = document.querySelector('#secrethitler-screen') || document.getElementById('secrethitler-screen');
  if (!screen) {
    console.error('secrethitler-screen not found');
    return null;
  }
  const board = document.createElement('div');
  board.id = 'secrethitler-board-root';
  screen.appendChild(board);
  return board;
}

// Helper for emitting game events
window.gameEmit = function(eventName, data) {
  if (!socket) {
    console.error('Socket not available');
    return;
  }
  socket.emit(eventName, {
    ...(data || {}),
    roomCode: window.app?.state?.roomCode
  });
};

function renderGameBoard(gameState, myPlayerId) {
  if (!gameState) return '<div>Loading game...</div>';

  let html = '<div class="secrethitler-board">';
  
  // Header with policy counts
  html += `
    <div class="sh-header">
      <div class="sh-policies">
        <div class="sh-policy-track">
          <h3>Liberal Policies</h3>
          <div class="sh-policy-display">
            ${Array(6).fill().map((_, i) => `
              <div class="sh-policy-slot ${i < gameState.liberalPolicies ? 'enacted' : ''}">
                ${i < gameState.liberalPolicies ? '✓' : ''}
              </div>
            `).join('')}
          </div>
        </div>
        <div class="sh-policy-track">
          <h3>Fascist Policies</h3>
          <div class="sh-policy-display">
            ${Array(5).fill().map((_, i) => `
              <div class="sh-policy-slot fascist ${i < gameState.fascistPolicies ? 'enacted' : ''}">
                ${i < gameState.fascistPolicies ? '⚡' : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      <div class="sh-tracker">
        <h3>Election Tracker</h3>
        <div class="sh-tracker-display">
          ${Array(3).fill().map((_, i) => `
            <div class="sh-tracker-slot ${i < gameState.electionTracker ? 'failed' : ''}">
              ${i < gameState.electionTracker ? '✗' : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  // Game status and current action
  html += renderGameStatus(gameState, myPlayerId);

  // Players section
  html += renderPlayersSection(gameState, myPlayerId);

  // Action buttons based on game state
  if (gameState.state !== 'game_over') {
    html += renderActionButtons(gameState, myPlayerId);
  }

  // Card display for active player
  if (gameState.myCards && gameState.myCards.length > 0) {
    html += renderCardSelection(gameState, myPlayerId);
  }

  // Game over screen
  if (gameState.state === 'game_over') {
    html += renderGameOverScreen(gameState, myPlayerId);
  }

  html += '</div>';
  return html;
}

function renderGameStatus(gameState, myPlayerId) {
  let status = '';

  switch (gameState.state) {
    case 'role_reveal':
      status = '<h2>Game Starting - Review Your Role...</h2>';
      break;
    case 'chancellor_nomination':
      if (gameState.currentPresident === myPlayerId) {
        status = '<h2>You are President - Nominate a Chancellor</h2>';
      } else {
        status = `<h2>President is nominating a Chancellor...</h2>`;
      }
      break;
    case 'voting':
      status = '<h2>Vote on Chancellor Candidate</h2>';
      break;
    case 'legislative_president':
      if (gameState.currentPresident === myPlayerId) {
        status = '<h2>You are President - Discard One Card</h2>';
      } else {
        status = '<h2>President is selecting a card...</h2>';
      }
      break;
    case 'legislative_chancellor':
      if (gameState.currentChancellor === myPlayerId) {
        status = '<h2>You are Chancellor - Enact One Policy</h2>';
      } else {
        status = '<h2>Chancellor is selecting a policy...</h2>';
      }
      break;
    case 'legislative_president_veto':
      if (gameState.currentPresident === myPlayerId) {
        status = '<h2>Chancellor wants to Veto - Do you allow?</h2>';
      } else {
        status = '<h2>Waiting for President to respond to veto...</h2>';
      }
      break;
    case 'presidential_power_execute':
      status = '<h2>President is executing a player...</h2>';
      break;
    case 'presidential_power_investigate':
      status = '<h2>President is investigating a player...</h2>';
      break;
    case 'presidential_power_peek':
      status = '<h2>President is peeking at cards...</h2>';
      break;
    case 'presidential_power_election':
      status = '<h2>President is calling an election...</h2>';
      break;
  }

  return `<div class="sh-status">${status}</div>`;
}

function renderPlayersSection(gameState, myPlayerId) {
  const players = gameState.players || [];
  
  let html = '<div class="sh-players">';
  html += '<h3>Players</h3>';
  html += '<div class="sh-player-list">';

  players.forEach(player => {
    const isMe = player.id === myPlayerId;
    const isCurrent = player.id === gameState.currentPresident ? 'president' : 
                     player.id === gameState.currentChancellor ? 'chancellor' : '';
    const statusClass = player.alive ? 'alive' : 'dead';
    
    let roleDisplay = '';
    if (gameState.state === 'game_over' || isMe) {
      roleDisplay = `<span class="sh-role ${player.role}">${formatRole(player.role)}</span>`;
    }

    html += `
      <div class="sh-player ${statusClass} ${isCurrent}" data-player-id="${player.id}">
        <div class="sh-player-name">${player.name}${isMe ? ' (You)' : ''}</div>
        ${roleDisplay}
        ${isCurrent ? `<div class="sh-badge">${isCurrent.toUpperCase()}</div>` : ''}
      </div>
    `;
  });

  html += '</div></div>';
  return html;
}

function renderActionButtons(gameState, myPlayerId) {
  let html = '<div class="sh-actions">';

  switch (gameState.state) {
    case 'role_reveal':
      html += '<p>Waiting for game to start...</p>';
      break;

    case 'chancellor_nomination':
      if (gameState.currentPresident === myPlayerId) {
        const selectableChancellors = gameState.players.filter(p => 
          p.id !== myPlayerId && p.alive
        );
        html += '<div class="sh-button-group">';
        selectableChancellors.forEach(p => {
          html += `<button class="sh-btn" onclick="gameEmit('nominate_chancellor', {chancellorId: '${p.id}'})">
            Nominate ${p.name}
          </button>`;
        });
        html += '</div>';
      }
      break;

    case 'voting':
      html += `
        <div class="sh-button-group">
          <button class="sh-btn yes" onclick="gameEmit('cast_vote', {voteYes: true})">
            JAH (Vote Yes)
          </button>
          <button class="sh-btn no" onclick="gameEmit('cast_vote', {voteYes: false})">
            NEIN (Vote No)
          </button>
        </div>
      `;
      break;

    case 'legislative_president_veto':
      if (gameState.currentPresident === myPlayerId) {
        html += `
          <div class="sh-button-group">
            <button class="sh-btn" onclick="gameEmit('president_veto_response', {allowVeto: true})">
              Allow Veto
            </button>
            <button class="sh-btn danger" onclick="gameEmit('president_veto_response', {allowVeto: false})">
              Reject Veto
            </button>
          </div>
        `;
      }
      break;

    case 'presidential_power_execute':
      if (gameState.currentPresident === myPlayerId) {
        const selectablePlayers = gameState.players.filter(p => 
          p.id !== myPlayerId && p.alive
        );
        html += '<div class="sh-button-group">';
        selectablePlayers.forEach(p => {
          html += `<button class="sh-btn danger" onclick="gameEmit('execute_player', {targetId: '${p.id}'})">
            Execute ${p.name}
          </button>`;
        });
        html += '</div>';
      }
      break;

    case 'presidential_power_investigate':
      if (gameState.currentPresident === myPlayerId) {
        const selectablePlayers = gameState.players.filter(p => 
          p.id !== myPlayerId && p.alive
        );
        html += '<div class="sh-button-group">';
        selectablePlayers.forEach(p => {
          html += `<button class="sh-btn" onclick="gameEmit('investigate_player', {targetId: '${p.id}'})">
            Investigate ${p.name}
          </button>`;
        });
        html += '</div>';
      }
      break;

    case 'presidential_power_peek':
      if (gameState.currentPresident === myPlayerId) {
        html += `
          <button class="sh-btn" onclick="gameEmit('peek_cards', {})">
            Peek at Top 3 Cards
          </button>
        `;
      }
      break;

    case 'presidential_power_election':
      if (gameState.currentPresident === myPlayerId) {
        const selectablePlayers = gameState.players.filter(p => p.alive);
        html += '<div class="sh-button-group">';
        selectablePlayers.forEach(p => {
          html += `<button class="sh-btn" onclick="gameEmit('call_election', {nextPresidentId: '${p.id}'})">
            Make ${p.name} President
          </button>`;
        });
        html += '</div>';
      }
      break;
  }

  html += '</div>';
  return html;
}

function renderCardSelection(gameState, myPlayerId) {
  if (!gameState.myCards || gameState.myCards.length === 0) return '';

  let html = '<div class="sh-cards">';

  if (gameState.state === 'legislative_president') {
    html += '<h3>Select a card to DISCARD</h3>';
  } else if (gameState.state === 'legislative_chancellor' || gameState.state === 'legislative_chancellor_veto') {
    html += '<h3>Select a policy to ENACT</h3>';
  }

  html += '<div class="sh-card-display">';

  gameState.myCards.forEach((card, index) => {
    const cardType = card === 'liberal' ? 'liberal' : 'fascist';
    html += `
      <div class="sh-card ${cardType}" onclick="gameEmit('${
        gameState.state === 'legislative_president' ? 'president_discard' : 'chancellor_enact'
      }', {cardIndex: ${index}})">
        <div class="sh-card-content">${card === 'liberal' ? '🕊️ LIBERAL' : '⚡ FASCIST'}</div>
      </div>
    `;
  });

  html += '</div>';

  // Veto button for chancellor
  if (gameState.state === 'legislative_chancellor' && gameState.fascistPolicies >= 5 && myPlayerId === gameState.currentChancellor) {
    html += `
      <button class="sh-btn veto-btn" onclick="gameEmit('chancellor_veto', {})">
        Propose Veto
      </button>
    `;
  }

  html += '</div>';
  return html;
}

function renderGameOverScreen(gameState, myPlayerId) {
  const myPlayer = gameState.players.find(p => p.id === myPlayerId);
  const myRole = myPlayer ? myPlayer.role : null;
  const iWon = (gameState.winner === 'liberal' && (myRole === 'liberal' || myRole === 'hitler' === false)) ||
               (gameState.winner === 'fascist' && (myRole === 'fascist' || myRole === 'hitler'));

  let winnerText = '';
  if (gameState.winReason === 'enacted_liberal_policies') {
    winnerText = 'Liberals Won! 6 liberal policies enacted!';
  } else if (gameState.winReason === 'executed_hitler') {
    winnerText = 'Liberals Won! Hitler was executed!';
  } else if (gameState.winReason === 'enacted_fascist_policies') {
    winnerText = 'Fascists Won! 5 fascist policies enacted!';
  } else if (gameState.winReason === 'hitler_chancellor') {
    winnerText = 'Fascists Won! Hitler became Chancellor!';
  }

  let html = `
    <div class="sh-gameover">
      <h2 class="${gameState.winner}">${gameState.winner === 'liberal' ? '🕊️' : '⚡'} ${winnerText}</h2>
      <div class="sh-result ${iWon ? 'victory' : 'defeat'}">
        <h3>${iWon ? 'YOU WON!' : 'YOU LOST!'}</h3>
        <p>Your role: ${formatRole(myRole)}</p>
      </div>
      <div class="sh-final-roles">
        <h3>Final Roles:</h3>
  `;

  gameState.players.forEach(p => {
    html += `<div class="sh-final-role ${p.role}">
      ${p.name}: ${formatRole(p.role)}
    </div>`;
  });

  html += '</div></div>';
  return html;
}

function formatRole(role) {
  const roleMap = {
    'liberal': '🕊️ Liberal',
    'fascist': '⚡ Fascist',
    'hitler': '💀 Hitler'
  };
  return roleMap[role] || 'Unknown';
}

// Export for use in main client
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { renderGameBoard };
}
