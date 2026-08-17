// ============================================================================
// ENGINE-CORE.JS : LIFECYCLE MANAGEMENT, WORKSHOP MODALS, & PAYLOAD CODECS
// VERSION: 2.0.1 (Resilient Decoding)
// ============================================================================

// A reversible share-format marker, not an access-control secret. Debug links
// are opt-in playtest configuration and must never be treated as private.
window.SHARE_MARKER = "ELEVATOR_GO_BRRR_2026";
window.SHARE_SECRET = window.SHARE_MARKER; // Legacy alias for existing shared manifests.

window.encodePayload = function(payloadObj) {
    try {
        const str = JSON.stringify(payloadObj);
        let xorStr = '';
        for (let i = 0; i < str.length; i++) {
            xorStr += String.fromCharCode(str.charCodeAt(i) ^ window.SHARE_SECRET.charCodeAt(i % window.SHARE_SECRET.length));
        }
        // Triple-wrap for ultimate safety: XOR -> URI -> Base64 -> URI
        return encodeURIComponent(btoa(encodeURIComponent(xorStr)));
    } catch (e) {
        console.error("Failed to encode payload.", e);
        return null;
    }
};

window.decodePayload = function(encodedStr) {
    if (!encodedStr) return null;
    if (String(encodedStr).length > 100000) {
        console.warn("Share payload exceeds the 100 KB encoded limit.");
        return null;
    }
    const secret = window.SHARE_SECRET;

    const doXor = (bin) => {
        let res = '';
        for (let i = 0; i < bin.length; i++) {
            res += String.fromCharCode(bin.charCodeAt(i) ^ secret.charCodeAt(i % secret.length));
        }
        return res;
    };

    try {
        // 1. Initial cleanup
        let input = String(encodedStr).trim().replace(/ /g, '+');
        
        // 2. Decode outer URI layer
        let decoded = input;
        try { decoded = decodeURIComponent(input); } catch(e) {}

        // ATTEMPT A: Raw XOR (Old Format Compatibility)
        try {
            let xorA = doXor(decoded);
            if (xorA.trim().startsWith('{')) return JSON.parse(xorA);
        } catch(e) {}

        // ATTEMPT B: Base64 Path (Resilient)
        try {
            // Remove non-base64 characters BEFORE calling atob to prevent InvalidCharacterError
            let b64 = decoded.replace(/[^A-Za-z0-9+/=]/g, "");
            if (b64.length >= 4) {
                while (b64.length % 4 !== 0) b64 += '=';
                let binary = atob(b64);
                
                // Binary might be URI encoded
                let xorTarget = binary;
                try { xorTarget = decodeURIComponent(binary); } catch(e) {}
                
                let xorB = doXor(xorTarget);
                try { return JSON.parse(xorB); } catch(e) {
                    // Try one more unquote in case of double-nested encoding
                    return JSON.parse(decodeURIComponent(xorB));
                }
            }
        } catch(e) {}
        
        // ATTEMPT C: Deep URI Unwrapping
        try {
            let deep = decodeURIComponent(decodeURIComponent(decoded));
            let xorC = doXor(deep);
            if (xorC.trim().startsWith('{')) return JSON.parse(xorC);
        } catch(e) {}

        return null;
    } catch (e) {
        console.warn("Invalid or tampered share link detected. Ignoring.", e);
        return null;
    }
};

window.handleSharedData = function(encodedStr) {
    const decoded = window.decodePayload(encodedStr);
    if (!decoded || typeof decoded !== 'object') return;
    
    // Support singular structures or native array manifestations safely
    const incomingItems = Array.isArray(decoded.manifest) ? decoded.manifest : [decoded];
    const allowedTypes = new Set(['seed', 'invite', 'challenge', 'system', 'debug_override', 'leaderboard', 'blueprint']);
    const validItems = incomingItems.filter(item =>
        item &&
        typeof item === 'object' &&
        typeof item.type === 'string' &&
        allowedTypes.has(item.type)
    );
    
    // Stage inside pending queue array for user reconciliation gateway loop
    Registry.pendingManifest = [...Registry.pendingManifest, ...validItems];
};

window.pauseGame = function() {
    if (Registry.roundCountdownActive) {
        if (Registry.roundCountdownTimer) clearInterval(Registry.roundCountdownTimer);
        Registry.roundCountdownTimer = null;
        Registry.roundCountdownPaused = true;
        return;
    }
    if (!Registry.gameActive) return;
    Registry.gameActive = false;
    Registry.pauseStartTime = Date.now();
    window.Game.Audio?.publish('pause', { round: Registry.stats.round });
};

