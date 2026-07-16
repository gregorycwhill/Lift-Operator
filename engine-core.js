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
    if (!decoded) return;
    
    // Support singular structures or native array manifestations safely
    const incomingItems = Array.isArray(decoded.manifest) ? decoded.manifest : [decoded];
    
    // Stage inside pending queue array for user reconciliation gateway loop
    Registry.pendingManifest = [...Registry.pendingManifest, ...incomingItems];
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
    Registry.enduranceSeconds = 0;
    Registry.customScriptTicks = 0;
};

window.clearAttemptInventory = function() {
    if (typeof PowerUps === 'undefined') return;
    PowerUps.cart = [];
    PowerUps.inventory = [];
    PowerUps.activeTargeting = null;
    Object.keys(PowerUps.timers).forEach(k => PowerUps.timers[k] = 0);
    Config.boardingSpeedMultiplier = 1.0;
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
    window.skipToRound(checkpoint.round, { preserveCheckpoint: true });
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
    Registry.stats.round = 1;
    Registry.stats.timeLeft = Registry.autoPilotActive ? (Config.autoPilotSettings.shortRoundDuration || 30) : Config.roundTime;
    Registry.stats.lives = Config.startingLives;
    Registry.stats.served = 0;
    Registry.stats.currentSpawnChance = Config.spawnR1Start;
    Registry.vipSpawned = false; Registry.vipTargetTime = 0;
    Registry.sunsetHasHappened = false; Registry.sunsetTargetTime = 0; Registry.sunsetActive = false; Registry.sunsetEndTime = 0;
    Registry.gymFloor = -1;
    
    if (Config.debugMode) {
        Registry.points = 99999;
        Registry.highestUnlockedRound = 11;
    } else {
        Registry.points = 0;
    }
    
    window.clearAttemptInventory();
    
    window.resetAttemptTelemetry();
    
    Config.numFloors = 10;
    
    const seedTool = (window.Game && window.Game.Seed) ? window.Game.Seed : { set: setSeed };
    seedTool.set(Registry.seed);

    Registry.lifts = [];
    for (let i = 0; i < Config.liftsR1; i++) {
        Registry.lifts.push({ 
            id: i, targetFloor: 0, pos: 0, passengers: [], 
            lastActionTime: 0, automation: 'manual', sweepDirection: 1, 
            manualOverride: false, isJammed: false, jamTimer: 0, stinkTimer: 0, 
            tardisTimer: 0, turboTimer: 0, freshenerTimer: 0, 
            musakTimer: 0, sardineScored: false,
            state: 'IDLE', stateProgress: 0,
            effects: []
        });
    }
    Registry.floors = Array.from({length: Config.numFloors}, () => ({ waitingGuests: [] }));
    window.captureRoundCheckpoint(1);
    
    const ui = GameUI();
    if (typeof ui.buildWorld === 'function') ui.buildWorld();
    if (typeof ui.updateScoreboardUI === 'function') ui.updateScoreboardUI();
    if (typeof ui.draw === 'function') ui.draw();
    if (typeof ui.showRoundModal === 'function') ui.showRoundModal(1);
};

