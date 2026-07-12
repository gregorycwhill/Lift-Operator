// ============================================================================
// CONFIG.JS : GAME DATA, BALANCING, & REGISTRY
// ============================================================================

let currentSeed = 1;
function setSeed(seed) {
    currentSeed = seed % 2147483647;
    if (currentSeed <= 0) currentSeed += 2147483646;
}
function seededRandom() {
    currentSeed = currentSeed * 16807 % 2147483647;
    return (currentSeed - 1) / 2147483646;
}

function safeGetItem(key, fallback) { try { return localStorage.getItem(key) || fallback; } catch (e) { return fallback; } }
function safeSetItem(key, value) { try { localStorage.setItem(key, value); } catch (e) {} }

const Config = {
    debugMode: true, 
    numFloors: 10, 
    roundTime: 180, startingLives: 20, maxSpawnDelaySec: 3, 
    jamChancePerSec: 0.005, jamMinSec: 5, jamMaxSec: 15,
    checkoutChance: 0.50, 
    
    liftsR1: 1, liftsR2: 1, liftsR3: 2, liftsR4: 2, liftsR5: 3, liftsR6: 3, liftsR7: 4, liftsR8: 4, liftsR9: 5, liftsR10: 5, liftsR11: 5,
    
    spawnR1Start: 0.25, spawnR1End: 0.50, spawnR2Start: 0.50, spawnR2End: 0.65,
    spawnR3Start: 0.65, spawnR3End: 0.80, spawnR4Start: 0.80, spawnR4End: 0.95,
    spawnR5Start: 0.95, spawnR5End: 1.10, spawnR6Start: 1.10, spawnR6End: 1.25,
    spawnR7Start: 1.25, spawnR7End: 1.40, spawnR8Start: 1.00, spawnR8End: 1.25, 
    spawnR9Start: 1.25, spawnR9End: 1.50, spawnR10Start: 1.50, spawnR10End: 1.75,
    spawnR11Start: 1.75, spawnR11End: 2.00,
    
    happySec: 10, annoyedSec: 20, criticalSec: 30,
    liftCapacity: 10, liftSpeedSec: 0.5, boardSpeedSec: 1.0,
    
    vipSpawnMinSec: 30, vipSpawnMaxSec: 120, vipPenalty: 10,
    fartChancePerSec: 0.005, fartStinkSec: 10,
    sunsetMinSec: 30, sunsetMaxSec: 90, sunsetDurationSec: 30, sunsetGuestRatio: 0.50,
    
    gymBroStinkThreshold: 3
};

const Registry = { 
    lifts: [], floors: [], 
    stats: { lives: Config.startingLives, round: 1, timeLeft: Config.roundTime, served: 0, currentSpawnChance: Config.spawnR1Start, totalPointsEarned: 0 }, 
    
    points: 0,
    inventory: [],
    
    // Core Telemetry Upgrades for Achievements & Round Review
    roundStats: { 
        manualClicks: 0, 
        jammedLiftsFixed: 0, 
        fullyLoadedLifts: 0, 
        servedThisRound: 0,
        happyServed: 0,
        annoyedServed: 0,
        criticalServed: 0,
        vipServed: 0,
        defenestrationsThisRound: 0,
        totalWaitTimeServed: 0
    },
    
    // Social Sharing, Manifest & Trophy States
    pendingManifest: [],
    trophyCase: [], // Array of up to 6 keys selected for leaderboard view
    
    highestUnlockedRound: 1, 
    gameActive: false, pauseStartTime: 0, lastSpawnTime: 0, floorHeight: 60, 
    fallbackName: "Pilot 1", seed: 1234,
    vipSpawned: false, vipTargetTime: 0,
    sunsetHasHappened: false, sunsetTargetTime: 0, sunsetActive: false, sunsetEndTime: 0,
    gymFloor: -1,

    getNearestTarget: function(lift, targetType) {
        let bestFloor = -1;
        let minDist = Infinity;
        let currentFloor = Math.round(lift.pos / Registry.floorHeight);
        
        for (let f = 0; f < Config.numFloors; f++) {
            let hasTarget = false;
            if (targetType === 'destination') hasTarget = lift.passengers.some(p => p.dest === f);
            else if (targetType === 'any_waiting') hasTarget = Registry.floors[f].waitingGuests.length > 0;
            else hasTarget = Registry.floors[f].waitingGuests.some(g => g.status === targetType || (targetType === 'vip' && g.isVip));
            
            if (hasTarget) {
                let dist = Math.abs(f - currentFloor);
                if (dist < minDist) { minDist = dist; bestFloor = f; }
            }
        }
        return bestFloor;
    },
    getWaitingCount: function(floor) {
        if(floor < 0 || floor >= Config.numFloors) return 0;
        return Registry.floors[floor].waitingGuests.length;
    },
    isFloorClaimedByOther: function(floor, myLiftId) {
        return Registry.lifts.some(l => l.id !== myLiftId && l.targetFloor === floor && l.jamTimer <= 0);
    },
    getPhysicalDirection: function(lift) {
        let currentFloor = Math.round(lift.pos / Registry.floorHeight);
        if (lift.targetFloor > currentFloor) return "UP";
        if (lift.targetFloor < currentFloor) return "DOWN";
        return "IDLE";
    },
    prng: { randomFloor: () => Math.floor(seededRandom() * Config.numFloors) },
    getLiftWeight: function(lift) {
        return lift.passengers.reduce((sum, p) => sum + (p.isGymBro ? 2 : 1), 0);
    }
};

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
    { key: 'spawnR1Start', label: 'R1 Start Spawn Rate', min: 0.05, max: 2.0, step: 0.05, dispFormat: (v)=>Math.round(v*100)+'%' },
    { key: 'spawnR1End', label: 'R1 End Spawn Rate', min: 0.05, max: 2.0, step: 0.05, dispFormat: (v)=>Math.round(v*100)+'%' },
    { key: 'happySec', label: 'Happy Timeout (sec)', min: 2, max: 100, step: 1, dispFormat: (v)=>v },
    { key: 'annoyedSec', label: 'Annoyed Timeout (sec)', min: 5, max: 120, step: 1, dispFormat: (v)=>v },
    { key: 'criticalSec', label: 'Defenestrate Timeout (sec)', min: 10, max: 200, step: 1, dispFormat: (v)=>v },
    { key: 'liftCapacity', label: 'Lift Capacity', min: 1, max: 30, step: 1, dispFormat: (v)=>v },
    { key: 'liftSpeedSec', label: 'Lift Speed (sec/floor)', min: 0.1, max: 5.0, step: 0.1, dispFormat: (v)=>v.toFixed(1) },
    { key: 'boardSpeedSec', label: 'Boarding Speed (sec/person)', min: 0.1, max: 5.0, step: 0.1, dispFormat: (v)=>v.toFixed(1) }
];