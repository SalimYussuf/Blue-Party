/**
 * Secret Hitler Client UI - Complete Asset Integration
 * Uses all available assets: portraits, board backgrounds, policies, votes, victory screens, etc.
 */

// Asset mapping (all your files)
const ASSETS = {
  // Board backgrounds & tracks
  board: {
    liberal: '/assets/board-liberal.png',
    fascist5_6: '/assets/board-fascist-5-6.png',
    fascist7_8: '/assets/board-fascist-7-8.png',
    fascist9_10: '/assets/board-fascist-9-10.png',
    policyLiberal: '/assets/board-policy-liberal.png',
    policyFascist: '/assets/board-policy-fascist.png',
    policyBoard: '/assets/board-policy.png',
    tracker: '/assets/board-tracker.png',
    electionTracker: '/assets/board-election-tracker.png',
    discard: '/assets/board-discard.png',
    draw: '/assets/board-draw.png'
  },
  // Player UI elements
  player: {
    base: '/assets/player-base.png',
    baseUnselectable: '/assets/player-base-unselectable.png',
    iconBusy: '/assets/player-icon-busy.png',
    iconFascist: '/assets/player-icon-fascist.png',
    iconHitler: '/assets/player-icon-hitler.png',
    iconJa: '/assets/player-icon-ja.png',
    iconNein: '/assets/player-icon-nein.png',
    iconLiberal: '/assets/player-icon-liberal.png'
  },
  // Role cards / envelopes
  role: {
    fascist1: '/assets/role-fascist-1.png',
    fascist2: '/assets/role-fascist-2.png',
    fascist3: '/assets/role-fascist-3.png',
    hitler: '/assets/role-hitler.png',
    liberal1: '/assets/role-liberal-1.png',
    liberal2: '/assets/role-liberal-2.png',
    liberal3: '/assets/role-liberal-3.png',
    liberal4: '/assets/role-liberal-4.png',
    liberal5: '/assets/role-liberal-5.png',
    liberal6: '/assets/role-liberal-6.png',
    envelopeBack: '/assets/role-envelope-back.png',
    envelopeFront: '/assets/role-envelope-front.png'
  },
  // Party membership cards
  party: {
    fascist: '/assets/party-membership-fascist.png',
    liberal: '/assets/party-membership-liberal.png',
    membership: '/assets/party-membership.png'
  },
  // Voting buttons
  vote: {
    yes: '/assets/vote-yes.png',
    no: '/assets/vote-no.png'
  },
  // Victory screen banners
  victory: {
    liberalHeader: '/assets/victory-liberal-header.png',
    liberalFooter: '/assets/victory-liberal-footer.png',
    fascistHeader: '/assets/victory-fascist-header.png',
    fascistFooter: '/assets/victory-fascist-footer.png'
  },
  // Policy cards
  policy: {
    fascist: '/assets/policy-fascist.png',
    liberal: '/assets/policy-liberal.png',
    folderBack: '/assets/policy-folder-back.png',
    folderCoverBack: '/assets/policy-folder-cover-back.png',
    folderCoverFront: '/assets/policy-folder-cover-front.png'
  },
  // Extra
  badge: '/assets/badge.svg',
  twitterIcon: '/assets/twitter-icon.svg'
};

// Portrait helper (portraits are in a subfolder)
function getPlayerPortrait(playerId, portraitIndex) {
  let index = portraitIndex;
  if (index === undefined || index === null) {
    let hash = 0;
    for (let i = 0; i < playerId.length; i++) {
      hash = ((hash << 5) - hash) + playerId.charCodeAt(i);
      hash |= 0;
    }
    index = Math.abs(hash % 20) + 1;
  } else {
    index = (index % 20) + 1;
  }
  return `/assets/player-portraits/player-portrait-${index}.svg`;
}

// Game state
let currentGameState = null;
let myPlayerId = null;
let socket = null;
let initRetry = null;
let initialized = false;

// Auto-initialize
if (typeof window !== 'undefined') {
  window.initSecretHitler = initSecretHitler;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSecretHitler, { once: true });
  } else {
    initSecretHitler();
  }
}

