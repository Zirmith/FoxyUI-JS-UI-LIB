/**
 * FoxyUI-JS-UI-LIB Update Metadata (updater.js)
 * @version 25.0
 * 
 * This file serves as the official metadata and version reference for FoxyUI.
 * The client library parses this file both statically (via regex) and dynamically (via execution).
 */
(() => {
  // Safe global namespace detection across standard browsers, workers, and Node.js
  const globalObject = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);

  const updateMeta = {
    // Core version metrics (increment these when pushing updates to foxyui.js)
    version: 25.0,
    semver: "25.0.0",
    releaseDate: "2026-06-02",
    
    // Distribution and update tracking points
    updateURL: "https://raw.githubusercontent.com/Zirmith/FoxyUI-JS-UI-LIB/refs/heads/main/foxyui.js",
    metaURL: "https://raw.githubusercontent.com/Zirmith/FoxyUI-JS-UI-LIB/refs/heads/main/updater.js",
    
    // Update manifest for changelog population
    changelog: [
      "Webhook & Integrations pipeline implemented with custom payloads, profile overrides, and dynamic embed blocks.",
      "Special visual treatments introduced for automated feeds, including a dedicated BOT tag.",
      "Interactive Discord-style floating profile popouts added for user avatars and chat author cards.",
      "Connected accounts dashboard designed for linking external social profiles like GitHub, Twitch, and YouTube.",
      "Voice ring state indicators deployed to highlight active speaking status visually.",
      "Expanded status customizer supporting custom status, activities, bios, and banner colors."
    ],

    /**
     * Helper to compare a running local client version against this remote metadata.
     * Supports both legacy numbers (e.g., 25.0) and SemVer strings (e.g., "25.0.0").
     * 
     * @param {number|string} localVersion - The running client library version.
     * @returns {boolean} True if the remote version is strictly newer.
     */
    isNewerThan(localVersion) {
      if (localVersion === undefined || localVersion === null) return true;

      // Handle precise SemVer comparison
      if (typeof localVersion === "string" && localVersion.includes(".")) {
        const localParts = localVersion.split(".").map(Number);
        const remoteParts = this.semver.split(".").map(Number);

        for (let i = 0; i < Math.max(localParts.length, remoteParts.length); i++) {
          const localVal = localParts[i] || 0;
          const remoteVal = remoteParts[i] || 0;
          if (remoteVal > localVal) return true;
          if (remoteVal < localVal) return false;
        }
        return false;
      }

      // Fallback to legacy float comparison
      if (typeof localVersion === "number") {
        return this.version > localVersion;
      }

      return false;
    }
  };

  // Safeguard global object properties against injection or modification during evaluation
  Object.freeze(updateMeta);

  if (globalObject) {
    globalObject.FoxyUI_UpdateMeta = updateMeta;

    // Dispatch global event for asynchronous event-driven architectures
    if (typeof CustomEvent !== "undefined" && typeof globalObject.dispatchEvent === "function") {
      try {
        const event = new CustomEvent("FoxyUI_UpdateMetaLoaded", { detail: updateMeta });
        globalObject.dispatchEvent(event);
      } catch (e) {
        // Silent fallback for sandboxed runtimes
      }
    }
  }
})();
