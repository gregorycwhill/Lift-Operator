// ============================================================================
// STATE.JS : RUNTIME GAME STATE / REGISTRY
// ============================================================================

const Registry = {
    lifts: [], floors: [],
    capsuleMode: false,
    capsuleTravelSecPerFloor: 0,
    stats: { lives: Config.startingLives, round: 1, timeLeft: Config.roundTime, served: 0, currentSpawnChance: Config.spawnR1Start, totalPointsEarned: 0 },
    
    points: 0,
    inventory: [],
    
    // Round telemetry and review state
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
        totalWaitTimeServed: 0,
        lateralTransfers: 0,
        doubleDeckerServed: 0,
        guestsSpawned: 0,
        livesLost: 0,
        journeyTimes: []
    },
    
    // Social sharing and manifest state
    pendingManifest: [],
    
    highestUnlockedRound: 1, 
    gameActive: false, pauseStartTime: 0, lastSpawnTime: 0, floorHeight: 60, 
    fallbackName: "Pilot 1", seed: 1234, campaignSeed: 1234, useCampaignSeeds: false,
    debugSeedOverride: null, debugSeedOverrideRound: null,
    guestSequence: 0,
    
    // Auto-Pilot & Regression Telemetry
    autoPilotActive: false,
    monkeyCapability: false,
    monkeySettings: null,
    agentSeed: 0,
    manualIntervention: false,
    lastAutoDecisionTime: 0,
    roundTerminalHandled: false,
    roundCountdownActive: false, roundCountdownPaused: false,
    roundCountdownTimer: null,
    roundEvaluation: null,
    pendingFailedRetry: null,
    roundCheckpoint: null,
    promotionAcknowledgements: [],
    enduranceSeconds: 0,
    customScriptTicks: 0,
    lastLobbyRenderTime: 0,
    automationControllerSelectedPolicy: 'manual',
    automationControllerPreviewPolicy: 'manual',
    
    vipSpawned: false, vipTargetTime: 0, vipStage: 0, vipRoomFloor: -1, vipRandomFloor: -1,
    sunsetHasHappened: false, sunsetTargetTime: 0, sunsetActive: false, sunsetEndTime: 0, sunsetWarningShown: false,
    gymFloor: -1,

    getNearestTarget: function(lift, targetType) {
        let bestFloor = -1;
        let minDist = Infinity;
        let currentFloor = Math.round(lift.pos / Registry.floorHeight);
        
        for (let f = 0; f < Config.numFloors; f++) {
            if (!this.isFloorInLiftZone(lift, f)) continue;
            let hasTarget = false;
            if (targetType === 'destination') hasTarget = lift.passengers.some(p => p.dest === f);
            else if (targetType === 'any_waiting') hasTarget = Registry.floors[f].waitingGuests.some(g => this.canLiftDirectlyServe(lift, f, g.dest));
            else hasTarget = Registry.floors[f].waitingGuests.some(g => this.canLiftDirectlyServe(lift, f, g.dest) && (g.status === targetType || (targetType === 'vip' && g.isVip)));
            
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
    isZoningEnabled: function() {
        return Boolean(Config.GAME_DATA.rounds[Registry.stats.round]?.zoningEnabled);
    },
    isFloorInLiftZone: function(lift, floor) {
        if (!this.isZoningEnabled()) return floor >= 0 && floor < Config.numFloors;
        if (floor === 0) return true;
        const lower = Number.isInteger(lift?.serviceLower) ? lift.serviceLower : 0;
        const upper = Number.isInteger(lift?.serviceUpper) ? lift.serviceUpper : Config.numFloors - 1;
        return floor >= lower && floor <= upper && floor >= 0 && floor < Config.numFloors;
    },
    canLiftDirectlyServe: function(lift, originFloor, destinationFloor) {
        if (!this.isZoningEnabled()) return true;
        return this.isFloorInLiftZone(lift, originFloor) && this.isFloorInLiftZone(lift, destinationFloor);
    },
    validateServiceRange: function(lower, upper, floorCount = Config.numFloors) {
        const lowerText = String(lower ?? '').trim();
        const upperText = String(upper ?? '').trim();
        const parsedLower = Number(lower);
        const parsedUpper = Number(upper);
        const maxFloor = Math.max(0, Number(floorCount) - 1);
        return {
            valid: lowerText !== '' && upperText !== '' && Number.isInteger(parsedLower) && Number.isInteger(parsedUpper) &&
                parsedLower >= 0 && parsedUpper >= 0 && parsedLower <= parsedUpper &&
                parsedUpper <= maxFloor,
            lower: Number.isInteger(parsedLower) ? Math.max(0, Math.min(maxFloor, parsedLower)) : 0,
            upper: Number.isInteger(parsedUpper) ? Math.max(0, Math.min(maxFloor, parsedUpper)) : maxFloor,
            maxFloor
        };
    },
    getServiceZoneReport: function(floorCount = Config.numFloors) {
        const maxFloor = Math.max(0, Number(floorCount) - 1);
        const floors = Array.from({ length: maxFloor + 1 }, (_, floor) => floor);
        const zones = Registry.lifts.map(lift => {
            const range = this.validateServiceRange(lift.serviceLower, lift.serviceUpper, floorCount);
            return {
                liftId: lift.id,
                policyId: lift.servicePolicy?.id || null,
                policyVersion: lift.servicePolicy?.version || null,
                policyMode: lift.servicePolicy?.mode || 'none',
                lower: range.lower,
                upper: range.upper,
                valid: range.valid
            };
        });
        const coverage = floors.map(floor => zones.filter(zone => zone.valid && floor >= zone.lower && floor <= zone.upper).length);
        const uncoveredFloors = floors.filter(floor => coverage[floor] === 0);
        const overlapFloors = floors.filter(floor => coverage[floor] > 1);
        const uncoveredRoutes = [];
        floors.forEach(origin => floors.forEach(destination => {
            if (!zones.some(zone => zone.valid && origin >= zone.lower && origin <= zone.upper && destination >= zone.lower && destination <= zone.upper)) {
                uncoveredRoutes.push([origin, destination]);
            }
        }));
        return {
            enabled: this.isZoningEnabled(),
            floorCount,
            zones,
            coverage,
            uncoveredFloors,
            overlapFloors,
            uncoveredRoutes,
            configuration: zones.map(zone => [zone.lower, zone.upper])
        };
    },
    isFloorClaimedByOther: function(floor, myLiftId) {
        return Registry.lifts.some(l => l.id !== myLiftId && l.targetFloor === floor && l.jamTimer <= 0 && this.isFloorInLiftZone(l, floor));
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
    getCounterweightPolicyRank: function(policy) {
        if (String(policy || '').startsWith('custom_')) return 6;
        return ({ 'priority-voting': 5, 'weighted-voting': 5, 'priority-sweep': 4, 'zoned-low': 3, 'zoned-high': 3, voting: 2, sweep: 1 })[policy] || 0;
    },
    getCounterweightPolicyDriver: function(lift) {
        if (!Registry.counterweightEnabled || !Number.isInteger(lift?.counterweightPartner)) return lift;
        const partner = Registry.lifts[lift.counterweightPartner];
        if (!partner) return lift;
        const liftRank = this.getCounterweightPolicyRank(lift.automation);
        const partnerRank = this.getCounterweightPolicyRank(partner.automation);
        if (partnerRank > liftRank || (partnerRank === liftRank && partner.id < lift.id)) return partner;
        return lift;
    },
    isCounterweightPolicy: function(lift) {
        return Boolean(Registry.counterweightEnabled && lift && this.getCounterweightPolicyRank(lift.automation) > 0);
    },
    getCounterweightPairTarget: function(lift, dir = 1, priorityOnly = false, weighted = false, includeCurrentFloor = false) {
        if (!this.isCounterweightPolicy(lift)) return -1;
        const driver = this.getCounterweightPolicyDriver(lift);
        const partner = Registry.lifts[driver.counterweightPartner];
        if (!partner) return -1;
        const maxFloor = Math.max(0, Config.numFloors - 1);
        const current = Math.round(driver.pos / Registry.floorHeight);
        const partnerCurrent = Math.round(partner.pos / Registry.floorHeight);
        const direction = driver.sweepDirection || dir || 1;
        const scoreAt = (targetLift, floor) => {
            let score = targetLift.passengers.filter(passenger => passenger.dest === floor).length * 10;
            const capacity = typeof PowerUps !== 'undefined' ? PowerUps.getLiftCapacity(targetLift.id) : Config.liftCapacity;
            const isStinky = this.isLiftStinky(targetLift);
            if (this.getLiftWeight(targetLift) < capacity) {
                Registry.floors[floor]?.waitingGuests.forEach(guest => {
                    if (priorityOnly && guest.status !== 'critical' && guest.status !== 'annoyed') return;
                    if (typeof window.canGuestBoardLift === 'function' && window.canGuestBoardLift(targetLift, guest, floor, isStinky, capacity)) {
                        score += weighted && guest.status === 'critical' ? 10 : (guest.status === 'annoyed' ? 3 : 1);
                    }
                });
            }
            return score;
        };
        let best = -1;
        let bestScore = 0;
        for (let target = 0; target <= maxFloor; target++) {
            if (target !== current && (direction > 0 ? target < current : target > current)) continue;
            if (target === current && !includeCurrentFloor) continue;
            const partnerTarget = maxFloor - target;
            if (!this.isFloorInLiftZone(driver, target) || !this.isFloorInLiftZone(partner, partnerTarget)) continue;
            const score = scoreAt(driver, target) + scoreAt(partner, partnerTarget);
            if (score > bestScore || (score === bestScore && score > 0 && (best < 0 || Math.abs(target - current) < Math.abs(best - current)))) {
                best = target;
                bestScore = score;
            }
        }
        if (best < 0) return -1;
        return lift.id === driver.id ? best : maxFloor - best;
    },
    isLiftStinky: function(lift) {
        if (!lift) return false;
        const immune = lift.freshenerTimer > 0 ||
            (typeof PowerUps !== 'undefined' && PowerUps.timers.stinkImmunity > 0);
        if (immune) return false;
        const gymStink = window.isRoundEventEnabled?.(Config.GAME_DATA.rounds[Registry.stats.round], 'gym') &&
            window.isRoundEventEnabled?.(Config.GAME_DATA.rounds[Registry.stats.round], 'stink') &&
            lift.passengers.filter(passenger => passenger.isGymBro).length >= Number(Config.gymBroStinkThreshold || 3);
        return Boolean(lift.stinkTimer > 0 || gymStink);
    },
    findSweepTarget: function(lift, dir, priorityOnly = false, includeCurrentFloor = false) {
        if (this.isCounterweightPolicy(lift)) {
            const pairTarget = this.getCounterweightPairTarget(lift, dir, priorityOnly, false, includeCurrentFloor);
            if (pairTarget >= 0) return pairTarget;
        }
        let currentFloor = Math.round(lift.pos / Registry.floorHeight);
        let maxCap = (typeof PowerUps !== 'undefined') ? PowerUps.getLiftCapacity(lift.id) : (Config.liftCapacity || 10);
        let isStinky = this.isLiftStinky(lift);
        let hasStinkImmunity = lift.freshenerTimer > 0 || (typeof PowerUps !== 'undefined' && PowerUps.timers.stinkImmunity > 0);
        const isDouble = (lift.isDoubleDecker || lift.doubleDeckerTimer > 0);
        const maxF = isDouble ? Config.numFloors - 2 : Config.numFloors - 1;

        const existingOutsideZone = lift.passengers.find(passenger => !this.isFloorInLiftZone(lift, passenger.dest));
        if (existingOutsideZone) return existingOutsideZone.dest;

        const firstFloor = includeCurrentFloor ? currentFloor : currentFloor + dir;
        for (let checkF = firstFloor; checkF >= 0 && checkF <= maxF; checkF += dir) {
            if (!this.isFloorInLiftZone(lift, checkF)) continue;
            // Dropoff check: passengers always want to get off
            // Existing passengers must still be delivered if a new Zoned policy
            // is assigned while they are onboard. The zone gates new boarding;
            // it does not strand an already accepted journey.
            if (lift.passengers.some(p => p.dest === checkF)) return checkF;
            
            // Pickup check: stop if we have room and there is a valid guest
            if (Registry.getLiftWeight(lift) < maxCap && (!isStinky || hasStinkImmunity)) {
                const hasStopReason = Registry.floors[checkF].waitingGuests.some(g => {
                    if (priorityOnly && g.status !== 'critical' && g.status !== 'annoyed') return false;
                    if (typeof window.canGuestBoardLift === 'function') {
                        return window.canGuestBoardLift(lift, g, checkF, isStinky, maxCap);
                    }
                    return this.canLiftDirectlyServe(lift, checkF, g.dest);
                });
                if (hasStopReason) return checkF;
            }
        }
        return -1;
    },
    getBestFloor: function(lift, weighted) {
        if (this.isCounterweightPolicy(lift)) {
            const pairTarget = this.getCounterweightPairTarget(lift, lift.sweepDirection || 1, false, Boolean(weighted), false);
            if (pairTarget >= 0) return pairTarget;
        }
        let bestFloors = [];
        let maxScore = -1;
        let currentFloor = Math.round(lift.pos / Registry.floorHeight);
        let maxCap = (typeof PowerUps !== 'undefined') ? PowerUps.getLiftCapacity(lift.id) : (Config.liftCapacity || 10);
        let isStinky = this.isLiftStinky(lift);
        let hasStinkImmunity = lift.freshenerTimer > 0 || (typeof PowerUps !== 'undefined' && PowerUps.timers.stinkImmunity > 0);
        
        const getVal = (g) => {
            if (g.status === 'rage') return 0;
            if (weighted) {
                if (g.status === 'critical') return 10;
                if (g.status === 'annoyed') return 3;
            }
            return 1;
        };

        const isDouble = (lift.isDoubleDecker || lift.doubleDeckerTimer > 0);
        const maxF = isDouble ? Config.numFloors - 2 : Config.numFloors - 1;

        const existingOutsideZone = lift.passengers.find(passenger => !this.isFloorInLiftZone(lift, passenger.dest));
        if (existingOutsideZone) return existingOutsideZone.dest;

        for (let f = 0; f <= maxF; f++) {
            if (!this.isFloorInLiftZone(lift, f)) continue;
            let score = 0;
            lift.passengers.forEach(p => { if (p.dest === f) score += getVal(p); });
            if (Registry.getLiftWeight(lift) < maxCap && (!isStinky || hasStinkImmunity)) {
                Registry.floors[f].waitingGuests.forEach(g => {
                    if ((!isStinky || g.isGymBro) && this.canLiftDirectlyServe(lift, f, g.dest)) score += getVal(g);
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
