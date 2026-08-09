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

const criticalGameMessages = [];

window.clearGameMessage = function() {
    criticalGameMessages.length = 0;
    const rail = document.getElementById('game-message-rail');
    if (rail) rail.hidden = true;
    const text = document.getElementById('game-message-text');
    if (text) text.textContent = '';
    document.getElementById('game-area')?.classList.remove('countdown-active');
};

function renderGameMessage(message, options = {}) {
    const rail = document.getElementById('game-message-rail');
    const text = document.getElementById('game-message-text');
    if (!rail || !text) return;
    text.textContent = message;
    rail.dataset.critical = options.critical ? 'true' : 'false';
    rail.hidden = false;
    window.clearTimeout?.(rail._dismissTimer);
    if (options.durationMs > 0) {
        rail._dismissTimer = window.setTimeout(() => {
            if (options.critical && criticalGameMessages.length) {
                const next = criticalGameMessages.shift();
                renderGameMessage(next.message, next.options);
            } else {
                window.clearGameMessage();
            }
        }, options.durationMs);
    }
}

window.showGameMessage = function(message, options = {}) {
    const rail = document.getElementById('game-message-rail');
    if (!rail) return;
    if (options.critical && !rail.hidden && rail.dataset.critical === 'true') {
        criticalGameMessages.push({ message, options });
        return;
    }
    renderGameMessage(message, options);
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('game-message-dismiss')?.addEventListener('click', () => {
        const rail = document.getElementById('game-message-rail');
        if (rail?.dataset.critical === 'true' && criticalGameMessages.length) {
            const next = criticalGameMessages.shift();
            renderGameMessage(next.message, next.options);
        } else {
            window.clearGameMessage();
        }
    });
});

window.openModalExclusive = function(id) {
    window.Game.AutomationController?.closeLibrary?.();
    ['welcomeOverlay', 'environmentNoticeOverlay', 'howToPlayOverlay', 'creditsOverlay', 'newGameConfirmOverlay', 'clearLocalDataConfirmOverlay', 'campaignCompleteOverlay', 'roundModalOverlay', 'roundReviewOverlay', 'roundStartConfirmOverlay', 'settingsOverlay', 'leaderboardOverlay', 'debugOverlay', 'workshopOverlay']
        .filter(otherId => otherId !== id)
        .forEach(otherId => { const overlay = document.getElementById(otherId); if (overlay) overlay.style.display = 'none'; });
    const overlay = document.getElementById(id);
    if (overlay) overlay.style.display = 'flex';
};

window.startRoundCountdown = function(seconds = 5) {
    if (window.Game.Audio) window.Game.Audio.setContext('gameplay');
    if (Registry.roundCountdownTimer) clearInterval(Registry.roundCountdownTimer);
    Registry.gameActive = false;
    Registry.roundCountdownActive = true;
    Registry.roundCountdownPaused = false;
    const countdown = document.getElementById('roundCountdown');
    document.getElementById('game-area')?.classList.add('countdown-active');
    const value = document.getElementById('roundCountdownValue');
    let remaining = Math.max(0, seconds);
    Registry.countdownRemaining = remaining;
    window.Game.Audio?.publish('round_countdown_started', { round: Registry.stats.round, seconds: remaining });
    if (countdown) countdown.classList.remove('hidden');
    if (value) value.textContent = String(remaining);

    const ui = GameUI();
    Registry.lifts.forEach((lift, index) => {
        if (typeof ui.showLiftCapacity === 'function') ui.showLiftCapacity(index, Math.max(1800, remaining * 1000 - 150));
    });
    if (typeof ui.applyAutomationTeachingCue === 'function') ui.applyAutomationTeachingCue();
    if (Registry.stats.round === 2) window.showGameMessage?.('Automation tip: choose an automation from the menu in the basement level, then click on any glowing lift controller to deploy it.');

    const begin = () => {
        if (Registry.roundCountdownTimer) clearInterval(Registry.roundCountdownTimer);
        Registry.roundCountdownTimer = null;
        Registry.roundCountdownActive = false;
        window.clearGameMessage?.();
        window.clearTransientLiftCues?.();
        window.Game.Audio?.publish('round_started', { round: Registry.stats.round });
        if (countdown) countdown.classList.add('hidden');
        const now = window.Game.virtualTime || Date.now();
        if (typeof GameSpawner === 'function' && typeof GameSpawner().forceFirstSpawn === 'function') {
            GameSpawner().forceFirstSpawn(now);
        }
        const engine = GameEngine();
        if (typeof engine.resume === 'function') engine.resume();
        if (typeof ui.draw === 'function') ui.draw();
    };
    const skip = document.getElementById('roundCountdownSkip');
    if (skip) skip.onclick = begin;

    if (remaining === 0) {
        begin();
        return;
    }
    Registry.roundCountdownTimer = setInterval(() => {
        remaining--;
        Registry.countdownRemaining = remaining;
        if (remaining <= 0) begin();
        else if (value) value.textContent = String(remaining);
    }, 1000);
};

