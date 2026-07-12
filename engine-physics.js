// ============================================================================
// ENGINE-PHYSICS.JS : CORE PHYSICS LOOP, BOARDING PROTOCOLS, & PASSENGER DECAY
// ============================================================================

window.gameTick = function() {
    if (!Registry.gameActive) return;
    const now = Date.now();
    
    if (Registry.stats.timeLeft <= 0) {
        window.pauseGame();
        
        Registry.highestUnlockedRound = Math.max(Registry.highestUnlockedRound, Registry.stats.round + 1);
        if (typeof updateLocksUI === 'function') updateLocksUI();
        
        if (Registry.stats.round >= 11) {
            const records = JSON.parse(safeGetItem('liftArcadeBoard', '[]'));
            records.push({ 
                name: Registry.playerName, 
                score: parseInt(Registry.stats.served),
                trophies: Registry.trophyCase 
            });
            records.sort((a, b) => b.score - a.score); 
            safeSetItem('liftArcadeBoard', JSON.stringify(records));
            if (typeof showLeaderboard === 'function') showLeaderboard("You Won!");
        } else {
            if (typeof showRoundReview === 'function') showRoundReview(Registry.stats.round);
        }
        return;
    }

    if (typeof PowerUps !== 'undefined' && PowerUps.tick) PowerUps.tick();
    
    Registry.stats.timeLeft--;

    if (typeof window.runSpawnerTick === 'function') {
        window.runSpawnerTick(now);
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
                lift.jamTimer = Math.floor(seededRandom() * (Config.jamMaxSec - Config.jamMinSec + 1)) + Config.jamMinSec;
            }
            
            if (Registry.stats.round >= 9 && lift.stinkTimer <= 0 && lift.passengers.length > 0) {
                let stinkImmune = lift.freshenerTimer > 0 || (typeof PowerUps !== 'undefined' && PowerUps.timers.stinkImmunity > 0);
                if (seededRandom() < Config.fartChancePerSec && !stinkImmune) {
                    lift.stinkTimer = Config.fartStinkSec;
                    const farterIndex = Math.floor(seededRandom() * lift.passengers.length);
                    lift.passengers[farterIndex].isFarter = true;
                }
            }
        }
    });

    const checkStatus = (g) => {
        const wait = now - g.spawnTime;
        if (wait > Config.criticalSec * 1000) return 'rage';       
        if (wait > Config.annoyedSec * 1000) return 'critical';   
        if (wait > Config.happySec * 1000) return 'annoyed';    
        return 'happy';                        
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
            
            if (g.status === 'rage' && oldStatus !== 'rage') {
                Registry.stats.lives -= (g.isVip ? Config.vipPenalty : 1);
                Registry.roundStats.defenestrationsThisRound++;
                const lobbies = document.querySelectorAll('.lobby');
                if (lobbies.length > 0 && typeof triggerDefenestration === 'function') {
                    triggerDefenestration(lobbies[Config.numFloors - 1 - floorIdx].children[i], floorIdx);
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
            if (p.status === 'rage' && oldStatus !== 'rage') {
                Registry.stats.lives -= (p.isVip ? Config.vipPenalty : 1);
                Registry.roundStats.defenestrationsThisRound++;
                if (typeof triggerDefenestration === 'function') {
                    const currentFloor = Math.round(lift.pos / Registry.floorHeight);
                    triggerDefenestration(null, currentFloor);
                }
            }
        });
        
        for (let i = lift.passengers.length - 1; i >= 0; i--) {
            if (lift.passengers[i].status === 'rage') lift.passengers.splice(i, 1);
        }
    });
    
    if (Registry.stats.lives <= 0) {
        Registry.stats.lives = 0; 
        if (typeof updateScoreboardUI === 'function') updateScoreboardUI();     
        window.pauseGame();
        const records = JSON.parse(safeGetItem('liftArcadeBoard', '[]'));
        records.push({ 
            name: Registry.playerName, 
            score: parseInt(Registry.stats.served),
            trophies: Registry.trophyCase
        });
        records.sort((a, b) => b.score - a.score); 
        safeSetItem('liftArcadeBoard', JSON.stringify(records));
        if (typeof showLeaderboard === 'function') showLeaderboard("Game Over!");
        return;
    }

    if (typeof updateScoreboardUI === 'function') updateScoreboardUI();
    if (typeof draw === 'function') draw();
};

