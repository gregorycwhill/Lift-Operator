// ============================================================================
// UI-OVERLAY.JS : CORE INTERFACE INITIALIZATION & SHARED UTILITIES
// ============================================================================

/**
 * Display a temporary on-screen toast message.
 */
window.showToast = function(message) {
    let toast = document.getElementById("game-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "game-toast";
        toast.className = "game-toast";
        document.body.appendChild(toast);
    }
    toast.innerText = message;
    void toast.offsetWidth; // Force reflow
    toast.classList.add("show");
    setTimeout(() => { toast.classList.remove("show"); }, 3500);
};

/**
 * Update the locking status of UI buttons and selectors based on progression.
 */
window.updateLocksUI = function() {
    if (!Registry.highestUnlockedRound) Registry.highestUnlockedRound = 1;
    let maxRoundAllowed = Config.debugMode ? 13 : Registry.highestUnlockedRound;

    const jumpSelect = document.getElementById("jumpRoundSelect");
    if (jumpSelect) {
        // Clear existing options
        jumpSelect.innerHTML = '';
        
        // Only append unlocked rounds
        for (let i = 1; i <= maxRoundAllowed; i++) {
            const opt = document.createElement("option");
            opt.value = i;
            opt.text = `Round ${i}`;
            jumpSelect.appendChild(opt);
        }
        
        // Handle value selection
        if (Registry.stats.round <= maxRoundAllowed) {
            jumpSelect.value = Registry.stats.round; 
        } else {
            jumpSelect.value = maxRoundAllowed;
        }
    }

    const workshopBtn = document.getElementById("openWorkshopBtn");
    if (workshopBtn) {
        if (maxRoundAllowed >= 10) {
            workshopBtn.disabled = false;
            workshopBtn.classList.remove("locked");
        } else {
            workshopBtn.disabled = true;
            workshopBtn.classList.add("locked");
        }
    }
};

/**
 * Perform initial EVENT BINDINGS and registry setup on page load.
 */
