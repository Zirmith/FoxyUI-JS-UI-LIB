/* FoxyUI v15 — Discord-flavored stateless UI library
 * Adds: server/channel sidebar, member list & presence, context menus,
 * modals, command palette, rich theming (dark/light/amoled + accent),
 * on top of v14's windows, tabs, toasts, plugins, keybinds, merging.
 */
(() => {
  if (window.FoxyUI && window.FoxyUI._version >= 15) {
    console.warn("FoxyUI v15 already loaded~");
    return;
  }

  // ---------- THEME PRESETS ----------
  const THEMES = {
    dark: {
      windowBg: "#313338", surface: "#2b2d31", surfaceAlt: "#1e1f22",
      text: "#dbdee1", textMuted: "#949ba4", header: "#232428",
      tabActive: "#404249", tabInactive: "#949ba4", tabHover: "#35373c",
      inputBg: "#1e1f22", inputBorder: "#1e1f22", buttonBg: "#4e5058",
      buttonHover: "#6d6f78", buttonText: "#fff", placeholder: "#87898c",
      accent: "#5865f2", accentHover: "#4752c4",
      toastInfo: "#5865f2", toastSuccess: "#23a559", toastError: "#f23f43",
      online: "#23a559", idle: "#f0b232", dnd: "#f23f43", offline: "#80848e",
      divider: "#1e1f22", mention: "#f23f43"
    },
    light: {
      windowBg: "#ffffff", surface: "#f2f3f5", surfaceAlt: "#e3e5e8",
      text: "#060607", textMuted: "#4e5058", header: "#f2f3f5",
      tabActive: "#e3e5e8", tabInactive: "#4e5058", tabHover: "#ebedef",
      inputBg: "#ebedef", inputBorder: "#cdd0d4", buttonBg: "#5865f2",
      buttonHover: "#4752c4", buttonText: "#fff", placeholder: "#6d6f78",
      accent: "#5865f2", accentHover: "#4752c4",
      toastInfo: "#5865f2", toastSuccess: "#23a559", toastError: "#f23f43",
      online: "#23a559", idle: "#f0b232", dnd: "#f23f43", offline: "#80848e",
      divider: "#e3e5e8", mention: "#f23f43"
    },
    amoled: {
      windowBg: "#000000", surface: "#0a0a0a", surfaceAlt: "#000000",
      text: "#e6e6e6", textMuted: "#808080", header: "#050505",
      tabActive: "#1a1a1a", tabInactive: "#808080", tabHover: "#101010",
      inputBg: "#0a0a0a", inputBorder: "#1a1a1a", buttonBg: "#1a1a1a",
      buttonHover: "#252525", buttonText: "#fff", placeholder: "#555",
      accent: "#5865f2", accentHover: "#4752c4",
      toastInfo: "#5865f2", toastSuccess: "#23a559", toastError: "#f23f43",
      online: "#23a559", idle: "#f0b232", dnd: "#f23f43", offline: "#80848e",
      divider: "#1a1a1a", mention: "#f23f43"
    },
    foxy: {
      windowBg: "#0f0f0f", surface: "#161616", surfaceAlt: "#0a0a0a",
      text: "#baffda", textMuted: "#7aa890", header: "#1c1c1c",
      tabActive: "#222", tabInactive: "#7aa890", tabHover: "#2a2a2a",
      inputBg: "#161616", inputBorder: "#2a2a2a", buttonBg: "#222",
      buttonHover: "#2e2e2e", buttonText: "#baffda", placeholder: "#5a7a6a",
      accent: "#7aff7a", accentHover: "#5dd95d",
      toastInfo: "#6ec6ff", toastSuccess: "#7aff7a", toastError: "#ff7a7a",
      online: "#7aff7a", idle: "#ffd97a", dnd: "#ff7a7a", offline: "#5a7a6a",
      divider: "#1a1a1a", mention: "#ff7a7a"
    }
  };

  const _windows = {}, _toasts = [];
  const _settings = {
    theme: "dark",
    colors: { ...THEMES.dark },
    font: "'gg sans', 'Segoe UI', system-ui, -apple-system, sans-serif",
    radius: "8px"
  };
  const _plugins = [];
  const _events = {};
  const _keybinds = [];
  const _mergeHistory = [];
  const _commands = [];
  const _members = []; // {id, name, avatar, status, activity}

  // ---------- STYLE ----------
  const styleEl = document.createElement("style");
  styleEl.id = "foxyui-style";
  document.head.appendChild(styleEl);

  function applyStyle() {
    const c = _settings.colors;
    styleEl.textContent = `
      :root {
        --foxy-bg:${c.windowBg}; --foxy-surface:${c.surface}; --foxy-surface-alt:${c.surfaceAlt};
        --foxy-text:${c.text}; --foxy-text-muted:${c.textMuted}; --foxy-header:${c.header};
        --foxy-accent:${c.accent}; --foxy-accent-hover:${c.accentHover};
        --foxy-divider:${c.divider}; --foxy-online:${c.online}; --foxy-idle:${c.idle};
        --foxy-dnd:${c.dnd}; --foxy-offline:${c.offline}; --foxy-mention:${c.mention};
        --foxy-radius:${_settings.radius};
      }
      .foxy-window {
        position: fixed; top: 80px; left: 80px; width: 720px; height: 480px;
        background: var(--foxy-bg); color: var(--foxy-text);
        font-family:${_settings.font};
        border:1px solid var(--foxy-divider); border-radius: var(--foxy-radius);
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        display:flex; flex-direction:column; resize: both; overflow: hidden;
        transition: transform .15s, background .2s, color .2s; z-index:999999;
      }
      .foxy-header {
        background: var(--foxy-header); padding:8px 14px; display:flex; align-items:center;
        gap:10px; cursor: grab; border-bottom: 1px solid var(--foxy-divider); user-select: none;
        min-height: 36px;
      }
      .foxy-header:active { cursor: grabbing; }
      .foxy-title { flex: 1; font-weight:600; color: var(--foxy-text); font-size: 14px;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .foxy-controls { display:flex; gap:2px; }
      .foxy-controls span { cursor: pointer; font-weight: 600; padding: 4px 8px;
        border-radius: 4px; transition: background 0.15s; color: var(--foxy-text-muted);
        font-size: 14px; line-height: 1; }
      .foxy-controls span:hover { background: rgba(255,255,255,0.08); color: var(--foxy-text); }
      .foxy-controls .close:hover { background: var(--foxy-dnd); color:#fff; }

      .foxy-body { flex:1; display:flex; min-height:0; }

      /* Discord-like server rail */
      .foxy-server-rail {
        width: 56px; background: var(--foxy-surface-alt); display:flex; flex-direction:column;
        align-items:center; padding: 10px 0; gap: 6px; overflow-y:auto;
        border-right: 1px solid var(--foxy-divider);
      }
      .foxy-server-rail::-webkit-scrollbar { display:none; }
      .foxy-server-icon {
        width:42px; height:42px; border-radius: 50%; background: var(--foxy-surface);
        display:flex; align-items:center; justify-content:center; cursor:pointer;
        color: var(--foxy-text); font-weight:600; font-size:16px; position:relative;
        transition: border-radius .2s, background .2s; overflow:hidden;
      }
      .foxy-server-icon img { width:100%; height:100%; object-fit:cover; }
      .foxy-server-icon:hover, .foxy-server-icon.active {
        border-radius: 16px; background: var(--foxy-accent); color:#fff;
      }
      .foxy-server-icon.active::before {
        content:''; position:absolute; left:-14px; top:50%; transform: translateY(-50%);
        width:4px; height:24px; background: var(--foxy-text); border-radius: 0 4px 4px 0;
      }
      .foxy-server-divider { width:32px; height:2px; background: var(--foxy-divider); border-radius:1px; margin: 2px 0; }

      /* Channel list */
      .foxy-channel-list {
        width: 200px; background: var(--foxy-surface); display:flex; flex-direction:column;
        border-right: 1px solid var(--foxy-divider); overflow:hidden;
      }
      .foxy-channel-header {
        padding: 12px 14px; font-weight:700; font-size:14px; color: var(--foxy-text);
        border-bottom: 1px solid var(--foxy-divider); box-shadow: 0 1px 0 rgba(0,0,0,0.2);
      }
      .foxy-channel-items { flex:1; overflow-y:auto; padding: 8px 6px; }
      .foxy-channel-cat { color: var(--foxy-text-muted); font-size:11px; text-transform:uppercase;
        font-weight:700; padding: 12px 6px 4px; letter-spacing:.5px; }
      .foxy-channel-item {
        display:flex; align-items:center; gap:6px; padding: 6px 8px; border-radius:4px;
        color: var(--foxy-text-muted); cursor:pointer; font-size:14px; margin: 1px 0;
      }
      .foxy-channel-item:hover { background: var(--foxy-tabHover, rgba(255,255,255,0.04)); color: var(--foxy-text); }
      .foxy-channel-item.active { background: rgba(255,255,255,0.08); color: var(--foxy-text); }
      .foxy-channel-item .hash { color: var(--foxy-text-muted); font-weight:600; }

      /* Main column */
      .foxy-main { flex:1; display:flex; flex-direction:column; min-width:0; background: var(--foxy-bg); }
      .foxy-tabbar {
        display:flex; overflow-x:auto; overflow-y:hidden; background: var(--foxy-surface);
        border-bottom:1px solid var(--foxy-divider); gap:4px; padding:6px 8px;
        scrollbar-width: thin;
      }
      .foxy-tabbar::-webkit-scrollbar { height:4px; }
      .foxy-tabbar::-webkit-scrollbar-thumb { background:var(--foxy-divider); border-radius:2px; }
      .foxy-tab {
        padding:6px 12px; cursor:pointer; color: var(--foxy-text-muted);
        border-radius:4px; user-select:none; display:flex; align-items:center; gap:6px;
        transition: all 0.12s; white-space: nowrap; font-size:13px;
      }
      .foxy-tab:hover { background: rgba(255,255,255,0.04); color: var(--foxy-text); }
      .foxy-tab.active { background: var(--foxy-accent); color:#fff; font-weight:500; }
      .foxy-tab img { width:14px; height:14px; object-fit:contain; }

      .foxy-content {
        flex:1; padding:14px; overflow:auto; color: var(--foxy-text);
        display:flex; flex-direction:column; gap:8px; font-size:14px; line-height:1.5;
      }
      .foxy-content::-webkit-scrollbar { width:8px; }
      .foxy-content::-webkit-scrollbar-thumb { background: var(--foxy-divider); border-radius:4px; }

      .foxy-footer {
        display:flex; gap:8px; padding:10px; background: var(--foxy-surface);
        border-top:1px solid var(--foxy-divider); flex-wrap: wrap;
      }

      /* Member list */
      .foxy-member-list {
        width: 220px; background: var(--foxy-surface); border-left: 1px solid var(--foxy-divider);
        padding: 12px 0; overflow-y:auto;
      }
      .foxy-member-cat { padding: 10px 14px 4px; font-size:11px; text-transform:uppercase;
        color: var(--foxy-text-muted); font-weight:700; letter-spacing:.5px; }
      .foxy-member {
        display:flex; align-items:center; gap:10px; padding: 4px 10px; cursor:pointer;
        border-radius:4px; margin: 0 6px;
      }
      .foxy-member:hover { background: rgba(255,255,255,0.04); }
      .foxy-avatar {
        width:32px; height:32px; border-radius:50%; background: var(--foxy-accent);
        display:flex; align-items:center; justify-content:center; color:#fff; font-weight:600;
        font-size:13px; position:relative; flex-shrink:0; overflow:hidden;
      }
      .foxy-avatar img { width:100%; height:100%; object-fit:cover; }
      .foxy-avatar .status-dot {
        position:absolute; bottom:-2px; right:-2px; width:12px; height:12px;
        border-radius:50%; border: 2px solid var(--foxy-surface);
      }
      .status-dot.online { background: var(--foxy-online); }
      .status-dot.idle { background: var(--foxy-idle); }
      .status-dot.dnd { background: var(--foxy-dnd); }
      .status-dot.offline { background: var(--foxy-offline); }
      .foxy-member-info { display:flex; flex-direction:column; min-width:0; }
      .foxy-member-name { color: var(--foxy-text); font-size:14px; font-weight:500;
        white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .foxy-member-activity { color: var(--foxy-text-muted); font-size:12px;
        white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

      /* Toast */
      .foxy-toast-wrap {
        position:fixed; right:18px; bottom:18px; display:flex; flex-direction:column;
        gap:8px; z-index:1000001;
      }
      .foxy-toast {
        background: var(--foxy-surface); border:1px solid var(--foxy-divider);
        border-radius: var(--foxy-radius); padding:10px 14px; min-width:220px;
        display:flex; align-items:center; gap:10px;
        box-shadow:0 6px 20px rgba(0,0,0,.45); font-size:13px;
        animation: foxy-slide-in .25s ease;
      }
      @keyframes foxy-slide-in { from { transform: translateX(20px); opacity:0; } to { transform:none; opacity:1; } }
      .foxy-toast.info { color: var(--foxy-text); border-left:4px solid ${THEMES.dark.toastInfo}; }
      .foxy-toast.success { color: var(--foxy-text); border-left:4px solid ${THEMES.dark.toastSuccess}; }
      .foxy-toast.error { color: var(--foxy-text); border-left:4px solid ${THEMES.dark.toastError}; }
      .foxy-toast .close-x { margin-left:auto; cursor:pointer; color:var(--foxy-text-muted); padding-left:8px; }
      .foxy-toast .close-x:hover { color: var(--foxy-text); }

      /* Form controls */
      .foxy-window input, .foxy-window textarea, .foxy-window select {
        background: var(--foxy-surface-alt, ${_settings.colors.inputBg}); color: var(--foxy-text);
        border:1px solid ${_settings.colors.inputBorder}; border-radius: 4px;
        padding:8px 10px; outline:none; font-family: inherit; width:100%;
        box-sizing:border-box; transition: border 0.2s; font-size:14px;
      }
      .foxy-window input:focus, .foxy-window textarea:focus, .foxy-window select:focus {
        border-color: var(--foxy-accent);
      }
      .foxy-window input::placeholder, .foxy-window textarea::placeholder { color: ${_settings.colors.placeholder}; }

      .foxy-window button {
        background: var(--foxy-accent); color:#fff; border:none; border-radius: 4px;
        padding:8px 16px; cursor:pointer; transition: background 0.15s; font-family:inherit;
        font-size:14px; font-weight:500;
      }
      .foxy-window button:hover { background: var(--foxy-accent-hover); }
      .foxy-window button.secondary { background: ${_settings.colors.buttonBg}; }
      .foxy-window button.secondary:hover { background: ${_settings.colors.buttonHover}; }
      .foxy-window button.danger { background: var(--foxy-dnd); }

      /* Context menu */
      .foxy-context-menu {
        position: fixed; background: var(--foxy-surface-alt); border:1px solid var(--foxy-divider);
        border-radius: var(--foxy-radius); padding: 6px; min-width: 180px;
        box-shadow: 0 8px 24px rgba(0,0,0,.5); z-index: 1000002;
        font-family: ${_settings.font}; font-size: 14px; color: var(--foxy-text);
        animation: foxy-pop .12s ease;
      }
      @keyframes foxy-pop { from { transform: scale(.96); opacity:0; } to { transform:none; opacity:1; } }
      .foxy-context-item {
        padding: 6px 10px; border-radius: 4px; cursor: pointer;
        display:flex; align-items:center; gap:10px;
      }
      .foxy-context-item:hover { background: var(--foxy-accent); color:#fff; }
      .foxy-context-item.danger { color: var(--foxy-dnd); }
      .foxy-context-item.danger:hover { background: var(--foxy-dnd); color:#fff; }
      .foxy-context-sep { height:1px; background: var(--foxy-divider); margin: 4px 0; }

      /* Modal */
      .foxy-modal-backdrop {
        position: fixed; inset:0; background: rgba(0,0,0,.6); z-index: 1000003;
        display:flex; align-items:center; justify-content:center;
        animation: foxy-fade .15s ease;
      }
      @keyframes foxy-fade { from { opacity:0; } to { opacity:1; } }
      .foxy-modal {
        background: var(--foxy-bg); color: var(--foxy-text); border-radius: var(--foxy-radius);
        min-width: 380px; max-width: 90vw; max-height: 80vh;
        font-family: ${_settings.font}; overflow:hidden; display:flex; flex-direction:column;
        box-shadow: 0 12px 40px rgba(0,0,0,.6);
        animation: foxy-pop .18s ease;
      }
      .foxy-modal-header {
        padding: 16px 20px; font-weight:700; font-size:16px;
        border-bottom: 1px solid var(--foxy-divider);
      }
      .foxy-modal-body { padding: 16px 20px; overflow-y:auto; }
      .foxy-modal-footer {
        padding: 12px 20px; background: var(--foxy-surface);
        display:flex; justify-content:flex-end; gap:8px;
      }
      .foxy-modal-footer button {
        background: var(--foxy-accent); color:#fff; border:none; border-radius:4px;
        padding: 8px 16px; cursor:pointer; font-family:inherit; font-weight:500;
      }
      .foxy-modal-footer button.secondary { background: transparent; color: var(--foxy-text); }
      .foxy-modal-footer button.danger { background: var(--foxy-dnd); }

      /* Command palette */
      .foxy-cmdk-backdrop {
        position: fixed; inset:0; background: rgba(0,0,0,.5); z-index: 1000004;
        display:flex; align-items:flex-start; justify-content:center; padding-top: 15vh;
        animation: foxy-fade .12s ease;
      }
      .foxy-cmdk {
        width: 560px; max-width: 90vw; background: var(--foxy-bg);
        border-radius: var(--foxy-radius); border:1px solid var(--foxy-divider);
        font-family:${_settings.font}; color: var(--foxy-text); overflow:hidden;
        box-shadow: 0 24px 60px rgba(0,0,0,.6);
        animation: foxy-pop .15s ease;
      }
      .foxy-cmdk input {
        width:100%; background: transparent; border:none; outline:none;
        padding: 16px 20px; font-size: 16px; color: var(--foxy-text);
        font-family:inherit; border-bottom: 1px solid var(--foxy-divider);
        box-sizing:border-box;
      }
      .foxy-cmdk-list { max-height: 50vh; overflow-y:auto; padding: 8px; }
      .foxy-cmdk-item {
        padding: 10px 12px; border-radius: 4px; cursor:pointer;
        display:flex; align-items:center; gap:10px; font-size:14px;
      }
      .foxy-cmdk-item.active, .foxy-cmdk-item:hover {
        background: var(--foxy-accent); color:#fff;
      }
      .foxy-cmdk-item .hint { margin-left:auto; font-size:12px; opacity:.7; }
      .foxy-cmdk-empty { padding: 24px; text-align:center; color: var(--foxy-text-muted); font-size:14px; }
    `;
  }
  applyStyle();

  // ---------- EVENTS ----------
  function emit(eventName, ...args) { (_events[eventName]||[]).forEach(fn=>{ try{fn(...args);}catch(e){console.error(e);} }); }
  function on(eventName, fn) { if(!_events[eventName]) _events[eventName]=[]; _events[eventName].push(fn); }
  function off(eventName, fn) { if(!_events[eventName]) return; _events[eventName] = _events[eventName].filter(f=>f!==fn); }

  // ---------- TOAST ----------
  const toastWrap = document.createElement("div");
  toastWrap.className = "foxy-toast-wrap";
  document.body.appendChild(toastWrap);

  function showToast(msg, { type = "info", duration = 3000, persistent = false, icon = null } = {}) {
    const el = document.createElement("div");
    el.className = "foxy-toast " + type;
    el.innerHTML = `${icon?`<span>${icon}</span>`:''}<div style="flex:1">${msg}</div><div class="close-x">✖</div>`;
    toastWrap.prepend(el);
    el.querySelector(".close-x").onclick = () => el.remove();
    if (!persistent) setTimeout(() => { el.style.opacity = "0"; el.style.transform = "translateX(20px)"; setTimeout(()=>el.remove(), 200); }, duration);
    return el;
  }

  // ---------- KEYBINDS ----------
  function addKeybind(keyCombo, callback, description = "") {
    _keybinds.push({ keyCombo: keyCombo.toLowerCase(), callback, description });
  }
  document.addEventListener("keydown", e => {
    const combo = `${e.ctrlKey || e.metaKey ? "ctrl+" : ""}${e.shiftKey ? "shift+" : ""}${e.altKey ? "alt+" : ""}${e.key.toLowerCase()}`;
    _keybinds.forEach(kb => { if (kb.keyCombo === combo) { kb.callback(e); e.preventDefault(); } });
  });

  // ---------- CONTEXT MENU ----------
  let _activeContextMenu = null;
  function closeContextMenu() { _activeContextMenu?.remove(); _activeContextMenu = null; }
  document.addEventListener("click", closeContextMenu);
  document.addEventListener("contextmenu", e => { if (!e.target.closest(".foxy-context-menu")) closeContextMenu(); });

  /**
   * showContextMenu(x, y, items)
   * items: [{label, icon?, onClick?, danger?, divider?}, ...]
   */
  function showContextMenu(x, y, items) {
    closeContextMenu();
    const menu = document.createElement("div");
    menu.className = "foxy-context-menu";
    items.forEach(it => {
      if (it.divider) { const s = document.createElement("div"); s.className = "foxy-context-sep"; menu.appendChild(s); return; }
      const item = document.createElement("div");
      item.className = "foxy-context-item" + (it.danger ? " danger" : "");
      item.innerHTML = `${it.icon ? `<span>${it.icon}</span>` : ''}<span>${it.label}</span>`;
      item.onclick = (ev) => { ev.stopPropagation(); closeContextMenu(); it.onClick?.(); };
      menu.appendChild(item);
    });
    menu.style.left = x + "px"; menu.style.top = y + "px";
    document.body.appendChild(menu);
    // Clamp to viewport
    const r = menu.getBoundingClientRect();
    if (r.right > innerWidth) menu.style.left = (innerWidth - r.width - 8) + "px";
    if (r.bottom > innerHeight) menu.style.top = (innerHeight - r.height - 8) + "px";
    _activeContextMenu = menu;
    return menu;
  }

  // ---------- MODAL ----------
  /**
   * showModal({title, body, buttons:[{label, variant?, onClick?}], closable?})
   * body can be string (HTML) or HTMLElement
   */
  function showModal({ title = "Modal", body = "", buttons = [{ label: "OK", variant: "primary" }], closable = true } = {}) {
    const backdrop = document.createElement("div");
    backdrop.className = "foxy-modal-backdrop";
    const modal = document.createElement("div");
    modal.className = "foxy-modal";
    const bodyEl = document.createElement("div");
    bodyEl.className = "foxy-modal-body";
    if (typeof body === "string") bodyEl.innerHTML = body; else bodyEl.appendChild(body);

    const footer = document.createElement("div");
    footer.className = "foxy-modal-footer";
    const api = {
      el: modal, close() { backdrop.style.opacity = "0"; setTimeout(() => backdrop.remove(), 150); }
    };
    buttons.forEach(b => {
      const btn = document.createElement("button");
      btn.textContent = b.label;
      if (b.variant === "secondary") btn.className = "secondary";
      if (b.variant === "danger") btn.className = "danger";
      btn.onclick = () => { const r = b.onClick?.(api); if (r !== false) api.close(); };
      footer.appendChild(btn);
    });

    modal.innerHTML = `<div class="foxy-modal-header">${title}</div>`;
    modal.appendChild(bodyEl);
    modal.appendChild(footer);
    backdrop.appendChild(modal);
    if (closable) backdrop.addEventListener("click", e => { if (e.target === backdrop) api.close(); });
    document.body.appendChild(backdrop);
    return api;
  }

  function confirmModal(message, { title = "Confirm", confirmLabel = "Confirm", danger = false } = {}) {
    return new Promise(resolve => {
      showModal({
        title, body: `<div>${message}</div>`,
        buttons: [
          { label: "Cancel", variant: "secondary", onClick: () => resolve(false) },
          { label: confirmLabel, variant: danger ? "danger" : "primary", onClick: () => resolve(true) }
        ]
      });
    });
  }

  // ---------- COMMAND PALETTE ----------
  function registerCommand({ id, label, hint = "", icon = "⚡", onRun }) {
    _commands.push({ id, label, hint, icon, onRun });
  }
  function openCommandPalette() {
    const backdrop = document.createElement("div");
    backdrop.className = "foxy-cmdk-backdrop";
    const box = document.createElement("div");
    box.className = "foxy-cmdk";
    box.innerHTML = `<input placeholder="Type a command…" /><div class="foxy-cmdk-list"></div>`;
    backdrop.appendChild(box);
    document.body.appendChild(backdrop);
    const input = box.querySelector("input");
    const list = box.querySelector(".foxy-cmdk-list");
    let activeIdx = 0, filtered = [];

    function close() { backdrop.remove(); }
    backdrop.addEventListener("click", e => { if (e.target === backdrop) close(); });

    function render() {
      const q = input.value.toLowerCase().trim();
      filtered = _commands.filter(c => !q || c.label.toLowerCase().includes(q) || c.hint.toLowerCase().includes(q));
      if (filtered.length === 0) { list.innerHTML = `<div class="foxy-cmdk-empty">No commands</div>`; return; }
      if (activeIdx >= filtered.length) activeIdx = 0;
      list.innerHTML = filtered.map((c, i) => `
        <div class="foxy-cmdk-item ${i === activeIdx ? 'active' : ''}" data-i="${i}">
          <span>${c.icon}</span><span>${c.label}</span>
          ${c.hint ? `<span class="hint">${c.hint}</span>` : ''}
        </div>`).join("");
      list.querySelectorAll(".foxy-cmdk-item").forEach(el => {
        el.onclick = () => { close(); filtered[+el.dataset.i].onRun?.(); };
        el.onmouseenter = () => { activeIdx = +el.dataset.i; render(); };
      });
    }
    input.addEventListener("input", render);
    input.addEventListener("keydown", e => {
      if (e.key === "ArrowDown") { activeIdx = Math.min(filtered.length - 1, activeIdx + 1); render(); e.preventDefault(); }
      else if (e.key === "ArrowUp") { activeIdx = Math.max(0, activeIdx - 1); render(); e.preventDefault(); }
      else if (e.key === "Enter") { const cmd = filtered[activeIdx]; if (cmd) { close(); cmd.onRun?.(); } }
      else if (e.key === "Escape") close();
    });
    setTimeout(() => input.focus(), 0);
    render();
  }
  addKeybind("ctrl+k", openCommandPalette, "Open command palette");

  // ---------- THEMING ----------
  function setTheme(name) {
    if (!THEMES[name]) { showToast(`Theme "${name}" not found`, { type: "error" }); return; }
    _settings.theme = name;
    _settings.colors = { ...THEMES[name] };
    applyStyle();
    emit("themeChanged", name);
  }
  function setAccent(hex) {
    _settings.colors.accent = hex;
    _settings.colors.accentHover = shade(hex, -15);
    applyStyle();
    emit("accentChanged", hex);
  }
  function registerTheme(name, theme) { THEMES[name] = { ...THEMES.dark, ...theme }; }
  function getThemes() { return Object.keys(THEMES); }
  function shade(hex, percent) {
    const n = parseInt(hex.replace("#", ""), 16);
    const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + Math.round(255 * percent / 100)));
    const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + Math.round(255 * percent / 100)));
    const b = Math.max(0, Math.min(255, (n & 255) + Math.round(255 * percent / 100)));
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // ---------- MEMBERS / PRESENCE ----------
  function addMember({ id, name, avatar = null, status = "offline", activity = "" }) {
    const m = { id: id || "m_" + Date.now() + Math.random().toString(36).slice(2, 6), name, avatar, status, activity };
    _members.push(m);
    emit("memberAdded", m);
    return m;
  }
  function removeMember(id) {
    const i = _members.findIndex(m => m.id === id);
    if (i > -1) { const [m] = _members.splice(i, 1); emit("memberRemoved", m); }
  }
  function setMemberStatus(id, status, activity) {
    const m = _members.find(m => m.id === id); if (!m) return;
    m.status = status; if (activity !== undefined) m.activity = activity;
    emit("memberUpdated", m);
  }
  function getMembers() { return [..._members]; }

  // ---------- WINDOW MERGING ----------
  const mergeThreshold = 60;
  function distance(el1, el2) {
    const r1 = el1.getBoundingClientRect(), r2 = el2.getBoundingClientRect();
    return Math.hypot(r1.left - r2.left, r1.top - r2.top);
  }
  function tryMerge(win) {
    for (const otherId in _windows) {
      const other = _windows[otherId];
      if (other === win) continue;
      if (distance(win.el, other.el) < mergeThreshold) {
        const oldTabs = [...win.tabs];
        oldTabs.forEach(tab => other.addTab({ name: tab.name, html: tab.html, icon: tab.icon }));
        _mergeHistory.push({ from: win, to: other, tabs: oldTabs });
        win.el.remove(); delete _windows[win.id];
        showToast(`Windows combined into "${other.title}"`, { type: "info" });
        return other;
      }
    }
    return win;
  }
  function undoMerge() {
    if (_mergeHistory.length === 0) { showToast("No merge to undo", { type: "error" }); return; }
    const last = _mergeHistory.pop();
    const newWin = createWindow({ title: last.from.title });
    last.tabs.forEach(t => newWin.addTab({ name: t.name, html: t.html, icon: t.icon }));
    showToast(`Merge undone for "${newWin.title}"`, { type: "success" });
  }
  addKeybind("ctrl+z", undoMerge, "Undo window merge");

  // ---------- WINDOW CREATION ----------
  /**
   * createWindow({
   *   title, width, height, icon,
   *   servers:[{id, name, icon?, onClick?}],
   *   channels:[{id, name, category?, onClick?}],
   *   members: boolean — whether to show member list,
   *   memberList: optional explicit member array (else uses global _members)
   * })
   */
  function createWindow(options = {}) {
    const {
      title = "Foxy Window", width = 720, height = 480, icon = null,
      resizable = true, movable = true, minimizable = true, defaultTab = 0,
      servers = null, channels = null, members = false, memberList = null,
      onClose, onOpen
    } = options;

    const el = document.createElement("div");
    el.className = "foxy-window";
    el.style.width = width + "px"; el.style.height = height + "px";
    el.style.left = (80 + Object.keys(_windows).length * 30) + "px";
    el.style.top = (80 + Object.keys(_windows).length * 30) + "px";

    el.innerHTML = `
      <div class="foxy-header">
        ${icon ? `<img src="${icon}" style="width:18px;height:18px;border-radius:4px">` : ''}
        <div class="foxy-title">${title}</div>
        <div class="foxy-controls">
          ${minimizable ? '<span class="minimize" title="Minimize">—</span>' : ''}
          <span class="close" title="Close">✕</span>
        </div>
      </div>
      <div class="foxy-body">
        ${servers ? '<div class="foxy-server-rail"></div>' : ''}
        ${channels ? '<div class="foxy-channel-list"><div class="foxy-channel-header"></div><div class="foxy-channel-items"></div></div>' : ''}
        <div class="foxy-main">
          <div class="foxy-tabbar"></div>
          <div class="foxy-content"></div>
          <div class="foxy-footer"></div>
        </div>
        ${members ? '<div class="foxy-member-list"></div>' : ''}
      </div>
    `;
    document.body.appendChild(el);
    const id = "win_" + Date.now() + Math.random().toString(36).slice(2, 6);
    const tabs = [];

    const winAPI = {
      id, el, tabs, title,
      tabbar: el.querySelector(".foxy-tabbar"),
      content: el.querySelector(".foxy-content"),
      footer: el.querySelector(".foxy-footer"),
      serverRail: el.querySelector(".foxy-server-rail"),
      channelList: el.querySelector(".foxy-channel-list"),
      memberListEl: el.querySelector(".foxy-member-list"),

      setTitle(t) { this.title = t; el.querySelector(".foxy-title").textContent = t; },
      setContent(html) { if (typeof html === "string") this.content.innerHTML = html; else { this.content.innerHTML = ""; this.content.appendChild(html); } },
      addButton(label, fn, variant = "primary") {
        const b = document.createElement("button");
        b.textContent = label;
        if (variant !== "primary") b.className = variant;
        b.onclick = fn; this.footer.appendChild(b); return b;
      },
      addTab({ name, html, icon = null }) {
        const tab = document.createElement("div"); tab.className = "foxy-tab";
        if (icon) { const img = document.createElement("img"); img.src = icon; tab.appendChild(img); }
        const span = document.createElement("span"); span.textContent = name; tab.appendChild(span);
        this.tabbar.appendChild(tab);
        const tabObj = { el: tab, name, html, icon };
        tabs.push(tabObj);
        tab.onclick = () => {
          this.tabbar.querySelectorAll(".foxy-tab").forEach(t => t.classList.remove("active"));
          tab.classList.add("active");
          this.setContent(html);
          emit("tabClicked", winAPI, tabObj);
        };
        tab.addEventListener("contextmenu", e => {
          e.preventDefault();
          showContextMenu(e.clientX, e.clientY, [
            { label: "Activate", icon: "✓", onClick: () => tab.click() },
            { divider: true },
            { label: "Close tab", icon: "✕", danger: true, onClick: () => winAPI.removeTab(tabObj) }
          ]);
        });
        if (tabs.length - 1 === defaultTab) tab.click();
        _plugins.forEach(p => p.onTabAdd?.(winAPI, tabObj));
        return tabObj;
      },
      removeTab(tabObj) {
        const idx = tabs.indexOf(tabObj); if (idx === -1) return;
        tabObj.el.remove(); tabs.splice(idx, 1);
        if (tabs.length > 0) tabs[Math.max(0, idx - 1)].el.click();
        emit("tabRemoved", winAPI, tabObj);
      },
      editTab(tabObj, { name, html, icon }) {
        if (name) { tabObj.name = name; tabObj.el.querySelector("span").textContent = name; }
        if (html) { tabObj.html = html; if (tabObj.el.classList.contains("active")) this.setContent(html); }
        if (icon && tabObj.el.querySelector("img")) tabObj.el.querySelector("img").src = icon;
        emit("tabEdited", winAPI, tabObj);
      },
      setServers(list) {
        if (!this.serverRail) return;
        this.serverRail.innerHTML = "";
        list.forEach((s, i) => {
          if (s.divider) { const d = document.createElement("div"); d.className = "foxy-server-divider"; this.serverRail.appendChild(d); return; }
          const ic = document.createElement("div"); ic.className = "foxy-server-icon" + (s.active ? " active" : "");
          ic.title = s.name || "";
          if (s.icon) ic.innerHTML = `<img src="${s.icon}" alt="${s.name||''}">`;
          else ic.textContent = (s.name || "?").slice(0, 2).toUpperCase();
          ic.onclick = () => {
            this.serverRail.querySelectorAll(".foxy-server-icon").forEach(e => e.classList.remove("active"));
            ic.classList.add("active");
            s.onClick?.(s);
            emit("serverClicked", winAPI, s);
          };
          ic.addEventListener("contextmenu", e => {
            e.preventDefault();
            showContextMenu(e.clientX, e.clientY, [
              { label: s.name || "Server", icon: "🛡️" },
              { divider: true },
              { label: "Mute", icon: "🔕", onClick: () => showToast(`Muted ${s.name}`) },
              { label: "Leave", icon: "✕", danger: true, onClick: () => showToast(`Left ${s.name}`, { type: "error" }) }
            ]);
          });
          this.serverRail.appendChild(ic);
        });
      },
      setChannels(list, { title: headerTitle = "Channels" } = {}) {
        if (!this.channelList) return;
        this.channelList.querySelector(".foxy-channel-header").textContent = headerTitle;
        const items = this.channelList.querySelector(".foxy-channel-items");
        items.innerHTML = "";
        let lastCat = null;
        list.forEach(c => {
          if (c.category && c.category !== lastCat) {
            lastCat = c.category;
            const ch = document.createElement("div"); ch.className = "foxy-channel-cat";
            ch.textContent = c.category; items.appendChild(ch);
          }
          const it = document.createElement("div");
          it.className = "foxy-channel-item" + (c.active ? " active" : "");
          it.innerHTML = `<span class="hash">${c.icon || "#"}</span><span>${c.name}</span>`;
          it.onclick = () => {
            items.querySelectorAll(".foxy-channel-item").forEach(e => e.classList.remove("active"));
            it.classList.add("active");
            c.onClick?.(c);
            emit("channelClicked", winAPI, c);
          };
          it.addEventListener("contextmenu", e => {
            e.preventDefault();
            showContextMenu(e.clientX, e.clientY, [
              { label: "Mark as read", icon: "✓", onClick: () => showToast(`Marked #${c.name} read`, { type: "success" }) },
              { label: "Copy link", icon: "🔗", onClick: () => showToast("Link copied") },
              { divider: true },
              { label: "Delete channel", icon: "🗑", danger: true, onClick: async () => { if (await confirmModal(`Delete #${c.name}?`, { danger: true, confirmLabel: "Delete" })) showToast(`Deleted #${c.name}`, { type: "error" }); } }
            ]);
          });
          items.appendChild(it);
        });
      },
      setMembers(list) {
        if (!this.memberListEl) return;
        const arr = list || memberList || _members;
        const groups = { online: [], idle: [], dnd: [], offline: [] };
        arr.forEach(m => { (groups[m.status] || groups.offline).push(m); });
        const order = [["online", "Online"], ["idle", "Idle"], ["dnd", "Do Not Disturb"], ["offline", "Offline"]];
        this.memberListEl.innerHTML = "";
        order.forEach(([k, label]) => {
          if (!groups[k].length) return;
          const cat = document.createElement("div"); cat.className = "foxy-member-cat";
          cat.textContent = `${label} — ${groups[k].length}`;
          this.memberListEl.appendChild(cat);
          groups[k].forEach(m => {
            const row = document.createElement("div"); row.className = "foxy-member";
            row.innerHTML = `
              <div class="foxy-avatar" style="background:${stringToColor(m.name)}">
                ${m.avatar ? `<img src="${m.avatar}" alt="">` : (m.name || "?").slice(0,1).toUpperCase()}
                <span class="status-dot ${m.status}"></span>
              </div>
              <div class="foxy-member-info">
                <div class="foxy-member-name">${m.name}</div>
                ${m.activity ? `<div class="foxy-member-activity">${m.activity}</div>` : ''}
              </div>`;
            row.addEventListener("contextmenu", e => {
              e.preventDefault();
              showContextMenu(e.clientX, e.clientY, [
                { label: m.name, icon: "👤" },
                { divider: true },
                { label: "Message", icon: "💬", onClick: () => showToast(`Messaging ${m.name}`) },
                { label: "Mention", icon: "@", onClick: () => showToast(`@${m.name} mentioned`) },
                { divider: true },
                { label: "Kick", icon: "👢", danger: true, onClick: () => showToast(`Kicked ${m.name}`, { type: "error" }) }
              ]);
            });
            this.memberListEl.appendChild(row);
          });
        });
      },
      close() {
        delete _windows[id]; el.remove();
        emit("windowClosed", winAPI); onClose?.();
      }
    };
    _windows[id] = winAPI;

    el.querySelector(".close").onclick = () => winAPI.close();
    if (minimizable) el.querySelector(".minimize").onclick = () => {
      const body = el.querySelector(".foxy-body");
      body.style.display = body.style.display === "none" ? "" : "none";
      el.style.height = body.style.display === "none" ? "auto" : height + "px";
      el.style.resize = body.style.display === "none" ? "none" : "both";
    };

    if (movable) {
      const header = el.querySelector(".foxy-header");
      let offsetX = 0, offsetY = 0, dragging = false;
      header.addEventListener("mousedown", e => {
        if (e.target.closest(".foxy-controls")) return;
        dragging = true; offsetX = e.clientX - el.offsetLeft; offsetY = e.clientY - el.offsetTop;
        el.style.zIndex = 999999 + Object.keys(_windows).length;
      });
      document.addEventListener("mouseup", () => { if (dragging) tryMerge(winAPI); dragging = false; });
      document.addEventListener("mousemove", e => { if (dragging) { el.style.left = (e.clientX - offsetX) + "px"; el.style.top = (e.clientY - offsetY) + "px"; } });
    }

    // Right-click on header → window context menu
    el.querySelector(".foxy-header").addEventListener("contextmenu", e => {
      e.preventDefault();
      showContextMenu(e.clientX, e.clientY, [
        { label: title, icon: "🪟" },
        { divider: true },
        { label: "Rename", icon: "✎", onClick: () => {
            const inp = document.createElement("input"); inp.value = winAPI.title;
            showModal({ title: "Rename window", body: inp, buttons: [
              { label: "Cancel", variant: "secondary" },
              { label: "Save", onClick: () => winAPI.setTitle(inp.value || winAPI.title) }
            ]});
          } },
        { label: "Duplicate", icon: "⎘", onClick: () => {
            const w = createWindow({ ...options, title: winAPI.title + " (copy)" });
            winAPI.tabs.forEach(t => w.addTab({ name: t.name, html: t.html, icon: t.icon }));
          } },
        { divider: true },
        { label: "Close", icon: "✕", danger: true, onClick: () => winAPI.close() }
      ]);
    });

    if (servers) winAPI.setServers(servers);
    if (channels) winAPI.setChannels(channels);
    if (members) winAPI.setMembers(memberList);

    _plugins.forEach(p => p.onWindowCreate?.(winAPI));
    emit("windowCreated", winAPI);
    onOpen?.();
    return winAPI;
  }

  function stringToColor(str = "") {
    let h = 0; for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
    const colors = ["#5865f2", "#eb459e", "#23a559", "#f0b232", "#f23f43", "#9b59b6", "#1abc9c", "#e67e22"];
    return colors[Math.abs(h) % colors.length];
  }

  // ---------- PLUGIN SYSTEM ----------
  function registerPlugin(name, initFn) {
    if (_plugins.some(p => p.name === name)) return console.warn(`Plugin ${name} already registered`);
    const pluginObj = { name, init: initFn };
    _plugins.push(pluginObj);
    try { initFn(window.FoxyUI); console.log(`Plugin ${name} loaded~`); }
    catch (e) { console.error(`Plugin ${name} failed`, e); }
  }
  async function loadPluginFromURL(url) {
    const res = await fetch(url); const code = await res.text();
    new Function("FoxyUI", code)(window.FoxyUI);
  }

  // ---------- DEFAULT COMMANDS ----------
  registerCommand({ id: "theme.dark", label: "Theme: Dark", icon: "🌙", onRun: () => setTheme("dark") });
  registerCommand({ id: "theme.light", label: "Theme: Light", icon: "☀️", onRun: () => setTheme("light") });
  registerCommand({ id: "theme.amoled", label: "Theme: AMOLED", icon: "⚫", onRun: () => setTheme("amoled") });
  registerCommand({ id: "theme.foxy", label: "Theme: Foxy (classic)", icon: "🦊", onRun: () => setTheme("foxy") });
  registerCommand({ id: "toast.demo", label: "Show demo toast", icon: "🔔", onRun: () => showToast("Hello from FoxyUI v15", { type: "success" }) });

  // ---------- EXPORT ----------
  window.FoxyUI = {
    _version: 15,
    _windows, _toasts, _settings, _plugins, _keybinds, _commands, _members, THEMES,
    // windows
    createWindow,
    // toast
    showToast,
    // keybinds
    addKeybind,
    // theming
    setTheme, setAccent, registerTheme, getThemes,
    // members
    addMember, removeMember, setMemberStatus, getMembers,
    // context menu + modal
    showContextMenu, closeContextMenu, showModal, confirmModal,
    // command palette
    registerCommand, openCommandPalette,
    // plugins
    registerPlugin, loadPluginFromURL,
    // events
    emit, on, off,
    // merging
    undoMerge
  };
  console.log("%c🦊 FoxyUI v15 loaded — Discord-flavored, stateless", "color:#5865f2;font-weight:700;font-size:13px");
})();
