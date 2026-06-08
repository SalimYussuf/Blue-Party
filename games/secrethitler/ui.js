/**
 * Secret Hitler Client UI - Tabletop Theme Revamp
 */

const ASSETS = {
  board: {
    liberal: '/assets/board-liberal.png',
    fascist5_6: '/assets/board-fascist-5-6.png',
    fascist7_8: '/assets/board-fascist-7-8.png',
    fascist9_10: '/assets/board-fascist-9-10.png',
    tracker: '/assets/board-tracker.png',
    electionTracker: '/assets/board-election-tracker.png',
    discard: '/assets/board-discard.png',
    draw: '/assets/board-draw.png'
  },
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
  party: {
    fascist: '/assets/party-membership-fascist.png',
    liberal: '/assets/party-membership-liberal.png',
    membership: '/assets/party-membership.png'
  },
  vote: {
    yes: '/assets/vote-yes.png',
    no: '/assets/vote-no.png'
  },
  icons: {
    hitler: '/assets/player-icon-hitler.png',
    fascist: '/assets/player-icon-fascist.png',
    liberal: '/assets/player-icon-liberal.png'
  },
  victory: {
    liberalHeader: '/assets/victory-liberal-header.png',
    liberalFooter: '/assets/victory-liberal-footer.png',
    fascistHeader: '/assets/victory-fascist-header.png',
    fascistFooter: '/assets/victory-fascist-footer.png'
  },
  policy: {
    fascist: '/assets/policy-fascist.png',
    liberal: '/assets/policy-liberal.png',
    folderBack: '/assets/policy-folder-back.png',
    folderCoverBack: '/assets/policy-folder-cover-back.png',
    folderCoverFront: '/assets/policy-folder-cover-front.png'
  }
};

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

// DOM Elements
const els = {};

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
    if (!initRetry) initRetry = setTimeout(() => { initRetry = null; initSecretHitler(); }, 100);
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
  if (socket && roomCode) socket.emit('sync_state', { roomCode });
}

window.gameEmit = function(eventName, data) {
  if (!socket) return;
  socket.emit(eventName, { ...(data || {}), roomCode: window.app?.state?.roomCode });
};

// ==================== DOM RENDERING ====================

function renderGame() {
  if (!currentGameState) return;
  if (!ensureDOMStructure()) return;
  updateDOM(currentGameState);
}

