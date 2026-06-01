// ==UserScript==
// @name         Roblox FoxyUI Ropro-like Enhancer
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  A FoxyUI overlay for Roblox with Ropro-like features (conceptual).
// @author       Your Name
// @match        https://www.roblox.com/*
// @grant        GM_xmlhttpRequest
// @connect      api.roblox.com
// @connect      users.roblox.com
// @connect      games.roblox.com
// @connect      economy.roblox.com
// ==/UserScript==

(function() {
    'use strict';

    if (!window.FoxyUI) {
        console.error("FoxyUI library not found. Please ensure it's loaded before this script.");
        alert("Roblox FoxyUI Enhancer: FoxyUI library is missing!");
        return;
    }

    const FoxyUI = window.FoxyUI;
    console.log("%c[Roblox Enhancer] FoxyUI detected, initializing Ropro-like script...", "color:#9147ff; font-weight:bold;");

    // --- CONFIGURATION & MOCK DATA ---
    // User data (attempt to fetch dynamically if possible, otherwise mock)
    let currentRobloxUser = {
        id: "mockUserID", // Will try to parse from DOM
        name: "Loading...",
        tag: "RBX",
        avatar: "https://www.roblox.com/headshot-thumbnail/image?userId=1&width=420&height=420&format=png", // Default placeholder
        status: "online", // FoxyUI status, not Roblox status
        muted: false, deafened: false
    };

    // FoxyUI Theme
    const CUSTOM_THEME_NAME = "roblox-dark";
    FoxyUI.registerTheme(CUSTOM_THEME_NAME, {
        windowBg: "linear-gradient(135deg, #18191D, #202225, #121315, #242629)",
        bgSize: "400% 400%",
        animation: "foxy-bg-shift 25s ease infinite",
        surface: "rgba(32, 34, 37, 0.9)",
        surfaceAlt: "rgba(24, 25, 28, 0.95)",
        text: "#DCDDDE",
        textMuted: "#72767D",
        header: "rgba(28, 29, 32, 0.98)",
        tabActive: "rgba(85, 126, 240, 0.2)",
        tabInactive: "#72767D",
        tabHover: "rgba(85, 126, 240, 0.1)",
        inputBg: "rgba(30, 31, 34, 0.8)",
        inputBorder: "rgba(255, 255, 255, 0.08)",
        buttonBg: "#557EF0",
        buttonHover: "#426DD1",
        buttonText: "#fff",
        placeholder: "#87898c",
        accent: "#557EF0", // Roblox blue
        accentHover: "#426DD1",
        toastInfo: "#557EF0",
        toastSuccess: "#43B581",
        toastError: "#F04747",
        online: "#43B581",
        idle: "#FAA61A",
        dnd: "#F04747",
        offline: "#72767D",
        divider: "rgba(255, 255, 255, 0.06)",
        mention: "#F04747"
    });
    FoxyUI.setTheme(CUSTOM_THEME_NAME);
    FoxyUI._settings.blur = "12px";
    FoxyUI._settings.radius = "8px";

    // --- GLOBALS ---
    let robloxWindow;
    let cachedRobloxGames = []; // To store fetched game data
    let cachedRobloxFriends = []; // To store fetched friend data
    let robuxBalance = "N/A";

    // --- HELPER FUNCTIONS ---
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    async function fetchRobloxUserData() {
        const userLink = document.querySelector('a.nav-account-icon');
        if (userLink) {
            const userIdMatch = userLink.href.match(/\/users\/(\d+)\//);
            if (userIdMatch && userIdMatch[1]) {
                currentRobloxUser.id = userIdMatch[1];
            }
        }

        const userNameElement = document.querySelector('.nav-links .text-header');
        if (userNameElement) {
            currentRobloxUser.name = userNameElement.textContent.trim();
        }

        const avatarElement = document.querySelector('a.profile-avatar-thumb img');
        if (avatarElement) {
            currentRobloxUser.avatar = avatarElement.src;
        }

        // Attempt to fetch Robux
        try {
            const robuxSpan = document.querySelector('#nav-robux-amount');
            if (robuxSpan) {
                robuxBalance = robuxSpan.textContent.trim();
            } else {
                 // Fallback: try API if not directly in DOM (requires GM_xmlhttpRequest)
                 // This part is complex due to CSRF tokens for authenticated APIs
                 // For now, let's keep it simple with DOM parsing.
            }
        } catch (e) {
            console.warn("[Roblox Enhancer] Could not fetch Robux balance from DOM:", e);
        }

        // Update the FoxyUI user profile
        if (robloxWindow) {
            robloxWindow.setUserProfile(currentRobloxUser);
        }
    }

    async function fetchPopularGames() {
        // In a real extension, this would hit Roblox API. For userscript, mock or parse.
        // Example with GM_xmlhttpRequest (might need more setup for auth/CSRF for some APIs)
        return new Promise(resolve => {
            GM_xmlhttpRequest({
                method: "GET",
                url: "https://games.roblox.com/v1/games/list?sortOrder=Asc&gameGenre=All&maxRows=20&sortKeyword=Popular",
                onload: function(response) {
                    try {
                        const data = JSON.parse(response.responseText);
                        cachedRobloxGames = data.games.map(g => ({
                            id: g.id,
                            name: g.name,
                            creator: g.creatorName,
                            players: g.playerCount,
                            thumbnail: g.thumbnailUrl // Roblox API might return different keys
                        }));
                        resolve(cachedRobloxGames);
                    } catch (e) {
                        console.error("[Roblox Enhancer] Error parsing popular games API:", e);
                        resolve([]);
                    }
                },
                onerror: function(error) {
                    console.error("[Roblox Enhancer] Failed to fetch popular games:", error);
                    resolve([]);
                }
            });
        });
    }

    async function fetchFriends() {
        // This is a complex API call, often requiring user authentication tokens.
        // For a simple userscript, we'll mock it or parse friends *if* they are on the current page.
        // Mock data for demonstration:
        if (currentRobloxUser.id === "mockUserID") {
             // We need a real user ID to fetch friends.
             console.warn("[Roblox Enhancer] Cannot fetch friends for mock user ID.");
             return [];
        }

        return new Promise(resolve => {
            GM_xmlhttpRequest({
                method: "GET",
                url: `https://friends.roblox.com/v1/users/${currentRobloxUser.id}/friends`,
                headers: {
                    "X-CSRF-TOKEN": getCookie("X-CSRF-TOKEN") || "" // This is often dynamic, needs to be fetched
                },
                onload: function(response) {
                    try {
                        const data = JSON.parse(response.responseText);
                        cachedRobloxFriends = data.data.map(f => ({
                            id: f.id,
                            name: f.name,
                            avatar: `https://www.roblox.com/headshot-thumbnail/image?userId=${f.id}&width=420&height=420&format=png`,
                            status: "online", // Roblox API provides real presence, simplifying here
                            activity: "Playing Roblox"
                        }));
                        resolve(cachedRobloxFriends);
                    } catch (e) {
                        console.error("[Roblox Enhancer] Error parsing friends API:", e);
                        resolve([]);
                    }
                },
                onerror: function(error) {
                    console.error("[Roblox Enhancer] Failed to fetch friends:", error);
                    resolve([]);
                }
            });
        });
    }

    // --- FoxyUI WINDOW CREATION ---
    function createRobloxFoxyWindow() {
        robloxWindow = FoxyUI.createWindow({
            title: "Roblox Enhancer (FoxyUI)",
            width: 1000,
            height: 650,
            icon: "https://www.roblox.com/favicon.ico",
            layout: "discord",
            currentUser: currentRobloxUser, // Will be updated dynamically
            servers: [
                { id: "home", name: "Home", iconKey: "discord", home: true, active: true },
                { divider: true },
                { id: "games_hub", name: "Game Hub", iconKey: "box" },
                { id: "friends_list", name: "Friends", iconKey: "user" },
                { id: "inventory", name: "Inventory", iconKey: "wand" },
                { id: "robux_tracker", name: "Robux", iconKey: "sparkles" },
                { divider: true },
                { id: "enhancer_settings", name: "Enhancer Settings", iconKey: "gear" }
            ],
            channels: [
                { category: "Dashboard", id: "welcome", name: "welcome", type: "text", active: true },
                { category: "Dashboard", id: "news-feed", name: "news-feed", type: "text" },
                { category: "Dashboard", id: "activity", name: "player-activity", type: "text" },
                { category: "Tools", id: "auto-join", name: "auto-join-game", type: "text" },
                { category: "Tools", id: "trade-notifier", name: "trade-notifier", type: "text" },
            ],
            memberList: [], // Will populate with fetched friends
            onClose: () => {
                FoxyUI.showToast("Roblox Enhancer window closed. Refresh to reopen.", { type: "info", duration: 5000 });
            },
            onOpen: () => {
                fetchRobloxUserData(); // Update user info on open
            }
        });

        // --- POPULATE TABS / CONTENT ---
        robloxWindow.addTab({
            name: "Dashboard",
            icon: "icon:monitor",
            html: `
                <div style="padding:20px;">
                    <h2 style="margin-top:0; color:var(--foxy-accent);">Roblox Enhancer Dashboard</h2>
                    <p style="color:var(--foxy-text-muted);">Quick overview of your Roblox activities and enhanced features.</p>

                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:15px; margin-top:20px;">
                        <div class="foxy-card" style="flex-direction:column; align-items:flex-start; gap:8px;">
                            <strong style="font-size:16px; color:var(--foxy-text);">Your Robux Balance</strong>
                            <div style="font-size:28px; font-weight:bold; color:var(--foxy-online);">${robuxBalance}</div>
                            <button class="secondary" onclick="window.open('https://www.roblox.com/upgrades/robux?ctx=nav', '_blank')">Buy Robux</button>
                        </div>
                        <div class="foxy-card" style="flex-direction:column; align-items:flex-start; gap:8px;">
                            <strong style="font-size:16px; color:var(--foxy-text);">Current Server Count</strong>
                            <div style="font-size:28px; font-weight:bold; color:var(--foxy-accent);">Fetching...</div>
                            <button class="secondary" onclick="window.FoxyUI.showToast('Server count updated!')">Refresh</button>
                        </div>
                    </div>

                    <h3 style="margin-top:30px; margin-bottom:15px;">Recently Visited Games</h3>
                    <div id="recent-games-list" style="display:flex; flex-direction:column; gap:10px;">
                        <div style="color:var(--foxy-text-muted);">No recent games found or failed to load.</div>
                        <!-- Dynamic content will load here -->
                    </div>
                </div>
            `
        });

        robloxWindow.addTab({
            name: "Game Servers",
            icon: "icon:box",
            html: `
                <div style="padding:20px;">
                    <h2 style="margin-top:0; color:var(--foxy-accent);">Game Servers Browser</h2>
                    <p style="color:var(--foxy-text-muted);">Find games with low ping, specific players, or small servers.</p>
                    <input type="text" placeholder="Search games or players..." style="margin-bottom:15px;">

                    <div id="game-servers-list" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:15px;">
                        <div style="color:var(--foxy-text-muted); text-align:center; grid-column: 1 / -1;">Loading games...</div>
                    </div>
                </div>
            `
        });

        robloxWindow.addTab({
            name: "Friends Activity",
            icon: "icon:user",
            html: `
                <div style="padding:20px;">
                    <h2 style="margin-top:0; color:var(--foxy-accent);">Friends Activity & Quick Join</h2>
                    <p style="color:var(--foxy-text-muted);">See what your friends are doing and quickly join their games.</p>
                    <div id="friends-activity-list" style="display:flex; flex-direction:column; gap:10px;">
                        <div style="color:var(--foxy-text-muted);">Loading friends activity...</div>
                    </div>
                </div>
            `
        });

        robloxWindow.addTab({
            name: "Inventory Tools",
            icon: "icon:wand",
            html: `
                <div style="padding:20px;">
                    <h2 style="margin-top:0; color:var(--foxy-accent);">Inventory & Item Tools</h2>
                    <p style="color:var(--foxy-text-muted);">Advanced features for managing your Roblox inventory.</p>

                    <div class="foxy-card" style="flex-direction:column; align-items:flex-start; gap:10px;">
                        <h4 style="margin:0;">Item Sniper</h4>
                        <p style="font-size:13px; color:var(--foxy-text-muted);">Automatically attempts to buy limited items when they come on sale.</p>
                        <button class="secondary">Configure Sniper</button>
                    </div>

                    <div class="foxy-card" style="flex-direction:column; align-items:flex-start; gap:10px; margin-top:15px;">
                        <h4 style="margin:0;">Trade Helper</h4>
                        <p style="font-size:13px; color:var(--foxy-text-muted);">Provides value estimates and trade history for items.</p>
                        <button class="secondary">Open Trade Helper</button>
                    </div>
                </div>
            `
        });

        robloxWindow.addTab({
            name: "Robux History",
            icon: "icon:history",
            html: `
                <div style="padding:20px;">
                    <h2 style="margin-top:0; color:var(--foxy-accent);">Robux Transaction History</h2>
                    <p style="color:var(--foxy-text-muted);">View detailed breakdown of your Robux earnings and spending.</p>
                    <div id="robux-history-content">
                        <table style="width:100%; border-collapse:collapse; margin-top:15px; font-size:13px;">
                            <thead>
                                <tr style="background:var(--foxy-surface-alt); text-align:left;">
                                    <th style="padding:8px; border-bottom:1px solid var(--foxy-divider);">Date</th>
                                    <th style="padding:8px; border-bottom:1px solid var(--foxy-divider);">Description</th>
                                    <th style="padding:8px; border-bottom:1px solid var(--foxy-divider);">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style="background:var(--foxy-surface);">
                                    <td style="padding:8px; border-bottom:1px solid var(--foxy-divider);">2024-07-20</td>
                                    <td style="padding:8px; border-bottom:1px solid var(--foxy-divider);">Sold Game Pass</td>
                                    <td style="padding:8px; border-bottom:1px solid var(--foxy-divider); color:var(--foxy-online);">+100</td>
                                </tr>
                                <tr style="background:var(--foxy-surface);">
                                    <td style="padding:8px; border-bottom:1px solid var(--foxy-divider);">2024-07-19</td>
                                    <td style="padding:8px; border-bottom:1px solid var(--foxy-divider);">Bought Avatar Item</td>
                                    <td style="padding:8px; border-bottom:1px solid var(--foxy-divider); color:var(--foxy-dnd);">-50</td>
                                </tr>
                                <tr style="background:var(--foxy-surface);">
                                    <td style="padding:8px; border-bottom:1px solid var(--foxy-divider);">2024-07-15</td>
                                    <td style="padding:8px; border-bottom:1px solid var(--foxy-divider);">Premium Payout</td>
                                    <td style="padding:8px; border-bottom:1px solid var(--foxy-divider); color:var(--foxy-online);">+500</td>
                                </tr>
                                <tr>
                                    <td colspan="3" style="padding:10px; text-align:center; color:var(--foxy-text-muted);">
                                        (Real data would be fetched from Roblox API with appropriate permissions.)
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            `
        });


        // Initial click on the first tab
        if (robloxWindow.tabs.length > 0) {
            robloxWindow.tabs[0].el.click();
        }

        // --- DYNAMIC CONTENT UPDATES (ON SERVER/CHANNEL CLICKS) ---
        robloxWindow.serverRail.addEventListener('click', async (e) => {
            const serverIcon = e.target.closest('.foxy-server-icon');
            if (serverIcon) {
                const serverId = serverIcon.dataset.id;
                console.log(`[Roblox Enhancer] Server clicked: ${serverId}`);

                // Update channels based on selected server
                let newChannels = [];
                let newMemberList = [];

                if (serverId === "home") {
                    robloxWindow.channels = [
                        { category: "Dashboard", id: "welcome", name: "welcome", type: "text", active: true },
                        { category: "Dashboard", id: "news-feed", name: "news-feed", type: "text" },
                        { category: "Dashboard", id: "activity", name: "player-activity", type: "text" },
                        { category: "Tools", id: "auto-join", name: "auto-join-game", type: "text" },
                        { category: "Tools", id: "trade-notifier", name: "trade-notifier", type: "text" },
                    ];
                    robloxWindow.setChannels(robloxWindow.channels, { title: "Enhancer" });
                    robloxWindow.tabs[0].el.click(); // Go to dashboard tab
                    robloxWindow.setMembers(cachedRobloxFriends); // Show friends on home
                } else if (serverId === "games_hub") {
                    await refreshGameListInTab(); // Refresh games when Game Hub is selected
                    robloxWindow.channels = [
                        { category: "Games", id: "popular", name: "popular-games", type: "text", active: true },
                        { category: "Games", id: "recommended", name: "recommended", type: "text" },
                        { category: "Games", id: "genre-fps", name: "fps", type: "text" },
                        { category: "Games", id: "genre-tycoon", name: "tycoon", type: "text" },
                    ];
                    robloxWindow.setChannels(robloxWindow.channels, { title: "Game Hub" });
                    robloxWindow.tabs[1].el.click(); // Go to Game Servers tab
                    robloxWindow.setMembers([]); // Clear member list for game hub
                } else if (serverId === "friends_list") {
                    await refreshFriendsListInTab();
                    robloxWindow.channels = [
                        { category: "Friends", id: "online-friends", name: "online-friends", type: "text", active: true },
                        { category: "Friends", id: "offline-friends", name: "offline-friends", type: "text" },
                        { category: "Friends", id: "requests", name: "friend-requests", type: "text", badgeCount: 2, unread: true },
                    ];
                    robloxWindow.setChannels(robloxWindow.channels, { title: "Friends" });
                    robloxWindow.tabs[2].el.click(); // Go to Friends Activity tab
                    robloxWindow.setMembers(cachedRobloxFriends); // Set members to friends list
                } else if (serverId === "inventory") {
                    robloxWindow.channels = [
                        { category: "Inventory", id: "hats", name: "hats", type: "text", active: true },
                        { category: "Inventory", id: "shirts", name: "shirts", type: "text" },
                        { category: "Inventory", id: "pants", name: "pants", type: "text" },
                        { category: "Inventory", id: "gears", name: "gears", type: "text" },
                        { category: "Inventory", id: "limiteds", name: "limiteds", type: "text" },
                    ];
                    robloxWindow.setChannels(robloxWindow.channels, { title: "Inventory" });
                    robloxWindow.tabs[3].el.click(); // Go to Inventory Tools tab
                    robloxWindow.setMembers([]); // Clear members
                } else if (serverId === "robux_tracker") {
                    robloxWindow.channels = [
                        { category: "Robux", id: "balance", name: "current-balance", type: "text", active: true },
                        { category: "Robux", id: "earnings", name: "earnings", type: "text" },
                        { category: "Robux", id: "spending", name: "spending", type: "text" },
                        { category: "Robux", id: "payouts", name: "group-payouts", type: "text" },
                    ];
                    robloxWindow.setChannels(robloxWindow.channels, { title: "Robux" });
                    robloxWindow.tabs[4].el.click(); // Go to Robux History tab
                    robloxWindow.setMembers([]); // Clear members
                } else if (serverId === "enhancer_settings") {
                    robloxWindow.openSettings(); // Open global FoxyUI settings
                }

                // Default content for generic channels in the right pane
                robloxWindow.content.innerHTML = `<div style="padding:20px; text-align:center; color:var(--foxy-text-muted);">Select a channel to view its content.</div>`;
            }
        });

        robloxWindow.channelList.addEventListener('click', (e) => {
            const channelItem = e.target.closest('.foxy-channel-item');
            if (channelItem) {
                const channelId = channelItem.dataset.id;
                robloxWindow.setChannelBadge(channelId, 0, false); // Mark as read

                let contentHtml = `<div style="padding:20px; text-align:center; color:var(--foxy-text-muted);">Content for #${channelId} will appear here.</div>`;

                if (channelId === "welcome") {
                    contentHtml = robloxWindow.tabs.find(t => t.name === "Dashboard")?.html;
                } else if (channelId === "popular-games") {
                    contentHtml = robloxWindow.tabs.find(t => t.name === "Game Servers")?.html;
                    refreshGameListInTab();
                } else if (channelId === "online-friends") {
                    contentHtml = robloxWindow.tabs.find(t => t.name === "Friends Activity")?.html;
                    refreshFriendsListInTab();
                } else if (channelId === "auto-join") {
                    contentHtml = `
                        <div style="padding:20px;">
                            <h2 style="margin-top:0;">Auto Join Game Server</h2>
                            <p>Automatically joins the best server for a specific game, or follows a friend.</p>
                            <div class="foxy-settings-field">
                                <label class="foxy-settings-label">Game ID / URL</label>
                                <input type="text" placeholder="e.g., 123456789 or game link" style="max-width:400px;">
                            </div>
                            <div class="foxy-settings-field">
                                <label class="foxy-settings-label">Player Name to Follow (Optional)</label>
                                <input type="text" placeholder="e.g., ProGamerDude" style="max-width:400px;">
                            </div>
                            <button style="margin-top:10px;">Start Auto Join</button>
                        </div>
                    `;
                }
                 else if (channelId === "balance") {
                    contentHtml = `<div style="padding:20px; text-align:center;">
                        <h2 style="color:var(--foxy-online);">Your Current Robux Balance: ${robuxBalance}</h2>
                        <p style="color:var(--foxy-text-muted);">Updated from Roblox.com</p>
                    </div>`;
                }

                robloxWindow.setContent(contentHtml);
            }
        });

        // --- Initial Load Logic ---
        fetchRobloxUserData(); // Fetch initial user data
        refreshGameListInTab(); // Load popular games
        fetchFriends().then(friends => {
            robloxWindow.setMembers(friends); // Populate initial member list with friends
        });
    }

    // --- DYNAMIC CONTENT RENDERING FUNCTIONS (for tabs/channels) ---
    async function refreshGameListInTab() {
        const gameListContainer = robloxWindow.el.querySelector('#game-servers-list');
        if (!gameListContainer) return;

        gameListContainer.innerHTML = `<div style="color:var(--foxy-text-muted); text-align:center; grid-column: 1 / -1;">Fetching popular games...</div>`;
        const games = await fetchPopularGames();

        if (games.length === 0) {
            gameListContainer.innerHTML = `<div style="color:var(--foxy-text-muted); text-align:center; grid-column: 1 / -1;">No popular games found or failed to load.</div>`;
            return;
        }

        gameListContainer.innerHTML = games.map(game => `
            <div class="foxy-card" style="flex-direction:column; align-items:flex-start; gap:8px;">
                <img src="${game.thumbnail || 'https://via.placeholder.com/150'}" style="width:100%; height:100px; object-fit:cover; border-radius:4px;">
                <strong style="font-size:14px; color:var(--foxy-text);">${game.name}</strong>
                <span style="font-size:12px; color:var(--foxy-text-muted);">By: ${game.creator}</span>
                <span style="font-size:12px; color:var(--foxy-online);">👥 ${game.players.toLocaleString()} Players</span>
                <button style="width:100%; margin-top:5px;" onclick="window.open('https://www.roblox.com/games/${game.id}', '_blank')">Play Now</button>
            </div>
        `).join('');
    }

    async function refreshFriendsListInTab() {
        const friendsActivityList = robloxWindow.el.querySelector('#friends-activity-list');
        if (!friendsActivityList) return;

        friendsActivityList.innerHTML = `<div style="color:var(--foxy-text-muted);">Fetching friends activity...</div>`;
        const friends = await fetchFriends(); // Re-fetch for updated status

        if (friends.length === 0) {
            friendsActivityList.innerHTML = `<div style="color:var(--foxy-text-muted);">No friends found or failed to load.</div>`;
            return;
        }

        friendsActivityList.innerHTML = friends.map(f => `
            <div class="foxy-card" style="gap:10px;">
                <div class="foxy-avatar" style="width:40px; height:40px; background:${FoxyUI.stringToColor(f.name)}">
                    <img src="${f.avatar}" alt="${f.name}">
                    <span class="status-dot ${f.status}"></span>
                </div>
                <div style="flex:1;">
                    <strong style="font-size:14px; color:var(--foxy-text);">${f.name}</strong>
                    <span style="font-size:12px; color:var(--foxy-text-muted); display:block;">${f.activity}</span>
                </div>
                <button class="secondary" style="margin-left:auto;" onclick="window.open('https://www.roblox.com/users/${f.id}/profile', '_blank')">View Profile</button>
            </div>
        `).join('');
    }

    // --- COMMAND PALETTE INTEGRATION (Ctrl+K) ---
    FoxyUI.registerCommand({
        id: "roblox.join_friend",
        label: "Join Friend's Game",
        hint: "User ID/Name",
        category: "Roblox Actions",
        onRun: () => {
            FoxyUI.showModal({
                title: "Join Friend's Game",
                body: `<p>Enter the username or ID of the friend you want to join:</p><input type="text" id="friend-join-input" placeholder="Friend's Username or ID">`,
                buttons: [
                    { label: "Cancel", variant: "secondary" },
                    { label: "Join", onClick: () => {
                        const input = document.getElementById("friend-join-input");
                        const friendIdentifier = input.value.trim();
                        if (friendIdentifier) {
                            FoxyUI.showToast(`Attempting to join ${friendIdentifier}'s game...`, { type: "info" });
                            // Actual join logic (complex, may involve API calls or direct browser navigation)
                        } else {
                            FoxyUI.showToast("Please enter a username or ID.", { type: "error" });
                            return false; // Prevent modal from closing
                        }
                    }}
                ]
            });
        }
    });

    FoxyUI.registerCommand({
        id: "roblox.quick_buy",
        label: "Quick Buy Limited Item",
        hint: "Item ID",
        category: "Roblox Economy",
        onRun: () => {
             FoxyUI.showModal({
                title: "Quick Buy Limited",
                body: `<p>Enter the Item ID of the limited item you wish to buy instantly:</p><input type="text" id="item-id-input" placeholder="Limited Item ID">`,
                buttons: [
                    { label: "Cancel", variant: "secondary" },
                    { label: "Buy Now", onClick: () => {
                        const input = document.getElementById("item-id-input");
                        const itemId = input.value.trim();
                        if (itemId) {
                            FoxyUI.showToast(`Initiating quick buy for item ID ${itemId}... (Requires advanced scripting)`, { type: "info" });
                            // Advanced buying logic, likely involves CSRF, specific endpoints, and rate limits
                        } else {
                            FoxyUI.showToast("Please enter an Item ID.", { type: "error" });
                            return false;
                        }
                    }}
                ]
            });
        }
    });

    // --- CUSTOM SETTINGS SECTION ---
    FoxyUI.registerSettingsSection({
        id: "roblox-tweaks",
        label: "Roblox Tweaks",
        category: "Enhancer Settings",
        render: (winAPI) => {
            let hideRobloxNavbar = localStorage.getItem('foxyui_roblox_hide_navbar') === 'true';
            let enableTradeNotifier = localStorage.getItem('foxyui_roblox_trade_notifier') === 'true';

            return `
                <h2 class="foxy-settings-title">Roblox Enhancer Tweaks</h2>
                <p class="foxy-settings-subtitle">Customize various Roblox website behaviors and interface elements.</p>
                <div class="foxy-settings-block">
                    <div class="foxy-settings-block-title">Interface</div>
                    <div class="foxy-card" style="justify-content:space-between; align-items:center;">
                        <div>
                            <div style="font-weight:600; font-size:14px">Hide Roblox Top Navbar</div>
                            <div style="font-size:12px; color:var(--foxy-text-muted)">Removes the default Roblox top navigation bar to maximize content space.</div>
                        </div>
                        <label class="foxy-switch">
                            <input type="checkbox" id="setting-roblox-hide-navbar" ${hideRobloxNavbar ? 'checked' : ''}>
                            <span class="foxy-switch-slider"></span>
                        </label>
                    </div>
                     <div class="foxy-card" style="justify-content:space-between; align-items:center; margin-top:10px;">
                        <div>
                            <div style="font-weight:600; font-size:14px">Discord Rich Presence (Experimental)</div>
                            <div style="font-size:12px; color:var(--foxy-text-muted)">Display your current Roblox activity on Discord. Requires a separate Discord integration.</div>
                        </div>
                        <label class="foxy-switch">
                            <input type="checkbox" id="setting-roblox-rich-presence">
                            <span class="foxy-switch-slider"></span>
                        </label>
                    </div>
                </div>

                <div class="foxy-settings-block">
                    <div class="foxy-settings-block-title">Economy & Trading</div>
                    <div class="foxy-card" style="justify-content:space-between; align-items:center;">
                        <div>
                            <div style="font-weight:600; font-size:14px">Enable Trade Notifier</div>
                            <div style="font-size:12px; color:var(--foxy-text-muted)">Get desktop notifications for incoming trade requests and completed trades.</div>
                        </div>
                        <label class="foxy-switch">
                            <input type="checkbox" id="setting-roblox-trade-notifier" ${enableTradeNotifier ? 'checked' : ''}>
                            <span class="foxy-switch-slider"></span>
                        </label>
                    </div>
                </div>
            `;
        }
    });

    // Event listeners for custom Roblox settings
    // It's important to attach this to the *document* or the FoxyUI window's parent,
    // as the settings content is dynamically rendered.
    document.addEventListener('change', (e) => {
        if (e.target.id === "setting-roblox-hide-navbar") {
            const isChecked = e.target.checked;
            localStorage.setItem('foxyui_roblox_hide_navbar', isChecked);
            const navbar = document.querySelector('.roblox-top-navbar');
            if (navbar) {
                navbar.style.setProperty('display', isChecked ? 'none' : '', 'important');
                FoxyUI.showToast(`Roblox navbar ${isChecked ? 'hidden' : 'shown'}.`, { type: "success" });
            }
        }
        if (e.target.id === "setting-roblox-trade-notifier") {
            const isChecked = e.target.checked;
            localStorage.setItem('foxyui_roblox_trade_notifier', isChecked);
            FoxyUI.showToast(`Trade Notifier ${isChecked ? 'enabled' : 'disabled'}.`, { type: "success" });
            // Logic to start/stop polling for trades would go here
        }
        if (e.target.id === "setting-roblox-rich-presence") {
            const isChecked = e.target.checked;
            FoxyUI.showToast(`Discord Rich Presence ${isChecked ? 'enabled' : 'disabled'}. (Requires external integration)`, { type: isChecked ? "info" : "warning" });
            // This would likely involve a separate desktop application or a complex browser API interaction
        }
    });

    // --- INITIALIZATION ---
    // Ensure the DOM is ready before trying to create the window or fetch elements
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createRobloxFoxyWindow);
    } else {
        createRobloxFoxyWindow();
    }

    // Apply initial navbar hide setting if set
    if (localStorage.getItem('foxyui_roblox_hide_navbar') === 'true') {
        document.querySelector('.roblox-top-navbar')?.style.setProperty('display', 'none', 'important');
    }

    FoxyUI.notify("Roblox Enhancer loaded! Press Ctrl+K for commands.", { author: "System", type: "info" });
    FoxyUI.setChannelBadge("trade-notifier", 1, true); // Simulate a new trade notification
    FoxyUI.setServerBadge("friends_list", 3); // Simulate friend activity

})();
