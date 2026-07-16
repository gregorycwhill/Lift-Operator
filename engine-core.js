// ============================================================================
// ENGINE-CORE.JS : LIFECYCLE MANAGEMENT, WORKSHOP MODALS, & PAYLOAD CODECS
// VERSION: 2.0.1 (Resilient Decoding)
// ============================================================================

window.SHARE_SECRET = "ELEVATOR_GO_BRRR_2026";

window.encodePayload = function(payloadObj) {
    try {
        const str = JSON.stringify(payloadObj);
        let xorStr = '';
        for (let i = 0; i < str.length; i++) {
            xorStr += String.fromCharCode(str.charCodeAt(i) ^ window.SHARE_SECRET.charCodeAt(i % window.SHARE_SECRET.length));
        }
        // Triple-wrap for ultimate safety: XOR -> URI -> Base64 -> URI
        return encodeURIComponent(btoa(encodeURIComponent(xorStr)));
    } catch (e) {
        console.error("Failed to encode payload.", e);
        return null;
    }
};

window.decodePayload = function(encodedStr) {
    if (!encodedStr) return null;
    if (String(encodedStr).length > 100000) {
        console.warn("Share payload exceeds the 100 KB encoded limit.");
        return null;
    }
    const secret = window.SHARE_SECRET;

    const doXor = (bin) => {
        let res = '';
        for (let i = 0; i < bin.length; i++) {
            res += String.fromCharCode(bin.charCodeAt(i) ^ secret.charCodeAt(i % secret.length));
        }
        return res;
    };

    try {
        // 1. Initial cleanup
        let input = String(encodedStr).trim().replace(/ /g, '+');
        
        // 2. Decode outer URI layer
        let decoded = input;
        try { decoded = decodeURIComponent(input); } catch(e) {}

        // ATTEMPT A: Raw XOR (Old Format Compatibility)
        try {
            let xorA = doXor(decoded);
            if (xorA.trim().startsWith('{')) return JSON.parse(xorA);
        } catch(e) {}

        // ATTEMPT B: Base64 Path (Resilient)
        try {
            // Remove non-base64 characters BEFORE calling atob to prevent InvalidCharacterError
            let b64 = decoded.replace(/[^A-Za-z0-9+/=]/g, "");
            if (b64.length >= 4) {
                while (b64.length % 4 !== 0) b64 += '=';
                let binary = atob(b64);
                
                // Binary might be URI encoded
                let xorTarget = binary;
                try { xorTarget = decodeURIComponent(binary); } catch(e) {}
                
                let xorB = doXor(xorTarget);
                try { return JSON.parse(xorB); } catch(e) {
                    // Try one more unquote in case of double-nested encoding
                    return JSON.parse(decodeURIComponent(xorB));
                }
            }
        } catch(e) {}
        
        // ATTEMPT C: Deep URI Unwrapping
        try {
            let deep = decodeURIComponent(decodeURIComponent(decoded));
            let xorC = doXor(deep);
            if (xorC.trim().startsWith('{')) return JSON.parse(xorC);
        } catch(e) {}

        return null;
    } catch (e) {
        console.warn("Invalid or tampered share link detected. Ignoring.", e);
        return null;
    }
};

window.handleSharedData = function(encodedStr) {
    const decoded = window.decodePayload(encodedStr);
    if (!decoded || typeof decoded !== 'object') return;
    
    // Support singular structures or native array manifestations safely
    const incomingItems = Array.isArray(decoded.manifest) ? decoded.manifest : [decoded];
    const allowedTypes = new Set(['seed', 'invite', 'challenge', 'system', 'debug_override', 'leaderboard', 'blueprint']);
    const validItems = incomingItems.filter(item =>
        item &&
        typeof item === 'object' &&
        typeof item.type === 'string' &&
        allowedTypes.has(item.type)
    );
    
    // Stage inside pending queue array for user reconciliation gateway loop
    Registry.pendingManifest = [...Registry.pendingManifest, ...validItems];
};

window.pauseGame = function() {
    if (!Registry.gameActive) return;
    Registry.gameActive = false;
    Registry.pauseStartTime = Date.now();
};

