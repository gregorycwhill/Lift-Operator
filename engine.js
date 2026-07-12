// ============================================================================
// ENGINE.JS : CORE GAME LOOP & ROUTING LOGIC
// ============================================================================

window.SHARE_SECRET = "ELEVATOR_GO_BRRR_2026";

window.encodePayload = function(payloadObj) {
    try {
        const str = JSON.stringify(payloadObj);
        let xorStr = '';
        for (let i = 0; i < str.length; i++) {
            xorStr += String.fromCharCode(str.charCodeAt(i) ^ window.SHARE_SECRET.charCodeAt(i % window.SHARE_SECRET.length));
        }
        // Double-wrap encodeURIComponent to ensure Base64 handles extended characters safely
        return encodeURIComponent(btoa(encodeURIComponent(xorStr)));
    } catch (e) {
        console.error("Failed to encode payload.", e);
        return null;
    }
};

window.decodePayload = function(encodedStr) {
    try {
        const xorStr = decodeURIComponent(atob(decodeURIComponent(encodedStr)));
        let str = '';
        for (let i = 0; i < xorStr.length; i++) {
            str += String.fromCharCode(xorStr.charCodeAt(i) ^ window.SHARE_SECRET.charCodeAt(i % window.SHARE_SECRET.length));
        }
        return JSON.parse(str);
    } catch (e) {
        console.warn("Invalid or tampered share link detected. Ignoring.");
        return null;
    }
};

