(() => {

  // --- FIX: Hard reset previous FoxyUI to avoid redeclaration ---
  if (window.FoxyUI) {
    try {
      delete window.FoxyUI;
    } catch {
      window.FoxyUI = undefined;
    }
  }

  console.log("Reloading FoxyUI clean~");

  const _windows = {};
  const _toasts = [];
  const _modals = [];
  const _keybinds = [];
  const _plugins = [];

  const _settings = {
    theme: "discord-light",
    colors: {
      windowBg: "#f6f6f6",
      text: "#2c2f33",
      header: "#ffffff",
      tabActive: "#5865f2",
      tabInactive: "#72767d",
      tabHover: "#e3e5e8",
      toastInfo: "#5865f2",
      toastSuccess: "#43b581",
      toastError: "#f04747",
      inputBg: "#ffffff",
      inputBorder: "#dcdfe4",
      buttonBg: "#ffffff",
      buttonHover: "#e3e5e8",
      buttonText: "#2c2f33",
      placeholder: "#a0a4aa",
      modalBg: "#ffffff",
      footerBg: "#f6f6f6",
      tooltipBg: "#2f3136",
      tooltipText: "#ffffff"
    },
    font: "Inter, 'Segoe UI', Helvetica, Arial, sans-serif"
  };

  // ---------- STYLE ----------
  const style = document.createElement("style");
  style.textContent = `
    .foxy-window {position:fixed; top:80px; left:80px; width:520px; height:420px; background:${_settings.colors.windowBg};
      color:${_settings.colors.text}; font-family:${_settings.font}; border-radius:10px; overflow:hidden;
      display:flex; flex-direction:column; transition:all 0.2s ease; z-index:999999; box-shadow:0 4px 12px rgba(0,0,0,0.15);}
    .foxy-header {background:${_settings.colors.header}; padding:10px 14px; display:flex; align-items:center; gap:8px; cursor: grab; user-select:none; font-weight:600; border-bottom:1px solid #e3e5e8;}
    .foxy-header:active {cursor: grabbing;}
    .foxy-title {flex:1; font-size:15px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}
    .foxy-controls span {cursor:pointer; padding:0 10px; border-radius:6px; transition: background 0.15s ease;}
    .foxy-controls span:hover {background:${_settings.colors.tabHover};}
    .foxy-tabbar {display:flex; overflow-x:auto; gap:4px; padding:6px; background:${_settings.colors.header}; border-bottom:1px solid #e3e5e8;}
    .foxy-tab {padding:8px 12px; cursor:pointer; border-radius:6px; display:flex; align-items:center; gap:6px; color:${_settings.colors.tabInactive}; font-size:13px; transition:all 0.15s ease;}
    .foxy-tab:hover {background:${_settings.colors.tabHover};}
    .foxy-tab.active {background:${_settings.colors.tabActive}; color:#fff; font-weight:600;}
    .foxy-content {flex:1; padding:12px; display:flex; flex-direction:column; gap:8px; overflow:auto; font-size:13px; color:${_settings.colors.text}; background:${_settings.colors.windowBg};}
    .foxy-footer {display:flex; gap:8px; padding:8px; background:${_settings.colors.footerBg}; flex-wrap:wrap; border-top:1px solid #e3e5e8;}
    .foxy-toast-wrap {position:fixed; right:16px; bottom:16px; display:flex; flex-direction:column; gap:10px; z-index:1000001;}
    .foxy-toast {background:${_settings.colors.modalBg}; border-radius:8px; padding:10px 14px; display:flex; align-items:center; gap:8px; box-shadow:0 4px 20px rgba(0,0,0,0.1); font-size:13px; transition:all 0.2s ease; border-left:4px solid;}
    .foxy-toast.info {border-left-color:${_settings.colors.toastInfo}; color:${_settings.colors.toastInfo};}
    .foxy-toast.success {border-left-color:${_settings.colors.toastSuccess}; color:${_settings.colors.toastSuccess};}
    .foxy-toast.error {border-left-color:${_settings.colors.toastError}; color:${_settings.colors.toastError};}
    .foxy-toast .close-x {margin-left:auto; cursor:pointer; color:#666;}
    .foxy-window input, .foxy-window textarea, .foxy-window select {background:${_settings.colors.inputBg}; border:1px solid ${_settings.colors.inputBorder}; border-radius:6px; padding:6px 10px; outline:none; font-family:${_settings.font}; width:100%; box-sizing:border-box; transition:border 0.15s ease;}
    .foxy-window input:focus, .foxy-window textarea:focus, .foxy-window select:focus {border-color:${_settings.colors.tabActive}; box-shadow:0 0 0 2px rgba(88,101,242,0.2);}
    .foxy-window input::placeholder {color:${_settings.colors.placeholder};}
    .foxy-window button {background:${_settings.colors.buttonBg}; color:${_settings.colors.buttonText}; border:none; border-radius:6px; padding:6px 12px; cursor:pointer; transition:all 0.15s ease; font-family:${_settings.font}; font-size:13px;}
    .foxy-window button:hover {background:${_settings.colors.buttonHover}; box-shadow:0 2px 6px rgba(0,0,0,0.1);}
    .foxy-modal-overlay {position:fixed; inset:0; background:rgba(0,0,0,0.4); display:flex; justify-content:center; align-items:center; z-index:1000002;}
    .foxy-modal {background:${_settings.colors.modalBg}; padding:16px; border-radius:8px; min-width:300px; color:${_settings.colors.text}; box-shadow:0 8px 20px rgba(0,0,0,0.15); display:flex; flex-direction:column; gap:8px;}
  `;
  document.head.appendChild(style);

  const toastWrap = document.createElement("div");
  toastWrap.className = "foxy-toast-wrap";
  document.body.appendChild(toastWrap);

  function showToast(msg, {type="info", duration=3000, persistent=false}={}) {
    const el = document.createElement("div");
    el.className = "foxy-toast " + type;
    el.innerHTML = `<div>${msg}</div><div class="close-x">✖</div>`;
    toastWrap.prepend(el);
    el.querySelector(".close-x").onclick = () => el.remove();
    if (!persistent) setTimeout(() => el.remove(), duration);
  }

  function addKeybind(combo, fn) {
    _keybinds.push({ keyCombo: combo.toLowerCase(), callback: fn });
  }
  document.addEventListener("keydown", e => {
    const combo = `${e.ctrlKey?"ctrl+":""}${e.shiftKey?"shift+":""}${e.altKey?"alt+":""}${e.key.toLowerCase()}`;
    _keybinds.forEach(kb => { if (kb.keyCombo === combo) { kb.callback(); e.preventDefault(); } });
  });

  function createWindow(opts={}) {
    const {title="FoxyUI Window", width=520, height=420, icon=null, defaultTab=0, onClose, movable=true, minimizable=true} = opts;
    const el = document.createElement("div");
    el.className = "foxy-window";
    el.style.width = width+"px"; el.style.height = height+"px";

    el.innerHTML = `
      <div class="foxy-header">
        ${icon?`<img src="${icon}" style="width:20px;height:20px;margin-right:6px;">`:""}
        <div class="foxy-title">${title}</div>
        <div class="foxy-controls">
          ${minimizable?'<span class="minimize">—</span>':""}
          <span class="close">✖</span>
        </div>
      </div>
      <div class="foxy-tabbar"></div>
      <div class="foxy-footer"></div>
    `;

    document.body.appendChild(el);

    const winAPI = { id: "win_"+Date.now(), el, tabs: [], activeTab:null, tabbar: el.querySelector(".foxy-tabbar"), footer: el.querySelector(".foxy-footer") };
    const contentList = [];

    winAPI.addTab = ({name, html}) => {
      const tab = document.createElement("div"); tab.className="foxy-tab"; tab.textContent=name;
      winAPI.tabbar.appendChild(tab);

      const content = document.createElement("div"); content.className="foxy-content"; content.innerHTML=html; content.style.display="none";
      el.appendChild(content);

      const obj = {tab, content, name};
      winAPI.tabs.push(obj);

      tab.onclick = () => {
        winAPI.tabs.forEach(t => {t.tab.classList.remove("active"); t.content.style.display="none";});
        tab.classList.add("active"); content.style.display="flex"; winAPI.activeTab = obj;
      };

      if (winAPI.tabs.length === defaultTab + 1) tab.click();
      return obj;
    };

    winAPI.addButton = (label, fn) => {
      const b = document.createElement("button"); b.textContent = label; b.onclick = fn; winAPI.footer.appendChild(b); return b;
    };

    el.querySelector(".close").onclick = () => { el.remove(); onClose?.(); };
    if (minimizable) el.querySelector(".minimize").onclick = () => el.style.display = el.style.display==="none" ? "flex" : "none";

    if (movable) {
      const header = el.querySelector(".foxy-header"); let dx=0,dy=0,drag=false;
      header.onmousedown = e => { drag=true; dx=e.clientX-el.offsetLeft; dy=e.clientY-el.offsetTop; };
      document.onmouseup = () => drag=false;
      document.onmousemove = e => { if(drag) { el.style.left=e.clientX-dx+"px"; el.style.top=e.clientY-dy+"px"; } };
    }

    _windows[winAPI.id] = winAPI;
    return winAPI;
  }

  window.FoxyUI = {_version:25,_windows,_toasts,_modals,_settings,_plugins,_keybinds,showToast,createWindow,addKeybind};
  console.log("%c🐾 FoxyUI v25 Reloaded Clean & Fixed~","color:#5865f2;font-weight:700");

})();