window.resumeGame = function() {
    if (Registry.roundCountdownPaused) {
        Registry.roundCountdownPaused = false;
        if (typeof window.startRoundCountdown === 'function') window.startRoundCountdown(Math.max(0, Registry.countdownRemaining || 0));
        return;
    }
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
        PowerUps.shiftTimers?.(duration);
        if (Registry.vipTargetTime > 0) Registry.vipTargetTime += duration;
        if (Registry.vipNextJourneyTime > 0) Registry.vipNextJourneyTime += duration;
        if (Registry.sunsetTargetTime > 0) Registry.sunsetTargetTime += duration;
        if (Registry.sunsetEndTime > 0) Registry.sunsetEndTime += duration;
        window.Game.BalanceTelemetry?.shiftTime(duration);
        Registry.pauseStartTime = 0;
    }
    Registry.gameActive = true;
    window.Game.Audio?.publish('resume', { round: Registry.stats.round });
};

window.applyLiftTarget = function(liftIndex, targetFloor, options = {}) {
    const lift = Registry.lifts[liftIndex];
    if (!lift) return false;
    const isPolicyCommand = options.manualOverride === false;
    const pair = Registry.counterweightEnabled && Number.isInteger(lift.counterweightPartner)
        ? Registry.lifts[lift.counterweightPartner]
        : null;
    // A pair has one physical policy decision per animation frame. The first
    // worker result wins; the mirrored target is then applied to both cars.
    // Manual commands remain immediate overrides and are never suppressed.
    if (isPolicyCommand && pair && Number.isFinite(Registry.counterweightLastPolicyFrame) &&
        Registry.counterweightPolicyFrame === Registry.counterweightLastPolicyFrame) {
        return false;
    }
    const maxFloor = Math.max(0, Config.numFloors - 1);
    const target = Math.max(0, Math.min(maxFloor, Math.round(Number(targetFloor))));
    const setTarget = (targetLift, floor) => {
        targetLift.targetFloor = floor;
        const currentFloor = Math.round(targetLift.pos / Registry.floorHeight);
        if (floor > currentFloor) targetLift.sweepDirection = 1;
        else if (floor < currentFloor) targetLift.sweepDirection = -1;
        if (options.manualOverride !== undefined) targetLift.manualOverride = options.manualOverride;
        if (options.manualOverride === true) {
            targetLift.commandRevision = (targetLift.commandRevision || 0) + 1;
            // A player command is an immediate dispatch, including when the
            // car is currently in a door/boarding state at another floor.
            targetLift.state = 'IDLE';
            targetLift.stateProgress = 0;
        }
    };
    setTarget(lift, target);
    if (Registry.counterweightEnabled && Number.isInteger(lift.counterweightPartner)) {
        const partner = Registry.lifts[lift.counterweightPartner];
        if (partner) setTarget(partner, maxFloor - target);
        if (partner && options.manualOverride === true) {
            lift.counterweightManualOverride = true;
            partner.counterweightManualOverride = true;
            Registry.beginCounterweightManualCommand?.(lift, target);
        }
    }
    if (isPolicyCommand && pair) Registry.counterweightLastPolicyFrame = Registry.counterweightPolicyFrame;
    return true;
};

window.setLiftTarget = function(liftIndex, targetFloor) {
    if (typeof PowerUps !== 'undefined' && PowerUps.activeTargeting) {
        PowerUps.resolveTargeting(liftIndex, targetFloor);
        return;
    }
    
    if (!Registry.gameActive) return;
    
    if (Registry.lifts[liftIndex]) {
        const lift = Registry.lifts[liftIndex];
        const isActiveZonedPolicy = Boolean(lift.servicePolicy?.active);
        if (typeof Registry.canLiftDirectlyServe === 'function' && !Registry.isFloorInLiftZone(lift, targetFloor) && !isActiveZonedPolicy) {
            if (window.Game.Audio) window.Game.Audio.publish('ui_error', { reason: 'floor-outside-zone' });
            if (typeof GameUI === 'function') GameUI().showToast?.(`Lift ${liftIndex + 1} is zoned for ${lift.serviceLower === 0 ? 'G' : lift.serviceLower}–${lift.serviceUpper}.`);
            return;
        }
        Registry.roundStats.manualClicks++;
        
        window.applyLiftTarget(liftIndex, targetFloor, { manualOverride: true });
    }
};

