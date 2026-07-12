// ============================================================================
// STATE.JS : RUNTIME GAME STATE / REGISTRY
// ============================================================================

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
    trophyCase: [],
    
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
    prng: { randomFloor: () => window.getRandomFloor() },
    getLiftWeight: function(lift) {
        return lift.passengers.reduce((sum, p) => sum + (p.isGymBro ? 2 : 1), 0);
    }
};