function ensureDOMStructure() {
  const screen = document.getElementById('secrethitler-screen');
  if (!screen) return false;

  if (document.getElementById('sh-tabletop')) {
    if (Object.keys(els).length === 0) populateEls();
    return true;
  }

  screen.innerHTML = `
    <div id="sh-tabletop">
      <div id="sh-players-row"></div>
      
      <div id="sh-center-area">
        <div id="sh-piles-row">
          <div id="sh-draw-pile" class="sh-pile">
            <div id="sh-draw-stack" class="sh-pile-stack"></div>
            <div id="sh-draw-count" class="sh-pile-count">17</div>
          </div>
          <div id="sh-discard-pile" class="sh-pile">
            <div id="sh-discard-stack" class="sh-pile-stack"></div>
            <div id="sh-discard-count" class="sh-pile-count">0</div>
          </div>
        </div>
        
        <div id="sh-boards-row">
          <div id="sh-liberal-board" class="sh-board" style="background-image: url('${ASSETS.board.liberal}');">
            ${createBoardSlots(5, 'liberal')}
            <div id="sh-election-marker"></div>
          </div>
          <div id="sh-fascist-board" class="sh-board">
            ${createBoardSlots(6, 'fascist')}
          </div>
        </div>
      </div>
      
      <div id="sh-bottom-area">
        <div id="sh-status-banner">Waiting...</div>
        <div id="sh-action-container"></div>
      </div>
      
      <div id="sh-role-reveal" class="sh-role-reveal" style="display:none;">
         <div class="sh-envelope" id="sh-envelope-btn"></div>
         <div id="sh-role-content" class="sh-role-popup" style="display:none;">
           <div class="sh-role-cards-row">
             <img id="sh-role-card" class="sh-role-card-img">
             <img id="sh-party-card" class="sh-role-card-img">
           </div>
           <div id="sh-role-goal" class="sh-role-goal">
             <h3 id="sh-role-goal-title">Your Mission</h3>
             <p id="sh-role-goal-text"></p>
           </div>
           <button class="sh-action-btn" id="sh-hide-role-btn" style="background:linear-gradient(#27ae60, #2ecc71); margin-top:10px;">I Understand — Continue</button>
         </div>
      </div>
      
      <div id="sh-action-overlay" class="sh-role-reveal" style="display:none; z-index: 60;">
        <h2 id="sh-action-overlay-title" style="font-size:2.5em; text-shadow:2px 2px 0 #000; margin-bottom:30px; text-align:center;"></h2>
        <div id="sh-action-overlay-content" style="display:flex; gap:40px; flex-wrap:wrap; justify-content:center;"></div>
      </div>

      <div id="sh-game-over-overlay">
        <img id="sh-victory-header" class="sh-victory-banner">
        <h1 id="sh-victory-text" style="font-size:3em; text-shadow:2px 2px 0 #000; margin:10px 0;"></h1>
        <div id="sh-victory-reason" style="font-size:1.5em; margin-bottom:20px;"></div>
        <img id="sh-victory-footer" class="sh-victory-banner">
        <button class="sh-action-btn" style="margin-top:20px;" onclick="window.gameEmit('play_again')">Return to Lobby</button>
      </div>
    </div>
  `;

  document.getElementById('sh-envelope-btn').addEventListener('click', () => {
    document.getElementById('sh-envelope-btn').style.display = 'none';
    document.getElementById('sh-role-content').style.display = 'block';
  });

  document.getElementById('sh-hide-role-btn').addEventListener('click', () => {
    window.shRoleRevealed = true;
    document.getElementById('sh-role-reveal').style.display = 'none';
    if (currentGameState) updateDOM(currentGameState);
  });

  populateEls();
  return true;
}

function createBoardSlots(count, type) {
  let html = '';
  // Hardcoded percentages based on asset layouts
  const liberalLefts = [14, 28.5, 43, 57.5, 72];
  const fascistLefts = [8.5, 23, 37.5, 52, 66.5, 81];
  const lefts = type === 'liberal' ? liberalLefts : fascistLefts;
  
  for (let i = 0; i < count; i++) {
    html += `<div class="sh-policy-slot-overlay" id="slot-${type}-${i}" style="left: ${lefts[i]}%; background-image: url('${type === 'liberal' ? ASSETS.policy.liberal : ASSETS.policy.fascist}');"></div>`;
  }
  return html;
}

function populateEls() {
  els.playersRow = document.getElementById('sh-players-row');
  els.fascistBoard = document.getElementById('sh-fascist-board');
  els.drawCount = document.getElementById('sh-draw-count');
  els.discardCount = document.getElementById('sh-discard-count');
  els.drawStack = document.getElementById('sh-draw-stack');
  els.discardStack = document.getElementById('sh-discard-stack');
  els.statusBanner = document.getElementById('sh-status-banner');
  els.actionContainer = document.getElementById('sh-action-container');
  els.roleReveal = document.getElementById('sh-role-reveal');
  els.envelopeBtn = document.getElementById('sh-envelope-btn');
  els.roleContent = document.getElementById('sh-role-content');
  els.roleCard = document.getElementById('sh-role-card');
  els.partyCard = document.getElementById('sh-party-card');
  els.roleGoal = document.getElementById('sh-role-goal');
  els.roleGoalTitle = document.getElementById('sh-role-goal-title');
  els.roleGoalText = document.getElementById('sh-role-goal-text');
  els.gameOverOverlay = document.getElementById('sh-game-over-overlay');
  els.actionOverlay = document.getElementById('sh-action-overlay');
  els.actionOverlayTitle = document.getElementById('sh-action-overlay-title');
  els.actionOverlayContent = document.getElementById('sh-action-overlay-content');
  els.victoryHeader = document.getElementById('sh-victory-header');
  els.victoryFooter = document.getElementById('sh-victory-footer');
  els.victoryText = document.getElementById('sh-victory-text');
  els.victoryReason = document.getElementById('sh-victory-reason');
  els.electionMarker = document.getElementById('sh-election-marker');
}

