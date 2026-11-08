// ============================================================================
// STATE.JS : RUNTIME GAME STATE / REGISTRY
// ============================================================================

const Registry = {
    lifts: [], floors: [],
    capsuleMode: false,
    capsuleTravelSecPerFloor: 0,
    stats: { lives: Config.startingLives, round: 1, timeLeft: Config.roundTime, served: 0, currentSpawnChance: Config.spawnR1Start, totalPointsEarned: 0 },
    
    points: 0,
    // Lifetime Credits earned in this campaign. This is score, rather than the
    // spendable balance, so using the Supply Closet never lowers a completed run.
    campaignScore: 0,
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
        transfers: 0,
        directDeliveries: 0,
        transferWaitTotalSec: 0,
        transferWaits: [],
        uncoveredPassengers: 0,
        routeRecalculations: 0,
        petConflicts: 0,
        petConflictResolutions: 0,
        petConflictEjections: 0,
        petStinkEpisodes: 0,
        petFilterChanges: 0,
        petsSpawned: 0,
        petsServed: 0,
        doubleDeckerServed: 0,
        guestsSpawned: 0,
        livesLost: 0,
        journeyTimes: [], openingCredits: 0, creditsSpent: 0
    },
    
    // Social sharing and manifest state
    pendingManifest: [],
    
    highestUnlockedRound: 1, 
    gameActive: false, pauseStartTime: 0, lastSpawnTime: 0, floorHeight: 60, 
    fallbackName: "Pilot 1", seed: 1234, campaignSeed: 1234, useCampaignSeeds: false,
    debugSeedOverride: null, debugSeedOverrideRound: null,
    debugSession: false,
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
    canLiftAcceptPet: function(lift, guest) {
        const filter = ['all', 'cats', 'dogs', 'none'].includes(lift?.petFilter) ? lift.petFilter : 'all';
        if (!guest?.petType) return true;
        if (filter === 'all') return true;
        if (filter === 'none') return false;
        return filter === `${guest.petType}s`;
    },
    canLiftServeGuest: function(lift, originFloor, destinationFloor, guest) {
        return this.canLiftAcceptPet(lift, guest) && this.canLiftDirectlyServe(lift, originFloor, destinationFloor);
    },
    isTransfersEnabled: function() {
        return Boolean(Config.GAME_DATA.rounds[Registry.stats.round]?.transfersEnabled);
    },
    findGuestRoute: function(originFloor, finalDestination, guest) {
        const direct = this.lifts.find(lift => this.canLiftServeGuest(lift, originFloor, finalDestination, guest));
        if (direct) return { legDestination: finalDestination, transferFloor: null, direct: true };
        if (!this.isTransfersEnabled() || Number(guest?.transferCount || 0) >= 1) return null;
        const candidates = [];
        for (let interchange = 0; interchange < Config.numFloors; interchange++) {
            if (interchange === originFloor || interchange === finalDestination) continue;
            const firstLeg = this.lifts.some(lift => this.canLiftServeGuest(lift, originFloor, interchange, guest));
            if (!firstLeg) continue;
            const secondLeg = this.lifts.some(lift => this.canLiftServeGuest(lift, interchange, finalDestination, guest));
            if (!secondLeg) continue;
            candidates.push({
                legDestination: interchange,
                transferFloor: interchange,
                direct: false,
                distance: Math.abs(originFloor - interchange) + Math.abs(interchange - finalDestination)
            });
        }
        candidates.sort((a, b) => a.distance - b.distance || a.transferFloor - b.transferFloor);
        return candidates[0] || null;
    },
    prepareGuestRoute: function(guest, originFloor) {
        if (!guest || guest.isVip || guest.isPartying) return true;
        const finalDestination = Number.isInteger(guest.finalDestination) ? guest.finalDestination : guest.dest;
        const previousLeg = guest.dest;
        const previousTransfer = guest.transferFloor;
        const hadPreparedRoute = Boolean(guest.routePrepared);
        guest.finalDestination = finalDestination;
        if (Number(guest.transferCount || 0) >= 1) {
            guest.dest = finalDestination;
            const covered = this.lifts.some(lift => this.canLiftServeGuest(lift, originFloor, finalDestination, guest));
            guest.routePrepared = covered;
            if (!covered && !guest.routeUncovered) Registry.roundStats.uncoveredPassengers++;
            guest.routeUncovered = !covered;
            return covered;
        }
        const currentRouteValid = Number.isInteger(guest.transferFloor) && guest.dest === guest.transferFloor &&
            this.lifts.some(lift => this.canLiftServeGuest(lift, originFloor, guest.transferFloor, guest)) &&
            this.lifts.some(lift => this.canLiftServeGuest(lift, guest.transferFloor, finalDestination, guest));
        if (currentRouteValid) return true;
        const route = this.findGuestRoute(originFloor, finalDestination, guest);
        if (!route) {
            if (!guest.routeUncovered) Registry.roundStats.uncoveredPassengers++;
            guest.routeUncovered = true;
            guest.routePrepared = false;
            return false;
        }
        guest.dest = route.legDestination;
        guest.transferFloor = route.transferFloor;
        guest.routePrepared = true;
        guest.routeUncovered = false;
        if (hadPreparedRoute && (previousLeg !== guest.dest || previousTransfer !== guest.transferFloor)) {
            Registry.roundStats.routeRecalculations++;
        }
        return true;
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
        const zoneCovers = (zone, origin, destination) => zone.valid &&
            origin >= zone.lower && origin <= zone.upper && destination >= zone.lower && destination <= zone.upper;
        floors.forEach(origin => floors.forEach(destination => {
            const direct = zones.some(zone => zoneCovers(zone, origin, destination));
            const transfer = this.isTransfersEnabled() && floors.some(interchange =>
                interchange !== origin && interchange !== destination &&
                zones.some(zone => zoneCovers(zone, origin, interchange)) &&
                zones.some(zone => zoneCovers(zone, interchange, destination)));
            if (!direct && !transfer) {
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
    isLiftStinky: function(lift) {
        if (!lift) return false;
        const immune = lift.freshenerTimer > 0 ||
            (typeof PowerUps !== 'undefined' && PowerUps.timers.stinkImmunity > 0);
        if (immune) return false;
        const gymStink = window.isRoundEventEnabled?.(Config.GAME_DATA.rounds[Registry.stats.round], 'gym') &&
            window.isRoundEventEnabled?.(Config.GAME_DATA.rounds[Registry.stats.round], 'stink') &&
            lift.passengers.filter(passenger => passenger.isGymBro).length >= Number(Config.gymBroStinkThreshold || 3);
        const petStink = window.isRoundEventEnabled?.(Config.GAME_DATA.rounds[Registry.stats.round], 'pets') &&
            lift.passengers.filter(passenger => passenger.petType).length >= Number(Config.petStinkThreshold || 5);
        return Boolean(lift.stinkTimer > 0 || gymStink || petStink);
    },
    findSweepTarget: function(lift, dir, priorityOnly = false, includeCurrentFloor = false) {
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

        // Once a passenger is aboard, delivering that passenger outranks new
        // pickup demand. This is especially important for a VIP after a
        // rooftop release: waiting rooftop traffic must not strand her car.
        const onboardVip = lift.passengers.find(passenger => passenger.isVip);
        if (onboardVip && Number.isInteger(onboardVip.dest)) return onboardVip.dest;

        const existingOutsideZone = lift.passengers.find(passenger => !this.isFloorInLiftZone(lift, passenger.dest));
        if (existingOutsideZone) return existingOutsideZone.dest;

        for (let f = 0; f <= maxF; f++) {
            if (!this.isFloorInLiftZone(lift, f)) continue;
            let score = 0;
            lift.passengers.forEach(p => { if (p.dest === f) score += 1000 + getVal(p); });
            if (Registry.getLiftWeight(lift) < maxCap && (!isStinky || hasStinkImmunity)) {
                Registry.floors[f].waitingGuests.forEach(g => {
                    // VIP dispatch remains a player-observed/intervention
                    // mechanic. Policies may serve ordinary waiting traffic,
                    // but never silently dispatch for a waiting VIP.
                    if (g.isVip) return;
                    if ((!isStinky || g.isGymBro) && window.canGuestBoardLift(lift, g, f, isStinky, maxCap)) score += getVal(g);
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
