// ============================================================================
// CONFIG.JS : GAME DATA, BALANCING, & REGISTRY
// ============================================================================

window.Game = window.Game || {};

// Randomized Seeded Logic
window.Game.Seed = {
    current: 1,
    set: function(seed) {
        let s = parseInt(seed);
        if (isNaN(s)) s = 1234;
        this.current = (Math.abs(s) % 2147483647) || 1;
    },
    random: function() {
        this.current = (this.current * 16807) % 2147483647;
        return Math.max(0, Math.min(0.9999999, (this.current - 1) / 2147483646));
    }
};

window.Game.AutomationSeed = {
    current: 1,
    set: function(seed) {
        let value = parseInt(seed);
        if (isNaN(value)) value = 9876;
        this.current = (Math.abs(value) % 2147483647) || 1;
    },
    random: function() {
        this.current = (this.current * 48271) % 2147483647;
        return Math.max(0, Math.min(0.9999999, (this.current - 1) / 2147483646));
    }
};

// Storage Helpers
window.Game.Storage = {
    get: function(key, fallback) {
        try { return localStorage.getItem(key) || fallback; }
        catch (e) { return fallback; }
    },
    set: function(key, value) {
        try { localStorage.setItem(key, value); }
        catch (e) {}
    }
};

// Storage Key Mappings
window.Game.Keys = {
    TROPHIES: 'liftOp_v2_activeTrophies',
    PLAYER: 'liftOp_v2_lastPlayer',
    ACHIEVEMENTS: 'liftOp_v2_achievements_',
    LEADERBOARD: 'liftOp_v2_arcadeBoard',
    SCRIPTS: 'liftOp_v2_scripts_'
};

// Shared Constants
window.Game.Constants = {
    GuestStatus: {
        HAPPY: 'happy',
        ANNOYED: 'annoyed',
        CRITICAL: 'critical',
        RAGE: 'rage'
    }
};

const GuestStatus = window.Game.Constants.GuestStatus;

// Component Aliases (Internal Compatibility)
const setSeed = (s) => window.Game.Seed.set(s);
const seededRandom = () => window.Game.Seed.random();
const safeGetItem = (k, f) => window.Game.Storage.get(k, f);
const safeSetItem = (k, v) => window.Game.Storage.set(k, v);

// Global Helper: Get random integer between min and max (inclusive)
window.getRandomInt = function(min, max) {
    return Math.floor(seededRandom() * (max - min + 1)) + min;
};

// Global Helper: Get random floor index
window.getRandomFloor = function() {
    let f = Math.floor(seededRandom() * window.Config.numFloors);
    return Math.max(0, Math.min(window.Config.numFloors - 1, f));
};

window.getAutomationRandomFloor = function() {
    const value = Math.floor(window.Game.AutomationSeed.random() * window.Config.numFloors);
    return Math.max(0, Math.min(window.Config.numFloors - 1, value));
};

const BalanceData = window.GameBalanceData;
if (!BalanceData) throw new Error('Generated balance data failed to load.');
const BalanceSystem = BalanceData.system;
const BalanceRounds = BalanceData.rounds;

