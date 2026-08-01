// ============================================================================
// ENGINE-SIMULATOR.JS : ISOLATED HEADLESS PHYSICS RUNNER
// ============================================================================

window.Game = window.Game || {};

window.Game.Simulator = {
    /**
     * Runs a simulation in a disposable same-origin browser realm.
     * The iframe owns its own Registry, Config mutations, timers, and random stream.
     */
    runRound: async function(seed, scripts = {}, round = 1, options = {}) {
        const frame = document.createElement('iframe');
        frame.hidden = true;
        frame.setAttribute('aria-hidden', 'true');
        // Each run needs a genuinely fresh browsing realm. Reusing the exact
        // iframe URL lets browser cache/lifecycle optimisation leak page state
        // between nominally isolated acceptance runs. The sequence is only a
        // cache-busting realm identity; it never enters gameplay RNG.
        const realmSequence = (window.Game.Simulator._realmSequence || 0) + 1;
        window.Game.Simulator._realmSequence = realmSequence;
        frame.src = `${window.location.pathname}?simulation=true&realm=${realmSequence}`;
        document.body.appendChild(frame);

        try {
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Simulation realm failed to load.')), 10000);
                frame.onload = () => {
                    clearTimeout(timeout);
                    resolve();
                };
                frame.onerror = () => {
                    clearTimeout(timeout);
                    reject(new Error('Simulation realm failed to load.'));
                };
            });

            const simulator = frame.contentWindow &&
                frame.contentWindow.Game &&
                frame.contentWindow.Game.Simulator;
            if (!simulator || typeof simulator.runRoundLocal !== 'function') {
                throw new Error('Simulation realm did not initialize.');
            }

            return await simulator.runRoundLocal(seed, scripts, round, options);
        } catch (error) {
            console.error('[Simulator] Fatal Error:', error);
            return { error: error.message, success: false };
        } finally {
            frame.remove();
        }
    },

    /**
     * Internal worker used only inside the disposable simulation realm.
     */
    runRoundLocal: async function(seed, scripts = {}, round = 1, options = {}) {
        console.log(`[Simulator] Starting isolated run for Round ${round} (Seed: ${seed})`);

        const virtualStart = 1000000;
        // Some shared helpers legitimately fall back to Date.now() outside
        // the physics path. Pin that fallback to the virtual clock too so a
        // fixed-seed run cannot acquire wall-clock variation.
        Date.now = () => window.Game.virtualTime || virtualStart;
        const trace = options.trace ? [] : null;
        const traceEvent = (type, payload = {}) => {
            if (!trace) return;
            trace.push({ second: Number((window.Game.virtualTime - 1000000) / 1000).toFixed(3), type, ...payload });
        };

        window.Game.UI = {
            buildWorld: () => {},
            updateScoreboardUI: () => {},
            draw: () => {},
            showRoundModal: () => {},
            showRoundReview: () => {},
            updateLocksUI: () => {},
            showLeaderboard: () => {},
            updateLiftVisualState: () => {},
            updateLiftAutomationUI: () => {},
            triggerDefenestration: () => {}
        };
        window.Game.Audio = { play: () => {}, publish: (type, payload) => traceEvent(`audio:${type}`, payload), setPsi: () => {}, setContext: () => {} };

        Registry.autoPilotActive = false;
        Registry.seed = seed;
        if (options.roundOverrides) {
            Config.GAME_DATA.rounds[round] = {
                ...Config.GAME_DATA.rounds[round],
                ...options.roundOverrides
            };
        }
        window.Game.virtualTime = virtualStart;
        window.initializeRound(round, {
            now: virtualStart,
            showBriefing: false
        });
        if (trace && window.Game.BalanceTelemetry?.recordLifeLoss) {
            const recordLifeLoss = window.Game.BalanceTelemetry.recordLifeLoss.bind(window.Game.BalanceTelemetry);
            window.Game.BalanceTelemetry.recordLifeLoss = (now, count, cause) => {
                traceEvent('life-loss', { count, cause, livesRemaining: Registry.stats.lives });
                return recordLifeLoss(now, count, cause);
            };
        }

        Object.keys(scripts).forEach(liftIndex => {
            if (Registry.lifts[liftIndex]) {
                window.setLiftAutomation(liftIndex, scripts[liftIndex]);
                traceEvent('automation', { lift: Number(liftIndex), mode: scripts[liftIndex] });
            }
        });
        if (Array.isArray(options.loadout)) {
            PowerUps.inventory = options.loadout.map(item => ({ ...item }));
        }

        Registry.gameActive = true;
        let virtualTime = virtualStart;
        const objective = Config.GAME_DATA.rounds[round].objective;
        // Acceptance runs may impose a bounded observation window (not a
        // gameplay rule) so endurance evidence can distinguish “survives the
        // required window” from an unbounded simulator run.
        const totalSeconds = Number.isFinite(options.maxSeconds)
            ? options.maxSeconds
            : objective === 'ENDURANCE' ? 1800 : Config.roundTime;
        const animationStepMs = 1000 / 60;
        let elapsedSeconds = 0;
        let lastInterventionSecond = -Infinity;
        let manualInterventions = 0;

        const dispatchTarget = (liftId, targetFloor, source = 'strategy') => {
            const lift = Registry.lifts[liftId];
            if (!lift) {
                traceEvent('target-rejected', { lift: liftId, target: targetFloor, source, reason: 'missing-lift' });
                return false;
            }
            const beforeRevision = lift.commandRevision || 0;
            const beforeTarget = lift.targetFloor;
            window.setLiftTarget(liftId, targetFloor);
            const accepted = (lift.commandRevision || 0) > beforeRevision || lift.targetFloor !== beforeTarget;
            traceEvent(accepted ? 'target-accepted' : 'target-rejected', {
                lift: liftId,
                target: targetFloor,
                source,
                reason: accepted ? undefined : (Registry.isFloorInLiftZone?.(lift, targetFloor) === false ? 'outside-zone' : 'engine-rejected')
            });
            return accepted;
        };

        const primeAbility = (id, tier) => {
            traceEvent('power-up', { id, tier });
            return PowerUps.primeAbility(id, tier);
        };

        const summarizeTrace = events => {
            const lifts = {};
            const ensureLift = id => lifts[id] || (lifts[id] = {
                boarded: 0, served: 0, refused: 0, maxLoad: 0, load: 0,
                arrivals: 0, firstArrivalSecond: null, lastArrivalSecond: null,
                maxPassengers: 0, passengerSamples: 0, passengerTotal: 0
            });
            events.forEach(event => {
                if (event.type === 'lift-state') {
                    event.lifts.forEach(state => {
                        const lift = ensureLift(state.id);
                        lift.maxPassengers = Math.max(lift.maxPassengers, state.passengers);
                        lift.passengerSamples += 1;
                        lift.passengerTotal += state.passengers;
                    });
                    return;
                }
                const liftId = event.liftId ?? event.lift;
                if (liftId === undefined) return;
                const lift = ensureLift(liftId);
                if (event.type === 'audio:guest_boarded') {
                    lift.boarded += 1;
                    lift.load += 1;
                    lift.maxLoad = Math.max(lift.maxLoad, lift.load);
                } else if (event.type === 'audio:guest_served') {
                    lift.served += 1;
                    lift.load = Math.max(0, lift.load - 1);
                } else if (event.type === 'audio:guest_refused') {
                    lift.refused += 1;
                } else if (event.type === 'audio:lift_arrived') {
                    lift.arrivals += 1;
                    const second = Number(event.second);
                    if (lift.firstArrivalSecond === null) lift.firstArrivalSecond = second;
                    lift.lastArrivalSecond = second;
                }
            });
            const count = type => events.filter(event => event.type === type).length;
            const refusals = events.filter(event => event.type === 'audio:guest_refused');
            const refusalReasons = refusals.reduce((result, event) => {
                Object.entries(event.rejectionReasons || {}).forEach(([reason, value]) => {
                    result[reason] = (result[reason] || 0) + value;
                });
                return result;
            }, {});
            return {
                lifts,
                totals: {
                    boardings: count('audio:guest_boarded'),
                    served: count('audio:guest_served'),
                    refusals: count('audio:guest_refused'),
                    refusalCauses: {
                        capacity: refusals.filter(event => event.passengers >= event.capacity).length,
                        jammed: refusals.filter(event => event.jammed).length,
                        stinky: refusals.filter(event => event.stinky).length,
                        directionOrCompatibility: refusals.filter(event => event.passengers < event.capacity && !event.jammed && !event.stinky).length,
                        byReason: refusalReasons
                    },
                    arrivals: count('audio:lift_arrived'),
                    acceptedTargets: count('target-accepted'),
                    rejectedTargets: count('target-rejected'),
                    lifeLosses: events.filter(event => event.type === 'life-loss').reduce((sum, event) => sum + event.count, 0),
                    lifeLossCauses: events.filter(event => event.type === 'life-loss').reduce((result, event) => {
                        const cause = event.cause || 'unclassified';
                        result[cause] = (result[cause] || 0) + event.count;
                        return result;
                    }, {}),
                    powerUps: count('power-up')
                }
            };
        };

        const runStrategyController = second => {
            if (!options.strategy || options.strategy.startsWith('all-')) return;
            const interval = options.interventionIntervalSec || 20;

            if (options.strategy === 'idealized-dispatch') {
                const claimedFloors = new Set();
                Registry.lifts.forEach(lift => {
                    const currentFloor = Math.round(lift.pos / Registry.floorHeight);
                    // A passenger destination always outranks the previous
                    // pickup claim. The old comparator left the car heading
                    // back to its pickup floor after boarding, which made the
                    // “idealized” feasibility profile materially less capable
                    // than a competent operator.
                    if (lift.passengers.length > 0) {
                        const passengerTarget = [...lift.passengers].sort((a, b) =>
                            (virtualTime - b.spawnTime) - (virtualTime - a.spawnTime) ||
                            Math.abs(a.dest - currentFloor) - Math.abs(b.dest - currentFloor)
                        )[0].dest;
                        dispatchTarget(lift.id, passengerTarget, 'passenger-destination');
                        claimedFloors.add(passengerTarget);
                        return;
                    }
                    const isAtTarget = Math.abs(lift.pos - lift.targetFloor * Registry.floorHeight) < 0.01;
                    if (!isAtTarget || (lift.state !== 'IDLE' && lift.state !== 'DONE')) {
                        claimedFloors.add(lift.targetFloor);
                        return;
                    }

                    let targetFloor;
                    const target = Registry.floors.map((floor, floorIndex) => {
                        const critical = floor.waitingGuests.filter(guest => guest.status === GuestStatus.CRITICAL).length;
                        const annoyed = floor.waitingGuests.filter(guest => guest.status === GuestStatus.ANNOYED).length;
                        const oldestWaitMs = floor.waitingGuests.reduce(
                            (maximum, guest) => Math.max(maximum, virtualTime - guest.spawnTime),
                            0
                        );
                        return {
                            floorIndex,
                            count: floor.waitingGuests.length,
                            score: critical * 100000 + annoyed * 10000 + oldestWaitMs + floor.waitingGuests.length * 100 - Math.abs(floorIndex - currentFloor)
                        };
                    }).filter(candidate => candidate.count > 0 && !claimedFloors.has(candidate.floorIndex))
                        .sort((a, b) => b.score - a.score)[0];
                    targetFloor = target && target.floorIndex;

                    if (Number.isInteger(targetFloor)) {
                        // Use the production command path so counterweight partner
                        // consequences and target clamping are exercised by the
                        // idealized comparator too.
                        dispatchTarget(lift.id, targetFloor, 'queue-selection');
                        claimedFloors.add(targetFloor);
                    }
                });
                return;
            }

            if (['event-aware', 'zoned-dispatch', 'counterweight-dispatch'].includes(options.strategy)) {
                const interval = options.interventionIntervalSec || 12;
                if (second - lastInterventionSecond < interval) return;
                if (Number.isFinite(options.manualTargetLimit) && manualInterventions >= options.manualTargetLimit) return;

                const roundDefinition = Config.GAME_DATA.rounds[round] || {};
                const isActionable = guest => !(Registry.sunsetActive && guest.isPartying);
                const floorCandidates = Registry.floors.map((floor, floorIndex) => {
                    const guests = floor.waitingGuests.filter(isActionable);
                    const vip = guests.filter(guest => guest.isVip).length;
                    const critical = guests.filter(guest => guest.status === GuestStatus.CRITICAL).length;
                    const annoyed = guests.filter(guest => guest.status === GuestStatus.ANNOYED).length;
                    const oldestWaitMs = guests.reduce(
                        (maximum, guest) => Math.max(maximum, virtualTime - guest.spawnTime),
                        0
                    );
                    // G is intentionally the preferred return/pick-up hub once
                    // zoning opens, matching the authored three-times weighting.
                    const groundWeight = roundDefinition.zoningEnabled && floorIndex === 0 ? 3 : 1;
                    return {
                        floorIndex,
                        guests,
                        score: (vip * 10000000 + critical * 100000 + annoyed * 10000 + oldestWaitMs + guests.length * 250) * groundWeight
                    };
                }).filter(candidate => candidate.guests.length > 0)
                    .sort((a, b) => b.score - a.score);

                const criticalCount = floorCandidates.reduce((sum, candidate) => sum + candidate.guests.filter(guest => guest.status === GuestStatus.CRITICAL).length, 0);
                const peakQueue = Math.max(0, ...floorCandidates.map(candidate => candidate.guests.length));
                const vipWaiting = floorCandidates.some(candidate => candidate.guests.some(guest => guest.isVip));
                const jammedLift = Registry.lifts.find(lift => lift.jamTimer > 0);
                const stinkyLift = Registry.lifts.find(lift => lift.stinkTimer > 0);
                const reserveLift = options.strategy === 'event-aware'
                    ? Registry.lifts.find(lift => lift.automation === 'manual')
                    : null;
                if (reserveLift?.passengers.length && !reserveLift.manualOverride) {
                    const currentFloor = Math.round(reserveLift.pos / Registry.floorHeight);
                    const destination = [...reserveLift.passengers].sort((a, b) =>
                        Math.abs(a.dest - currentFloor) - Math.abs(b.dest - currentFloor)
                    )[0].dest;
                    if (dispatchTarget(reserveLift.id, destination, 'event-aware-passenger')) manualInterventions++;
                    lastInterventionSecond = second;
                    return;
                }
                // Do not burn the bounded intervention budget on routine
                // traffic. The profile becomes active for an event, a VIP, or
                // visible queue/anger pressure only.
                if (!vipWaiting && criticalCount === 0 && peakQueue < 8 && !jammedLift && !stinkyLift) return;

                const chooseIdleLift = (targetFloor, requirePair = false) => Registry.lifts
                    .filter(lift => lift.passengers.length === 0 && lift.jamTimer <= 0 && !lift.manualOverride)
                    // A competent player can redirect an empty car that is
                    // already travelling. Do not wait for it to become idle,
                    // but never steal a car that is boarding or carrying a
                    // guest to their destination.
                    .filter(lift => lift.state !== 'BOARDING')
                    .filter(lift => {
                        if (!requirePair) return true;
                        const partner = Registry.lifts[lift.counterweightPartner];
                        return partner && partner.passengers.length === 0 && partner.jamTimer <= 0 && partner.state !== 'BOARDING';
                    })
                    .sort((a, b) => {
                        const aDistance = Math.abs(Math.round(a.pos / Registry.floorHeight) - targetFloor);
                        const bDistance = Math.abs(Math.round(b.pos / Registry.floorHeight) - targetFloor);
                        return aDistance - bDistance || a.id - b.id;
                    })[0];

                const target = floorCandidates[0];
                let selectedLift;
                if (target) {
                    if (options.strategy === 'zoned-dispatch') {
                        const zonedLift = Registry.lifts
                            .filter(lift => Registry.isFloorInLiftZone?.(lift, target.floorIndex))
                            .filter(lift => lift.passengers.length === 0 && lift.jamTimer <= 0 && !lift.manualOverride)
                            .filter(lift => lift.state !== 'BOARDING')
                            .sort((a, b) => Math.abs(Math.round(a.pos / Registry.floorHeight) - target.floorIndex) - Math.abs(Math.round(b.pos / Registry.floorHeight) - target.floorIndex))[0];
                        selectedLift = zonedLift || chooseIdleLift(target.floorIndex);
                    } else {
                        selectedLift = chooseIdleLift(target.floorIndex, options.strategy === 'counterweight-dispatch');
                    }
                }

                const findItem = ids => PowerUps.inventory.find(candidate => ids.includes(candidate.id));
                const item =
                    (jammedLift && findItem(['wrench'])) ||
                    (stinkyLift && findItem(['freshener'])) ||
                    (criticalCount >= 2 && findItem(['musak'])) ||
                    (peakQueue >= 8 && findItem(['doors', 'tardis', 'doubleDecker'])) ||
                    (options.strategy === 'counterweight-dispatch' && selectedLift && peakQueue >= 5 && findItem(['openPlan'])) ||
                    null;
                if (item) {
                    const ability = PowerUps.catalog[item.id] && PowerUps.catalog[item.id].tiers[item.tier];
                    const powerTarget = jammedLift || stinkyLift || selectedLift;
                    if (ability && ability.target === 'instant') {
                        primeAbility(item.id, item.tier);
                    } else if (ability && powerTarget) {
                        primeAbility(item.id, item.tier);
                        if (PowerUps.activeTargeting) {
                            dispatchTarget(powerTarget.id, Math.round(powerTarget.pos / Registry.floorHeight), 'power-up-target');
                        }
                    }
                }

                if (target && selectedLift && dispatchTarget(selectedLift.id, target.floorIndex, `${options.strategy}-queue`)) {
                    manualInterventions++;
                }
                lastInterventionSecond = second;
                return;
            }

            if (options.strategy === 'resource-supported') {
                if (second - lastInterventionSecond < (options.interventionIntervalSec || 15)) return;
                const criticalCount = Registry.floors.reduce(
                    (sum, floor) => sum + floor.waitingGuests.filter(guest => guest.status === GuestStatus.CRITICAL).length,
                    0
                );
                const peakQueue = Math.max(...Registry.floors.map(floor => floor.waitingGuests.length));
                const impairedLift = Registry.lifts.find(lift => lift.jamTimer > 0 || lift.stinkTimer > 0);
                if (criticalCount === 0 && peakQueue < 8 && !impairedLift) return;

                // Model competent hybrid play: preserve the featured automation,
                // but redirect one available empty lift toward the most urgent
                // unclaimed queue when pressure becomes visible.
                const rescueLift = [...Registry.lifts]
                    .filter(lift => !lift.manualOverride && lift.jamTimer <= 0)
                    .sort((a, b) =>
                        a.passengers.length - b.passengers.length ||
                        Registry.getLiftWeight(a) - Registry.getLiftWeight(b)
                    )[0];
                if (rescueLift) {
                    const currentFloor = Math.round(rescueLift.pos / Registry.floorHeight);
                    const rescueTarget = Registry.floors.map((floor, floorIndex) => {
                        const critical = floor.waitingGuests.filter(guest => guest.status === GuestStatus.CRITICAL).length;
                        const annoyed = floor.waitingGuests.filter(guest => guest.status === GuestStatus.ANNOYED).length;
                        const oldestWaitMs = floor.waitingGuests.reduce(
                            (maximum, guest) => Math.max(maximum, virtualTime - guest.spawnTime),
                            0
                        );
                        return {
                            floorIndex,
                            count: floor.waitingGuests.length,
                            score: critical * 100000 + annoyed * 10000 + oldestWaitMs + floor.waitingGuests.length * 100 - Math.abs(floorIndex - currentFloor)
                        };
                    }).filter(target => target.count > 0)
                        .sort((a, b) => b.score - a.score)[0];
                    if (rescueTarget) dispatchTarget(rescueLift.id, rescueTarget.floorIndex, 'rescue-queue');
                }

                const findItem = ids => PowerUps.inventory.find(candidate => ids.includes(candidate.id));
                const jammedLift = Registry.lifts.find(lift => lift.jamTimer > 0);
                const stinkyLift = Registry.lifts.find(lift => lift.stinkTimer > 0);
                const item =
                    (jammedLift && findItem(['wrench'])) ||
                    (stinkyLift && findItem(['freshener'])) ||
                    (criticalCount >= 3 && findItem(['musak'])) ||
                    (peakQueue >= 12 && findItem(['doors', 'tardis', 'doubleDecker', 'turbo'])) ||
                    findItem(['turbo', 'tardis', 'doors', 'musak', 'wrench', 'freshener', 'doubleDecker']);
                if (item) {
                    const ability = PowerUps.catalog[item.id] && PowerUps.catalog[item.id].tiers[item.tier];
                    if (ability && ability.target === 'instant') {
                        primeAbility(item.id, item.tier);
                    } else if (ability) {
                        const targetLift = jammedLift || stinkyLift || [...Registry.lifts].sort((a, b) => b.passengers.length - a.passengers.length)[0];
                        primeAbility(item.id, item.tier);
                        if (PowerUps.activeTargeting) {
                            dispatchTarget(targetLift.id, Math.round(targetLift.pos / Registry.floorHeight), 'power-up-target');
                        }
                    }
                }
                lastInterventionSecond = second;
                return;
            }

            if (options.strategy.startsWith('hybrid-manual-')) {
                const manualLift = Registry.lifts.find(lift => lift.automation === 'manual');
                const hasCritical = Registry.floors.some(floor =>
                    floor.waitingGuests.some(guest => guest.status === GuestStatus.CRITICAL)
                );
                if (
                    hasCritical &&
                    PowerUps.timers.wideDoors <= 0 &&
                    PowerUps.inventory.some(item => item.id === 'doors' && item.tier === 0)
                ) {
                    primeAbility('doors', 0);
                }
                if (!manualLift || manualLift.manualOverride || manualLift.jamTimer > 0) return;
                if (manualLift.passengers.length > 0 && manualLift.state === 'IDLE') {
                    const currentFloor = Math.round(manualLift.pos / Registry.floorHeight);
                    const destination = [...manualLift.passengers]
                        .sort((a, b) => Math.abs(a.dest - currentFloor) - Math.abs(b.dest - currentFloor))[0].dest;
                    dispatchTarget(manualLift.id, destination, 'manual-passenger');
                    lastInterventionSecond = second;
                    return;
                }
                if (manualLift.passengers.length > 0 || second - lastInterventionSecond < interval) return;
                const target = Registry.floors.map((floor, floorIndex) => ({
                    floorIndex,
                    count: floor.waitingGuests.length,
                    oldestWaitMs: floor.waitingGuests.reduce(
                        (maximum, guest) => Math.max(maximum, virtualTime - guest.spawnTime),
                        0
                    )
                })).sort((a, b) => b.oldestWaitMs - a.oldestWaitMs || b.count - a.count)[0];
                if (target && target.count > 0) {
                    dispatchTarget(manualLift.id, target.floorIndex, 'manual-rescue');
                    lastInterventionSecond = second;
                }
                return;
            }

            if (second - lastInterventionSecond < interval) return;

            const availableLift = Registry.lifts.find(lift =>
                !lift.manualOverride &&
                lift.jamTimer <= 0 &&
                lift.passengers.length === 0
            );
            if (!availableLift) return;
            const currentFloor = Math.round(availableLift.pos / Registry.floorHeight);
            const ranked = Registry.floors.map((floor, floorIndex) => {
                const critical = floor.waitingGuests.filter(guest => guest.status === GuestStatus.CRITICAL).length;
                const annoyed = floor.waitingGuests.filter(guest => guest.status === GuestStatus.ANNOYED).length;
                const oldestWaitMs = floor.waitingGuests.reduce(
                    (maximum, guest) => Math.max(maximum, virtualTime - guest.spawnTime),
                    0
                );
                return {
                    floorIndex,
                    critical,
                    annoyed,
                    surge: floor.waitingGuests.length >= 5,
                    oldestWaitMs,
                    distance: Math.abs(floorIndex - currentFloor),
                    score: critical * 100 + annoyed * 10 + floor.waitingGuests.length
                };
            }).sort((a, b) =>
                b.critical - a.critical ||
                Number(b.surge) - Number(a.surge) ||
                b.oldestWaitMs - a.oldestWaitMs ||
                a.distance - b.distance ||
                b.score - a.score
            );
            if (
                options.strategy === 'wide-doors-rescue' &&
                ranked[0] &&
                ranked[0].critical > 0 &&
                PowerUps.timers.wideDoors <= 0 &&
                PowerUps.inventory.some(item => item.id === 'doors' && item.tier === 0)
            ) {
                primeAbility('doors', 0);
            }
            if (!ranked[0] || (ranked[0].critical === 0 && ranked[0].annoyed === 0 && !ranked[0].surge)) return;
            dispatchTarget(availableLift.id, ranked[0].floorIndex, 'urgent-queue');
            lastInterventionSecond = second;
        };

        for (let second = 0; second < totalSeconds; second++) {
            if (!Registry.gameActive) break;

            (options.trafficBursts || [])
                .filter(burst => burst.atSecond === second + 1)
                .forEach(burst => {
                    const floor = Math.max(0, Math.min(Config.numFloors - 1, burst.floor));
                    for (let index = 0; index < burst.count; index++) {
                        const destination = burst.destination === undefined
                            ? (floor === 0 ? Config.numFloors - 1 : 0)
                            : burst.destination;
                        Registry.floors[floor].waitingGuests.push({
                            dest: destination,
                            status: GuestStatus.HAPPY,
                            spawnTime: virtualTime,
                            isVip: false,
                            isCheckout: destination === 0,
                            isFarter: false,
                            isSunset: false,
                            isPartying: false,
                            isGymBro: false,
                            isBulky: false,
                            isRoomService: false,
                            boardingWeight: 1
                        });
                        Game.BalanceTelemetry.recordSpawn();
                    }
                });

            const livesBeforeTick = Registry.stats.lives;
            window.gameTick(virtualTime);
            elapsedSeconds = second + 1;
            runStrategyController(elapsedSeconds);
            for (let frame = 0; frame < 60; frame++) {
                virtualTime += animationStepMs;
                window.Game.virtualTime = virtualTime;
                window.animationTick(virtualTime);
            }

            traceEvent('lift-state', {
                lifts: Registry.lifts.map(lift => ({
                    id: lift.id,
                    passengers: lift.passengers.length,
                    target: lift.targetFloor,
                    state: lift.state,
                    jammed: lift.jamTimer > 0,
                    stink: lift.stinkTimer > 0
                }))
            });

            if (!trace && Registry.stats.lives < livesBeforeTick) {
                traceEvent('life-loss', { count: livesBeforeTick - Registry.stats.lives, livesRemaining: Registry.stats.lives });
            }

            if (Registry.stats.lives <= 0) break;
        }

        const result = {
            roundDefinition: JSON.parse(JSON.stringify(Config.GAME_DATA.rounds[round])),
            served: Registry.stats.served,
            livesRemaining: Registry.stats.lives,
            timeLeft: Registry.stats.timeLeft,
            elapsedSeconds,
            roundStats: JSON.parse(JSON.stringify(Registry.roundStats)),
            success: Registry.stats.lives > 0,
            designTelemetry: window.Game.BalanceTelemetry.export(),
            trace: trace || undefined,
            diagnostics: trace ? summarizeTrace(trace) : undefined
        };

        console.log(`[Simulator] Completed. Served: ${result.served}, Lives: ${result.livesRemaining}`);
        return result;
    }
};