window.handleSharedData = function(encodedStr) {
    const payload = window.decodePayload(encodedStr);
    if (!payload || !payload.type) return;

    if (payload.type === 'leaderboard') {
        const incomingScores = payload.data || [];
        const localScores = JSON.parse(safeGetItem('liftArcadeBoard', '[]'));
        
        // Merge them together
        const combined = [...localScores, ...incomingScores];
        
        // Deduplicate (so if they click the link twice, it doesn't spam the board)
        const uniqueMap = new Map();
        combined.forEach(record => {
            const key = `${record.name}-${record.score}`;
            if (!uniqueMap.has(key)) uniqueMap.set(key, record);
        });
        
        const mergedScores = Array.from(uniqueMap.values());
        mergedScores.sort((a, b) => b.score - a.score);
        
        // Save Top 100
        safeSetItem('liftArcadeBoard', JSON.stringify(mergedScores.slice(0, 100)));
        
        if (typeof showToast === 'function') showToast("🏆 Leaderboard synced with challenger!");
        
        // Scrub the URL clean so refreshing doesn't re-trigger it
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    // Future integration points:
    // else if (payload.type === 'invite') { ... }
    // else if (payload.type === 'blueprint') { ... }
};

function pauseGame() {
    if (!Registry.gameActive) return;
    Registry.gameActive = false;
    Registry.pauseStartTime = Date.now();
}

function resumeGame() {
    if (Registry.gameActive) return;
    if (Registry.pauseStartTime > 0) {
        const duration = Date.now() - Registry.pauseStartTime;
        Registry.floors.forEach(f => f.waitingGuests.forEach(g => g.spawnTime += duration));
        Registry.lifts.forEach(l => {
            l.passengers.forEach(g => g.spawnTime += duration);
            l.lastActionTime += duration;
        });
        Registry.lastSpawnTime += duration;
        if (Registry.vipTargetTime > 0) Registry.vipTargetTime += duration;
        if (Registry.sunsetTargetTime > 0) Registry.sunsetTargetTime += duration;
        if (Registry.sunsetEndTime > 0) Registry.sunsetEndTime += duration;
        Registry.pauseStartTime = 0;
    }
    Registry.gameActive = true;
}

window.setLiftTarget = function(liftIndex, targetFloor) {
    if (typeof PowerUps !== 'undefined' && PowerUps.activeTargeting) {
        if (PowerUps.resolveTargeting(liftIndex, targetFloor)) return; 
    }
    
    if (!Registry.gameActive) return;
    
    if (Registry.lifts[liftIndex]) {
        Registry.roundStats.manualClicks++;
        
        Registry.lifts[liftIndex].targetFloor = targetFloor;
        Registry.lifts[liftIndex].manualOverride = true;
        const currentFloor = Math.round(Registry.lifts[liftIndex].pos / Registry.floorHeight);
        if (targetFloor > currentFloor) Registry.lifts[liftIndex].sweepDirection = 1;
        else if (targetFloor < currentFloor) Registry.lifts[liftIndex].sweepDirection = -1;
    }
};

window.setLiftAutomation = function(liftIndex, mode) {
    if (Registry.lifts[liftIndex]) {
        Registry.lifts[liftIndex].automation = mode;
        if (mode !== 'manual') Registry.lifts[liftIndex].manualOverride = false;
        
        const car = document.getElementById(`lift-el-${liftIndex}`);
        if (car) {
            car.classList.remove('sweep-mode', 'priority-sweep-mode', 'voting-mode', 'weighted-voting-mode', 'custom-mode');
            if (mode === 'sweep') car.classList.add('sweep-mode');
            if (mode === 'priority-sweep') car.classList.add('priority-sweep-mode');
            if (mode === 'voting') car.classList.add('voting-mode');
            if (mode === 'weighted-voting') car.classList.add('weighted-voting-mode');
            if (mode.startsWith('custom_')) car.classList.add('custom-mode');
        }
    }
};

function forceFirstSpawn(now) {
    let start = Math.floor(seededRandom() * Config.numFloors);
    let dest;
    if (Registry.stats.round === 7 && seededRandom() < Config.checkoutChance) {
        dest = 0;
        if (start === 0) start = Math.floor(seededRandom() * (Config.numFloors - 1)) + 1;
    } else {
        dest = Math.floor(seededRandom() * Config.numFloors);
        while (dest === start) dest = Math.floor(seededRandom() * Config.numFloors);
    }
    let isGym = (start === Registry.gymFloor);
    Registry.floors[start].waitingGuests.push({dest: dest, status: 'happy', spawnTime: now, isVip: false, isFarter: false, isSunset: false, isPartying: false, isGymBro: isGym});
    Registry.lastSpawnTime = now;
}

window.openWorkshopModal = function() {
    if(typeof pauseGame === 'function') pauseGame();
    const ws = document.getElementById('workshopOverlay');
    if (ws) ws.style.display = 'flex';
    
    if (typeof AutomationWorkshop !== 'undefined' && AutomationWorkshop.workspace) {
        setTimeout(() => Blockly.svgResize(AutomationWorkshop.workspace), 50);
    } else if (typeof AutomationWorkshop !== 'undefined' && !AutomationWorkshop.workspace) {
        AutomationWorkshop.init();
    }
};

document.addEventListener("DOMContentLoaded", () => {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        
        // INTERCEPT GENERALIZED SHARE PAYLOADS
        const dataParam = urlParams.get('Data') || urlParams.get('data');
        if (dataParam) {
            window.handleSharedData(dataParam);
        }
        
        const gameIdParam = urlParams.get('GameID') || urlParams.get('gameid');
        const seedInput = document.getElementById('gameSeed');
        if (gameIdParam && !isNaN(parseInt(gameIdParam)) && seedInput) {
            seedInput.value = gameIdParam;
        }

        if (Config.debugMode) {
            Registry.points = 99999;
            Registry.highestUnlockedRound = 11;
        }

        Config.numFloors = 10;
        Registry.floors = Array.from({length: Config.numFloors}, () => ({ waitingGuests: [] }));
        for(let i=0; i<Config.liftsR1; i++) {
            Registry.lifts.push({ id: i, targetFloor: 0, pos: 0, passengers: [], lastActionTime: 0, automation: 'manual', sweepDirection: 1, manualOverride: false, jamTimer: 0, stinkTimer: 0, tardisTimer: 0, teleportTimer: 0, freshenerTimer: 0, musakTimer: 0, sardineScored: false });
        }

        buildWorld();
        renderDebugMenu();
        showRoundModal(1);
        
        if (typeof AutomationWorkshop !== 'undefined' && typeof AutomationWorkshop.init === 'function') {
            AutomationWorkshop.init();
        }

        const wsBtn = document.getElementById('openWorkshopBtn');
        if (wsBtn) {
            wsBtn.innerText = "Workshop"; // UI Name Polish
            const newBtn = wsBtn.cloneNode(true);
            wsBtn.parentNode.replaceChild(newBtn, wsBtn);
            newBtn.addEventListener('click', window.openWorkshopModal);
        }

        document.addEventListener('contextmenu', (e) => {
            if (typeof PowerUps !== 'undefined' && PowerUps.activeTargeting) {
                e.preventDefault();
                PowerUps.cancelTargeting();
            }
        });

        document.getElementById('startRoundBtn')?.addEventListener('click', () => {
            if (typeof window.checkoutCart === 'function') window.checkoutCart();
            
            if (Registry.stats.round === 1) {
                Registry.playerName = document.getElementById('playerName')?.value || "Pilot 1";
                safeSetItem('lastPlayer', Registry.playerName);
                if (document.getElementById('pilotNameDisplay')) document.getElementById('pilotNameDisplay').innerText = Registry.playerName;
                
                let rawSeed = document.getElementById('gameSeed').value;
                if (rawSeed && !isNaN(parseInt(rawSeed))) Registry.seed = parseInt(rawSeed);
                else Registry.seed = Math.floor(Math.random() * 9000) + 1000;
                setSeed(Registry.seed);
                document.getElementById('seedDisplay').innerText = Registry.seed;
                
                if (typeof AutomationWorkshop !== 'undefined' && typeof AutomationWorkshop.loadScriptsFromStorage === 'function') {
                    AutomationWorkshop.loadScriptsFromStorage();
                    buildWorld();
                }
            }
            
            document.getElementById('roundModalOverlay').style.display = 'none';
            if (Registry.pauseStartTime === 0) forceFirstSpawn(Date.now()); 
            resumeGame();
            draw();
        });

        document.getElementById('continueToBriefingBtn')?.addEventListener('click', () => {
            document.getElementById('roundReviewOverlay').style.display = 'none';
            showRoundModal(Registry.stats.round + 1);
        });

        document.getElementById('leaderboardBtn')?.addEventListener('click', () => showLeaderboard("Paused"));
        document.getElementById('closeLbBtn')?.addEventListener('click', () => {
            document.getElementById('leaderboardOverlay').style.display = 'none';
            resumeGame();
            draw();
        });
        
        document.getElementById('restartBtn')?.addEventListener('click', () => {
            document.getElementById('leaderboardOverlay').style.display = 'none';
            resetGame();
        });
        document.getElementById('lbRestartBtn')?.addEventListener('click', () => {
            document.getElementById('leaderboardOverlay').style.display = 'none';
            resetGame();
        });
        
        document.getElementById('openDebugBtn')?.addEventListener('click', () => {
            pauseGame();
            renderDebugMenu(); 
            document.getElementById('debugOverlay').style.display = 'flex';
        });
        
        document.getElementById('closeDebugBtn')?.addEventListener('click', () => {
            document.getElementById('debugOverlay').style.display = 'none';
            if (Registry.floors.length !== Config.numFloors) resetGame();
            else resumeGame();
        });

        document.getElementById('jumpRoundBtn')?.addEventListener('click', () => {
            const targetRound = parseInt(document.getElementById('jumpRoundSelect').value);
            document.getElementById('debugOverlay').style.display = 'none';
            skipToRound(targetRound);
        });

        setInterval(gameTick, 1000); 
        setInterval(animationTick, 16); 
        draw(); 
    } catch (err) {
        console.error("Game Initialization Error: ", err);
    }
});

