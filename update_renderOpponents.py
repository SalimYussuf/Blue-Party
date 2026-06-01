import re

file_path = r"c:\Users\salim\Downloads\Bluewongo-main\Bluewongo-main\public\js\app.js"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

new_func = """  function renderOpponents(players, currentTurnTeamIndex = null) {
    const container = $('opponents-container');
    const spotlight = $('table-spotlight');
    if (!container) return;
    
    container.innerHTML = '';
    
    const me = players.find(p => p.id === state.playerId);
    const myTeamIndex = me ? me.teamIndex : -1;

    // Group teams
    const teams = {};
    players.forEach(p => {
      if (!teams[p.teamIndex]) teams[p.teamIndex] = [];
      teams[p.teamIndex].push(p);
    });

    const allTeamIndices = Object.keys(teams).sort((a,b) => parseInt(a) - parseInt(b));
    const totalTeams = allTeamIndices.length;
    if (totalTeams === 0) return;
    
    const angleStep = (2 * Math.PI) / totalTeams;
    
    let localTeamOrderIdx = 0;
    if (state.turnOrder && state.turnOrder.length > 0) {
      localTeamOrderIdx = state.turnOrder.indexOf(myTeamIndex);
      if (localTeamOrderIdx === -1) localTeamOrderIdx = 0;
    } else {
      localTeamOrderIdx = allTeamIndices.indexOf(myTeamIndex.toString());
      if (localTeamOrderIdx === -1) localTeamOrderIdx = 0;
    }

    if (spotlight) spotlight.classList.add('hidden');

    allTeamIndices.forEach((tIdxStr) => {
      const tIdx = parseInt(tIdxStr);
      const teamPlayers = teams[tIdxStr];
      
      let orderIdx = 0;
      if (state.turnOrder && state.turnOrder.length > 0) {
        orderIdx = state.turnOrder.indexOf(tIdx);
        if (orderIdx === -1) orderIdx = allTeamIndices.indexOf(tIdxStr);
      } else {
        orderIdx = allTeamIndices.indexOf(tIdxStr);
      }
      
      // Place local player at the bottom (Math.PI/2)
      const angle = Math.PI / 2 + (orderIdx - localTeamOrderIdx) * angleStep;
      
      // Calculate coordinates (oval table)
      const leftPct = 50 + 40 * Math.cos(angle);
      const topPct = 50 + 35 * Math.sin(angle);
      
      // If active turn, move spotlight
      if (tIdx === currentTurnTeamIndex && spotlight) {
        spotlight.style.left = `${leftPct}%`;
        spotlight.style.top = `${topPct}%`;
        spotlight.classList.remove('hidden');
      }

      // Skip rendering the full card for the local player's team
      if (tIdx === myTeamIndex) return;

      const p = teamPlayers[0];
      const names = teamPlayers.map(tp => tp.name).join(' & ');
      const isEliminated = teamPlayers.every(tp => tp.isEliminated);
      const isDisconnected = teamPlayers.every(tp => !tp.isConnected);

      const card = document.createElement('div');
      card.className = 'opponent-card';
      
      card.style.left = `${leftPct}%`;
      card.style.top = `${topPct}%`;
      
      // Keep readability high for far players
      const adjustedScale = 0.85 + ((topPct - 15) / 70) * 0.15; 
      
      // Stand the card up to face the camera in the 3D space
      card.style.transform = `translate(-50%, -50%) rotateX(-45deg) scale(${adjustedScale})`;
      card.style.transformOrigin = 'bottom center';

      if (isEliminated) card.classList.add('eliminated');
      if (isDisconnected) card.classList.add('disconnected');
      if (tIdx === currentTurnTeamIndex) card.classList.add('active-turn');
      
      const isTargetable = (state.targetingMode || state.chaosTargetingMode) && !isEliminated;
      if (isTargetable) card.classList.add('targetable');
      
      card.id = `opponent-team-${tIdx}`;

      // Turn Order Badge
      if (state.turnOrder && state.turnOrder.length > 0) {
        const orderIdxBadge = state.turnOrder.indexOf(tIdx);
        if (orderIdxBadge !== -1) {
          const badge = document.createElement('div');
          badge.className = 'turn-order-badge';
          badge.textContent = orderIdxBadge + 1;
          card.appendChild(badge);

          const currentIdx = state.turnOrder.indexOf(currentTurnTeamIndex);
          const nextIdx = (currentIdx + 1) % state.turnOrder.length;
          if (orderIdxBadge === nextIdx && !isEliminated) {
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
      
      // Scale up the avatar text slightly for better readability
      avatarDiv.style.transform = `scale(${1.2})`;
      card.appendChild(avatarDiv);

      const nameDiv = document.createElement('div');
      nameDiv.className = 'opponent-name';
      nameDiv.textContent = names + (isDisconnected ? ' ⚡' : '') + (isEliminated ? ' 💀' : '');
      // Ensure name is readable
      nameDiv.style.fontSize = '1.1rem';
      card.appendChild(nameDiv);

      const cardsRow = document.createElement('div');
      cardsRow.className = 'opponent-cards-row';
      const handSize = p.handSize;
      const count = Math.min(handSize, 10);
      for (let c = 0; c < count; c++) {
        const back = document.createElement('div');
        back.className = 'mini-card-back';
        cardsRow.appendChild(back);
      }
      card.appendChild(cardsRow);

      const countDiv = document.createElement('div');
      countDiv.style.fontSize = '.85rem';
      countDiv.style.color = 'var(--text-dim)';
      countDiv.style.margin = '4px 0';
      countDiv.textContent = `${handSize} cards`;
      card.appendChild(countDiv);

      const shotsDiv = document.createElement('div');
      shotsDiv.className = 'opponent-shots';
      shotsDiv.style.fontSize = '.9rem';
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
            const targetingBanner = $('targeting-banner');
            if(targetingBanner) targetingBanner.classList.add('hidden');
            renderOpponents(state.players, null);
            showToast(`Targeting team: ${names}`, 'info');
          }
        }
      });

      container.appendChild(card);
    });
  }"""

# Use regex to find and replace the renderOpponents function
pattern = re.compile(r"  function renderOpponents\(players, currentTurnTeamIndex = null\) \{.*?(?=\n  function renderPlayerLives)", re.DOTALL)

if pattern.search(content):
    new_content = pattern.sub(new_func, content)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Replaced renderOpponents successfully.")
else:
    print("Could not find renderOpponents function in app.js")