window.initializeUI = function() {
    const ui = GameUI();
    const engine = GameEngine();

    // Link background systems to UI logic
    if (typeof ui.updateWorkshopScriptList === "function") ui.updateWorkshopScriptList();
    if (typeof PowerUps !== "undefined") PowerUps.processNextManifestItem = window.processNextManifestItem;

    // Initialize Random Seed
    if (!Registry.seed) Registry.seed = Math.floor(Math.random() * 9000) + 1000;
    if (window.Game.Seed) window.Game.Seed.set(Registry.seed);
    const seedInput = document.getElementById("gameSeed");
    if (seedInput) seedInput.value = Registry.seed;
    const seedDisplay = document.getElementById("seedDisplay");
    if (seedDisplay) seedDisplay.innerText = Registry.seed;

    // Reset Rank Display
    if (typeof ui.updatePilotNameDisplay === "function") ui.updatePilotNameDisplay();

    // Workshop Button Setup (Clone to strip old listeners)
    const wsBtn = document.getElementById("openWorkshopBtn");
    if (wsBtn) {
        const newBtn = wsBtn.cloneNode(true);
        wsBtn.parentNode.replaceChild(newBtn, wsBtn);
        newBtn.addEventListener("click", () => {
            if (typeof ui.openWorkshopModal === "function") ui.openWorkshopModal();
        });
    }
    
    // Shop Button Binding
    const shopBtn = document.getElementById("openShopBtn");
    if (shopBtn) {
        shopBtn.addEventListener("click", () => {
            if (typeof ui.showRoundModal === "function") ui.showRoundModal(Registry.stats.round);
        });
    }

    // Share Seed Binding
    const shareBtn = document.getElementById("shareSeedBtn");
    if (shareBtn) {
        shareBtn.addEventListener("click", () => {
            let seed = Registry.seed;
            const seedInput = document.getElementById("gameSeed");
            if (seedInput && !isNaN(parseInt(seedInput.value))) {
                seed = parseInt(seedInput.value);
            }
            
            const url = new URL(window.location.href);
            url.searchParams.set('GameID', seed);
            
            const shareData = {
                title: 'Lift Operator',
                text: `Try this Lift Operator seed: ${seed}`,
                url: url.toString()
            };

            if (navigator.share) {
                navigator.share(shareData).catch(() => {
                    // Fallback to clipboard if share cancelled
                    navigator.clipboard.writeText(url.toString()).then(() => {
                        const ui = GameUI();
                        if (typeof ui.showToast === 'function') ui.showToast(`Seed ${seed} copied to clipboard!`);
                    });
                });
            } else {
                navigator.clipboard.writeText(url.toString()).then(() => {
                    const ui = GameUI();
                    if (typeof ui.showToast === 'function') ui.showToast(`Seed ${seed} copied to clipboard!`);
                });
            }
        });
    }

    // Context Menu Intercept for Targeting Power-Ups
    document.addEventListener("contextmenu", (e) => {
        if (typeof PowerUps !== "undefined" && PowerUps.activeTargeting) {
            e.preventDefault();
            PowerUps.cancelTargeting();
            if (typeof ui.updateInventoryUI === "function") ui.updateInventoryUI();
        }
    });

    // Helper for adding simple click listeners
    const bind = (id, callback) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("click", callback);
    };

    // ROUND START CONTROLS
    bind("startRoundBtn", () => {
        if (typeof ui.checkoutCart === "function") ui.checkoutCart();

        if (Registry.stats.round === 1) {
            Registry.playerName = document.getElementById("playerName")?.value || "Pilot 1";
            window.Game.Storage.set(window.Game.Keys.PLAYER, Registry.playerName);
            if (document.getElementById("pilotNameDisplay")) document.getElementById("pilotNameDisplay").innerText = Registry.playerName;

            let rawSeed = document.getElementById("gameSeed")?.value;
            if (rawSeed && !isNaN(parseInt(rawSeed))) Registry.seed = parseInt(rawSeed);
            if (window.Game.Seed) window.Game.Seed.set(Registry.seed);
            if (document.getElementById("seedDisplay")) document.getElementById("seedDisplay").innerText = Registry.seed;
            if (typeof ui.buildWorld === "function") ui.buildWorld();
        }

        const roundOverlay = document.getElementById("roundModalOverlay");
        if (roundOverlay) roundOverlay.style.display = "none";
        
        if (Registry.pauseStartTime === 0 && typeof GameSpawner === "function" && typeof GameSpawner().forceFirstSpawn === "function") {
            GameSpawner().forceFirstSpawn(window.Game.virtualTime || Date.now());
        }
        
        if (typeof engine.resume === "function") engine.resume();
        if (typeof ui.draw === "function") ui.draw();
    });

    bind("continueToBriefingBtn", () => {
        const reviewOverlay = document.getElementById("roundReviewOverlay");
        if (reviewOverlay) reviewOverlay.style.display = "none";
        
        // Fix for modal loop: Ensure previous state is cleared
        const briefingOverlay = document.getElementById("roundModalOverlay");
        if (briefingOverlay) briefingOverlay.style.display = "none";

        if (typeof engine.advanceToRound === "function") {
            engine.advanceToRound(Registry.stats.round + 1);
        }
    });

    // LEADERBOARD CONTROLS
    bind("leaderboardBtn", () => {
        if (typeof ui.showLeaderboard === "function") ui.showLeaderboard("Paused");
    });

    bind("closeLbBtn", () => {
        const lbOverlay = document.getElementById("leaderboardOverlay");
        if (lbOverlay) lbOverlay.style.display = "none";
        if (typeof engine.resume === "function") engine.resume();
        if (typeof ui.draw === "function") ui.draw();
    });

    bind("restartBtn", () => {
        if (typeof engine.reset === "function") {
             const lbOverlay = document.getElementById("leaderboardOverlay");
             if (lbOverlay) lbOverlay.style.display = "none";
             engine.reset();
        }
    });

    bind("lbRestartBtn", () => {
        if (typeof engine.reset === "function") {
            const lbOverlay = document.getElementById("leaderboardOverlay");
            if (lbOverlay) lbOverlay.style.display = "none";
            engine.reset();
        }
    });

    // DEBUG CONTROLS
    bind("openDebugBtn", () => {
        if (typeof engine.pause === "function") engine.pause();
        if (typeof ui.renderDebugMenu === "function") ui.renderDebugMenu();
        const debugOverlay = document.getElementById("debugOverlay");
        if (debugOverlay) debugOverlay.style.display = "flex";
    });

    bind("closeDebugBtn", () => {
        const debugOverlay = document.getElementById("debugOverlay");
        if (debugOverlay) debugOverlay.style.display = "none";
        
        // AUTOPILOT TIMER RULE: When launching from debug, default to 30s
        if (Registry.autoPilotActive) {
            const monkey = Registry.monkeySettings || {};
            if (Registry.stats.round !== 12) {
                Registry.stats.timeLeft = monkey.roundDurationSeconds || Config.autoPilotSettings.shortRoundDuration || 30;
            }
        }

        // If floor count changed, we must rebuild
        if (Registry.floors.length !== Config.numFloors && typeof engine.reset === "function") {
            engine.reset();
        } else if (typeof engine.resume === "function") {
            engine.resume();
        }
    });

    bind("jumpRoundBtn", () => {
        const targetRound = parseInt(document.getElementById("jumpRoundSelect")?.value);
        if (typeof engine.skipToRound === "function" && !isNaN(targetRound)) {
            engine.skipToRound(targetRound);
        }
    });

    // REGRESSION TEST SCORECARD BINDINGS
    bind("runTestsBtn", async () => {
        if (typeof engine.pause === "function") engine.pause();
        const scOverlay = document.getElementById("testScorecardOverlay");
        if (scOverlay) scOverlay.style.display = "flex";
        try {
            if (typeof window.loadDebugTestSuite === "function") await window.loadDebugTestSuite();
            if (typeof window.runVisualRegressionSuite === "function") {
                window.runVisualRegressionSuite();
            }
        } catch (error) {
            if (typeof ui.showToast === "function") ui.showToast(`Test suite failed to load: ${error.message}`);
        }
    });

    bind("closeScorecardBtn", () => {
        const scOverlay = document.getElementById("testScorecardOverlay");
        if (scOverlay) scOverlay.style.display = "none";
        if (typeof engine.resume === "function") engine.resume();
    });

    bind("rerunTestsBtn", () => {
        runVisualRegressionSuite();
    });

};