window.setLiftAutomation = function(liftIndex, mode) {
    if (Registry.lifts[liftIndex]) {
        const lift = Registry.lifts[liftIndex];
        const VM = window.Game.Automation;
        const pair = Registry.counterweightEnabled && Number.isInteger(lift.counterweightPartner)
            ? Registry.lifts[lift.counterweightPartner]
            : null;
        const pairOwned = Boolean(pair && (mode === 'manual' || Registry.getCounterweightPolicyRank?.(mode) > 0));
        const targets = pairOwned ? [lift, pair] : [lift];
        if (pair && mode !== 'manual') {
            const commandKey = Registry.getCounterweightPairKey?.(lift);
            if (commandKey) delete Registry.counterweightManualCommands[commandKey];
            [lift, pair].forEach(car => {
                car.manualOverride = false;
                car.counterweightManualOverride = false;
            });
        }
        targets.forEach(targetLift => {
            targetLift.automation = mode;
            if (mode !== 'manual') targetLift.manualOverride = false;
            if (VM?.applyPolicyToLift) VM.applyPolicyToLift(targetLift, mode);
        });

        const ui = GameUI();
        if (typeof ui.updateLiftAutomationUI === 'function') {
            ui.updateLiftAutomationUI(liftIndex, mode);
        }
    }
};

window.openWorkshopModal = function() {
    const ui = GameUI();
    if (typeof ui.openWorkshopModal === 'function') {
        ui.openWorkshopModal();
    }
};

window.createRoundStats = function() {
    return {
        manualClicks: 0, jammedLiftsFixed: 0, fullyLoadedLifts: 0, servedThisRound: 0,
        happyServed: 0, annoyedServed: 0, criticalServed: 0, vipServed: 0,
        defenestrationsThisRound: 0, totalWaitTimeServed: 0,
        lateralTransfers: 0, doubleDeckerServed: 0, guestsSpawned: 0, livesLost: 0,
        journeyTimes: [], zoneRefusals: 0, uncoveredRoutes: 0,
        openingCredits: Math.max(0, Number(Registry.points) || 0), creditsSpent: 0
    };
};

window.captureRoundCheckpoint = function(round = Registry.stats.round) {
    Registry.roundCheckpoint = {
        round,
        seed: Registry.seed,
        points: Registry.points
    };
};

window.resetAttemptTelemetry = function() {
    Registry.roundStats = window.createRoundStats();
    Registry.guestSequence = 0;
    Registry.roundEvaluation = null;
    Registry.roundTerminalHandled = false;
    Registry.pendingFailedRetry = null;
    Registry.enduranceSeconds = 0;
    Registry.customScriptTicks = 0;
    Registry.lastLobbyRenderTime = 0;
    if (window.Game.BalanceTelemetry) {
        window.Game.BalanceTelemetry.reset(window.Game.virtualTime || Date.now());
    }
};

// RC1.0 keeps operational Credits but deliberately defers achievement
// progression. Completion accounting stays explicit and retry-safe here.
window.evaluateRoundPayout = function() {
    if (Registry.roundEvaluation) return Registry.roundEvaluation;
    const stats = Registry.roundStats;
    const requiredStats = ['servedThisRound', 'happyServed', 'annoyedServed', 'criticalServed', 'defenestrationsThisRound', 'totalWaitTimeServed'];
    requiredStats.forEach(key => { if (stats[key] === undefined) stats[key] = 0; });

    const pointsEarned = PowerUps.calculateRoundPoints();
    Registry.points += pointsEarned;
    Registry.campaignScore = Math.max(0, Number(Registry.campaignScore) || 0) + pointsEarned;
    Registry.roundEvaluation = {
        pointsEarned,
        totalPoints: Registry.points,
        campaignScore: Registry.campaignScore,
        creditLedger: {
            opening: Math.max(0, Number(stats.openingCredits) || 0),
            earned: pointsEarned,
            spent: Math.max(0, Number(stats.creditsSpent) || 0),
            closing: Registry.points
        },
        guestsServed: stats.servedThisRound,
        averageWaitTime: stats.servedThisRound > 0
            ? (stats.totalWaitTimeServed / stats.servedThisRound).toFixed(1)
            : '0.0',
        defenestrations: stats.defenestrationsThisRound
    };
    return Registry.roundEvaluation;
};

window.getRoundDefinition = function(round, operation = null) {
    operation = operation || Registry.activeOperation || null;
    if (operation && typeof operation === 'object' && Number.isInteger(operation.floors) && Number.isInteger(operation.lifts)) {
        return { ...operation, round: Number.isInteger(operation.round) ? operation.round : 14 };
    }
    const supportedRound = Math.max(1, Math.min(25, parseInt(round) || 1));
    const configured = Config.GAME_DATA.rounds[supportedRound];
    const liftOverride = Number(Config[`liftsR${supportedRound}`]);
    const spawnStartOverride = Number(Config[`spawnR${supportedRound}Start`]);
    const spawnEndOverride = Number(Config[`spawnR${supportedRound}End`]);
    const debugOverlay = Config.debugMode ? {
        ...(Number.isFinite(spawnStartOverride) ? { spawnStart: spawnStartOverride } : {}),
        ...(Number.isFinite(spawnEndOverride) ? { spawnEnd: spawnEndOverride } : {})
    } : {};
    const result = {
        round: supportedRound,
        ...configured,
        ...debugOverlay,
        lifts: Number.isFinite(liftOverride) && Config.debugMode ? Math.max(1, Math.min(20, liftOverride)) : configured.lifts
    };
    if (result.briefingRuleBody && result.briefing?.ruleCard) {
        result.briefing = {
            ...result.briefing,
            ruleCard: { ...result.briefing.ruleCard, body: result.briefingRuleBody }
        };
    }
    return result;
};