window.resumeGame = function() {
    if (Registry.gameActive) return;
    if (Registry.pauseStartTime > 0) {
        const duration = Date.now() - Registry.pauseStartTime;
        Registry.floors.forEach(f => f.waitingGuests.forEach(g => g.spawnTime += duration));
        Registry.lifts.forEach(l => {
            l.passengers.forEach(g => g.spawnTime += duration);
            l.lastActionTime += duration;
        });
        Registry.parentTickTime += duration;
        Registry.lastSpawnTime += duration;
        if (Registry.vipTargetTime > 0) Registry.vipTargetTime += duration;
        if (Registry.sunsetTargetTime > 0) Registry.sunsetTargetTime += duration;
        if (Registry.sunsetEndTime > 0) Registry.sunsetEndTime += duration;
        Registry.pauseStartTime = 0;
    }
    Registry.gameActive = true;
};

window.setLiftTarget = function(liftIndex, targetFloor) {
    if (typeof PowerUps !== 'undefined' && PowerUps.activeTargeting) {
        if (PowerUps.resolveTargeting(liftIndex, targetFloor)) return; 
    }
    
    if (!Registry.gameActive) return;
    
    if (Registry.lifts[liftIndex]) {
        Registry.roundStats.manualClicks++;
        
        Registry.lifts[liftIndex].targetFloor = targetFloor;
        Registry.lifts[liftIndex].manualOverride = true;
        const currentFloor = Math.round(Registry.lifts[liftIndex].pos / Registry.floorHeight);
        if (targetFloor > currentFloor) Registry.lifts[liftIndex].sweepDirection = 1;
        else if (targetFloor < currentFloor) Registry.lifts[liftIndex].sweepDirection = -1;
    }
};

window.setLiftAutomation = function(liftIndex, mode) {
    if (Registry.lifts[liftIndex]) {
        Registry.lifts[liftIndex].automation = mode;
        if (mode !== 'manual') Registry.lifts[liftIndex].manualOverride = false;

        const ui = GameUI();
        if (typeof ui.updateLiftAutomationUI === 'function') {
            ui.updateLiftAutomationUI(liftIndex, mode);
        }
    }
};

window.openWorkshopModal = function() {
    const ui = GameUI();
    if (typeof ui.openWorkshopModal === 'function') {
        ui.openWorkshopModal();
    }
};

window.createRoundStats = function() {
    return {
        manualClicks: 0, jammedLiftsFixed: 0, fullyLoadedLifts: 0, servedThisRound: 0,
        happyServed: 0, annoyedServed: 0, criticalServed: 0, vipServed: 0,
        defenestrationsThisRound: 0, totalWaitTimeServed: 0,
        lateralTransfers: 0, doubleDeckerServed: 0
    };
};

window.captureRoundCheckpoint = function(round = Registry.stats.round) {
    Registry.roundCheckpoint = {
        round,
        seed: Registry.seed,
        points: Registry.points
    };
};

window.resetAttemptTelemetry = function() {
    Registry.roundStats = window.createRoundStats();
    Registry.roundEvaluation = null;
    Registry.roundTerminalHandled = false;
    Registry.pendingFailedRetry = null;
    Registry.enduranceSeconds = 0;
    Registry.customScriptTicks = 0;
    Registry.lastLobbyRenderTime = 0;
};

window.getRoundDefinition = function(round) {
    const supportedRound = Math.max(1, Math.min(13, parseInt(round) || 1));
    const configured = Config.GAME_DATA.rounds[supportedRound];
    return {
        round: supportedRound,
        ...configured
    };
};

window.createLiftState = function(id) {
    return {
        id, targetFloor: 0, pos: 0, passengers: [],
        lastActionTime: 0, automation: 'manual', sweepDirection: 1,
        manualOverride: false, isJammed: false, jamTimer: 0, stinkTimer: 0,
        tardisTimer: 0, turboTimer: 0, freshenerTimer: 0,
        musakTimer: 0, doubleDeckerTimer: 0, openPlanTimer: 0,
        sardineScored: false, isDoubleDecker: false,
        state: 'IDLE', stateProgress: 0, effects: [], lastAutomationTime: 0
    };
};