/**
 * Update the locking status of UI buttons and selectors based on progression.
 */
window.getRoundCountdownSeconds = function(round = Registry.stats.round, liftCount = Registry.lifts.length) {
    const countdown = Config.GAME_DATA.system.countdown || {};
    const override = Number(countdown.roundOverrides?.[round]);
    if (Number.isFinite(override) && override > 0) return override;
    const secondsPerLift = Number(countdown.secondsPerLift || 3);
    const minimum = Number(countdown.minimumSeconds || 5);
    const maximum = Number(countdown.maximumSeconds || 30);
    return Math.max(minimum, Math.min(maximum, Math.max(1, Number(liftCount) || 1) * secondsPerLift));
};

window.updateLocksUI = function() {
    if (!Registry.highestUnlockedRound) Registry.highestUnlockedRound = 1;
    const availableRounds = Object.keys(Config.GAME_DATA.rounds || {})
        .map(Number)
        .filter(Number.isInteger)
        .sort((a, b) => a - b);
    const maxAvailableRound = availableRounds.length ? availableRounds[availableRounds.length - 1] : 1;
    let maxRoundAllowed = Config.debugMode ? maxAvailableRound : Registry.highestUnlockedRound;

    const jumpSelect = document.getElementById("jumpRoundSelect");
    if (jumpSelect) {
        // Clear existing options
        jumpSelect.innerHTML = '';
        
        // Only append unlocked rounds
        availableRounds.filter(round => round <= maxRoundAllowed).forEach(i => {
            const opt = document.createElement("option");
            opt.value = i;
            opt.text = `Round ${i}`;
            jumpSelect.appendChild(opt);
        });
        
        // Handle value selection
        if (Registry.stats.round <= maxRoundAllowed) {
            jumpSelect.value = Registry.stats.round; 
        } else {
            jumpSelect.value = maxRoundAllowed;
        }
    }

    const workshopBtn = document.getElementById("openWorkshopBtn");
    if (workshopBtn) {
        if (maxRoundAllowed >= Config.GAME_DATA.automationUnlocks.custom) {
            workshopBtn.disabled = false;
            workshopBtn.classList.remove("locked");
            workshopBtn.title = 'Open the Automation Workshop';
        } else {
            workshopBtn.disabled = true;
            workshopBtn.classList.add("locked");
            workshopBtn.title = `Unlocks at Round ${Config.GAME_DATA.automationUnlocks.custom}`;
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
    const seedDisplay = document.getElementById("seedDisplay");
    if (seedDisplay) seedDisplay.innerText = Registry.seed;
    const seedContainer = document.getElementById('seedContainer');
    if (seedContainer) seedContainer.hidden = !Config.debugMode;

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
    const beginSelectedRound = () => {
        if (typeof ui.checkoutCart === "function") ui.checkoutCart();

        if (Registry.stats.round === 1) {
            Registry.playerName = document.getElementById("playerName")?.value || "Pilot 1";
            window.Game.Storage.set(window.Game.Keys.PLAYER, Registry.playerName);
            if (typeof ui.updatePilotNameDisplay === "function") ui.updatePilotNameDisplay();

            if (window.Game.Seed) window.Game.Seed.set(Registry.seed);
            if (document.getElementById("seedDisplay")) document.getElementById("seedDisplay").innerText = Registry.seed;
            if (typeof ui.buildWorld === "function") ui.buildWorld();
        }

        const roundOverlay = document.getElementById("roundModalOverlay");
        if (roundOverlay) roundOverlay.style.display = "none";
        window.Game.Campaign?.saveCurrent?.({ inventory: PowerUps?.inventory || [] });
        
        window.startRoundCountdown(window.getRoundCountdownSeconds());
    };
    window.beginSelectedRound = beginSelectedRound;

    bind("startRoundBtn", () => {
        const hasUnspentCredits = Number(Registry.points) > 0;
        const hasPurchases = typeof PowerUps !== 'undefined' && PowerUps.cart.length > 0;
        const supplyClosetAvailable = window.isSupplyClosetAvailable(Registry.stats.round);
        if (supplyClosetAvailable && hasUnspentCredits && !hasPurchases && !Registry.autoPilotActive) {
            const message = document.getElementById('roundStartConfirmText');
            if (message) message.textContent = `You have ${Registry.points} unused Credits. Start this round without spending any?`;
            window.openModalExclusive('roundStartConfirmOverlay');
            return;
        }
        beginSelectedRound();
    });

    bind('confirmRoundStartBtn', () => {
        document.getElementById('roundStartConfirmOverlay')?.style.setProperty('display', 'none');
        beginSelectedRound();
    });
    bind('cancelRoundStartBtn', () => {
        document.getElementById('roundStartConfirmOverlay')?.style.setProperty('display', 'none');
        window.openModalExclusive('roundModalOverlay');
    });

    bind("continueToBriefingBtn", () => {
        const reviewOverlay = document.getElementById("roundReviewOverlay");
        if (reviewOverlay) reviewOverlay.style.display = "none";
        
        // Fix for modal loop: Ensure previous state is cleared
        const briefingOverlay = document.getElementById("roundModalOverlay");
        if (briefingOverlay) briefingOverlay.style.display = "none";

        if (Registry.pendingFailedRetry && typeof engine.retryFailedRound === "function") {
            engine.retryFailedRound();
        } else if (typeof engine.advanceToRound === "function") {
            engine.advanceToRound(Registry.stats.round + 1);
        }
    });

    // SETTINGS / LEADERBOARD CONTROLS
    bind("settingsBtn", () => {
        const overlay = document.getElementById('settingsOverlay');
        if (overlay && overlay.style.display === 'flex') {
            overlay.style.display = 'none';
            window.Game.Audio?.setContext('gameplay');
            engine.resume?.();
            ui.draw?.();
        } else if (typeof ui.showSettings === "function") ui.showSettings();
    });

    bind("closeSettingsBtn", () => {
        const overlay = document.getElementById("settingsOverlay");
        if (overlay) overlay.style.display = "none";
        if (typeof engine.resume === "function") engine.resume();
        window.Game.Audio?.setContext('gameplay');
        ui.draw?.();
    });

    bind("settingsLeaderboardBtn", () => {
        if (typeof ui.showLeaderboard === "function") ui.showLeaderboard("Paused");
    });

    bind("settingsFeedbackBtn", () => window.Game.Feedback?.open('settings'));
    bind("reviewFeedbackBtn", () => window.Game.Feedback?.open('round-review'));
    bind('settingsHowToBtn', () => window.Game.Shell?.showInfo?.('howToPlayOverlay'));
    bind('settingsCreditsBtn', () => window.Game.Shell?.showInfo?.('creditsOverlay'));
    bind('settingsClearLocalDataBtn', () => window.openModalExclusive?.('clearLocalDataConfirmOverlay'));

    bind('welcomeStartBtn', () => window.Game.Shell?.start?.());
    bind('welcomeNewGameBtn', () => window.Game.Shell?.requestNewGame?.());
    bind('welcomeHowToBtn', () => window.Game.Shell?.showInfo?.('howToPlayOverlay'));
    bind('welcomeCreditsBtn', () => window.Game.Shell?.showInfo?.('creditsOverlay'));
    bind('welcomeFeedbackBtn', () => window.Game.Feedback?.open('welcome'));
    bind('closeHowToBtn', () => window.Game.Shell?.closeInfo?.());
    bind('closeCreditsBtn', () => window.Game.Shell?.closeInfo?.());
    bind('confirmNewGameBtn', () => window.Game.Shell?.beginNewGame?.());
    bind('cancelNewGameBtn', () => window.Game.Shell?.showWelcome?.());
    bind('confirmClearLocalDataBtn', () => window.Game.Shell?.clearLocalData?.());
    bind('cancelClearLocalDataBtn', () => window.openModalExclusive?.('settingsOverlay'));
    bind('campaignLeaderboardBtn', () => ui.showLeaderboard?.('Campaign Complete'));
    bind('campaignFeedbackBtn', () => window.Game.Feedback?.open('campaign-complete'));
    bind('campaignCreditsBtn', () => window.Game.Shell?.showInfo?.('creditsOverlay'));
    bind('campaignNewGameBtn', () => window.Game.Shell?.requestNewGame?.());

    bind("closeLbBtn", () => {
        const lbOverlay = document.getElementById("leaderboardOverlay");
        if (lbOverlay) lbOverlay.style.display = "none";
        if (Registry.leaderboardReturn === 'campaign-complete') {
            Registry.leaderboardReturn = null;
            window.Game.Shell?.showCampaignComplete?.();
            if (window.Game.Audio) window.Game.Audio.setContext('menu');
            if (typeof ui.draw === "function") ui.draw();
            return;
        }
        if (Registry.leaderboardReturn === 'settings') {
            Registry.leaderboardReturn = null;
            window.openModalExclusive?.('settingsOverlay');
            window.Game.Audio?.setContext('menu');
            ui.draw?.();
            return;
        }
        Registry.leaderboardReturn = null;
        if (Registry.roundCountdownActive) {
            if (typeof window.startRoundCountdown === 'function') window.startRoundCountdown(Math.max(0, Registry.countdownRemaining || 0));
        } else if (typeof engine.resume === "function") engine.resume();
        if (window.Game.Audio) window.Game.Audio.setContext('gameplay');
        if (typeof ui.draw === "function") ui.draw();
    });

    bind("restartBtn", () => {
        window.Game.Shell?.requestNewGame?.();
    });

    bind("lbRestartBtn", () => {
        window.Game.Shell?.requestNewGame?.();
    });

    // DEBUG CONTROLS
    bind("openDebugBtn", () => {
        const overlay = document.getElementById('debugOverlay');
        if (overlay && overlay.style.display === 'flex') { overlay.style.display = 'none'; window.Game.Audio?.setContext('gameplay'); engine.resume?.(); }
        else if (typeof ui.openDebugModal === 'function') ui.openDebugModal();
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
        window.Game.Audio?.setContext('gameplay');
    });

    bind("jumpRoundBtn", () => {
        const targetRound = parseInt(document.getElementById("jumpRoundSelect")?.value);
        if (typeof engine.skipToRound === "function" && !isNaN(targetRound)) {
            engine.skipToRound(targetRound);
        }
    });

    /* Retired RC1.0 in-game regression scorecard bindings.
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
        window.Game.Audio?.setContext('gameplay');
    });

    bind("rerunTestsBtn", () => {
        runVisualRegressionSuite();
    });

    */
};

/**
 * Runs the regression suite and populates the scorecard UI.
 */
/* Retired RC1.0 in-game regression scorecard renderer.
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
*/

// ============================================================================
// API REGISTRATION
// ============================================================================

window.UI = window.UI || {};

// Registration logic
[
    "getCampaignRank", "updatePilotNameDisplay", "addToCart", "removeFromCart",
    "checkoutCart", "updateInventoryUI", "renderShop", "updateLocksUI",
    "updateWorkshopScriptList", "openWorkshopModal", "showRoundModal",
    "showRoundReview", "showToast", "shareLeaderboard", "shareGame",
    "showLeaderboard", "showSettings", "renderDebugMenu", "openDebugModal", "processNextManifestItem", "initializeUI",
    "buildWorld", "draw", "updateLiftAutomationUI", "updateLiftVisualState",
    "triggerDefenestration", "updateScoreboardUI", "getGuestText",
    "startRoundCountdown", "getRoundCountdownSeconds"
].forEach(key => {
    window.UI[key] = window[key];
});

window.Game = window.Game || {};
window.Game.UI = window.UI;
