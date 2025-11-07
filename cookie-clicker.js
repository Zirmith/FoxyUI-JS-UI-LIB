// == Ultimate Cookie Clicker Hacker Menu (FoxyUI v25) ==
(function(){
  if(!window.FoxyUI){ alert("Load FoxyUI v25 first (run your FoxyUI code)."); return; }
  if(!window.Game){ alert("This should be run on Cookie Clicker (Game object not found)."); return; }

  // small helper
  const $ = selector => document.querySelector(selector);

  const menu = FoxyUI.createWindow({
    title: "🍪 Ultimate Hacker Menu",
    width: 920,
    height: 540,
    icon: null,
    defaultTab: 0,
    movable: true,
    minimizable: true
  });

  // === TAB: Quick Actions ===
  menu.addTab({
    name: "Quick",
    html: `
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <div style="min-width:320px;flex:1;">
          <h3>Cookies & Production</h3>
          <div style="display:flex;gap:8px;align-items:center;">
            <input id="cc_setCookies_input" placeholder="amount (number or Infinity)"/>
            <button id="cc_setCookies_btn">Set</button>
            <button id="cc_earn1m_btn">Earn +1,000,000</button>
            <button id="cc_infCookies_btn">Infinite Cookies</button>
          </div>

          <h3 style="margin-top:12px;">Production</h3>
          <div style="display:flex;gap:8px;align-items:center;">
            <input id="cc_setCps_input" placeholder="cookiesPs value"/>
            <button id="cc_setCps_btn">Set CPS</button>
            <button id="cc_mulCps_btn">×2 CPS</button>
          </div>

          <h3 style="margin-top:12px;">Auto & Misc</h3>
          <div style="display:flex;gap:8px;align-items:center;">
            <button id="cc_autoclick_toggle">Toggle Autoclick (OFF)</button>
            <button id="cc_autogc_toggle">Toggle Auto Golden Cookie (OFF)</button>
            <button id="cc_save_btn">Save</button>
            <button id="cc_load_btn">Load</button>
            <button id="cc_hardreset_btn">Hard Reset</button>
          </div>
        </div>

        <div style="min-width:320px;flex:1;">
          <h3>Buildings & Upgrades</h3>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <button id="cc_freeBuildings_btn">Make Buildings Free</button>
            <button id="cc_add100_btn">+100 Each Building</button>
            <button id="cc_setBulk100_btn">Set Bulk = 100</button>
            <button id="cc_unlockAllUpgrades_btn">Unlock All Upgrades</button>
            <button id="cc_unlockAllAch_btn">Unlock All Achievements</button>
          </div>

          <h3 style="margin-top:12px;">Sugar Lumps & Levels</h3>
          <div style="display:flex;gap:8px;align-items:center;">
            <input id="cc_sugar_index" placeholder="building index"/>
            <input id="cc_sugar_level" placeholder="level"/>
            <button id="cc_setLumpLevel_btn">Set Building Level</button>
          </div>
        </div>

        <div style="min-width:220px;flex:0.8;">
          <h3>Golden Cookies</h3>
          <div style="display:flex;gap:8px;flex-direction:column;">
            <button id="cc_spawn_gc">Spawn Golden Cookie</button>
            <div style="display:flex;gap:8px;">
              <input id="cc_gc_amount" placeholder="amount" />
              <button id="cc_spawn_mul_gc">Spawn x</button>
            </div>
            <button id="cc_force_wrath">Force Wrath Cookie</button>
            <button id="cc_force_frenzy">Force Frenzy Buff</button>
          </div>

          <h3 style="margin-top:12px;">Shimmers / Buffs</h3>
          <div style="display:flex;gap:8px;flex-direction:column;">
            <button id="cc_gain_buff_frenzy">Gain Frenzy</button>
            <button id="cc_gain_buff_clickfrenzy">Gain Click Frenzy</button>
            <input id="cc_buff_duration" placeholder="duration frames (fps*seconds)" />
            <input id="cc_buff_mult" placeholder="multiplier (eg 7)" />
          </div>
        </div>
      </div>
    `
  });

  // === TAB: Advanced ===
  menu.addTab({
    name: "Advanced",
    html: `
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <div style="flex:1;min-width:420px;">
          <h3>Save Management</h3>
          <textarea id="cc_savearea" rows="6" style="width:100%;"></textarea>
          <div style="display:flex;gap:8px;margin-top:8px;">
            <button id="cc_copy_save">Copy Save</button>
            <button id="cc_export_save">Export Save File</button>
            <button id="cc_import_save">Import Save From Text</button>
          </div>

          <h3 style="margin-top:12px;">Save Manipulation</h3>
          <div style="display:flex;gap:8px;align-items:center;">
            <button id="cc_add_earn_clicked">Earn as if clicked (100x)</button>
            <button id="cc_trigger_cheated_ach">Trigger Cheated Achievement</button>
          </div>
        </div>

        <div style="flex:1;min-width:320px;">
          <h3>Utilities & Debug</h3>
          <div style="display:flex;gap:8px;flex-direction:column;">
            <button id="cc_show_gameobj">Console: show Game</button>
            <button id="cc_show_objs">Console: Game.Objects</button>
            <button id="cc_recalc_gains">Recalculate Gains</button>
            <button id="cc_refresh_store">Refresh Store</button>
          </div>

          <h3 style="margin-top:12px;">Scripting</h3>
          <textarea id="cc_custom_code" placeholder="// custom code" rows="6" style="width:100%;"></textarea>
          <div style="display:flex;gap:8px;margin-top:8px;">
            <button id="cc_run_custom">Run Custom</button>
            <button id="cc_clear_custom">Clear</button>
          </div>
        </div>
      </div>
    `
  });

  // === TAB: Golden Control ===
  menu.addTab({
    name: "Golden Control",
    html: `
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <div style="flex:1;">
          <h3>Golden Cookie Spawner</h3>
          <div style="display:flex;gap:8px;align-items:center;">
            <input id="gc_life" placeholder="life (frames)" />
            <input id="gc_dur" placeholder="dur (frames)" />
            <input id="gc_size" placeholder="sizeMult" />
            <button id="gc_spawn_custom">Spawn Custom</button>
          </div>

          <h3 style="margin-top:12px;">Probability / Force</h3>
          <div style="display:flex;gap:8px;align-items:center;">
            <input id="gc_force_type" placeholder="force (eg 'wrath')" />
            <button id="gc_force_spawn">Force Type Spawn</button>
          </div>
        </div>

        <div style="flex:0.8;">
          <h3>Auto-Clicker / Auto-GC</h3>
          <div style="display:flex;gap:8px;flex-direction:column;">
            <div style="display:flex;gap:8px;">
              <input id="autoclick_interval" placeholder="ms interval (50)" />
              <button id="autoclick_start">Start</button>
              <button id="autoclick_stop">Stop</button>
            </div>
            <div style="display:flex;gap:8px;">
              <input id="autogc_interval" placeholder="ms interval (400)" />
              <button id="autogc_start">Start Auto-GC</button>
              <button id="autogc_stop">Stop Auto-GC</button>
            </div>
          </div>
        </div>
      </div>
    `
  });

  // === TAB: UI / Theme ===
  menu.addTab({
    name: "UI",
    html: `
      <div style="display:flex;gap:12px;flex-direction:column;">
        <div style="display:flex;gap:12px;">
          <button id="cc_toast_test">Show Test Toast</button>
          <button id="cc_close_all">Close This Window</button>
        </div>
        <div style="margin-top:12px;">
          <h4>Quick CSS tweaks</h4>
          <button id="cc_dark_theme">Dark Theme</button>
          <button id="cc_light_theme">Light Theme</button>
        </div>
      </div>
    `
  });

  // === internals / state ===
  let autoclickIntervalId = null;
  let autogcIntervalId = null;
  let autoclickOn = false;
  let autogcOn = false;

  // --- Helper wrappers for Game calls (safeguarded) ---
  function safeExec(fn){
    try{ fn(); } catch(e){ FoxyUI.showToast?.(`Error: ${e.message||e}`, {type:'error'}); console.error(e); }
  }

  // --- wire up Quick tab ---
  const root = document.body;
  root.querySelector("#cc_setCookies_btn").onclick = () => {
    const v = root.querySelector("#cc_setCookies_input").value.trim();
    safeExec(()=> {
      Game.cookies = (v === "Infinity") ? Infinity : Number(v);
      Game.cookies = isNaN(Game.cookies) ? 0 : Game.cookies;
      FoxyUI.showToast("Set cookies.", {type:'success'});
    });
  };
  root.querySelector("#cc_earn1m_btn").onclick = () => safeExec(()=>{ Game.Earn(1000000); FoxyUI.showToast("Earned +1,000,000"); });
  root.querySelector("#cc_infCookies_btn").onclick = () => safeExec(()=>{ Game.cookies = Infinity; FoxyUI.showToast("Cookies = Infinity ♾️"); });

  root.querySelector("#cc_setCps_btn").onclick = () => {
    const v = Number(root.querySelector("#cc_setCps_input").value);
    safeExec(()=>{ if(!isNaN(v)){ Game.cookiesPs = v; FoxyUI.showToast("cookiesPs changed"); } else FoxyUI.showToast("Invalid CPS", {type:'error'}); });
  };
  root.querySelector("#cc_mulCps_btn").onclick = () => safeExec(()=>{ Game.cookiesPs *= 2; FoxyUI.showToast("CPS ×2"); });

  // Autoclick toggle (clicks big cookie)
  root.querySelector("#cc_autoclick_toggle").onclick = function(){
    autoclickOn = !autoclickOn;
    this.textContent = `Toggle Autoclick (${autoclickOn ? "ON" : "OFF"})`;
    if(autoclickOn){
      autoclickIntervalId = setInterval(()=> safeExec(()=> Game.ClickCookie()), 100);
      FoxyUI.showToast("Autoclick ON", {type:'info'});
    } else {
      clearInterval(autoclickIntervalId); autoclickIntervalId = null; FoxyUI.showToast("Autoclick OFF", {type:'info'});
    }
  };

  // Auto golden cookie: click on spawn or automatically spawn & pop
  root.querySelector("#cc_autogc_toggle").onclick = function(){
    autogcOn = !autogcOn;
    this.textContent = `Toggle Auto Golden Cookie (${autogcOn ? "ON" : "OFF"})`;
    if(autogcOn){
      autogcIntervalId = setInterval(()=> safeExec(()=>{
        // click any golden cookie shimmer
        Game.shimmers.forEach(s => { if(s.type === 'golden') s.pop(); });
      }), 700);
      FoxyUI.showToast("Auto-GC ON", {type:'info'});
    } else {
      clearInterval(autogcIntervalId); autogcIntervalId = null; FoxyUI.showToast("Auto-GC OFF", {type:'info'});
    }
  };

  root.querySelector("#cc_save_btn").onclick = () => safeExec(()=>{ Game.WriteSave(); FoxyUI.showToast("Saved game."); });
  root.querySelector("#cc_load_btn").onclick = () => safeExec(()=>{ Game.LoadSave(); FoxyUI.showToast("Loaded save."); });
  root.querySelector("#cc_hardreset_btn").onclick = () => safeExec(()=>{ if(confirm("Hard Reset? This will reset your game.")){ Game.HardReset(); FoxyUI.showToast("Hard reset."); } });

  // Buildings & upgrades
  root.querySelector("#cc_freeBuildings_btn").onclick = () => safeExec(()=>{
    Game.ObjectsById.forEach(e=>{ e.basePrice = 0; e.refresh(); }); Game.storeToRebuild = 1; FoxyUI.showToast("Buildings are free now.");
  });
  root.querySelector("#cc_add100_btn").onclick = () => safeExec(()=>{ Game.ObjectsById.forEach(obj => obj.amount += 100); Game.recalculateGains = 1; FoxyUI.showToast("+100 to each building"); });
  root.querySelector("#cc_setBulk100_btn").onclick = () => safeExec(()=>{ Game.buyBulk = 100; FoxyUI.showToast("Bulk set to 100"); });
  root.querySelector("#cc_unlockAllUpgrades_btn").onclick = () => safeExec(()=>{ Game.SetAllUpgrade(1); FoxyUI.showToast("All upgrades unlocked"); });
  root.querySelector("#cc_unlockAllAch_btn").onclick = () => safeExec(()=>{ Game.SetAllAchievs(1); FoxyUI.showToast("All achievements unlocked"); });

  // sugar lumps / building levels
  root.querySelector("#cc_setLumpLevel_btn").onclick = () => safeExec(()=> {
    const idx = Number(root.querySelector("#cc_sugar_index").value);
    const lvl = Number(root.querySelector("#cc_sugar_level").value);
    if(isNaN(idx) || isNaN(lvl) || !Game.ObjectsById[idx]) return FoxyUI.showToast("Invalid index/level", {type:'error'});
    Game.ObjectsById[idx].level = lvl; Game.recalculateGains = 1; FoxyUI.showToast("Building level set.");
  });

  // Golden cookie controls
  root.querySelector("#cc_spawn_gc").onclick = () => safeExec(()=> { new Game.shimmer('golden'); FoxyUI.showToast("Golden cookie spawned"); });
  root.querySelector("#cc_spawn_mul_gc").onclick = () => safeExec(()=> {
    const amt = Number(root.querySelector("#cc_gc_amount").value) || 1;
    for(let i=0;i<amt;i++){ new Game.shimmer('golden').pop(); }
    FoxyUI.showToast(`${amt} golden cookies popped`);
  });
  root.querySelector("#cc_force_wrath").onclick = () => safeExec(()=>{ const s = new Game.shimmer('golden'); s.force = 'wrath'; s.pop(); FoxyUI.showToast("Wrath cookie forced"); });
  root.querySelector("#cc_force_frenzy").onclick = () => safeExec(()=>{ Game.gainBuff('frenzy', Game.fps*30, 7); FoxyUI.showToast("Frenzy buff granted"); });

  root.querySelector("#cc_gain_buff_frenzy").onclick = () => safeExec(()=>{ const dur = Number(root.querySelector("#cc_buff_duration").value) || (Game.fps*30); const mult = Number(root.querySelector("#cc_buff_mult").value) || 7; Game.gainBuff('frenzy', dur, mult); FoxyUI.showToast("Frenzy gained"); });
  root.querySelector("#cc_gain_buff_clickfrenzy").onclick = () => safeExec(()=>{ const dur = Number(root.querySelector("#cc_buff_duration").value) || (Game.fps*13); Game.gainBuff('click frenzy', dur, 777); FoxyUI.showToast("Click frenzy gained"); });

  // === Advanced tab wiring ===
  const saveArea = root.querySelector("#cc_savearea");
  root.querySelector("#cc_copy_save").onclick = () => safeExec(()=>{ const s = Game.WriteSave(); navigator.clipboard.writeText(s); FoxyUI.showToast("Save copied to clipboard"); });
  root.querySelector("#cc_export_save").onclick = () => safeExec(()=> {
    const s = Game.WriteSave();
    const blob = new Blob([s], {type:'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'cc_save.txt'; a.click(); URL.revokeObjectURL(url);
    FoxyUI.showToast("Save exported");
  });
  root.querySelector("#cc_import_save").onclick = () => safeExec(()=> {
    const s = prompt("Paste your save string:");
    if(s) { Game.LoadSave(s); FoxyUI.showToast("Imported save"); }
  });

  root.querySelector("#cc_add_earn_clicked").onclick = () => safeExec(()=> { Game.Earn(Game.computedMouseCps * 100); FoxyUI.showToast("Simulated clicks earned"); });
  root.querySelector("#cc_trigger_cheated_ach").onclick = () => safeExec(()=> { Game.cookies = Game.cookiesEarned + 1000000; FoxyUI.showToast("Cheated achievement trigger ready"); });

  root.querySelector("#cc_show_gameobj").onclick = () => console.log(Game);
  root.querySelector("#cc_show_objs").onclick = () => console.log(Game.Objects);
  root.querySelector("#cc_recalc_gains").onclick = () => safeExec(()=>{ Game.recalculateGains = 1; FoxyUI.showToast("Recalculated gains"); });
  root.querySelector("#cc_refresh_store").onclick = () => safeExec(()=>{ Game.storeToRebuild = 1; FoxyUI.showToast("Store rebuild flagged"); });

  root.querySelector("#cc_run_custom").onclick = () => safeExec(()=> { const code = root.querySelector("#cc_custom_code").value; if(!code) return FoxyUI.showToast("No code"); try{ (new Function(code))(); FoxyUI.showToast("Ran custom code"); } catch(e){ FoxyUI.showToast(e.message, {type:'error'}); }});
  root.querySelector("#cc_clear_custom").onclick = () => { root.querySelector("#cc_custom_code").value = ""; };

  // === Golden Control tab wiring ===
  root.querySelector("#gc_spawn_custom").onclick = () => safeExec(()=>{
    const life = Number(root.querySelector("#gc_life").value) || null;
    const dur = Number(root.querySelector("#gc_dur").value) || null;
    const size = Number(root.querySelector("#gc_size").value) || null;
    const s = new Game.shimmer('golden');
    if(life) s.life = life;
    if(dur) s.dur = dur;
    if(size) s.sizeMult = size;
    s.pop();
    FoxyUI.showToast("Custom golden cookie spawned");
  });

  root.querySelector("#gc_force_spawn").onclick = () => safeExec(()=>{
    const f = root.querySelector("#gc_force_type").value || 'wrath';
    const s = new Game.shimmer('golden');
    s.force = f;
    s.pop();
    FoxyUI.showToast(`Forced golden cookie type: ${f}`);
  });

  // Auto-clicker controls (independent)
  root.querySelector("#autoclick_start").onclick = () => safeExec(()=>{
    const ms = Number(root.querySelector("#autoclick_interval").value) || 50;
    if(autoclickIntervalId) clearInterval(autoclickIntervalId);
    autoclickIntervalId = setInterval(()=> safeExec(()=> Game.ClickCookie()), ms);
    FoxyUI.showToast("Autoclick started");
  });
  root.querySelector("#autoclick_stop").onclick = () => { if(autoclickIntervalId) clearInterval(autoclickIntervalId); autoclickIntervalId = null; FoxyUI.showToast("Autoclick stopped"); };

  // Auto GC controls
  root.querySelector("#autogc_start").onclick = () => safeExec(()=>{
    const ms = Number(root.querySelector("#autogc_interval").value) || 400;
    if(autogcIntervalId) clearInterval(autogcIntervalId);
    autogcIntervalId = setInterval(()=> safeExec(()=>{ Game.shimmers.forEach(s => { if(s.type==='golden') s.pop(); }); }), ms);
    FoxyUI.showToast("Auto-GC started");
  });
  root.querySelector("#autogc_stop").onclick = () => { if(autogcIntervalId) clearInterval(autogcIntervalId); autogcIntervalId = null; FoxyUI.showToast("Auto-GC stopped"); };

  // === UI tab wiring ===
  root.querySelector("#cc_toast_test").onclick = () => FoxyUI.showToast("Test toast ~", {type:'info'});
  root.querySelector("#cc_close_all").onclick = () => menu.el.remove();

  root.querySelector("#cc_dark_theme").onclick = () => {
    // small style tweak (uses FoxyUI settings object)
    Object.assign(FoxyUI._settings.colors, {
      windowBg:"#0f0f12", text:"#d7dde3", header:"#0b0c0e", tabActive:"#7c5cff", tabInactive:"#b9b9bf", tabHover:"#111214", modalBg:"#111214", footerBg:"#0c0c0f"
    });
    FoxyUI.showToast("Dark theme applied", {type:'success'});
  };
  root.querySelector("#cc_light_theme").onclick = () => {
    Object.assign(FoxyUI._settings.colors, {
      windowBg:"#f6f6f6", text:"#2c2f33", header:"#ffffff", tabActive:"#5865f2", tabInactive:"#72767d", tabHover:"#e3e5e8", modalBg:"#ffffff", footerBg:"#f6f6f6"
    });
    FoxyUI.showToast("Light theme applied", {type:'success'});
  };

  // friendly console summary
  console.log("🍪 Ultimate Hacker Menu ready. Use the window UI. Tip: Always backup saves before heavy cheats (use Export Save).");

  // small convenience: attach to window for debugging
  window.CCHackerMenu = { menu, autoclickIntervalId, autogcIntervalId };

})();
