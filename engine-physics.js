// ============================================================================
// ENGINE-PHYSICS.JS : CORE PHYSICS LOOP, BOARDING PROTOCOLS, & PASSENGER DECAY
// ============================================================================

const GameUI = () => (window.Game && window.Game.UI) || window.UI || {};
const GameEngine = () => (window.Game && window.Game.Engine) || window;
const GameSpawner = () => (window.Game && window.Game.Spawner) || window.Spawner || {};

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
    Registry.lifts.forEach(lift => {
        if (lift.isJammed === false) { lift.jamTimer = 0; }
        if (typeof PowerUps !== 'undefined' && PowerUps.timers.jamImmunity > 0) lift.jamTimer = 0;

        if (lift.jamTimer > 0) lift.jamTimer--;
        if (lift.stinkTimer > 0) lift.stinkTimer--;
        if (lift.tardisTimer > 0) lift.tardisTimer--;
        if (lift.turboTimer > 0) lift.turboTimer--; 
        if (lift.freshenerTimer > 0) lift.freshenerTimer--;
        if (lift.musakTimer > 0) lift.musakTimer--;
        
        if (Registry.stats.round >= 6) {
            let jamImmune = typeof PowerUps !== 'undefined' && PowerUps.timers.jamImmunity > 0;
            if (lift.jamTimer <= 0 && seededRandom() < Config.jamChancePerSec && !jamImmune) {
                lift.jamTimer = window.getRandomInt(Config.jamMinSec, Config.jamMaxSec);
            }
            
            if (Registry.stats.round >= 9 && lift.stinkTimer <= 0 && lift.passengers.length > 0) {
                let stinkImmune = lift.freshenerTimer > 0 || (typeof PowerUps !== 'undefined' && PowerUps.timers.stinkImmunity > 0);
                if (seededRandom() < Config.fartChancePerSec && !stinkImmune) {
                    lift.stinkTimer = Config.fartStinkSec;
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

    let stateChanged = false;

    const pixelsPerSecond = Registry.floorHeight / Config.liftSpeedSec;
    const basePixelsPerTick = pixelsPerSecond * (16 / 1000);

    Registry.lifts.forEach((lift, index) => {
        const ui = GameUI();
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

        if (Math.abs(lift.pos - targetPos) > actualPixelsPerTick) {
            lift.pos += (targetPos > lift.pos) ? actualPixelsPerTick : -actualPixelsPerTick;
        } else {
            lift.pos = targetPos; 
            
            const effectiveBoardSpeed = Config.boardSpeedSec * (Config.boardingSpeedMultiplier || 1.0);
            if (now - lift.lastActionTime > (effectiveBoardSpeed * 1000)) {
                const f = lift.targetFloor;
                let performedAction = false;
                
                let forceExodus = (isStinky && lift.passengers.some(p => !p.isGymBro));
                const indexToDrop = lift.passengers.findIndex(p => p.dest === f || (forceExodus && !p.isGymBro));
                
                if (indexToDrop !== -1) {
                    if (Registry.getLiftWeight(lift) >= Config.liftCapacity && !lift.sardineScored) {
                        Registry.roundStats.fullyLoadedLifts++;
                        lift.sardineScored = true;
                    }
                    
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
                    
                    if (lift.passengers.length === 0) {
                        lift.sardineScored = false; 
                    }
                    
                    performedAction = true;
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
                            return (f === 0 || f === Config.numFloors - 1 || guestDir === lift.sweepDirection || lift.passengers.length === 0);
                        });

                        if (boardableGuestIndex !== -1) {
                            let parkedLifts = Registry.lifts.filter(l => l.targetFloor === f && Math.abs(l.pos - f * Registry.floorHeight) < 1 && Registry.getLiftWeight(l) < (typeof PowerUps !== 'undefined' ? PowerUps.getLiftCapacity(l.id) : Config.liftCapacity) && l.jamTimer <= 0 && l.stinkTimer <= 0);
                            parkedLifts.sort((a, b) => Registry.getLiftWeight(a) - Registry.getLiftWeight(b));
                            
                            if (parkedLifts.length > 0 && parkedLifts[0].id === lift.id) {
                                const guestToBoard = Registry.floors[f].waitingGuests.splice(boardableGuestIndex, 1)[0];
                                lift.passengers.push(guestToBoard);
                                performedAction = true;
                                
                                if (lift.passengers.length === 1 && (lift.automation === 'sweep' || lift.automation === 'priority-sweep')) {
                                    lift.sweepDirection = guestToBoard.dest > f ? 1 : -1;
                                }
                            }
                        }
                    }
                }

                if (performedAction) {
                    lift.lastActionTime = now;
                    stateChanged = true;
                } else {
                    if (lift.manualOverride) lift.manualOverride = false;

                    if (lift.automation.startsWith('custom_') && !lift.manualOverride) {
                        if (window.Game.Automation) {
                            window.Game.Automation.execute(lift, lift.automation);
                        }
                    }
                    else if (lift.automation === 'sweep' && !lift.manualOverride) {
                        let nextTarget = -1;
                        let maxCap = typeof PowerUps !== 'undefined' ? PowerUps.getLiftCapacity(index) : Config.liftCapacity;
                        
                        const findValidStop = (dir) => {
                            for (let checkF = currentFloor + dir; checkF >= 0 && checkF < Config.numFloors; checkF += dir) {
                                if (lift.passengers.some(p => p.dest === checkF)) return checkF;
                                if (Registry.getLiftWeight(lift) < maxCap && lift.stinkTimer <= 0 && (!isStinky || (hasStinkImmunity))) {
                                    const hasValidWaiter = Registry.floors[checkF].waitingGuests.some(g => {
                                        const guestDir = g.dest > checkF ? 1 : -1;
                                        if (isStinky && !g.isGymBro) return false;
                                        return checkF === 0 || checkF === Config.numFloors - 1 || guestDir === dir || lift.passengers.length === 0;
                                    });
                                    if (hasValidWaiter) return checkF;
                                }
                            }
                            return -1;
                        };

                        nextTarget = findValidStop(lift.sweepDirection);
                        if (nextTarget === -1) {
                            lift.sweepDirection *= -1;
                            nextTarget = findValidStop(lift.sweepDirection);
                        }
                        if (nextTarget !== -1) lift.targetFloor = nextTarget;
                    }
                    else if (lift.automation === 'priority-sweep' && !lift.manualOverride) {
                        let nextTarget = -1;
                        let maxCap = typeof PowerUps !== 'undefined' ? PowerUps.getLiftCapacity(index) : Config.liftCapacity;
                        
                        const getTargets = (status) => {
                            let targets = new Set();
                            lift.passengers.forEach(p => { if (p.status === status) targets.add(p.dest); });
                            if (Registry.getLiftWeight(lift) < maxCap && lift.stinkTimer <= 0 && (!isStinky || (hasStinkImmunity))) {
                                Registry.floors.forEach((floor, checkF) => {
                                    if (floor.waitingGuests.some(g => g.status === status && (!isStinky || g.isGymBro))) targets.add(checkF);
                                });
                            }
                            return Array.from(targets);
                        };

                        const criticalTargets = getTargets(GuestStatus.CRITICAL);
                        const annoyedTargets = getTargets(GuestStatus.ANNOYED);
                        const happyTargets = getTargets(GuestStatus.HAPPY);

                        let activeTargets = [];
                        if (criticalTargets.length > 0) activeTargets = criticalTargets;
                        else if (annoyedTargets.length > 0) activeTargets = annoyedTargets;
                        else if (happyTargets.length > 0) activeTargets = happyTargets;

                        if (activeTargets.length > 0) {
                            const targetsAhead = activeTargets.filter(t => lift.sweepDirection === 1 ? t > currentFloor : t < currentFloor);

                            if (targetsAhead.length > 0) {
                                nextTarget = targetsAhead.reduce((a, b) => Math.abs(a - currentFloor) < Math.abs(b - currentFloor) ? a : b);
                            } else {
                                lift.sweepDirection *= -1;
                                const targetsNewAhead = activeTargets.filter(t => lift.sweepDirection === 1 ? t > currentFloor : t < currentFloor);
                                if (targetsNewAhead.length > 0) {
                                    nextTarget = targetsNewAhead.reduce((a, b) => Math.abs(a - currentFloor) < Math.abs(b - currentFloor) ? a : b);
                                } else if (activeTargets.includes(currentFloor)) {
                                    nextTarget = currentFloor;
                                }
                            }
                        }
                        if (nextTarget !== -1) lift.targetFloor = nextTarget;
                    }
                    else if ((lift.automation === 'voting' || lift.automation === 'weighted-voting') && !lift.manualOverride) {
                        let bestFloors = [];
                        let maxScore = -1;
                        let maxCap = typeof PowerUps !== 'undefined' ? PowerUps.getLiftCapacity(index) : Config.liftCapacity;

                        const getGuestWeight = (guest) => {
                            if (guest.status === GuestStatus.RAGE) return 0;
                            if (lift.automation === 'weighted-voting') {
                                if (guest.status === GuestStatus.CRITICAL) return 4;
                                if (guest.status === GuestStatus.ANNOYED) return 2;
                                return 1; 
                            }
                            return 1; 
                        };

                        for (let checkF = 0; checkF < Config.numFloors; checkF++) {
                            let score = 0;
                            lift.passengers.forEach(p => { if (p.dest === checkF) score += getGuestWeight(p); });
                            
                            if (Registry.getLiftWeight(lift) < maxCap && lift.stinkTimer <= 0 && (!isStinky || (hasStinkImmunity))) {
                                Registry.floors[checkF].waitingGuests.forEach(g => { 
                                    if (!isStinky || g.isGymBro) score += getGuestWeight(g); 
                                });
                            }

                            if (score > maxScore && score > 0) {
                                maxScore = score;
                                bestFloors = [checkF];
                            } else if (score === maxScore && score > 0) {
                                bestFloors.push(checkF);
                            }
                        }

                        if (bestFloors.length > 0) {
                            let minDistance = Infinity;
                            let closestFloors = [];
                            bestFloors.forEach(f => {
                                let dist = Math.abs(f - currentFloor);
                                if (dist < minDistance) {
                                    minDistance = dist;
                                    closestFloors = [f];
                                } else if (dist === minDistance) {
                                    closestFloors.push(f);
                                }
                            });
                            lift.targetFloor = closestFloors[window.getRandomInt(0, closestFloors.length - 1)];
                        }
                    }
                    else if (lift.automation.startsWith('custom_') && !lift.manualOverride) {
                        const scriptId = lift.automation.replace('custom_', '');
                        if (typeof AutomationVM !== 'undefined' && typeof AutomationVM.execute === 'function') {
                            AutomationVM.execute(lift, scriptId);
                        }
                    }
                }
            }
        }
        
    });
};

window.Game = window.Game || {};
window.Game.Engine = window.Game.Engine || {};
window.Game.Engine.gameTick = window.gameTick;
window.Game.Engine.animationTick = window.animationTick;
window.gameTick = window.Game.Engine.gameTick;
window.animationTick = window.Game.Engine.animationTick;