/**
 * Runs the regression suite and populates the scorecard UI.
 */
window.runVisualRegressionSuite = async function() {
    const statusText = document.getElementById('scorecardStatusText');
    const passCount = document.getElementById('scorecardPassCount');
    const failCount = document.getElementById('scorecardFailCount');
    const resultsList = document.getElementById('testResultsList');

    if (!statusText || !resultsList) return;

    statusText.innerText = '🧪 Running...';
    statusText.className = 'text-blue';
    resultsList.innerHTML = '<div style="padding: 20px; text-align: center;">Running simulation cycles...</div>';

    let passed = 0;
    let failed = 0;

    // Use current regression suite
    if (window.Game && window.Game.Regression && typeof window.Game.Regression.runAll === 'function') {
        const report = await window.Game.Regression.runAll((msg) => {
            resultsList.innerHTML = `<div style="padding: 20px; text-align: center;">${msg}</div>`;
        });
        resultsList.innerHTML = '';
        
        report.forEach(test => {
            const item = document.createElement('div');
            item.style.padding = '10px 15px';
            item.style.borderBottom = '1px solid #eee';
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.alignItems = 'center';
            if (!test.passed) item.style.backgroundColor = '#fff5f5';

            const name = document.createElement('span');
            name.style.fontWeight = 'bold';
            name.style.fontSize = '14px';
            name.innerText = test.name;

            const status = document.createElement('span');
            status.style.fontSize = '12px';
            status.className = test.passed ? 'text-green' : 'text-red';
            status.innerText = test.passed ? '✅ PASS' : '❌ FAIL';

            const msg = document.createElement('div');
            msg.style.fontSize = '11px';
            msg.style.color = '#7f8c8d';
            msg.innerText = test.message || '';

            const leftSide = document.createElement('div');
            leftSide.appendChild(name);
            leftSide.appendChild(msg);

            item.appendChild(leftSide);
            item.appendChild(status);
            resultsList.appendChild(item);

            if (test.passed) passed++; else failed++;
        });

        statusText.innerText = failed === 0 ? '✅ ALL CLEAR' : '❌ REGRESSION';
        statusText.className = failed === 0 ? 'text-green' : 'text-red';
        passCount.innerText = passed;
        failCount.innerText = failed;
    } else {
        resultsList.innerHTML = '<div style="padding: 20px; text-align: center; color: red;">Regression Suite not loaded!</div>';
    }
};

// ============================================================================
// API REGISTRATION
// ============================================================================

window.UI = window.UI || {};

// Registration logic
[
    "getRankByLifts", "updatePilotNameDisplay", "addToCart", "removeFromCart",
    "checkoutCart", "updateInventoryUI", "renderShop", "updateLocksUI",
    "updateWorkshopScriptList", "openWorkshopModal", "showRoundModal",
    "showRoundReview", "showToast", "shareLeaderboard", "shareGame",
    "showLeaderboard", "renderDebugMenu", "processNextManifestItem", "initializeUI",
    "buildWorld", "draw", "updateLiftAutomationUI", "updateLiftVisualState",
    "triggerDefenestration", "updateScoreboardUI", "getGuestText"
].forEach(key => {
    window.UI[key] = window[key];
});

window.Game = window.Game || {};
window.Game.UI = window.UI;
