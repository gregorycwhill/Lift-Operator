// ============================================================================
// ENGINE-CORE.JS : LIFECYCLE MANAGEMENT, WORKSHOP MODALS, & PAYLOAD CODECS
// ============================================================================

window.SHARE_SECRET = "ELEVATOR_GO_BRRR_2026";

window.encodePayload = function(payloadObj) {
    try {
        const str = JSON.stringify(payloadObj);
        let xorStr = '';
        for (let i = 0; i < str.length; i++) {
            xorStr += String.fromCharCode(str.charCodeAt(i) ^ window.SHARE_SECRET.charCodeAt(i % window.SHARE_SECRET.length));
        }
        return encodeURIComponent(btoa(encodeURIComponent(xorStr)));
    } catch (e) {
        console.error("Failed to encode payload.", e);
        return null;
    }
};

window.decodePayload = function(encodedStr) {
    try {
        const xorStr = decodeURIComponent(atob(decodeURIComponent(encodedStr)));
        let str = '';
        for (let i = 0; i < xorStr.length; i++) {
            str += String.fromCharCode(xorStr.charCodeAt(i) ^ window.SHARE_SECRET.charCodeAt(i % window.SHARE_SECRET.length));
        }
        return JSON.parse(str);
    } catch (e) {
        console.warn("Invalid or tampered share link detected. Ignoring.");
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

window.resetGame = function() {
    Registry.stats.round = 1;
    Registry.stats.timeLeft = Config.roundTime;
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
    
    if (typeof PowerUps !== 'undefined') {
        PowerUps.cart = [];
        PowerUps.inventory = [];
        PowerUps.activeTargeting = null;
        Object.keys(PowerUps.timers).forEach(k => PowerUps.timers[k] = 0);
    }
    
    Registry.roundStats = { 
        manualClicks: 0, jammedLiftsFixed: 0, fullyLoadedLifts: 0, servedThisRound: 0,
        happyServed: 0, annoyedServed: 0, criticalServed: 0, vipServed: 0,
        defenestrationsThisRound: 0, totalWaitTimeServed: 0
    };
    
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
            state: 'IDLE', stateProgress: 0
        });
    }
    Registry.floors = Array.from({length: Config.numFloors}, () => ({ waitingGuests: [] }));
    
    const ui = GameUI();
    if (typeof ui.buildWorld === 'function') ui.buildWorld();
    if (typeof ui.updateScoreboardUI === 'function') ui.updateScoreboardUI();
    if (typeof ui.draw === 'function') ui.draw();
    if (typeof ui.showRoundModal === 'function') ui.showRoundModal(1);
};

window.skipToRound = function(targetRound) {
    Registry.stats.round = targetRound;
    Registry.stats.timeLeft = Config.roundTime;
    Registry.stats.lives = Config.startingLives;
    Registry.vipSpawned = false; Registry.vipTargetTime = 0;
    Registry.sunsetHasHappened = false; Registry.sunsetTargetTime = 0; Registry.sunsetActive = false; Registry.sunsetEndTime = 0;
    Registry.gymFloor = -1;
    
    if (typeof PowerUps !== 'undefined') {
        PowerUps.cart = [];
        PowerUps.inventory = [];
        PowerUps.activeTargeting = null;
        Object.keys(PowerUps.timers).forEach(k => PowerUps.timers[k] = 0);
    }
    
    Registry.roundStats = { 
        manualClicks: 0, jammedLiftsFixed: 0, fullyLoadedLifts: 0, servedThisRound: 0,
        happyServed: 0, annoyedServed: 0, criticalServed: 0, vipServed: 0,
        defenestrationsThisRound: 0, totalWaitTimeServed: 0
    };
    
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
    
    Registry.lifts = [];
    for (let i = 0; i < numLifts; i++) {
        Registry.lifts.push({ 
            id: i, targetFloor: 0, pos: 0, passengers: [], 
            lastActionTime: 0, automation: 'manual', sweepDirection: 1, 
            manualOverride: false, isJammed: false, jamTimer: 0, stinkTimer: 0, 
            tardisTimer: 0, turboTimer: 0, freshenerTimer: 0, 
            musakTimer: 0, sardineScored: false,
            state: 'IDLE', stateProgress: 0
        });
    }
    Registry.floors = Array.from({length: Config.numFloors}, () => ({ waitingGuests: [] }));
    
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

    const savedTrophies = window.Game.Storage.get(window.Game.Keys.TROPHIES, '[]');
    Registry.trophyCase = JSON.parse(savedTrophies);

    if (Config.debugMode) {
        Registry.points = 99999;
        Registry.highestUnlockedRound = 11;
    }

    Config.numFloors = 10;
    Registry.floors = Array.from({length: Config.numFloors}, () => ({ waitingGuests: [] }));
    Registry.lifts = []; 
    
    for (let i = 0; i < Config.liftsR1; i++) {
        Registry.lifts.push({ 
            id: i, targetFloor: 0, pos: 0, passengers: [], lastActionTime: 0, 
            automation: 'manual', sweepDirection: 1, manualOverride: false, 
            isJammed: false, jamTimer: 0, stinkTimer: 0, 
            tardisTimer: 0, turboTimer: 0, freshenerTimer: 0, musakTimer: 0, 
            musakTimer: 0, sardineScored: false,
            state: 'IDLE', stateProgress: 0
        });
    }
    Registry.floors = Array.from({length: Config.numFloors}, () => ({ waitingGuests: [] }));
    
    Registry.seed = Registry.seed || Math.floor(Math.random() * 9000) + 1000;
    setSeed(Registry.seed);

    // Ensure First Guest spawns
    window.forceFirstSpawn(window.Game.virtualTime || Date.now());
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
