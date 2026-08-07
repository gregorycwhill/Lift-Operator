// ============================================================================
// ENGINE-PHYSICS.JS : CORE PHYSICS LOOP, BOARDING PROTOCOLS, & PASSENGER DECAY
// ============================================================================

window.getGuestStatusForWait = function(waitMs) {
    const p = Config.GAME_DATA.system.patience;
    if (waitMs > p.critical * 1000) return GuestStatus.RAGE;
    if (waitMs > p.annoyed * 1000) return GuestStatus.CRITICAL;
    if (waitMs > p.happy * 1000) return GuestStatus.ANNOYED;
    return GuestStatus.HAPPY;
};

window.getBoardingDurationMs = function(weight = 1, speedMultiplier = 1) {
    return Config.boardSpeedSec *
        (Config.boardingSpeedMultiplier || 1.0) *
        weight /
        Math.max(0.01, speedMultiplier) *
        1000;
};

window.getGravitySpeedMultiplier = function(currentWeight, maxCapacity, gravityScalar) {
    if (!maxCapacity || gravityScalar <= 0) return 1;
    return Math.max(0.1, 1 - ((currentWeight / maxCapacity) * gravityScalar));
};

window.isGuestDirectionCompatible = function(lift, guest, floor) {
    // A clicked floor is an explicit pickup instruction. The lift's previous
    // Sweep direction must not make that instruction appear to be ignored.
    if (lift.manualOverride) return true;
    if (lift.automation === 'manual' || lift.automation === 'voting' || lift.automation === 'weighted-voting' || lift.automation.startsWith('custom_')) return true;
    const guestDirection = guest.dest > floor ? 1 : -1;
    if (lift.passengers.length > 0) return guestDirection === lift.sweepDirection;
    return true;
};

window.getGuestBoardingRejectionReason = function(lift, guest, floor, isStinky, maxCapacity) {
    if (typeof Registry.canLiftDirectlyServe === 'function' && !Registry.canLiftDirectlyServe(lift, floor, guest.dest)) return 'zone-or-route';
    if (guest.isPartying) return 'party-state';
    const guestWeight = guest.boardingWeight || (guest.type === 'room-service' ? 3 : (guest.isGymBro ? 2 : 1));
    if (Registry.getLiftWeight(lift) + guestWeight > maxCapacity) return 'capacity';
    if (guest.status === GuestStatus.RAGE) return 'rage';
    if (isStinky && !guest.isGymBro) return 'stink';
    if (lift.passengers.some(passenger => passenger.isVip)) return 'vip-occupied';
    if (guest.isVip && lift.passengers.length > 0) return 'vip-queue';
    if (!window.isGuestDirectionCompatible(lift, guest, floor)) return 'direction';
    return null;
};

window.canGuestBoardLift = function(lift, guest, floor, isStinky, maxCapacity) {
    return window.getGuestBoardingRejectionReason(lift, guest, floor, isStinky, maxCapacity) === null;
};

window.processOpenPlanTransfers = function() {
    const doorStates = new Set(['DOORS_OPENING', 'BOARDING', 'DOORS_CLOSING']);
    const isAligned = (left, right) => {
        const leftFloor = Math.round(left.pos / Registry.floorHeight);
        const rightFloor = Math.round(right.pos / Registry.floorHeight);
        return leftFloor === rightFloor && Math.abs(left.pos - right.pos) < Config.GAME_DATA.system.lateralTolerance * Registry.floorHeight;
    };
    const transferOne = (source, target, floor) => {
        const capacity = typeof PowerUps !== 'undefined' ? PowerUps.getLiftCapacity(target.id) : Config.liftCapacity;
        const index = source.passengers.findIndex(guest => {
            if (guest.dest === floor) return false;
            const sourceDistance = Math.abs(source.targetFloor - guest.dest);
            const targetDistance = Math.abs(target.targetFloor - guest.dest);
            if (targetDistance >= sourceDistance) return false;
            return window.canGuestBoardLift(target, guest, floor, Registry.isLiftStinky(target), capacity);
        });
        if (index < 0) return false;
        const guest = source.passengers.splice(index, 1)[0];
        target.passengers.push(guest);
        Registry.roundStats.lateralTransfers++;
        if (typeof PowerUps !== 'undefined') PowerUps.showEffectOnLift(target.id, '↔️');
        return true;
    };

    for (let index = 0; index < Registry.lifts.length - 1; index++) {
        const left = Registry.lifts[index];
        const right = Registry.lifts[index + 1];
        if (!left || !right || !isAligned(left, right)) continue;
        if (!doorStates.has(left.state) || !doorStates.has(right.state)) continue;
        if (left.openPlanTimer <= 0 && right.openPlanTimer <= 0) continue;
        const floor = Math.round(left.pos / Registry.floorHeight);
        if (transferOne(left, right, floor)) continue;
        transferOne(right, left, floor);
    }
};