window.isRoundEventEnabled = function(roundDefinition, eventId) {
    const activeChallenges = roundDefinition?.activeChallenges;
    if (Array.isArray(activeChallenges)) return activeChallenges.includes(eventId);
    return false;
};

window.getRoundChallengeIds = function(roundDefinition) {
    return Array.isArray(roundDefinition?.activeChallenges) ? [...roundDefinition.activeChallenges] : [];
};

window.createLiftState = function(id) {
    return {
        id, targetFloor: 0, pos: 0, passengers: [], counterweightPartner: null,
        lastActionTime: 0, automation: 'manual', sweepDirection: 1,
        counterweightManualOverride: false,
        manualOverride: false, commandRevision: 0, isJammed: false, jamTimer: 0, stinkTimer: 0, gymStinkActive: false,
        tardisTimer: 0, tardisExpiryExodus: false, turboTimer: 0, freshenerTimer: 0,
        musakTimer: 0, doubleDeckerTimer: 0, openPlanTimer: 0, wideDoorsTimer: 0, wideDoorsMultiplier: 1,
        sardineScored: false, isDoubleDecker: false,
        state: 'IDLE', stateProgress: 0, effects: [], lastAutomationTime: 0,
        serviceCycleId: 0, serviceBoarded: 0,
        lastEffectiveCapacity: Config.liftCapacity,
        servicePolicy: { id: null, version: null, mode: 'none', active: false, lower: 0, upper: Math.max(0, Config.numFloors - 1) },
        serviceLower: 0,
        serviceUpper: Math.max(0, Config.numFloors - 1)
    };
};

window.createRoundState = function(round, seed, options = {}) {
    const definition = window.getRoundDefinition(round, options.operation || null);
    const seedTool = window.Game.Seed;
    seedTool.set(seed);
    window.Game.AutomationSeed.set((parseInt(seed) || 1) ^ 0x5f3759df);
    const now = options.now === undefined
        ? (window.Game.virtualTime || Date.now())
        : options.now;

    const state = {
        definition,
        seed,
        points: Number.isFinite(options.restoredPoints) ? Math.max(0, Number(options.restoredPoints)) : Registry.points,
        timeLeft: Registry.autoPilotActive
            ? (Config.autoPilotSettings.shortRoundDuration || 30)
            : Config.roundTime,
        lives: Number.isFinite(options.restoredLives) ? options.restoredLives : Config.startingLives,
        currentSpawnChance: definition.spawnStart,
        counterweightEnabled: Boolean(definition.counterweightEnabled),
        capsuleMode: Boolean(definition.capsuleMode),
        capsuleTravelSecPerFloor: Number(definition.capsuleTravelSecPerFloor || 0),
        lifts: Array.from({ length: definition.lifts }, (_, id) => window.createLiftState(id)),
        floors: Array.from({ length: definition.floors }, () => ({ waitingGuests: [] })),
        vipSpawned: false,
        vipTargetTime: 0,
        vipStage: 0,
        vipRoomFloor: -1,
        vipRandomFloor: -1,
        vipPendingGuest: null,
        vipPendingFloor: -1,
        vipNextJourneyTime: 0,
        sunsetHasHappened: false,
        sunsetTargetTime: 0,
        sunsetActive: false,
        sunsetEndTime: 0,
        sunsetWarningShown: false,
        gymFloor: -1
    };

    // Larger fleets begin in a safe operational baseline. Players can still
    // replace any Sweep assignment during the pre-round countdown.
    if (state.lifts.length >= 4) {
        state.lifts.forEach(lift => { lift.automation = 'sweep'; });
    }

    if (window.isRoundEventEnabled(definition, 'vip')) {
        const minVipDelay = Math.max(10, Math.floor(Config.roundTime * Number(Config.GAME_DATA.system.vipArrivalDelayMinRatio || 0.25)));
        const maxVipDelay = Math.max(minVipDelay, Math.floor(Config.roundTime * Number(Config.GAME_DATA.system.vipArrivalDelayMaxRatio || 0.35)));
        state.vipTargetTime = now + (window.getRandomInt(minVipDelay, maxVipDelay) * 1000);
        state.vipStage = 0;
    }
    if (window.isRoundEventEnabled(definition, 'rooftop')) {
        const releaseBuffer = Math.max(0, Number(definition.rooftopReleaseBufferSec || 0));
        const latestStart = Math.max(Config.sunsetMinSec, Math.min(Config.sunsetMaxSec,
            Config.roundTime - Config.sunsetDurationSec - releaseBuffer));
        state.sunsetTargetTime = now + (window.getRandomInt(Config.sunsetMinSec, latestStart) * 1000);
    }
    if (window.isRoundEventEnabled(definition, 'gym')) {
        state.gymFloor = window.getRandomInt(1, definition.floors - 2);
    }

    // Service zoning starts as full-building coverage. Players can narrow each
    // lift's inclusive band in the Workshop once the scale rounds introduce it.
    state.lifts.forEach(lift => {
        lift.serviceLower = 0;
        lift.serviceUpper = definition.floors - 1;
    });

    if (state.counterweightEnabled) {
        const maxFloor = definition.floors - 1;
        const lowerMiddle = Math.floor(maxFloor / 2);
        const floorHeight = 600 / definition.floors;
        for (let index = 0; index < state.lifts.length; index += 2) {
            const first = state.lifts[index];
            const second = state.lifts[index + 1];
            if (!first || !second) continue;
            first.counterweightPartner = second.id;
            second.counterweightPartner = first.id;
            first.pos = lowerMiddle * floorHeight;
            first.targetFloor = lowerMiddle;
            second.pos = (maxFloor - lowerMiddle) * floorHeight;
            second.targetFloor = maxFloor - lowerMiddle;
        }
    }

    return state;
};