// ==================== UPDATE LOGIC ====================

function updateDOM(gs) {
  updateBoards(gs);
  updatePlayers(gs);
  updateActionArea(gs);
  updateRoleReveal(gs);
  updateGameOver(gs);
}

function updateBoards(gs) {
  const playerCount = (gs.players || []).length;
  let fascistAsset = ASSETS.board.fascist5_6;
  if (playerCount >= 9) fascistAsset = ASSETS.board.fascist9_10;
  else if (playerCount >= 7) fascistAsset = ASSETS.board.fascist7_8;
  
  if (els.fascistBoard.style.backgroundImage !== `url("${fascistAsset}")`) {
    els.fascistBoard.style.backgroundImage = `url('${fascistAsset}')`;
  }

  // Draw/Discard
  els.drawCount.textContent = gs.drawDeckSize || 0;
  els.discardCount.textContent = gs.discardDeckSize || 0;

  // Render physical card stacks
  let drawHtml = `<img class="sh-pile-base" src="${ASSETS.board.draw}">`;
  const drawLayers = Math.min((gs.drawDeckSize || 0), 17);
  for(let i=0; i<drawLayers; i++) {
    drawHtml += `<img class="sh-pile-layer" src="${ASSETS.policy.folderBack}" style="bottom: ${i * 2}px; left: ${i * -0.5}px;">`;
  }
  els.drawStack.innerHTML = drawHtml;

  let discardHtml = `<img class="sh-pile-base" src="${ASSETS.board.discard}">`;
  const discardLayers = Math.min((gs.discardDeckSize || 0), 17);
  for(let i=0; i<discardLayers; i++) {
    discardHtml += `<img class="sh-pile-layer" src="${ASSETS.policy.folderBack}" style="bottom: ${i * 2}px; left: ${i * 0.5}px;">`;
  }
  els.discardStack.innerHTML = discardHtml;

  // Liberal Policies
  const libs = gs.liberalPolicies || 0;
  for (let i = 0; i < 5; i++) {
    const slot = document.getElementById(`slot-liberal-${i}`);
    if (i < libs) slot.classList.add('active');
    else slot.classList.remove('active');
  }

  // Fascist Policies
  const fas = gs.fascistPolicies || 0;
  for (let i = 0; i < 6; i++) {
    const slot = document.getElementById(`slot-fascist-${i}`);
    if (i < fas) slot.classList.add('active');
    else slot.classList.remove('active');
  }

  // Election Tracker
  const failed = gs.electionTracker || 0;
  if (failed > 0) {
    els.electionMarker.style.display = 'block';
    // Positions on the liberal board for the election tracker circles
    // Approximate percentages for the 4 circles at the bottom of the liberal board
    const positions = ['35.5%', '44.5%', '53.5%', '62.5%'];
    els.electionMarker.style.left = positions[Math.min(failed, 4) - 1] || '35.5%';
  } else {
    els.electionMarker.style.display = 'none';
  }
}