function initSecretHitler() {
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
  
  socket.off('game_state', handleGameState);
  socket.on('game_state', handleGameState);
  initialized = true;

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
  attachDelegatedEvents();
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

// Event delegation for dynamically rendered buttons
function attachDelegatedEvents() {
  const board = document.getElementById('secrethitler-board-root');
  if (!board) return;
  board.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const params = btn.getAttribute('data-params');
    if (action && window.gameEmit) {
      try {
        const data = params ? JSON.parse(params) : {};
        window.gameEmit(action, data);
      } catch (err) {
        console.error('Failed to parse action params', err);
      }
    }
  });
}

// Main render function
function renderGameBoard(gameState, myPlayerId) {
  if (!gameState) return '<div class="loading">Loading game...</div>';

  return `
    <div class="secrethitler-board" style="background-image: url('${ASSETS.board.policyBoard}'); background-size: cover; background-position: center; padding: 20px; border-radius: 20px;">
      ${renderTopBar(gameState)}
      ${renderPolicyTracks(gameState)}
      ${renderElectionTracker(gameState)}
      ${renderGameStatus(gameState, myPlayerId)}
      ${renderPlayersSection(gameState, myPlayerId)}
      ${renderActionButtons(gameState, myPlayerId)}
      ${renderCardSelection(gameState, myPlayerId)}
      ${renderGameOverScreen(gameState, myPlayerId)}
    </div>
  `;
}

function renderTopBar(gameState) {
  return `
    <div class="sh-top-bar" style="display: flex; justify-content: space-between; background: rgba(0,0,0,0.6); padding: 10px; border-radius: 10px; margin-bottom: 20px; color: white;">
      <div>Round ${(gameState.round || 0) + 1}</div>
      <div>President: ${getPlayerName(gameState, gameState.currentPresident)} | Chancellor: ${getPlayerName(gameState, gameState.currentChancellor)}</div>
    </div>
  `;
}

function getPlayerName(gameState, playerId) {
  const player = gameState.players?.find(p => p.id === playerId);
  return player ? player.name : '?';
}