window.gameTick = function(timestamp) {
    if (!Registry.gameActive) return;
    const now = timestamp || Date.now();
    const roundConfig = Config.GAME_DATA.rounds[Registry.stats.round] || { objective: 'SURVIVAL', gravityScalar: 0 };
    
    try {
        if (roundConfig.objective !== 'ENDURANCE' && Registry.stats.timeLeft <= 0) {
            const engine = GameEngine();
            if (typeof engine.completeRound === 'function') engine.completeRound('timer');
            return;
        }
    } catch (e) {
        if (typeof Telemetry !== 'undefined') {
            Telemetry.add('PHYSICS', `Logic crash: ${e.message}`, 'error');
        }
        console.error("Physics Crash", e);
    }

    if (typeof PowerUps !== 'undefined' && PowerUps.tick) PowerUps.tick(now);

    Registry.lifts.forEach(lift => {
        if (lift.openPlanTimer > 0) lift.openPlanTimer--;
    });
    
    // Round Logic Orchestrator
    if (roundConfig.objective === 'QUOTA') {
        if (Registry.roundStats.servedThisRound >= roundConfig.quota) {
            const engine = GameEngine();
            if (typeof engine.completeRound === 'function') engine.completeRound('quota');
            return;
        }
    } else if (roundConfig.objective === 'ENDURANCE') {
        Registry.enduranceSeconds = (Registry.enduranceSeconds || 0) + 1;
        if (Registry.autoPilotActive) {
            const lossInterval = Math.max(
                1,
                parseInt(
                    (Registry.monkeySettings && Registry.monkeySettings.enduranceLifeLossIntervalSec) ||
                    Config.autoPilotSettings.enduranceLifeLossIntervalSec ||
                    1
                )
            );
            if (Registry.enduranceSeconds % lossInterval === 0) {
                Registry.stats.lives--;
                Registry.roundStats.defenestrationsThisRound++;
                window.Game.BalanceTelemetry?.recordLifeLoss(now, 1, 'monkey-endurance');
            }
        }
    } else {
        Registry.stats.timeLeft--;
    }

    const spawner = GameSpawner();
    if (typeof spawner.runSpawnerTick === 'function') {
        spawner.runSpawnerTick(now);
    }

    // Process Lift Timers & Hazards
    Registry.lifts.forEach((lift, i) => {
        // Fix for "ghost" jammed border: Ensure isJammed is initialized
        if (typeof lift.isJammed === 'undefined') lift.isJammed = false;
        const wasJamActive = lift.jamTimer > 0 || lift.isJammed;
        const wasStinkActive = lift.stinkTimer > 0;
        const gymBroCount = lift.passengers.filter(guest => guest.isGymBro).length;
        const gymBroStinkActive = window.isRoundEventEnabled(roundConfig, 'gym') &&
            window.isRoundEventEnabled(roundConfig, 'stink') &&
            gymBroCount >= Number(Config.gymBroStinkThreshold || 3) &&
            !(lift.freshenerTimer > 0 || (typeof PowerUps !== 'undefined' && PowerUps.timers.stinkImmunity > 0));
        if (gymBroStinkActive && !lift.gymStinkActive) {
            window.Game.Audio?.publish('hazard_started', { id: 'stink', liftId: lift.id, source: 'gym-bros' });
        }
        lift.gymStinkActive = gymBroStinkActive;

        const isDouble = lift.isDoubleDecker || lift.doubleDeckerTimer > 0;
        
        if (typeof PowerUps !== 'undefined' && PowerUps.timers.jamImmunity > 0) lift.jamTimer = 0;

        // Skip movement if jammed
        if (lift.jamTimer > 0 || lift.isJammed) {
            if (lift.jamTimer > 0) lift.jamTimer--;
            // Only decrement stink if not jammed? No, let stink fade.
            if (lift.stinkTimer > 0) lift.stinkTimer--;
            if (wasJamActive && lift.jamTimer <= 0 && !lift.isJammed) window.Game.Audio?.publish('hazard_ended', { id: 'jam', liftId: lift.id });
            if (wasStinkActive && lift.stinkTimer <= 0) window.Game.Audio?.publish('hazard_ended', { id: 'stink', liftId: lift.id });
            updateLiftVisualState(lift, i);
            return; // Skip rest of movement logic for this lift
        }

        if (lift.stinkTimer > 0) lift.stinkTimer--;
        if (lift.doubleDeckerTimer <= 0) lift.isDoubleDecker = false;
        if (wasJamActive && lift.jamTimer <= 0 && !lift.isJammed) window.Game.Audio?.publish('hazard_ended', { id: 'jam', liftId: lift.id });
        if (wasStinkActive && lift.stinkTimer <= 0) window.Game.Audio?.publish('hazard_ended', { id: 'stink', liftId: lift.id });

        if (typeof PowerUps !== 'undefined') {
            const effectiveCapacity = PowerUps.getLiftCapacity(i);
            if (lift.lastEffectiveCapacity === undefined) {
                lift.lastEffectiveCapacity = effectiveCapacity;
            } else if (lift.lastEffectiveCapacity !== effectiveCapacity) {
                const ui = GameUI();
                if (typeof ui.showLiftCapacity === 'function') ui.showLiftCapacity(i);
                lift.lastEffectiveCapacity = effectiveCapacity;
            }
        }
        
        if (false && lift.openPlanTimer > 0) {
            lift.openPlanTimer--;
            // Lateral Transfer Logic
            Registry.lifts.forEach((other, otherIdx) => {
                if (i === otherIdx) return;
                if (other.openPlanTimer <= 0) return; // Only if both have it? 
                // Or maybe only one needs it to "open" their gate? 
                // Let's say one lift having it allows it to push/pull guests if BOTH are aligned.
                
                const posDiff = Math.abs(lift.pos - other.pos);
                if (posDiff < Config.GAME_DATA.system.lateralTolerance * Registry.floorHeight) {
                    // Lifts are aligned. Check for guest utility.
                    for (let pIdx = lift.passengers.length - 1; pIdx >= 0; pIdx--) {
                        const p = lift.passengers[pIdx];
                        const otherCap = PowerUps.getLiftCapacity(otherIdx);
                        if (Registry.getLiftWeight(other) + (p.boardingWeight || 1) <= otherCap) {
                            // Utility Check: Is other lift closer to destination? 
                            // Or is it moving in the right direction?
                            const myDist = Math.abs(lift.targetFloor - p.dest);
                            const otherDist = Math.abs(other.targetFloor - p.dest);
                            
                            // Simple heuristic: If other lift is closer to their target or heading there
                            if (otherDist < myDist) {
                                lift.passengers.splice(pIdx, 1);
                                other.passengers.push(p);
                                Registry.roundStats.lateralTransfers++;
                                if (typeof PowerUps !== 'undefined') PowerUps.showEffectOnLift(otherIdx, '↔️');
                            }
                        }
                    }
                }
            });
        }
        
        // Clear expired effects
        if (lift.effects) {
            lift.effects = lift.effects.filter(eff => (now - eff.startTime) < eff.duration);
        }
        
        if (window.isRoundEventEnabled(roundConfig, 'jam')) {
            let jamImmune = typeof PowerUps !== 'undefined' && PowerUps.timers.jamImmunity > 0;
            if (lift.jamTimer <= 0 && seededRandom() < Config.jamChancePerSec && !jamImmune) {
                const jamMin = Number(roundConfig.jamMinSec || Config.jamMinSec);
                const jamMax = Number(roundConfig.jamMaxSec || Config.jamMaxSec);
                lift.jamTimer = window.getRandomInt(jamMin, jamMax); // gameTick decrements once per second
                window.Game.Audio?.publish('hazard_started', { id: 'jam', liftId: lift.id });
            }
            
            if (window.isRoundEventEnabled(roundConfig, 'stink') && lift.stinkTimer <= 0 && lift.passengers.length > 0) {
                let stinkImmune = lift.freshenerTimer > 0 || (typeof PowerUps !== 'undefined' && PowerUps.timers.stinkImmunity > 0);
                if (seededRandom() < Config.fartChancePerSec && !stinkImmune) {
                    lift.stinkTimer = Config.fartStinkSec; // gameTick decrements once per second
                    window.Game.Audio?.publish('hazard_started', { id: 'stink', liftId: lift.id });
                    const farterIndex = window.getRandomInt(0, lift.passengers.length - 1);
                    lift.passengers[farterIndex].isFarter = true;
                }
            }
        }
    });

    window.processOpenPlanTransfers();

    // Process Floor Aging Logic
    Registry.floors.forEach((floor, floorIdx) => {
        let isAngerPaused = typeof PowerUps !== 'undefined' && PowerUps.isAngerPaused(floorIdx);
        for (let i = floor.waitingGuests.length - 1; i >= 0; i--) {
            const g = floor.waitingGuests[i];
            
            if (g.isPartying) g.spawnTime += 1000;
            if (isAngerPaused) g.spawnTime += 1000; 
            
            const oldStatus = g.status;
            g.status = window.getGuestStatusForWait(now - g.spawnTime);
            if (g.status !== oldStatus && (g.status === GuestStatus.ANNOYED || g.status === GuestStatus.CRITICAL)) {
                window.Game.Audio?.publish('guest_urgency', { id: g.id, guestType: g.isVip ? 'vip' : (g.type || 'guest'), status: g.status, floor: floorIdx });
            }
            
            if (g.status === GuestStatus.RAGE && oldStatus !== GuestStatus.RAGE) {
                window.Game.Audio?.publish('guest_defenestrated', { id: g.id, floor: floorIdx });
                const livesLost = g.isVip ? Config.vipPenalty : 1;
                Registry.stats.lives -= livesLost;
                Registry.roundStats.defenestrationsThisRound++;
                window.Game.BalanceTelemetry?.recordLifeLoss(now, livesLost, g.isVip ? 'vip' : 'guest');
                if (g.isVip) window.showToast?.(`VIP rage-quit. You lose ${livesLost} lives.`);
                const ui = GameUI();
                if (typeof ui.triggerDefenestration === 'function') {
                    ui.triggerDefenestration(null, floorIdx, i);
                }
                floor.waitingGuests.splice(i, 1);
            }
        }
    });
    
    // Process Lift Aging Logic
    Registry.lifts.forEach((lift, index) => {
        let isAngerPaused = lift.musakTimer > 0 || (typeof PowerUps !== 'undefined' && PowerUps.timers.globalAngerPause > 0);
        let hasStinkImmunity = lift.freshenerTimer > 0 || (typeof PowerUps !== 'undefined' && PowerUps.timers.stinkImmunity > 0);
        
        lift.passengers.forEach(p => {
            let gymBroCount = lift.passengers.filter(gb => gb.isGymBro).length;
            let isStinky = lift.stinkTimer > 0 || gymBroCount >= Config.gymBroStinkThreshold;
            if (hasStinkImmunity) isStinky = false;
            
            if (isStinky && !p.isFarter && !p.isGymBro) p.spawnTime -= 1000; 
            if (isAngerPaused) p.spawnTime += 1000; 
            
            const oldStatus = p.status;
            p.status = window.getGuestStatusForWait(now - p.spawnTime);
            if (p.status !== oldStatus && (p.status === GuestStatus.ANNOYED || p.status === GuestStatus.CRITICAL)) {
                window.Game.Audio?.publish('guest_urgency', { id: p.id, guestType: p.isVip ? 'vip' : (p.type || 'guest'), status: p.status, liftId: lift.id });
            }
            if (p.status === GuestStatus.RAGE && oldStatus !== GuestStatus.RAGE) {
                window.Game.Audio?.publish('guest_defenestrated', { id: p.id, liftId: lift.id });
                const livesLost = p.isVip ? Config.vipPenalty : 1;
                Registry.stats.lives -= livesLost;
                Registry.roundStats.defenestrationsThisRound++;
                window.Game.BalanceTelemetry?.recordLifeLoss(now, livesLost, p.isVip ? 'vip' : 'guest');
                if (p.isVip) window.showToast?.(`VIP rage-quit. You lose ${livesLost} lives.`);
                const ui = GameUI();
                if (typeof ui.triggerDefenestration === 'function') {
                    const currentFloor = Math.round(lift.pos / Registry.floorHeight);
                    ui.triggerDefenestration(null, currentFloor);
                }
            }
        });
        
        for (let i = lift.passengers.length - 1; i >= 0; i--) {
            if (lift.passengers[i].status === GuestStatus.RAGE) lift.passengers.splice(i, 1);
        }
    });
    
    const balanceSample = window.Game.BalanceTelemetry?.sample(now);
    if (balanceSample && window.Game.Audio?.setPsi) {
        window.Game.Audio.setPsi(balanceSample.projectedSurvivalIndex ?? 1);
        const world = document.getElementById('world');
        if (world) {
            const psi = Number(balanceSample.projectedSurvivalIndex);
            const finalLifeThreat = Registry.stats.lives <= 1 && (balanceSample.imminentLives >= Registry.stats.lives || psi < 0.35);
            const clearFinalLifeThreat = Registry.stats.lives > 1 || (psi > 0.45 && balanceSample.imminentLives < 1);
            if (finalLifeThreat) world.classList.add('final-life-warning');
            else if (clearFinalLifeThreat) world.classList.remove('final-life-warning');
        }
    }

    if (Registry.stats.lives <= 0) {
        Registry.stats.lives = 0;
        const ui = GameUI();
        if (typeof ui.updateScoreboardUI === 'function') ui.updateScoreboardUI();
        const engine = GameEngine();
        if (roundConfig.objective === 'ENDURANCE') {
            if (typeof engine.completeRound === 'function') engine.completeRound('endurance-death');
        } else if (typeof engine.handleOrdinaryDeath === 'function') {
            engine.handleOrdinaryDeath();
        }
        return;
    }

    const ui = GameUI();
    if (typeof ui.updateScoreboardUI === 'function') ui.updateScoreboardUI();
};

