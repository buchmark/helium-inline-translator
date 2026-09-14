const SHORTCUT_SETTINGS_URL = "chrome://extensions/shortcuts";
const UNBOUND_SHORTCUT_LABEL = "—";
const MAC_MODIFIER_SYMBOLS = {
  Command: "⌘",
  Ctrl: "⌃",
  MacCtrl: "⌃",
  Alt: "⌥",
  Option: "⌥",
  Shift: "⇧",
};
const LEADING_MAC_MODIFIERS = /^[⌃⌥⇧⌘]+/u;
const KEY_SEPARATOR = /\+(?!$)/;

function splitShortcutKeys(shortcut) {
  const macModifiers = shortcut.match(LEADING_MAC_MODIFIERS)?.[0];
  if (macModifiers) {
    return [...macModifiers, shortcut.slice(macModifiers.length)];
  }
  return shortcut.split(KEY_SEPARATOR);
}

function formatKeyLabel(key, os) {
  return os === "mac" ? (MAC_MODIFIER_SYMBOLS[key] ?? key) : key;
}

function getShortcutLabels(shortcut, os) {
  if (!shortcut) {
    return [UNBOUND_SHORTCUT_LABEL];
  }
  return splitShortcutKeys(shortcut).map((key) => formatKeyLabel(key, os));
}

function createKeyCap(label) {
  const keyCap = document.createElement("kbd");
  keyCap.className = "key-cap";
  keyCap.textContent = label;
  return keyCap;
}

function renderShortcut(keyCombo, shortcut, os) {
  keyCombo.classList.toggle("is-unbound", !shortcut);
  keyCombo.replaceChildren(
    ...getShortcutLabels(shortcut, os).map(createKeyCap),
  );
}

async function renderShortcuts() {
  const [commands, { os }] = await Promise.all([
    chrome.commands.getAll(),
    chrome.runtime.getPlatformInfo(),
  ]);

  for (const { name, shortcut } of commands) {
    const keyCombo = document.querySelector(`[data-command="${name}"]`);
    if (keyCombo) {
      renderShortcut(keyCombo, shortcut, os);
    }
  }
}

document.getElementById("shortcutSettings").addEventListener("click", () => {
  chrome.tabs.create({ url: SHORTCUT_SETTINGS_URL });
});

await renderShortcuts();