window.applyRoundState = function(roundState, options = {}) {
    Config.numFloors = roundState.definition.floors;
    Config.liftCapacity = roundState.definition.liftCapacity || Config.GAME_DATA.system.liftCapacity;
    Registry.seed = roundState.seed;
    Registry.stats.round = roundState.definition.round;
    Registry.stats.timeLeft = roundState.timeLeft;
    Registry.stats.lives = roundState.lives;
    Registry.stats.currentSpawnChance = roundState.currentSpawnChance;
    Registry.points = Number.isFinite(roundState.points) ? roundState.points : Registry.points;
    Registry.counterweightEnabled = Boolean(roundState.counterweightEnabled);
    Registry.capsuleMode = Boolean(roundState.capsuleMode);
    Registry.capsuleTravelSecPerFloor = Number(roundState.capsuleTravelSecPerFloor || 0);
    if (options.resetCampaign) Registry.stats.served = 0;
    Registry.lifts = roundState.lifts;
    Registry.floors = roundState.floors;
    Registry.vipSpawned = roundState.vipSpawned;
    Registry.vipTargetTime = roundState.vipTargetTime;
    Registry.vipStage = roundState.vipStage || 0;
    Registry.vipRoomFloor = roundState.vipRoomFloor ?? -1;
    Registry.vipRandomFloor = roundState.vipRandomFloor ?? -1;
    Registry.vipPendingGuest = roundState.vipPendingGuest ?? null;
    Registry.vipPendingFloor = roundState.vipPendingFloor ?? -1;
    Registry.vipNextJourneyTime = roundState.vipNextJourneyTime ?? 0;
    Registry.sunsetHasHappened = roundState.sunsetHasHappened;
    Registry.sunsetTargetTime = roundState.sunsetTargetTime;
    Registry.sunsetActive = roundState.sunsetActive;
    Registry.sunsetEndTime = roundState.sunsetEndTime;
    Registry.sunsetWarningShown = roundState.sunsetWarningShown ?? false;
    Registry.gymFloor = roundState.gymFloor;
    Registry.activeOperation = options.operation || null;
    window.resetAttemptTelemetry();
};