window.animationTick = function(timestamp) {
    Registry.counterweightPolicyFrame = (Registry.counterweightPolicyFrame || 0) + 1;
    // Browser frame timestamps are page-relative; guest spawn times are epoch
    // based. Simulations provide an epoch-like virtual clock.
    const now = window.Game.virtualTime || Date.now();
    const ui = GameUI();
    const engine = GameEngine();

    // ========================================================================
    // UNIT_01 AUTO-PILOT PROTOCOL (MODAL & UI TRANSITIONS)
    // ========================================================================
    if (Registry.autoPilotActive && !Registry.manualIntervention) {
        // We run UI-decision checks every frame while autopilot is active
        // to handle modals even when gameActive is false.
        
        // HEARTBEAT SYNC: Ensure Heartbeat is shown if autopilot is active
        const hb = document.getElementById('heartbeatMonitor');
        if (hb && hb.classList.contains('hidden')) {
            hb.classList.remove('hidden');
        }

        // 1. Manifest / Blueprint Gateway Interaction
        const manifestAcceptBtn = document.getElementById('manifestAcceptBtn');
        if (manifestAcceptBtn && manifestAcceptBtn.getBoundingClientRect().width > 0) {
            console.log("🤖 [UNIT_01] Accepting Manifest Gateway...");
            manifestAcceptBtn.click();
            return;
        }

        // 2. Round Briefing / Start Button Interaction
        const startRoundBtn = document.getElementById('startRoundBtn');
        if (startRoundBtn && startRoundBtn.getBoundingClientRect().width > 0) {
            console.log("🤖 [UNIT_01] Starting Round (Visible button found)");
            startRoundBtn.click();
            return;
        }

        // 3. Round Review / Continue Interaction
        const continueBtn = document.getElementById('continueToBriefingBtn');
        if (continueBtn && continueBtn.getBoundingClientRect().width > 0) {
            console.log("🤖 [UNIT_01] Continuing to Briefing (Review complete)");
            continueBtn.click();
            return;
        }

        // 4. Shopping Logic (Greedy during Briefing)
        if (!Registry.gameActive) {
            const shopButtons = document.querySelectorAll('#shopContainer .btn-purchase:not([disabled])');
            if (shopButtons.length > 0) {
                shopButtons[0].click();
            }
        }
    }

    if (!Registry.gameActive) return;
    
    const roundConfig = Config.GAME_DATA.rounds[Registry.stats.round] || { objective: 'SURVIVAL', gravityScalar: 0 };
    try {
        if (typeof ui.draw === 'function') ui.draw();
    } catch (e) {
        if (typeof Telemetry !== 'undefined') {
            Telemetry.add('RENDER', `Draw crash: ${e.message}`, 'error');
        }
        console.error("Render Crash", e);
    }
    
    // ========================================================================
    // UNIT_01 AUTO-PILOT PROTOCOL
    // ========================================================================
    if (Registry.autoPilotActive && !Registry.manualIntervention) {
        const decisionInterval = 2250; // 50% slower than base 1500ms
        if (now - (Registry.lastAutoDecisionTime || 0) > decisionInterval) {
            Registry.lastAutoDecisionTime = now;
            
            // 1. Seeded Random Generator for Autopilot Brain
            const agentRandom = () => {
                Registry.agentSeed = (Registry.agentSeed * 16807) % 2147483647;
                return (Registry.agentSeed - 1) / 2147483646;
            };

            // 2. Control Logic
            const engine = GameEngine();
            
            // Shaft 0: Pseudo-Manual (Seeded Random Clicks)
            if (Registry.lifts[0]) {
                const target = Math.floor(agentRandom() * Config.numFloors);
                if (typeof engine.setLiftTarget === 'function') {
                    engine.setLiftTarget(0, target);
                }
            }
            
            // Other Shafts: Random Automations
            for (let i = 1; i < Registry.lifts.length; i++) {
                const modes = ['sweep', 'priority_sweep', 'voting'];
                if (Registry.stats.round >= 10) modes.push('custom'); // Only if custom scripts exist
                const randomMode = modes[Math.floor(agentRandom() * modes.length)];
                if (typeof engine.setLiftAutomation === 'function') {
                    engine.setLiftAutomation(i, randomMode);
                }
            }
            
            // 3. Power-Up Deployment
            if (Registry.inventory && Registry.inventory.length > 0) {
                // Staggered usage: 10% chance per decision tick to use a random item
                if (agentRandom() < 0.1) {
                    const idx = Math.floor(agentRandom() * Registry.inventory.length);
                    const item = Registry.inventory[idx];
                    const liftIdx = Math.floor(agentRandom() * Registry.lifts.length);
                    if (typeof PowerUps !== 'undefined' && typeof PowerUps.activatePowerUp === 'function') {
                        PowerUps.activatePowerUp(item.id, liftIdx);
                    }
                }
            }

            // 4. Stall Detection Heartbeat
            if (now - (Registry.lastProgressTime || now) > 15000) {
                console.error("⛔ [UNIT_01] STALL DETECTED: No served progress for 15s. Registry:", Registry);
            }
            if (Registry.stats.served > (Registry.lastServedCount || 0)) {
                Registry.lastServedCount = Registry.stats.served;
                Registry.lastProgressTime = now;
            }
        }
    }

    const roundTravelSec = Registry.counterweightEnabled
        ? Config.liftSpeedSec
        : (Number(roundConfig.floors) <= Number(Config.GAME_DATA.system.shortBuildingMaxFloors)
            ? Number(Config.GAME_DATA.system.shortBuildingLiftSpeedSec)
            : Number(Config.GAME_DATA.system.tallBuildingLiftSpeedSec));
    const travelSec = Registry.capsuleMode
        ? (Registry.capsuleTravelSecPerFloor || 0.2)
        : roundTravelSec;
    const pixelsPerSecond = Registry.floorHeight / travelSec;
    const basePixelsPerTick = pixelsPerSecond * (16 / 1000);

    Registry.lifts.forEach((lift, index) => {
        if (typeof ui.updateLiftVisualState === 'function') {
            ui.updateLiftVisualState(lift, index);
        }
        if (lift.effects) {
            const effectNow = (window.Game && window.Game.virtualTime) || now;
            lift.effects = lift.effects.filter(effect => (effectNow - effect.startTime) < effect.duration);
        }

        // A jam is a hard movement/boarding stop. gameTick owns timer decay;
        // animationTick must not advance a visibly jammed lift between ticks.
        if (lift.jamTimer > 0 || lift.isJammed) {
            lift.state = 'IDLE';
            lift.stateProgress = 0;
            return;
        }

        const currentFloor = Math.round(lift.pos / Registry.floorHeight);
        const targetPos = lift.targetFloor * Registry.floorHeight;
        const partner = Registry.counterweightEnabled && Number.isInteger(lift.counterweightPartner)
            ? Registry.lifts[lift.counterweightPartner]
            : null;
        const partnerMovementBlocked = Boolean(partner && (partner.jamTimer > 0 || partner.isJammed));

        // A jammed car holds the pair in place. If the partner is already at a
        // floor, its ordinary door/boarding state may still complete.
        if (partnerMovementBlocked && Math.abs(lift.pos - targetPos) > (Config.GAME_DATA.system.lateralTolerance * Registry.floorHeight)) {
            lift.state = 'IDLE';
            lift.stateProgress = 0;
            return;
        }
        
        let actualPixelsPerTick = basePixelsPerTick;
        if (typeof PowerUps !== 'undefined' && !Registry.capsuleMode) {
            const pairTurboActive = Boolean(partner && (lift.turboTimer > 0 || partner.turboTimer > 0));
            if (PowerUps.timers.globalTurbo > 0) {
                actualPixelsPerTick /= (Registry.counterweightEnabled && partner ? 0.1 : 0.05);
            } else if (lift.turboTimer > 0 || pairTurboActive) {
                let mod = lift.turboTimer > 0 ? (lift.activeTurboSpeed || 0.1) : (partner.activeTurboSpeed || 0.1);
                if (pairTurboActive) mod *= 2;
                actualPixelsPerTick /= mod; 
            }
        } else if (Registry.capsuleMode && typeof PowerUps !== 'undefined' &&
            (lift.turboTimer > 0 || PowerUps.timers.globalTurbo > 0)) {
            actualPixelsPerTick *= 1.15;
        }

        // --- 2.2 Gravity & Weight Physics ---
        if (targetPos > lift.pos) {
            const currentWeight = Registry.getLiftWeight(lift);
            const maxCap = (typeof PowerUps !== 'undefined') ? PowerUps.getLiftCapacity(index) : Config.liftCapacity;
            
            // Gravity and weight sensitivity from Config.GAME_DATA
            let ddMultiplier = (lift.isDoubleDecker || lift.doubleDeckerTimer > 0) ? 2.0 : 1.0;
            const liftGravity = (roundConfig.gravityScalar || 0) * ddMultiplier;
            actualPixelsPerTick *= window.getGravitySpeedMultiplier(currentWeight, maxCap, liftGravity);
        }

        let isStinky = Registry.isLiftStinky(lift);
        let hasStinkImmunity = lift.freshenerTimer > 0 || (typeof PowerUps !== 'undefined' && PowerUps.timers.stinkImmunity > 0);

        if (Math.abs(lift.pos - targetPos) > actualPixelsPerTick) {
            lift.pos += (targetPos > lift.pos) ? actualPixelsPerTick : -actualPixelsPerTick;
            
            // Re-evaluate automation while moving if we are at a floor boundary
            const atFloor = (lift.pos / Registry.floorHeight);
            if (Math.abs(atFloor - Math.round(atFloor)) < (actualPixelsPerTick / Registry.floorHeight)) {
                const currentF = Math.round(atFloor);
                if (currentF !== lift.targetFloor) {
                   window.runAutomationLogic(lift, index, currentF, isStinky, hasStinkImmunity, now);
                }
            }
            
            lift.state = 'IDLE';
            lift.stateProgress = 0;
        } else {
            // SNAP TO FLOOR logic
            // The movement branch is entered when the remaining distance is no
            // greater than one frame's step. Always snap: the boarding arbiter
            // uses a stricter parked-position test than the visual floor test.
            // Leaving a fractional remainder here makes a Turbo car appear at a
            // floor while silently refusing every guest there.
            lift.pos = targetPos;
            
            const f = lift.targetFloor;

            // SAFETEY: Prevent crashes from invalid target floors
            if (!Registry.floors[f]) {
                lift.targetFloor = Math.round(lift.pos / Registry.floorHeight);
                lift.state = 'IDLE';
                return;
            }

            // --- STATE MACHINE ---
            if (lift.state === 'IDLE' || lift.state === 'DONE') {
                const isDouble = (lift.isDoubleDecker || lift.doubleDeckerTimer > 0);
                let forceExodus = (isStinky && lift.passengers.some(p => !p.isGymBro));
                const hasDropoffs = lift.passengers.some(p => p.dest === f || (isDouble && p.dest === f + 1) || (forceExodus && !p.isGymBro));
                
                let maxCap = typeof PowerUps !== 'undefined' ? PowerUps.getLiftCapacity(index) : Config.liftCapacity;
                const canBoardAt = floor => Registry.getLiftWeight(lift) < maxCap && Registry.floors[floor]?.waitingGuests.some(guest =>
                    window.canGuestBoardLift(lift, guest, floor, isStinky, maxCap)
                );
                const canPickUp = canBoardAt(f) || (isDouble && canBoardAt(f + 1));
                
                if (hasDropoffs || canPickUp) {
                    lift.state = 'DOORS_OPENING';
                    lift.stateProgress = 0;
                    lift.lastActionTime = now;
                } else {
                    const released = Registry.releaseCounterweightManualOverride?.(lift);
                    if (released || !lift.manualOverride) {
                        window.runAutomationLogic(lift, index, currentFloor, isStinky, hasStinkImmunity, now);
                    }
                }
            }
            
            if (lift.state === 'DOORS_OPENING') {
                lift.stateProgress += 16 / (Config.doorSpeedSec * 1000);
                if (lift.stateProgress >= 1) {
                    lift.state = 'BOARDING';
                    lift.stateProgress = 0; 
                }
            }

            else if (lift.state === 'BOARDING') {
                if (lift.stateProgress >= 1) {
                    let performedAction = false;
                    const isDouble = (lift.isDoubleDecker || lift.doubleDeckerTimer > 0);
                    let forceExodus = lift.tardisExpiryExodus || (isStinky && lift.passengers.some(p => !p.isGymBro));
                    
                    const indexToDrop = lift.passengers.findIndex(p => p.dest === f || (isDouble && p.dest === f + 1) || (forceExodus && !p.isGymBro));
                    
                    if (indexToDrop !== -1) {
                        const p = lift.passengers.splice(indexToDrop, 1)[0];
                        const exitF = (isDouble && p.dest === f + 1) ? f + 1 : f;
                        
                        if (!forceExodus || p.dest === exitF) {
                            if (typeof window.Game.Audio !== 'undefined') window.Game.Audio.publish('lift_arrived', { liftId: lift.id, floor: lift.currentFloor });
                            if (p.isSunset && exitF === Config.numFloors - 1) {
                                p.isPartying = true;
                                Registry.floors[exitF].waitingGuests.push(p);
                            } else if (p.isVip && p.vipStage < 3 && typeof window.Game.Spawner?.queueVipNextJourney === 'function' && window.Game.Spawner.queueVipNextJourney(p, exitF, now)) {
                                // The VIP's first two destinations are transfers, not completed guests.
                            } else {
                                Registry.stats.served++;
                                Registry.roundStats.servedThisRound++; 
                                window.Game.Audio?.publish('guest_served', { id: p.id, liftId: lift.id, floor: exitF });
                                if (isDouble) {
                                    Registry.roundStats.doubleDeckerServed++;
                                }
                                let waitSeconds = (now - p.spawnTime) / 1000;
                                Registry.roundStats.totalWaitTimeServed += Math.max(0, waitSeconds);
                                Registry.roundStats.journeyTimes.push(Math.max(0, waitSeconds));
                                if (p.isVip) Registry.roundStats.vipServed++;
                                if (p.status === GuestStatus.HAPPY) Registry.roundStats.happyServed++;
                                else if (p.status === GuestStatus.ANNOYED) Registry.roundStats.annoyedServed++;
                                else if (p.status === GuestStatus.CRITICAL) Registry.roundStats.criticalServed++;
                            }
                        } else {
                            p.isFarter = false; 
                            Registry.floors[f].waitingGuests.push(p);
                        }
                        if (lift.passengers.length === 0) {
                            lift.sardineScored = false;
                            lift.tardisExpiryExodus = false;
                        }
                        
                        performedAction = true;
                        lift.stateProgress = 0;
                        lift.lastBoardingWeight = p.boardingWeight || (p.type === 'room-service' ? 3.0 : (p.isGymBro ? 2.0 : 1.0));
                    } 
                    else {
                        let maxCap = typeof PowerUps !== 'undefined' ? PowerUps.getLiftCapacity(index) : Config.liftCapacity;
                        let targetFloorToBoard = f;
                        const findBoardableGuest = floor => {
                            const queue = Registry.floors[floor].waitingGuests;
                            const isBoardable = guest => window.canGuestBoardLift(lift, guest, floor, isStinky, maxCap);
                            // VIPs hold priority at the front of boarding selection,
                            // but an unsuitable lift may still serve ordinary guests.
                            const vipIndex = queue.findIndex(guest => guest.isVip && isBoardable(guest));
                            return vipIndex !== -1 ? vipIndex : queue.findIndex(isBoardable);
                        };
                        let boardableGuestIndex = findBoardableGuest(f);

                        if (boardableGuestIndex === -1 && Registry.isZoningEnabled?.()) {
                            const zoneGuests = Registry.floors[f].waitingGuests.filter(g =>
                                Registry.canLiftDirectlyServe(lift, f, g.dest)
                            );
                            if (Registry.floors[f].waitingGuests.length > 0 && zoneGuests.length < Registry.floors[f].waitingGuests.length) {
                                const routeCovered = Registry.lifts.some(other =>
                                    other.id !== lift.id && Registry.canLiftDirectlyServe(other, f, Registry.floors[f].waitingGuests[0].dest)
                                );
                                window.Game.BalanceTelemetry?.recordZoneRefusal(routeCovered);
                            }
                        }

                        if (boardableGuestIndex === -1 && isDouble && Registry.floors[f+1]) {
                            targetFloorToBoard = f + 1;
                            boardableGuestIndex = findBoardableGuest(f + 1);
                        }

                        if (boardableGuestIndex !== -1) {
                            const guestToBoard = Registry.floors[targetFloorToBoard].waitingGuests[boardableGuestIndex];
                            let parkedLifts = Registry.lifts.filter(l => {
                                if (l.targetFloor !== f || Math.abs(l.pos - f * Registry.floorHeight) >= 1 || l.jamTimer > 0) return false;
                                const capacity = typeof PowerUps !== 'undefined' ? PowerUps.getLiftCapacity(l.id) : Config.liftCapacity;
                                return Registry.getLiftWeight(l) < capacity && window.canGuestBoardLift(l, guestToBoard, targetFloorToBoard, Registry.isLiftStinky(l), capacity);
                            });
                            // Fill the most-loaded compatible parked car first. This prevents
                            // several lifts waiting at one floor from fragmenting a queue into
                            // partial loads, while preserving direction/stink/VIP eligibility.
                            parkedLifts.sort((a, b) => Registry.getLiftWeight(b) - Registry.getLiftWeight(a) || a.id - b.id);
                            if (parkedLifts.length > 0 && parkedLifts[0].id === lift.id) {
                                Registry.floors[targetFloorToBoard].waitingGuests.splice(boardableGuestIndex, 1);
                                if (lift.passengers.length === 0 && ['sweep', 'priority-sweep', 'zoned-low', 'zoned-high'].includes(lift.automation)) {
                                    lift.sweepDirection = guestToBoard.dest > targetFloorToBoard ? 1 : -1;
                                }
                                lift.passengers.push(guestToBoard);
                                window.Game.Audio?.publish('guest_boarded', { id: guestToBoard.type || 'guest', liftId: lift.id, floor: f });
                                performedAction = true;
                                lift.stateProgress = 0;
                                lift.lastBoardingWeight = guestToBoard.boardingWeight || (guestToBoard.type === 'room-service' ? 3.0 : (guestToBoard.isGymBro ? 2.0 : 1.0));
                            }
                        }
                    }

                    if (!performedAction) {
                        if (Registry.floors[f].waitingGuests.length > 0) {
                            const rejectionReasons = {};
                            const refusalCapacity = typeof PowerUps !== 'undefined' ? PowerUps.getLiftCapacity(index) : Config.liftCapacity;
                            Registry.floors[f].waitingGuests.forEach(guest => {
                                const reason = window.getGuestBoardingRejectionReason(lift, guest, f, isStinky, refusalCapacity);
                                if (reason) rejectionReasons[reason] = (rejectionReasons[reason] || 0) + 1;
                            });
                            window.Game.Audio?.publish('guest_refused', {
                            liftId: lift.id,
                            floor: f,
                            reason: 'no-compatible-guest',
                            targetFloor: lift.targetFloor,
                            sweepDirection: lift.sweepDirection,
                            passengers: lift.passengers.length,
                            capacity: refusalCapacity,
                            jammed: lift.jamTimer > 0,
                            stinky: isStinky,
                            rejectionReasons
                            });
                        }
                        lift.state = 'DOORS_CLOSING';
                        lift.stateProgress = 0;
                    }
                } else {
                    let multiplier = 1.0;
                    if (typeof PowerUps !== 'undefined' && PowerUps.activePowers && PowerUps.activePowers.includes('wideDoors')) multiplier *= 2.0;
                    const weight = lift.lastBoardingWeight || 1.0;
                    const boardDurationMs = window.getBoardingDurationMs(weight, multiplier);
                    lift.stateProgress += 16 / boardDurationMs;
                }
            }
            else if (lift.state === 'DOORS_CLOSING') {
                lift.stateProgress += 16 / (Config.doorSpeedSec * 1000); 
                if (lift.stateProgress >= 1) {
                    lift.state = 'IDLE';
                    lift.stateProgress = 0;
                    // Keep the explicit stop visible through the boarding frame;
                    // the following idle decision clears it before Sweep resumes.
                    const released = Registry.releaseCounterweightManualOverride?.(lift);
                    if (released || !lift.manualOverride) {
                        window.runAutomationLogic(lift, index, currentFloor, isStinky, hasStinkImmunity, now);
                    }
                }
            }
        }
    });
};

