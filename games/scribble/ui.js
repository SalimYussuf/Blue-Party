const socket = window.app.socket;
const state = window.app.state;

const screen = document.getElementById('scribble-screen');

screen.innerHTML = `
  <div id="scribble-layout" style="width: 100vw; height: 100vh; position: relative; overflow: hidden; font-family: 'Fredoka', 'Quicksand', 'Inter', sans-serif; background-color: #fffbf5; background-image: radial-gradient(#e1dcd5 1px, transparent 1px); background-size: 24px 24px;">
    <!-- Paint Splatters for immersive studio aesthetic -->
    <div class="splatter" style="position: absolute; top: 10%; left: 5%; width: 150px; height: 150px; opacity: 0.07; pointer-events: none; z-index: 1;">
      <svg viewBox="0 0 100 100" fill="#ef4444" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 20 C60 10, 80 15, 75 35 C70 55, 90 60, 80 80 C70 100, 40 90, 30 85 C20 80, 10 60, 20 40 C30 20, 40 30, 50 20 Z" />
        <circle cx="20" cy="15" r="5" />
        <circle cx="85" cy="40" r="3" />
        <circle cx="15" cy="80" r="4" />
      </svg>
    </div>
    <div class="splatter" style="position: absolute; bottom: 15%; right: 5%; width: 180px; height: 180px; opacity: 0.07; pointer-events: none; z-index: 1;">
      <svg viewBox="0 0 100 100" fill="#3b82f6" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 25 C55 5, 85 10, 80 40 C75 70, 95 65, 80 85 C65 105, 35 85, 25 75 C15 65, 5 45, 20 30 C35 15, 45 45, 50 25 Z" />
        <circle cx="10" cy="20" r="6" />
        <circle cx="90" cy="50" r="4" />
        <circle cx="30" cy="90" r="5" />
      </svg>
    </div>
    <div class="splatter" style="position: absolute; top: 40%; right: 15%; width: 120px; height: 120px; opacity: 0.05; pointer-events: none; z-index: 1;">
      <svg viewBox="0 0 100 100" fill="#eab308" xmlns="http://www.w3.org/2000/svg">
        <path d="M40 30 C50 15, 75 25, 70 45 C65 65, 85 75, 70 90 C55 105, 30 80, 20 70 C10 60, 15 40, 25 35 C35 30, 30 45, 40 30 Z" />
        <circle cx="80" cy="20" r="4" />
        <circle cx="15" cy="55" r="3" />
      </svg>
    </div>

    <!-- Top Floating Pill Bar -->
    <div class="top-pill-bar">
      <div class="round-sticker" id="scribble-round-info">Round 1/3</div>
      <div class="word-display" id="scribble-word-display">WAITING...</div>
      <div class="timer-bubble" id="scribble-timer">60</div>
    </div>

    <!-- Main Canvas Section -->
    <div class="canvas-wrapper">
      <div class="canvas-frame">
        <canvas id="scribble-canvas"></canvas>
        <div id="scribble-overlay" class="canvas-overlay">
          <div class="overlay-card">
            <div class="overlay-mascot">🎨</div>
            <h2 id="scribble-overlay-title">Waiting to start...</h2>
            <p id="scribble-overlay-desc"></p>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Toggle Buttons (Left & Right) -->
    <button class="floating-toggle toggle-left" id="btn-toggle-leaderboard" title="Show Scores">
      <span class="emoji">🏆</span>
    </button>

    <button class="floating-toggle toggle-right" id="btn-toggle-tools" title="Show Tools" style="display: none;">
      <span class="emoji">🎨</span>
    </button>

    <!-- Backdrop overlay when drawer is open -->
    <div class="drawer-backdrop" id="scribble-backdrop"></div>

    <!-- Left Drawer: Leaderboard / Scores -->
    <div class="scribble-drawer drawer-left" id="scribble-leaderboard-panel">
      <div class="drawer-header">
        <span class="drawer-title">🏆 Players</span>
        <button class="drawer-close" id="btn-close-leaderboard">✕</button>
      </div>
      <div class="drawer-body">
        <ul id="scribble-scores" class="bubbly-scores-list"></ul>
      </div>
    </div>

    <!-- Right Drawer: Art Tools -->
    <div class="scribble-drawer drawer-right" id="scribble-tools-panel">
      <div class="drawer-header">
        <span class="drawer-title">🎨 Studio Tools</span>
        <button class="drawer-close" id="btn-close-tools">✕</button>
      </div>
      <div class="drawer-body" id="scribble-tools">
        <div class="tool-section">
          <h4>Paint Palette</h4>
          <div class="paint-palette">
            <button class="color-btn active" style="background: #000000;" data-color="#000000" title="Black"></button>
            <button class="color-btn" style="background: #ef4444;" data-color="#ef4444" title="Red"></button>
            <button class="color-btn" style="background: #3b82f6;" data-color="#3b82f6" title="Blue"></button>
            <button class="color-btn" style="background: #22c55e;" data-color="#22c55e" title="Green"></button>
            <button class="color-btn" style="background: #eab308;" data-color="#eab308" title="Yellow"></button>
            <button class="color-btn" style="background: #a855f7;" data-color="#a855f7" title="Purple"></button>
            <button class="color-btn" style="background: #f97316;" data-color="#f97316" title="Orange"></button>
            <button class="color-btn" style="background: #ffffff; border: 2px solid #ccc;" data-color="#ffffff" title="White / Eraser"></button>
          </div>
        </div>
        
        <div class="tool-section">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <h4>Brush Size: <span id="brush-size-label">5</span></h4>
            <div id="brush-preview" class="brush-preview-circle"></div>
          </div>
          <input type="range" id="scribble-brush-size" min="2" max="30" value="5" class="bubbly-range">
        </div>

        <button class="btn-clear-canvas" id="scribble-clear-btn">
          <span class="emoji">🧼</span> Clear Board
        </button>
      </div>
    </div>

    <!-- Bottom Drawer: Collapsible Chat / Guesses -->
    <div class="scribble-chat-drawer" id="scribble-chat-drawer">
      <div class="chat-drawer-header" id="btn-toggle-chat">
        <div class="header-left">
          <span class="emoji">💬</span>
          <span class="header-text">Guesses & Chat</span>
          <span class="unread-badge" id="unread-chat-badge" style="display: none;">0</span>
        </div>
        <div class="header-right">
          <span class="chevron-icon" id="chat-chevron">▲</span>
        </div>
      </div>
      <div class="chat-drawer-body">
        <div id="scribble-chat-messages" class="chat-messages-container"></div>
        <div class="chat-input-wrapper">
          <input type="text" id="scribble-chat-input" placeholder="Type your guess here..." autocomplete="off">
          <button class="btn-chat-send" id="scribble-chat-send">Send</button>
        </div>
      </div>
    </div>
  </div>

  <style>
    @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&family=Quicksand:wght@500;700&display=swap');

    #scribble-screen { font-family: 'Fredoka', 'Quicksand', sans-serif !important; }
    .top-pill-bar { position: absolute; top: 15px; left: 50%; transform: translateX(-50%); width: 90%; max-width: 650px; display: flex; align-items: center; justify-content: space-between; padding: 10px 20px; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(12px); border: 3px solid #4a3c31; border-radius: 50px; box-shadow: 0 8px 24px rgba(74, 60, 49, 0.15); z-index: 100; gap: 12px; }
    .round-sticker { background: #ffec3d; color: #1c1c1c; padding: 6px 14px; border-radius: 14px; transform: rotate(-2deg); font-weight: 700; border: 2.5px solid #4a3c31; box-shadow: 2px 2px 0 #4a3c31; font-size: 0.9rem; white-space: nowrap; }
    .word-display { font-size: 1.4rem; font-weight: 700; letter-spacing: 4px; color: #2c2c2c; text-align: center; flex: 1; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .timer-bubble { background: #ff4d4f; color: #fff; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 2.5px solid #4a3c31; font-size: 1.2rem; font-weight: 700; box-shadow: 0 3px 0 #4a3c31; transition: color 0.3s, background-color 0.3s; }
    .canvas-wrapper { position: absolute; top: 75px; bottom: 80px; left: 15px; right: 15px; display: flex; align-items: center; justify-content: center; z-index: 5; }
    .canvas-frame { position: relative; width: 100%; height: 100%; max-width: 900px; background: #ffffff; border: 6px solid #5c4033; border-radius: 24px; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1), inset 0 0 10px rgba(0, 0, 0, 0.05); overflow: hidden; }
    #scribble-canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #ffffff; cursor: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><path d='M0 32 L2 24 L8 30 Z' fill='%23000000'/><path d='M2 24 L8 30 L12 26 L6 20 Z' fill='%23e0a96d' stroke='%234a3c31' stroke-width='1.5'/><path d='M6 20 L12 26 L26 12 L20 6 Z' fill='%23ffc107' stroke='%234a3c31' stroke-width='1.5'/><path d='M20 6 L26 12 L28 10 L22 4 Z' fill='%239e9e9e' stroke='%234a3c31' stroke-width='1'/><path d='M22 4 L28 10 L31 7 L25 1 Z' fill='%23ff80ab' stroke='%234a3c31' stroke-width='1'/></svg>") 0 32, crosshair; }
    .canvas-overlay { position: absolute; inset: 0; background: rgba(92, 64, 51, 0.85); display: flex; align-items: center; justify-content: center; z-index: 10; padding: 20px; text-align: center; opacity: 1; transition: opacity 0.5s ease, visibility 0.5s ease; visibility: visible; }
    .canvas-overlay.hidden-fade { opacity: 0; visibility: hidden; pointer-events: none; }
    .overlay-card { background: #ffffff; border: 4px solid #4a3c31; border-radius: 24px; padding: 30px 40px; max-width: 420px; box-shadow: 0 12px 28px rgba(0, 0, 0, 0.2); }
    .overlay-mascot { font-size: 3.5rem; margin-bottom: 12px; animation: mascotBounce 2s infinite ease-in-out; }
    @keyframes mascotBounce { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-10px) rotate(4deg); } }
    #scribble-overlay-title { font-size: 1.6rem; font-weight: 700; color: #4a3c31; margin-bottom: 8px; }
    #scribble-overlay-desc { font-size: 1.1rem; color: #5d4037; }
    .floating-toggle { position: absolute; z-index: 90; width: 52px; height: 52px; border-radius: 50%; border: 3px solid #4a3c31; font-size: 1.5rem; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 5px 0 #4a3c31; transition: all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .floating-toggle:hover { transform: translateY(-2px); box-shadow: 0 7px 0 #4a3c31; }
    .floating-toggle:active { transform: translateY(3px); box-shadow: 0 2px 0 #4a3c31; }
    .toggle-left { top: 90px; left: 20px; background: #ffd666; }
    .toggle-right { top: 90px; right: 20px; background: #bae7ff; }
    .drawer-backdrop { position: absolute; inset: 0; background: rgba(74, 60, 49, 0.25); opacity: 0; pointer-events: none; z-index: 180; transition: opacity 0.25s ease; }
    .drawer-backdrop.active { opacity: 1; pointer-events: auto; }
    .scribble-drawer { position: absolute; top: 0; bottom: 0; width: 290px; background: #fffcf8; z-index: 200; display: flex; flex-direction: column; box-shadow: 0 0 30px rgba(0, 0, 0, 0.15); transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
    .drawer-left { left: 0; border-right: 4px solid #4a3c31; transform: translateX(-100%); }
    .drawer-left.open { transform: translateX(0); }
    .drawer-right { right: 0; border-left: 4px solid #4a3c31; transform: translateX(100%); }
    .drawer-right.open { transform: translateX(0); }
    .drawer-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 3.5px solid #4a3c31; background: #fdf2e2; }
    .drawer-title { font-size: 1.2rem; font-weight: 700; color: #4a3c31; }
    .drawer-close { background: transparent; border: none; font-size: 1.2rem; cursor: pointer; color: #8c6d58; padding: 0 4px; }
    .drawer-close:hover { color: #ff4d4f; }
    .drawer-body { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
    .bubbly-scores-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 10px; }
    .bubbly-scores-list li { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background: #ffffff; color: #4a3c31; font-weight: 700; border: 2px solid #4a3c31; border-radius: 16px; box-shadow: 0 3px 0 #4a3c31; }
    .tool-section { background: #ffffff; border: 2.5px solid #4a3c31; border-radius: 16px; padding: 14px; box-shadow: 0 3px 0 #4a3c31; }
    .tool-section h4 { margin-bottom: 10px; font-size: 0.95rem; color: #4a3c31; }
    .paint-palette { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .color-btn { aspect-ratio: 1; border-radius: 50%; border: 2.5px solid #4a3c31; cursor: pointer; transition: all 0.1s; box-shadow: 0 2.5px 0 #4a3c31; }
    .color-btn.active { transform: scale(1.1) translateY(-2px); border-color: #ff7a00; box-shadow: 0 4.5px 0 #ff7a00; }
    .brush-preview-circle { width: 5px; height: 5px; border-radius: 50%; background: #000000; border: 1px solid #ccc; }
    .bubbly-range { width: 100%; -webkit-appearance: none; background: #eae5dc; height: 8px; border-radius: 4px; outline: none; border: 2px solid #4a3c31; }
    .bubbly-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #ffd666; border: 2.5px solid #4a3c31; cursor: pointer; box-shadow: 0 2px 0 #4a3c31; }
    .btn-clear-canvas { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 12px; border-radius: 16px; border: 3px solid #4a3c31; background: #ffccc7; color: #a8071a; font-size: 1rem; font-weight: 700; cursor: pointer; box-shadow: 0 4px 0 #4a3c31; margin-top: 10px; }
    .scribble-chat-drawer { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%) translateY(290px); width: 90%; max-width: 480px; height: 350px; background: #ffffff; border: 3.5px solid #4a3c31; border-bottom: none; border-radius: 20px 20px 0 0; z-index: 200; transition: transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.15); display: flex; flex-direction: column; box-shadow: 0 -8px 24px rgba(74, 60, 49, 0.12); }
    .scribble-chat-drawer.open { transform: translateX(-50%) translateY(0); }
    .chat-drawer-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 18px; background: #fdf2e2; border-bottom: 3px solid #4a3c31; cursor: pointer; }
    .unread-badge { background: #ff4d4f; color: #ffffff; font-size: 0.75rem; font-weight: 700; padding: 2px 7px; border-radius: 10px; border: 2px solid #4a3c31; }
    .chat-drawer-body { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #fffcf9; }
    .chat-messages-container { flex: 1; padding: 14px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; border-bottom: 2px solid #eae5dc; }
    .scribble-msg { font-size: 0.9rem; }
    .scribble-msg .name { font-weight: 700; margin-right: 5px; color: #5d4037; }
    .scribble-msg.correct { color: #22c55e; font-weight: 700; background: #e8f5e9; padding: 4px 8px; border-radius: 8px; border: 1.5px dashed #22c55e; }
    .scribble-msg.close { color: #f59e0b; font-style: italic; background: #fdf6e2; padding: 4px 8px; border-radius: 8px; }
    .chat-input-wrapper { padding: 10px 14px; display: flex; gap: 8px; background: #ffffff; }
    .chat-input-wrapper input { flex: 1; border: 2px solid #4a3c31; border-radius: 12px; padding: 8px 12px; outline: none; font-size: 0.9rem; }
    .btn-chat-send { padding: 8px 16px; border: 2px solid #4a3c31; background: #bae7ff; font-weight: 700; border-radius: 12px; cursor: pointer; }
    .chevron-icon { font-size: 0.8rem; color: #8c6d58; transition: transform 0.3s; }
    .scribble-chat-drawer.open .chevron-icon { transform: rotate(180deg); }
  </style>
`;

