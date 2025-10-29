(() => {
  if (window.FoxyUI && window.FoxyUI._version >= 14) {
    console.warn("FoxyUI v14 already loaded~");
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
  const _plugins = [];
  const _events = {};
  const _keybinds = [];
  const _mergeHistory = [];

  // ---------- STYLE ----------
  const style = document.createElement("style");
  style.textContent = `
    .foxy-window {
      position: fixed;
      top: 80px; left: 80px;
      width: 520px; height: 420px;
      background:${_settings.colors.windowBg};
      color:${_settings.colors.text};
      font-family:${_settings.font};
      border:1px solid #555;
      border-radius:10px;
      box-shadow:0 0 25px rgba(0,0,0,0.6);
      display:flex;
      flex-direction:column;
      resize: both;
      overflow: hidden;
      transition: transform .15s, background .2s, color .2s;
      z-index:999999;
    }
    .foxy-header {
      background:${_settings.colors.header};
      padding:6px 12px;
      display:flex;
      align-items:center;
      gap:8px;
      cursor: grab;
      border-bottom: 1px solid #333;
      user-select: none;
    }
    .foxy-header:active { cursor: grabbing; }
    .foxy-title {
      flex: 1;
      font-weight:700;
      color:${_settings.colors.text};
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .foxy-controls span {
      cursor: pointer;
      font-weight: 700;
      padding: 0 6px;
      border-radius: 4px;
      transition: background 0.15s;
    }
    .foxy-controls span:hover { background: rgba(255,255,255,0.1); }
    
    .foxy-tabbar {
      display:flex;
      overflow-x:auto;
      overflow-y:hidden;
      background:#191919;
      border-bottom:1px solid #333;
      gap:4px;
      padding:4px 2px;
      scrollbar-width: thin;
      scrollbar-color: #444 #111;
    }
    .foxy-tabbar::-webkit-scrollbar { height:6px; }
    .foxy-tabbar::-webkit-scrollbar-thumb { background:#444; border-radius:3px; }
    .foxy-tabbar::-webkit-scrollbar-track { background:#111; }
    
    .foxy-tab {
      padding:6px 12px;
      cursor:pointer;
      color:${_settings.colors.tabInactive};
      border-radius:6px;
      user-select:none;
      display:flex;
      align-items:center;
      gap:6px;
      transition: all 0.15s;
      white-space: nowrap;
    }
    .foxy-tab:hover { background:${_settings.colors.tabHover}; }
    .foxy-tab.active {
      background:${_settings.colors.tabActive};
      color:#fff;
      font-weight: 600;
    }
    .foxy-tab img { width:16px; height:16px; object-fit: contain; vertical-align:middle; }
    
    .foxy-content {
      flex:1;
      background:${_settings.colors.windowBg};
      padding:12px;
      overflow:auto;
      white-space: pre-wrap;
      color:${_settings.colors.text};
      display:flex;
      flex-direction:column;
      gap:6px;
    }
    .foxy-footer {
      display:flex;
      gap:8px;
      padding:8px;
      background:${_settings.colors.header};
      border-top:1px solid #333;
      flex-wrap: wrap;
    }
    
    .foxy-toast-wrap {
      position:fixed;
      right:18px;
      bottom:18px;
      display:flex;
      flex-direction:column;
      gap:8px;
      z-index:1000001;
    }
    .foxy-toast {
      background:rgba(30,30,30,.98);
      border:1px solid #444;
      border-radius:8px;
      padding:8px 12px;
      min-width:180px;
      display:flex;
      align-items:center;
      gap:8px;
      box-shadow:0 4px 14px rgba(0,0,0,.4);
      font-size:13px;
      transition: all 0.2s;
    }
    .foxy-toast.info{color:${_settings.colors.toastInfo};border-left:4px solid ${_settings.colors.toastInfo};}
    .foxy-toast.success{color:${_settings.colors.toastSuccess};border-left:4px solid ${_settings.colors.toastSuccess};}
    .foxy-toast.error{color:${_settings.colors.toastError};border-left:4px solid ${_settings.colors.toastError};}
    .foxy-toast .close-x { margin-left:auto; cursor:pointer; color:#ccc; padding-left:8px; }
    
    .foxy-window input, .foxy-window textarea, .foxy-window select {
      background:${_settings.colors.inputBg};
      color:${_settings.colors.text};
      border:1px solid ${_settings.colors.inputBorder};
      border-radius:5px;
      padding:6px 8px;
      outline:none;
      font-family:${_settings.font};
      width:100%;
      box-sizing:border-box;
      transition: border 0.2s, background 0.2s;
    }
    .foxy-window input:focus, .foxy-window textarea:focus, .foxy-window select:focus {
      border-color:#7aff7a;
    }
    .foxy-window input::placeholder, .foxy-window textarea::placeholder { color:${_settings.colors.placeholder}; }
    
    .foxy-window button {
      background:${_settings.colors.buttonBg};
      color:${_settings.colors.buttonText};
      border:1px solid #444;
      border-radius:6px;
      padding:6px 12px;
      cursor:pointer;
      transition: all 0.2s;
      font-family:${_settings.font};
    }
    .foxy-window button:hover { background:${_settings.colors.buttonHover}; }
  `;
  document.head.appendChild(style);

  // ---------- EVENTS ----------
  function emit(eventName, ...args) { (_events[eventName]||[]).forEach(fn=>fn(...args)); }
  function on(eventName, fn) { if(!_events[eventName]) _events[eventName]=[]; _events[eventName].push(fn); }

  // ---------- TOAST ----------
  const toastWrap=document.createElement("div"); toastWrap.className="foxy-toast-wrap"; document.body.appendChild(toastWrap);
  function showToast(msg,{type="info",duration=3000,persistent=false}={}) {
    const el=document.createElement("div");
    el.className="foxy-toast "+type;
    el.innerHTML=`<div>${msg}</div><div class="close-x">✖</div>`;
    toastWrap.prepend(el);
    el.querySelector(".close-x").onclick=()=>el.remove();
    if(!persistent) setTimeout(()=>el.remove(),duration);
  }

  // ---------- KEYBIND SYSTEM ----------
  function addKeybind(keyCombo, callback) {
    _keybinds.push({keyCombo: keyCombo.toLowerCase(), callback});
  }
  document.addEventListener("keydown", e => {
    const combo = `${e.ctrlKey?"ctrl+":""}${e.shiftKey?"shift+":""}${e.altKey?"alt+":""}${e.key.toLowerCase()}`;
    _keybinds.forEach(kb => { if(kb.keyCombo === combo) { kb.callback(); e.preventDefault(); } });
  });

  // ---------- WINDOW MERGING ----------
  const mergeThreshold = 50;
  function distance(el1, el2) {
    const r1 = el1.getBoundingClientRect();
    const r2 = el2.getBoundingClientRect();
    return Math.hypot(r1.left-r2.left, r1.top-r2.top);
  }
  function tryMerge(win) {
    for (const otherId in _windows) {
      const other = _windows[otherId];
      if(other===win) continue;
      if(distance(win.el, other.el)<mergeThreshold){
        const oldTabs = [...win.tabs];
        oldTabs.forEach(tab=>{ other.addTab({name:tab.name, html:tab.html, icon:tab.el.querySelector("img")?.src}); });
        _mergeHistory.push({from:win, to:other, tabs:oldTabs});
        win.el.remove();
        delete _windows[win.id];
        showToast(`Windows combined into "${other.el.querySelector(".foxy-title").textContent}"`,{type:"info"});
        return other;
      }
    }
    return win;
  }
  function undoMerge(){ if(_mergeHistory.length===0){ showToast("No merge to undo",{type:"error"}); return; }
    const last = _mergeHistory.pop();
    const {from,tabs} = last;
    const newWin = FoxyUI.createWindow({title:from.el.querySelector(".foxy-title").textContent});
    tabs.forEach(tab=>newWin.addTab({name:tab.name, html:tab.html, icon:tab.el.querySelector("img")?.src}));
    showToast(`Merge undone for "${newWin.el.querySelector(".foxy-title").textContent}"`,{type:"success"});
  }
  addKeybind("ctrl+z", undoMerge);

  // ---------- WINDOW CREATION ----------
  const oldCreateWindow = function(options={}) {
    const {title="Foxy Window", width=520, height=420, icon=null, resizable=true, movable=true, minimizable=true, sidebarMode=false, defaultTab=0, onClose, onOpen} = options;
    const el=document.createElement("div"); el.className="foxy-window";
    el.style.width=width+"px"; el.style.height=height+"px"; el.style.left="100px"; el.style.top="100px";
    el.innerHTML=`
      <div class="foxy-header">
        ${icon?`<img src="${icon}" style="width:20px;height:20px;margin-right:6px;vertical-align:middle;">`:''}
        <div class="foxy-title">${title}</div>
        <div class="foxy-controls">${minimizable?'<span class="minimize">—</span>':''}<span class="close">✖</span></div>
      </div>
      <div class="foxy-tabbar"></div>
      <div class="foxy-content"></div>
      <div class="foxy-footer"></div>
    `;
    document.body.appendChild(el);

    const id = "win_" + Date.now();
    const tabs = [];
    const winAPI = {
      id, el, tabs,
      tabbar: el.querySelector(".foxy-tabbar"),
      content: el.querySelector(".foxy-content"),
      footer: el.querySelector(".foxy-footer"),
      setContent(html){ this.content.innerHTML=html; },
      addButton(label, fn){ const b=document.createElement("button"); b.textContent=label; b.onclick=fn; this.footer.appendChild(b); return b; },
      addTab({name, html, icon=null}){
        const tab = document.createElement("div"); tab.className="foxy-tab";
        if(icon){ const img=document.createElement("img"); img.src=icon; tab.appendChild(img); }
        const span=document.createElement("span"); span.textContent=name; tab.appendChild(span);
        this.tabbar.appendChild(tab);
        const tabObj = {el:tab,name,html};
        tabs.push(tabObj);
        const activate = ()=>{
          this.tabbar.querySelectorAll(".foxy-tab").forEach(t=>t.classList.remove("active"));
          tab.classList.add("active");
          this.setContent(html);
          this.content.prepend(this.tabbar);
          emit("tabClicked", winAPI, tabObj);
        };
        tab.onclick = activate;
        if(tabs.length-1===defaultTab) tab.click();
        _plugins.forEach(p=>p.onTabAdd?.(winAPI, tabObj));
        return tabObj;
      },
      removeTab(tabObj){ const idx=tabs.indexOf(tabObj); if(idx>-1){ tabObj.el.remove(); tabs.splice(idx,1); if(tabs.length>0) tabs[0].el.click(); emit("tabRemoved", winAPI, tabObj); } },
      editTab(tabObj, {name, html, icon}){ if(name) tabObj.name=name; if(html) tabObj.html=html; if(icon && tabObj.el.querySelector("img")) tabObj.el.querySelector("img").src=icon; if(name) tabObj.el.querySelector("span").textContent=name; if(tabObj.el.classList.contains("active") && html) this.setContent(html); emit("tabEdited", winAPI, tabObj); }
    };
    _windows[id] = winAPI;

    el.querySelector(".close").onclick = ()=>{ delete _windows[id]; el.remove(); emit("windowClosed",winAPI); onClose?.(); };
    if(minimizable){ el.querySelector(".minimize").onclick = ()=> el.style.display = el.style.display === "none" ? "flex" : "none"; }

    if(movable){
      const header = el.querySelector(".foxy-header");
      let offsetX=0, offsetY=0, dragging=false;
      header.addEventListener("mousedown", e => { dragging=true; offsetX=e.clientX-el.offsetLeft; offsetY=e.clientY-el.offsetTop; header.style.cursor="grabbing"; });
      document.addEventListener("mouseup", ()=>{ if(dragging) tryMerge(winAPI); dragging=false; header.style.cursor="grab"; });
      document.addEventListener("mousemove", e => { if(dragging){ el.style.left=(e.clientX-offsetX)+"px"; el.style.top=(e.clientY-offsetY)+"px"; } });
    }

    _plugins.forEach(p=>p.onWindowCreate?.(winAPI));
    emit("windowCreated", winAPI);
    onOpen?.();
    return winAPI;
  };

  // ---------- PLUGIN SYSTEM ----------
  function registerPlugin(name, initFn) { if(_plugins.some(p=>p.name===name)) return console.warn(`Plugin ${name} already registered`); const pluginObj={name,init:initFn}; _plugins.push(pluginObj); initFn(window.FoxyUI); console.log(`Plugin ${name} loaded~`); }
  async function loadPluginFromURL(url) { const res = await fetch(url); const code = await res.text(); new Function("FoxyUI", code)(window.FoxyUI); }

  // ---------- EXPORT ----------
  window.FoxyUI = {
    _version: 14,
    _windows,_toasts,_settings,_plugins,_keybinds,
    showToast, createWindow:oldCreateWindow, addKeybind,
    registerPlugin, loadPluginFromURL,
    emit, on,
    undoMerge
  };

  console.log("%c🐾 FoxyUI v14 loaded~ (stateless, no localStorage)", "color:#aef;font-weight:700");
})();