window.Config = {
    balanceVersion: BalanceData.balanceVersion,
    debugMode: false, 
    autoPilot: false,
    autoPilotSettings: {
        shortRoundDuration: 30,
        agentSeed: 9999,
        enduranceLifeLossIntervalSec: 1,
        profilePrefix: "AUTO_PILOT",
        indicatorId: "autoPilotIndicator"
    },
    numFloors: BalanceRounds[1].floors,
    roundTime: BalanceSystem.roundTime,
    startingLives: BalanceSystem.startingLives,
    maxSpawnDelaySec: 3,
    jamChancePerSec: BalanceSystem.jam.chancePerSec,
    jamMinSec: BalanceSystem.jam.minSec,
    jamMaxSec: BalanceSystem.jam.maxSec,
    checkoutChance: BalanceSystem.checkoutChance,
    
    liftsR1: BalanceRounds[1].lifts, liftsR2: BalanceRounds[2].lifts, liftsR3: BalanceRounds[3].lifts, liftsR4: BalanceRounds[4].lifts, liftsR5: BalanceRounds[5].lifts, liftsR6: BalanceRounds[6].lifts, liftsR7: BalanceRounds[7].lifts, liftsR8: BalanceRounds[8].lifts, liftsR9: BalanceRounds[9].lifts, liftsR10: BalanceRounds[10].lifts, liftsR11: BalanceRounds[11].lifts, liftsR12: BalanceRounds[12].lifts, liftsR13: BalanceRounds[13].lifts,
    
    spawnR1Start: BalanceRounds[1].spawnStart, spawnR1End: BalanceRounds[1].spawnEnd, spawnR2Start: BalanceRounds[2].spawnStart, spawnR2End: BalanceRounds[2].spawnEnd,
    spawnR3Start: BalanceRounds[3].spawnStart, spawnR3End: BalanceRounds[3].spawnEnd, spawnR4Start: BalanceRounds[4].spawnStart, spawnR4End: BalanceRounds[4].spawnEnd,
    spawnR5Start: BalanceRounds[5].spawnStart, spawnR5End: BalanceRounds[5].spawnEnd, spawnR6Start: BalanceRounds[6].spawnStart, spawnR6End: BalanceRounds[6].spawnEnd,
    spawnR7Start: BalanceRounds[7].spawnStart, spawnR7End: BalanceRounds[7].spawnEnd, spawnR8Start: BalanceRounds[8].spawnStart, spawnR8End: BalanceRounds[8].spawnEnd,
    spawnR9Start: BalanceRounds[9].spawnStart, spawnR9End: BalanceRounds[9].spawnEnd, spawnR10Start: BalanceRounds[10].spawnStart, spawnR10End: BalanceRounds[10].spawnEnd,
    spawnR11Start: BalanceRounds[11].spawnStart, spawnR11End: BalanceRounds[11].spawnEnd,
    spawnR12Start: BalanceRounds[12].spawnStart, spawnR12End: BalanceRounds[12].spawnEnd,
    spawnR13Start: BalanceRounds[13].spawnStart, spawnR13End: BalanceRounds[13].spawnEnd,
    
    happySec: BalanceSystem.patience.happy,
    annoyedSec: BalanceSystem.patience.annoyed,
    criticalSec: BalanceSystem.patience.critical,
    liftCapacity: BalanceSystem.liftCapacity,
    liftSpeedSec: BalanceSystem.liftSpeedSec,
    doorSpeedSec: BalanceSystem.doorSpeedSec,
    boardSpeedSec: BalanceSystem.boardSpeedSec,
    boardingSpeedMultiplier: 1.0,
    
    vipSpawnMinSec: 30, vipSpawnMaxSec: 120, vipPenalty: BalanceSystem.vipPenalty,
    fartChancePerSec: BalanceSystem.stink.chancePerSec, fartStinkSec: BalanceSystem.stink.durationSec,
    sunsetMinSec: BalanceSystem.sunset.minSec, sunsetMaxSec: BalanceSystem.sunset.maxSec, sunsetDurationSec: BalanceSystem.sunset.durationSec, sunsetGuestRatio: BalanceSystem.sunset.guestRatio,
    
    gymBroStinkThreshold: BalanceSystem.stink.gymBroThreshold,
    roomServiceChance: BalanceSystem.roomServiceChance,
    gravityConstant: 0.4,
    
    roundTitles: {
        1: "Welcome Pilot",
        2: "Automation 101",
        3: "Trainee Rush",
        4: "Triage Protocol",
        5: "Democratic Flow",
        6: "Maintenance Crisis",
        7: "Check-out Challenge",
        8: "VIP Security",
        9: "Happy Hour",
        10: "Workshop Sandbox",
        11: "Heavy Lifting",
        12: "Endurance Test",
        13: "Pedal Power"
    },

    // GAME_DATA: The single source of truth for all game balancing
    GAME_DATA: BalanceData
};

