import re

file_path = r"c:\Users\salim\Downloads\Bluewongo-main\Bluewongo-main\public\index.html"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Replace .game-top-bar
top_bar_pattern = re.compile(r"<!-- Top bar -->\s*<div class=\"game-top-bar glass\">.*?</div>\s*</div>\s*<div class=\"round-info\">Round <span id=\"game-round\">1</span></div>\s*</div>", re.DOTALL)

top_bar_replacement = """<!-- Top-Right Settings -->
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
      </div>"""

content = top_bar_pattern.sub(top_bar_replacement, content)

# 2. Replace controls-area and player-dashboard up to hand-area
controls_pattern = re.compile(r"<!-- Controls -->\s*<div class=\"controls-area\" id=\"controls-area\">.*?<!-- Hand -->\s*<div class=\"player-dashboard\">\s*<!-- Player's Own Bullets -->\s*<div class=\"player-lives-panel glass\">\s*<div class=\"lives-title\">Shots Taken</div>\s*<div class=\"player-shots-text\" id=\"player-shots-text\">0 / 6</div>\s*</div>", re.DOTALL)

controls_replacement = """<!-- Actions Drawer -->
      <div class="actions-drawer glass closed" id="actions-drawer">
        <button class="drawer-handle" id="btn-toggle-actions-drawer">
          <span class="handle-bar"></span>
        </button>
        
        <div class="drawer-content">
          <!-- Player's Own Bullets (Moved here) -->
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
      <div class="player-dashboard">"""

content = controls_pattern.sub(controls_replacement, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated index.html")