window.initializeRound = function(round, options = {}) {
    if (Registry.roundCountdownTimer) clearInterval(Registry.roundCountdownTimer);
    Registry.roundCountdownTimer = null;
    Registry.roundCountdownActive = false;
    Registry.roundCountdownPaused = false;
    document.getElementById('roundCountdown')?.classList.add('hidden');
    document.getElementById('world')?.classList.remove('final-life-warning');
    document.getElementById('game-area')?.classList.remove('countdown-active');
    window.Game.Audio?.publish('rooftop_released', { reason: 'round_initialized', round });
    window.clearAttemptInventory();
    Registry.activeOperation = options.operation || null;
    Registry.counterweightManualCommands = {};
    const hasRoundOverride = options.seedOverride !== undefined ||
        (Registry.debugSeedOverrideRound === round && Registry.debugSeedOverride !== null);
    const overrideSeed = options.seedOverride !== undefined ? options.seedOverride : Registry.debugSeedOverride;
    const roundSeed = hasRoundOverride
        ? window.Game.Seed.normalize(overrideSeed)
        : (Registry.useCampaignSeeds && window.Game.Campaign?.deriveRoundSeed
            ? window.Game.Campaign.deriveRoundSeed(Registry.campaignSeed, round)
            : Registry.seed);
    Registry.seed = roundSeed;
    const state = window.createRoundState(round, roundSeed, options);
    window.applyRoundState(state, options);
    if (Array.isArray(options.restoredInventory) && typeof PowerUps !== 'undefined') {
        PowerUps.inventory = options.restoredInventory.map(item => ({ id: item.id, tier: item.tier }));
    }
    window.Game.Audio?.publish('round_initialized', { round: state.definition.round });
    if (!options.preserveCheckpoint) window.captureRoundCheckpoint(state.definition.round);

    const ui = GameUI();
    if (typeof ui.buildWorld === 'function') ui.buildWorld();
    if (typeof ui.updateScoreboardUI === 'function') ui.updateScoreboardUI();
    if (typeof ui.updatePilotNameDisplay === 'function') ui.updatePilotNameDisplay();
    if (typeof ui.draw === 'function') ui.draw();
    if (options.showBriefing !== false && typeof ui.showRoundModal === 'function') {
        ui.showRoundModal(state.definition.round, { showPromotion: options.showPromotion === true });
    }
    return state;
};

window.clearAttemptInventory = function() {
    if (typeof PowerUps === 'undefined') return;
    PowerUps.cart = [];
    PowerUps.inventory = [];
    PowerUps.activeTargeting = null;
    Object.keys(PowerUps.timers).forEach(k => PowerUps.timers[k] = 0);
    PowerUps.timerExpiresAt = {};
    Registry.lifts.forEach(lift => Object.keys(lift).filter(key => key.endsWith('ExpiresAt')).forEach(key => delete lift[key]));
    Config.boardingSpeedMultiplier = 1.0;
};

window.disengageAutoPilot = function(manualIntervention = false) {
    Registry.autoPilotActive = false;
    Registry.manualIntervention = manualIntervention;
    Config.autoPilot = false;
    Config.roundTime = Config.GAME_DATA.system.roundTime;
    if (Registry.stats.round !== 12) {
        Registry.stats.timeLeft = Config.GAME_DATA.system.roundTime;
    }
    const heartbeat = document.getElementById('heartbeatMonitor');
    if (heartbeat) heartbeat.classList.add('hidden');
};

window.handleOrdinaryDeath = function() {
    if (Registry.roundTerminalHandled) return;
    Registry.roundTerminalHandled = true;
    Registry.gameActive = false;
    Registry.pauseStartTime = 0;

    const checkpoint = Registry.roundCheckpoint || {
        round: Registry.stats.round,
        seed: Registry.seed,
        points: Registry.points
    };

    Registry.points = checkpoint.points;
    Registry.seed = checkpoint.seed;
    window.clearAttemptInventory();
    Registry.pendingFailedRetry = {
        round: checkpoint.round,
        seed: checkpoint.seed
    };
    window.Game.Audio?.publish('failure', { round: checkpoint.round, reason: 'ordinary-death' });

    const stats = Registry.roundStats;
    const failedEvaluation = {
        pointsEarned: 0,
        totalPoints: Registry.points,
        guestsServed: stats.servedThisRound || 0,
        averageWaitTime: stats.servedThisRound > 0
            ? (stats.totalWaitTimeServed / stats.servedThisRound).toFixed(1)
            : '0.0',
        defenestrations: stats.defenestrationsThisRound || 0,
        log: ['Attempt failed. Credits and inventory have been restored for a complete retry.']
    };

    const ui = GameUI();
    const briefingOverlay = document.getElementById('roundModalOverlay');
    if (briefingOverlay) briefingOverlay.style.display = 'none';
    if (typeof ui.showRoundReview === 'function') {
        ui.showRoundReview(checkpoint.round, 'failed', failedEvaluation);
    }
};

window.retryFailedRound = function() {
    const pending = Registry.pendingFailedRetry;
    if (!pending) return;
    Registry.pendingFailedRetry = null;
    Registry.seed = pending.seed;
    window.Game.Audio?.publish('retry_started', { round: pending.round });
    window.skipToRound(pending.round, { preserveCheckpoint: true });
};