// DOM Refs
const canvas = document.getElementById('scribble-canvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('scribble-overlay');
const overlayTitle = document.getElementById('scribble-overlay-title');
const overlayDesc = document.getElementById('scribble-overlay-desc');
const wordDisplay = document.getElementById('scribble-word-display');
const timerDisplay = document.getElementById('scribble-timer');
const roundInfo = document.getElementById('scribble-round-info');
const scoresList = document.getElementById('scribble-scores');
const chatMessages = document.getElementById('scribble-chat-messages');
const chatInput = document.getElementById('scribble-chat-input');
const chatSend = document.getElementById('scribble-chat-send');
const toolsPanel = document.getElementById('scribble-tools');
const clearBtn = document.getElementById('scribble-clear-btn');
const brushSizeInput = document.getElementById('scribble-brush-size');
const brushSizeLabel = document.getElementById('brush-size-label');

const btnToggleLeaderboard = document.getElementById('btn-toggle-leaderboard');
const btnCloseLeaderboard = document.getElementById('btn-close-leaderboard');
const leaderboardDrawer = document.getElementById('scribble-leaderboard-panel');
const btnToggleTools = document.getElementById('btn-toggle-tools');
const btnCloseTools = document.getElementById('btn-close-tools');
const toolsDrawer = document.getElementById('scribble-tools-panel');
const brushPreview = document.getElementById('brush-preview');
const btnToggleChat = document.getElementById('btn-toggle-chat');
const chatDrawer = document.getElementById('scribble-chat-drawer');
const unreadChatBadge = document.getElementById('unread-chat-badge');
const backdrop = document.getElementById('scribble-backdrop');

let isDrawing = false;
let currentDrawerId = null;
let drawColor = '#000000';
let drawSize = 5;
let lastX = 0;
let lastY = 0;
let unreadGuessesCount = 0;

function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}
window.addEventListener('resize', resizeCanvas);
setTimeout(resizeCanvas, 100);