window.createRoundState = function(round, seed, options = {}) {
    const definition = window.getRoundDefinition(round);
    const seedTool = window.Game.Seed;
    seedTool.set(seed);
    window.Game.AutomationSeed.set((parseInt(seed) || 1) ^ 0x5f3759df);
    const now = options.now === undefined
        ? (window.Game.virtualTime || Date.now())
        : options.now;

    const state = {
        definition,
        seed,
        timeLeft: Registry.autoPilotActive
            ? (Config.autoPilotSettings.shortRoundDuration || 30)
            : Config.roundTime,
        lives: Config.startingLives,
        currentSpawnChance: definition.spawnStart,
        lifts: Array.from({ length: definition.lifts }, (_, id) => window.createLiftState(id)),
        floors: Array.from({ length: definition.floors }, () => ({ waitingGuests: [] })),
        vipSpawned: false,
        vipTargetTime: 0,
        sunsetHasHappened: false,
        sunsetTargetTime: 0,
        sunsetActive: false,
        sunsetEndTime: 0,
        gymFloor: -1
    };

    if (definition.round === 8) {
        state.vipTargetTime = now + (window.getRandomInt(Config.vipSpawnMinSec, Config.vipSpawnMaxSec) * 1000);
    }
    if (definition.round === 9) {
        state.sunsetTargetTime = now + (window.getRandomInt(Config.sunsetMinSec, Config.sunsetMaxSec) * 1000);
    }
    if (definition.round === 11) {
        state.gymFloor = window.getRandomInt(1, definition.floors - 2);
    }

    return state;
};

window.applyRoundState = function(roundState, options = {}) {
    Config.numFloors = roundState.definition.floors;
    Registry.seed = roundState.seed;
    Registry.stats.round = roundState.definition.round;
    Registry.stats.timeLeft = roundState.timeLeft;
    Registry.stats.lives = roundState.lives;
    Registry.stats.currentSpawnChance = roundState.currentSpawnChance;
    if (options.resetCampaign) Registry.stats.served = 0;
    Registry.lifts = roundState.lifts;
    Registry.floors = roundState.floors;
    Registry.vipSpawned = roundState.vipSpawned;
    Registry.vipTargetTime = roundState.vipTargetTime;
    Registry.sunsetHasHappened = roundState.sunsetHasHappened;
    Registry.sunsetTargetTime = roundState.sunsetTargetTime;
    Registry.sunsetActive = roundState.sunsetActive;
    Registry.sunsetEndTime = roundState.sunsetEndTime;
    Registry.gymFloor = roundState.gymFloor;
    window.resetAttemptTelemetry();
};

window.initializeRound = function(round, options = {}) {
    window.clearAttemptInventory();
    const state = window.createRoundState(round, Registry.seed, options);
    window.applyRoundState(state, options);
    if (!options.preserveCheckpoint) window.captureRoundCheckpoint(state.definition.round);

    const ui = GameUI();
    if (typeof ui.buildWorld === 'function') ui.buildWorld();
    if (typeof ui.updateScoreboardUI === 'function') ui.updateScoreboardUI();
    if (typeof ui.draw === 'function') ui.draw();
    if (options.showBriefing !== false && typeof ui.showRoundModal === 'function') {
        ui.showRoundModal(state.definition.round);
    }
    return state;
};

window.clearAttemptInventory = function() {
    if (typeof PowerUps === 'undefined') return;
    PowerUps.cart = [];
    PowerUps.inventory = [];
    PowerUps.activeTargeting = null;
    Object.keys(PowerUps.timers).forEach(k => PowerUps.timers[k] = 0);
    Config.boardingSpeedMultiplier = 1.0;
};

window.disengageAutoPilot = function(manualIntervention = false) {
    Registry.autoPilotActive = false;
    Registry.manualIntervention = manualIntervention;
    Config.autoPilot = false;
    Config.roundTime = Config.GAME_DATA.system.roundTime;
    if (Registry.stats.round !== 12) {
        Registry.stats.timeLeft = Config.GAME_DATA.system.roundTime;
    }
    const heartbeat = document.getElementById('heartbeatMonitor');
    if (heartbeat) heartbeat.classList.add('hidden');
};

window.handleOrdinaryDeath = function() {
    if (Registry.roundTerminalHandled) return;
    Registry.roundTerminalHandled = true;
    Registry.gameActive = false;
    Registry.pauseStartTime = 0;

    const checkpoint = Registry.roundCheckpoint || {
        round: Registry.stats.round,
        seed: Registry.seed,
        points: Registry.points
    };

    Registry.points = checkpoint.points;
    Registry.seed = checkpoint.seed;
    window.clearAttemptInventory();
    Registry.pendingFailedRetry = {
        round: checkpoint.round,
        seed: checkpoint.seed
    };

    const stats = Registry.roundStats;
    const failedEvaluation = {
        pointsEarned: 0,
        totalPoints: Registry.points,
        guestsServed: stats.servedThisRound || 0,
        averageWaitTime: stats.servedThisRound > 0
            ? (stats.totalWaitTimeServed / stats.servedThisRound).toFixed(1)
            : '0.0',
        defenestrations: stats.defenestrationsThisRound || 0,
        log: ['Attempt failed. Points and inventory have been restored for a complete retry.']
    };

    const ui = GameUI();
    const briefingOverlay = document.getElementById('roundModalOverlay');
    if (briefingOverlay) briefingOverlay.style.display = 'none';
    if (typeof ui.showRoundReview === 'function') {
        ui.showRoundReview(checkpoint.round, 'failed', failedEvaluation);
    }
};