function resetGame() {
    Registry.stats.round = 1;
    Registry.stats.timeLeft = Config.roundTime;
    Registry.stats.lives = Config.startingLives;
    Registry.stats.served = 0;
    Registry.stats.currentSpawnChance = Config.spawnR1Start;
    Registry.vipSpawned = false; Registry.vipTargetTime = 0;
    Registry.sunsetHasHappened = false; Registry.sunsetTargetTime = 0; Registry.sunsetActive = false; Registry.sunsetEndTime = 0;
    Registry.gymFloor = -1;
    
    if (Config.debugMode) {
        Registry.points = 99999;
        Registry.highestUnlockedRound = 11;
    } else {
        Registry.points = 0;
    }
    
    if (typeof PowerUps !== 'undefined') {
        PowerUps.cart = [];
        PowerUps.inventory = [];
        PowerUps.activeTargeting = null;
        Object.keys(PowerUps.timers).forEach(k => PowerUps.timers[k] = 0);
    }
    
    Registry.roundStats = { manualClicks: 0, jammedLiftsFixed: 0, fullyLoadedLifts: 0, servedThisRound: 0 };
    
    Config.numFloors = 10;
    setSeed(Registry.seed);

    Registry.lifts = [];
    for(let i=0; i<Config.liftsR1; i++) Registry.lifts.push({ id: i, targetFloor: 0, pos: 0, passengers: [], lastActionTime: 0, automation: 'manual', sweepDirection: 1, manualOverride: false, jamTimer: 0, stinkTimer: 0, tardisTimer: 0, teleportTimer: 0, freshenerTimer: 0, musakTimer: 0, sardineScored: false });
    Registry.floors = Array.from({length: Config.numFloors}, () => ({ waitingGuests: [] }));
    
    buildWorld(); updateScoreboardUI(); draw(); showRoundModal(1);
}