window.completeRound = function(reason = 'completed') {
    if (Registry.roundTerminalHandled) return;
    Registry.roundTerminalHandled = true;
    Registry.gameActive = false;
    Registry.pauseStartTime = 0;
    window.Game.Audio?.publish('round_completed', { round: Registry.stats.round, reason });

    Registry.highestUnlockedRound = Math.max(
        Registry.highestUnlockedRound,
        Math.min(25, Registry.stats.round + 1)
    );

    const ui = GameUI();
    if (typeof ui.updateLocksUI === 'function') ui.updateLocksUI();
    if (typeof ui.showRoundReview === 'function') ui.showRoundReview(Registry.stats.round, reason);
};

window.advanceToRound = function(targetRound) {
    if (targetRound > 25) {
        window.Game.Shell?.showCampaignComplete?.();
        return;
    }
    window.skipToRound(targetRound, { showPromotion: true });
};

window.resetGame = function(options = {}) {
    window.Game.Audio?.publish('reset', { round: Registry.stats.round });
    const useDebugReset = !options.forceProduction && (Config.debugMode || navigator.webdriver);
    // Debug mode can also be enabled by local developer/test configuration.
    // Only a manifest-authorised playtest session suppresses campaign writes.
    Registry.debugSession = Boolean(options.preserveDebugSession || Registry.debugSession);
    if (useDebugReset) {
        Registry.useCampaignSeeds = false;
        Registry.campaignSeed = 1234;
        Registry.seed = 1234;
        Registry.debugSeedOverride = null;
        Registry.debugSeedOverrideRound = null;
        Registry.points = 99999;
        Registry.campaignScore = 0;
        Registry.highestUnlockedRound = 25;
    } else {
        Registry.useCampaignSeeds = true;
        Registry.campaignSeed = window.Game.Campaign?.generateSeed?.() || 1234;
        Registry.seed = Registry.campaignSeed;
        Registry.debugSeedOverride = null;
        Registry.debugSeedOverrideRound = null;
        Registry.points = 0;
        Registry.campaignScore = 0;
        Registry.highestUnlockedRound = 1;
    }
    
    return window.initializeRound(1, { resetCampaign: true, showBriefing: options.showBriefing });
};

window.skipToRound = function(targetRound, options = {}) {
    return window.initializeRound(targetRound, options);
};

window.initializeEngine = function() {
    const ui = GameUI();
    const shared = GameShared();
    
    // 1. Initialize VM and Automation BEFORE building the world
    const VM = window.Game.Automation || (typeof AutomationVM !== 'undefined' ? AutomationVM : null);
    if (VM && typeof VM.init === 'function') {
        VM.init();
    }
    
    if (typeof AutomationWorkshop !== 'undefined' && typeof AutomationWorkshop.loadScriptsFromStorage === 'function') {
        AutomationWorkshop.loadScriptsFromStorage();
    }

    const urlParams = new URLSearchParams(window.location.search);
    const dataParam = urlParams.get('Data') || urlParams.get('data') || urlParams.get('blueprint');
    if (dataParam && typeof shared.handleSharedData === 'function') {
        shared.handleSharedData(dataParam);
    }

    const gameIdParam = urlParams.get('GameID') || urlParams.get('gameid');
    if (gameIdParam && !isNaN(parseInt(gameIdParam))) {
        Registry.pendingManifest.push({ type: 'seed', value: parseInt(gameIdParam) });
    }

    const debugParam = urlParams.get('debug') || urlParams.get('manifest');
    if (debugParam) {
        const decodedDebug = window.decodePayload(debugParam);
        // ENFORCED SECRET: ELEVATOR_GO_BRRR_2026
        if (decodedDebug && decodedDebug.auth === "ELEVATOR_GO_BRRR_2026") {
            console.log("🔒 Secure Debug Payload Decoded. Queuing manifest Gateway...");
            Registry.pendingManifest.push({
                type: 'debug_override',
                overrides: decodedDebug.overrides,
                monkey: decodedDebug.monkey || null
            });
        }
    }

    const isSimulationRealm = new URLSearchParams(window.location.search).get('simulation') === 'true';

    // Kill Switch: Global listener for human intervention
    // Modified to ignore keyboard/window events to allow Alt-Tab and Console usage
    const haltAutoPilot = (e) => {
        if (!Registry.autoPilotActive) return;

        // Only halt if the click was inside the game world or on a controls element
        const worldContainer = document.getElementById('world');
        const sidebar = document.getElementById('sidebar');
        
        const isGameInteraction = (worldContainer && worldContainer.contains(e.target)) || 
                                (sidebar && sidebar.contains(e.target));

        if (isGameInteraction) {
            window.disengageAutoPilot(true);
            console.warn("⚠️ AUTO-PILOT HALTED: Manual gameplay detected.");
        }
    };
    window.addEventListener('mousedown', haltAutoPilot);


    // Hardened safety: debugMode must be explicitly true in config AND no clean URL override
    const isCleanUrl = !window.location.search.includes('manifest=') && !window.location.search.includes('debug=true');
    if (isCleanUrl) {
        Config.debugMode = false; 
    }

    if (Config.debugMode) {
        Registry.highestUnlockedRound = 25;
        Registry.points = 99999;
    } else {
        Registry.points = 0;
        Registry.highestUnlockedRound = 1;
    }

    if (typeof window.refreshDebugVisibility === 'function') {
        window.refreshDebugVisibility();
    }

    // Trigger full reset to build world and update UI
    // Browser automation retains the historical briefing baseline so isolated
    // UI tests can exercise round-boundary controls without dismissing shell UI.
    window.resetGame({ showBriefing: isSimulationRealm ? false : (Config.debugMode || navigator.webdriver) });
    if (isSimulationRealm) {
        Registry.gameActive = false;
        const briefing = document.getElementById('roundModalOverlay');
        if (briefing) briefing.style.display = 'none';
    } else if (!Config.debugMode && !navigator.webdriver) {
        window.Game.Shell?.showWelcome?.();
    }
};