window.retryFailedRound = function() {
    const pending = Registry.pendingFailedRetry;
    if (!pending) return;
    Registry.pendingFailedRetry = null;
    Registry.seed = pending.seed;
    window.skipToRound(pending.round, { preserveCheckpoint: true });
};

window.completeRound = function(reason = 'completed') {
    if (Registry.roundTerminalHandled) return;
    Registry.roundTerminalHandled = true;
    Registry.gameActive = false;
    Registry.pauseStartTime = 0;

    Registry.highestUnlockedRound = Math.max(
        Registry.highestUnlockedRound,
        Math.min(13, Registry.stats.round + 1)
    );

    const ui = GameUI();
    if (typeof ui.updateLocksUI === 'function') ui.updateLocksUI();
    if (typeof ui.showRoundReview === 'function') ui.showRoundReview(Registry.stats.round, reason);
};

window.advanceToRound = function(targetRound) {
    if (targetRound > 13) {
        const ui = GameUI();
        if (typeof ui.showLeaderboard === 'function') ui.showLeaderboard("You Won!");
        return;
    }
    window.skipToRound(targetRound);
};

window.resetGame = function() {
    if (Config.debugMode) {
        Registry.points = 99999;
        Registry.highestUnlockedRound = 11;
    } else {
        Registry.points = 0;
    }
    
    return window.initializeRound(1, { resetCampaign: true });
};

window.skipToRound = function(targetRound, options = {}) {
    return window.initializeRound(targetRound, options);
};

window.initializeEngine = function() {
    const ui = GameUI();
    const shared = GameShared();
    
    // 1. Initialize VM and Automation BEFORE building the world
    const VM = window.Game.Automation || (typeof AutomationVM !== 'undefined' ? AutomationVM : null);
    if (VM && typeof VM.init === 'function') {
        VM.init();
    }
    
    if (typeof AutomationWorkshop !== 'undefined' && typeof AutomationWorkshop.loadScriptsFromStorage === 'function') {
        AutomationWorkshop.loadScriptsFromStorage();
    }

    const urlParams = new URLSearchParams(window.location.search);
    const dataParam = urlParams.get('Data') || urlParams.get('data') || urlParams.get('blueprint');
    if (dataParam && typeof shared.handleSharedData === 'function') {
        shared.handleSharedData(dataParam);
    }

    const gameIdParam = urlParams.get('GameID') || urlParams.get('gameid');
    if (gameIdParam && !isNaN(parseInt(gameIdParam))) {
        Registry.pendingManifest.push({ type: 'seed', value: parseInt(gameIdParam) });
    }

    const debugParam = urlParams.get('debug') || urlParams.get('manifest');
    if (debugParam) {
        const decodedDebug = window.decodePayload(debugParam);
        // ENFORCED SECRET: ELEVATOR_GO_BRRR_2026
        if (decodedDebug && decodedDebug.auth === "ELEVATOR_GO_BRRR_2026") {
            console.log("🔒 Secure Debug Payload Decoded. Queuing manifest Gateway...");
            Registry.pendingManifest.push({
                type: 'debug_override',
                overrides: decodedDebug.overrides,
                monkey: decodedDebug.monkey || null
            });
        }
    }

    // Autopilot URI trigger removed for security hardening. 
    // Use Debug Modal to launch UNIT_01.

    const isSimulationRealm = new URLSearchParams(window.location.search).get('simulation') === 'true';
    const savedTrophies = window.Game.Storage.get(window.Game.Keys.TROPHIES, '[]');
    Registry.trophyCase = JSON.parse(savedTrophies);

    // Kill Switch: Global listener for human intervention
    // Modified to ignore keyboard/window events to allow Alt-Tab and Console usage
    const haltAutoPilot = (e) => {
        if (!Registry.autoPilotActive) return;

        // Only halt if the click was inside the game world or on a controls element
        const worldContainer = document.getElementById('world');
        const sidebar = document.getElementById('sidebar');
        
        const isGameInteraction = (worldContainer && worldContainer.contains(e.target)) || 
                                (sidebar && sidebar.contains(e.target));

        if (isGameInteraction) {
            window.disengageAutoPilot(true);
            console.warn("⚠️ AUTO-PILOT HALTED: Manual gameplay detected.");
        }
    };
    window.addEventListener('mousedown', haltAutoPilot);


    // Hardened safety: debugMode must be explicitly true in config AND no clean URL override
    const isCleanUrl = !window.location.search.includes('manifest=') && !window.location.search.includes('debug=true');
    if (isCleanUrl) {
        Config.debugMode = false; 
    }

    if (Config.debugMode) {
        Registry.highestUnlockedRound = 11;
        Registry.points = 99999;
    } else {
        Registry.points = 0;
        Registry.highestUnlockedRound = 1;
    }

    if (typeof window.refreshDebugVisibility === 'function') {
        window.refreshDebugVisibility();
    }

    // Trigger full reset to build world and update UI
    window.resetGame();
    if (isSimulationRealm) {
        Registry.gameActive = false;
        const briefing = document.getElementById('roundModalOverlay');
        if (briefing) briefing.style.display = 'none';
    }
};

