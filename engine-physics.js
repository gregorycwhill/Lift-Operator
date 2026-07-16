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

    if (typeof PowerUps !== 'undefined' && PowerUps.tick) PowerUps.tick();
    
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

        const isDouble = lift.isDoubleDecker || lift.doubleDeckerTimer > 0;
        if (isDouble) {
            const maxF = Config.numFloors - 1;
            if (lift.targetFloor >= maxF) {
                lift.targetFloor = maxF - 1;
            }
        }
        
        if (typeof PowerUps !== 'undefined' && PowerUps.timers.jamImmunity > 0) lift.jamTimer = 0;

        // Skip movement if jammed
        if (lift.jamTimer > 0 || lift.isJammed) {
            if (lift.jamTimer > 0) lift.jamTimer--;
            // Only decrement stink if not jammed? No, let stink fade.
            if (lift.stinkTimer > 0) lift.stinkTimer--;
            updateLiftVisualState(lift, i);
            return; // Skip rest of movement logic for this lift
        }

        if (lift.stinkTimer > 0) lift.stinkTimer--;
        if (lift.tardisTimer > 0) lift.tardisTimer--;
        if (lift.turboTimer > 0) lift.turboTimer--; 
        if (lift.freshenerTimer > 0) lift.freshenerTimer--;
        if (lift.musakTimer > 0) lift.musakTimer--;
        if (lift.doubleDeckerTimer > 0) lift.doubleDeckerTimer--;
        else lift.isDoubleDecker = false;
        
        if (lift.openPlanTimer > 0) {
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
        
        if (Registry.stats.round >= 6) {
            let jamImmune = typeof PowerUps !== 'undefined' && PowerUps.timers.jamImmunity > 0;
            if (lift.jamTimer <= 0 && seededRandom() < Config.jamChancePerSec && !jamImmune) {
                lift.jamTimer = window.getRandomInt(Config.jamMinSec, Config.jamMaxSec) * 60; // Convert sec to roughly 60fps ticks
            }
            
            if (Registry.stats.round >= 9 && lift.stinkTimer <= 0 && lift.passengers.length > 0) {
                let stinkImmune = lift.freshenerTimer > 0 || (typeof PowerUps !== 'undefined' && PowerUps.timers.stinkImmunity > 0);
                if (seededRandom() < Config.fartChancePerSec && !stinkImmune) {
                    lift.stinkTimer = Config.fartStinkSec * 60; // Convert sec to ticks
                    const farterIndex = window.getRandomInt(0, lift.passengers.length - 1);
                    lift.passengers[farterIndex].isFarter = true;
                }
            }
        }
    });

    // Process Floor Aging Logic
    Registry.floors.forEach((floor, floorIdx) => {
        let isAngerPaused = typeof PowerUps !== 'undefined' && PowerUps.isAngerPaused(floorIdx);
        for (let i = floor.waitingGuests.length - 1; i >= 0; i--) {
            const g = floor.waitingGuests[i];
            
            if (g.isPartying) g.spawnTime += 1000;
            if (isAngerPaused) g.spawnTime += 1000; 
            
            const oldStatus = g.status;
            g.status = window.getGuestStatusForWait(now - g.spawnTime);
            
            if (g.status === GuestStatus.RAGE && oldStatus !== GuestStatus.RAGE) {
                if (typeof window.Game.Audio !== 'undefined') window.Game.Audio.play('error');
                const livesLost = g.isVip ? Config.vipPenalty : 1;
                Registry.stats.lives -= livesLost;
                Registry.roundStats.defenestrationsThisRound++;
                window.Game.BalanceTelemetry?.recordLifeLoss(now, livesLost, g.isVip ? 'vip' : 'guest');
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
            if (p.status === GuestStatus.RAGE && oldStatus !== GuestStatus.RAGE) {
                const livesLost = p.isVip ? Config.vipPenalty : 1;
                Registry.stats.lives -= livesLost;
                Registry.roundStats.defenestrationsThisRound++;
                window.Game.BalanceTelemetry?.recordLifeLoss(now, livesLost, p.isVip ? 'vip' : 'guest');
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
    
    window.Game.BalanceTelemetry?.sample(now);

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
    const now = timestamp || Date.now();
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

    const pixelsPerSecond = Registry.floorHeight / Config.liftSpeedSec;
    const basePixelsPerTick = pixelsPerSecond * (16 / 1000);

    Registry.lifts.forEach((lift, index) => {
        if (typeof ui.updateLiftVisualState === 'function') {
            ui.updateLiftVisualState(lift, index);
        }

        const currentFloor = Math.round(lift.pos / Registry.floorHeight);
        const targetPos = lift.targetFloor * Registry.floorHeight;
        
        let actualPixelsPerTick = basePixelsPerTick;
        if (typeof PowerUps !== 'undefined') {
            if (PowerUps.timers.globalTurbo > 0) {
                actualPixelsPerTick /= 0.05; 
            } else if (lift.turboTimer > 0) {
                let mod = lift.activeTurboSpeed || 0.1; 
                actualPixelsPerTick /= mod; 
            }
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

        let isStinky = lift.stinkTimer > 0;
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
            if (Math.abs(lift.pos - targetPos) < (Config.GAME_DATA.system.lateralTolerance * Registry.floorHeight)) {
                lift.pos = targetPos; 
            }
            
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
                const canPickUp = (Registry.getLiftWeight(lift) < maxCap && 
                                  (Registry.floors[f].waitingGuests.length > 0 || (isDouble && Registry.floors[f+1] && Registry.floors[f+1].waitingGuests.length > 0)));
                
                if (hasDropoffs || canPickUp) {
                    lift.state = 'DOORS_OPENING';
                    lift.stateProgress = 0;
                    lift.lastActionTime = now;
                } else {
                    if (lift.manualOverride) lift.manualOverride = false;
                    window.runAutomationLogic(lift, index, currentFloor, isStinky, hasStinkImmunity, now);
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
                    let forceExodus = (isStinky && lift.passengers.some(p => !p.isGymBro));
                    
                    const indexToDrop = lift.passengers.findIndex(p => p.dest === f || (isDouble && p.dest === f + 1) || (forceExodus && !p.isGymBro));
                    
                    if (indexToDrop !== -1) {
                        const p = lift.passengers.splice(indexToDrop, 1)[0];
                        const exitF = (isDouble && p.dest === f + 1) ? f + 1 : f;
                        
                        if (!forceExodus || p.dest === exitF) {
                            if (typeof window.Game.Audio !== 'undefined') window.Game.Audio.play('ding');
                            if (p.isSunset && exitF === Config.numFloors - 1) {
                                p.isPartying = true;
                                Registry.floors[exitF].waitingGuests.push(p);
                            } else {
                                Registry.stats.served++;
                                Registry.roundStats.servedThisRound++; 
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
                        if (lift.passengers.length === 0) lift.sardineScored = false;
                        
                        performedAction = true;
                        lift.stateProgress = 0;
                        lift.lastBoardingWeight = p.boardingWeight || (p.type === 'room-service' ? 3.0 : (p.isGymBro ? 2.0 : 1.0));
                    } 
                    else {
                        let maxCap = typeof PowerUps !== 'undefined' ? PowerUps.getLiftCapacity(index) : Config.liftCapacity;
                        let targetFloorToBoard = f;
                        let boardableGuestIndex = Registry.floors[f].waitingGuests.findIndex(g => {
                            let gWeight = g.boardingWeight || (g.type === 'room-service' ? 3.0 : (g.isGymBro ? 2.0 : 1.0));
                            if (Registry.getLiftWeight(lift) + gWeight > maxCap) return false;
                            if (g.status === GuestStatus.RAGE) return false;
                            if (isStinky && !g.isGymBro) return false;
                            if (lift.passengers.some(p => p.isVip)) return false; 
                            if (g.isVip && lift.passengers.length > 0) return false; 
                            if (lift.automation === 'manual' || lift.automation === 'voting' || lift.automation === 'weighted-voting' || lift.automation.startsWith('custom_')) return true;
                            const guestDir = g.dest > f ? 1 : -1;
                            if (lift.passengers.length > 0) return guestDir === lift.sweepDirection;
                            return true;
                        });

                        if (boardableGuestIndex === -1 && isDouble && Registry.floors[f+1]) {
                            targetFloorToBoard = f + 1;
                            boardableGuestIndex = Registry.floors[f+1].waitingGuests.findIndex(g => {
                                let gWeight = g.boardingWeight || (g.type === 'room-service' ? 3.0 : (g.isGymBro ? 2.0 : 1.0));
                                if (Registry.getLiftWeight(lift) + gWeight > maxCap) return false;
                                if (g.status === GuestStatus.RAGE) return false;
                                if (isStinky && !g.isGymBro) return false;
                                if (lift.passengers.some(p => p.isVip)) return false; 
                                if (g.isVip && lift.passengers.length > 0) return false; 
                                if (lift.automation === 'manual' || lift.automation === 'voting' || lift.automation === 'weighted-voting' || lift.automation.startsWith('custom_')) return true;
                                const guestDir = g.dest > (f + 1) ? 1 : -1;
                                if (lift.passengers.length > 0) return guestDir === lift.sweepDirection;
                                return true;
                            });
                        }

                        if (boardableGuestIndex !== -1) {
                            let parkedLifts = Registry.lifts.filter(l => l.targetFloor === f && Math.abs(l.pos - f * Registry.floorHeight) < 1 && Registry.getLiftWeight(l) < (typeof PowerUps !== 'undefined' ? PowerUps.getLiftCapacity(l.id) : Config.liftCapacity) && l.jamTimer <= 0 && l.stinkTimer <= 0);
                            parkedLifts.sort((a, b) => Registry.getLiftWeight(a) - Registry.getLiftWeight(b));
                            if (parkedLifts.length > 0 && parkedLifts[0].id === lift.id) {
                                const guestToBoard = Registry.floors[targetFloorToBoard].waitingGuests.splice(boardableGuestIndex, 1)[0];
                                if (lift.passengers.length === 0 && (lift.automation === 'sweep' || lift.automation === 'priority-sweep')) {
                                    lift.sweepDirection = guestToBoard.dest > targetFloorToBoard ? 1 : -1;
                                }
                                lift.passengers.push(guestToBoard);
                                performedAction = true;
                                lift.stateProgress = 0;
                                lift.lastBoardingWeight = guestToBoard.boardingWeight || (guestToBoard.type === 'room-service' ? 3.0 : (guestToBoard.isGymBro ? 2.0 : 1.0));
                            }
                        }
                    }

                    if (!performedAction) {
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
                    if (lift.manualOverride) lift.manualOverride = false;
                    window.runAutomationLogic(lift, index, currentFloor, isStinky, hasStinkImmunity, now);
                }
            }
        }
    });
};

window.runAutomationLogic = function(lift, index, currentFloor, isStinky, hasStinkImmunity, now) {
    if (lift.manualOverride) return;

    const VM = window.Game.Automation;
    if (!VM || !lift.automation || lift.automation === 'manual') return;

    // Idle lifts can reach this path every animation frame. Bound policy scans so
    // large queues do not multiply into hundreds of full-building scans per second.
    const decisionTime = Number.isFinite(now) ? now : (window.Game.virtualTime || performance.now());
    if (decisionTime - (lift.lastAutomationTime || 0) < 100) return;
    lift.lastAutomationTime = decisionTime;

    // Dispatch to VM for all modes
    if (lift.automation === 'sweep') {
        VM.execute(lift, 'sys_sweep');
    } else if (lift.automation === 'priority-sweep') {
        VM.execute(lift, 'sys_priority');
    } else if (lift.automation === 'voting') {
        VM.execute(lift, 'sys_voting');
    } else if (lift.automation === 'weighted-voting') {
        VM.execute(lift, 'sys_weighted');
    } else if (lift.automation.startsWith('custom_')) {
        VM.execute(lift, lift.automation);
    }
};

window.Game = window.Game || {};
window.Game.Engine = window.Game.Engine || {};
window.Game.Engine.gameTick = window.gameTick;
window.Game.Engine.animationTick = window.animationTick;
window.Game.Engine.getGuestStatusForWait = window.getGuestStatusForWait;
window.Game.Engine.getBoardingDurationMs = window.getBoardingDurationMs;
window.Game.Engine.getGravitySpeedMultiplier = window.getGravitySpeedMultiplier;