window.skipToRound = function(targetRound, options = {}) {
    const seedTool = (window.Game && window.Game.Seed) ? window.Game.Seed : { set: setSeed };
    seedTool.set(Registry.seed);
    Registry.stats.round = targetRound;
    Registry.stats.timeLeft = Registry.autoPilotActive ? (Config.autoPilotSettings.shortRoundDuration || 30) : Config.roundTime;
    Registry.stats.lives = Config.startingLives;
    Registry.vipSpawned = false; Registry.vipTargetTime = 0;
    Registry.sunsetHasHappened = false; Registry.sunsetTargetTime = 0; Registry.sunsetActive = false; Registry.sunsetEndTime = 0;
    Registry.gymFloor = -1;
    
    window.clearAttemptInventory();
    
    window.resetAttemptTelemetry();
    
    Config.numFloors = targetRound >= 6 ? 15 : 10;
    
    let numLifts = Config.liftsR1;
    if (targetRound === 2) { numLifts = Config.liftsR2; Registry.stats.currentSpawnChance = Config.spawnR2Start; }
    else if (targetRound === 3) { numLifts = Config.liftsR3; Registry.stats.currentSpawnChance = Config.spawnR3Start; }
    else if (targetRound === 4) { numLifts = Config.liftsR4; Registry.stats.currentSpawnChance = Config.spawnR4Start; }
    else if (targetRound === 5) { numLifts = Config.liftsR5; Registry.stats.currentSpawnChance = Config.spawnR5Start; }
    else if (targetRound === 6) { numLifts = Config.liftsR6; Registry.stats.currentSpawnChance = Config.spawnR6Start; }
    else if (targetRound === 7) { numLifts = Config.liftsR7; Registry.stats.currentSpawnChance = Config.spawnR7Start; }
    else if (targetRound === 8) { 
        numLifts = Config.liftsR8; Registry.stats.currentSpawnChance = Config.spawnR8Start; 
        const spawnDelaySec = window.getRandomInt(Config.vipSpawnMinSec, Config.vipSpawnMaxSec);
        Registry.vipTargetTime = (window.Game.virtualTime || Date.now()) + (spawnDelaySec * 1000);
    }
    else if (targetRound === 9) { 
        numLifts = Config.liftsR9; Registry.stats.currentSpawnChance = Config.spawnR9Start; 
        const sunsetDelaySec = window.getRandomInt(Config.sunsetMinSec, Config.sunsetMaxSec);
        Registry.sunsetTargetTime = (window.Game.virtualTime || Date.now()) + (sunsetDelaySec * 1000);
    }
    else if (targetRound === 10) { numLifts = Config.liftsR10; Registry.stats.currentSpawnChance = Config.spawnR10Start; }
    else if (targetRound === 11) { 
        numLifts = Config.liftsR11; Registry.stats.currentSpawnChance = Config.spawnR11Start; 
        Registry.gymFloor = window.getRandomInt(1, Config.numFloors - 2);
    }
    else if (targetRound === 12) { 
        numLifts = Config.liftsR12 || 4; 
        Registry.stats.currentSpawnChance = Config.spawnR12Start || 0.04;
    }
    else if (targetRound === 13) { 
        numLifts = Config.liftsR13 || 4; 
        Registry.stats.currentSpawnChance = Config.spawnR13Start || 0.05;
    }
    
    Registry.lifts = [];
    for (let i = 0; i < numLifts; i++) {
        Registry.lifts.push({ 
            id: i, targetFloor: 0, pos: 0, passengers: [], 
            lastActionTime: 0, automation: 'manual', sweepDirection: 1, 
            manualOverride: false, isJammed: false, jamTimer: 0, stinkTimer: 0, 
            tardisTimer: 0, turboTimer: 0, freshenerTimer: 0, 
            musakTimer: 0, sardineScored: false,
            state: 'IDLE', stateProgress: 0,
            effects: []
        });
    }
    Registry.floors = Array.from({length: Config.numFloors}, () => ({ waitingGuests: [] }));

    if (!options.preserveCheckpoint) {
        window.captureRoundCheckpoint(targetRound);
    }
    
    const ui = GameUI();
    if (typeof ui.buildWorld === 'function') ui.buildWorld();
    if (typeof ui.updateScoreboardUI === 'function') ui.updateScoreboardUI();
    if (typeof ui.draw === 'function') ui.draw();
    if (typeof ui.showRoundModal === 'function') ui.showRoundModal(targetRound);
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
            Registry.autoPilotActive = false;
            Registry.manualIntervention = true;
            console.warn("⚠️ AUTO-PILOT HALTED: Manual gameplay detected.");
            const hb = document.getElementById('heartbeatMonitor');
            if (hb) hb.classList.add('hidden');
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
window.Game.Engine.advanceToRound = window.advanceToRound;
window.Game.Engine.captureRoundCheckpoint = window.captureRoundCheckpoint;
window.Game.Engine.resetAttemptTelemetry = window.resetAttemptTelemetry;

window.Game.UI = window.Game.UI || {};
window.Game.UI.initializeUI = window.initializeUI;

// STARTUP CALLS
window.addEventListener('DOMContentLoaded', () => {
    if (typeof window.initializeEngine === 'function') window.initializeEngine();
    if (typeof window.initializeUI === 'function') window.initializeUI();

    // Trigger manifest processing if we have inbound data
    if (Registry.pendingManifest.length > 0 && typeof window.processNextManifestItem === 'function') {
        window.processNextManifestItem();
    }

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