window.runAutomationLogic = function(lift, index, currentFloor, isStinky, hasStinkImmunity, now) {
    if (lift.manualOverride) return;

    const VM = window.Game.Automation;
    if (!VM || !lift.automation || lift.automation === 'manual') return;
    let policyLift = lift;
    if (Registry.isCounterweightPolicy?.(lift)) {
        const coordinator = Registry.getCounterweightPolicyCoordinator?.(lift) || lift;
        if (coordinator.id !== lift.id) return;
        policyLift = Registry.getCounterweightPolicyDriver(lift);
    }

    // Idle lifts can reach this path every animation frame. Bound policy scans so
    // large queues do not multiply into hundreds of full-building scans per second.
    const decisionTime = Number.isFinite(now) ? now : (window.Game.virtualTime || performance.now());
    if (decisionTime - (lift.lastAutomationTime || 0) < 100) return;
    lift.lastAutomationTime = decisionTime;
    if (policyLift !== lift) policyLift.lastAutomationTime = decisionTime;

    // Dispatch to VM for all modes
    if (policyLift.automation === 'sweep') {
        VM.execute(policyLift, 'sys_sweep');
    } else if (policyLift.automation === 'priority-sweep') {
        VM.execute(policyLift, 'sys_priority');
    } else if (policyLift.automation === 'voting') {
        VM.execute(policyLift, 'sys_voting');
    } else if (policyLift.automation === 'weighted-voting') {
        VM.execute(policyLift, 'sys_weighted');
    } else if (policyLift.automation === 'zoned-low') {
        VM.execute(policyLift, 'sys_zoned_low');
    } else if (policyLift.automation === 'zoned-high') {
        VM.execute(policyLift, 'sys_zoned_high');
    } else if (policyLift.automation.startsWith('custom_')) {
        VM.execute(policyLift, policyLift.automation);
    }
};

window.Game = window.Game || {};
window.Game.Engine = window.Game.Engine || {};
window.Game.Engine.gameTick = window.gameTick;
window.Game.Engine.animationTick = window.animationTick;
window.Game.Engine.isGuestDirectionCompatible = window.isGuestDirectionCompatible;
window.Game.Engine.canGuestBoardLift = window.canGuestBoardLift;
window.Game.Engine.getGuestStatusForWait = window.getGuestStatusForWait;
window.Game.Engine.getBoardingDurationMs = window.getBoardingDurationMs;
window.Game.Engine.getGravitySpeedMultiplier = window.getGravitySpeedMultiplier;