function closeAllDrawers() {
  leaderboardDrawer.classList.remove('open');
  toolsDrawer.classList.remove('open');
  chatDrawer.classList.remove('open');
  backdrop.classList.remove('active');
}

btnToggleLeaderboard.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = leaderboardDrawer.classList.contains('open');
  closeAllDrawers();
  if (!isOpen) {
    leaderboardDrawer.classList.add('open');
    backdrop.classList.add('active');
  }
});

btnCloseLeaderboard.addEventListener('click', (e) => {
  e.stopPropagation();
  leaderboardDrawer.classList.remove('open');
  if (!toolsDrawer.classList.contains('open') && !chatDrawer.classList.contains('open')) {
    backdrop.classList.remove('active');
  }
});

btnToggleTools.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = toolsDrawer.classList.contains('open');
  closeAllDrawers();
  if (!isOpen) {
    toolsDrawer.classList.add('open');
    backdrop.classList.add('active');
  }
});

btnCloseTools.addEventListener('click', (e) => {
  e.stopPropagation();
  toolsDrawer.classList.remove('open');
  if (!leaderboardDrawer.classList.contains('open') && !chatDrawer.classList.contains('open')) {
    backdrop.classList.remove('active');
  }
});

btnToggleChat.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = chatDrawer.classList.contains('open');
  if (isOpen) {
    chatDrawer.classList.remove('open');
    if (!leaderboardDrawer.classList.contains('open') && !toolsDrawer.classList.contains('open')) {
      backdrop.classList.remove('active');
    }
  } else {
    chatDrawer.classList.add('open');
    unreadGuessesCount = 0;
    unreadChatBadge.style.display = 'none';
    unreadChatBadge.textContent = '0';
    leaderboardDrawer.classList.remove('open');
    toolsDrawer.classList.remove('open');
    backdrop.classList.add('active');
    setTimeout(() => chatInput.focus(), 150);
  }
});

