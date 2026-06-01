import re

file_path = r"c:\Users\salim\Downloads\Bluewongo-main\Bluewongo-main\public\js\app.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add DOM variables
variables_snippet = """  // Minimalist UI Elements
  const btnSettingsToggle = $('btn-settings-toggle');
  const settingsDropdown = $('settings-dropdown');
  const btnLeaveRoomDropdown = $('btn-leave-room-dropdown');
  const actionsDrawer = $('actions-drawer');
  const btnToggleActionsDrawer = $('btn-toggle-actions-drawer');

"""
# Insert after `const btnLeave = $('btn-leave-room');`
content = content.replace("  const btnLeave = $('btn-leave-room');\n", "  const btnLeave = $('btn-leave-room');\n" + variables_snippet)

# Add event listeners near btnLeave.addEventListener
listeners_snippet = """  btnSettingsToggle?.addEventListener('click', () => {
    settingsDropdown?.classList.toggle('hidden');
  });

  btnLeaveRoomDropdown?.addEventListener('click', () => {
    socket.emit('leave_room', { roomCode: state.roomCode });
    resetToJoin();
    settingsDropdown?.classList.add('hidden');
  });

  btnToggleActionsDrawer?.addEventListener('click', () => {
    actionsDrawer?.classList.toggle('closed');
  });

"""
content = content.replace("  btnLeave.addEventListener('click', () => {\n", listeners_snippet + "  btnLeave.addEventListener('click', () => {\n")

# Update updateControls to auto-toggle the drawer
update_controls_pattern = re.compile(r"  function updateControls\(\) \{.*?\n  \}", re.DOTALL)
def replace_update_controls(match):
    original = match.group(0)
    # Insert the auto-toggle logic right before the closing brace
    auto_toggle = "\n    // Auto-toggle actions drawer based on turn\n    if (actionsDrawer) {\n      if (state.isMyTurn) {\n        actionsDrawer.classList.remove('closed');\n      } else {\n        actionsDrawer.classList.add('closed');\n      }\n    }\n  }"
    return original[:-4] + auto_toggle

if update_controls_pattern.search(content):
    content = update_controls_pattern.sub(replace_update_controls, content)
else:
    print("Could not find updateControls in app.js")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated app.js")
