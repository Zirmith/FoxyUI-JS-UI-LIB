(async function() {
  // 1. Dynamic FoxyUI core loader if not present
  if (!window.FoxyUI) {
    console.log("[CC Assistant] Fetching FoxyUI library...");
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://raw.githubusercontent.com/Zirmith/FoxyUI-JS-UI-LIB/refs/heads/main/foxyui.js";
      script.onload = () => {
        console.log("[CC Assistant] FoxyUI injected successfully.");
        resolve();
      };
      script.onerror = (err) => {
        console.error("[CC Assistant] Failed to retrieve FoxyUI raw content:", err);
        reject(err);
      };
      document.head.appendChild(script);
    });
  }

  // Delay slightly to ensure FoxyUI initialization completes
  setTimeout(() => {
    runFullCCAssistantWithExperimental();
  }, 150);

  function runFullCCAssistantWithExperimental() {
    const Foxy = window.FoxyUI;

    // 2. Comprehensive State Storage
    const CC_STATE = {
      autoClick: false,
      clickRate: 50, // ms
      autoGolden: false,
      autoBuy: false,
      buyStrategy: "ratio", // "ratio" or "cheapest"
      autoTicker: false,
      autoDragon: false,
      freeSeeds: false,
      infiniteMagic: false,
      noBackfire: false,
      infiniteSwaps: false,
      noWrinklers: false,
      autoPledge: false,
      instantShimmers: false,
      // Experimental variables
      autoTrade: false,
      forceLumpType: null, // null, 0 (normal), 1 (bifurcated), 2 (caramelized), 3 (golden), 4 (meaty)
      clickMultiplier: 1,
      autoCastSpell: false,
      autoCastSpellId: 5 // Default: Force the Hand of Fate
    };

    // Keep track of background intervals
    let clickTimer = null;
    let goldenTimer = null;
    let buyTimer = null;
    let statsTimer = null;
    let tickerTimer = null;
    let dragonTimer = null;
    let tradeTimer = null;
    let lumpGeneticTimer = null;
    let spellCastTimer = null;

    // 3. Dynamic Minigame Protection Helper
    function getMinigame(buildingName) {
      if (typeof Game === "undefined") return null;
      const b = Game.Objects[buildingName];
      if (b && b.minigame) return b.minigame;
      return null;
    }

    // 4. Logger Helper Mapping to the Chat Container
    function writeLog(author, text) {
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      logMessages.push({ author, text, timestamp });
      if (logMessages.length > 50) logMessages.shift();
      if (chatFeedAPI) {
        chatFeedAPI.updateMessages(logMessages);
      }
    }

    // 5. Click Multiplier Native Engine Hook
    if (typeof Game !== "undefined" && Game.ClickCookie && !Game.ClickCookie.isHooked) {
      const originalClickCookie = Game.ClickCookie;
      Game.ClickCookie = function(e, amount) {
        const multiplier = CC_STATE.clickMultiplier || 1;
        for (let i = 0; i < multiplier; i++) {
          originalClickCookie(e, amount);
        }
      };
      Game.ClickCookie.isHooked = true;
    }

    // 6. Basic & Advanced Automation Handlers
    function startAutoClick() {
      if (clickTimer) clearInterval(clickTimer);
      clickTimer = setInterval(() => {
        if (typeof Game !== "undefined" && Game.ClickCookie) {
          // Native hooked ClickCookie will automatically respect clickMultiplier
          Game.ClickCookie();
        }
      }, CC_STATE.clickRate);
    }

    function stopAutoClick() {
      if (clickTimer) {
        clearInterval(clickTimer);
        clickTimer = null;
      }
    }

    function startAutoGolden() {
      if (goldenTimer) clearInterval(goldenTimer);
      goldenTimer = setInterval(() => {
        if (typeof Game !== "undefined" && Game.shimmers) {
          Game.shimmers.forEach(shimmer => {
            if (shimmer.type === "golden" || shimmer.type === "reindeer") {
              shimmer.click();
              writeLog("System", `Collected a floating ${shimmer.type}!`);
            }
          });
        }
      }, 500);
    }

    function stopAutoGolden() {
      if (goldenTimer) {
        clearInterval(goldenTimer);
        goldenTimer = null;
      }
    }

    function selectBestBuilding() {
      let selectedObj = null;
      let optimalRatio = Infinity;
      let cheapestObj = null;
      let cheapestPrice = Infinity;

      Game.ObjectsById.forEach(obj => {
        const price = obj.bulkPrice;
        if (price < cheapestPrice) {
          cheapestPrice = price;
          cheapestObj = obj;
        }

        const cps = obj.storedCps * Game.globalCpsMult;
        const ratio = price / (cps || 0.1);
        if (ratio < optimalRatio) {
          optimalRatio = ratio;
          selectedObj = obj;
        }
      });

      return CC_STATE.buyStrategy === "ratio" ? selectedObj : cheapestObj;
    }

    function selectBestUpgrade() {
      let cheapestUpgrade = null;
      let cheapestPrice = Infinity;

      Game.UpgradesInStore.forEach(upgrade => {
        const price = upgrade.getPrice();
        if (price < cheapestPrice) {
          cheapestPrice = price;
          cheapestUpgrade = upgrade;
        }
      });

      return cheapestUpgrade;
    }

    function executeAutoBuyIteration() {
      if (typeof Game === "undefined") return;

      const targetUpgrade = selectBestUpgrade();
      if (targetUpgrade && Game.cookies >= targetUpgrade.getPrice()) {
        const cost = targetUpgrade.getPrice();
        targetUpgrade.buy();
        writeLog("Buyer Bot", `Acquired Upgrade: <strong>${targetUpgrade.name}</strong> for ${Beautify(cost)} cookies.`);
        return;
      }

      const targetBuilding = selectBestBuilding();
      if (targetBuilding && Game.cookies >= targetBuilding.bulkPrice) {
        const cost = targetBuilding.bulkPrice;
        targetBuilding.buy(1);
        writeLog("Buyer Bot", `Acquired Building: <strong>${targetBuilding.name}</strong> for ${Beautify(cost)} cookies.`);
      }
    }

    function startAutoBuy() {
      if (buyTimer) clearInterval(buyTimer);
      buyTimer = setInterval(executeAutoBuyIteration, 1200);
    }

    function stopAutoBuy() {
      if (buyTimer) {
        clearInterval(buyTimer);
        buyTimer = null;
      }
    }

    // Experimental: Stock Market Trader loop
    function runAutoTradeCycle() {
      const market = getMinigame("Bank");
      if (!market) return;

      market.goods.forEach((good) => {
        const resting = market.getRestingVal(good.id);
        const current = good.val;

        // Buy rule: price drops below 40% of standard resting value
        if (current < resting * 0.4) {
          const maxBuy = market.getMaxBuy(good.id);
          if (maxBuy > 0) {
            market.buyGood(good.id, maxBuy);
            writeLog("Auto-Trader", `Bought ${maxBuy} shares of <strong>${good.name}</strong> at $${current.toFixed(2)} (Resting: $${resting.toFixed(2)})`);
          }
        }
        // Sell rule: price jumps above 120% of resting value
        else if (current > resting * 1.2 && good.stock > 0) {
          const toSell = good.stock;
          market.sellGood(good.id, toSell);
          writeLog("Auto-Trader", `Sold ${toSell} shares of <strong>${good.name}</strong> at $${current.toFixed(2)} (Resting: $${resting.toFixed(2)})`);
        }
      });
    }

    // Experimental: Grimoire Auto Spellcaster loop
    function runAutoCastCycle() {
      const grimoire = getMinigame("Wizard tower");
      if (!grimoire) return;

      const spell = grimoire.spellsById[CC_STATE.autoCastSpellId];
      if (spell && grimoire.magic >= grimoire.getSpellCost(spell)) {
        grimoire.castSpell(spell);
        writeLog("Spellcaster", `Auto-cast spell: <strong>${spell.name}</strong>`);
      }
    }

    // 7. UI Views & Rendering Engines
    function renderClickerTab() {
      const container = document.createElement("div");
      container.style.display = "flex";
      container.style.flexDirection = "column";
      container.style.gap = "12px";

      container.innerHTML = `
        <div style="font-size: 16px; font-weight: 700; color: var(--foxy-accent); margin-bottom: 4px;">Clicks & Pop Automation</div>
        
        <div class="foxy-card">
          <div style="flex: 1;">
            <div style="font-weight: 600;">Autoclick Big Cookie</div>
            <div style="font-size: 12px; color: var(--foxy-text-muted);">Triggers rapid structural clicks on the primary cookie object.</div>
            <div style="margin-top: 10px; display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 12px;">Interval Rate (ms):</span>
              <input type="number" id="cc-click-rate" value="${CC_STATE.clickRate}" min="10" max="1000" style="width: 80px; padding: 4px 6px;">
            </div>
          </div>
          <label class="foxy-switch">
            <input type="checkbox" id="cc-toggle-autoclick" ${CC_STATE.autoClick ? 'checked' : ''}>
            <span class="foxy-switch-slider"></span>
          </label>
        </div>

        <div class="foxy-card">
          <div style="flex: 1;">
            <div style="font-weight: 600;">Auto-Pop Golden Cookies</div>
            <div style="font-size: 12px; color: var(--foxy-text-muted);">Scans and instantly clicks Shimmers (Golden Cookies & Reindeer).</div>
          </div>
          <label class="foxy-switch">
            <input type="checkbox" id="cc-toggle-golden" ${CC_STATE.autoGolden ? 'checked' : ''}>
            <span class="foxy-switch-slider"></span>
          </label>
        </div>

        <div class="foxy-card">
          <div style="flex: 1;">
            <div style="font-weight: 600;">Auto-Click Fortune News Ticker</div>
            <div style="font-size: 12px; color: var(--foxy-text-muted);">Automatically clicks on fortune announcements in the news ticker.</div>
          </div>
          <label class="foxy-switch">
            <input type="checkbox" id="cc-toggle-ticker" ${CC_STATE.autoTicker ? 'checked' : ''}>
            <span class="foxy-switch-slider"></span>
          </label>
        </div>

        <div class="foxy-card">
          <div style="flex: 1;">
            <div style="font-weight: 600;">Auto Pet Dragon</div>
            <div style="font-size: 12px; color: var(--foxy-text-muted);">Automatically pets Krumblor the Toy Dragon continuously.</div>
          </div>
          <label class="foxy-switch">
            <input type="checkbox" id="cc-toggle-dragon" ${CC_STATE.autoDragon ? 'checked' : ''}>
            <span class="foxy-switch-slider"></span>
          </label>
        </div>
      `;

      const chkClick = container.querySelector("#cc-toggle-autoclick");
      const inputRate = container.querySelector("#cc-click-rate");
      const chkGolden = container.querySelector("#cc-toggle-golden");
      const chkTicker = container.querySelector("#cc-toggle-ticker");
      const chkDragon = container.querySelector("#cc-toggle-dragon");

      chkClick.onchange = (e) => {
        CC_STATE.autoClick = e.target.checked;
        if (CC_STATE.autoClick) startAutoClick(); else stopAutoClick();
        writeLog("System", `Auto-Clicker configured to: ${CC_STATE.autoClick ? "ACTIVE" : "INACTIVE"}.`);
      };

      inputRate.oninput = (e) => {
        let val = parseInt(e.target.value) || 50;
        if (val < 10) val = 10;
        CC_STATE.clickRate = val;
        if (CC_STATE.autoClick) startAutoClick();
      };

      chkGolden.onchange = (e) => {
        CC_STATE.autoGolden = e.target.checked;
        if (CC_STATE.autoGolden) startAutoGolden(); else stopAutoGolden();
        writeLog("System", `Shimmer Tracker configured to: ${CC_STATE.autoGolden ? "ACTIVE" : "INACTIVE"}.`);
      };

      chkTicker.onchange = (e) => {
        CC_STATE.autoTicker = e.target.checked;
        if (CC_STATE.autoTicker) {
          tickerTimer = setInterval(() => {
            if (typeof Game !== "undefined" && Game.TickerEffect && Game.TickerEffect.type == "fortune") {
              Game.tickerL.click();
              writeLog("Ticker", "Harvested fortune upgrade from ticker!");
            }
          }, 1000);
          writeLog("System", "Auto Fortune Ticker clicker enabled.");
        } else {
          if (tickerTimer) clearInterval(tickerTimer);
          writeLog("System", "Auto Fortune Ticker clicker disabled.");
        }
      };

      chkDragon.onchange = (e) => {
        CC_STATE.autoDragon = e.target.checked;
        if (CC_STATE.autoDragon) {
          dragonTimer = setInterval(() => {
            if (typeof Game !== "undefined" && Game.ClickSpecialPic) {
              Game.ClickSpecialPic();
            }
          }, 1000);
          writeLog("System", "Auto Dragon petting enabled.");
        } else {
          if (dragonTimer) clearInterval(dragonTimer);
          writeLog("System", "Auto Dragon petting disabled.");
        }
      };

      return container;
    }

    function renderAutoBuyTab() {
      const container = document.createElement("div");
      container.style.display = "flex";
      container.style.flexDirection = "column";
      container.style.gap = "12px";

      container.innerHTML = `
        <div style="font-size: 16px; font-weight: 700; color: var(--foxy-accent); margin-bottom: 4px;">Supply-Chain Automation</div>
        
        <div class="foxy-card">
          <div style="flex: 1;">
            <div style="font-weight: 600;">Auto-Purchase Buildings & Upgrades</div>
            <div style="font-size: 12px; color: var(--foxy-text-muted);">Schedules non-blocking checks to spend bank yields efficiently.</div>
          </div>
          <label class="foxy-switch">
            <input type="checkbox" id="cc-toggle-autobuy" ${CC_STATE.autoBuy ? 'checked' : ''}>
            <span class="foxy-switch-slider"></span>
          </label>
        </div>

        <div class="foxy-card" style="flex-direction: column; align-items: flex-start; gap: 6px;">
          <div style="font-weight: 600;">Acquisition Strategy</div>
          <div style="font-size: 12px; color: var(--foxy-text-muted); margin-bottom: 4px;">Determine the sorting and selection parameters for incoming purchases.</div>
          <select id="cc-buy-strategy">
            <option value="ratio" ${CC_STATE.buyStrategy === "ratio" ? "selected" : ""}>Optimal Ratio (Yield per Cookie Spent)</option>
            <option value="cheapest" ${CC_STATE.buyStrategy === "cheapest" ? "selected" : ""}>Cheapest First (Maximizes total count)</option>
          </select>
        </div>
      `;

      const chkBuy = container.querySelector("#cc-toggle-autobuy");
      const selStrategy = container.querySelector("#cc-buy-strategy");

      chkBuy.onchange = (e) => {
        CC_STATE.autoBuy = e.target.checked;
        if (CC_STATE.autoBuy) startAutoBuy(); else stopAutoBuy();
        writeLog("System", `Auto-Buyer configured to: ${CC_STATE.autoBuy ? "ACTIVE" : "INACTIVE"}.`);
      };

      selStrategy.onchange = (e) => {
        CC_STATE.buyStrategy = e.target.value;
        writeLog("System", `Acquisition strategy adjusted: ${CC_STATE.buyStrategy === "ratio" ? "Optimal Ratio" : "Cheapest First"}.`);
      };

      return container;
    }

    function renderCookieProdTab() {
      const container = document.createElement("div");
      container.style.display = "flex";
      container.style.flexDirection = "column";
      container.style.gap = "12px";

      container.innerHTML = `
        <div style="font-size: 16px; font-weight: 700; color: var(--foxy-accent); margin-bottom: 4px;">Cookie Bank & Production Modifiers</div>
        
        <div class="foxy-card" style="flex-wrap: wrap; gap: 8px;">
          <button id="btn-inf-cookies">Set Infinite Cookies</button>
          <button id="btn-cheat-cookie-achievement" class="secondary">Trigger Cheated Cookies Achievement</button>
          <button id="btn-div-cookies" class="secondary">Divide Cookies by 1000</button>
          <button id="btn-clear-buffs" class="danger">Clear All Active Buffs</button>
        </div>

        <div class="foxy-card" style="flex-direction: column; align-items: flex-start; gap: 8px;">
          <div style="font-weight: 600;">Trigger Special Buffs</div>
          <div style="font-size: 12px; color: var(--foxy-text-muted); margin-bottom: 4px;">Instantly gain game engine frenzy or click multiplier multipliers.</div>
          <div style="display: flex; gap: 8px; width: 100%; flex-wrap: wrap;">
            <button id="btn-buff-frenzy">Frenzy (7x)</button>
            <button id="btn-buff-click-frenzy">Click Frenzy (777x)</button>
            <button id="btn-buff-flight">Dragon Flight (1111x)</button>
          </div>
        </div>

        <div class="foxy-card" style="flex-direction: column; align-items: flex-start; gap: 8px;">
          <div style="font-weight: 600;">Custom Cookie Click Multiplier</div>
          <div style="font-size: 12px; color: var(--foxy-text-muted);">Manually override how many cookies you earn per manual click.</div>
          <div style="display: flex; gap: 8px; width: 100%;">
            <input type="number" id="input-click-cps" value="${typeof Game !== 'undefined' ? Game.computedMouseCps : 1}" style="flex: 1;">
            <button id="btn-set-click-cps">Set Click Power</button>
          </div>
        </div>

        <div class="foxy-card" style="flex-direction: column; align-items: flex-start; gap: 8px;">
          <div style="font-weight: 600;">Custom Cookies per Second (CpS)</div>
          <div style="font-size: 12px; color: var(--foxy-text-muted);">Manually overwrite your automated cookies per second (CpS).</div>
          <div style="display: flex; gap: 8px; width: 100%;">
            <input type="number" id="input-custom-cps" value="${typeof Game !== 'undefined' ? Game.cookiesPs : 0}" style="flex: 1;">
            <button id="btn-set-custom-cps">Set CpS</button>
          </div>
        </div>
      `;

      container.querySelector("#btn-inf-cookies").onclick = () => {
        if (typeof Game !== "undefined") {
          Game.cookies = Infinity;
          writeLog("Cheats", "Set cookies to Infinity.");
          Foxy.showToast("Set cookies to Infinity!", { type: "success" });
        }
      };

      container.querySelector("#btn-cheat-cookie-achievement").onclick = () => {
        if (typeof Game !== "undefined") {
          Game.cookies = Game.cookiesEarned + 1000000;
          writeLog("Cheats", "Adjusted cookie bank to unlock cheated cookies achievement.");
          Foxy.showToast("Cheated Cookies Achievement Unlocked!", { type: "success" });
        }
      };

      container.querySelector("#btn-div-cookies").onclick = () => {
        if (typeof Game !== "undefined") {
          Game.cookies /= 1000;
          Game.cookiesEarned /= 1000;
          writeLog("Cheats", "Divided cookies and cookiesEarned by 1000.");
          Foxy.showToast("Divided bank by 1000!", { type: "info" });
        }
      };

      container.querySelector("#btn-clear-buffs").onclick = () => {
        if (typeof Game !== "undefined") {
          for (let i in Game.buffs) Game.buffs[i].time = 1;
          writeLog("Cheats", "Cleared all active buffs.");
          Foxy.showToast("Cleared active buffs!", { type: "info" });
        }
      };

      container.querySelector("#btn-buff-frenzy").onclick = () => {
        if (typeof Game !== "undefined") {
          Game.gainBuff('frenzy', 77, 7);
          writeLog("Cheats", "Forced Frenzy (7x CpS) for 77s.");
          Foxy.showToast("Frenzy activated!", { type: "success" });
        }
      };

      container.querySelector("#btn-buff-click-frenzy").onclick = () => {
        if (typeof Game !== "undefined") {
          Game.gainBuff('click frenzy', 77, 777);
          writeLog("Cheats", "Forced Click Frenzy (777x click power) for 77s.");
          Foxy.showToast("Click Frenzy activated!", { type: "success" });
        }
      };

      container.querySelector("#btn-buff-flight").onclick = () => {
        if (typeof Game !== "undefined") {
          Game.gainBuff('dragonflight', 10, 1111);
          writeLog("Cheats", "Forced Dragon Flight (1111x click power) for 10s.");
          Foxy.showToast("Dragon Flight activated!", { type: "success" });
        }
      };

      container.querySelector("#btn-set-click-cps").onclick = () => {
        if (typeof Game !== "undefined") {
          const val = parseFloat(container.querySelector("#input-click-cps").value) || 1;
          Game.computedMouseCps = val;
          Game.cookiesPerClick = val;
          writeLog("Cheats", `Set custom click yield to ${Beautify(val)} cookies per click.`);
          Foxy.showToast(`Click power set to ${Beautify(val)}!`, { type: "success" });
        }
      };

      container.querySelector("#btn-set-custom-cps").onclick = () => {
        if (typeof Game !== "undefined") {
          const val = parseFloat(container.querySelector("#input-custom-cps").value) || 0;
          Game.cookiesPs = val;
          writeLog("Cheats", `Set automated CpS to ${Beautify(val)}.`);
          Foxy.showToast(`CpS rate set to ${Beautify(val)}!`, { type: "success" });
        }
      };

      return container;
    }

    function renderShimmerTab() {
      const container = document.createElement("div");
      container.style.display = "flex";
      container.style.flexDirection = "column";
      container.style.gap = "12px";

      container.innerHTML = `
        <div style="font-size: 16px; font-weight: 700; color: var(--foxy-accent); margin-bottom: 4px;">Golden & Wrath Cookie Spawners</div>
        
        <div class="foxy-card" style="gap: 8px; flex-wrap: wrap;">
          <button id="btn-spawn-golden">Spawn Golden Cookie</button>
          <button id="btn-spawn-wrath" class="danger">Spawn Wrath Cookie</button>
          <button id="btn-break-chain" class="secondary">Break Active Chain</button>
        </div>

        <div class="foxy-card">
          <div style="flex: 1;">
            <div style="font-weight: 600;">Instant / Infinite Golden Cookies</div>
            <div style="font-size: 12px; color: var(--foxy-text-muted);">Overwrites minTime/maxTime configs. Cookies spawn continuously on tick.</div>
          </div>
          <label class="foxy-switch">
            <input type="checkbox" id="chk-instant-shimmers" ${CC_STATE.instantShimmers ? "checked" : ""}>
            <span class="foxy-switch-slider"></span>
          </label>
        </div>

        <div class="foxy-card" style="flex-direction: column; align-items: flex-start; gap: 8px;">
          <div style="font-weight: 600;">Golden Cookie Lifetime (Seconds)</div>
          <div style="font-size: 12px; color: var(--foxy-text-muted);">Sets how long golden cookies shimmer on screen before disappearing.</div>
          <div style="display: flex; gap: 8px; width: 100%;">
            <input type="number" id="input-shimmer-dur" value="${typeof Game !== 'undefined' && Game.shimmerTypes.golden ? Game.shimmerTypes.golden.dur : 30}" style="flex: 1;">
            <button id="btn-set-shimmer-dur">Set Duration</button>
          </div>
        </div>

        <div class="foxy-card" style="flex-direction: column; align-items: flex-start; gap: 8px;">
          <div style="font-weight: 600;">Golden Cookie Click Count Override</div>
          <div style="font-size: 12px; color: var(--foxy-text-muted);">Directly alter the tracked amount of lifetime golden cookies popped.</div>
          <div style="display: flex; gap: 8px; width: 100%;">
            <input type="number" id="input-golden-clicks" value="${typeof Game !== 'undefined' ? Game.goldenClicks : 0}" style="flex: 1;">
            <button id="btn-set-golden-clicks">Set Clicks</button>
          </div>
        </div>

        <div class="foxy-card" style="flex-direction: column; align-items: flex-start; gap: 10px;">
          <div style="font-weight: 600;">Force Cookie Chain Management</div>
          <div style="font-size: 12px; color: var(--foxy-text-muted);">Forcibly launch or manipulates ongoing chain tiers directly.</div>
          <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
            <div>
              <label style="font-size: 12px; font-weight: 600;">Chain Stage (1=6, 2=66, 3=666...):</label>
              <input type="number" id="input-chain-stage" value="1" min="1" max="5">
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 600;">Chain Tier Level:</label>
              <input type="number" id="input-chain-tier" value="1" min="1">
            </div>
          </div>
          <div style="display: flex; gap: 8px; width: 100%;">
            <button id="btn-set-chain" style="flex: 1;">Force Chain Tiers</button>
          </div>
        </div>
      `;

      container.querySelector("#btn-spawn-golden").onclick = () => {
        if (typeof Game !== "undefined") {
          new Game.shimmer('golden');
          writeLog("Spawner", "Spawned new Golden Cookie shimmer.");
          Foxy.showToast("Golden Cookie spawned!", { type: "success" });
        }
      };

      container.querySelector("#btn-spawn-wrath").onclick = () => {
        if (typeof Game !== "undefined") {
          const s = new Game.shimmer('golden');
          s.force = 'wrath';
          writeLog("Spawner", "Spawned new Wrath Cookie shimmer.");
          Foxy.showToast("Wrath Cookie spawned!", { type: "error" });
        }
      };

      container.querySelector("#btn-break-chain").onclick = () => {
        if (typeof Game !== "undefined" && Game.breakChain) {
          Game.breakChain();
          writeLog("Spawner", "Broke active cookie chain.");
          Foxy.showToast("Chain broken!", { type: "info" });
        }
      };

      const chkInstant = container.querySelector("#chk-instant-shimmers");
      chkInstant.onchange = (e) => {
        CC_STATE.instantShimmers = e.target.checked;
        if (typeof Game !== "undefined" && Game.shimmerTypes.golden) {
          if (CC_STATE.instantShimmers) {
            Game.shimmerTypes.golden.minTime = 0;
            Game.shimmerTypes.golden.maxTime = 0;
            writeLog("Spawner", "Golden Cookie spawns set to INSTANT (min/max time = 0).");
          } else {
            Game.shimmerTypes.golden.minTime = 5 * 60 * Game.fps;
            Game.shimmerTypes.golden.maxTime = 15 * 60 * Game.fps;
            writeLog("Spawner", "Golden Cookie spawn cooldowns restored to default.");
          }
        }
      };

      container.querySelector("#btn-set-shimmer-dur").onclick = () => {
        if (typeof Game !== "undefined" && Game.shimmerTypes.golden) {
          const val = parseFloat(container.querySelector("#input-shimmer-dur").value) || 30;
          Game.shimmerTypes.golden.dur = val;
          writeLog("Spawner", `Golden cookie on-screen duration set to ${val} seconds.`);
          Foxy.showToast(`Duration set to ${val}s`, { type: "success" });
        }
      };

      container.querySelector("#btn-set-golden-clicks").onclick = () => {
        if (typeof Game !== "undefined") {
          const val = parseInt(container.querySelector("#input-golden-clicks").value) || 0;
          Game.goldenClicks = val;
          Game.goldenClicksLocal = val;
          writeLog("Spawner", `Golden cookie clicked counter set to ${val}.`);
          Foxy.showToast(`Clicks set to ${val}!`, { type: "success" });
        }
      };

      container.querySelector("#btn-set-chain").onclick = () => {
        if (typeof Game !== "undefined") {
          const stage = parseInt(container.querySelector("#input-chain-stage").value) || 1;
          const tier = parseInt(container.querySelector("#input-chain-tier").value) || 1;
          
          if (Game.shimmer) {
            Game.shimmer.chain = stage;
            Game.shimmer.chainTier = tier;
          }
          writeLog("Spawner", `Set cookie chain to Stage ${stage}, Tier ${tier}.`);
          Foxy.showToast("Chain properties injected!", { type: "success" });
        }
      };

      return container;
    }

    function renderBuildingTab() {
      const container = document.createElement("div");
      container.style.display = "flex";
      container.style.flexDirection = "column";
      container.style.gap = "12px";

      container.innerHTML = `
        <div style="font-size: 16px; font-weight: 700; color: var(--foxy-accent); margin-bottom: 4px;">Building Related Cheats</div>
        
        <div class="foxy-card" style="gap: 8px; flex-wrap: wrap;">
          <button id="btn-add-buildings">Add +100 Of Each Building</button>
          <button id="btn-free-buildings">Make All Buildings Free</button>
          <button id="btn-sacrifice-buildings" class="danger">Sacrifice All Buildings (Lump Reset)</button>
        </div>

        <div class="foxy-card" style="flex-direction: column; align-items: flex-start; gap: 10px;">
          <div style="font-weight: 600;">Upgrade Individual Building Level</div>
          <div style="font-size: 12px; color: var(--foxy-text-muted); margin-bottom: 4px;">Level up a specific building using simulated Sugar Lumps.</div>
          <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
            <div>
              <label style="font-size: 12px; font-weight: 600;">Select Building:</label>
              <select id="select-level-building" style="width: 100%;">
                ${typeof Game !== 'undefined' ? Game.ObjectsById.map((b, idx) => `<option value="${idx}">${b.name}</option>`).join("") : ""}
              </select>
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 600;">Target Level:</label>
              <input type="number" id="input-building-level" value="10" min="1">
            </div>
          </div>
          <button id="btn-set-building-level" style="width: 100%;">Apply Level Upgrade</button>
        </div>
      `;

      container.querySelector("#btn-add-buildings").onclick = () => {
        if (typeof Game !== "undefined") {
          Game.ObjectsById.forEach(obj => obj.amount += 100);
          writeLog("Buildings", "Added +100 of all buildings via cheat modifier.");
          Foxy.showToast("+100 of each building added!", { type: "success" });
        }
      };

      container.querySelector("#btn-free-buildings").onclick = () => {
        if (typeof Game !== "undefined") {
          Game.ObjectsById.forEach(function(e) {
            e.basePrice = 0;
            e.refresh();
          });
          Game.storeToRebuild = 1;
          writeLog("Buildings", "All buildings are now completely FREE.");
          Foxy.showToast("All buildings set to 0 cookies!", { type: "success" });
        }
      };

      container.querySelector("#btn-sacrifice-buildings").onclick = async () => {
        if (typeof Game !== "undefined") {
          const confirm = await Foxy.confirmModal("Are you sure you want to sacrifice all buildings? This resets your inventory but triggers sugar lump awards.", { danger: true });
          if (confirm) {
            for (var i in Game.Objects) {
              Game.Objects[i].sacrifice(1);
            }
            writeLog("Buildings", "Sacrificed all buildings.");
            Foxy.showToast("Buildings sacrificed successfully!", { type: "success" });
          }
        }
      };

      container.querySelector("#btn-set-building-level").onclick = () => {
        if (typeof Game !== "undefined") {
          const idx = parseInt(container.querySelector("#select-level-building").value) || 0;
          const level = parseInt(container.querySelector("#input-building-level").value) || 1;
          
          const b = Game.ObjectsById[idx];
          if (b) {
            b.level = level;
            Game.recalculateGains = 1;
            writeLog("Buildings", `Force leveled up ${b.name} to Level ${level}.`);
            Foxy.showToast(`${b.name} level set to ${level}!`, { type: "success" });
          }
        }
      };

      return container;
    }

    function renderGardenTab() {
      const container = document.createElement("div");
      container.style.display = "flex";
      container.style.flexDirection = "column";
      container.style.gap = "12px";

      const mg = getMinigame("Farm");
      if (!mg) {
        container.innerHTML = `
          <div style="font-size: 16px; font-weight: 700; color: var(--foxy-accent); margin-bottom: 4px;">Garden Minigame</div>
          <div class="foxy-card" style="flex-direction: column; align-items: center; text-align: center; padding: 24px;">
            <div style="font-weight: 600; margin-bottom: 8px;">Garden Not Unlocked</div>
            <div style="font-size: 13px; color: var(--foxy-text-muted); margin-bottom: 16px;">You must level up Farms to Level 1 using Sugar Lumps to unlock this minigame.</div>
            <button id="btn-unlock-farm">Force Unlock Farm Minigame</button>
          </div>
        `;
        container.querySelector("#btn-unlock-farm").onclick = () => {
          if (typeof Game !== "undefined") {
            Game.Objects["Farm"].levelUp();
            writeLog("Farm", "Farms leveled up. Reloading view.");
            assistantWindow.setContent(renderGardenTab());
          }
        };
        return container;
      }

      container.innerHTML = `
        <div style="font-size: 16px; font-weight: 700; color: var(--foxy-accent); margin-bottom: 4px;">Garden Minigame Hacks</div>
        
        <div class="foxy-card">
          <div style="flex: 1;">
            <div style="font-weight: 600;">Unlock All Seeds</div>
            <div style="font-size: 12px; color: var(--foxy-text-muted); margin-bottom: 16px;">Instantly adds all seed types to your garden inventory.</div>
          </div>
          <button id="btn-garden-unlock-all">Unlock Seeds</button>
        </div>

        <div class="foxy-card">
          <div style="flex: 1;">
            <div style="font-weight: 600;">Instant Plant Growth</div>
            <div style="font-size: 12px; color: var(--foxy-text-muted);">Forces immediate ticking / step-skipping so crops mature instantly.</div>
          </div>
          <button id="btn-garden-growth">Mature Crops</button>
        </div>

        <div class="foxy-card">
          <div style="flex: 1;">
            <div style="font-weight: 600;">Free Seed Planting</div>
            <div style="font-size: 12px; color: var(--foxy-text-muted);">Sets seed planting cost to 0 cookies.</div>
          </div>
          <label class="foxy-switch">
            <input type="checkbox" id="chk-free-seeds" ${CC_STATE.freeSeeds ? "checked" : ""}>
            <span class="foxy-switch-slider"></span>
          </label>
        </div>
      `;

      container.querySelector("#btn-garden-unlock-all").onclick = () => {
        mg.onRuinTheFun();
        writeLog("Garden", "Unlocked all seeds.");
        Foxy.showToast("All seeds unlocked!", { type: "success" });
      };

      container.querySelector("#btn-garden-growth").onclick = () => {
        mg.nextStep = 0;
        mg.logic();
        writeLog("Garden", "Triggered instant crop step growth.");
        Foxy.showToast("Crops matured!", { type: "success" });
      };

      const chkFreeSeeds = container.querySelector("#chk-free-seeds");
      chkFreeSeeds.onchange = (e) => {
        CC_STATE.freeSeeds = e.target.checked;
        if (CC_STATE.freeSeeds) {
          CC_STATE.originalSeedCost = mg.getCost;
          mg.getCost = function() { return 0; };
          writeLog("Garden", "Activated free seed planting.");
        } else {
          if (CC_STATE.originalSeedCost) mg.getCost = CC_STATE.originalSeedCost;
          writeLog("Garden", "Deactivated free seed planting.");
        }
      };

      return container;
    }

    function renderGrimoireTab() {
      const container = document.createElement("div");
      container.style.display = "flex";
      container.style.flexDirection = "column";
      container.style.gap = "12px";

      const mg = getMinigame("Wizard tower");
      if (!mg) {
        container.innerHTML = `
          <div style="font-size: 16px; font-weight: 700; color: var(--foxy-accent); margin-bottom: 4px;">Grimoire Magic</div>
          <div class="foxy-card" style="flex-direction: column; align-items: center; text-align: center; padding: 24px;">
            <div style="font-weight: 600; margin-bottom: 8px;">Grimoire Not Unlocked</div>
            <div style="font-size: 13px; color: var(--foxy-text-muted); margin-bottom: 16px;">You must level up Wizard Towers to Level 1 using Sugar Lumps to unlock this minigame.</div>
            <button id="btn-unlock-wizard">Force Unlock Grimoire Minigame</button>
          </div>
        `;
        container.querySelector("#btn-unlock-wizard").onclick = () => {
          if (typeof Game !== "undefined") {
            Game.Objects["Wizard tower"].levelUp();
            writeLog("Wizard tower", "Wizard Towers leveled up. Reloading view.");
            assistantWindow.setContent(renderGrimoireTab());
          }
        };
        return container;
      }

      container.innerHTML = `
        <div style="font-size: 16px; font-weight: 700; color: var(--foxy-accent); margin-bottom: 4px;">Grimoire Magic Hacks</div>
        
        <div class="foxy-card">
          <div style="flex: 1;">
            <div style="font-weight: 600;">Refill Magic Pool</div>
            <div style="font-size: 12px; color: var(--foxy-text-muted);">Instantly refills your spellcasting mana to maximum capacity.</div>
          </div>
          <button id="btn-grimoire-refill">Refill Magic</button>
        </div>

        <div class="foxy-card">
          <div style="flex: 1;">
            <div style="font-weight: 600;">Infinite Spellcasting Magic</div>
            <div style="font-size: 12px; color: var(--foxy-text-muted);">Sets spellcasting pool capacity to infinity. Spells cast instantly without depleting resources.</div>
          </div>
          <label class="foxy-switch">
            <input type="checkbox" id="chk-infinite-magic" ${CC_STATE.infiniteMagic ? "checked" : ""}>
            <span class="foxy-switch-slider"></span>
          </label>
        </div>

        <div class="foxy-card">
          <div style="flex: 1;">
            <div style="font-weight: 600;">No Backfire Spellcasting</div>
            <div style="font-size: 12px; color: var(--foxy-text-muted);">Overrides failure calculations. Your spells are guaranteed never to backfire.</div>
          </div>
          <label class="foxy-switch">
            <input type="checkbox" id="chk-no-backfire" ${CC_STATE.noBackfire ? "checked" : ""}>
            <span class="foxy-switch-slider"></span>
          </label>
        </div>
      `;

      container.querySelector("#btn-grimoire-refill").onclick = () => {
        mg.magic = mg.magicM;
        writeLog("Grimoire", "Refilled spellcasting magic pool.");
        Foxy.showToast("Magic refilled!", { type: "success" });
      };

      const chkInfMagic = container.querySelector("#chk-infinite-magic");
      chkInfMagic.onchange = (e) => {
        CC_STATE.infiniteMagic = e.target.checked;
        if (CC_STATE.infiniteMagic) {
          CC_STATE.magicInterval = setInterval(() => {
            if (mg) mg.magic = mg.magicM;
          }, 100);
          writeLog("Grimoire", "Enabled infinite magic pool.");
        } else {
          if (CC_STATE.magicInterval) clearInterval(CC_STATE.magicInterval);
          writeLog("Grimoire", "Disabled infinite magic pool.");
        }
      };

      const chkNoBackfire = container.querySelector("#chk-no-backfire");
      chkNoBackfire.onchange = (e) => {
        CC_STATE.noBackfire = e.target.checked;
        if (CC_STATE.noBackfire) {
          CC_STATE.originalFailChance = mg.getFailChance;
          mg.getFailChance = function() { return 0; };
          writeLog("Grimoire", "Backfire protection ENABLED.");
        } else {
          if (CC_STATE.originalFailChance) mg.getFailChance = CC_STATE.originalFailChance;
          writeLog("Grimoire", "Backfire protection DISABLED.");
        }
      };

      return container;
    }

    function renderTempleTab() {
      const container = document.createElement("div");
      container.style.display = "flex";
      container.style.flexDirection = "column";
      container.style.gap = "12px";

      const mg = getMinigame("Temple");
      if (!mg) {
        container.innerHTML = `
          <div style="font-size: 16px; font-weight: 700; color: var(--foxy-accent); margin-bottom: 4px;">Pantheon Temple Worship</div>
          <div class="foxy-card" style="flex-direction: column; align-items: center; text-align: center; padding: 24px;">
            <div style="font-weight: 600; margin-bottom: 8px;">Pantheon Not Unlocked</div>
            <div style="font-size: 13px; color: var(--foxy-text-muted); margin-bottom: 16px;">You must level up Temples to Level 1 using Sugar Lumps to unlock this minigame.</div>
            <button id="btn-unlock-temple">Force Unlock Temple Minigame</button>
          </div>
        `;
        container.querySelector("#btn-unlock-temple").onclick = () => {
          if (typeof Game !== "undefined") {
            Game.Objects["Temple"].levelUp();
            writeLog("Temple", "Temples leveled up. Reloading view.");
            assistantWindow.setContent(renderTempleTab());
          }
        };
        return container;
      }

      container.innerHTML = `
        <div style="font-size: 16px; font-weight: 700; color: var(--foxy-accent); margin-bottom: 4px;">Pantheon Temple Worship Hacks</div>
        
        <div class="foxy-card">
          <div style="flex: 1;">
            <div style="font-weight: 600;">Refill Worship Swaps</div>
            <div style="font-size: 12px; color: var(--foxy-text-muted);">Instantly refills your Pantheon god allocation swap slots to 3.</div>
          </div>
          <button id="btn-temple-refill">Refill Swaps</button>
        </div>

        <div class="foxy-card">
          <div style="flex: 1;">
            <div style="font-weight: 600;">Infinite Worship Swaps</div>
            <div style="font-size: 12px; color: var(--foxy-text-muted);">Maintains worship swap counts to infinity. Arrange gods without cooldown limits.</div>
          </div>
          <label class="foxy-switch">
            <input type="checkbox" id="chk-infinite-swaps" ${CC_STATE.infiniteSwaps ? "checked" : ""}>
            <span class="foxy-switch-slider"></span>
          </label>
        </div>
      `;

      container.querySelector("#btn-temple-refill").onclick = () => {
        mg.swaps = 3;
        writeLog("Pantheon", "Refilled worship god swaps pool.");
        Foxy.showToast("Worship swaps refilled!", { type: "success" });
      };

      const chkInfSwaps = container.querySelector("#chk-infinite-swaps");
      chkInfSwaps.onchange = (e) => {
        CC_STATE.infiniteSwaps = e.target.checked;
        if (CC_STATE.infiniteSwaps) {
          CC_STATE.swapsInterval = setInterval(() => {
            if (mg) mg.swaps = Infinity;
          }, 100);
          writeLog("Pantheon", "Infinite arrange swaps enabled.");
        } else {
          if (CC_STATE.swapsInterval) clearInterval(CC_STATE.swapsInterval);
          if (mg) mg.swaps = 3;
          writeLog("Pantheon", "Infinite arrange swaps disabled.");
        }
      };

      return container;
    }

    function renderStockTab() {
      const container = document.createElement("div");
      container.style.display = "flex";
      container.style.flexDirection = "column";
      container.style.gap = "12px";

      const mg = getMinigame("Bank");
      if (!mg) {
        container.innerHTML = `
          <div style="font-size: 16px; font-weight: 700; color: var(--foxy-accent); margin-bottom: 4px;">Stock Market</div>
          <div class="foxy-card" style="flex-direction: column; align-items: center; text-align: center; padding: 24px;">
            <div style="font-weight: 600; margin-bottom: 8px;">Stock Market Not Unlocked</div>
            <div style="font-size: 13px; color: var(--foxy-text-muted); margin-bottom: 16px;">You must level up Banks to Level 1 using Sugar Lumps to unlock this minigame.</div>
            <button id="btn-unlock-bank">Force Unlock Bank Minigame</button>
          </div>
        `;
        container.querySelector("#btn-unlock-bank").onclick = () => {
          if (typeof Game !== "undefined") {
            Game.Objects["Bank"].levelUp();
            writeLog("Bank", "Banks leveled up. Reloading view.");
            assistantWindow.setContent(renderStockTab());
          }
        };
        return container;
      }

      container.innerHTML = `
        <div style="font-size: 16px; font-weight: 700; color: var(--foxy-accent); margin-bottom: 4px;">Stock Market Hacks</div>
        
        <div class="foxy-card">
          <div style="flex: 1;">
            <div style="font-weight: 600;">Unlock All Stocks / Force Market Reset</div>
            <div style="font-size: 12px; color: var(--foxy-text-muted);">Instantly adds all brokers and resets variables to optimized states.</div>
          </div>
          <button id="btn-stock-unlock">Unlock Stocks</button>
        </div>

        <div class="foxy-card" style="flex-direction: column; align-items: flex-start; gap: 8px;">
          <div style="font-weight: 600;">Modify Stock Market Profits</div>
          <div style="font-size: 12px; color: var(--foxy-text-muted);">Adjust your accumulated liquid asset ledger profit value directly.</div>
          <div style="display: flex; gap: 8px; width: 100%;">
            <input type="number" id="input-stock-profits" value="${Math.round(mg.profit)}" style="flex: 1;">
            <button id="btn-stock-profit-set">Set Profits</button>
          </div>
        </div>
      `;

      container.querySelector("#btn-stock-unlock").onclick = () => {
        mg.onRuinTheFun();
        writeLog("Stock Market", "Unlocked stocks / applied stock ruin options.");
        Foxy.showToast("Stock market unlocked!", { type: "success" });
      };

      container.querySelector("#btn-stock-profit-set").onclick = () => {
        const val = parseFloat(container.querySelector("#input-stock-profits").value) || 0;
        mg.profit = val;
        writeLog("Stock Market", `Profits set to $${Beautify(val)}.`);
        Foxy.showToast(`Set bank profits to $${Beautify(val)}!`, { type: "success" });
      };

      return container;
    }

    function renderSeasonTab() {
      const container = document.createElement("div");
      container.style.display = "flex";
      container.style.flexDirection = "column";
      container.style.gap = "12px";

      container.innerHTML = `
        <div style="font-size: 16px; font-weight: 700; color: var(--foxy-accent); margin-bottom: 4px;">Seasonal Events & Holiday Cheats</div>
        
        <div class="foxy-card" style="flex-direction: column; align-items: flex-start; gap: 8px;">
          <div style="font-weight: 600;">Force Holiday Season</div>
          <div style="font-size: 12px; color: var(--foxy-text-muted);">Manually trigger seasonal events (Unlock season upgrades & drop rates).</div>
          <select id="select-season-changer" style="width: 100%;">
            <option value="" ${!Game.season ? "selected" : ""}>Default / Off</option>
            <option value="christmas" ${Game.season === 'christmas' ? "selected" : ""}>Christmas</option>
            <option value="halloween" ${Game.season === 'halloween' ? "selected" : ""}>Halloween</option>
            <option value="valentines" ${Game.season === 'valentines' ? "selected" : ""}>Valentines</option>
            <option value="easter" ${Game.season === 'easter' ? "selected" : ""}>Easter</option>
            <option value="fools" ${Game.season === 'fools' ? "selected" : ""}>Business Day / Fools</option>
          </select>
        </div>

        <div class="foxy-card" style="flex-wrap: wrap; gap: 8px;">
          <button id="btn-eternal-seasons" class="secondary">Unlock Eternal Seasons Upgrade</button>
          <button id="btn-season-switcher" class="secondary">Unlock Season Switcher Upgrade</button>
          <button id="btn-santa-drops" class="secondary">Unlock All Santa Drops</button>
        </div>

        <div class="foxy-card" style="flex-direction: column; align-items: flex-start; gap: 8px;">
          <div style="font-weight: 600;">Set Santa Level</div>
          <div style="font-size: 12px; color: var(--foxy-text-muted);">Directly adjust Santa Claus evolution level (Range: 0 - 14).</div>
          <div style="display: flex; gap: 8px; width: 100%; align-items: center;">
            <input type="range" id="slider-santa-level" min="0" max="14" value="${Game.santaLevel || 0}" style="flex: 1;">
            <span id="label-santa-level" style="min-width: 40px; text-align: right;">${Game.santaLevel || 0}</span>
          </div>
        </div>
      `;

      container.querySelector("#select-season-changer").onchange = (e) => {
        const val = e.target.value;
        Game.season = val;
        Game.seasonT = 24 * 60 * 60 * Game.fps; // Set to 24 hours
        writeLog("Season", `Forced season changed to: ${val || 'None'}`);
        Foxy.showToast(`Season changed to ${val || 'default'}`, { type: "info" });
      };

      container.querySelector("#btn-eternal-seasons").onclick = () => {
        Game.Upgrades["Eternal seasons"].earn();
        writeLog("Season", "Unlocked Eternal seasons upgrade.");
        Foxy.showToast("Eternal seasons earned!", { type: "success" });
      };

      container.querySelector("#btn-season-switcher").onclick = () => {
        Game.Upgrades["Season switcher"].earn();
        writeLog("Season", "Unlocked Season switcher upgrade.");
        Foxy.showToast("Season switcher earned!", { type: "success" });
      };

      container.querySelector("#btn-santa-drops").onclick = () => {
        Game.santaDrops.forEach(function(upgrade) {
          Game.Unlock(upgrade);
        });
        writeLog("Season", "Unlocked all Santa Drops items.");
        Foxy.showToast("Santa Drops unlocked!", { type: "success" });
      };

      const santaSlider = container.querySelector("#slider-santa-level");
      const santaLabel = container.querySelector("#label-santa-level");
      santaSlider.oninput = (e) => {
        const val = parseInt(e.target.value);
        Game.santaLevel = val;
        santaLabel.textContent = val;
        writeLog("Season", `Santa evolution level modified to ${val}.`);
      };

      return container;
    }

    function renderGrandmaTab() {
      const container = document.createElement("div");
      container.style.display = "flex";
      container.style.flexDirection = "column";
      container.style.gap = "12px";

      container.innerHTML = `
        <div style="font-size: 16px; font-weight: 700; color: var(--foxy-accent); margin-bottom: 4px;">Grandmapocalypse Controls</div>
        
        <div class="foxy-card" style="gap: 8px; flex-wrap: wrap;">
          <button id="btn-spawn-wrinkler">Spawn 1 Wrinkler</button>
          <button id="btn-spawn-all-wrinklers">Spawn All Wrinklers</button>
          <button id="btn-shiny-wrinklers">Make All Wrinklers Shiny</button>
          <button id="btn-pop-all-wrinklers" class="danger">Pop All Wrinklers</button>
          <button id="btn-pop-valuable-wrinkler" class="secondary">Pop Most Valuable Wrinkler</button>
          <button id="btn-grandma-face" class="secondary">Big Cookie Grandma Face</button>
          <button id="btn-calc-wrath-rewards" class="secondary">Calculate Wrath Rewards</button>
        </div>

        <div class="foxy-card">
          <div style="flex: 1;">
            <div style="font-weight: 600;">Disable Wrinkler Spawns</div>
            <div style="font-size: 12px; color: var(--foxy-text-muted);">Intercepts the spawn event loop completely. Stops all wrinklers.</div>
          </div>
          <label class="foxy-switch">
            <input type="checkbox" id="chk-no-wrinklers" ${CC_STATE.noWrinklers ? "checked" : ""}>
            <span class="foxy-switch-slider"></span>
          </label>
        </div>

        <div class="foxy-card">
          <div style="flex: 1;">
            <div style="font-weight: 600;">Auto-Buy Elder Pledge</div>
            <div style="font-size: 12px; color: var(--foxy-text-muted);">Buys Elder Pledge upgrades automatically as soon as they expire.</div>
          </div>
          <label class="foxy-switch">
            <input type="checkbox" id="chk-auto-pledge" ${CC_STATE.autoPledge ? "checked" : ""}>
            <span class="foxy-switch-slider"></span>
          </label>
        </div>

        <div class="foxy-card" style="flex-direction: column; align-items: flex-start; gap: 8px;">
          <div style="font-weight: 600;">Set Grandma Anger State</div>
          <div style="font-size: 12px; color: var(--foxy-text-muted);">Directly control the stage of the grandmapocalypse.</div>
          <select id="select-grandma-anger" style="width: 100%;">
            <option value="0" ${typeof Game !== 'undefined' && Game.elderWrath === 0 ? "selected" : ""}>Stage 0 - Appeased</option>
            <option value="1" ${typeof Game !== 'undefined' && Game.elderWrath === 1 ? "selected" : ""}>Stage 1 - Awoken</option>
            <option value="2" ${typeof Game !== 'undefined' && Game.elderWrath === 2 ? "selected" : ""}>Stage 2 - Displeased</option>
            <option value="3" ${typeof Game !== 'undefined' && Game.elderWrath === 3 ? "selected" : ""}>Stage 3 - Angered</option>
          </select>
        </div>

        <div class="foxy-card" style="flex-direction: column; align-items: flex-start; gap: 8px;">
          <div style="font-weight: 600;">Wrinkler Capacity Limit</div>
          <div style="font-size: 12px; color: var(--foxy-text-muted);">Modifies how many wrinklers can feed on your cookie simultaneously (Default is 10/12).</div>
          <div style="display: flex; gap: 8px; width: 100%;">
            <input type="number" id="input-wrinkler-limit" value="${typeof Game !== 'undefined' ? (Game.wrinklerLimit || 10) : 10}" style="flex: 1;">
            <button id="btn-set-wrinkler-limit">Set Limit</button>
          </div>
        </div>

        <div class="foxy-card" style="flex-direction: column; align-items: flex-start; gap: 8px;">
          <div style="font-weight: 600;">Elder Pledge Timer Modifier</div>
          <div style="font-size: 12px; color: var(--foxy-text-muted);">Adjust the duration (minutes) of your current Elder Pledge status.</div>
          <div style="display: flex; gap: 8px; width: 100%;">
            <input type="number" id="input-pledge-minutes" value="60" style="flex: 1;">
            <button id="btn-pledge-set">Set Duration</button>
          </div>
        </div>
      `;

      container.querySelector("#btn-spawn-wrinkler").onclick = () => {
        if (typeof Game !== "undefined") {
          Game.SpawnWrinkler();
          writeLog("Grandmapocalypse", "Spawned a new wrinkler.");
          Foxy.showToast("Wrinkler spawned!", { type: "info" });
        }
      };

      container.querySelector("#btn-spawn-all-wrinklers").onclick = () => {
        if (typeof Game !== "undefined") {
          for (let i = 0; i < Game.wrinklers.length; i++) {
            Game.wrinklers[i].phase = 1;
          }
          writeLog("Grandmapocalypse", "Spawned all available wrinklers.");
          Foxy.showToast("All wrinklers spawned!", { type: "success" });
        }
      };

      container.querySelector("#btn-shiny-wrinklers").onclick = () => {
        if (typeof Game !== "undefined") {
          for (let i = 0; i < Game.wrinklers.length; i++) {
            Game.wrinklers[i].type = 1;
          }
          writeLog("Grandmapocalypse", "Converted all active wrinklers into Shiny wrinklers.");
          Foxy.showToast("Shiny wrinklers created!", { type: "success" });
        }
      };

      container.querySelector("#btn-pop-all-wrinklers").onclick = () => {
        if (typeof Game !== "undefined") {
          Game.PopAllWrinklers();
          writeLog("Grandmapocalypse", "Popped all wrinklers on screen.");
          Foxy.showToast("All wrinklers popped!", { type: "success" });
        }
      };

      container.querySelector("#btn-pop-valuable-wrinkler").onclick = () => {
        if (typeof Game !== "undefined") {
          if (Game.PopMostWrinklers) Game.PopMostWrinklers();
          else {
            let bestIdx = -1, bestVal = -1;
            Game.wrinklers.forEach((w, i) => {
              if (w.sucked > bestVal) {
                bestVal = w.sucked;
                bestIdx = i;
              }
            });
            if (bestIdx !== -1) {
              Game.wrinklers[bestIdx].hp = 0;
              writeLog("Grandmapocalypse", `Popped wrinkler holding ${Beautify(bestVal)} cookies.`);
              Foxy.showToast("Popped most valuable wrinkler!", { type: "success" });
            } else {
              Foxy.showToast("No wrinklers found", { type: "info" });
            }
          }
        }
      };

      container.querySelector("#btn-grandma-face").onclick = () => {
        if (typeof Game !== "undefined") {
          Game.addClass("elderWrath");
          writeLog("Grandmapocalypse", "Added elderWrath class style overlay.");
          Foxy.showToast("Grandma overlay activated!", { type: "info" });
        }
      };

      container.querySelector("#btn-calc-wrath-rewards").onclick = () => {
        if (typeof Game !== "undefined" && Game.CalculateWrathCookies) {
          Game.CalculateWrathCookies();
          writeLog("Grandmapocalypse", "Recalculated wrinkler sucked cookie values.");
          Foxy.showToast("Rewards calculated!", { type: "success" });
        }
      };

      const selectAnger = container.querySelector("#select-grandma-anger");
      selectAnger.onchange = (e) => {
        if (typeof Game !== "undefined") {
          const val = parseInt(e.target.value);
          Game.elderWrath = val;
          writeLog("Grandmapocalypse", `Elder Wrath stage updated to: ${val}.`);
          Foxy.showToast("Grandmapocalypse Stage updated", { type: "info" });
        }
      };

      container.querySelector("#btn-set-wrinkler-limit").onclick = () => {
        if (typeof Game !== "undefined") {
          const val = parseInt(container.querySelector("#input-wrinkler-limit").value) || 10;
          Game.wrinklerLimit = val;
          writeLog("Grandmapocalypse", `Wrinkler capacity limits adjusted to ${val}.`);
          Foxy.showToast(`Limit adjusted to ${val}!`, { type: "success" });
        }
      };

      const chkNoWrinklers = container.querySelector("#chk-no-wrinklers");
      chkNoWrinklers.onchange = (e) => {
        CC_STATE.noWrinklers = e.target.checked;
        if (CC_STATE.noWrinklers) {
          CC_STATE.originalSpawnWrinkler = Game.spawnWrinkler;
          Game.spawnWrinkler = () => { return; };
          Game.PopAllWrinklers();
          writeLog("Grandmapocalypse", "Wrinkler spawns blocked.");
        } else {
          if (CC_STATE.originalSpawnWrinkler) Game.spawnWrinkler = CC_STATE.originalSpawnWrinkler;
          writeLog("Grandmapocalypse", "Wrinkler spawns unblocked.");
        }
      };

      const chkAutoPledge = container.querySelector("#chk-auto-pledge");
      chkAutoPledge.onchange = (e) => {
        CC_STATE.autoPledge = e.target.checked;
        if (CC_STATE.autoPledge) {
          CC_STATE.pledgeInterval = setInterval(() => {
            const up = Game.Upgrades['Elder Pledge'];
            if (up && up.unlocked && !up.bought && Game.cookies >= up.getPrice()) {
              up.buy();
              writeLog("Grandmapocalypse", "Auto-purchased Elder Pledge.");
            }
          }, 1000);
          writeLog("Grandmapocalypse", "Auto Elder Pledge buy sequence ENABLED.");
        } else {
          if (CC_STATE.pledgeInterval) clearInterval(CC_STATE.pledgeInterval);
          writeLog("Grandmapocalypse", "Auto Elder Pledge buy sequence DISABLED.");
        }
      };

      container.querySelector("#btn-pledge-set").onclick = () => {
        const val = parseFloat(container.querySelector("#input-pledge-minutes").value) || 60;
        Game.pledgeT = val * 60 * Game.fps;
        writeLog("Grandmapocalypse", `Elder Pledge timer set to ${val} minutes.`);
        Foxy.showToast(`Pledge timer set to ${val}m`, { type: "success" });
      };

      return container;
    }

    function renderCheatsTab() {
      const container = document.createElement("div");
      container.style.display = "flex";
      container.style.flexDirection = "column";
      container.style.gap = "12px";

      container.innerHTML = `
        <div style="font-size: 16px; font-weight: 700; color: var(--foxy-accent); margin-bottom: 4px;">Developer Cheats Menu</div>
        
        <div class="foxy-card" style="gap: 10px; flex-wrap: wrap;">
          <button id="btn-sesame">Toggle Sesame Panel</button>
          <button id="btn-ruin" class="danger">Ruin the Fun</button>
          <button id="btn-all-upgrades" class="secondary">Unlock All Upgrades</button>
          <button id="btn-all-achievs" class="secondary">Unlock All Achievements</button>
          <button id="btn-level-buildings" class="secondary">Level Up All Buildings</button>
          <button id="btn-ascend-tree" class="secondary">Build Ascend Tree</button>
          <button id="btn-all-debugs">Unlock All Debug Upgrades</button>
          <button id="btn-debug-cps" class="secondary">Toggle Debug Upgrade CpS</button>
        </div>

        <div class="foxy-card" style="flex-direction: column; align-items: flex-start; gap: 8px;">
          <div style="font-weight: 600;">Activate Special Debug Upgrades</div>
          <div style="font-size: 12px; color: var(--foxy-text-muted); margin-bottom: 4px;">Earn individual mythical developer-only utility upgrades.</div>
          <div style="display: flex; gap: 8px; width: 100%; flex-wrap: wrap;">
            <button id="btn-debug-ultrascience">Ultrascience (Instant Research)</button>
            <button id="btn-debug-goldhoard">Gold Hoard (Golden Cookies Spam)</button>
          </div>
        </div>

        <div class="foxy-card" style="flex-direction: column; align-items: flex-start; gap: 8px;">
          <div style="font-weight: 600;">Custom Cookie Generation</div>
          <div style="font-size: 12px; color: var(--foxy-text-muted); margin-bottom: 4px;">Instantly add a specified volume of cookies directly to your bank.</div>
          <div style="display: flex; gap: 8px; width: 100%;">
            <input type="text" id="input-cookie-amount" value="1000000000" style="flex: 1;">
            <button id="btn-generate-cookies">Generate</button>
          </div>
        </div>

        <div class="foxy-card" style="flex-direction: column; align-items: flex-start; gap: 8px;">
          <div style="font-weight: 600;">Sugar Lump Spawner</div>
          <div style="font-size: 12px; color: var(--foxy-text-muted); margin-bottom: 4px;">Generate Sugar Lumps or instantly mature the current lump.</div>
          <div style="display: flex; gap: 8px; width: 100%; margin-bottom: 8px;">
            <input type="number" id="input-lump-amount" value="10" style="flex: 1;">
            <button id="btn-generate-lumps">Spawn Lumps</button>
          </div>
          <button id="btn-ripen-lump" class="secondary" style="width: 100%;">Instantly Ripen & Harvest Current Lump</button>
        </div>

        <div class="foxy-card" style="flex-direction: column; align-items: flex-start; gap: 8px;">
          <div style="font-weight: 600;">Engine Speed / Time Acceleration</div>
          <div style="font-size: 12px; color: var(--foxy-text-muted);">Increase the internal game loop ticking speed (Standard is 30 FPS).</div>
          <div style="display: flex; gap: 8px; width: 100%; align-items: center;">
            <input type="range" id="slider-game-speed" min="30" max="1000" value="${typeof Game !== 'undefined' ? Game.fps : 30}" style="flex: 1;">
            <span id="label-game-speed" style="min-width: 60px; text-align: right;">${typeof Game !== 'undefined' ? Game.fps : 30} FPS</span>
          </div>
        </div>
      `;

      container.querySelector("#btn-sesame").onclick = () => {
        if (typeof Game !== "undefined") {
          Game.OpenSesame();
          writeLog("Cheats", "Toggled native OpenSesame Dev/Cheat panel.");
          Foxy.showToast("Sesame debug panel toggled!", { type: "info" });
        }
      };

      container.querySelector("#btn-ruin").onclick = async () => {
        if (typeof Game !== "undefined") {
          const confirm = await Foxy.confirmModal("Are you sure you want to run RuinTheFun? This unlocks everything, builds all items, and grants infinite cookies.", { danger: true });
          if (confirm) {
            Game.RuinTheFun(1);
            writeLog("Cheats", "Executed RuinTheFun command.");
            Foxy.showToast("RuinTheFun executed!", { type: "success" });
          }
        }
      };

      container.querySelector("#btn-all-upgrades").onclick = () => {
        if (typeof Game !== "undefined") {
          if (Game.SetAllUpgrade) Game.SetAllUpgrade(1);
          else if (Game.SetAllUpgrades) Game.SetAllUpgrades(1);
          writeLog("Cheats", "Unlocked all upgrades.");
          Foxy.showToast("All upgrades unlocked!", { type: "success" });
        }
      };

      container.querySelector("#btn-all-achievs").onclick = () => {
        if (typeof Game !== "undefined") {
          Game.SetAllAchievs(1);
          writeLog("Cheats", "Unlocked all achievements.");
          Foxy.showToast("All achievements unlocked!", { type: "success" });
        }
      };

      container.querySelector("#btn-level-buildings").onclick = () => {
        if (typeof Game !== "undefined") {
          Game.ObjectsById.forEach(o => o.levelUp());
          writeLog("Cheats", "Leveled up all buildings.");
          Foxy.showToast("All buildings leveled up (+1 level)!", { type: "success" });
        }
      };

      container.querySelector("#btn-ascend-tree").onclick = () => {
        if (typeof Game !== "undefined") {
          Game.BuildAscendTree();
          writeLog("Cheats", "Ascend Tree built.");
          Foxy.showToast("Ascend Tree constructed!", { type: "success" });
        }
      };

      container.querySelector("#btn-all-debugs").onclick = () => {
        if (typeof Game !== "undefined" && Game.GetAllDebugs) {
          Game.GetAllDebugs();
          writeLog("Cheats", "Earned all special debug upgrades.");
          Foxy.showToast("Debug upgrades added!", { type: "success" });
        }
      };

      container.querySelector("#btn-debug-cps").onclick = () => {
        if (typeof Game !== "undefined" && Game.DebugUpgradeCpS) {
          Game.DebugUpgradeCpS();
          writeLog("Cheats", "Toggled DebugUpgradeCpS values.");
          Foxy.showToast("Debug CpS toggled!", { type: "info" });
        }
      };

      container.querySelector("#btn-debug-ultrascience").onclick = () => {
        if (typeof Game !== "undefined" && Game.Upgrades['Ultrascience']) {
          Game.Upgrades['Ultrascience'].earn();
          writeLog("Cheats", "Earned Ultrascience debug upgrade (instant research).");
          Foxy.showToast("Ultrascience earned!", { type: "success" });
        }
      };

      container.querySelector("#btn-debug-goldhoard").onclick = () => {
        if (typeof Game !== "undefined" && Game.Upgrades['Gold hoard']) {
          Game.Upgrades['Gold hoard'].earn();
          writeLog("Cheats", "Earned Gold hoard debug upgrade (frequent golden cookies).");
          Foxy.showToast("Gold hoard earned!", { type: "success" });
        }
      };

      container.querySelector("#btn-generate-cookies").onclick = () => {
        if (typeof Game !== "undefined") {
          const val = parseFloat(container.querySelector("#input-cookie-amount").value) || 0;
          Game.Earn(val);
          writeLog("Cheats", `Generated ${Beautify(val)} cookies.`);
          Foxy.showToast(`Earned ${Beautify(val)} cookies!`, { type: "success" });
        }
      };

      container.querySelector("#btn-generate-lumps").onclick = () => {
        if (typeof Game !== "undefined") {
          const val = parseInt(container.querySelector("#input-lump-amount").value) || 0;
          Game.gainLumps(val);
          writeLog("Cheats", `Spawned ${val} Sugar Lumps.`);
          Foxy.showToast(`Gained ${val} Sugar Lumps!`, { type: "success" });
        }
      };

      container.querySelector("#btn-ripen-lump").onclick = () => {
        if (typeof Game !== "undefined") {
          Game.lumpT = Date.now() - Game.lumpOverripeAge;
          Game.clickLump();
          writeLog("Cheats", "Instantly ripened and harvested current Sugar Lump.");
          Foxy.showToast("Sugar lump harvested!", { type: "success" });
        }
      };

      const speedSlider = container.querySelector("#slider-game-speed");
      const speedLabel = container.querySelector("#label-game-speed");
      
      speedSlider.oninput = (e) => {
        if (typeof Game !== "undefined") {
          const val = parseInt(e.target.value);
          Game.fps = val;
          speedLabel.textContent = `${val} FPS`;
          writeLog("Cheats", `Adjusted game ticking engine rate to ${val} FPS.`);
        }
      };

      return container;
    }

    function renderUITab() {
      const container = document.createElement("div");
      container.style.display = "flex";
      container.style.flexDirection = "column";
      container.style.gap = "12px";

      container.innerHTML = `
        <div style="font-size: 16px; font-weight: 700; color: var(--foxy-accent); margin-bottom: 4px;">UI, Visuals & Performance Adjustments</div>
        
        <div class="foxy-card">
          <div style="flex: 1;">
            <div style="font-weight: 600;">Party Mode UI</div>
            <div style="font-size: 12px; color: var(--foxy-text-muted);">Enables native engine disco flash effects.</div>
          </div>
          <label class="foxy-switch">
            <input type="checkbox" id="chk-ui-party" ${Game.PARTY ? "checked" : ""}>
            <span class="foxy-switch-slider"></span>
          </label>
        </div>

        <div class="foxy-card">
          <div style="flex: 1;">
            <div style="font-weight: 600;">Fancy Graphics</div>
            <div style="font-size: 12px; color: var(--foxy-text-muted);">Toggles css filters, high resolution backgrounds, and complex renderings.</div>
          </div>
          <label class="foxy-switch">
            <input type="checkbox" id="chk-ui-fancy" ${Game.prefs.fancy ? "checked" : ""}>
            <span class="foxy-switch-slider"></span>
          </label>
        </div>

        <div class="foxy-card">
          <div style="flex: 1;">
            <div style="font-weight: 600;">Cookie Clicking Particles</div>
            <div style="font-size: 12px; color: var(--foxy-text-muted);">Toggle spawning small cookies on click. Useful to reduce browser rendering lag.</div>
          </div>
          <label class="foxy-switch">
            <input type="checkbox" id="chk-ui-particles" ${Game.particles ? "checked" : ""}>
            <span class="foxy-switch-slider"></span>
          </label>
        </div>

        <div class="foxy-card">
          <div style="flex: 1;">
            <div style="font-weight: 600;">Background Milk</div>
            <div style="font-size: 12px; color: var(--foxy-text-muted);">Toggles rendering the bottom milk graphics layer.</div>
          </div>
          <label class="foxy-switch">
            <input type="checkbox" id="chk-ui-milk" ${Game.prefs.milk ? "checked" : ""}>
            <span class="foxy-switch-slider"></span>
          </label>
        </div>

        <div class="foxy-card" style="flex-direction: column; align-items: flex-start; gap: 8px;">
          <div style="font-weight: 600;">Force UI Background Skin</div>
          <div style="font-size: 12px; color: var(--foxy-text-muted);">Overwrites current background wall skin manually.</div>
          <select id="select-ui-bg" style="width: 100%;">
            <option value="">Reset Default</option>
            <option value="grandmas">Grandmas</option>
            <option value="mine">Mine</option>
            <option value="factory">Factory</option>
            <option value="portal">Portal</option>
          </select>
        </div>
      `;

      container.querySelector("#chk-ui-party").onchange = (e) => {
        Game.PARTY = e.target.checked;
        writeLog("UI", `Party mode set to ${Game.PARTY ? "ON" : "OFF"}.`);
      };

      container.querySelector("#chk-ui-fancy").onchange = (e) => {
        Game.prefs.fancy = e.target.checked ? 1 : 0;
        writeLog("UI", `Fancy graphics preferences set to ${Game.prefs.fancy ? "ON" : "OFF"}.`);
      };

      container.querySelector("#chk-ui-particles").onchange = (e) => {
        Game.particles = e.target.checked ? 1 : 0;
        writeLog("UI", `Click particles set to ${Game.particles ? "ON" : "OFF"}.`);
      };

      container.querySelector("#chk-ui-milk").onchange = (e) => {
        Game.prefs.milk = e.target.checked ? 1 : 0;
        writeLog("UI", `Bottom background milk layer set to ${Game.prefs.milk ? "ON" : "OFF"}.`);
      };

      container.querySelector("#select-ui-bg").onchange = (e) => {
        const val = e.target.value;
        if (val) {
          Game.Background.force(val);
          writeLog("UI", `Forced background structure: ${val}.`);
        } else {
          Game.Background.reset();
          writeLog("UI", "Reset background skin.");
        }
      };

      return container;
    }

    function renderStatsTab() {
      const container = document.createElement("div");
      container.style.display = "flex";
      container.style.flexDirection = "column";
      container.style.gap = "12px";

      if (statsTimer) clearInterval(statsTimer);

      const updateUI = () => {
        if (!document.contains(container)) {
          clearInterval(statsTimer);
          statsTimer = null;
          return;
        }
        if (typeof Game === "undefined") return;

        container.innerHTML = `
          <div style="font-size: 16px; font-weight: 700; color: var(--foxy-accent); margin-bottom: 4px;">Real-Time Bakery Telemetry</div>
          <div class="foxy-card" style="flex-direction: column; align-items: flex-start; gap: 8px; width: 100%;">
            <div><strong>Cookies in Bank:</strong> <span style="color: #ffd97a">${Beautify(Game.cookies)}</span></div>
            <div><strong>Cookies per Second (CpS):</strong> <span style="color: var(--foxy-online)">${Beautify(Game.cookiesPs)}</span></div>
            <div><strong>Raw CpS (Unmultiplied):</strong> <span>${Beautify(Game.cookiesPsRaw)}</span></div>
            <div><strong>Total Hand Clicks:</strong> <span>${Beautify(Game.cookieClicks)}</span></div>
            <div><strong>Golden Cookie Clicks:</strong> <span style="color: #f0b232">${Game.goldenClicks}</span></div>
            <div><strong>Session Duration:</strong> <span>${Game.sayTime(Game.startDate ? (Date.now() - Game.startDate) / 1000 * Game.fps : 0)}</span></div>
          </div>
        `;
      };

      updateUI();
      statsTimer = setInterval(updateUI, 1000);
      return container;
    }

    function renderLogTab(windowAPI) {
      chatFeedAPI = windowAPI.createChatFeed(logMessages, (commandStr) => {
        writeLog("User Input", commandStr);

        if (commandStr.trim().toLowerCase() === "/golden") {
          if (typeof Game !== "undefined" && Game.goldenCookie) {
            Game.goldenCookie.spawn();
            writeLog("Console", "Forced a Shimmer spawn.");
          }
        } else if (commandStr.trim().toLowerCase() === "/grantcookies") {
          if (typeof Game !== "undefined") {
            Game.Earn(1000000000);
            writeLog("Console", "Credited 1,000,000,000 bank cookies.");
          }
        }
      });
      return chatFeedAPI.el;
    }

    function renderSavesTab() {
      const container = document.createElement("div");
      container.style.display = "flex";
      container.style.flexDirection = "column";
      container.style.gap = "12px";

      const currentCookies = typeof Game !== "undefined" ? Game.cookies : 0;
      const currentLumps = typeof Game !== "undefined" ? Game.lumps : 0;
      const currentPrestige = typeof Game !== "undefined" ? Game.prestige : 0;

      container.innerHTML = `
        <div style="font-size: 16px; font-weight: 700; color: var(--foxy-accent); margin-bottom: 4px;">Save File & Stat Editor</div>
        
        <div class="foxy-card" style="flex-direction: column; align-items: flex-start; gap: 8px;">
          <div style="font-weight: 600;">Export / Import Save String</div>
          <div style="font-size: 12px; color: var(--foxy-text-muted); margin-bottom: 4px;">Backup or migrate your current session via standard base64 save codes.</div>
          <textarea id="txt-save-string" placeholder="Paste a save code here to import, or click 'Export Current' to generate yours..." style="width: 100%; height: 80px; font-family: monospace; font-size: 11px;"></textarea>
          <div style="display: flex; gap: 8px; width: 100%; margin-top: 4px;">
            <button id="btn-save-export" class="secondary" style="flex: 1;">Export Current Save</button>
            <button id="btn-save-import" style="flex: 1;">Import Save String</button>
          </div>
        </div>

        <div class="foxy-card" style="flex-direction: column; align-items: flex-start; gap: 10px;">
          <div style="font-weight: 600;">Stat Editor (Direct Variable Injections)</div>
          <div style="font-size: 12px; color: var(--foxy-text-muted); margin-bottom: 4px;">Modifies live runtime numbers instantly without full-menu saves.</div>
          
          <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
            <div>
              <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 2px;">Bank Cookies:</label>
              <input type="text" id="edit-cookies" value="${currentCookies}">
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 2px;">Sugar Lumps:</label>
              <input type="number" id="edit-lumps" value="${currentLumps}">
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 2px;">Prestige Level (Heavenly Chips):</label>
              <input type="number" id="edit-prestige" value="${currentPrestige}">
            </div>
          </div>
          <button id="btn-save-apply" style="width: 100%; margin-top: 6px;">Apply Stat Modifications</button>
        </div>

        <div class="foxy-card" style="flex-direction: column; align-items: flex-start; gap: 8px;">
          <div style="font-weight: 600; color: var(--foxy-dnd);">System Reset Utilities</div>
          <div style="font-size: 12px; color: var(--foxy-text-muted);">Perform a soft reset (ascension legacy) or a complete hardware hard-wipe.</div>
          <div style="display: flex; gap: 8px; width: 100%; margin-top: 4px;">
            <button id="btn-reset-soft" class="secondary" style="flex: 1;">Ascend (Soft Reset)</button>
            <button id="btn-reset-hard" class="danger" style="flex: 1;">Hard Reset (Wipe Save)</button>
          </div>
        </div>
      `;

      const txtSave = container.querySelector("#txt-save-string");

      container.querySelector("#btn-save-export").onclick = () => {
        if (typeof Game !== "undefined") {
          const code = Game.WriteSave(1);
          txtSave.value = code;
          txtSave.select();
          writeLog("Saves", "Generated and selected current base64 save string.");
          Foxy.showToast("Save exported to textbox!", { type: "success" });
        }
      };

      container.querySelector("#btn-save-import").onclick = async () => {
        if (typeof Game !== "undefined") {
          const code = txtSave.value.trim();
          if (!code) {
            Foxy.showToast("Paste a valid save string first", { type: "error" });
            return;
          }
          const confirm = await Foxy.confirmModal("Importing this save will overwrite your current progress. Proceed?", { danger: true });
          if (confirm) {
            Game.ImportSaveCode(code);
            writeLog("Saves", "Imported external save file.");
            Foxy.showToast("Save code imported!", { type: "success" });
            setTimeout(() => {
              assistantWindow.setContent(renderSavesTab());
            }, 500);
          }
        }
      };

      container.querySelector("#btn-save-apply").onclick = () => {
        if (typeof Game !== "undefined") {
          const cookiesVal = parseFloat(container.querySelector("#edit-cookies").value) || 0;
          const lumpsVal = parseInt(container.querySelector("#edit-lumps").value) || 0;
          const prestigeVal = parseInt(container.querySelector("#edit-prestige").value) || 0;

          Game.cookies = cookiesVal;
          Game.cookiesEarned = Math.max(Game.cookiesEarned, cookiesVal);
          Game.lumps = lumpsVal;
          Game.prestige = prestigeVal;
          Game.heavenlyChips = prestigeVal;

          Game.recalculateGains = 1;
          
          writeLog("Saves", `Applied live edits: Cookies=${Beautify(cookiesVal)}, Lumps=${lumpsVal}, Prestige=${prestigeVal}.`);
          Foxy.showToast("Stat modifications applied!", { type: "success" });
        }
      };

      container.querySelector("#btn-reset-soft").onclick = async () => {
        if (typeof Game !== "undefined") {
          const confirm = await Foxy.confirmModal("Are you sure you want to Ascend? This will perform a soft reset and earn you heavenly upgrades.", { confirmLabel: "Ascend" });
          if (confirm) {
            Game.Ascend(1);
            writeLog("Saves", "Executed Ascension Soft Reset.");
            Foxy.showToast("Ascension sequence triggered!", { type: "success" });
          }
        }
      };

      container.querySelector("#btn-reset-hard").onclick = async () => {
        if (typeof Game !== "undefined") {
          const confirm = await Foxy.confirmModal("WARNING: This will completely delete your save file. You will lose all progress, achievements, and upgrades permanently.", { danger: true, confirmLabel: "WIPE ALL PROGRESS" });
          if (confirm) {
            Game.HardReset(2);
            writeLog("Saves", "Hard reset save file completely.");
            Foxy.showToast("Save file cleared!", { type: "error" });
            setTimeout(() => {
              location.reload();
            }, 1000);
          }
        }
      };

      return container;
    }

    // 7.2 Experimental Views (Stock Market Auto Trader, Lump Geneticist, Quantum Clicking)
    function renderTraderTab() {
      const container = document.createElement("div");
      container.style.display = "flex";
      container.style.flexDirection = "column";
      container.style.gap = "12px";

      const mg = getMinigame("Bank");
      if (!mg) {
        container.innerHTML = `
          <div style="font-size: 16px; font-weight: 700; color: var(--foxy-accent); margin-bottom: 4px;">Experimental Auto-Trader</div>
          <div class="foxy-card" style="flex-direction: column; align-items: center; text-align: center; padding: 24px;">
            <div style="font-weight: 600; margin-bottom: 8px;">Stock Market Not Unlocked</div>
            <div style="font-size: 13px; color: var(--foxy-text-muted); margin-bottom: 16px;">You must level up Banks to Level 1 using Sugar Lumps to unlock the stock market algorithm.</div>
          </div>
        `;
        return container;
      }

      container.innerHTML = `
        <div style="font-size: 16px; font-weight: 700; color: var(--foxy-accent); margin-bottom: 4px;">Experimental Auto-Trader</div>
        
        <div class="foxy-card">
          <div style="flex: 1;">
            <div style="font-weight: 600;">Stock Market Auto-Broker</div>
            <div style="font-size: 12px; color: var(--foxy-text-muted);">Scans the market every tick. Auto-buys stocks dropping below 40% resting value and auto-sells when rising above 120%.</div>
          </div>
          <label class="foxy-switch">
            <input type="checkbox" id="chk-auto-trade" ${CC_STATE.autoTrade ? "checked" : ""}>
            <span class="foxy-switch-slider"></span>
          </label>
        </div>
      `;

      const chkTrade = container.querySelector("#chk-auto-trade");
      chkTrade.onchange = (e) => {
        CC_STATE.autoTrade = e.target.checked;
        if (CC_STATE.autoTrade) {
          tradeTimer = setInterval(runAutoTradeCycle, 30000); // Check every 30 seconds
          writeLog("System", "Stock Market Auto-Broker algorithm ENABLED.");
        } else {
          if (tradeTimer) clearInterval(tradeTimer);
          writeLog("System", "Stock Market Auto-Broker algorithm DISABLED.");
        }
      };

      return container;
    }

    function renderLumpGenTab() {
      const container = document.createElement("div");
      container.style.display = "flex";
      container.style.flexDirection = "column";
      container.style.gap = "12px";

      container.innerHTML = `
        <div style="font-size: 16px; font-weight: 700; color: var(--foxy-accent); margin-bottom: 4px;">Sugar Lump Geneticist</div>
        
        <div class="foxy-card" style="flex-direction: column; align-items: flex-start; gap: 8px;">
          <div style="font-weight: 600;">Lock Active Sugar Lump Type</div>
          <div style="font-size: 12px; color: var(--foxy-text-muted);">Force the active sugar lump currently maturing on your tree to a specified rare variant.</div>
          <select id="select-forced-lump" style="width: 100%;">
            <option value="none" ${CC_STATE.forceLumpType === null ? "selected" : ""}>None (Let Game Decide)</option>
            <option value="0" ${CC_STATE.forceLumpType === 0 ? "selected" : ""}>Normal Lump</option>
            <option value="1" ${CC_STATE.forceLumpType === 1 ? "selected" : ""}>Bifurcated Lump</option>
            <option value="2" ${CC_STATE.forceLumpType === 2 ? "selected" : ""}>Caramelized Lump</option>
            <option value="3" ${CC_STATE.forceLumpType === 3 ? "selected" : ""}>Golden Lump</option>
            <option value="4" ${CC_STATE.forceLumpType === 4 ? "selected" : ""}>Meaty Lump</option>
          </select>
        </div>
      `;

      const selLump = container.querySelector("#select-forced-lump");
      selLump.onchange = (e) => {
        const val = e.target.value;
        if (val === "none") {
          CC_STATE.forceLumpType = null;
          if (lumpGeneticTimer) clearInterval(lumpGeneticTimer);
          writeLog("Saves", "Removed Sugar Lump lock.");
        } else {
          const type = parseInt(val);
          CC_STATE.forceLumpType = type;
          if (lumpGeneticTimer) clearInterval(lumpGeneticTimer);
          
          lumpGeneticTimer = setInterval(() => {
            if (typeof Game !== "undefined" && CC_STATE.forceLumpType !== null) {
              Game.lumpCurrentType = CC_STATE.forceLumpType;
            }
          }, 1000);
          writeLog("Saves", `Locked in Sugar Lump variant type to ID: ${type}.`);
          Foxy.showToast("Sugar lump locked!", { type: "success" });
        }
      };

      return container;
    }

    function renderQuantumTab() {
      const container = document.createElement("div");
      container.style.display = "flex";
      container.style.flexDirection = "column";
      container.style.gap = "12px";

      container.innerHTML = `
        <div style="font-size: 16px; font-weight: 700; color: var(--foxy-accent); margin-bottom: 4px;">Quantum Clicking & Spellcasting</div>
        
        <div class="foxy-card" style="flex-direction: column; align-items: flex-start; gap: 8px;">
          <div style="font-weight: 600;">Manual Click Multiplier</div>
          <div style="font-size: 12px; color: var(--foxy-text-muted);">Triggers multiple clicks for every individual physical click made (Slider: 1x to 100x).</div>
          <div style="display: flex; gap: 8px; width: 100%; align-items: center;">
            <input type="range" id="slider-click-mult" min="1" max="100" value="${CC_STATE.clickMultiplier}" style="flex: 1;">
            <span id="label-click-mult" style="min-width: 40px; text-align: right;">${CC_STATE.clickMultiplier}x</span>
          </div>
        </div>

        <div class="foxy-card" style="flex-direction: column; align-items: flex-start; gap: 10px;">
          <div style="font-weight: 600;">Instant Dragon Aura Swapper</div>
          <div style="font-size: 12px; color: var(--foxy-text-muted);">Inject aura IDs directly into slots instantly, bypassing sacrificing buildings.</div>
          <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
            <div>
              <label style="font-size: 12px; font-weight: 600;">Slot 1 Aura ID (1: Radiant Appetite, 2: Dragon's Fortune...):</label>
              <input type="number" id="input-aura-1" value="${typeof Game !== 'undefined' ? Game.dragonAura : 0}" min="0" max="22">
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 600;">Slot 2 Aura ID:</label>
              <input type="number" id="input-aura-2" value="${typeof Game !== 'undefined' ? Game.dragonAura2 : 0}" min="0" max="22">
            </div>
          </div>
          <button id="btn-force-auras" style="width: 100%;">Force Dragon Auras</button>
        </div>

        <div class="foxy-card" style="flex-direction: column; align-items: flex-start; gap: 10px;">
          <div style="font-weight: 600;">Auto Spellcaster</div>
          <div style="font-size: 12px; color: var(--foxy-text-muted);">Automatically casts selected spell immediately once your mana is fully recovered.</div>
          <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
            <select id="select-cast-spell" style="width: 100%;">
              <option value="5" ${CC_STATE.autoCastSpellId === 5 ? "selected" : ""}>Force the Hand of Fate (Golden Cookie)</option>
              <option value="1" ${CC_STATE.autoCastSpellId === 1 ? "selected" : ""}>Conjure Baked Goods</option>
              <option value="2" ${CC_STATE.autoCastSpellId === 2 ? "selected" : ""}>Spontaneous Edifice</option>
            </select>
            <div style="display: flex; justify-content: space-between; width: 100%; align-items: center; margin-top: 4px;">
              <span style="font-size: 13px;">Auto-Cast Spell Toggle</span>
              <label class="foxy-switch">
                <input type="checkbox" id="chk-auto-cast-spell" ${CC_STATE.autoCastSpell ? "checked" : ""}>
                <span class="foxy-switch-slider"></span>
              </label>
            </div>
          </div>
        </div>
      `;

      const multSlider = container.querySelector("#slider-click-mult");
      const multLabel = container.querySelector("#label-click-mult");
      multSlider.oninput = (e) => {
        const val = parseInt(e.target.value);
        CC_STATE.clickMultiplier = val;
        multLabel.textContent = `${val}x`;
      };

      container.querySelector("#btn-force-auras").onclick = () => {
        if (typeof Game !== "undefined") {
          const aura1 = parseInt(container.querySelector("#input-aura-1").value) || 0;
          const aura2 = parseInt(container.querySelector("#input-aura-2").value) || 0;

          Game.dragonAura = aura1;
          Game.dragonAura2 = aura2;
          Game.recalculateGains = 1;

          writeLog("Dragon", `Forced Dragon Auras to Slot 1: ${aura1}, Slot 2: ${aura2}.`);
          Foxy.showToast("Auras forced successfully!", { type: "success" });
        }
      };

      const selSpell = container.querySelector("#select-cast-spell");
      selSpell.onchange = (e) => {
        CC_STATE.autoCastSpellId = parseInt(e.target.value);
      };

      const chkCast = container.querySelector("#chk-auto-cast-spell");
      chkCast.onchange = (e) => {
        CC_STATE.autoCastSpell = e.target.checked;
        if (CC_STATE.autoCastSpell) {
          spellCastTimer = setInterval(runAutoCastCycle, 2000);
          writeLog("System", "Auto Grimoire Spellcaster ENABLED.");
        } else {
          if (spellCastTimer) clearInterval(spellCastTimer);
          writeLog("System", "Auto Grimoire Spellcaster DISABLED.");
        }
      };

      return container;
    }

    // 8. Define Channels Map
    let assistantWindow;
    const discordChannels = [
      {
        id: "clicks",
        name: "auto-clickers",
        category: "Automation",
        active: true,
        onClick: () => assistantWindow.setContent(renderClickerTab())
      },
      {
        id: "buyer",
        name: "auto-buyers",
        category: "Automation",
        onClick: () => assistantWindow.setContent(renderAutoBuyTab())
      },
      {
        id: "cookie-prod",
        name: "production-mods",
        category: "System Core",
        onClick: () => assistantWindow.setContent(renderCookieProdTab())
      },
      {
        id: "shimmer-spawner",
        name: "shimmer-spawners",
        category: "System Core",
        onClick: () => assistantWindow.setContent(renderShimmerTab())
      },
      {
        id: "building-cheats",
        name: "building-cheats",
        category: "System Core",
        onClick: () => assistantWindow.setContent(renderBuildingTab())
      },
      {
        id: "garden",
        name: "garden-farm",
        category: "Minigame Hacks",
        onClick: () => assistantWindow.setContent(renderGardenTab())
      },
      {
        id: "grimoire",
        name: "grimoire-magic",
        category: "Minigame Hacks",
        onClick: () => assistantWindow.setContent(renderGrimoireTab())
      },
      {
        id: "temple",
        name: "temple-pantheon",
        category: "Minigame Hacks",
        onClick: () => assistantWindow.setContent(renderTempleTab())
      },
      {
        id: "stock",
        name: "stock-market",
        category: "Minigame Hacks",
        onClick: () => assistantWindow.setContent(renderStockTab())
      },
      {
        id: "trader",
        name: "stock-autotrader",
        category: "Experimental Lab",
        onClick: () => assistantWindow.setContent(renderTraderTab())
      },
      {
        id: "lump-gen",
        name: "lump-geneticist",
        category: "Experimental Lab",
        onClick: () => assistantWindow.setContent(renderLumpGenTab())
      },
      {
        id: "quantum",
        name: "quantum-clicking",
        category: "Experimental Lab",
        onClick: () => assistantWindow.setContent(renderQuantumTab())
      },
      {
        id: "season",
        name: "seasonal-events",
        category: "World Controls",
        onClick: () => assistantWindow.setContent(renderSeasonTab())
      },
      {
        id: "grandma",
        name: "grandmapocalypse",
        category: "World Controls",
        onClick: () => assistantWindow.setContent(renderGrandmaTab())
      },
      {
        id: "cheats",
        name: "sesame-debug",
        category: "General Cheats",
        onClick: () => assistantWindow.setContent(renderCheatsTab())
      },
      {
        id: "ui-pref",
        name: "ui-and-effects",
        category: "General Cheats",
        onClick: () => assistantWindow.setContent(renderUITab())
      },
      {
        id: "telemetry",
        name: "realtime-stats",
        category: "Diagnostics",
        onClick: () => assistantWindow.setContent(renderStatsTab())
      },
      {
        id: "saves",
        name: "save-editor",
        category: "Diagnostics",
        onClick: () => assistantWindow.setContent(renderSavesTab())
      },
      {
        id: "logs",
        name: "action-logs",
        category: "Diagnostics",
        onClick: () => assistantWindow.setContent(renderLogTab(assistantWindow))
      }
    ];

    // 9. Instantiate FoxyUI Window
    assistantWindow = Foxy.createWindow({
      title: "CC-Assistant Hub",
      width: 740,
      height: 490,
      layout: "discord",
      servers: [
        { id: "cc-main", name: "CC", active: true }
      ],
      channels: discordChannels,
      members: [
        { name: "Sugar Bunny", status: "online", activity: "Hopping for lumps" },
        { name: "Grandma", status: "dnd", activity: "Muttering recipes" },
        { name: "Golden Shimmer", status: "idle", activity: "Waiting on chance" }
      ],
      currentUser: {
        name: "Head Baker",
        tag: "1856",
        status: "online"
      },
      onClose: () => {
        stopAutoClick();
        stopAutoGolden();
        stopAutoBuy();
        if (typeof Game !== "undefined") Game.fps = 30; // Reset rate back to default limits on exit
        if (CC_STATE.magicInterval) clearInterval(CC_STATE.magicInterval);
        if (CC_STATE.swapsInterval) clearInterval(CC_STATE.swapsInterval);
        if (CC_STATE.pledgeInterval) clearInterval(CC_STATE.pledgeInterval);
        if (statsTimer) clearInterval(statsTimer);
        if (tickerTimer) clearInterval(tickerTimer);
        if (dragonTimer) clearInterval(dragonTimer);
        if (tradeTimer) clearInterval(tradeTimer);
        if (lumpGeneticTimer) clearInterval(lumpGeneticTimer);
        if (spellCastTimer) clearInterval(spellCastTimer);
        Foxy.showToast("CC-Assistant Window disposed. Running automated loops terminated safely.", { type: "info" });
      }
    });

    // Populate initial dashboard contents
    assistantWindow.setContent(renderClickerTab());

    // 10. Command Palette Integration (Trigger via Ctrl + K)
    Foxy.registerCommand({
      id: "cc.open_sesame",
      label: "Cookie Clicker: Open Sesame (Toggle Debug Menu)",
      category: "Developer Integrations",
      onRun: () => {
        if (typeof Game !== "undefined") {
          Game.OpenSesame();
          writeLog("Cheats", "Toggled native OpenSesame Dev/Cheat panel.");
          Foxy.showToast("Sesame debug panel toggled!", { type: "info" });
        }
      }
    });

    Foxy.registerCommand({
      id: "cc.unlock_all_upgrades",
      label: "Cookie Clicker: Unlock All Upgrades",
      category: "Developer Integrations",
      onRun: () => {
        if (typeof Game !== "undefined") {
          if (Game.SetAllUpgrade) Game.SetAllUpgrade(1);
          else if (Game.SetAllUpgrades) Game.SetAllUpgrades(1);
          writeLog("Cheats", "Unlocked all upgrades via Command Palette.");
          Foxy.showToast("All upgrades unlocked!", { type: "success" });
        }
      }
    });

    Foxy.registerCommand({
      id: "cc.unlock_all_achievs",
      label: "Cookie Clicker: Unlock All Achievements",
      category: "Developer Integrations",
      onRun: () => {
        if (typeof Game !== "undefined") {
          Game.SetAllAchievs(1);
          writeLog("Cheats", "Unlocked all achievements via Command Palette.");
          Foxy.showToast("All achievements unlocked!", { type: "success" });
        }
      }
    });

    Foxy.registerCommand({
      id: "cc.ripen_lump",
      label: "Cookie Clicker: Instantly Ripen Sugar Lump",
      category: "Developer Integrations",
      onRun: () => {
        if (typeof Game !== "undefined") {
          Game.lumpT = Date.now() - Game.lumpOverripeAge;
          Game.clickLump();
          writeLog("Cheats", "Instantly ripened current Sugar Lump via Command Palette.");
          Foxy.showToast("Sugar lump harvested!", { type: "success" });
        }
      }
    });

    writeLog("Loader", "Cookie Clicker Assistant initiated. Open the command palette with <strong>Ctrl+K</strong>.");
    Foxy.showToast("CC-Assistant interface ready~", { type: "success" });
  }
})();