function skipToRound(targetRound) {
    Registry.stats.round = targetRound;
    Registry.stats.timeLeft = Config.roundTime;
    Registry.stats.lives = Config.startingLives;
    Registry.vipSpawned = false; Registry.vipTargetTime = 0;
    Registry.sunsetHasHappened = false; Registry.sunsetTargetTime = 0; Registry.sunsetActive = false; Registry.sunsetEndTime = 0;
    Registry.gymFloor = -1;
    
    if (typeof PowerUps !== 'undefined') {
        PowerUps.cart = [];
        PowerUps.inventory = [];
        PowerUps.activeTargeting = null;
        Object.keys(PowerUps.timers).forEach(k => PowerUps.timers[k] = 0);
    }
    
    Registry.roundStats = { manualClicks: 0, jammedLiftsFixed: 0, fullyLoadedLifts: 0, servedThisRound: 0 };
    
    Config.numFloors = targetRound >= 6 ? 15 : 10;
    
    let numLifts = Config.liftsR1;
    if (targetRound === 2) { numLifts = Config.liftsR2; Registry.stats.currentSpawnChance = Config.spawnR2Start; }
    else if (targetRound === 3) { numLifts = Config.liftsR3; Registry.stats.currentSpawnChance = Config.spawnR3Start; }
    else if (targetRound === 4) { numLifts = Config.liftsR4; Registry.stats.currentSpawnChance = Config.spawnR4Start; }
    else if (targetRound === 5) { numLifts = Config.liftsR5; Registry.stats.currentSpawnChance = Config.spawnR5Start; }
    else if (targetRound === 6) { numLifts = Config.liftsR6; Registry.stats.currentSpawnChance = Config.spawnR6Start; }
    else if (targetRound === 7) { numLifts = Config.liftsR7; Registry.stats.currentSpawnChance = Config.spawnR7Start; }
    else if (targetRound === 8) { 
        numLifts = Config.liftsR8; Registry.stats.currentSpawnChance = Config.spawnR8Start; 
        const spawnDelaySec = Math.floor(seededRandom() * (Config.vipSpawnMaxSec - Config.vipSpawnMinSec + 1)) + Config.vipSpawnMinSec;
        Registry.vipTargetTime = Date.now() + (spawnDelaySec * 1000);
    }
    else if (targetRound === 9) { 
        numLifts = Config.liftsR9; Registry.stats.currentSpawnChance = Config.spawnR9Start; 
        const sunsetDelaySec = Math.floor(seededRandom() * (Config.sunsetMaxSec - Config.sunsetMinSec + 1)) + Config.sunsetMinSec;
        Registry.sunsetTargetTime = Date.now() + (sunsetDelaySec * 1000);
    }
    else if (targetRound === 10) { numLifts = Config.liftsR10; Registry.stats.currentSpawnChance = Config.spawnR10Start; }
    else if (targetRound === 11) { 
        numLifts = Config.liftsR11; Registry.stats.currentSpawnChance = Config.spawnR11Start; 
        Registry.gymFloor = Math.floor(seededRandom() * (Config.numFloors - 2)) + 1;
    }
    
    Registry.lifts = [];
    for(let i=0; i<numLifts; i++) Registry.lifts.push({ id: i, targetFloor: 0, pos: 0, passengers: [], lastActionTime: 0, automation: 'manual', sweepDirection: 1, manualOverride: false, jamTimer: 0, stinkTimer: 0, tardisTimer: 0, teleportTimer: 0, freshenerTimer: 0, musakTimer: 0, sardineScored: false });
    Registry.floors = Array.from({length: Config.numFloors}, () => ({ waitingGuests: [] }));
    
    buildWorld(); updateScoreboardUI(); draw(); showRoundModal(targetRound);
}

