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
        frame.src = `${window.location.pathname}?simulation=true`;
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
        window.Game.Audio = { play: () => {} };

        Registry.autoPilotActive = false;
        Registry.seed = seed;
        if (options.roundOverrides) {
            Config.GAME_DATA.rounds[round] = {
                ...Config.GAME_DATA.rounds[round],
                ...options.roundOverrides
            };
        }
        const virtualStart = 1000000;
        window.Game.virtualTime = virtualStart;
        window.initializeRound(round, {
            now: virtualStart,
            showBriefing: false
        });

        Object.keys(scripts).forEach(liftIndex => {
            if (Registry.lifts[liftIndex]) {
                Registry.lifts[liftIndex].automation = scripts[liftIndex];
            }
        });
        if (Array.isArray(options.loadout)) {
            PowerUps.inventory = options.loadout.map(item => ({ ...item }));
        }

        Registry.gameActive = true;
        let virtualTime = virtualStart;
        const objective = Config.GAME_DATA.rounds[round].objective;
        const totalSeconds = objective === 'ENDURANCE' ? 1800 : Config.roundTime;
        const animationStepMs = 1000 / 60;
        let elapsedSeconds = 0;
        let lastInterventionSecond = -Infinity;

        const runStrategyController = second => {
            if (!options.strategy || options.strategy.startsWith('all-')) return;
            const interval = options.interventionIntervalSec || 20;

            if (options.strategy === 'idealized-dispatch') {
                const claimedFloors = new Set();
                Registry.lifts.forEach(lift => {
                    const currentFloor = Math.round(lift.pos / Registry.floorHeight);
                    const isAtTarget = Math.abs(lift.pos - lift.targetFloor * Registry.floorHeight) < 0.01;
                    if (!isAtTarget || (lift.state !== 'IDLE' && lift.state !== 'DONE')) {
                        claimedFloors.add(lift.targetFloor);
                        return;
                    }

                    let targetFloor;
                    if (lift.passengers.length > 0) {
                        targetFloor = [...lift.passengers].sort((a, b) =>
                            (virtualTime - b.spawnTime) - (virtualTime - a.spawnTime) ||
                            Math.abs(a.dest - currentFloor) - Math.abs(b.dest - currentFloor)
                        )[0].dest;
                    } else {
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
                        }).filter(target => target.count > 0 && !claimedFloors.has(target.floorIndex))
                            .sort((a, b) => b.score - a.score)[0];
                        targetFloor = target && target.floorIndex;
                    }

                    if (Number.isInteger(targetFloor)) {
                        lift.targetFloor = targetFloor;
                        if (targetFloor > currentFloor) lift.sweepDirection = 1;
                        if (targetFloor < currentFloor) lift.sweepDirection = -1;
                        claimedFloors.add(targetFloor);
                    }
                });
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
                    if (rescueTarget) window.setLiftTarget(rescueLift.id, rescueTarget.floorIndex);
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
                        PowerUps.primeAbility(item.id, item.tier);
                    } else if (ability) {
                        const targetLift = jammedLift || stinkyLift || [...Registry.lifts].sort((a, b) => b.passengers.length - a.passengers.length)[0];
                        ability.execute(targetLift.id, Math.round(targetLift.pos / Registry.floorHeight));
                        PowerUps.consumeFromInventory(item.id, item.tier);
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
                    PowerUps.primeAbility('doors', 0);
                }
                if (!manualLift || manualLift.manualOverride || manualLift.jamTimer > 0) return;
                if (manualLift.passengers.length > 0 && manualLift.state === 'IDLE') {
                    const currentFloor = Math.round(manualLift.pos / Registry.floorHeight);
                    const destination = [...manualLift.passengers]
                        .sort((a, b) => Math.abs(a.dest - currentFloor) - Math.abs(b.dest - currentFloor))[0].dest;
                    window.setLiftTarget(manualLift.id, destination);
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
                    window.setLiftTarget(manualLift.id, target.floorIndex);
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
                PowerUps.primeAbility('doors', 0);
            }
            if (!ranked[0] || (ranked[0].critical === 0 && ranked[0].annoyed === 0 && !ranked[0].surge)) return;
            window.setLiftTarget(availableLift.id, ranked[0].floorIndex);
            lastInterventionSecond = second;
        };

        for (let second = 0; second < totalSeconds; second++) {
            await new Promise(resolve => setTimeout(resolve, 0));
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

            window.gameTick(virtualTime);
            elapsedSeconds = second + 1;
            runStrategyController(elapsedSeconds);
            for (let frame = 0; frame < 60; frame++) {
                virtualTime += animationStepMs;
                window.Game.virtualTime = virtualTime;
                window.animationTick(virtualTime);
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
            designTelemetry: window.Game.BalanceTelemetry.export()
        };

        console.log(`[Simulator] Completed. Served: ${result.served}, Lives: ${result.livesRemaining}`);
        return result;
    }
};