function updatePlayers(gs) {
  const players = gs.players || [];
  
  // Rebuild players row if count mismatch (or initially)
  if (els.playersRow.children.length !== players.length) {
    els.playersRow.innerHTML = players.map(p => {
      let roleIconHtml = '';
      if (p.role) {
        const iconSrc = ASSETS.icons[p.role];
        if (iconSrc) {
          roleIconHtml = `<img src="${iconSrc}" class="sh-player-role-icon">`;
        }
      }
      return `
      <div class="sh-player" id="player-${p.id}">
        <img class="sh-player-portrait" id="portrait-${p.id}" src="${getPlayerPortrait(p.id, p.portraitIndex)}">
        <div class="sh-player-name">${roleIconHtml}${p.name}</div>
        <div class="sh-player-badge" id="badge-${p.id}" style="display:none;"></div>
      </div>
    `;
    }).join('');
  }

  players.forEach(p => {
    const pEl = document.getElementById(`player-${p.id}`);
    const badgeEl = document.getElementById(`badge-${p.id}`);
    
    // Update name with role icon
    const nameEl = pEl.querySelector('.sh-player-name');
    if (nameEl) {
      let roleIconHtml = '';
      if (p.role) {
        const iconSrc = ASSETS.icons[p.role];
        if (iconSrc) {
          roleIconHtml = `<img src="${iconSrc}" class="sh-player-role-icon">`;
        }
      }
      nameEl.innerHTML = `${roleIconHtml}${p.name}`;
    }

    if (p.alive === false) {
      pEl.classList.add('dead');
    } else {
      pEl.classList.remove('dead');
    }

    if (p.id === gs.currentPresident) {
      badgeEl.textContent = '👑';
      badgeEl.className = 'sh-player-badge president';
      badgeEl.style.display = 'flex';
    } else if (p.id === gs.currentChancellor) {
      badgeEl.textContent = '⚖️';
      badgeEl.className = 'sh-player-badge chancellor';
      badgeEl.style.display = 'flex';
    } else {
      badgeEl.style.display = 'none';
    }
    
    // Vote badges
    let voteBadge = pEl.querySelector('.sh-player-vote-badge');
    if (!voteBadge) {
      voteBadge = document.createElement('img');
      voteBadge.className = 'sh-player-vote-badge';
      pEl.appendChild(voteBadge);
    }
    
    if (gs.state === 'voting_results' && gs.voteMap && gs.voteMap[p.id] !== undefined) {
      voteBadge.src = gs.voteMap[p.id] ? ASSETS.vote.yes : ASSETS.vote.no;
      voteBadge.style.display = 'block';
    } else {
      voteBadge.style.display = 'none';
    }

    // Add click listener for selections
    pEl.onclick = () => {
      if (gs.state === 'chancellor_nomination' && gs.currentPresident === myPlayerId) {
        window.gameEmit('nominate_chancellor', { chancellorId: p.id });
      } else if (gs.state === 'presidential_power_execute' && gs.currentPresident === myPlayerId) {
        window.gameEmit('execute_player', { targetId: p.id });
      } else if (gs.state === 'presidential_power_investigate' && gs.currentPresident === myPlayerId) {
        window.gameEmit('investigate_player', { targetId: p.id });
      } else if (gs.state === 'presidential_power_election' && gs.currentPresident === myPlayerId) {
        window.gameEmit('call_election', { nextPresidentId: p.id });
      }
    };
    
    // Highlighting for clickable targets
    const isTargetable = (
      (gs.state === 'chancellor_nomination' && gs.currentPresident === myPlayerId && p.id !== myPlayerId && p.alive !== false) ||
      (gs.state === 'presidential_power_execute' && gs.currentPresident === myPlayerId && p.id !== myPlayerId && p.alive !== false) ||
      (gs.state === 'presidential_power_investigate' && gs.currentPresident === myPlayerId && p.id !== myPlayerId && p.alive !== false) ||
      (gs.state === 'presidential_power_election' && gs.currentPresident === myPlayerId && p.id !== myPlayerId && p.alive !== false)
    );
    pEl.style.cursor = isTargetable ? 'pointer' : 'default';
    pEl.style.transform = isTargetable ? 'scale(1.05)' : '';
    pEl.style.zIndex = isTargetable ? '20' : '1';
  });
}