const Config = window.Config;

const debugDefinitions = [
    { key: 'roundTime', label: 'Round Duration (sec)', min: 10, max: 600, step: 10, dispFormat: (v)=>v },
    { key: 'startingLives', label: 'Starting Lives', min: 1, max: 100, step: 1, dispFormat: (v)=>v },
    { key: 'maxSpawnDelaySec', label: 'Max Spawn Delay (sec)', min: 1, max: 10, step: 1, dispFormat: (v)=>v },
    { key: 'jamChancePerSec', label: 'Lift Jam Chance/Sec', min: 0.000, max: 0.1, step: 0.001, dispFormat: (v)=>(v*100).toFixed(1)+'%' },
    { key: 'checkoutChance', label: 'Check-out (G) Chance', min: 0.0, max: 1.0, step: 0.05, dispFormat: (v)=>Math.round(v*100)+'%' },
    { key: 'vipSpawnMinSec', label: 'VIP Min Spawn (sec)', min: 10, max: 180, step: 10, dispFormat: (v)=>v },
    { key: 'vipSpawnMaxSec', label: 'VIP Max Spawn (sec)', min: 20, max: 300, step: 10, dispFormat: (v)=>v },
    { key: 'vipPenalty', label: 'VIP Rage Penalty', min: 1, max: 20, step: 1, dispFormat: (v)=>v },
    { key: 'fartChancePerSec', label: 'Fart Chance/Sec', min: 0.0, max: 0.1, step: 0.001, dispFormat: (v)=>(v*100).toFixed(1)+'%' },
    { key: 'fartStinkSec', label: 'Fart Duration (sec)', min: 1, max: 30, step: 1, dispFormat: (v)=>v },
    { key: 'gymBroStinkThreshold', label: 'Gym Bro Stink Threshold', min: 1, max: 10, step: 1, dispFormat: (v)=>v },
    { key: 'sunsetMinSec', label: 'Sunset Min Spawn (sec)', min: 10, max: 120, step: 5, dispFormat: (v)=>v },
    { key: 'sunsetMaxSec', label: 'Sunset Max Spawn (sec)', min: 20, max: 180, step: 5, dispFormat: (v)=>v },
    { key: 'sunsetDurationSec', label: 'Sunset Duration (sec)', min: 10, max: 120, step: 5, dispFormat: (v)=>v },
    { key: 'sunsetGuestRatio', label: 'Sunset Ratio', min: 0.1, max: 1.0, step: 0.1, dispFormat: (v)=>Math.round(v*100)+'%' },
    { key: 'liftsR1', label: 'Lifts in Round 1', min: 1, max: 5, step: 1, dispFormat: (v)=>v },
    { key: 'spawnR1Start', label: 'R1 Start Rate', min: 0.05, max: 2.0, step: 0.05, dispFormat: (v)=>Math.round(v*100)+'%' },
    { key: 'spawnR1End', label: 'R1 End Rate', min: 0.05, max: 2.0, step: 0.05, dispFormat: (v)=>Math.round(v*100)+'%' },
    { key: 'spawnR2Start', label: 'R2 Start Rate', min: 0.05, max: 2.0, step: 0.05, dispFormat: (v)=>Math.round(v*100)+'%' },
    { key: 'spawnR2End', label: 'R2 End Rate', min: 0.05, max: 2.0, step: 0.05, dispFormat: (v)=>Math.round(v*100)+'%' },
    { key: 'spawnR3Start', label: 'R3 Start Rate', min: 0.05, max: 2.0, step: 0.05, dispFormat: (v)=>Math.round(v*100)+'%' },
    { key: 'spawnR3End', label: 'R3 End Rate', min: 0.05, max: 2.0, step: 0.05, dispFormat: (v)=>Math.round(v*100)+'%' },
    { key: 'spawnR4Start', label: 'R4 Start Rate', min: 0.05, max: 3.0, step: 0.05, dispFormat: (v)=>Math.round(v*100)+'%' },
    { key: 'spawnR4End', label: 'R4 End Rate', min: 0.05, max: 3.0, step: 0.05, dispFormat: (v)=>Math.round(v*100)+'%' },
    { key: 'spawnR5Start', label: 'R5 Start Rate', min: 0.05, max: 3.0, step: 0.05, dispFormat: (v)=>Math.round(v*100)+'%' },
    { key: 'spawnR5End', label: 'R5 End Rate', min: 0.05, max: 3.0, step: 0.05, dispFormat: (v)=>Math.round(v*100)+'%' },
    { key: 'spawnR6Start', label: 'R6 Start Rate', min: 0.05, max: 3.0, step: 0.05, dispFormat: (v)=>Math.round(v*100)+'%' },
    { key: 'spawnR6End', label: 'R6 End Rate', min: 0.05, max: 3.0, step: 0.05, dispFormat: (v)=>Math.round(v*100)+'%' },
    { key: 'spawnR7Start', label: 'R7 Start Rate', min: 0.05, max: 4.0, step: 0.05, dispFormat: (v)=>Math.round(v*100)+'%' },
    { key: 'spawnR7End', label: 'R7 End Rate', min: 0.05, max: 4.0, step: 0.05, dispFormat: (v)=>Math.round(v*100)+'%' },
    { key: 'spawnR8Start', label: 'R8 Start Rate', min: 0.05, max: 4.0, step: 0.05, dispFormat: (v)=>Math.round(v*100)+'%' },
    { key: 'spawnR8End', label: 'R8 End Rate', min: 0.05, max: 4.0, step: 0.05, dispFormat: (v)=>Math.round(v*100)+'%' },
    { key: 'spawnR9Start', label: 'R9 Start Rate', min: 0.05, max: 4.0, step: 0.05, dispFormat: (v)=>Math.round(v*100)+'%' },
    { key: 'spawnR9End', label: 'R9 End Rate', min: 0.05, max: 4.0, step: 0.05, dispFormat: (v)=>Math.round(v*100)+'%' },
    { key: 'spawnR10Start', label: 'R10 Start Rate', min: 0.05, max: 5.0, step: 0.05, dispFormat: (v)=>Math.round(v*100)+'%' },
    { key: 'spawnR10End', label: 'R10 End Rate', min: 0.05, max: 5.0, step: 0.05, dispFormat: (v)=>Math.round(v*100)+'%' },
    { key: 'spawnR11Start', label: 'R11 Start Rate', min: 0.05, max: 5.0, step: 0.05, dispFormat: (v)=>Math.round(v*100)+'%' },
    { key: 'spawnR11End', label: 'R11 End Rate', min: 0.05, max: 5.0, step: 0.05, dispFormat: (v)=>Math.round(v*100)+'%' },
    { key: 'happySec', label: 'Happy Timeout (sec)', min: 2, max: 100, step: 1, dispFormat: (v)=>v },
    { key: 'annoyedSec', label: 'Annoyed Timeout (sec)', min: 5, max: 120, step: 1, dispFormat: (v)=>v },
    { key: 'criticalSec', label: 'Defenestrate Timeout (sec)', min: 10, max: 200, step: 1, dispFormat: (v)=>v },
    { key: 'liftCapacity', label: 'Lift Capacity', min: 1, max: 30, step: 1, dispFormat: (v)=>v },
    { key: 'liftSpeedSec', label: 'Lift Speed (sec/floor)', min: 0.1, max: 5.0, step: 0.1, dispFormat: (v)=>v.toFixed(1) },
    { key: 'boardSpeedSec', label: 'Boarding Speed (sec/person)', min: 0.1, max: 5.0, step: 0.1, dispFormat: (v)=>v.toFixed(1) },
    { key: 'gravityConstant', label: 'Gravity Penalty (Up)', min: 0.0, max: 0.8, step: 0.05, dispFormat: (v)=>Math.round(v*100)+'%' }
];