function gameTick() {
    if (!Registry.gameActive) return;
    const now = Date.now();
    
    if (typeof PowerUps !== 'undefined' && PowerUps.tick) PowerUps.tick();
    
    Registry.stats.timeLeft--;
    
    if (Registry.stats.timeLeft <= 0) {
        pauseGame();
        
        Registry.highestUnlockedRound = Math.max(Registry.highestUnlockedRound, Registry.stats.round + 1);
        if (typeof updateLocksUI === 'function') updateLocksUI();
        
        if (Registry.stats.round >= 11) {
            const records = JSON.parse(safeGetItem('liftArcadeBoard', '[]'));
            records.push({ name: Registry.playerName, score: parseInt(Registry.stats.served) });
            records.sort((a, b) => b.score - a.score); 
            safeSetItem('liftArcadeBoard', JSON.stringify(records));
            if (typeof showLeaderboard === 'function') showLeaderboard("You Won!");
        } else {
            if (typeof showRoundReview === 'function') showRoundReview(Registry.stats.round);
        }
        return;
    }

    const progress = (Config.roundTime - Registry.stats.timeLeft) / Config.roundTime;
    if (Registry.stats.round === 1) Registry.stats.currentSpawnChance = Config.spawnR1Start + ((Config.spawnR1End - Config.spawnR1Start) * progress); 
    else if (Registry.stats.round === 2) Registry.stats.currentSpawnChance = Config.spawnR2Start + ((Config.spawnR2End - Config.spawnR2Start) * progress); 
    else if (Registry.stats.round === 3) Registry.stats.currentSpawnChance = Config.spawnR3Start + ((Config.spawnR3End - Config.spawnR3Start) * progress); 
    else if (Registry.stats.round === 4) Registry.stats.currentSpawnChance = Config.spawnR4Start + ((Config.spawnR4End - Config.spawnR4Start) * progress); 
    else if (Registry.stats.round === 5) Registry.stats.currentSpawnChance = Config.spawnR5Start + ((Config.spawnR5End - Config.spawnR5Start) * progress); 
    else if (Registry.stats.round === 6) Registry.stats.currentSpawnChance = Config.spawnR6Start + ((Config.spawnR6End - Config.spawnR6Start) * progress); 
    else if (Registry.stats.round === 7) Registry.stats.currentSpawnChance = Config.spawnR7Start + ((Config.spawnR7End - Config.spawnR7Start) * progress); 
    else if (Registry.stats.round === 8) Registry.stats.currentSpawnChance = Config.spawnR8Start + ((Config.spawnR8End - Config.spawnR8Start) * progress); 
    else if (Registry.stats.round === 9) Registry.stats.currentSpawnChance = Config.spawnR9Start + ((Config.spawnR9End - Config.spawnR9Start) * progress); 
    else if (Registry.stats.round === 10) Registry.stats.currentSpawnChance = Config.spawnR10Start + ((Config.spawnR10End - Config.spawnR10Start) * progress);
    else if (Registry.stats.round === 11) Registry.stats.currentSpawnChance = Config.spawnR11Start + ((Config.spawnR11End - Config.spawnR11Start) * progress); 

    if (Registry.stats.round >= 8 && !Registry.vipSpawned && now >= Registry.vipTargetTime && Registry.vipTargetTime !== 0) {
        let start = Math.floor(seededRandom() * Config.numFloors);
        let dest = Math.floor(seededRandom() * Config.numFloors);
        while (dest === start) dest = Math.floor(seededRandom() * Config.numFloors);
        
        let isGym = (start === Registry.gymFloor);
        Registry.floors[start].waitingGuests.push({
            dest: dest, status: 'annoyed', spawnTime: now - (Config.happySec * 1000) - 100, 
            isVip: true, isFarter: false, isSunset: false, isPartying: false, isGymBro: isGym
        });
        Registry.vipSpawned = true;
    }

    if (Registry.stats.round >= 9) {
        if (Registry.sunsetActive) {
            if (now >= Registry.sunsetEndTime) {
                Registry.sunsetActive = false;
                const revertGuest = (g) => {
                    if (g.isSunset) {
                        g.isSunset = false; g.dest = g.originalDest;
                        if (g.isPartying) { g.isPartying = false; g.spawnTime = now; }
                    }
                };
                Registry.floors.forEach(f => f.waitingGuests.forEach(revertGuest));
                Registry.lifts.forEach(l => l.passengers.forEach(revertGuest));
            }
        } else if (!Registry.sunsetHasHappened && now >= Registry.sunsetTargetTime && Registry.sunsetTargetTime !== 0) {
            Registry.sunsetActive = true;
            Registry.sunsetHasHappened = true;
            Registry.sunsetEndTime = now + (Config.sunsetDurationSec * 1000);
            
            const infectGuest = (g) => {
                if (!g.isVip && seededRandom() < Config.sunsetGuestRatio) {
                    g.isSunset = true; g.originalDest = g.dest; g.dest = Config.numFloors - 1; 
                }
            };
            Registry.floors.forEach(f => f.waitingGuests.forEach(infectGuest));
            Registry.lifts.forEach(l => l.passengers.forEach(infectGuest));
        }
    }

    let tempChance = Registry.stats.currentSpawnChance;
    let spawnedThisTick = false;
    
    while (tempChance > 0) {
        if (seededRandom() < tempChance) {
            let start = Math.floor(seededRandom() * Config.numFloors);
            let dest;
            
            if (Registry.stats.round === 7 && seededRandom() < Config.checkoutChance) {
                dest = 0;
                if (start === 0) start = Math.floor(seededRandom() * (Config.numFloors - 1)) + 1;
            } else {
                dest = Math.floor(seededRandom() * Config.numFloors);
                while (dest === start) dest = Math.floor(seededRandom() * Config.numFloors);
            }
            
            let isGym = (start === Registry.gymFloor);
            let newGuest = {dest: dest, status: 'happy', spawnTime: now, isVip: false, isFarter: false, isSunset: false, isPartying: false, isGymBro: isGym};
            
            if (Registry.sunsetActive && !newGuest.isVip && seededRandom() < Config.sunsetGuestRatio) {
                newGuest.isSunset = true; newGuest.originalDest = newGuest.dest; newGuest.dest = Config.numFloors - 1;
            }
            Registry.floors[start].waitingGuests.push(newGuest);
            spawnedThisTick = true;
        }
        tempChance -= 1.0;
    }
    
    if (spawnedThisTick) {
        Registry.lastSpawnTime = now;
    } else if (now - Registry.lastSpawnTime >= Config.maxSpawnDelaySec * 1000) {
        forceFirstSpawn(now); 
    }

    // Process Lift Timers
    Registry.lifts.forEach(lift => {
        if (lift.jamTimer > 0) lift.jamTimer--;
        if (lift.stinkTimer > 0) lift.stinkTimer--;
        if (lift.tardisTimer > 0) lift.tardisTimer--;
        if (lift.teleportTimer > 0) lift.teleportTimer--;
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
                const lobbies = document.querySelectorAll('.lobby');
                if (lobbies.length > 0) triggerDefenestration(lobbies[Config.numFloors - 1 - floorIdx].children[i], floorIdx);
                floor.waitingGuests.splice(i, 1);
            }
        }
    });
    
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
                const carEl = document.getElementById(`lift-el-${index}`);
                const currentFloor = Math.round(lift.pos / Registry.floorHeight);
                if (carEl) triggerDefenestration(null, currentFloor); 
            }
        });
        
        for (let i = lift.passengers.length - 1; i >= 0; i--) {
            if (lift.passengers[i].status === 'rage') lift.passengers.splice(i, 1);
        }
    });
    
    if (Registry.stats.lives <= 0) {
        Registry.stats.lives = 0; // Lock to zero so it doesn't display negative
        updateScoreboardUI();     // Force UI update before ending game
        pauseGame();
        const records = JSON.parse(safeGetItem('liftArcadeBoard', '[]'));
        records.push({ name: Registry.playerName, score: parseInt(Registry.stats.served) });
        records.sort((a, b) => b.score - a.score); 
        safeSetItem('liftArcadeBoard', JSON.stringify(records));
        if (typeof showLeaderboard === 'function') showLeaderboard("Game Over!");
        return;
    }

    updateScoreboardUI();
    draw();
}