function updateActionArea(gs) {
  let message = 'Game in progress...';
  let html = '';
  let overlayTitle = '';
  let overlayHtml = '';
  let showOverlay = false;

  const presPlayer = gs.players?.find(p => p.id === gs.currentPresident);
  const presName = presPlayer ? presPlayer.name : 'President';
  
  const chancPlayer = gs.players?.find(p => p.id === gs.currentChancellor);
  const chancName = chancPlayer ? chancPlayer.name : 'Chancellor';

  switch (gs.state) {
    case 'role_reveal':
      message = 'Review your secret role.';
      break;
    case 'chancellor_nomination':
      message = (gs.currentPresident === myPlayerId) ? '👑 You are President. Select a player to be Chancellor.' : `⏳ President ${presName} is nominating a Chancellor...`;
      if (gs.currentPresident === myPlayerId) {
        showOverlay = true;
        overlayTitle = 'Nominate a Chancellor';
        const alive = gs.players.filter(p => p.alive !== false);
        overlayHtml = alive.map(p => {
          if (p.id !== myPlayerId && p.id !== gs.lastChancellor && (alive.length <= 5 || p.id !== gs.lastPresident)) {
            let roleIconHtml = '';
            if (p.role) {
              const iconSrc = ASSETS.icons[p.role];
              if (iconSrc) {
                roleIconHtml = `<img src="${iconSrc}" class="sh-player-role-icon">`;
              }
            }
            return `<div class="sh-player" style="cursor:pointer; transform:scale(1.2);" onclick="window.gameEmit('nominate_chancellor', {chancellorId:'${p.id}'})">
                      <img class="sh-player-portrait" src="${getPlayerPortrait(p.id, p.portraitIndex)}">
                      <div class="sh-player-name">${roleIconHtml}${p.name}</div>
                    </div>`;
          }
          return '';
        }).join('');
      }
      break;
    case 'voting':
      message = `🗳️ Vote on ${chancName} as Chancellor in the popup window.`;
      showOverlay = true;
      overlayTitle = `Vote on ${chancName} as Chancellor`;
      overlayHtml = `
        <img src="${ASSETS.vote.yes}" class="sh-vote-card-btn" onclick="window.gameEmit('cast_vote', {voteYes:true})">
        <img src="${ASSETS.vote.no}" class="sh-vote-card-btn" onclick="window.gameEmit('cast_vote', {voteYes:false})">
      `;
      break;
    case 'voting_results':
      message = '🗳️ The votes are in!';
      showOverlay = true;
      const yes = gs.players.filter(p => p.alive !== false && gs.voteMap && gs.voteMap[p.id]).length;
      const total = gs.players.filter(p => p.alive !== false && gs.voteMap && gs.voteMap[p.id] !== undefined).length;
      const passed = yes > total / 2;
      overlayTitle = passed ? 'Government Elected!' : 'Government Rejected!';
      overlayHtml = `
        <h3 style="color:${passed?'#2ecc71':'#e74c3c'}; font-size:40px; margin:0;">
          ${yes} Ja! vs ${total - yes} Nein!
        </h3>
      `;
      break;
    case 'legislative_president':
      message = (gs.currentPresident === myPlayerId) ? '📜 You are President. Select a policy to DISCARD.' : `📜 President ${presName} is discarding a policy...`;
      if (gs.currentPresident === myPlayerId && gs.myCards) {
        showOverlay = true;
        overlayTitle = 'Discard a Policy';
        overlayHtml = gs.myCards.map((c, i) => `
          <img src="${c==='liberal'?ASSETS.policy.liberal:ASSETS.policy.fascist}" class="sh-vote-card-btn" onclick="window.gameEmit('president_discard', {cardIndex:${i}})">
        `).join('');
      }
      break;
    case 'legislative_chancellor':
      message = (gs.currentChancellor === myPlayerId) ? '📜 You are Chancellor. Select a policy to ENACT.' : `📜 Chancellor ${chancName} is enacting a policy...`;
      if (gs.currentChancellor === myPlayerId && gs.myCards) {
        showOverlay = true;
        overlayTitle = 'Enact a Policy';
        overlayHtml = gs.myCards.map((c, i) => `
          <img src="${c==='liberal'?ASSETS.policy.liberal:ASSETS.policy.fascist}" class="sh-vote-card-btn" onclick="window.gameEmit('chancellor_enact', {cardIndex:${i}})">
        `).join('');
        
        if (gs.fascistPolicies >= 5) {
          overlayHtml += `<div style="width:100%; text-align:center; margin-top:20px;"><button class="sh-action-btn" onclick="window.gameEmit('chancellor_veto')">Propose Veto</button></div>`;
        }
      }
      break;
    case 'policy_enacted':
      message = '📜 A policy has been enacted!';
      showOverlay = true;
      overlayTitle = gs.lastEnactedPolicy === 'liberal' ? 'Liberal Policy Enacted!' : 'Fascist Policy Enacted!';
      overlayHtml = `
        <img src="${gs.lastEnactedPolicy==='liberal'?ASSETS.policy.liberal:ASSETS.policy.fascist}" class="sh-vote-card-btn" style="cursor:default; height:350px;">
      `;
      break;
    case 'legislative_president_veto':
      message = (gs.currentPresident === myPlayerId) ? '⚖️ Chancellor requests a VETO. Allow it?' : `⚖️ Waiting for President ${presName} to respond to Veto...`;
      if (gs.currentPresident === myPlayerId) {
        showOverlay = true;
        overlayTitle = 'Chancellor Requests a Veto';
        overlayHtml = `
          <button class="sh-action-btn" onclick="window.gameEmit('president_veto_response', {allowVeto:true})" style="background:linear-gradient(#27ae60, #2ecc71);">Allow Veto</button>
          <button class="sh-action-btn" onclick="window.gameEmit('president_veto_response', {allowVeto:false})">Reject Veto</button>
        `;
      }
      break;
    case 'presidential_power_execute':
      message = (gs.currentPresident === myPlayerId) ? '🔫 You must ASSASSINATE a player. Click their portrait.' : `🔫 President ${presName} is assassinating someone...`;
      break;
    case 'presidential_power_investigate':
      message = (gs.currentPresident === myPlayerId) ? '🕵️ You must INVESTIGATE a player. Click their portrait.' : `🕵️ President ${presName} is investigating...`;
      break;
    case 'presidential_power_peek':
      message = (gs.currentPresident === myPlayerId) ? '👁️ You may PEEK at the top 3 cards.' : `👁️ President ${presName} is peeking at the deck...`;
      if (gs.currentPresident === myPlayerId) {
        showOverlay = true;
        overlayTitle = 'Peek at Top 3 Cards';
        if (gs.myCards) {
          overlayHtml = gs.myCards.map(c => `
            <img src="${c==='liberal'?ASSETS.policy.liberal:ASSETS.policy.fascist}" class="sh-vote-card-btn" style="cursor:default;">
          `).join('');
          overlayHtml += `<div style="width:100%; text-align:center; margin-top:20px;"><button class="sh-action-btn" onclick="window.gameEmit('acknowledge_peek')">Done</button></div>`;
        } else {
          overlayHtml = `<button class="sh-action-btn" onclick="window.gameEmit('peek_cards')">Peek Cards</button>`;
        }
      }
      break;
    case 'presidential_power_election':
      message = (gs.currentPresident === myPlayerId) ? '🗳️ Call a SPECIAL ELECTION. Click a player to be the next President.' : `🗳️ President ${presName} is calling a special election...`;
      if (gs.currentPresident === myPlayerId) {
        const alive = gs.players.filter(p => p.alive !== false);
        html += '<div><h3>Call special election - choose next President</h3>';
        alive.forEach(p => {
          if (p.id !== myPlayerId) {
            html += `<button class="sh-action-btn" onclick="window.gameEmit('call_election', {nextPresidentId:'${p.id}'})">Make ${p.name} President</button>`;
          }
        });
        html += '</div>';
      }
      break;
  }

  // Only show the action overlay if the user has dismissed their role reveal
  if (showOverlay && window.shRoleRevealed) {
    els.actionOverlayTitle.textContent = overlayTitle;
    els.actionOverlayContent.innerHTML = overlayHtml;
    els.actionOverlay.style.display = 'flex';
  } else {
    els.actionOverlay.style.display = 'none';
  }

  els.statusBanner.textContent = message;
  els.actionContainer.innerHTML = html;
}