backdrop.addEventListener('click', () => closeAllDrawers());

function updateBrushPreview(size) {
  if (brushPreview) {
    brushPreview.style.width = `${size}px`;
    brushPreview.style.height = `${size}px`;
    brushPreview.style.backgroundColor = drawColor;
  }
}

document.querySelectorAll('.color-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    drawColor = btn.dataset.color;
    updateBrushPreview(drawSize);
  });
});

brushSizeInput.addEventListener('input', (e) => {
  drawSize = parseInt(e.target.value);
  brushSizeLabel.textContent = drawSize;
  updateBrushPreview(drawSize);
});
updateBrushPreview(drawSize);

clearBtn.addEventListener('click', () => {
  if (currentDrawerId !== state.playerId) return;
  socket.emit('clear_canvas', { roomCode: state.roomCode });
  clearCanvasLocal();
});

function clearCanvasLocal() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  let clientX = e.clientX, clientY = e.clientY;
  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  }
  return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
}

function startDrawing(e) {
  if (currentDrawerId !== state.playerId) return;
  isDrawing = true;
  const pos = getMousePos(e);
  lastX = pos.x; lastY = pos.y;
}

function draw(e) {
  if (!isDrawing || currentDrawerId !== state.playerId) return;
  e.preventDefault();
  const pos = getMousePos(e);
  const stroke = { x0: lastX / canvas.width, y0: lastY / canvas.height, x1: pos.x / canvas.width, y1: pos.y / canvas.height, color: drawColor, size: drawSize };
  drawStrokeLocal(stroke);
  socket.emit('draw_stroke', { roomCode: state.roomCode, stroke: stroke });
  lastX = pos.x; lastY = pos.y;
}

