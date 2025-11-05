// ==========================
// 🦊 FoxyUI v16 with GUI Updater
// ==========================

// --- Auto-load cached latest version ---
(() => {
  const cached = localStorage.getItem("FoxyUI_latest");
  if (cached) {
    console.log("%c🐾 Loaded cached FoxyUI update~", "color:#7af;font-weight:700");
    eval(cached);
    return;
  }
})();

(() => {
  if (window.FoxyUI && window.FoxyUI._version >= 16) {
    console.warn("FoxyUI v16 already loaded~");
    return;
  }

  const _windows = {}, _toasts = [], _settings = {
    theme: "dark",
    colors: {
      windowBg: "#0f0f0f", text: "#baffda", header: "#222",
      tabActive: "#222", tabInactive: "#aaa",
      tabHover: "#333", toastInfo: "#6ec6ff", toastSuccess: "#7aff7a", toastError: "#ff7a7a",
      inputBg: "#1a1a1a", inputBorder: "#444", buttonBg: "#333",
      buttonHover: "#444", buttonText: "#fff", placeholder: "#888"
    },
    font: "monospace"
  };
  const _plugins = [], _events = {}, _keybinds = [], _mergeHistory = [];

  // ---------- STYLE ----------
  const style = document.createElement("style");
  style.textContent = `
    .foxy-window {position: fixed; top:80px; left:80px; width:520px; height:420px; background:${_settings.colors.windowBg};
      color:${_settings.colors.text}; font-family:${_settings.font}; border:1px solid #555; border-radius:10px; 
      box-shadow:0 0 25px rgba(0,0,0,0.6); display:flex; flex-direction:column; resize: both; overflow: hidden; 
      transition: transform .15s, background .2s, color .2s; z-index:999999;}
    .foxy-header {background:${_settings.colors.header}; padding:6px 12px; display:flex; align-items:center; gap:8px; cursor: grab; border-bottom: 1px solid #333; user-select: none;}
    .foxy-header:active {cursor: grabbing;}
    .foxy-title {flex: 1; font-weight:700; color:${_settings.colors.text}; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;}
    .foxy-controls span {cursor: pointer; font-weight: 700; padding: 0 6px; border-radius: 4px; transition: background 0.15s;}
    .foxy-controls span:hover {background: rgba(255,255,255,0.1);}
    .foxy-tabbar {display:flex; overflow-x:auto; overflow-y:hidden; background:#191919; border-bottom:1px solid #333; gap:4px; padding:4px 2px; scrollbar-width: thin; scrollbar-color: #444 #111;}
    .foxy-tabbar::-webkit-scrollbar {height:6px;}
    .foxy-tabbar::-webkit-scrollbar-thumb {background:#444; border-radius:3px;}
    .foxy-tabbar::-webkit-scrollbar-track {background:#111;}
    .foxy-tab {padding:6px 12px; cursor:pointer; color:${_settings.colors.tabInactive}; border-radius:6px; user-select:none; display:flex; align-items:center; gap:6px; transition: all 0.15s; white-space: nowrap;}
    .foxy-tab:hover {background:${_settings.colors.tabHover};}
    .foxy-tab.active {background:${_settings.colors.tabActive}; color:#fff; font-weight:600;}
    .foxy-tab img {width:16px; height:16px; object-fit: contain; vertical-align:middle;}
    .foxy-content {flex:1; background:${_settings.colors.windowBg}; padding:12px; overflow:auto; white-space: pre-wrap; color:${_settings.colors.text}; display:flex; flex-direction:column; gap:6px;}
    .foxy-footer {display:flex; gap:8px; padding:8px; background:${_settings.colors.header}; border-top:1px solid #333; flex-wrap: wrap;}
    .foxy-toast-wrap {position:fixed; right:18px; bottom:18px; display:flex; flex-direction:column; gap:8px; z-index:1000001;}
    .foxy-toast {background:rgba(30,30,30,.98); border:1px solid #444; border-radius:8px; padding:8px 12px; min-width:180px; display:flex; align-items:center; gap:8px; box-shadow:0 4px 14px rgba(0,0,0,.4); font-size:13px; transition: all 0.2s;}
    .foxy-toast.info{color:${_settings.colors.toastInfo};border-left:4px solid ${_settings.colors.toastInfo};}
    .foxy-toast.success{color:${_settings.colors.toastSuccess};border-left:4px solid ${_settings.colors.toastSuccess};}
    .foxy-toast.error{color:${_settings.colors.toastError};border-left:4px solid ${_settings.colors.toastError};}
    .foxy-toast .close-x {margin-left:auto; cursor:pointer; color:#ccc; padding-left:8px;}
    .foxy-window input, .foxy-window textarea, .foxy-window select {background:${_settings.colors.inputBg}; color:${_settings.colors.text}; border:1px solid ${_settings.colors.inputBorder}; border-radius:5px; padding:6px 8px; outline:none; font-family:${_settings.font}; width:100%; box-sizing:border-box; transition: border 0.2s, background 0.2s;}
    .foxy-window input:focus, .foxy-window textarea:focus, .foxy-window select:focus {border-color:#7aff7a;}
    .foxy-window input::placeholder, .foxy-window textarea::placeholder {color:${_settings.colors.placeholder};}
    .foxy-window button {background:${_settings.colors.buttonBg}; color:${_settings.colors.buttonText}; border:1px solid #444; border-radius:6px; padding:6px 12px; cursor:pointer; transition: all 0.2s; font-family:${_settings.font};}
    .foxy-window button:hover {background:${_settings.colors.buttonHover};}
    @import url('https://cdn.jsdelivr.net/npm/remixicon/fonts/remixicon.css');
  `;
  document.head.appendChild(style);

  // ---------- TOAST ----------
  const toastWrap = document.createElement("div");
  toastWrap.className = "foxy-toast-wrap";
  document.body.appendChild(toastWrap);
  function showToast(msg, { type = "info", duration = 3000, persistent = false } = {}) {
    const el = document.createElement("div");
    el.className = "foxy-toast " + type;
    el.innerHTML = `<div>${msg}</div><div class="close-x">✖</div>`;
    toastWrap.prepend(el);
    el.querySelector(".close-x").onclick = () => el.remove();
    if (!persistent) setTimeout(() => el.remove(), duration);
  }

  // ---------- WINDOW CREATION ----------
  function createWindow(options = {}) {
    const { title = "Foxy Window", width = 520, height = 420 } = options;
    const el = document.createElement("div");
    el.className = "foxy-window";
    el.style.width = width + "px";
    el.style.height = height + "px";
    el.innerHTML = `
      <div class="foxy-header"><div class="foxy-title">${title}</div><div class="foxy-controls"><span class="close">✖</span></div></div>
      <div class="foxy-content"></div>
      <div class="foxy-footer"></div>
    `;
    document.body.appendChild(el);

    const winAPI = {
      el,
      content: el.querySelector(".foxy-content"),
      footer: el.querySelector(".foxy-footer"),
      setContent(html) { this.content.innerHTML = html; },
      addButton(label, fn) { const b = document.createElement("button"); b.textContent = label; b.onclick = fn; this.footer.appendChild(b); return b; }
    };
    el.querySelector(".close").onclick = () => el.remove();
    return winAPI;
  }

  // ---------- GUI UPDATER ----------
  function openUpdater(meta, current) {
    const win = createWindow({ title: "🦊 FoxyUI Updater" });
    win.setContent(`
      <h3>Current Version: <span style="color:#7aff7a;">v${current}</span></h3>
      <h3>Latest Version: <span style="color:#6ec6ff;">v${meta.version}</span></h3>
      <p><strong>Release Date:</strong> ${meta.releaseDate}</p>
      <h4>Changelog:</h4>
      <ul style="margin-left:16px; line-height:1.4;">${meta.changelog.map(c => `<li>${c}</li>`).join("")}</ul>
    `);
    win.addButton("Update Now", () => {
      showToast("Downloading update...", { type: "info", persistent: true });
      fetch(meta.updateURL)
        .then(r => r.text())
        .then(code => {
          localStorage.setItem("FoxyUI_latest", code);
          showToast("Installing update~", { type: "info" });
          setTimeout(() => { eval(code); showToast("FoxyUI updated successfully!", { type: "success" }); win.el.remove(); }, 1500);
        })
        .catch(() => showToast("Update failed", { type: "error" }));
    });
    win.addButton("Close", () => win.el.remove());
  }

  // ---------- AUTO UPDATER ----------
  function checkForUpdates(updaterUrl) {
    showToast("Checking for updates...", { type: "info" });
    fetch(updaterUrl)
      .then(r => r.text())
      .then(js => {
        try {
          eval(js);
          const meta = window.FoxyUI_UpdateMeta;
          if (!meta) throw new Error("No update metadata found");
          const current = window.FoxyUI._version;
          const latest = meta.version;
          if (latest > current) {
            showToast(`Update found! v${latest} available`, { type: "success", persistent: true });
            openUpdater(meta, current);
          } else {
            showToast("FoxyUI is up to date~", { type: "success" });
          }
        } catch (err) {
          console.error("Updater error:", err);
          showToast("Failed to check updates", { type: "error" });
        }
      })
      .catch(() => showToast("Could not fetch updater.js", { type: "error" }));
  }

  // ---------- EXPORT ----------
  window.FoxyUI = {
    _version: 16,
    _windows,
    _toasts,
    _settings,
    _plugins,
    _keybinds,
    showToast,
    createWindow,
    checkForUpdates
  };

  console.log("%c🐾 FoxyUI v16 loaded~ GUI updater ready", "color:#aef;font-weight:700");

  // ✅ Auto-check for updates
  checkForUpdates("https://raw.githubusercontent.com/<youruser>/<yourrepo>/main/updater.js");
})();