function updateRoleReveal(gs) {
  if (gs.state === 'setup') {
    window.shRoleRevealed = false;
  }

  // Show if game started and user hasn't clicked acknowledge yet
  if (!window.shRoleRevealed && gs.state !== 'setup' && gs.state !== 'game_over') {
    if (els.roleReveal.style.display === 'none') {
      els.roleReveal.style.display = 'flex';
      els.envelopeBtn.style.display = 'block';
      els.roleContent.style.display = 'none';

      const myPlayer = gs.players.find(p => p.id === myPlayerId);
      if (myPlayer) {
        // Pick a random variant of the role card art
        let rImg, pImg, goalTitle, goalText;
        
        if (myPlayer.role === 'liberal') {
          const liberalVariants = [
            ASSETS.role.liberal1, ASSETS.role.liberal2, ASSETS.role.liberal3,
            ASSETS.role.liberal4, ASSETS.role.liberal5, ASSETS.role.liberal6
          ];
          rImg = liberalVariants[Math.floor(Math.random() * liberalVariants.length)];
          pImg = ASSETS.party.liberal;
          goalTitle = 'You are a Liberal';
          goalText = 'Your goal is to enact 5 Liberal policies or assassinate Hitler. You do not know who the other Liberals or Fascists are. Trust no one.';
        } else if (myPlayer.role === 'fascist') {
          const fascistVariants = [ASSETS.role.fascist1, ASSETS.role.fascist2, ASSETS.role.fascist3];
          rImg = fascistVariants[Math.floor(Math.random() * fascistVariants.length)];
          pImg = ASSETS.party.fascist;
          goalTitle = 'You are a Fascist';
          goalText = 'Your goal is to enact 6 Fascist policies or get Hitler elected Chancellor after 3 Fascist policies are enacted. You know who Hitler is — protect them at all costs.';
        } else if (myPlayer.role === 'hitler') {
          rImg = ASSETS.role.hitler;
          pImg = ASSETS.party.fascist;
          goalTitle = 'You are Hitler';
          goalText = 'Your goal is to get elected Chancellor after 3 Fascist policies are enacted, or help the Fascists enact 6 Fascist policies. Stay hidden — if the Liberals discover you, they will assassinate you.';
        }

        els.roleCard.src = rImg;
        els.partyCard.src = pImg;
        
        // Set goal text and color
        els.roleGoalTitle.textContent = goalTitle;
        els.roleGoalText.textContent = goalText;
        els.roleGoal.className = 'sh-role-goal ' + (myPlayer.role === 'liberal' ? 'liberal' : myPlayer.role === 'fascist' ? 'fascist' : 'hitler');
      }
    }
  } else if (window.shRoleRevealed) {
    els.roleReveal.style.display = 'none';
  }
}

function updateGameOver(gs) {
  if (gs.state === 'game_over') {
    els.gameOverOverlay.classList.add('active');
    
    const liberalsWin = gs.winner === 'liberal';
    els.victoryHeader.src = liberalsWin ? ASSETS.victory.liberalHeader : ASSETS.victory.fascistHeader;
    els.victoryFooter.src = liberalsWin ? ASSETS.victory.liberalFooter : ASSETS.victory.fascistFooter;
    
    els.victoryText.textContent = liberalsWin ? 'LIBERALS WIN!' : 'FASCISTS WIN!';
    els.victoryText.style.color = liberalsWin ? '#2ecc71' : '#e74c3c';

    let reason = '';
    if (gs.winReason === 'enacted_liberal_policies') reason = '6 liberal policies were enacted.';
    else if (gs.winReason === 'executed_hitler') reason = 'Hitler was assassinated.';
    else if (gs.winReason === 'enacted_fascist_policies') reason = '5 fascist policies were enacted.';
    else if (gs.winReason === 'hitler_chancellor') reason = 'Hitler became Chancellor.';
    els.victoryReason.textContent = reason;
  } else {
    els.gameOverOverlay.classList.remove('active');
  }
}