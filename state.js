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
        return lift.passengers.reduce((sum, p) => sum + (p.boardingWeight || (p.isGymBro ? 2 : 1)), 0);
    },
    findSweepTarget: function(lift, dir, priorityOnly = false) {
        let currentFloor = Math.round(lift.pos / Registry.floorHeight);
        let maxCap = (typeof PowerUps !== 'undefined') ? PowerUps.getLiftCapacity(lift.id) : (Config.liftCapacity || 10);
        let isStinky = lift.stinkTimer > 0;
        let hasStinkImmunity = lift.freshenerTimer > 0 || (typeof PowerUps !== 'undefined' && PowerUps.timers.stinkImmunity > 0);

        for (let checkF = currentFloor + dir; checkF >= 0 && checkF < Config.numFloors; checkF += dir) {
            // Dropoff check: passengers always want to get off
            if (lift.passengers.some(p => p.dest === checkF)) return checkF;
            
            // Pickup check: stop if we have room and there is a valid guest
            if (Registry.getLiftWeight(lift) < maxCap && (!isStinky || hasStinkImmunity)) {
                const hasStopReason = Registry.floors[checkF].waitingGuests.some(g => {
                    if (isStinky && !g.isGymBro) return false;
                    if (lift.passengers.some(p => p.isVip)) return false; 
                    if (g.isVip && lift.passengers.length > 0) return false;
                    
                    if (priorityOnly) {
                        return (g.status === 'critical' || g.status === 'annoyed');
                    }
                    return true; // Simple sweep: stops for any guest
                });
                if (hasStopReason) return checkF;
            }
        }
        return -1;
    },
    getBestFloor: function(lift, weighted) {
        let bestFloors = [];
        let maxScore = -1;
        let currentFloor = Math.round(lift.pos / Registry.floorHeight);
        let maxCap = (typeof PowerUps !== 'undefined') ? PowerUps.getLiftCapacity(lift.id) : (Config.liftCapacity || 10);
        let isStinky = lift.stinkTimer > 0;
        let hasStinkImmunity = lift.freshenerTimer > 0 || (typeof PowerUps !== 'undefined' && PowerUps.timers.stinkImmunity > 0);
        
        const getVal = (g) => {
            if (g.status === 'rage') return 0;
            if (weighted) {
                if (g.status === 'critical') return 10;
                if (g.status === 'annoyed') return 3;
            }
            return 1;
        };

        for (let f = 0; f < Config.numFloors; f++) {
            let score = 0;
            lift.passengers.forEach(p => { if (p.dest === f) score += getVal(p); });
            if (Registry.getLiftWeight(lift) < maxCap && (!isStinky || hasStinkImmunity)) {
                Registry.floors[f].waitingGuests.forEach(g => {
                    if (!isStinky || g.isGymBro) score += getVal(g);
                });
            }
            if (score > maxScore && score > 0) { maxScore = score; bestFloors = [f]; }
            else if (score === maxScore && score > 0) { bestFloors.push(f); }
        }

        if (bestFloors.length === 0) return -1;
        // Return closest
        return bestFloors.reduce((a, b) => Math.abs(a - currentFloor) < Math.abs(b - currentFloor) ? a : b);
    }
};

window.Registry = Registry;
