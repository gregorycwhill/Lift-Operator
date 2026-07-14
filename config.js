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

window.Config = {
    debugMode: false, 
    autoPilot: false,
    autoPilotSettings: {
        shortRoundDuration: 30,
        agentSeed: 9999,
        profilePrefix: "AUTO_PILOT",
        indicatorId: "autoPilotIndicator"
    },
    numFloors: 10, 
    roundTime: 180, startingLives: 20, maxSpawnDelaySec: 3, 
    jamChancePerSec: 0.005, jamMinSec: 10, jamMaxSec: 25,
    checkoutChance: 0.50, 
    
    liftsR1: 1, liftsR2: 1, liftsR3: 2, liftsR4: 2, liftsR5: 3, liftsR6: 3, liftsR7: 4, liftsR8: 4, liftsR9: 5, liftsR10: 5, liftsR11: 5,
    
    spawnR1Start: 0.25, spawnR1End: 0.50, spawnR2Start: 0.50, spawnR2End: 0.65,
    spawnR3Start: 0.65, spawnR3End: 0.80, spawnR4Start: 0.80, spawnR4End: 0.95,
    spawnR5Start: 0.95, spawnR5End: 1.10, spawnR6Start: 1.10, spawnR6End: 1.25,
    spawnR7Start: 1.25, spawnR7End: 1.40, spawnR8Start: 1.00, spawnR8End: 1.25, 
    spawnR9Start: 1.25, spawnR9End: 1.50, spawnR10Start: 1.50, spawnR10End: 1.75,
    spawnR11Start: 1.75, spawnR11End: 2.00,
    spawnR12Start: 2.00, spawnR12End: 2.50,
    spawnR13Start: 1.50, spawnR13End: 1.75,
    
    happySec: 20, annoyedSec: 40, criticalSec: 60,
    liftCapacity: 10, 
    liftSpeedSec: 1.0, // 50% faster than base 1.5
    doorSpeedSec: 0.5,
    boardSpeedSec: 0.1,
    boardingSpeedMultiplier: 1.0,
    
    vipSpawnMinSec: 30, vipSpawnMaxSec: 120, vipPenalty: 10,
    fartChancePerSec: 0.005, fartStinkSec: 20,
    sunsetMinSec: 30, sunsetMaxSec: 90, sunsetDurationSec: 30, sunsetGuestRatio: 0.50,
    
    gymBroStinkThreshold: 3,
    roomServiceChance: 0.05,
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
    GAME_DATA: {
        achievements: {
            service: {
                id: 'service',
                name: 'Service Award',
                desc: 'Safely deliver heavy passenger guest volumes inside a single round.',
                bronze: { label: 'Bronze Fish', req: 10, icon: '🟫🐟', reward: 2 },
                silver: { label: 'Silver Fish', req: 30, icon: '⬜🐟', reward: 5 },
                gold: { label: 'Gold Fish', req: 50, icon: '🟨🐟', reward: 10 }
            },
            handsfree: {
                id: 'handsfree',
                name: 'Hands-Free Inventor',
                desc: 'Operate automated transit routines without manual click adjustments.',
                bronze: { label: 'Bronze Automation', req: 2, icon: '🟫🤖', reward: 2 },
                silver: { label: 'Silver Automation', req: 6, icon: '⬜🤖', reward: 5 },
                gold: { label: 'Gold Automation', req: 9, icon: '🟨🤖', reward: 10 }
            },
            sardine: {
                id: 'sardine',
                name: 'Sardine Packer',
                desc: 'Deliver fully loaded lifts packed perfectly to maximum capacity weight.',
                bronze: { label: 'Bronze Packer', req: 1, icon: '🟫📦', reward: 2 },
                silver: { label: 'Silver Packer', req: 3, icon: '⬜📦', reward: 5 },
                gold: { label: 'Gold Packer', req: 5, icon: '🟨📦', reward: 10 }
            },
            hacker: {
                id: 'hacker',
                name: 'Hacker Award',
                desc: 'Optimise custom logic to run for thousands of simulation cycles.',
                bronze: { label: 'Bronze Logic', req: 500, icon: '🟫⌨️', reward: 2 },
                silver: { label: 'Silver Logic', req: 5000, icon: '⬜⌨️', reward: 5 },
                gold: { label: 'Master Coder', req: 20000, icon: '🟨⌨️', reward: 10 }
            },
            parallel: {
                id: 'parallel',
                name: 'Parallel Universe',
                desc: 'Successfully bridge gaps between shafts using lateral transfer logic.',
                bronze: { label: 'Bronze Bridge', req: 1, icon: '🟫↔️', reward: 2 },
                silver: { label: 'Silver Bridge', req: 10, icon: '⬜↔️', reward: 5 },
                gold: { label: 'Quantum Leap', req: 25, icon: '🟨↔️', reward: 10 }
            },
            doubleup: {
                id: 'doubleup',
                name: 'Double Trouble',
                desc: 'Utilise double-decker infrastructure to move large volumes of people.',
                bronze: { label: 'Bronze Deck', req: 5, icon: '🟫🚡', reward: 2 },
                silver: { label: 'Silver Deck', req: 15, icon: '⬜🚡', reward: 5 },
                gold: { label: 'Ocean Liner', req: 40, icon: '🟨🚡', reward: 10 }
            }
        },
        powerups: {
            wrench: {
                tiers: [
                    { cost: 1, duration: 0 },
                    { cost: 3, duration: 0 },
                    { cost: 5, duration: 30 }
                ]
            },
            freshener: {
                tiers: [
                    { cost: 1, duration: 15 },
                    { cost: 3, duration: 15 },
                    { cost: 5, duration: 30 }
                ]
            },
            musak: {
                tiers: [
                    { cost: 1, duration: 15 },
                    { cost: 3, duration: 15 },
                    { cost: 5, duration: 15 }
                ]
            },
            turbo: {
                tiers: [
                    { cost: 1, duration: 10, scalar: 0.1 },
                    { cost: 3, duration: 15, scalar: 0.05 },
                    { cost: 5, duration: 20, scalar: 0.05 }
                ]
            },
            tardis: {
                tiers: [
                    { cost: 1, duration: 15, scalar: 999 },
                    { cost: 3, duration: 15, scalar: 999 },
                    { cost: 5, duration: 30, scalar: 999 }
                ]
            },
            doors: {
                tiers: [
                    { cost: 2, duration: 20, scalar: 0.5 },
                    { cost: 4, duration: 30, scalar: 0.33 },
                    { cost: 6, duration: 30, scalar: 0.05 }
                ]
            },
            groupThink: {
                tiers: [
                    { cost: 2, duration: 0 },
                    { cost: 4, duration: 0 },
                    { cost: 6, duration: 0 }
                ]
            },
            doubleDecker: {
                tiers: [
                    { cost: 3, duration: 30 },
                    { cost: 5, duration: 60 },
                    { cost: 8, duration: 45 }
                ]
            },
            openPlan: {
                tiers: [
                    { cost: 4, duration: 20 },
                    { cost: 6, duration: 45 },
                    { cost: 10, duration: 30 }
                ]
            }
        },
        system: {
            showcaseLimit: 6,
            lateralTolerance: 0.2, // 20% floor height
            vipHeadstartSec: 20,
            patience: {
                happy: 20,
                annoyed: 40,
                critical: 60,
                rage: 80
            }
        },
        rounds: {
            1: { objective: 'SURVIVAL', gravityScalar: 0 },
            2: { objective: 'SURVIVAL', gravityScalar: 0 },
            3: { objective: 'SURVIVAL', gravityScalar: 0 },
            4: { objective: 'SURVIVAL', gravityScalar: 0 },
            5: { objective: 'SURVIVAL', gravityScalar: 0 },
            6: { objective: 'SURVIVAL', gravityScalar: 0 },
            7: { objective: 'SURVIVAL', gravityScalar: 0 },
            8: { objective: 'SURVIVAL', gravityScalar: 0 },
            9: { objective: 'SURVIVAL', gravityScalar: 0 },
            10: { objective: 'SURVIVAL', gravityScalar: 0 },
            11: { objective: 'SURVIVAL', gravityScalar: 0 },
            12: { objective: 'QUOTA', quota: 50, gravityScalar: 0 },
            13: { objective: 'PEDAL_SURVIVAL', gravityScalar: 2.0 }
        }
    }
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