/* FoxyUI v23 — Discord-flavored stateless UI library
 * Adds: Premium Animated Light and Animated Dark themes, fluid CSS gradient transition matrices,
 * customizable backdrop metrics, collapsible category sidebar accordions, non-blocking absolute tooltips, 
 * categorized command palettes, and extensible Settings API wrappers.
 */
(() => {
  if (window.FoxyUI && window.FoxyUI._version >= 23) {
    console.warn("FoxyUI v23 already loaded~");
    return;
  }

  function installStorageQuotaGuard() {
    if (typeof Storage === "undefined" || !Storage.prototype) return;
    if (Storage.prototype.__foxyQuotaGuardInstalled) return;
    Storage.prototype.__foxyQuotaGuardInstalled = true;

    const nativeSetItem = Storage.prototype.setItem;
    const isQuotaError = (err) => !!err && (
      err.name === "QuotaExceededError" ||
      err.code === 22 ||
      err.code === 1014 ||
      /quota|exceeded/i.test(String(err.message || ""))
    );

    const trySetItem = (storage, key, value) => {
      try {
        nativeSetItem.call(storage, key, value);
        return true;
      } catch (err) {
        if (!isQuotaError(err)) throw err;
        return false;
      }
    };

    const trimConsoleHistoryAndSave = (storage, key, value) => {
      let parsedHistory = null;
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed) && parsed.length > 0) parsedHistory = parsed;
      } catch (_) {}

      if (parsedHistory) {
        const candidateSizes = [5000, 1000, 250, 50, 10, 1]
          .map((size) => Math.min(size, parsedHistory.length))
          .filter((size, index, list) => size > 0 && list.indexOf(size) === index);

        for (const keepCount of candidateSizes) {
          const serializedHistory = JSON.stringify(parsedHistory.slice(-keepCount));
          if (trySetItem(storage, key, serializedHistory)) return true;
        }
        return false;
      }
      return false;
    };

    Storage.prototype.setItem = function(key, value) {
      const settingName = String(key);
      const settingValue = String(value ?? "");
      try {
        return nativeSetItem.call(this, settingName, settingValue);
      } catch (err) {
        if (!isQuotaError(err) || settingName !== "consoleHistory") throw err;
        if (trimConsoleHistoryAndSave(this, settingName, settingValue)) return;
        try { this.removeItem(settingName); } catch (_) {}
        console.warn(`[FoxyUI] Could not save '${settingName}' because storage quota was exceeded. Console history will be lost.`);
      }
    };
  }
  installStorageQuotaGuard();

  // ---------- THEME PRESETS ----------
  const THEMES = {
    dark: {
      windowBg: "rgba(49, 51, 56, 0.95)", surface: "rgba(43, 45, 49, 0.95)", surfaceAlt: "rgba(30, 31, 34, 0.95)",
      text: "#dbdee1", textMuted: "#949ba4", header: "rgba(35, 36, 40, 0.98)",
      tabActive: "rgba(64, 66, 73, 0.9)", tabInactive: "#949ba4", tabHover: "rgba(53, 55, 60, 0.8)",
      inputBg: "#1e1f22", inputBorder: "#1e1f22", buttonBg: "#4e5058",
      buttonHover: "#6d6f78", buttonText: "#fff", placeholder: "#87898c",
      accent: "#5865f2", accentHover: "#4752c4",
      toastInfo: "#5865f2", toastSuccess: "#23a559", toastError: "#f23f43",
      online: "#23a559", idle: "#f0b232", dnd: "#f23f43", offline: "#80848e",
      divider: "rgba(255, 255, 255, 0.05)", mention: "#f23f43"
    },
    light: {
      windowBg: "rgba(255, 255, 255, 0.98)", surface: "rgba(242, 243, 245, 0.98)", surfaceAlt: "rgba(227, 229, 232, 0.98)",
      text: "#060607", textMuted: "#4e5058", header: "rgba(242, 243, 245, 0.99)",
      tabActive: "rgba(227, 229, 232, 0.95)", tabInactive: "#4e5058", tabHover: "rgba(235, 237, 239, 0.8)",
      inputBg: "#ebedef", inputBorder: "#cdd0d4", buttonBg: "#5865f2",
      buttonHover: "#4752c4", buttonText: "#fff", placeholder: "#6d6f78",
      accent: "#5865f2", accentHover: "#4752c4",
      toastInfo: "#5865f2", toastSuccess: "#23a559", toastError: "#f23f43",
      online: "#23a559", idle: "#f0b232", dnd: "#f23f43", offline: "#80848e",
      divider: "rgba(0, 0, 0, 0.08)", mention: "#f23f43"
    },
    animated_dark: {
      windowBg: "linear-gradient(135deg, #1e1f22, #2b2d31, #1a1b1e, #232428)",
      bgSize: "400% 400%",
      animation: "foxy-bg-shift 20s ease infinite",
      surface: "rgba(43, 45, 49, 0.75)", surfaceAlt: "rgba(30, 31, 34, 0.85)",
      text: "#dbdee1", textMuted: "#949ba4", header: "rgba(35, 36, 40, 0.85)",
      tabActive: "rgba(88, 101, 242, 0.25)", tabInactive: "#949ba4", tabHover: "rgba(88, 101, 242, 0.12)",
      inputBg: "rgba(30, 31, 34, 0.8)", inputBorder: "rgba(255, 255, 255, 0.05)", buttonBg: "#4e5058",
      buttonHover: "#6d6f78", buttonText: "#fff", placeholder: "#87898c",
      accent: "#5865f2", accentHover: "#4752c4",
      toastInfo: "#5865f2", toastSuccess: "#23a559", toastError: "#f23f43",
      online: "#23a559", idle: "#f0b232", dnd: "#f23f43", offline: "#80848e",
      divider: "rgba(255, 255, 255, 0.05)", mention: "#f23f43"
    },
    animated_light: {
      windowBg: "linear-gradient(135deg, #f2f3f5, #e3e5e8, #f9f9fb, #ebedef)",
      bgSize: "400% 400%",
      animation: "foxy-bg-shift 20s ease infinite",
      surface: "rgba(255, 255, 255, 0.75)", surfaceAlt: "rgba(242, 243, 245, 0.85)",
      text: "#060607", textMuted: "#4e5058", header: "rgba(255, 255, 255, 0.85)",
      tabActive: "rgba(88, 101, 242, 0.15)", tabInactive: "#4e5058", tabHover: "rgba(88, 101, 242, 0.08)",
      inputBg: "rgba(240, 242, 245, 0.8)", inputBorder: "rgba(0, 0, 0, 0.06)", buttonBg: "#f2f3f5",
      buttonHover: "#ebedef", buttonText: "#060607", placeholder: "#6d6f78",
      accent: "#5865f2", accentHover: "#4752c4",
      toastInfo: "#5865f2", toastSuccess: "#23a559", toastError: "#f23f43",
      online: "#23a559", idle: "#f0b232", dnd: "#f23f43", offline: "#80848e",
      divider: "rgba(0, 0, 0, 0.06)", mention: "#f23f43"
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
      windowBg: "rgba(15, 15, 15, 0.96)", surface: "rgba(22, 22, 22, 0.96)", surfaceAlt: "rgba(10, 10, 10, 0.96)",
      text: "#baffda", textMuted: "#7aa890", header: "rgba(28, 28, 28, 0.98)",
      tabActive: "rgba(34, 34, 34, 0.9)", tabInactive: "#7aa890", tabHover: "rgba(42, 42, 42, 0.8)",
      inputBg: "#161616", inputBorder: "#2a2a2a", buttonBg: "#222",
      buttonHover: "#2e2e2e", buttonText: "#baffda", placeholder: "#5a7a6a",
      accent: "#7aff7a", accentHover: "#5dd95d",
      toastInfo: "#6ec6ff", toastSuccess: "#7aff7a", toastError: "#ff7a7a",
      online: "#7aff7a", idle: "#ffd97a", dnd: "#ff7a7a", offline: "#5a7a6a",
      divider: "rgba(122, 168, 144, 0.15)", mention: "#ff7a7a"
    },
    cyberpunk: {
      windowBg: "rgba(26, 21, 35, 0.97)", surface: "rgba(35, 28, 48, 0.97)", surfaceAlt: "rgba(18, 14, 24, 0.97)",
      text: "#ff007f", textMuted: "#8e80a9", header: "rgba(43, 34, 59, 0.98)",
      tabActive: "rgba(255, 0, 127, 0.15)", tabInactive: "#8e80a9", tabHover: "rgba(255, 0, 127, 0.05)",
      inputBg: "#120e18", inputBorder: "#ff007f", buttonBg: "#231c30",
      buttonHover: "#352b48", buttonText: "#00ffff", placeholder: "#5c4e75",
      accent: "#00ffff", accentHover: "#00cccc",
      toastInfo: "#00ffff", toastSuccess: "#39ff14", toastError: "#ff007f",
      online: "#39ff14", idle: "#ffcc00", dnd: "#ff007f", offline: "#5c4e75",
      divider: "rgba(255, 0, 127, 0.2)", mention: "#ff007f"
    },
    synthwave: {
      windowBg: "linear-gradient(135deg, #2b0220, #0c0114, #130030)",
      bgSize: "400% 400%",
      animation: "foxy-bg-shift 15s ease infinite, foxy-pulse-glow 10s ease-in-out infinite",
      surface: "rgba(35, 12, 45, 0.9)", surfaceAlt: "rgba(18, 6, 24, 0.95)",
      text: "#00ffff", textMuted: "#9a6fa5", header: "rgba(22, 5, 30, 0.98)",
      tabActive: "rgba(255, 0, 127, 0.3)", tabInactive: "#9a6fa5", tabHover: "rgba(255, 0, 127, 0.15)",
      inputBg: "#120618", inputBorder: "#ff007f", buttonBg: "#ff007f",
      buttonHover: "#e60073", buttonText: "#fff", placeholder: "#5c2f65",
      accent: "#ff007f", accentHover: "#d6006a",
      toastInfo: "#00ffff", toastSuccess: "#39ff14", toastError: "#ff007f",
      online: "#39ff14", idle: "#ffcc00", dnd: "#ff007f", offline: "#5c2f65",
      divider: "rgba(255, 0, 127, 0.2)", mention: "#ff007f"
    },
    aurora: {
      windowBg: "linear-gradient(180deg, #05161c, #0b221c, #041217)",
      bgSize: "100% 300%",
      animation: "foxy-aurora-glow 18s ease-in-out infinite",
      surface: "rgba(12, 33, 27, 0.9)", surfaceAlt: "rgba(7, 20, 16, 0.95)",
      text: "#aef7e9", textMuted: "#5e8a80", header: "rgba(10, 26, 22, 0.98)",
      tabActive: "rgba(23, 162, 184, 0.3)", tabInactive: "#5e8a80", tabHover: "rgba(23, 162, 184, 0.15)",
      inputBg: "#071410", inputBorder: "#17a2b8", buttonBg: "#17a2b8",
      buttonHover: "#138496", buttonText: "#fff", placeholder: "#3e5d56",
      accent: "#17a2b8", accentHover: "#138496",
      toastInfo: "#17a2b8", toastSuccess: "#28a745", toastError: "#dc3545",
      online: "#28a745", idle: "#ffc107", dnd: "#dc3545", offline: "#3e5d56",
      divider: "rgba(23, 162, 184, 0.2)", mention: "#dc3545"
    },
    nebula: {
      windowBg: "linear-gradient(225deg, #1b0c2a, #0d0415, #081024)",
      bgSize: "400% 400%",
      animation: "foxy-bg-shift 25s ease infinite",
      surface: "rgba(21, 11, 31, 0.9)", surfaceAlt: "rgba(12, 5, 19, 0.95)",
      text: "#dfccff", textMuted: "#796d8e", header: "rgba(15, 7, 24, 0.98)",
      tabActive: "rgba(111, 66, 193, 0.3)", tabInactive: "#796d8e", tabHover: "rgba(111, 66, 193, 0.15)",
      inputBg: "#0c0513", inputBorder: "#6f42c1", buttonBg: "#6f42c1",
      buttonHover: "#5a32a3", buttonText: "#fff", placeholder: "#4c425e",
      accent: "#6f42c1", accentHover: "#5a32a3",
      toastInfo: "#6f42c1", toastSuccess: "#28a745", toastError: "#dc3545",
      online: "#28a745", idle: "#ffc107", dnd: "#dc3545", offline: "#4c425e",
      divider: "rgba(111, 66, 193, 0.2)", mention: "#dc3545"
    },
    twitch: {
      windowBg: "linear-gradient(180deg, #18181b, #0e0e10)",
      surface: "rgba(31, 31, 35, 0.95)", surfaceAlt: "rgba(24, 24, 27, 0.95)",
      text: "#efeff1", textMuted: "#adadb8", header: "rgba(38, 38, 44, 0.97)",
      tabActive: "rgba(145, 71, 255, 0.28)", tabInactive: "#adadb8", tabHover: "rgba(145, 71, 255, 0.15)",
      inputBg: "#18181b", inputBorder: "#3a3a3d", buttonBg: "#9147ff",
      buttonHover: "#772ce8", buttonText: "#ffffff", placeholder: "#8d8d96",
      accent: "#9147ff", accentHover: "#772ce8",
      toastInfo: "#9147ff", toastSuccess: "#00db84", toastError: "#eb0400",
      online: "#00db84", idle: "#f0c000", dnd: "#eb0400", offline: "#8d8d96",
      divider: "rgba(255, 255, 255, 0.08)", mention: "#9147ff"
    },
    imgui: {
      windowBg: "rgba(30, 30, 30, 0.98)", surface: "rgba(45, 45, 45, 0.98)", surfaceAlt: "rgba(36, 36, 36, 0.98)",
      text: "#ffffff", textMuted: "#bdbdbd", header: "rgba(55, 55, 55, 0.98)",
      tabActive: "rgba(66, 150, 250, 0.35)", tabInactive: "#bdbdbd", tabHover: "rgba(66, 150, 250, 0.18)",
      inputBg: "#2a2a2a", inputBorder: "#5a5a5a", buttonBg: "#3f3f46",
      buttonHover: "#4f4f58", buttonText: "#ffffff", placeholder: "#9a9a9a",
      accent: "#4296fa", accentHover: "#2f7fd8",
      toastInfo: "#4296fa", toastSuccess: "#5ec05e", toastError: "#ff5f5f",
      online: "#5ec05e", idle: "#f0c04f", dnd: "#ff5f5f", offline: "#7f7f7f",
      divider: "rgba(255, 255, 255, 0.1)", mention: "#ff8a3d"
    }
  };

  const _windows = {}, _toasts = [];
  const _settings = {
    theme: "dark",
    colors: { ...THEMES.dark },
    font: "'gg sans', 'Segoe UI', system-ui, -apple-system, sans-serif",
    radius: "8px",
    blur: "20px",
    sidebarWidth: "220px",
    bgImage: null,
    autoCheckUpdates: true // Automatic background update checking toggler
  };
  const _plugins = [];
  const _events = {};
  const _keybinds = [];
  const _mergeHistory = [];
  const _commands = [];
  const _members = []; // {id, name, avatar, status, activity}
  const _customSettings = [];
  const _notifications = [];

  // ---------- VECTOR VECTOR ICON DICTIONARY ----------
  const ICONS = {
    hash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg>`,
    volume: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`,
    gear: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
    mic: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`,
    micOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 11a6.9 6.9 0 0 1-1.12 3.8"></path><path d="M19 10v1a7.9 7.9 0 0 1-.39 2.44"></path><path d="M5 10v2a7 7 0 0 0 7 7"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`,
    headset: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>`,
    headsetOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M16 16v3a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path><path d="M3 12a9 9 0 0 1 15-6.7M21 12c0-1.8-.5-3.5-1.4-5"></path></svg>`,
    compass: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>`,
    plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
    phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.5 19.5 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`,
    search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
    bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`,
    send: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`,
    pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-.44-1.24l-2.78-3.58A2 2 0 0 1 15 9.18V5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4.18a2 2 0 0 1-.78 1.24l-2.78 3.58a2 2 0 0 0-.44 1.24z"></path></svg>`,
    power: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>`,
    home: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3.2 3 10.4v9.4h6.6v-6h4.8v6H21v-9.4z"></path></svg>`,
    discord: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.3 4.9a16.7 16.7 0 0 0-4.2-1.3l-.2.3c-.1.3-.3.7-.4 1a15.3 15.3 0 0 0-7 0l-.4-1-.1-.3a16.6 16.6 0 0 0-4.2 1.3A17.6 17.6 0 0 0 2 16.7a16.8 16.8 0 0 0 5.1 2.5l.4-.7.5-.9a10.8 10.8 0 0 1-1.7-.8l.4-.3a12 12 0 0 0 10.6 0l.4.3a10.8 10.8 0 0 1-1.7.8l.5.9.4.7a16.7 16.7 0 0 0 5.1-2.5 17.6 17.6 0 0 0-1.7-11.8ZM9.6 14.3c-1 0-1.8-1-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm4.8 0c-1 0-1.8-1-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z"></path></svg>`,
    user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"></circle><path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8"></path></svg>`,
    palette: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3C7 3 3 6.9 3 11.7c0 2.7 1.9 4.8 4.2 4.8h1.1c1 0 1.8.8 1.8 1.8v.7c0 1.1.9 2 2 2 4.9 0 9-4 9-8.9C21 7 17 3 12 3Z"></path><circle cx="7.5" cy="10" r="1"></circle><circle cx="11" cy="7.5" r="1"></circle><circle cx="15.5" cy="8.5" r="1"></circle><circle cx="17" cy="12.5" r="1"></circle></svg>`,
    monitor: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2.5" y="4" width="19" height="13" rx="2"></rect><path d="M8 20h8M12 17v3"></path></svg>`,
    sparkles: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 1.9 4.8L19 8.7l-4 3.2 1.3 5.1L12 14.2 7.7 17l1.3-5.1-4-3.2 5.1-1.9z"></path></svg>`,
    shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3 5 6v5c0 5 3.4 8.8 7 10 3.6-1.2 7-5 7-10V6z"></path></svg>`,
    wand: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 21 8.5-8.5M14 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1zM18 11l.7 1.3 1.3.7-1.3.7L18 15l-.7-1.3-1.3-.7 1.3-.7z"></path></svg>`,
    box: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8.5 12 3 3 8.5 12 14z"></path><path d="M3 8.5V16l9 5 9-5V8.5"></path></svg>`,
    history: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 3-6.7"></path><path d="M3 3v6h6"></path><path d="M12 7v5l3 2"></path></svg>`,
    chevronDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
    chevronRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`
  };

  function getIcon(name, { size = 16, color = "currentColor" } = {}) {
    const s = ICONS[name] || ICONS.info;
    const temp = document.createElement("div");
    temp.innerHTML = s.trim();
    const svg = temp.firstChild;
    svg.setAttribute("style", `width:${size}px; height:${size}px; color:${color}; display:inline-block; vertical-align:middle;`);
    return svg.outerHTML;
  }

  function resolveIconHTML(source, { size = 16 } = {}) {
    if (!source || typeof source !== "string") return "";
    const candidate = source.trim();
    if (!candidate) return "";
    const iconKey = candidate.startsWith("icon:") ? candidate.slice(5) : candidate;
    if (ICONS[iconKey]) return getIcon(iconKey, { size });
    return `<img src="${candidate}" alt="" style="width:${size}px;height:${size}px;object-fit:contain">`;
  }

  // ---------- STYLE ----------
  const styleEl = document.createElement("style");
  styleEl.id = "foxyui-style";
  document.head.appendChild(styleEl);

  function applyStyle() {
    const c = _settings.colors;
    const bgImgDecl = _settings.bgImage ? `url(${_settings.bgImage})` : 'none';
    const bgSizeDecl = c.bgSize || 'cover';
    const animDecl = c.animation || 'none';

    styleEl.textContent = `
      :root {
        --foxy-bg:${c.windowBg}; --foxy-surface:${c.surface}; --foxy-surface-alt:${c.surfaceAlt};
        --foxy-text:${c.text}; --foxy-text-muted:${c.textMuted}; --foxy-header:${c.header};
        --foxy-accent:${c.accent}; --foxy-accent-hover:${c.accentHover};
        --foxy-divider:${c.divider}; --foxy-online:${c.online}; --foxy-idle:${c.idle};
        --foxy-dnd:${c.dnd}; --foxy-offline:${c.offline}; --foxy-mention:${c.mention};
        --foxy-radius:${_settings.radius};
        --foxy-blur:${_settings.blur};
        --foxy-sidebar-width:${_settings.sidebarWidth};
        --foxy-bg-img:${bgImgDecl};
        --foxy-bg-size:${bgSizeDecl};
        --foxy-bg-anim:${animDecl};
      }
      .foxy-window {
        position: fixed; top: 80px; left: 80px; width: 720px; height: 480px;
        color: var(--foxy-text);
        font-family:${_settings.font};
        border:1px solid var(--foxy-divider); border-radius: var(--foxy-radius);
        box-shadow: 0 16px 48px rgba(0,0,0,0.4);
        display:flex; flex-direction:column; resize: both; overflow: hidden;
        transition: transform .15s, color .2s; z-index:999999;
        backdrop-filter: blur(var(--foxy-blur));
        -webkit-backdrop-filter: blur(var(--foxy-blur));
        
        background-image: var(--foxy-bg-img);
        background-color: transparent;
        background-size: var(--foxy-bg-size);
        background-position: center;
        background-clip: border-box;
        animation: var(--foxy-bg-anim);
      }
      .foxy-window::before {
        content: '';
        position: absolute;
        inset: 0;
        background: var(--foxy-bg);
        z-index: -1;
        animation: inherit;
        background-size: var(--foxy-bg-size);
      }
      .foxy-header {
        background: var(--foxy-header); padding:8px 14px; display:flex; align-items:center;
        gap:10px; cursor: grab; border-bottom: 1px solid var(--foxy-divider); user-select: none;
        min-height: 36px;
      }
      .foxy-header:active { cursor: grabbing; }
      .foxy-title { flex: 1; font-weight:600; color: var(--foxy-text); font-size: 14px;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .foxy-controls { display:flex; gap:8px; align-items: center; }
      .foxy-controls span { cursor: pointer; font-weight: 600; padding: 4px 8px;
        border-radius: 4px; transition: background 0.15s; color: var(--foxy-text-muted);
        font-size: 14px; line-height: 1; }
      .foxy-controls span:hover { background: rgba(255,255,255,0.08); color: var(--foxy-text); }
      .foxy-controls .close:hover { background: var(--foxy-dnd); color:#fff; }

      .foxy-body { flex:1; display:flex; min-height:0; position: relative; }

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
      .foxy-server-icon svg { width: 21px; height: 21px; }
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
        width: var(--foxy-sidebar-width); background: var(--foxy-surface); display:flex; flex-direction:column;
        border-right: 1px solid var(--foxy-divider); overflow:hidden; justify-content: space-between;
      }
      .foxy-channel-header {
        padding: 12px 14px; font-weight:700; font-size:14px; color: var(--foxy-text);
        border-bottom: 1px solid var(--foxy-divider); box-shadow: 0 1px 0 rgba(0,0,0,0.2);
      }
      .foxy-channel-items { flex:1; overflow-y:auto; padding: 8px 6px; }
      .foxy-channel-items::-webkit-scrollbar { width: 4px; }
      .foxy-channel-items::-webkit-scrollbar-thumb { background: var(--foxy-divider); border-radius: 2px; }
      .foxy-channel-cat { color: var(--foxy-text-muted); font-size:11px; text-transform:uppercase;
        font-weight:700; padding: 12px 6px 4px; letter-spacing:.5px; cursor: pointer; display: flex; align-items: center; }
      .foxy-channel-item {
        display:flex; align-items:center; gap:6px; padding: 6px 8px; border-radius:4px;
        color: var(--foxy-text-muted); cursor:pointer; font-size:14px; margin: 1px 0;
        position: relative;
      }
      .foxy-channel-item:hover { background: var(--foxy-tabHover, rgba(255,255,255,0.04)); color: var(--foxy-text); }
      .foxy-channel-item.active { background: rgba(255,255,255,0.08); color: var(--foxy-text); }
      .foxy-channel-item svg { color: var(--foxy-text-muted); }
      .foxy-channel-item:hover svg, .foxy-channel-item.active svg { color: var(--foxy-text); }

      /* Channels Visual States */
      .foxy-channel-item.unread { color: var(--foxy-text); }
      .foxy-channel-item.unread svg { color: var(--foxy-text); }
      .foxy-channel-item.unread::before {
        content: ''; position: absolute; left: -4px; top: 50%; transform: translateY(-50%);
        width: 4px; height: 8px; background: var(--foxy-text); border-radius: 0 4px 4px 0;
      }

      /* Pinned Status Bars inside Channel Sidebar */
      .foxy-voice-bar {
        padding: 10px 12px; background: var(--foxy-surface-alt); border-top: 1px solid var(--foxy-divider);
        display: flex; align-items: center; justify-content: space-between;
      }
      .foxy-user-bar {
        padding: 8px 12px; background: var(--foxy-surface-alt); border-top: 1px solid var(--foxy-divider);
        display: flex; align-items: center; gap: 8px; min-height: 52px; box-sizing: border-box;
      }
      .foxy-user-bar-controls { display: flex; gap: 4px; margin-left: auto; }
      .foxy-user-bar-btn {
        cursor: pointer; padding: 4px; border-radius: 4px; color: var(--foxy-text-muted);
        display: flex; align-items: center; justify-content: center; width: 22px; height: 22px;
        transition: background .12s, color .12s;
      }
      .foxy-user-bar-btn:hover { background: rgba(255,255,255,0.08); color: var(--foxy-text); }

      /* Badges & Counters */
      .foxy-badge {
        background: var(--foxy-dnd); color: #fff; font-size: 10px; padding: 1px 5px;
        border-radius: 10px; font-weight: bold; line-height: 1; min-width: 8px;
        text-align: center; border: 1px solid var(--foxy-surface-alt);
      }
      .foxy-server-icon .foxy-badge {
        position: absolute; bottom: -2px; right: -2px;
      }

      /* Tooltips */
      .foxy-tooltip {
        position: fixed; background: #111214; color: #dbdee1; font-size: 12px; padding: 6px 10px;
        border-radius: 4px; pointer-events: none; z-index: 10000000; box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        transition: opacity 0.15s; font-family: 'gg sans', sans-serif; font-weight: 500;
      }

      /* Inbox Notifications Popout */
      .foxy-inbox-popout {
        position: absolute; top: 40px; right: 10px; width: 280px; max-height: 320px;
        background: var(--foxy-surface-alt); border: 1px solid var(--foxy-divider);
        border-radius: var(--foxy-radius); z-index: 10005; overflow-y: auto;
        box-shadow: 0 12px 36px rgba(0,0,0,0.6); display: flex; flex-direction: column;
      }

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
      .foxy-tab .foxy-tab-icon { display:flex; align-items:center; justify-content:center; width:14px; height:14px; }
      .foxy-tab .foxy-tab-icon svg, .foxy-tab .foxy-tab-icon img { width:14px; height:14px; object-fit:contain; }
      .foxy-tab img { width:14px; height:14px; object-fit:contain; }

      .foxy-content {
        flex:1; padding:14px; overflow:auto; color: var(--foxy-text);
        display:flex; flex-direction:column; gap:8px; font-size:14px; line-height:1.5;
        position: relative; z-index: 1;
      }
      .foxy-content::-webkit-scrollbar { width:8px; }
      .foxy-content::-webkit-scrollbar-thumb { background: var(--foxy-divider); border-radius:4px; }

      .foxy-footer {
        display:flex; gap:8px; padding:10px; background: var(--foxy-surface);
        border-top:1px solid var(--foxy-divider); flex-wrap: wrap;
      }

      /* Member list */
      .foxy-member-list {
        width: var(--foxy-sidebar-width); background: var(--foxy-surface); border-left: 1px solid var(--foxy-divider);
        padding: 12px 0; overflow-y:auto;
      }
      .foxy-member-list::-webkit-scrollbar { width: 4px; }
      .foxy-member-list::-webkit-scrollbar-thumb { background: var(--foxy-divider); border-radius: 2px; }
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
      @keyframes foxy-fade { from { opacity:0; } to { transform:none; opacity:1; } }
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
        backdrop-filter: blur(8px);
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
        padding: 12px 16px; border-radius: var(--foxy-radius); cursor:pointer;
        display:flex; align-items:center; gap:10px; font-size:14px;
        transition: background 0.12s, color 0.12s; margin: 2px 0;
      }
      .foxy-cmdk-item.active, .foxy-cmdk-item:hover {
        background: var(--foxy-accent); color:#fff;
      }
      .foxy-cmdk-item .hint {
        margin-left:auto; font-size:11px; font-family: monospace;
        background: rgba(255, 255, 255, 0.15); padding: 2px 6px; border-radius: 4px;
        color: var(--foxy-text);
      }
      .foxy-cmdk-item.active .hint {
        background: rgba(0, 0, 0, 0.2);
        color: #fff;
      }
      .foxy-cmdk-empty { padding: 24px; text-align:center; color: var(--foxy-text-muted); font-size:14px; }
      .foxy-cmdk-section-header {
        font-size: 11px; text-transform: uppercase; color: var(--foxy-text-muted);
        font-weight: 700; margin: 12px 0 6px 8px; letter-spacing: 0.5px;
      }

      /* Native Dynamic Chat Feed System */
      .foxy-chat-container { display: flex; flex-direction: column; height: 100%; min-height: 0; }
      .foxy-chat-messages { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding: 14px 10px; }
      .foxy-chat-message { display: flex; gap: 12px; align-items: flex-start; padding: 4px 8px; border-radius: 4px; transition: background 0.1s; }
      .foxy-chat-message:hover { background: rgba(255,255,255,0.02); }
      .foxy-chat-avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 600; flex-shrink: 0; overflow: hidden; font-size: 15px; }
      .foxy-chat-avatar img { width: 100%; height: 100%; object-fit: cover; }
      .foxy-chat-msg-header { display: flex; gap: 8px; align-items: baseline; }
      .foxy-chat-author { font-weight: 600; font-size: 14px; color: var(--foxy-text); cursor: pointer; }
      .foxy-chat-author:hover { text-decoration: underline; }
      .foxy-chat-time { font-size: 11px; color: var(--foxy-text-muted); }
      .foxy-chat-msg-text { font-size: 14px; color: var(--foxy-text); margin-top: 2px; white-space: pre-wrap; word-break: break-word; }
      .foxy-chat-input-container { padding: 14px 16px; background: var(--foxy-bg); border-top: 1px solid var(--foxy-divider); }
      .foxy-chat-input-wrap { flex: 1; position: relative; display: flex; align-items: center; }
      .foxy-chat-input-container textarea {
        resize: none; width: 100%; min-height: 40px; max-height: 120px; border-radius: 8px;
        padding: 10px 48px 10px 14px; box-sizing: border-box; background: var(--foxy-surface-alt);
        border: 1px solid var(--foxy-divider); color: var(--foxy-text); font-family: inherit; font-size: 14px; outline: none;
      }
      .foxy-chat-input-container textarea:focus { border-color: var(--foxy-accent); }
      .foxy-chat-action-btn {
        position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
        background: none; border: none; cursor: pointer; color: var(--foxy-text-muted); font-size: 16px;
        display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; transition: background 0.15s, color 0.15s;
      }
      .foxy-chat-action-btn:hover { background: rgba(255,255,255,0.06); color: var(--foxy-text); }

      /* Full Screen Settings Overlay Preset */
      .foxy-settings-viewport {
        position: absolute; inset: 0; background: var(--foxy-bg);
        display: flex; font-family: var(--foxy-font); z-index: 10000;
        animation: foxy-fade-in .15s ease;
      }
      .foxy-settings-sidebar {
        width: 220px; background: var(--foxy-surface-alt); padding: 40px 20px;
        display: flex; flex-direction: column; gap: 4px; border-right: 1px solid var(--foxy-divider);
        overflow-y: auto; box-sizing: border-box;
      }
      .foxy-settings-main {
        flex: 1; padding: 40px 60px; overflow-y: auto; background: var(--foxy-bg);
        position: relative; box-sizing: border-box;
      }
      .foxy-settings-sidebar-header {
        font-size: 11px; text-transform: uppercase; color: var(--foxy-text-muted);
        font-weight: 700; margin: 12px 0 6px 6px; letter-spacing: 0.5px;
      }
      .foxy-settings-sidebar-item {
        padding: 8px 10px; border-radius: 4px; color: var(--foxy-text-muted);
        font-size: 14px; cursor: pointer; transition: background .12s, color .12s;
        display: flex; align-items: center; gap: 8px; font-weight: 500;
      }
      .foxy-settings-sidebar-item:hover { background: rgba(255,255,255,0.04); color: var(--foxy-text); }
      .foxy-settings-sidebar-item.active { background: rgba(255,255,255,0.08); color: var(--foxy-text); }
      
      .foxy-settings-close-btn {
        position: absolute; right: 40px; top: 40px; display: flex; flex-direction: column;
        align-items: center; gap: 4px; cursor: pointer;
      }
      .foxy-settings-close-circle {
        width: 36px; height: 36px; border-radius: 50%; border: 2px solid var(--foxy-text-muted);
        display: flex; align-items: center; justify-content: center; font-size: 16px;
        color: var(--foxy-text-muted); transition: all 0.15s;
      }
      .foxy-settings-close-btn:hover .foxy-settings-close-circle {
        background: rgba(255,255,255,0.05); color: var(--foxy-text); border-color: var(--foxy-text);
      }
      .foxy-settings-close-lbl {
        font-size: 11px; font-weight: 700; color: var(--foxy-text-muted); text-transform: uppercase;
      }
      .foxy-settings-inner-content { max-width: 680px; }
      .foxy-settings-title { margin-top: 0; margin-bottom: 4px; font-size: 20px; font-weight: 700; color: var(--foxy-text); }
      .foxy-settings-subtitle { margin-top: 0; color: var(--foxy-text-muted); font-size: 14px; line-height: 1.45; }
      .foxy-settings-block { margin-top: 22px; background: var(--foxy-surface); border: 1px solid var(--foxy-divider); border-radius: 8px; padding: 16px; }
      .foxy-settings-block-title { font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: .5px; color: var(--foxy-text-muted); margin-bottom: 12px; }
      .foxy-settings-field { display:flex; flex-direction:column; gap:6px; margin-bottom: 14px; }
      .foxy-settings-field:last-child { margin-bottom: 0; }
      .foxy-settings-label { font-size: 12px; font-weight: 700; color: var(--foxy-text-muted); text-transform: uppercase; letter-spacing: .5px; }
      .foxy-settings-row { display:flex; align-items:center; gap: 12px; flex-wrap: wrap; }
      .foxy-account-card { background: linear-gradient(180deg, rgba(88,101,242,0.16), rgba(88,101,242,0.06)); border: 1px solid rgba(88,101,242,0.35); border-radius: 8px; overflow: hidden; margin-bottom: 18px; }
      .foxy-account-banner { height: 72px; background: linear-gradient(135deg, rgba(88,101,242,0.95), rgba(88,101,242,0.55)); }
      .foxy-account-main { display:flex; gap: 16px; align-items:center; padding: 0 16px 16px; margin-top: -34px; }
      .foxy-account-avatar { width: 78px; height: 78px; border-radius: 50%; border: 6px solid var(--foxy-surface); background: var(--foxy-accent); display:flex; align-items:center; justify-content:center; overflow:hidden; font-size: 30px; color:#fff; font-weight:700; flex-shrink: 0; }
      .foxy-account-avatar img { width: 100%; height: 100%; object-fit: cover; }
      .foxy-account-meta { display:flex; flex-direction:column; gap: 2px; }
      .foxy-account-name { font-size: 18px; font-weight: 700; color: var(--foxy-text); line-height: 1.2; }
      .foxy-account-tag { font-size: 13px; color: var(--foxy-text-muted); font-weight: 600; }
      .foxy-account-status { font-size: 12px; color: var(--foxy-online); font-weight: 600; margin-top: 4px; }

      /* Toggle Switches */
      .foxy-switch {
        position: relative; display: inline-block; width: 42px; height: 24px;
      }
      .foxy-switch input { opacity: 0; width: 0; height: 0; }
      .foxy-switch-slider {
        position: absolute; cursor: pointer; inset: 0; background-color: var(--foxy-buttonBg);
        transition: .15s; border-radius: 34px; border: 1px solid var(--foxy-divider);
      }
      .foxy-switch-slider:before {
        position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px;
        background-color: #fff; transition: .15s; border-radius: 50%;
      }
      input:checked + .foxy-switch-slider { background-color: var(--foxy-online); }
      input:checked + .foxy-switch-slider:before { transform: translateX(18px); }

      /* Card layout presets */
      .foxy-card {
        background: var(--foxy-surface); border: 1px solid var(--foxy-divider);
        border-radius: 8px; padding: 16px; display: flex; align-items: center; gap: 16px;
        box-sizing: border-box; margin-bottom: 12px;
      }

      /* Animated Backdrop Keyframes */
      @keyframes foxy-bg-shift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes foxy-aurora-glow {
        0% { background-position: 50% 0%; }
        50% { background-position: 50% 100%; }
        100% { background-position: 50% 0%; }
      }
      @keyframes foxy-pulse-glow {
        0% { filter: hue-rotate(0deg); }
        50% { filter: hue-rotate(15deg) saturate(1.2); }
        100% { filter: hue-rotate(0deg); }
      }

      @keyframes foxy-fade-in {
        from { opacity: 0; transform: scale(1.015); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes foxy-pulse {
        0% { transform: scale(0.95); opacity: 0.6; }
        50% { transform: scale(1.15); opacity: 1; }
        100% { transform: scale(0.95); opacity: 0.6; }
      }
    `;
  }
  applyStyle();

  // ---------- GLOBAL ABSOLUTE TOOLTIP ENGINE ----------
  let tooltipEl = null;
  document.addEventListener("mouseover", e => {
    const target = e.target.closest("[data-tooltip]");
    if (!target) {
      if (tooltipEl) { tooltipEl.remove(); tooltipEl = null; }
      return;
    }
    if (tooltipEl) tooltipEl.remove();

    tooltipEl = document.createElement("div");
    tooltipEl.className = "foxy-tooltip";
    tooltipEl.textContent = target.getAttribute("data-tooltip");
    document.body.appendChild(tooltipEl);

    const rect = target.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();

    let top = rect.top - tooltipRect.height - 8;
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);

    if (top < 8) top = rect.bottom + 8;
    if (left < 8) left = 8;
    if (left + tooltipRect.width > window.innerWidth - 8) left = window.innerWidth - tooltipRect.width - 8;

    tooltipEl.style.top = top + "px";
    tooltipEl.style.left = left + "px";
  });

  document.addEventListener("mouseout", e => {
    const target = e.target.closest("[data-tooltip]");
    if (target && tooltipEl) {
      tooltipEl.remove();
      tooltipEl = null;
    }
  });

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

  // ---------- DYNAMIC COMMAND PALETTE ----------
  function registerCommand({ id, label, hint = "", category = "General", onRun }) {
    _commands.push({ id, label, hint, category, onRun });
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
      filtered = _commands.filter(c => !q || c.label.toLowerCase().includes(q) || (c.hint && c.hint.toLowerCase().includes(q)));
      if (filtered.length === 0) { list.innerHTML = `<div class="foxy-cmdk-empty">No commands</div>`; return; }
      if (activeIdx >= filtered.length) activeIdx = 0;

      // Group commands by category (Shadcn cmdk style)
      const categories = {};
      filtered.forEach((c, idx) => {
        const cat = c.category || "General";
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push({ cmd: c, idx });
      });

      let html = "";
      for (const catName in categories) {
        html += `<div class="foxy-cmdk-section-header">${catName}</div>`;
        categories[catName].forEach(({ cmd, idx }) => {
          html += `
            <div class="foxy-cmdk-item ${idx === activeIdx ? 'active' : ''}" data-i="${idx}">
              <span class="foxy-cmdk-item-label">${cmd.label}</span>
              ${cmd.hint ? `<span class="hint">${cmd.hint}</span>` : ''}
            </div>
          `;
        });
      }
      list.innerHTML = html;

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

  // ---------- NOTIFICATION MANAGER ----------
  function notify(message, options = {}) {
    const author = options.author || "System";
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const notificationObj = { author, message, timestamp };
    _notifications.push(notificationObj);

    const hasOpenWindows = Object.keys(_windows).length > 0;
    if (hasOpenWindows) {
      // Increment Inbox badge counters on all open Discord-layout windows
      for (const winId in _windows) {
        const win = _windows[winId];
        const badge = win.el.querySelector(".foxy-inbox-badge");
        if (badge) {
          badge.style.display = "inline-flex";
          const currentCount = parseInt(badge.textContent || "0");
          badge.textContent = currentCount + 1;
        }
      }
      emit("notificationReceived", notificationObj);
    } else {
      // Fallback: If closed (no windows on screen), fallback to standard toast notification
      showToast(`${author}: ${message}`, { type: "info" });
    }
  }

  // ---------- SYSTEM UPDATE CHECKER ----------
  async function checkForUpdates(silent = false) {
    const updateMetaURL = "https://raw.githubusercontent.com/Zirmith/FoxyUI-JS-UI-LIB/refs/heads/main/updater.js";
    const fallbackLibURL = "https://raw.githubusercontent.com/Zirmith/FoxyUI-JS-UI-LIB/refs/heads/main/foxyui.js";

    try {
      const response = await fetch(updateMetaURL, { cache: "no-cache" });
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      const text = await response.text();

      // Extract raw remote version matches
      let remoteVersion = null;
      const metaMatch = text.match(/version:\s*([0-9.]+)/i);
      const libMatch = text.match(/_version:\s*([0-9.]+)/i);
      const commentMatch = text.match(/FoxyUI\s+v([0-9.]+)/i);

      if (metaMatch) remoteVersion = parseFloat(metaMatch[1]);
      else if (libMatch) remoteVersion = parseFloat(libMatch[1]);
      else if (commentMatch) remoteVersion = parseFloat(commentMatch[1]);

      if (!remoteVersion || isNaN(remoteVersion)) {
        if (!silent) showToast("Could not parse remote version metrics.", { type: "error" });
        return null;
      }

      const localVersion = window.FoxyUI ? window.FoxyUI._version : 23;
      const updateAvailable = remoteVersion > localVersion;

      // Extract remote changelog strings
      let changelog = [];
      const changelogMatch = text.match(/changelog:\s*\[([\s\S]*?)\]/);
      if (changelogMatch) {
        try {
          changelog = changelogMatch[1]
            .split(",")
            .map(s => s.trim().replace(/^["']|["']$/g, ""))
            .filter(Boolean);
        } catch (e) {}
      }

      if (updateAvailable) {
        if (silent) {
          showToast(`FoxyUI v${remoteVersion} update is available! Check your settings menu.`, { 
            type: "info", 
            persistent: true,
            icon: getIcon("bell", {size: 14})
          });
        } else {
          showModal({
            title: `Update Available — FoxyUI v${remoteVersion}`,
            body: `
              <div>
                <p>A new release is available! (Installed: <strong>v${localVersion}</strong>, Available: <strong style="color:var(--foxy-online)">v${remoteVersion}</strong>).</p>
                ${changelog.length > 0 ? `
                  <div style="background:var(--foxy-surface-alt); border:1px solid var(--foxy-divider); border-radius:6px; padding:12px; margin-top:12px;">
                    <div style="font-weight:700; font-size:12px; text-transform:uppercase; color:var(--foxy-accent); margin-bottom:6px">Changelog:</div>
                    <ul style="margin:0; padding-left:18px; font-size:13px; color:var(--foxy-text-muted); line-height:1.5;">
                      ${changelog.map(item => `<li>${item}</li>`).join("")}
                    </ul>
                  </div>
                ` : ""}
              </div>
            `,
            buttons: [
              { label: "Dismiss", variant: "secondary" },
              { 
                label: "Update Now", 
                onClick: () => {
                  showToast("Applying live update...", { type: "info" });
                  const script = document.createElement("script");
                  script.src = fallbackLibURL;
                  document.head.appendChild(script);
                }
              }
            ]
          });
        }
        return { available: true, version: remoteVersion, changelog };
      } else {
        if (!silent) {
          showToast(`FoxyUI is currently up to date (v${localVersion}).`, { type: "success" });
        }
        return { available: false, version: remoteVersion };
      }
    } catch (err) {
      console.error("[FoxyUI Update Check Failed]", err);
      if (!silent) {
        showToast("Unable to check repository for system updates.", { type: "error" });
      }
      return null;
    }
  }

  // ---------- CUSTOM SETTINGS API ----------
  function registerSettingsSection({ id, label, category = "USER SETTINGS", render }) {
    if (_customSettings.some(s => s.id === id)) return;
    _customSettings.push({ id, label, category, render });
  }

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
   *   layout: "discord" | null,
   *   servers:[{id, name, icon?, iconKey?, home?, onClick?}],
   *   channels:[{id, name, category?, onClick?}],
   *   members: boolean | array — whether to show member list (or pass array directly),
   *   memberList: optional explicit member array (else uses global _members)
   *   tabs: [{name, html, icon?}, ...] — direct instantiation declaration,
   *   currentUser: optional object representing local active user identity
   * })
   */
  function createWindow(options = {}) {
    const {
      title = "Foxy Window", width = 720, height = 480, icon = null,
      resizable = true, movable = true, minimizable = true, defaultTab = 0,
      servers = null, channels = null, members = false, memberList = null,
      layout = null, tabs = null, currentUser = null,
      onClose, onOpen
    } = options;

    let finalServers = servers;
    let finalChannels = channels;
    let finalMembers = members;
    let finalUser = currentUser;

    // Apply "discord" layout presets
    if (layout === "discord") {
      if (finalServers === null) {
        finalServers = [
          { id: "home", name: "Home", iconKey: "discord", home: true, active: true },
          { divider: true },
          { id: "friends", name: "Friends", iconKey: "user" },
          { id: "discover", name: "Discover", iconKey: "compass" },
          { id: "downloads", name: "Downloads", iconKey: "monitor" }
        ];
      }
      if (finalChannels === null) finalChannels = [];
      if (finalMembers === false) finalMembers = true;
      if (finalUser === null) {
        finalUser = { name: "Guest Fox", tag: "0001", status: "online", muted: false, deafened: false };
      }
    }

    const el = document.createElement("div");
    el.className = "foxy-window";
    el.style.width = width + "px"; el.style.height = height + "px";
    el.style.left = (80 + Object.keys(_windows).length * 30) + "px";
    el.style.top = (80 + Object.keys(_windows).length * 30) + "px";

    el.innerHTML = `
      <div class="foxy-header">
        ${icon ? resolveIconHTML(icon, { size: 18 }) : ''}
        <div class="foxy-title">${title}</div>
        <div class="foxy-controls">
          ${layout === "discord" ? `
            <span class="foxy-inbox-btn" title="Inbox" style="cursor:pointer; position:relative; display:inline-flex; align-items:center;">
              ${getIcon("bell", {size:15})}
              <span class="foxy-inbox-badge" style="display:none; position:absolute; top:-4px; right:-4px; background:var(--foxy-dnd); color:#fff; font-size:8px; border-radius:50%; width:10px; height:10px; align-items:center; justify-content:center; line-height:1;"></span>
            </span>
          ` : ''}
          ${minimizable ? '<span class="minimize" title="Minimize">—</span>' : ''}
          <span class="close" title="Close">${getIcon("close", {size:14})}</span>
        </div>
      </div>
      <div class="foxy-body">
        ${finalServers ? '<div class="foxy-server-rail"></div>' : ''}
        ${finalChannels ? `
          <div class="foxy-channel-list">
            <div class="foxy-channel-header"></div>
            <div class="foxy-channel-items"></div>
            <div class="foxy-voice-bar" style="display:none;"></div>
            <div class="foxy-user-bar" style="display:none;"></div>
          </div>
        ` : ''}
        <div class="foxy-main">
          <div class="foxy-tabbar"></div>
          <div class="foxy-content"></div>
          <div class="foxy-footer"></div>
        </div>
        ${finalMembers ? '<div class="foxy-member-list"></div>' : ''}
      </div>
    `;
    document.body.appendChild(el);
    const id = "win_" + Date.now() + Math.random().toString(36).slice(2, 6);
    const windowTabs = [];

    const winAPI = {
      id, el, tabs: windowTabs, title,
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
        if (icon) {
          const iconWrap = document.createElement("span");
          iconWrap.className = "foxy-tab-icon";
          iconWrap.innerHTML = resolveIconHTML(icon, { size: 14 });
          if (iconWrap.innerHTML.trim()) tab.appendChild(iconWrap);
        }
        const span = document.createElement("span"); span.className = "foxy-tab-label"; span.textContent = name; tab.appendChild(span);
        this.tabbar.appendChild(tab);
        const tabObj = { el: tab, name, html, icon };
        windowTabs.push(tabObj);
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
        if (windowTabs.length - 1 === defaultTab) tab.click();
        _plugins.forEach(p => p.onTabAdd?.(winAPI, tabObj));
        return tabObj;
      },
      removeTab(tabObj) {
        const idx = windowTabs.indexOf(tabObj); if (idx === -1) return;
        tabObj.el.remove(); windowTabs.splice(idx, 1);
        if (windowTabs.length > 0) windowTabs[Math.max(0, idx - 1)].el.click();
        emit("tabRemoved", winAPI, tabObj);
      },
      editTab(tabObj, { name, html, icon }) {
        if (name) { tabObj.name = name; tabObj.el.querySelector(".foxy-tab-label").textContent = name; }
        if (html) { tabObj.html = html; if (tabObj.el.classList.contains("active")) this.setContent(html); }
        if (icon !== undefined) {
          tabObj.icon = icon;
          const oldIcon = tabObj.el.querySelector(".foxy-tab-icon");
          if (oldIcon) oldIcon.remove();
          if (icon) {
            const iconWrap = document.createElement("span");
            iconWrap.className = "foxy-tab-icon";
            iconWrap.innerHTML = resolveIconHTML(icon, { size: 14 });
            if (iconWrap.innerHTML.trim()) tabObj.el.insertBefore(iconWrap, tabObj.el.firstChild);
          }
        }
        emit("tabEdited", winAPI, tabObj);
      },
      setServers(list) {
        if (!this.serverRail) return;
        this.serverRail.innerHTML = "";
        list.forEach((s, i) => {
          if (s.divider) { const d = document.createElement("div"); d.className = "foxy-server-divider"; this.serverRail.appendChild(d); return; }
          const ic = document.createElement("div"); ic.className = "foxy-server-icon" + (s.active ? " active" : "");
          ic.title = s.name || "";
          ic.dataset.id = s.id || `s_${i}`;
          if (s.iconKey || s.home || (typeof s.icon === "string" && (s.icon.startsWith("icon:") || ICONS[s.icon]))) {
            const iconMarkup = resolveIconHTML(s.iconKey || s.icon || (s.home ? "home" : null), { size: 20 });
            if (iconMarkup) ic.innerHTML = iconMarkup;
          } else if (s.icon) {
            ic.innerHTML = `<img src="${s.icon}" alt="${s.name||''}">`;
          } else {
            ic.textContent = (s.name || "?").slice(0, 2).toUpperCase();
          }
          if (s.badgeCount) {
            const b = document.createElement("span");
            b.className = "foxy-badge";
            b.textContent = s.badgeCount;
            ic.appendChild(b);
          }
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
        
        // Track categories and their child items for collapsible accordion logic
        let currentCatEl = null;
        let currentCatName = null;

        list.forEach((c, i) => {
          if (c.category && c.category !== currentCatName) {
            currentCatName = c.category;
            const ch = document.createElement("div"); 
            ch.className = "foxy-channel-cat";
            ch.innerHTML = `${getIcon("chevronDown", {size: 10, color: "var(--foxy-text-muted)"})} <span style="margin-left: 4px;">${c.category}</span>`;
            items.appendChild(ch);
            currentCatEl = ch;
            
            // Toggle accordion state
            ch.onclick = () => {
              const isCollapsed = ch.classList.toggle("collapsed");
              ch.innerHTML = `${getIcon(isCollapsed ? "chevronRight" : "chevronDown", {size: 10, color: "var(--foxy-text-muted)"})} <span style="margin-left: 4px;">${c.category}</span>`;
              
              let sibling = ch.nextElementSibling;
              while (sibling && !sibling.classList.contains("foxy-channel-cat")) {
                sibling.style.display = isCollapsed ? "none" : "";
                sibling = sibling.nextElementSibling;
              }
            };
          }
          const it = document.createElement("div");
          it.className = "foxy-channel-item" + (c.active ? " active" : "");
          it.dataset.id = c.id || `c_${i}`;
          it.dataset.category = c.category || "";
          if (c.unread) it.classList.add("unread");

          const targetIcon = c.type === "voice" ? "volume" : "hash";
          it.innerHTML = `${getIcon(targetIcon, {size:15})} <span style="margin-left:4px;">${c.name}</span>`;
          if (c.badgeCount) {
            const b = document.createElement("span");
            b.className = "foxy-badge";
            b.style.position = "static";
            b.style.marginLeft = "auto";
            b.textContent = c.badgeCount;
            it.appendChild(b);
          }
          it.onclick = () => {
            items.querySelectorAll(".foxy-channel-item").forEach(e => e.classList.remove("active"));
            it.classList.add("active");
            c.onClick?.(c);
            emit("channelClicked", winAPI, c);
          };
          
          if (currentCatEl && currentCatEl.classList.contains("collapsed")) {
            it.style.display = "none";
          }

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
      setUserProfile(user) {
        const userBar = el.querySelector(".foxy-user-bar");
        if (!userBar) return;
        if (!user) { userBar.style.display = "none"; return; }
        userBar.style.display = "flex";
        
        const avatarContent = user.avatar ? `<img src="${user.avatar}">` : (user.name || "?").slice(0, 1).toUpperCase();
        const muteIcon = user.muted ? getIcon("micOff", {size:15}) : getIcon("mic", {size:15});
        const deafIcon = user.deafened ? getIcon("headsetOff", {size:15}) : getIcon("headset", {size:15});

        userBar.innerHTML = `
          <div class="foxy-avatar" style="width:32px; height:32px; background:${stringToColor(user.name)}">
            ${avatarContent}
            <span class="status-dot ${user.status || 'online'}"></span>
          </div>
          <div class="foxy-member-info" style="gap:0">
            <div class="foxy-member-name" style="font-weight:600; font-size:13px">${user.name}</div>
            <div class="foxy-member-activity" style="font-size:11px">#${user.tag || "0001"}</div>
          </div>
          <div class="foxy-user-bar-controls">
            <div class="foxy-user-bar-btn toggle-mic" title="Mute/Unmute">${muteIcon}</div>
            <div class="foxy-user-bar-btn toggle-deaf" title="Deafen/Undeafen">${deafIcon}</div>
            <div class="foxy-user-bar-btn open-user-settings" title="User Settings">${getIcon("gear", {size:15})}</div>
          </div>
        `;

        userBar.querySelector(".toggle-mic").onclick = () => {
          user.muted = !user.muted;
          this.setUserProfile(user);
          emit("userMuteToggled", winAPI, user);
        };
        userBar.querySelector(".toggle-deaf").onclick = () => {
          user.deafened = !user.deafened;
          this.setUserProfile(user);
          emit("userDeafenToggled", winAPI, user);
        };
        userBar.querySelector(".open-user-settings").onclick = () => {
          this.openSettings();
        };
      },
      setVoiceState(connected, channelName = "") {
        const voiceBar = el.querySelector(".foxy-voice-bar");
        if (!voiceBar) return;
        if (!connected) { voiceBar.style.display = "none"; return; }
        voiceBar.style.display = "flex";
        voiceBar.innerHTML = `
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="display:inline-block; width:8px; height:8px; background:var(--foxy-online); border-radius:50%; animation: foxy-pulse 1.5s infinite"></span>
            <div style="display:flex; flex-direction:column;">
              <span style="font-weight:600; font-size:12px; color:var(--foxy-online)">Voice Connected</span>
              <span style="font-size:10px; color:var(--foxy-text-muted)">${channelName}</span>
            </div>
          </div>
          <div class="foxy-user-bar-btn disconnect-voice" title="Disconnect" style="color:var(--foxy-dnd); margin-left:auto;">${getIcon("power", {size:15})}</div>
        `;
        voiceBar.querySelector(".disconnect-voice").onclick = () => {
          this.setVoiceState(false);
          emit("voiceDisconnected", winAPI);
        };
      },
      setServerBadge(serverId, count = 0) {
        if (!this.serverRail) return;
        const ic = this.serverRail.querySelector(`.foxy-server-icon[data-id="${serverId}"]`);
        if (!ic) return;
        let b = ic.querySelector(".foxy-badge");
        if (count <= 0) { if (b) b.remove(); }
        else {
          if (!b) { b = document.createElement("span"); b.className = "foxy-badge"; ic.appendChild(b); }
          b.textContent = count;
        }
      },
      setChannelBadge(channelId, count = 0, isUnread = false) {
        if (!this.channelList) return;
        const it = this.channelList.querySelector(`.foxy-channel-item[data-id="${channelId}"]`);
        if (!it) return;
        if (isUnread) it.classList.add("unread"); else it.classList.remove("unread");
        let b = it.querySelector(".foxy-badge");
        if (count <= 0) { if (b) b.remove(); }
        else {
          if (!b) {
            b = document.createElement("span"); b.className = "foxy-badge";
            b.style.position = "static"; b.style.marginLeft = "auto";
            it.appendChild(b);
          }
          b.textContent = count;
        }
      },
      createChatFeed(messages = [], onSendMessage = null) {
        const container = document.createElement("div");
        container.className = "foxy-chat-container";
        const msgList = document.createElement("div");
        msgList.className = "foxy-chat-messages";
        const inputWrap = document.createElement("div");
        inputWrap.className = "foxy-chat-input-container";
        inputWrap.innerHTML = `
          <div class="foxy-chat-input-wrap">
            <textarea placeholder="Send a message..."></textarea>
            <button class="foxy-chat-action-btn" title="Send message">${getIcon("send", {size:16})}</button>
          </div>
        `;
        container.appendChild(msgList);
        container.appendChild(inputWrap);

        const renderMessages = (list) => {
          msgList.innerHTML = list.map(m => {
            const authorColor = stringToColor(m.author);
            const avText = (m.author || "?").slice(0, 1).toUpperCase();
            const avImg = m.avatar ? `<img src="${m.avatar}">` : avText;
            const mentionStyle = m.isMentioned ? "background:rgba(242, 63, 67, 0.15); border-left:3px solid var(--foxy-mention);" : "";
            return `
              <div class="foxy-chat-message" style="${mentionStyle}">
                <div class="foxy-chat-avatar" style="background:${authorColor}">
                  ${avImg}
                </div>
                <div style="flex:1; min-width:0;">
                  <div class="foxy-chat-msg-header">
                    <span class="foxy-chat-author">${m.author}</span>
                    <span class="foxy-chat-time">${m.timestamp || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div class="foxy-chat-msg-text">${m.text}</div>
                </div>
              </div>
            `;
          }).join("");
          msgList.scrollTop = msgList.scrollHeight;
        };

        const txt = inputWrap.querySelector("textarea");
        const submitBtn = inputWrap.querySelector(".foxy-chat-action-btn");
        const handleSend = () => {
          const text = txt.value.trim(); if (!text) return;
          txt.value = ""; onSendMessage?.(text);
        };
        txt.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } });
        submitBtn.onclick = handleSend;
        renderMessages(messages);

        return {
          el: container,
          updateMessages(newList) { renderMessages(newList); }
        };
      },
      openSettings() {
        const user = finalUser;
        const view = document.createElement("div");
        view.className = "foxy-settings-viewport";
        
        // Build settings sidebars dynamically from default sections and custom segments
        const defaultSections = [
          { id: "my-account", label: "My Account", category: "User Settings", icon: "user" },
          { id: "appearance", label: "Appearance", category: "App Settings", icon: "palette" },
          { id: "voice", label: "Voice & Video", category: "App Settings", icon: "headset" },
          { id: "plugins", label: "Plugins", category: "App Settings", icon: "box" },
          { id: "updates", label: "Updates", category: "App Settings", icon: "history" }, // Integrated section
          { id: "changelog", label: "Changelog", category: "Information", icon: "sparkles" },
          { id: "about", label: "About FoxyUI", category: "Information", icon: "discord" }
        ];
        const allSections = [...defaultSections, ..._customSettings];
        
        const groups = {};
        allSections.forEach(s => {
          if (!groups[s.category]) groups[s.category] = [];
          groups[s.category].push(s);
        });

        let navHTML = "";
        for (const cat in groups) {
          navHTML += `<div class="foxy-settings-sidebar-header">${cat}</div>`;
          groups[cat].forEach(s => {
            navHTML += `<div class="foxy-settings-sidebar-item" data-section="${s.id}">${getIcon(s.icon || "gear", {size: 15})}<span>${s.label}</span></div>`;
          });
        }

        view.innerHTML = `
          <div class="foxy-settings-sidebar">
            ${navHTML}
          </div>
          <div class="foxy-settings-main">
            <div class="foxy-settings-close-btn">
              <div class="foxy-settings-close-circle">✕</div>
              <div class="foxy-settings-close-lbl">ESC</div>
            </div>
            <div class="foxy-settings-inner-content"></div>
          </div>
        `;

        el.appendChild(view);
        const inner = view.querySelector(".foxy-settings-inner-content");
        
        const getSettingContent = (sectionKey, user) => {
          const custom = _customSettings.find(s => s.id === sectionKey);
          if (custom && typeof custom.render === "function") {
            return custom.render(winAPI);
          }

          if (sectionKey === "my-account") {
            return `
              <h2 class="foxy-settings-title">My Account</h2>
              <p class="foxy-settings-subtitle">Update your profile details and personalize how your identity appears across Discord-style layouts.</p>
              <div class="foxy-account-card">
                <div class="foxy-account-banner"></div>
                <div class="foxy-account-main">
                  <div class="foxy-account-avatar" style="background:${stringToColor(user.name)}">
                    ${user.avatar ? `<img src="${user.avatar}">` : (user.name || "?").slice(0, 1).toUpperCase()}
                  </div>
                  <div class="foxy-account-meta">
                    <div class="foxy-account-name">${user.name}</div>
                    <div class="foxy-account-tag">#${user.tag || "0001"}</div>
                    <div class="foxy-account-status">● Active Profile</div>
                  </div>
                </div>
              </div>
              <div class="foxy-settings-block">
                <div class="foxy-settings-block-title">Profile Settings</div>
                <div class="foxy-settings-field">
                  <label class="foxy-settings-label">Display Name</label>
                  <input type="text" id="setting-input-name" value="${user.name}" style="max-width:320px">
                </div>
                <div class="foxy-settings-field">
                  <label class="foxy-settings-label">Custom Tag</label>
                  <input type="text" id="setting-input-tag" value="${user.tag || "0001"}" style="max-width:320px">
                </div>
                <button id="setting-save-account" style="max-width:140px; margin-top:10px">Save Changes</button>
              </div>
            `;
          }
          if (sectionKey === "appearance") {
            const themesList = Object.keys(THEMES).map(t => `<option value="${t}" ${_settings.theme === t ? 'selected' : ''}>${t.charAt(0).toUpperCase() + t.slice(1)}</option>`).join("");
            return `
              <h2 class="foxy-settings-title">Appearance</h2>
              <p class="foxy-settings-subtitle">Tune colors and layout controls to match a modern Discord-like client experience.</p>
              <div class="foxy-settings-block">
                <div class="foxy-settings-block-title">Theme</div>
                <div class="foxy-settings-field">
                  <label class="foxy-settings-label">System Theme</label>
                  <select id="setting-select-theme" style="max-width:320px">
                    ${themesList}
                  </select>
                </div>
                <div class="foxy-settings-field">
                  <label class="foxy-settings-label">Accent Color</label>
                  <div class="foxy-settings-row">
                    <input type="color" id="setting-color-accent" value="${_settings.colors.accent}" style="width:60px; height:36px; padding:0; cursor:pointer; border:none; background:none">
                    <span style="font-family:monospace; font-size:14px">${_settings.colors.accent}</span>
                  </div>
                </div>
              </div>
              <div class="foxy-settings-block">
                <div class="foxy-settings-block-title">Layout</div>
                <div class="foxy-settings-field">
                  <label class="foxy-settings-label">Backdrop Blur (${_settings.blur})</label>
                  <div class="foxy-settings-row">
                    <input type="range" id="setting-range-blur" min="0" max="40" value="${parseInt(_settings.blur)}" style="max-width:240px">
                    <span>${_settings.blur}</span>
                  </div>
                </div>
                <div class="foxy-settings-field">
                  <label class="foxy-settings-label">Sidebar Width (${_settings.sidebarWidth})</label>
                  <div class="foxy-settings-row">
                    <input type="range" id="setting-range-sidebar" min="180" max="320" value="${parseInt(_settings.sidebarWidth)}" style="max-width:240px">
                    <span>${_settings.sidebarWidth}</span>
                  </div>
                </div>
                <div class="foxy-settings-field">
                  <label class="foxy-settings-label">Window Border Radius</label>
                  <select id="setting-select-radius" style="max-width:320px">
                    <option value="0px" ${_settings.radius === '0px' ? 'selected' : ''}>None (Sharp Corners)</option>
                    <option value="4px" ${_settings.radius === '4px' ? 'selected' : ''}>Subtle (4px)</option>
                    <option value="8px" ${_settings.radius === '8px' ? 'selected' : ''}>Standard Rounded (8px)</option>
                    <option value="16px" ${_settings.radius === '16px' ? 'selected' : ''}>Ultra Rounded (16px)</option>
                  </select>
                </div>
                <div class="foxy-settings-field">
                  <label class="foxy-settings-label">Custom Background Image URL</label>
                  <input type="text" id="setting-input-bgimg" value="${_settings.bgImage || ''}" placeholder="https://example.com/image.png" style="max-width:320px">
                </div>
              </div>
            `;
          }
          if (sectionKey === "voice") {
            return `
              <h2 style="margin-top:0; font-size:20px; font-weight:700">Voice & Video</h2>
              <p style="color:var(--foxy-text-muted); font-size:14px">Configure connection settings and sound thresholds.</p>
              <div style="margin-top:24px; display:flex; flex-direction:column; gap:16px">
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--foxy-surface-alt); padding:14px 16px; border-radius:6px; border:1px solid var(--foxy-divider);">
                  <div>
                    <div style="font-weight:600; font-size:14px">Mute Input Microphone</div>
                    <div style="font-size:12px; color:var(--foxy-text-muted)">Prevents sending local audio feeds to voice channels.</div>
                  </div>
                  <label class="foxy-switch">
                    <input type="checkbox" id="setting-check-mute" ${user.muted ? 'checked' : ''}>
                    <span class="foxy-switch-slider"></span>
                  </label>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--foxy-surface-alt); padding:14px 16px; border-radius:6px; border:1px solid var(--foxy-divider);">
                  <div>
                    <div style="font-weight:600; font-size:14px">Deafen Output Audio</div>
                    <div style="font-size:12px; color:var(--foxy-text-muted)">Silences all virtual voice outputs.</div>
                  </div>
                  <label class="foxy-switch">
                    <input type="checkbox" id="setting-check-deaf" ${user.deafened ? 'checked' : ''}>
                    <span class="foxy-switch-slider"></span>
                  </label>
                </div>
              </div>
            `;
          }
          if (sectionKey === "plugins") {
            const pluginRows = _plugins.map((p, idx) => `
              <div class="foxy-card" style="justify-content:space-between; align-items:center;">
                <div style="display:flex; flex-direction:column; gap:2px;">
                  <div style="font-weight:700; font-size:15px; color:var(--foxy-text);">${p.name} <span style="font-size:11px; color:var(--foxy-text-muted); font-weight:normal;">v${p.version}</span></div>
                  <div style="font-size:12px; color:var(--foxy-text-muted); margin-top:2px;">${p.description}</div>
                  <div style="font-size:11px; color:var(--foxy-accent); margin-top:4px;">By: ${p.author}</div>
                </div>
                <label class="foxy-switch">
                  <input type="checkbox" class="setting-plugin-toggle" data-idx="${idx}" ${p.enabled ? 'checked' : ''}>
                  <span class="foxy-switch-slider"></span>
                </label>
              </div>
            `).join("");

            return `
              <h2 style="margin-top:0; font-size:20px; font-weight:700">Plugins</h2>
              <p style="color:var(--foxy-text-muted); font-size:14px; margin-bottom:20px">Enable or disable third-party system visual components.</p>
              <div>
                ${pluginRows || `<div style="text-align:center; padding:30px; color:var(--foxy-text-muted);">No plugins loaded.</div>`}
              </div>
            `;
          }
          if (sectionKey === "updates") {
            return `
              <h2 style="margin-top:0; font-size:20px; font-weight:700">System Updates</h2>
              <p style="color:var(--foxy-text-muted); font-size:14px">Manage automatic initialization scans and live installation settings.</p>
              <div style="margin-top:24px; display:flex; flex-direction:column; gap:16px">
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--foxy-surface-alt); padding:14px 16px; border-radius:6px; border:1px solid var(--foxy-divider);">
                  <div>
                    <div style="font-weight:600; font-size:14px">Automatically Check for Updates</div>
                    <div style="font-size:12px; color:var(--foxy-text-muted)">Checks the remote repository on initialization.</div>
                  </div>
                  <label class="foxy-switch">
                    <input type="checkbox" id="setting-check-autoupdate" ${_settings.autoCheckUpdates ? 'checked' : ''}>
                    <span class="foxy-switch-slider"></span>
                  </label>
                </div>
                <div class="foxy-card" style="flex-direction:column; align-items:flex-start; gap:12px; background:var(--foxy-surface-alt);">
                  <div style="font-weight:700; font-size:15px">Manual Check</div>
                  <div style="font-size:13px; color:var(--foxy-text-muted)">Query the remote repository manually to retrieve the latest patch release.</div>
                  <button id="setting-btn-checknow" style="margin-top:4px;">Check Now</button>
                </div>
              </div>
            `;
          }
          if (sectionKey === "changelog") {
            return `
              <h2 style="margin-top:0; font-size:20px; font-weight:700">Changelog — Version History</h2>
              <div style="margin-top:20px; display:flex; flex-direction:column; gap:20px">
                <div>
                  <div style="background:var(--foxy-accent); color:#fff; display:inline-block; font-size:11px; font-weight:700; padding:2px 8px; border-radius:10px; text-transform:uppercase; margin-bottom:8px">v23.0 Discord UI Refresh</div>
                  <h3 style="margin:0 0 6px 0; font-size:16px">Discord-style Icons & Settings Polish</h3>
                  <p style="color:var(--foxy-text-muted); font-size:14px; margin:0 0 8px 0">Released on June 1, 2026.</p>
                  <ul style="margin:0; padding-left:20px; color:var(--foxy-text); font-size:13px; line-height:1.6">
                    <li><strong>Expanded Built-in Icons:</strong> Added Discord-oriented icon keys including home, Discord mark, user, palette, monitor, history, and more.</li>
                    <li><strong>Server Rail Icon Support:</strong> Server and tab icons now support both image URLs and built-in icon keys via <code>icon</code>/<code>iconKey</code>.</li>
                    <li><strong>My Account Redesign:</strong> Introduced a Discord-like account card with banner, profile avatar treatment, and grouped profile controls.</li>
                    <li><strong>Appearance & Settings Restyle:</strong> Upgraded settings navigation and appearance controls with cleaner Discord-inspired sections and hierarchy.</li>
                  </ul>
                </div>
                <hr style="border:0; border-top:1px solid var(--foxy-divider); margin:10px 0">
                <div>
                  <div style="background:var(--foxy-surface-alt); color:var(--foxy-text-muted); display:inline-block; font-size:11px; font-weight:700; padding:2px 8px; border-radius:10px; text-transform:uppercase; margin-bottom:8px">v22.0 Archive</div>
                  <h3 style="margin:0 0 6px 0; font-size:16px">Parity Fluid Animated Themes</h3>
                </div>
              </div>
            `;
          }
          if (sectionKey === "about") {
            return `
              <h2 style="margin-top:0; font-size:20px; font-weight:700">About FoxyUI</h2>
              <p style="color:var(--foxy-text-muted); font-size:14px">FoxyUI is a high-performance, stateless client UI library constructed using raw vanilla JavaScript and optimized CSS variables.</p>
              
              <div style="background:var(--foxy-surface-alt); padding:20px; border-radius:8px; border:1px solid var(--foxy-divider); margin-top:20px">
                <h3 style="margin-top:0; font-size:14px; font-weight:700; text-transform:uppercase; color:var(--foxy-accent)">Technical Credits</h3>
                <p style="margin:0; font-size:13px; line-height:1.6; color:var(--foxy-text)">
                  <strong>Core Architecture:</strong> FoxyUI Developer & Open Source Contributors<br>
                  <strong>Release Version:</strong> v23.0.0 (Stateless Engine)<br>
                  <strong>License:</strong> MIT Open Source License<br>
                  <strong>Aesthetics:</strong> Inspired by Discord design specifications
                </p>
              </div>

              <div style="margin-top:24px; text-align:center; color:var(--foxy-text-muted); font-size:12px">
                Made with ❤️ for high-performance virtual desktop rendering.
              </div>
            `;
          }
          return "";
        };

        const setSection = (sec) => {
          view.querySelectorAll(".foxy-settings-sidebar-item").forEach(item => {
            if (item.dataset.section === sec) item.classList.add("active");
            else item.classList.remove("active");
          });
          inner.innerHTML = getSettingContent(sec, user);
        };

        setSection("my-account");

        view.querySelectorAll(".foxy-settings-sidebar-item").forEach(item => {
          item.onclick = () => setSection(item.dataset.section);
        });

        // Event listener for live inputs and range sliders
        inner.addEventListener("input", (e) => {
          if (e.target.id === "setting-range-blur") {
            _settings.blur = e.target.value + "px";
            e.target.nextElementSibling.textContent = _settings.blur;
            applyStyle();
          }
          if (e.target.id === "setting-range-sidebar") {
            _settings.sidebarWidth = e.target.value + "px";
            e.target.nextElementSibling.textContent = _settings.sidebarWidth;
            applyStyle();
          }
          if (e.target.id === "setting-input-bgimg") {
            _settings.bgImage = e.target.value.trim() || null;
            applyStyle();
          }
        });

        inner.addEventListener("change", (e) => {
          if (e.target.id === "setting-select-theme") setTheme(e.target.value);
          if (e.target.id === "setting-color-accent") {
            setAccent(e.target.value);
            e.target.nextElementSibling.textContent = e.target.value;
          }
          if (e.target.id === "setting-select-radius") {
            _settings.radius = e.target.value;
            applyStyle();
          }
          if (e.target.id === "setting-check-mute") {
            user.muted = e.target.checked;
            this.setUserProfile(user);
            emit("userMuteToggled", winAPI, user);
          }
          if (e.target.id === "setting-check-deaf") {
            user.deafened = e.target.checked;
            this.setUserProfile(user);
            emit("userDeafenToggled", winAPI, user);
          }
          if (e.target.id === "setting-check-autoupdate") {
            _settings.autoCheckUpdates = e.target.checked;
          }
          if (e.target.classList.contains("setting-plugin-toggle")) {
            const idx = parseInt(e.target.dataset.idx);
            const p = _plugins[idx];
            p.enabled = e.target.checked;
            emit("pluginToggled", p);
            showToast(`${p.name} updated. Restart client to apply changes.`, { type: "info" });
          }
        });

        inner.addEventListener("click", (e) => {
          if (e.target.id === "setting-save-account") {
            const nameVal = view.querySelector("#setting-input-name").value.trim();
            const tagVal = view.querySelector("#setting-input-tag").value.trim();
            if (nameVal) {
              user.name = nameVal;
              user.tag = tagVal || "0001";
              this.setUserProfile(user);
              showToast("Account saved!", { type: "success" });
            }
          }
          if (e.target.id === "setting-btn-checknow") {
            const btn = e.target;
            btn.disabled = true;
            btn.textContent = "Checking...";
            checkForUpdates(false).finally(() => {
              btn.disabled = false;
              btn.textContent = "Check Now";
            });
          }
        });

        view.querySelector(".foxy-settings-close-btn").onclick = () => { view.remove(); };
      },
      close() {
        delete _windows[id]; el.remove();
        emit("windowClosed", winAPI); onClose?.();
      }
    };
    _windows[id] = winAPI;

    // Handle Inbox bell trigger clicks inside client windows
    const inboxBtn = el.querySelector(".foxy-inbox-btn");
    if (inboxBtn) {
      inboxBtn.onclick = (e) => {
        e.stopPropagation();
        let popout = el.querySelector(".foxy-inbox-popout");
        if (popout) {
          popout.remove();
        } else {
          popout = document.createElement("div");
          popout.className = "foxy-inbox-popout";
          
          const badge = el.querySelector(".foxy-inbox-badge");
          if (badge) {
            badge.style.display = "none";
            badge.textContent = "0";
          }

          if (_notifications.length === 0) {
            popout.innerHTML = `<div style="padding:16px; text-align:center; color:var(--foxy-text-muted); font-size: 13px;">Inbox is empty</div>`;
          } else {
            popout.innerHTML = _notifications.map(n => `
              <div style="padding:10px 12px; border-bottom:1px solid var(--foxy-divider); font-size:13px; box-sizing: border-box;">
                <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                  <strong style="color:var(--foxy-text);">${n.author}</strong>
                  <span style="font-size:10px; color:var(--foxy-text-muted);">${n.timestamp}</span>
                </div>
                <div style="color:var(--foxy-text-muted); margin-top:2px;">${n.message}</div>
              </div>
            `).join("");
          }
          el.appendChild(popout);

          const closePopout = () => { popout.remove(); document.removeEventListener("click", closePopout); };
          setTimeout(() => document.addEventListener("click", closePopout), 0);
        }
      };
    }

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

    if (Array.isArray(finalServers)) winAPI.setServers(finalServers);
    if (Array.isArray(finalChannels)) winAPI.setChannels(finalChannels);
    
    if (finalMembers) {
      const listToUse = Array.isArray(finalMembers) ? finalMembers : (memberList || null);
      winAPI.setMembers(listToUse);
    }

    if (finalUser) {
      winAPI.setUserProfile(finalUser);
    }

    if (Array.isArray(tabs)) {
      tabs.forEach(t => winAPI.addTab(t));
    }

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
  function registerPlugin(name, options = {}) {
    if (typeof options === "function") {
      options = { init: options };
    }
    const pluginObj = {
      name,
      description: options.description || "No description provided.",
      author: options.author || "Anonymous",
      version: options.version || "1.0.0",
      enabled: options.enabled !== false,
      init: options.init
    };
    
    _plugins.push(pluginObj);
    if (pluginObj.enabled) {
      try { pluginObj.init?.(window.FoxyUI); console.log(`Plugin ${name} loaded~`); }
      catch (e) { console.error(`Plugin ${name} failed`, e); }
    }
  }
  async function loadPluginFromURL(url) {
    const res = await fetch(url); const code = await res.text();
    new Function("FoxyUI", code)(window.FoxyUI);
  }

  // ---------- DEFAULT COMMANDS ----------
  registerCommand({ id: "system.update", label: "Check for Updates", category: "System", onRun: () => checkForUpdates(false) });
  registerCommand({ id: "theme.dark", label: "Theme: Dark", category: "Appearance", onRun: () => setTheme("dark") });
  registerCommand({ id: "theme.light", label: "Theme: Light", category: "Appearance", onRun: () => setTheme("light") });
  registerCommand({ id: "theme.animated_dark", label: "Theme: Animated Dark", category: "Appearance", onRun: () => setTheme("animated_dark") });
  registerCommand({ id: "theme.animated_light", label: "Theme: Animated Light", category: "Appearance", onRun: () => setTheme("animated_light") });
  registerCommand({ id: "theme.amoled", label: "Theme: AMOLED", category: "Appearance", onRun: () => setTheme("amoled") });
  registerCommand({ id: "theme.foxy", label: "Theme: Foxy", category: "Appearance", onRun: () => setTheme("foxy") });
  registerCommand({ id: "theme.cyberpunk", label: "Theme: Cyberpunk", category: "Appearance", onRun: () => setTheme("cyberpunk") });
  registerCommand({ id: "theme.synthwave", label: "Theme: Synthwave (Animated)", category: "Appearance", onRun: () => setTheme("synthwave") });
  registerCommand({ id: "theme.aurora", label: "Theme: Aurora (Animated)", category: "Appearance", onRun: () => setTheme("aurora") });
  registerCommand({ id: "theme.nebula", label: "Theme: Nebula (Animated)", category: "Appearance", onRun: () => setTheme("nebula") });
  registerCommand({ id: "theme.twitch", label: "Theme: Twitch", category: "Appearance", onRun: () => setTheme("twitch") });
  registerCommand({ id: "theme.imgui", label: "Theme: ImGui", category: "Appearance", onRun: () => setTheme("imgui") });
  registerCommand({ id: "toast.demo", label: "Show demo toast", category: "Utility", onRun: () => showToast("Hello from FoxyUI v23", { type: "success" }) });

  // ---------- EXPORT ----------
  window.FoxyUI = {
    _version: 23,
    _windows, _toasts, _settings, _plugins, _keybinds, _commands, _members, THEMES,
    // icons
    getIcon,
    // notify pipeline
    notify,
    // updates
    checkForUpdates,
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
    // custom settings
    registerSettingsSection,
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
  
  console.log("%c🦊 FoxyUI v23 loaded — Discord-style icon suite & settings refresh initialized", "color:#5865f2;font-weight:700;font-size:13px");

  // ---------- INITIALIZATION ACTIONS ----------
  // Background asynchronous verification of the repository update status on initialization
  if (_settings.autoCheckUpdates) {
    setTimeout(() => {
      checkForUpdates(true);
    }, 2000);
  }
})();