function renderPolicyTracks(gameState) {
  const liberalEnacted = gameState.liberalPolicies || 0;
  const fascistEnacted = gameState.fascistPolicies || 0;
  const playerCount = (gameState.players || []).length;
  
  let fascistBoardImage = ASSETS.board.fascist5_6;
  if (playerCount >= 9) fascistBoardImage = ASSETS.board.fascist9_10;
  else if (playerCount >= 7) fascistBoardImage = ASSETS.board.fascist7_8;
  
  return `
    <div class="sh-policy-tracks" style="display: flex; gap: 20px; justify-content: center; margin-bottom: 30px; flex-wrap: wrap;">
      <div class="liberal-track" style="background: url('${ASSETS.board.liberal}') no-repeat center/cover; padding: 15px; border-radius: 15px; min-width: 250px;">
        <h3 style="color: white; text-shadow: 1px 1px 0 black;">Liberal Policies (${liberalEnacted}/6)</h3>
        <div class="sh-policy-slots" style="display: flex; gap: 5px;">
          ${Array(6).fill().map((_, i) => `
            <div class="policy-slot" style="width: 50px; height: 70px; background: rgba(0,0,0,0.5); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
              ${i < liberalEnacted ? `<img src="${ASSETS.policy.liberal}" style="width:100%;">` : ''}
            </div>
          `).join('')}
        </div>
      </div>
      <div class="fascist-track" style="background: url('${fascistBoardImage}') no-repeat center/cover; padding: 15px; border-radius: 15px; min-width: 250px;">
        <h3 style="color: white; text-shadow: 1px 1px 0 black;">Fascist Policies (${fascistEnacted}/6)</h3>
        <div class="sh-policy-slots" style="display: flex; gap: 5px;">
          ${Array(6).fill().map((_, i) => `
            <div class="policy-slot" style="width: 50px; height: 70px; background: rgba(0,0,0,0.5); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
              ${i < fascistEnacted ? `<img src="${ASSETS.policy.fascist}" style="width:100%;">` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderElectionTracker(gameState) {
  const failed = gameState.electionTracker || 0;
  return `
    <div class="sh-election-tracker" style="background: url('${ASSETS.board.electionTracker}') no-repeat center/cover; padding: 15px; border-radius: 15px; margin-bottom: 30px; text-align: center; color: white;">
      <h3>Election Tracker</h3>
      <div style="display: flex; justify-content: center; gap: 20px;">
        ${Array(3).fill().map((_, i) => `
          <div style="width: 50px; height: 50px; background: rgba(0,0,0,0.5); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            ${i < failed ? `<img src="${ASSETS.vote.no}" style="width: 40px;">` : `<img src="${ASSETS.vote.yes}" style="width: 40px; opacity: 0.3;">`}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderGameStatus(gameState, myPlayerId) {
  let message = '';
  switch (gameState.state) {
    case 'role_reveal': message = '🔍 Review your role secretly'; break;
    case 'chancellor_nomination': message = (gameState.currentPresident === myPlayerId) ? '👑 You are President - Nominate a Chancellor' : '⏳ President is nominating a Chancellor...'; break;
    case 'voting': message = '🗳️ Vote on the Chancellor candidate'; break;
    case 'legislative_president': message = (gameState.currentPresident === myPlayerId) ? '📜 You are President - Discard one policy' : '📜 President is selecting a card to discard...'; break;
    case 'legislative_chancellor': message = (gameState.currentChancellor === myPlayerId) ? '📜 You are Chancellor - Enact one policy' : '📜 Chancellor is selecting a policy...'; break;
    case 'legislative_president_veto': message = (gameState.currentPresident === myPlayerId) ? '⚖️ Chancellor requests veto - Allow?' : '⚖️ Waiting for President to respond to veto...'; break;
    case 'presidential_power_execute': message = '🔫 President must execute a player'; break;
    case 'presidential_power_investigate': message = '🕵️ President is investigating a player'; break;
    case 'presidential_power_peek': message = '👁️ President is peeking at top 3 cards'; break;
    case 'presidential_power_election': message = '🗳️ President is calling a special election'; break;
    default: message = 'Game in progress...';
  }
  return `<div class="sh-status" style="background: rgba(0,0,0,0.7); padding: 15px; border-radius: 10px; margin-bottom: 20px; text-align: center; color: white;">${message}</div>`;
}

function renderPlayersSection(gameState, myPlayerId) {
  const players = gameState.players || [];
  if (!players.length) return '';
  
  let html = '<div class="sh-players-section" style="margin-bottom: 30px;"><h2 style="color: white;">Players</h2><div class="sh-players-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px;">';
  
  players.forEach(player => {
    const isMe = player.id === myPlayerId;
    const isPresident = player.id === gameState.currentPresident;
    const isChancellor = player.id === gameState.currentChancellor;
    const isAlive = player.alive !== false;
    const portraitUrl = getPlayerPortrait(player.id, player.portraitIndex);
    
    let roleIcon = '';
    if (gameState.state === 'game_over' || isMe) {
      if (player.role === 'liberal') roleIcon = `<img src="${ASSETS.player.iconLiberal}" style="width:20px; height:20px; margin-left:5px;">`;
      else if (player.role === 'fascist') roleIcon = `<img src="${ASSETS.player.iconFascist}" style="width:20px; height:20px; margin-left:5px;">`;
      else if (player.role === 'hitler') roleIcon = `<img src="${ASSETS.player.iconHitler}" style="width:20px; height:20px; margin-left:5px;">`;
    }
    
    html += `
      <div class="sh-player-card" style="background: rgba(0,0,0,0.6); border-radius: 15px; padding: 10px; text-align: center; backdrop-filter: blur(5px);">
        <div style="position: relative; width: 80px; height: 80px; margin: 0 auto 10px;">
          <img src="${portraitUrl}" style="width:100%; height:100%; border-radius: 50%; object-fit: cover;" onerror="this.src='/assets/player-portraits/player-portrait-default.svg'">
          ${!isAlive ? '<div style="position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:2em;">💀</div>' : ''}
          ${isPresident ? '<div style="position:absolute; top:-10px; right:-10px; font-size:1.5em;">👑</div>' : ''}
        </div>
        <div style="color:white;">
          <div>${player.name} ${isMe ? '(You)' : ''} ${roleIcon}</div>
          ${isPresident ? '<div class="president-badge" style="background:#f39c12; display:inline-block; padding:2px 8px; border-radius:20px; font-size:12px;">PRESIDENT</div>' : ''}
          ${isChancellor ? '<div class="chancellor-badge" style="background:#2ecc71; display:inline-block; padding:2px 8px; border-radius:20px; font-size:12px; margin-left:5px;">CHANCELLOR</div>' : ''}
        </div>
      </div>
    `;
  });
  
  html += '</div></div>';
  return html;
}

function renderActionButtons(gameState, myPlayerId) {
  if (!myPlayerId) return '';
  let html = '<div class="sh-actions-section" style="margin-bottom: 30px;">';
  
  switch (gameState.state) {
    case 'voting':
      html += `
        <div style="display: flex; gap: 20px; justify-content: center;">
          <button class="vote-btn" data-action="cast_vote" data-params='{"voteYes":true}' style="background:#2ecc71; padding:12px 24px; border:none; border-radius:50px; cursor:pointer;">
            <img src="${ASSETS.vote.yes}" style="width:24px; vertical-align:middle;"> JA (Vote Yes)
          </button>
          <button class="vote-btn" data-action="cast_vote" data-params='{"voteYes":false}' style="background:#e74c3c; padding:12px 24px; border:none; border-radius:50px; cursor:pointer;">
            <img src="${ASSETS.vote.no}" style="width:24px; vertical-align:middle;"> NEIN (Vote No)
          </button>
        </div>
      `;
      break;
    case 'chancellor_nomination':
      if (gameState.currentPresident === myPlayerId) {
        const candidates = gameState.players.filter(p => p.id !== myPlayerId && p.alive !== false);
        html += '<div style="display: flex; flex-wrap: wrap; gap:10px; justify-content:center;"><h3>Nominate Chancellor</h3>';
        candidates.forEach(p => {
          html += `<button class="action-btn" data-action="nominate_chancellor" data-params='{"chancellorId":"${p.id}"}' style="background:#3498db; padding:10px 20px; border:none; border-radius:8px;">Nominate ${p.name}</button>`;
        });
        html += '</div>';
      } else {
        html += '<p class="waiting">Waiting for President to nominate...</p>';
      }
      break;
    case 'legislative_president_veto':
      if (gameState.currentPresident === myPlayerId) {
        html += `<div><button data-action="president_veto_response" data-params='{"allowVeto":true}' style="background:#f39c12;">Allow Veto</button>
                 <button data-action="president_veto_response" data-params='{"allowVeto":false}' style="background:#e74c3c;">Reject Veto</button></div>`;
      }
      break;
    case 'presidential_power_execute':
      if (gameState.currentPresident === myPlayerId) {
        const targets = gameState.players.filter(p => p.id !== myPlayerId && p.alive !== false);
        html += '<div><h3>Choose a player to execute</h3>';
        targets.forEach(p => {
          html += `<button data-action="execute_player" data-params='{"targetId":"${p.id}"}' style="background:#c0392b;">Execute ${p.name}</button>`;
        });
        html += '</div>';
      }
      break;
    case 'presidential_power_investigate':
      if (gameState.currentPresident === myPlayerId) {
        const targets = gameState.players.filter(p => p.id !== myPlayerId && p.alive !== false);
        html += '<div><h3>Investigate a player</h3>';
        targets.forEach(p => {
          html += `<button data-action="investigate_player" data-params='{"targetId":"${p.id}"}'>Investigate ${p.name}</button>`;
        });
        html += '</div>';
      }
      break;
    case 'presidential_power_peek':
      if (gameState.currentPresident === myPlayerId) {
        html += `<button data-action="peek_cards" data-params='{}'>Peek at Top 3 Cards</button>`;
      }
      break;
    case 'presidential_power_election':
      if (gameState.currentPresident === myPlayerId) {
        const alive = gameState.players.filter(p => p.alive !== false);
        html += '<div><h3>Call special election - choose next President</h3>';
        alive.forEach(p => {
          html += `<button data-action="call_election" data-params='{"nextPresidentId":"${p.id}"}'>Make ${p.name} President</button>`;
        });
        html += '</div>';
      }
      break;
    default:
      if (gameState.state !== 'game_over' && gameState.state !== 'role_reveal') {
        html += '<p>Waiting for other players...</p>';
      }
  }
  html += '</div>';
  return html;
}

function renderCardSelection(gameState, myPlayerId) {
  if (!gameState.myCards || gameState.myCards.length === 0) return '';
  
  const isPresident = gameState.state === 'legislative_president';
  const isChancellor = gameState.state === 'legislative_chancellor';
  const showVeto = (gameState.state === 'legislative_chancellor' && gameState.fascistPolicies >= 5 && myPlayerId === gameState.currentChancellor);
  
  let html = `<div class="sh-cards-section" style="margin-bottom: 30px;">
    <div style="display: flex; justify-content: center; gap: 40px; align-items: center; flex-wrap: wrap;">
      <div><img src="${ASSETS.board.draw}" style="width:100px;"><div>Draw</div></div>
      <div class="cards-hand" style="display: flex; gap: 20px;">`;
  
  gameState.myCards.forEach((card, index) => {
    const cardImage = card === 'liberal' ? ASSETS.policy.liberal : ASSETS.policy.fascist;
    const action = isPresident ? 'president_discard' : 'chancellor_enact';
    const actionText = isPresident ? 'Discard' : 'Enact';
    html += `
      <div class="policy-card" data-action="${action}" data-params='{"cardIndex":${index}}' style="cursor: pointer; position: relative; width: 120px;">
        <img src="${cardImage}" style="width:100%; border-radius:10px; box-shadow:0 4px 8px rgba(0,0,0,0.3);">
        <div style="position:absolute; bottom:10px; left:10px; right:10px; background:rgba(0,0,0,0.7); color:white; text-align:center; border-radius:5px;">${actionText}</div>
      </div>
    `;
  });
  
  html += `</div><div><img src="${ASSETS.board.discard}" style="width:100px;"><div>Discard</div></div></div>`;
  if (showVeto) {
    html += `<div style="text-align:center; margin-top:15px;"><button data-action="chancellor_veto" data-params='{}' class="veto-btn" style="background:#f39c12;">Propose Veto</button></div>`;
  }
  html += `</div>`;
  return html;
}

function renderGameOverScreen(gameState, myPlayerId) {
  if (gameState.state !== 'game_over') return '';
  
  const myPlayer = gameState.players.find(p => p.id === myPlayerId);
  const myRole = myPlayer ? myPlayer.role : null;
  const liberalsWin = gameState.winner === 'liberal';
  const iWon = liberalsWin ? 
    (myRole === 'liberal' || myRole === 'hitler' === false) : 
    (myRole === 'fascist' || myRole === 'hitler');
  
  let winnerText = '';
  if (gameState.winReason === 'enacted_liberal_policies') winnerText = '6 liberal policies enacted!';
  else if (gameState.winReason === 'executed_hitler') winnerText = 'Hitler was executed!';
  else if (gameState.winReason === 'enacted_fascist_policies') winnerText = '5 fascist policies enacted!';
  else if (gameState.winReason === 'hitler_chancellor') winnerText = 'Hitler became Chancellor!';
  
  const headerImg = liberalsWin ? ASSETS.victory.liberalHeader : ASSETS.victory.fascistHeader;
  const footerImg = liberalsWin ? ASSETS.victory.liberalFooter : ASSETS.victory.fascistFooter;
  
  return `
    <div class="game-over-overlay" style="position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.9); z-index: 1000; display: flex; align-items: center; justify-content: center;">
      <div style="max-width: 800px; width: 90%; background: white; border-radius: 20px; overflow: hidden; text-align: center;">
        <img src="${headerImg}" style="width:100%;">
        <div style="padding: 20px;">
          <h2 class="${gameState.winner}">${liberalsWin ? '🕊️ LIBERALS WIN!' : '⚡ FASCISTS WIN!'}</h2>
          <p>${winnerText}</p>
          <div class="sh-result ${iWon ? 'victory' : 'defeat'}">
            <h3>${iWon ? '✨ YOU WON! ✨' : '💀 YOU LOST 💀'}</h3>
            <p>Your role: ${formatRole(myRole)}</p>
          </div>
          <div class="sh-final-roles">
            <h3>Final Roles:</h3>
            ${gameState.players.map(p => `<div>${p.name}: ${formatRole(p.role)}</div>`).join('')}
          </div>
        </div>
        <img src="${footerImg}" style="width:100%;">
      </div>
    </div>
  `;
}

function formatRole(role) {
  const map = { liberal: '🕊️ Liberal', fascist: '⚡ Fascist', hitler: '💀 Hitler' };
  return map[role] || 'Unknown';
}

// Keep original export for compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { renderGameBoard };
}