window.Game = window.Game || {};
window.Game.SHARE_SECRET = window.SHARE_SECRET;

// Shared data utilities
window.Game.Shared = {
    encodePayload: window.encodePayload,
    decodePayload: window.decodePayload,
    handleSharedData: window.handleSharedData
};

window.GameShared = function() {
    return window.Game.Shared;
};

window.Game.Engine = window.Game.Engine || {};
window.Game.Engine.initialize = window.initializeEngine;
window.Game.encodePayload = window.encodePayload;
window.Game.decodePayload = window.decodePayload;
window.Game.handleSharedData = window.handleSharedData;
window.Game.Engine = window.Game.Engine || {};
window.Game.Engine.pause = window.pauseGame;
window.Game.Engine.resume = window.resumeGame;
window.Game.Engine.setLiftTarget = window.setLiftTarget;
window.Game.Engine.setLiftAutomation = window.setLiftAutomation;
window.Game.Engine.openWorkshopModal = window.openWorkshopModal;
window.Game.Engine.reset = window.resetGame;
window.Game.Engine.skipToRound = window.skipToRound;
window.Game.Engine.completeRound = window.completeRound;
window.Game.Engine.handleOrdinaryDeath = window.handleOrdinaryDeath;
window.Game.Engine.retryFailedRound = window.retryFailedRound;
window.Game.Engine.advanceToRound = window.advanceToRound;
window.Game.Engine.captureRoundCheckpoint = window.captureRoundCheckpoint;
window.Game.Engine.resetAttemptTelemetry = window.resetAttemptTelemetry;
window.Game.Engine.disengageAutoPilot = window.disengageAutoPilot;
window.Game.Engine.getRoundDefinition = window.getRoundDefinition;
window.Game.Engine.createLiftState = window.createLiftState;
window.Game.Engine.createRoundState = window.createRoundState;
window.Game.Engine.applyRoundState = window.applyRoundState;
window.Game.Engine.initializeRound = window.initializeRound;

window.Game.UI = window.Game.UI || {};
window.Game.UI.initializeUI = window.initializeUI;

// STARTUP CALLS
window.addEventListener('DOMContentLoaded', () => {
    const isSimulationRealm = new URLSearchParams(window.location.search).get('simulation') === 'true';
    if (typeof window.initializeEngine === 'function') window.initializeEngine();
    if (typeof window.initializeUI === 'function') window.initializeUI();

    // Trigger manifest processing if we have inbound data
    if (Registry.pendingManifest.length > 0 && typeof window.processNextManifestItem === 'function') {
        window.processNextManifestItem();
    }

    if (isSimulationRealm) return;

    // Start Loops
    if (typeof gameTick === 'function') {
        setInterval(gameTick, 1000); // Physics / Game State
    }
    
    // Animation Loop
    function frame(time) {
        if (typeof animationTick === 'function') {
            animationTick(time);
        }
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
});

window.encodePayload = window.Game.encodePayload;
window.decodePayload = window.Game.decodePayload;
window.handleSharedData = window.Game.handleSharedData;
window.pauseGame = window.Game.Engine.pause;
window.resumeGame = window.Game.Engine.resume;
window.setLiftTarget = window.Game.Engine.setLiftTarget;
window.setLiftAutomation = window.Game.Engine.setLiftAutomation;
window.openWorkshopModal = window.Game.Engine.openWorkshopModal;
window.resetGame = window.Game.Engine.reset;
window.skipToRound = window.Game.Engine.skipToRound;