window.animationTick = function() {
    if (!Registry.gameActive) return;
    const now = Date.now();
    let stateChanged = false;

    const pixelsPerSecond = Registry.floorHeight / Config.liftSpeedSec;
    const basePixelsPerTick = pixelsPerSecond * (16 / 1000);

    Registry.lifts.forEach((lift, index) => {
        const car = document.getElementById(`lift-el-${index}`);
        
        if (lift.jamTimer > 0) {
            lift.isJammed = true; 
            if (car && !car.classList.contains('jammed')) car.classList.add('jammed');
            return; 
        } else {
            lift.isJammed = false;
            if (car && car.classList.contains('jammed')) car.classList.remove('jammed');
        }
        
        let gymBroCount = lift.passengers.filter(p => p.isGymBro).length;
        let isStinky = lift.stinkTimer > 0 || gymBroCount >= Config.gymBroStinkThreshold;
        let hasStinkImmunity = lift.freshenerTimer > 0 || (typeof PowerUps !== 'undefined' && PowerUps.timers.stinkImmunity > 0);
        if (hasStinkImmunity) isStinky = false;
        
        if (isStinky) {
            if (car && !car.classList.contains('stinky')) car.classList.add('stinky');
        } else {
            if (car && car.classList.contains('stinky')) car.classList.remove('stinky');
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
            
            if (now - lift.lastActionTime > (Config.boardSpeedSec * 1000)) {
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
                        if (p.isSunset && f === Config.numFloors - 1) {
                            p.isPartying = true;
                            Registry.floors[f].waitingGuests.push(p);
                        } else {
                            Registry.stats.served++;
                            Registry.roundStats.servedThisRound++; 
                            
                            let waitSeconds = (now - p.spawnTime) / 1000;
                            Registry.roundStats.totalWaitTimeServed += Math.max(0, waitSeconds);
                            
                            if (p.isVip) Registry.roundStats.vipServed++;
                            if (p.status === 'happy') Registry.roundStats.happyServed++;
                            else if (p.status === 'annoyed') Registry.roundStats.annoyedServed++;
                            else if (p.status === 'critical') Registry.roundStats.criticalServed++;
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
                            if (g.status === 'rage') return false;
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
                        let scriptId = lift.automation.replace('custom_', ''); 
                        let scriptObj = AutomationWorkshop.scripts.find(s => s.id == scriptId);
                        
                        if (scriptObj && scriptObj.compiledJS) {
                            try {
                                const customLogic = new Function('lift', 'Registry', 'Config', scriptObj.compiledJS);
                                customLogic(lift, Registry, Config);
                            } catch (error) {
                                console.error(`Error in Custom Script [${scriptObj.name}]:`, error);
                                lift.targetFloor = 0; 
                            }
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

                        const criticalTargets = getTargets('critical');
                        const annoyedTargets = getTargets('annoyed');
                        const happyTargets = getTargets('happy');

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
                            if (guest.status === 'rage') return 0;
                            if (lift.automation === 'weighted-voting') {
                                if (guest.status === 'critical') return 4;
                                if (guest.status === 'annoyed') return 2;
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
                            lift.targetFloor = closestFloors[Math.floor(seededRandom() * closestFloors.length)];
                        }
                    }
                }
            }
        }
        
        const liftHeight = Math.min(50, Registry.floorHeight * 0.85);
        const bottomOffset = 40 + (Registry.floorHeight - liftHeight) / 2;
        if (car) car.style.bottom = (lift.pos + bottomOffset) + 'px'; 
    });

    if (stateChanged && typeof draw === 'function') draw();
};