function animationTick() {
    if (!Registry.gameActive) return;
    const now = Date.now();
    let stateChanged = false;

    const pixelsPerSecond = Registry.floorHeight / Config.liftSpeedSec;
    const pixelsPerTick = pixelsPerSecond * (16 / 1000);

    Registry.lifts.forEach((lift, index) => {
        const car = document.getElementById(`lift-el-${index}`);
        
        if (lift.jamTimer > 0) {
            if (car && !car.classList.contains('jammed')) car.classList.add('jammed');
            return; 
        } else {
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
        
        let isTeleporting = lift.teleportTimer > 0 || (typeof PowerUps !== 'undefined' && PowerUps.timers.globalTeleport > 0);
        let actualPixelsPerTick = isTeleporting ? 999999 : pixelsPerTick;

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

    if (stateChanged) draw();
}

function draw() {
    const topFloorRow = document.getElementById(`floor-row-${Config.numFloors - 1}`);
    if (topFloorRow) {
        if (Registry.sunsetActive) { if (!topFloorRow.classList.contains('rooftop-party')) topFloorRow.classList.add('rooftop-party'); }
        else { if (topFloorRow.classList.contains('rooftop-party')) topFloorRow.classList.remove('rooftop-party'); }
    }

    Registry.lifts.forEach((lift, index) => {
        const car = document.getElementById(`lift-el-${index}`);
        if (car) {
            let html = lift.passengers.map(p => `<div class="guest ${p.status} ${p.isVip ? 'vip' : ''} ${p.isGymBro ? 'swol' : ''}">${getGuestText(p)}</div>`).join('');
            
            let activeIcons = [];
            if (lift.tardisTimer > 0 || (typeof PowerUps !== 'undefined' && PowerUps.timers.globalTardis > 0)) activeIcons.push('🌌');
            if (lift.teleportTimer > 0 || (typeof PowerUps !== 'undefined' && PowerUps.timers.globalTeleport > 0)) activeIcons.push('⚡');
            if (lift.freshenerTimer > 0 || (typeof PowerUps !== 'undefined' && PowerUps.timers.stinkImmunity > 0)) activeIcons.push('🌲');
            if (lift.musakTimer > 0) activeIcons.push('🎵');
            if (typeof PowerUps !== 'undefined' && PowerUps.timers.jamImmunity > 0) activeIcons.push('🔧');
            
            if (activeIcons.length > 0) {
                html += `<div style="position:absolute; top:-28px; left:0; width:100%; text-align:center; font-size:22px; z-index:100; pointer-events:none; text-shadow: 0 2px 5px rgba(0,0,0,0.5);">${activeIcons.join('')}</div>`;
            }
            
            car.innerHTML = html;
        }
    });
    
    const lobbies = document.querySelectorAll('.lobby');
    lobbies.forEach((lobby, idx) => {
        let actualFloorId = Config.numFloors - 1 - idx;
        if(lobby && Registry.floors[actualFloorId]) {
            let html = Registry.floors[actualFloorId].waitingGuests.map(g => `<div class="guest ${g.status} ${g.isVip ? 'vip' : ''} ${g.isPartying ? 'partying' : ''} ${g.isGymBro ? 'swol' : ''}">${getGuestText(g)}</div>`).join('');
            
            if (typeof PowerUps !== 'undefined' && (PowerUps.timers.globalAngerPause > 0 || (PowerUps.floorAngerPause && PowerUps.floorAngerPause[actualFloorId] > 0))) {
                html += `<div style="display:inline-block; vertical-align:top; margin-left:10px; font-size:22px; text-shadow: 0 2px 5px rgba(0,0,0,0.3);">🎵</div>`;
            }
            
            lobby.innerHTML = html;
        }
    });
}

function renderDebugMenu() {
    const container = document.getElementById('debugControls');
    if (!container) return;
    container.innerHTML = '';
    debugDefinitions.forEach(def => {
        const row = document.createElement('div'); row.className = 'debug-row';
        const label = document.createElement('span'); label.innerText = def.label;
        const ctrl = document.createElement('div'); ctrl.className = 'spinner-ctrl';
        const minus = document.createElement('button'); minus.innerText = '-';
        const valDisplay = document.createElement('div'); valDisplay.innerText = def.dispFormat(Config[def.key]);
        const plus = document.createElement('button'); plus.innerText = '+';
        minus.onclick = () => { Config[def.key] = Math.max(def.min, Math.round((Config[def.key] - def.step) * 1000) / 1000); valDisplay.innerText = def.dispFormat(Config[def.key]); };
        plus.onclick = () => { Config[def.key] = Math.min(def.max, Math.round((Config[def.key] + def.step) * 1000) / 1000); valDisplay.innerText = def.dispFormat(Config[def.key]); };
        ctrl.appendChild(minus); ctrl.appendChild(valDisplay); ctrl.appendChild(plus);
        row.appendChild(label); row.appendChild(ctrl); container.appendChild(row);
    });
}