function stopDrawing() { isDrawing = false; }
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);
canvas.addEventListener('touchstart', startDrawing, {passive: false});
canvas.addEventListener('touchmove', draw, {passive: false});
canvas.addEventListener('touchend', stopDrawing);

function drawStrokeLocal(stroke) {
  ctx.beginPath();
  ctx.moveTo(stroke.x0 * canvas.width, stroke.y0 * canvas.height);
  ctx.lineTo(stroke.x1 * canvas.width, stroke.y1 * canvas.height);
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.closePath();
}

function sendGuess() {
  const text = chatInput.value.trim();
  if (!text) return;
  if (currentDrawerId === state.playerId) {
    addChatMessage("System", "You cannot guess while drawing!", "close");
    chatInput.value = '';
    return;
  }
  socket.emit('submit_guess', { roomCode: state.roomCode, guess: text });
  chatInput.value = '';
}

chatSend.addEventListener('click', sendGuess);
chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendGuess(); });

function addChatMessage(name, msg, type = '') {
  const div = document.createElement('div');
  div.className = `scribble-msg ${type}`;
  div.innerHTML = `<span class="name">${name}:</span> <span>${msg}</span>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  if (!chatDrawer.classList.contains('open')) {
    unreadGuessesCount++;
    unreadChatBadge.textContent = unreadGuessesCount;
    unreadChatBadge.style.display = 'inline-block';
  }
}

function updateScores(scores) {
  scoresList.innerHTML = '';
  scores.sort((a, b) => b.score - a.score).forEach(s => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${s.name} ${s.id === currentDrawerId ? '✏️' : ''}</span> <span>${s.score}</span>`;
    scoresList.appendChild(li);
  });
}

