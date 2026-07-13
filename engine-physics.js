// ============================================================================
// ENGINE-PHYSICS.JS : CORE PHYSICS LOOP, BOARDING PROTOCOLS, & PASSENGER DECAY
// ============================================================================

window.gameTick = function(timestamp) {
    if (!Registry.gameActive) return;
    const now = timestamp || Date.now();
    
    try {
        if (Registry.stats.timeLeft <= 0) {
            const engine = GameEngine();
            const ui = GameUI();
            if (typeof engine.pause === 'function') engine.pause();
            
            Registry.highestUnlockedRound = Math.max(Registry.highestUnlockedRound, Registry.stats.round + 1);
            if (typeof ui.updateLocksUI === 'function') ui.updateLocksUI();
            
            if (Registry.stats.round >= 11) {
                const records = JSON.parse(window.Game.Storage.get(window.Game.Keys.LEADERBOARD, '[]'));
                records.push({ 
                    name: Registry.playerName, 
                    score: parseInt(Registry.stats.served),
                    trophies: Registry.trophyCase 
                });
                records.sort((a, b) => b.score - a.score); 
                window.Game.Storage.set(window.Game.Keys.LEADERBOARD, JSON.stringify(records));
                const ui = GameUI();
                if (typeof ui.showLeaderboard === 'function') ui.showLeaderboard("You Won!");
            } else {
                const ui = GameUI();
                if (typeof ui.showRoundReview === 'function') ui.showRoundReview(Registry.stats.round);
            }
            return;
        }
    } catch (e) {
        if (typeof Telemetry !== 'undefined') {
            Telemetry.add('PHYSICS', `Logic crash: ${e.message}`, 'error');
        }
        console.error("Physics Crash", e);
    }

    if (typeof PowerUps !== 'undefined' && PowerUps.tick) PowerUps.tick();
    
    Registry.stats.timeLeft--;

    const spawner = GameSpawner();
    if (typeof spawner.runSpawnerTick === 'function') {
        spawner.runSpawnerTick(now);
    }

    // Process Lift Timers & Hazards
    Registry.lifts.forEach((lift, i) => {
        // Fix for "ghost" jammed border: Ensure isJammed is initialized
        if (typeof lift.isJammed === 'undefined') lift.isJammed = false;
        
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
        
        if (Registry.stats.round >= 6) {
            let jamImmune = typeof PowerUps !== 'undefined' && PowerUps.timers.jamImmunity > 0;
            if (lift.jamTimer <= 0 && seededRandom() < (Config.jamChancePerSec / 60) && !jamImmune) {
                lift.jamTimer = window.getRandomInt(Config.jamMinSec, Config.jamMaxSec) * 60; // Convert sec to roughly 60fps ticks
            }
            
            if (Registry.stats.round >= 9 && lift.stinkTimer <= 0 && lift.passengers.length > 0) {
                let stinkImmune = lift.freshenerTimer > 0 || (typeof PowerUps !== 'undefined' && PowerUps.timers.stinkImmunity > 0);
                if (seededRandom() < (Config.fartChancePerSec / 60) && !stinkImmune) {
                    lift.stinkTimer = Config.fartStinkSec * 60; // Convert sec to ticks
                    const farterIndex = window.getRandomInt(0, lift.passengers.length - 1);
                    lift.passengers[farterIndex].isFarter = true;
                }
            }
        }
    });

    const checkStatus = (g) => {
        const wait = now - g.spawnTime;
        if (wait > Config.criticalSec * 1000) return GuestStatus.RAGE;       
        if (wait > Config.annoyedSec * 1000) return GuestStatus.CRITICAL;   
        if (wait > Config.happySec * 1000) return GuestStatus.ANNOYED;    
        return GuestStatus.HAPPY;                        
    };
    
    // Process Floor Aging Logic
    Registry.floors.forEach((floor, floorIdx) => {
        let isAngerPaused = typeof PowerUps !== 'undefined' && PowerUps.isAngerPaused(floorIdx);
        for (let i = floor.waitingGuests.length - 1; i >= 0; i--) {
            const g = floor.waitingGuests[i];
            
            if (g.isPartying) g.spawnTime += 1000;
            if (isAngerPaused) g.spawnTime += 1000; 
            
            const oldStatus = g.status;
            g.status = checkStatus(g);
            
            if (g.status === GuestStatus.RAGE && oldStatus !== GuestStatus.RAGE) {
                if (typeof window.Game.Audio !== 'undefined') window.Game.Audio.play('error');
                Registry.stats.lives -= (g.isVip ? Config.vipPenalty : 1);
                Registry.roundStats.defenestrationsThisRound++;
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
            p.status = checkStatus(p);
            if (p.status === GuestStatus.RAGE && oldStatus !== GuestStatus.RAGE) {
                Registry.stats.lives -= (p.isVip ? Config.vipPenalty : 1);
                Registry.roundStats.defenestrationsThisRound++;
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
    
    if (Registry.stats.lives <= 0) {
        Registry.stats.lives = 0;
        const ui = GameUI();
        if (typeof ui.updateScoreboardUI === 'function') ui.updateScoreboardUI();
        const engine = GameEngine();
        if (typeof engine.pause === 'function') engine.pause();
        const records = JSON.parse(window.Game.Storage.get(window.Game.Keys.LEADERBOARD, '[]'));
        records.push({
            name: Registry.playerName,
            score: parseInt(Registry.stats.served),
            trophies: Registry.trophyCase
        });
        records.sort((a, b) => b.score - a.score);
        window.Game.Storage.set(window.Game.Keys.LEADERBOARD, JSON.stringify(records));
        if (typeof ui.showLeaderboard === 'function') ui.showLeaderboard("Game Over!");
        return;
    }

    const ui = GameUI();
    if (typeof ui.updateScoreboardUI === 'function') ui.updateScoreboardUI();
};

window.animationTick = function(timestamp) {
    if (!Registry.gameActive) return;
    const now = timestamp || Date.now();

    const ui = GameUI();
    try {
        if (typeof ui.draw === 'function') ui.draw();
    } catch (e) {
        if (typeof Telemetry !== 'undefined') {
            Telemetry.add('RENDER', `Draw crash: ${e.message}`, 'error');
        }
        console.error("Render Crash", e);
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
                let forceExodus = (isStinky && lift.passengers.some(p => !p.isGymBro));
                const hasDropoffs = lift.passengers.some(p => p.dest === f || (forceExodus && !p.isGymBro));
                
                let maxCap = typeof PowerUps !== 'undefined' ? PowerUps.getLiftCapacity(index) : Config.liftCapacity;
                const canPickUp = (Registry.getLiftWeight(lift) < maxCap && Registry.floors[f].waitingGuests.length > 0);
                
                if (hasDropoffs || canPickUp) {
                    lift.state = 'BOARDING';
                    lift.stateProgress = 1.0; 
                    lift.lastActionTime = now;
                } else {
                    if (lift.manualOverride) lift.manualOverride = false;
                    window.runAutomationLogic(lift, index, currentFloor, isStinky, hasStinkImmunity, now);
                }
            }
            
            if (lift.state === 'BOARDING') {
                if (lift.stateProgress >= 1) {
                    let performedAction = false;
                    let forceExodus = (isStinky && lift.passengers.some(p => !p.isGymBro));
                    const indexToDrop = lift.passengers.findIndex(p => p.dest === f || (forceExodus && !p.isGymBro));
                    
                    if (indexToDrop !== -1) {
                        const p = lift.passengers.splice(indexToDrop, 1)[0];
                        if (p.dest === f) {
                            if (typeof window.Game.Audio !== 'undefined') window.Game.Audio.play('ding');
                            if (p.isSunset && f === Config.numFloors - 1) {
                                p.isPartying = true;
                                Registry.floors[f].waitingGuests.push(p);
                            } else {
                                Registry.stats.served++;
                                Registry.roundStats.servedThisRound++; 
                                let waitSeconds = (now - p.spawnTime) / 1000;
                                Registry.roundStats.totalWaitTimeServed += Math.max(0, waitSeconds);
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
                        lift.lastBoardingWeight = p.boardingWeight || 1.0;
                    } 
                    else {
                        let maxCap = typeof PowerUps !== 'undefined' ? PowerUps.getLiftCapacity(index) : Config.liftCapacity;
                        if (Registry.getLiftWeight(lift) < maxCap && Registry.floors[f].waitingGuests.length > 0) {
                            let boardableGuestIndex = Registry.floors[f].waitingGuests.findIndex(g => {
                                let gWeight = g.isGymBro ? 2 : 1;
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

                            if (boardableGuestIndex !== -1) {
                                let parkedLifts = Registry.lifts.filter(l => l.targetFloor === f && Math.abs(l.pos - f * Registry.floorHeight) < 1 && Registry.getLiftWeight(l) < (typeof PowerUps !== 'undefined' ? PowerUps.getLiftCapacity(l.id) : Config.liftCapacity) && l.jamTimer <= 0 && l.stinkTimer <= 0);
                                parkedLifts.sort((a, b) => Registry.getLiftWeight(a) - Registry.getLiftWeight(b));
                                
                                if (parkedLifts.length > 0 && parkedLifts[0].id === lift.id) {
                                    const guestToBoard = Registry.floors[f].waitingGuests.splice(boardableGuestIndex, 1)[0];
                                    if (lift.passengers.length === 0 && (lift.automation === 'sweep' || lift.automation === 'priority-sweep')) {
                                        lift.sweepDirection = guestToBoard.dest > f ? 1 : -1;
                                    }
                                    lift.passengers.push(guestToBoard);
                                    performedAction = true;
                                    lift.stateProgress = 0;
                                    lift.lastBoardingWeight = guestToBoard.boardingWeight || 1.0;
                                }
                            }
                        }
                    }

                    if (!performedAction) {
                        lift.state = 'DOORS_MOVING';
                        lift.stateProgress = 0;
                    }
                } else {
                    const weight = lift.lastBoardingWeight || 1.0;
                    const effectiveBoardSpeed = Config.boardSpeedSec * (Config.boardingSpeedMultiplier || 1.0) * weight;
                    lift.stateProgress += 16 / (effectiveBoardSpeed * 1000);
                }
            }
            else if (lift.state === 'DOORS_MOVING') {
                lift.stateProgress += 16 / (Config.doorSpeedSec * 1000); 
                if (lift.stateProgress >= 1) {
                    lift.state = 'DONE';
                    lift.stateProgress = 0;
                    if (lift.manualOverride) lift.manualOverride = false;
                    window.runAutomationLogic(lift, index, currentFloor, isStinky, hasStinkImmunity, now);
                }
            }
        }
    });
};

window.runAutomationLogic = function(lift, index, currentFloor, isStinky, hasStinkImmunity, now) {
    const VM = window.Game.Automation;
    if (!VM || !lift.automation || lift.automation === 'manual') return;

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