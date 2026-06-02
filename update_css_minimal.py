import re

file_path = r"c:\Users\salim\Downloads\Bluewongo-main\Bluewongo-main\public\css\styles.css"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Remove old .game-top-bar styles
content = re.sub(r"\.casino-table \.game-top-bar \{.*?\n\}\n", "", content, flags=re.DOTALL)
content = re.sub(r"\.casino-table \.game-top-bar \.round-info \{.*?\n\}\n", "", content, flags=re.DOTALL)
content = re.sub(r"/\* Top bar \*/.*?\.game-top-bar \.round-info \{.*?\n\}\n", "", content, flags=re.DOTALL)

# 2. Remove old .controls-area styles
content = re.sub(r"/\* ===== CONTROLS ===== \*/\n\.controls-area \{.*?\n\}\n", "", content, flags=re.DOTALL)

# 3. Add new CSS to the end of the file
new_css = """
/* ===== MINIMALIST UI - TOP SETTINGS ===== */
.top-right-settings {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 100;
}

.gear-icon {
  font-size: 1.5rem;
  background: rgba(10, 14, 26, 0.7);
  border: 1px solid rgba(212, 168, 71, 0.3);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.gear-icon:hover {
  transform: rotate(90deg);
  box-shadow: 0 0 15px rgba(212, 168, 71, 0.4);
}

.settings-dropdown {
  position: absolute;
  top: 50px;
  right: 0;
  width: 220px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(212, 168, 71, 0.2);
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
}

.dropdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: var(--text-dim);
}

.dropdown-item span {
  color: var(--gold);
  font-weight: 700;
}

/* ===== MINIMALIST UI - ACTIONS DRAWER ===== */
.actions-drawer {
  position: absolute;
  bottom: 160px; /* Sits above the hand */
  left: 50%;
  transform: translateX(-50%) translateY(0);
  width: 90%;
  max-width: 600px;
  border-radius: 16px;
  border: 1px solid rgba(212, 168, 71, 0.3);
  box-shadow: 0 -5px 30px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease;
  z-index: 90;
}

.actions-drawer.closed {
  transform: translateX(-50%) translateY(120%);
  opacity: 0;
  pointer-events: none;
}

.drawer-handle {
  width: 100%;
  height: 24px;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding-top: 4px;
}

.handle-bar {
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  transition: background 0.2s;
}

.drawer-handle:hover .handle-bar {
  background: rgba(212, 168, 71, 0.8);
}

.drawer-content {
  width: 100%;
  padding: 10px 20px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
"""

content += new_css

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated styles.css")