socket.on('scribble_turn_start', (data) => {
  resizeCanvas();
  clearCanvasLocal();
  currentDrawerId = data.drawerId;
  roundInfo.textContent = `Round ${data.round}/${data.maxRounds}`;
  timerDisplay.textContent = data.timeLimit;
  updateScores(data.scores);
  
  // Show turn start overlay for 2 seconds with fade-out
  overlay.classList.remove('hidden-fade');
  overlay.style.display = 'flex'; // Ensure overlay is visible if it was overridden
  if (currentDrawerId === state.playerId) {
    overlayTitle.textContent = "🎨 You are drawing!";
    overlayDesc.textContent = "Get ready to paint your masterpiece!";
  } else {
    overlayTitle.textContent = `🧑‍🎨 ${data.drawerName}`;
    overlayDesc.textContent = "is drawing now! Get ready to guess!";
  }
  
  if (window.overlayTimeout) {
    clearTimeout(window.overlayTimeout);
  }
  window.overlayTimeout = setTimeout(() => {
    overlay.classList.add('hidden-fade');
  }, 2000);

  chatInput.disabled = (currentDrawerId === state.playerId);
  if (currentDrawerId === state.playerId) {
    btnToggleTools.style.display = 'flex';
    toolsPanel.style.display = 'block';
    wordDisplay.textContent = "WAITING FOR WORD...";
  } else {
    btnToggleTools.style.display = 'none';
    toolsPanel.style.display = 'none';
    toolsDrawer.classList.remove('open');
    if (!leaderboardDrawer.classList.contains('open') && !chatDrawer.classList.contains('open')) {
      backdrop.classList.remove('active');
    }
    wordDisplay.textContent = Array(data.wordLength).fill('_').join(' ');
  }
  addChatMessage("System", `${data.drawerName} is drawing!`, "close");
});

socket.on('scribble_your_turn', (data) => { wordDisplay.textContent = `Draw: ${data.word}`; });

socket.on('scribble_timer_sync', (data) => {
  timerDisplay.textContent = data.timeLeft;
  if (data.timeLeft <= 10) {
    timerDisplay.style.color = '#fff';
    timerDisplay.style.backgroundColor = '#ff4d4f';
  } else {
    timerDisplay.style.color = '#fff';
    timerDisplay.style.backgroundColor = '#22c55e';
  }
});

socket.on('scribble_turn_over', (data) => {
  if (window.overlayTimeout) {
    clearTimeout(window.overlayTimeout);
  }
  overlay.classList.remove('hidden-fade');
  overlay.style.display = 'flex';
  overlayTitle.textContent = data.allGuessed ? "Everyone guessed it!" : "Time's up!";
  overlayDesc.innerHTML = `The word was: <span style="color: #ff7a00; font-weight: bold; font-size: 1.5rem;">${data.word}</span>`;
  updateScores(data.scores);
  btnToggleTools.style.display = 'none';
  toolsDrawer.classList.remove('open');
  if (!leaderboardDrawer.classList.contains('open') && !chatDrawer.classList.contains('open')) {
    backdrop.classList.remove('active');
  }
});

socket.on('scribble_draw_stroke', (data) => { drawStrokeLocal(data.stroke); });
socket.on('scribble_clear_canvas', () => { clearCanvasLocal(); });
socket.on('scribble_chat_message', (data) => { addChatMessage(data.playerName, data.message); });
socket.on('scribble_close_guess', (data) => { addChatMessage("System", `'${data.guess}' is very close!`, "close"); });
socket.on('scribble_correct_guess', (data) => {
  addChatMessage(data.playerName, "guessed the word!", "correct");
  if (data.playerId === state.playerId) chatInput.disabled = true;
});
