// ============================================================================
// ENGINE-CORE.JS : LIFECYCLE MANAGEMENT, WORKSHOP MODALS, & PAYLOAD CODECS
// ============================================================================

window.SHARE_SECRET = "ELEVATOR_GO_BRRR_2026";

window.encodePayload = function(payloadObj) {
    try {
        const str = JSON.stringify(payloadObj);
        let xorStr = '';
        for (let i = 0; i < str.length; i++) {
            xorStr += String.fromCharCode(str.charCodeAt(i) ^ window.SHARE_SECRET.charCodeAt(i % window.SHARE_SECRET.length));
        }
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
    const decoded = window.decodePayload(encodedStr);
    if (!decoded) return;
    
    // Support singular structures or native array manifestations safely
    const incomingItems = Array.isArray(decoded.manifest) ? decoded.manifest : [decoded];
    
    // Stage inside pending queue array for user reconciliation gateway loop
    Registry.pendingManifest = [...Registry.pendingManifest, ...incomingItems];
};

// Pipeline processor to clean out inbound queued elements via Customs Gateway Handshake
PowerUps.processNextManifestItem = function() {
    if (!Registry.pendingManifest || Registry.pendingManifest.length === 0) {
        // Queue is fully processed, fall back safely to normal game entry sequence
        document.getElementById('manifestOverlay').style.display = 'none';
        if (typeof window.showRoundModal === 'function') {
            window.showRoundModal(Registry.stats.round);
        }
        return;
    }
    
    const item = Registry.pendingManifest.shift();
    const manifestOverlay = document.getElementById('manifestOverlay');
    const instructionsEl = document.getElementById('manifestInstructions');
    const acceptBtn = document.getElementById('manifestAcceptBtn');
    const rejectBtn = document.getElementById('manifestRejectBtn');
    
    if (!manifestOverlay || !instructionsEl || !acceptBtn || !rejectBtn) return;
    
    // Setup generic text framing metrics based on transaction payload classifications
    let descText = "Foreign configuration telemetry package detected.";
    let acceptCallback = () => {};
    
    // 1. OBFUSCATED DEV MODE ENVELOPE DETECTOR
    if (item.type === 'system' && item.data && item.data.mode === 'debug') {
        descText = "Inbound automated telemetry bundle containing Master Configuration overrides. Enable Sandbox Access?";
        acceptCallback = () => {
            Config.debugMode = true;
            Registry.points = 99999;
            Registry.highestUnlockedRound = 11;
            if (typeof window.buildWorld === 'function') window.buildWorld();
            if (typeof window.updateLocksUI === 'function') window.updateLocksUI();
            if (typeof window.showToast === 'function') window.showToast("🛠️ Sandbox Mode Deployed!");
        };
    }
    // 2. SOCIAL LEADERBOARD OVERLAY INTERCEPTOR
    else if (item.type === 'leaderboard' && item.data) {
        descText = `Incoming Arcade Telemetry data transmission containing top scores. Open High Score Archive?`;
        acceptCallback = () => {
            // Write incoming shared data into browser memory block directly
            safeSetItem('liftArcadeBoard', JSON.stringify(item.data));
            if (typeof window.showLeaderboard === 'function') {
                window.showLeaderboard("Shared High Scores");
            }
        };
    }
    // 3. AUTOMATION BLUEPRINT COMPILATION OVERLAY INTERCEPTOR
    else if (item.type === 'blueprint' && item.data) {
        descText = `Incoming Automation Blueprint transmission containing script configuration '${item.data.name}' authored by Pilot ${item.data.author || 'Unknown'}. Import to local Workshop profiles?`;
        acceptCallback = () => {
            if (typeof AutomationWorkshop !== 'undefined' && typeof LZString !== 'undefined') {
                try {
                    const decompressedBlockly = JSON.parse(LZString.decompressFromEncodedURIComponent(item.data.xml));
                    const newScriptObj = {
                        id: 'shared_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
                        name: item.data.name || "Imported Automation",
                        author: item.data.author || "Shared Pilot",
                        date: new Date().toLocaleDateString(),
                        description: "Shared script blueprint link.",
                        blocklyData: decompressedBlockly,
                        compiledJS: "" 
                    };
                    
                    AutomationWorkshop.scripts.push(newScriptObj);
                    let saved = JSON.parse(safeGetItem('automation_scripts', '[]'));
                    saved.push(newScriptObj);
                    safeSetItem('automation_scripts', JSON.stringify(saved));
                    
                    if (typeof window.updateWorkshopScriptList === 'function') window.updateWorkshopScriptList();
                    if (typeof window.buildWorld === 'function') window.buildWorld();
                    if (typeof window.showToast === 'function') {
                        window.showToast(`🤖 Script '${newScriptObj.name}' saved to Workshop catalog.`);
                    }
                } catch (err) {
                    console.error("Blueprint compilation import error: ", err);
                }
            }
        };
    }
    // 4. RANDOM SEED SECTOR TRANSLATOR INTERCEPTOR
    else if (item.type === 'seed' || item.type === 'invite') {
        let incomingSeed = item.value || (item.data ? item.data.seed : null);
        descText = `Incoming Operational Shift Invitation. Synced core parameters requested. Calibrate board to Seed ID #${incomingSeed}?`;
        acceptCallback = () => {
            if (incomingSeed) {
                Registry.seed = parseInt(incomingSeed);
                setSeed(Registry.seed);
                const seedDisplay = document.getElementById('seedDisplay');
                if (seedDisplay) seedDisplay.innerText = Registry.seed;
                const seedInput = document.getElementById('gameSeed');
                if (seedInput) seedInput.value = Registry.seed;
                if (typeof window.showToast === 'function') window.showToast(`🎲 Configured Game Seed: ${Registry.seed}`);
            }
        };
    }
    
    // Bind presentation content details securely into visual panels
    instructionsEl.innerText = descText;
    manifestOverlay.style.display = 'flex';
    
    // Unbind prior trigger loops to prevent duplicate processing stacking
    acceptBtn.onclick = null;
    rejectBtn.onclick = null;
    
    // Map event handling nodes cleanly for user intent validation
    acceptBtn.onclick = () => {
        acceptCallback();
        PowerUps.processNextManifestItem();
    };
    
    rejectBtn.onclick = () => {
        if (typeof window.showToast === 'function') window.showToast("Transmission rejected cleanly.");
        PowerUps.processNextManifestItem();
    };
};

window.pauseGame = function() {
    if (!Registry.gameActive) return;
    Registry.gameActive = false;
    Registry.pauseStartTime = Date.now();
};

window.resumeGame = function() {
    if (Registry.gameActive) return;
    if (Registry.pauseStartTime > 0) {
        const duration = Date.now() - Registry.pauseStartTime;
        Registry.floors.forEach(f => f.waitingGuests.forEach(g => g.spawnTime += duration));
        Registry.lifts.forEach(l => {
            l.passengers.forEach(g => g.spawnTime += duration);
            l.lastActionTime += duration;
        });
        Registry.parentTickTime += duration;
        Registry.lastSpawnTime += duration;
        if (Registry.vipTargetTime > 0) Registry.vipTargetTime += duration;
        if (Registry.sunsetTargetTime > 0) Registry.sunsetTargetTime += duration;
        if (Registry.sunsetEndTime > 0) Registry.sunsetEndTime += duration;
        Registry.pauseStartTime = 0;
    }
    Registry.gameActive = true;
};

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

window.openWorkshopModal = function() {
    if (typeof window.pauseGame === 'function') window.pauseGame();
    const ws = document.getElementById('workshopOverlay');
    if (ws) ws.style.display = 'flex';
    
    if (typeof AutomationWorkshop !== 'undefined' && AutomationWorkshop.workspace) {
        setTimeout(() => Blockly.svgResize(AutomationWorkshop.workspace), 50);
    } else if (typeof AutomationWorkshop !== 'undefined' && !AutomationWorkshop.workspace) {
        AutomationWorkshop.init();
    }
};

window.resetGame = function() {
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
    
    Registry.roundStats = { 
        manualClicks: 0, jammedLiftsFixed: 0, fullyLoadedLifts: 0, servedThisRound: 0,
        happyServed: 0, annoyedServed: 0, criticalServed: 0, vipServed: 0,
        defenestrationsThisRound: 0, totalWaitTimeServed: 0
    };
    
    Config.numFloors = 10;
    setSeed(Registry.seed);

    Registry.lifts = [];
    for (let i = 0; i < Config.liftsR1; i++) {
        Registry.lifts.push({ id: i, targetFloor: 0, pos: 0, passengers: [], lastActionTime: 0, automation: 'manual', sweepDirection: 1, manualOverride: false, jamTimer: 0, stinkTimer: 0, tardisTimer: 0, turboTimer: 0, freshenerTimer: 0, musakTimer: 0, sardineScored: false });
    }
    Registry.floors = Array.from({length: Config.numFloors}, () => ({ waitingGuests: [] }));
    
    const selects = document.querySelectorAll('.shaft select');
    selects.forEach(sel => sel.value = 'manual');
    
    if (typeof buildWorld === 'function') buildWorld();
    if (typeof updateScoreboardUI === 'function') updateScoreboardUI();
    if (typeof draw === 'function') draw();
    if (typeof showRoundModal === 'function') showRoundModal(1);
};

window.skipToRound = function(targetRound) {
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
    
    Registry.roundStats = { 
        manualClicks: 0, jammedLiftsFixed: 0, fullyLoadedLifts: 0, servedThisRound: 0,
        happyServed: 0, annoyedServed: 0, criticalServed: 0, vipServed: 0,
        defenestrationsThisRound: 0, totalWaitTimeServed: 0
    };
    
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
    for (let i = 0; i < numLifts; i++) {
        Registry.lifts.push({ id: i, targetFloor: 0, pos: 0, passengers: [], lastActionTime: 0, automation: 'manual', sweepDirection: 1, manualOverride: false, jamTimer: 0, stinkTimer: 0, tardisTimer: 0, turboTimer: 0, freshenerTimer: 0, musakTimer: 0, sardineScored: false });
    }
    Registry.floors = Array.from({length: Config.numFloors}, () => ({ waitingGuests: [] }));
    
    const selects = document.querySelectorAll('.shaft select');
    selects.forEach(sel => sel.value = 'manual');
    
    if (typeof buildWorld === 'function') buildWorld();
    if (typeof updateScoreboardUI === 'function') updateScoreboardUI();
    if (typeof draw === 'function') draw();
    if (typeof showRoundModal === 'function') showRoundModal(targetRound);
};

document.addEventListener("DOMContentLoaded", () => {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Fully awake local workshop assets before dealing with payload intercepts
        if (typeof AutomationWorkshop !== 'undefined' && typeof AutomationWorkshop.loadScriptsFromStorage === 'function') {
            AutomationWorkshop.loadScriptsFromStorage();
        }

        const dataParam = urlParams.get('Data') || urlParams.get('data');
        if (dataParam) {
            window.handleSharedData(dataParam);
        }
        
        const gameIdParam = urlParams.get('GameID') || urlParams.get('gameid');
        if (gameIdParam && !isNaN(parseInt(gameIdParam))) {
            Registry.pendingManifest.push({ type: 'seed', value: parseInt(gameIdParam) });
        }

        const savedTrophies = safeGetItem('liftOperator_activeTrophies', '[]');
        Registry.trophyCase = JSON.parse(savedTrophies);

        if (Config.debugMode) {
            Registry.points = 99999;
            Registry.highestUnlockedRound = 11;
        }

        Config.numFloors = 10;
        Registry.floors = Array.from({length: Config.numFloors}, () => ({ waitingGuests: [] }));
        Registry.lifts = []; 
        
        for (let i = 0; i < Config.liftsR1; i++) {
            Registry.lifts.push({ id: i, targetFloor: 0, pos: 0, passengers: [], lastActionTime: 0, automation: 'manual', sweepDirection: 1, manualOverride: false, jamTimer: 0, stinkTimer: 0, tardisTimer: 0, turboTimer: 0, freshenerTimer: 0, musakTimer: 0, sardineScored: false });
        }

        const seedInput = document.getElementById('gameSeed');
        Registry.seed = Math.floor(Math.random() * 9000) + 1000;
        setSeed(Registry.seed);
        const seedDisplay = document.getElementById('seedDisplay');
        if (seedDisplay) seedDisplay.innerText = Registry.seed;

        if (typeof buildWorld === 'function') buildWorld();
        if (typeof renderDebugMenu === 'function') renderDebugMenu();
        
        // GATEWAY ROUTER CORE EXECUTION EDGE
        if (Registry.pendingManifest && Registry.pendingManifest.length > 0) {
            PowerUps.processNextManifestItem();
        } else {
            if (typeof showRoundModal === 'function') showRoundModal(1);
        }
        
        if (typeof AutomationWorkshop !== 'undefined' && typeof AutomationWorkshop.init === 'function') {
            AutomationWorkshop.init();
        }

        const wsBtn = document.getElementById('openWorkshopBtn');
        if (wsBtn) {
            wsBtn.innerText = "Workshop";
            const newBtn = wsBtn.cloneNode(true);
            wsBtn.parentNode.replaceChild(newBtn, wsBtn);
            newBtn.addEventListener('click', window.openWorkshopModal);
        }

        document.addEventListener('contextmenu', (e) => {
            if (typeof PowerUps !== 'undefined' && PowerUps.activeTargeting) {
                e.preventDefault();
                PowerUps.cancelTargeting();
                if (typeof updateInventoryUI === 'function') updateInventoryUI();
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
                setSeed(Registry.seed);
                if (document.getElementById('seedDisplay')) document.getElementById('seedDisplay').innerText = Registry.seed;
                if (typeof buildWorld === 'function') buildWorld();
            }
            
            document.getElementById('roundModalOverlay').style.display = 'none';
            if (Registry.pauseStartTime === 0 && typeof forceFirstSpawn === 'function') forceFirstSpawn(Date.now()); 
            window.resumeGame();
            if (typeof draw === 'function') draw();
        });

        document.getElementById('continueToBriefingBtn')?.addEventListener('click', () => {
            document.getElementById('roundReviewOverlay').style.display = 'none';
            if (typeof showRoundModal === 'function') showRoundModal(Registry.stats.round + 1);
        });

        document.getElementById('leaderboardBtn')?.addEventListener('click', () => {
            if (typeof showLeaderboard === 'function') showLeaderboard("Paused");
        });
        
        document.getElementById('closeLbBtn')?.addEventListener('click', () => {
            document.getElementById('leaderboardOverlay').style.display = 'none';
            window.resumeGame();
            if (typeof draw === 'function') draw();
        });
        
        document.getElementById('restartBtn')?.addEventListener('click', () => {
            document.getElementById('leaderboardOverlay').style.display = 'none';
            window.resetGame();
        });
        document.getElementById('lbRestartBtn')?.addEventListener('click', () => {
            document.getElementById('leaderboardOverlay').style.display = 'none';
            window.resetGame();
        });
        
        document.getElementById('openDebugBtn')?.addEventListener('click', () => {
            window.pauseGame();
            if (typeof renderDebugMenu === 'function') renderDebugMenu(); 
            document.getElementById('debugOverlay').style.display = 'flex';
        });
        
        document.getElementById('closeDebugBtn')?.addEventListener('click', () => {
            document.getElementById('debugOverlay').style.display = 'none';
            if (Registry.floors.length !== Config.numFloors) window.resetGame();
            else window.resumeGame();
        });

        document.getElementById('jumpRoundBtn')?.addEventListener('click', () => {
            const targetRound = parseInt(document.getElementById('jumpRoundSelect').value);
            document.getElementById('debugOverlay').style.display = 'none';
            window.skipToRound(targetRound);
        });

        if (typeof gameTick === 'function') setInterval(gameTick, 1000); 
        if (typeof animationTick === 'function') setInterval(animationTick, 16); 
        if (typeof draw === 'function') draw(); 
    } catch (err) {
        console.error("Game Initialization Error: ", err);
    }
});