window.Game = window.Game || {};
window.Game.SHARE_SECRET = window.SHARE_SECRET;

// Shared data utilities
window.Game.Shared = {
    encodePayload: window.encodePayload,
    decodePayload: window.decodePayload,
    handleSharedData: window.handleSharedData
};

window.GameShared = function() {
    return window.Game.Shared;
};

window.Game.Engine = window.Game.Engine || {};
window.Game.Engine.initialize = window.initializeEngine;
window.Game.encodePayload = window.encodePayload;
window.Game.decodePayload = window.decodePayload;
window.Game.handleSharedData = window.handleSharedData;
window.Game.Engine = window.Game.Engine || {};
window.Game.Engine.pause = window.pauseGame;
window.Game.Engine.resume = window.resumeGame;
window.Game.Engine.setLiftTarget = window.setLiftTarget;
window.Game.Engine.applyLiftTarget = window.applyLiftTarget;
window.Game.Engine.setLiftAutomation = window.setLiftAutomation;
window.Game.Engine.openWorkshopModal = window.openWorkshopModal;
window.Game.Engine.reset = window.resetGame;
window.Game.Engine.skipToRound = window.skipToRound;
window.Game.Engine.completeRound = window.completeRound;
window.Game.Engine.handleOrdinaryDeath = window.handleOrdinaryDeath;
window.Game.Engine.retryFailedRound = window.retryFailedRound;
window.Game.Engine.advanceToRound = window.advanceToRound;
window.Game.Engine.captureRoundCheckpoint = window.captureRoundCheckpoint;
window.Game.Engine.resetAttemptTelemetry = window.resetAttemptTelemetry;
window.Game.Engine.disengageAutoPilot = window.disengageAutoPilot;
window.Game.Engine.getRoundDefinition = window.getRoundDefinition;
window.Game.Engine.createLiftState = window.createLiftState;
window.Game.Engine.createRoundState = window.createRoundState;
window.Game.Engine.applyRoundState = window.applyRoundState;
window.Game.Engine.initializeRound = window.initializeRound;

window.Game.UI = window.Game.UI || {};
window.Game.UI.initializeUI = window.initializeUI;

// STARTUP CALLS
window.addEventListener('DOMContentLoaded', () => {
    const isSimulationRealm = new URLSearchParams(window.location.search).get('simulation') === 'true';
    if (typeof window.initializeEngine === 'function') window.initializeEngine();
    if (typeof window.initializeUI === 'function') window.initializeUI();

    // Trigger manifest processing if we have inbound data
    if (Registry.pendingManifest.length > 0 && typeof window.processNextManifestItem === 'function') {
        window.processNextManifestItem();
    }

    if (isSimulationRealm) return;

    // Start Loops
    if (typeof gameTick === 'function') {
        setInterval(gameTick, 1000); // Physics / Game State
    }
    
    // Animation Loop
    function frame(time) {
        if (typeof animationTick === 'function') {
            animationTick(time);
        }
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
});

window.encodePayload = window.Game.encodePayload;
window.decodePayload = window.Game.decodePayload;
window.handleSharedData = window.Game.handleSharedData;
window.pauseGame = window.Game.Engine.pause;
window.resumeGame = window.Game.Engine.resume;
window.setLiftTarget = window.Game.Engine.setLiftTarget;
window.setLiftAutomation = window.Game.Engine.setLiftAutomation;
window.openWorkshopModal = window.Game.Engine.openWorkshopModal;
window.resetGame = window.Game.Engine.reset;
window.skipToRound = window.Game.Engine.skipToRound;
