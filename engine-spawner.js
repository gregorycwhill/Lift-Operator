// ============================================================================
// ENGINE-SPAWNER.JS : PASSENGER SPAWNING MECHANICS & ENVIRONMENT EVENTS
// ============================================================================

window.forceFirstSpawn = function(now) {
    let start = window.getRandomGuestFloor();
    let dest;
    let isCheckout = false;
    const roundDefinition = window.getRoundDefinition(Registry.stats.round);
    if (roundDefinition.checkoutEvent || (Registry.stats.round === 7 && seededRandom() < Config.checkoutChance)) {
        dest = 0;
        isCheckout = true;
        if (start === 0) start = window.getRandomInt(1, Config.numFloors - 1);
    } else {
        dest = window.getRandomGuestFloor();
        while (dest === start) dest = window.getRandomGuestFloor();
    }
    let isGym = !isCheckout && (start === Registry.gymFloor);
    let isRoomService = (Registry.stats.round >= 3 && seededRandom() < (Config.roomServiceChance || 0.05));
    
    Registry.floors[start].waitingGuests.push({
        id: `guest-${++Registry.guestSequence}`,
        dest: dest, 
        status: GuestStatus.HAPPY, 
        spawnTime: now, 
        isVip: false,
        isCheckout,
        isFarter: false, 
        isSunset: false, 
        isPartying: false, 
        isGymBro: isGym,
        isBulky: isGym || isRoomService,
        isRoomService: isRoomService,
        boardingWeight: isRoomService ? 3.0 : (isGym ? 2.0 : 1.0)
    });
    window.Game.BalanceTelemetry?.recordSpawn();
    Registry.lastSpawnTime = now;
};

window.runSpawnerTick = function(now) {
    // 1. Calculate Spawn Rates by interpolation across rounds
    const roundDefinition = window.getRoundDefinition(Registry.stats.round);
    const progress = roundDefinition.objective === 'ENDURANCE'
        ? Math.min(1, (Registry.enduranceSeconds || 0) / Config.roundTime)
        : (Config.roundTime - Registry.stats.timeLeft) / Config.roundTime;
    Registry.stats.currentSpawnChance =
        roundDefinition.spawnStart +
        ((roundDefinition.spawnEnd - roundDefinition.spawnStart) * Math.max(0, Math.min(1, progress)));

    if (Registry.vipPendingGuest && now >= Registry.vipNextJourneyTime) {
        const vip = Registry.vipPendingGuest;
        const floor = Registry.vipPendingFloor;
        Registry.vipPendingGuest = null;
        Registry.vipPendingFloor = -1;
        Registry.vipNextJourneyTime = 0;
        Registry.floors[floor].waitingGuests.unshift(vip);
        window.Game.BalanceTelemetry?.recordSpawn();
        window.Game.Audio?.publish('vip_journey', { stage: vip.vipStage, floor, destination: vip.dest });
        window.showToast?.(vip.vipStage === 2
            ? `VIP is leaving her room for Floor ${vip.dest}.`
            : 'VIP is departing. Get her back to Ground.');
    }

    // 2. VIP Event Orchestration
    if (Registry.stats.round >= 8 && !Registry.vipSpawned && now >= Registry.vipTargetTime && Registry.vipTargetTime !== 0) {
        const start = 0;
        const maxFloor = Math.max(1, Config.numFloors - 1);
        const roomFloor = window.getRandomInt(1, maxFloor);
        Registry.vipRoomFloor = roomFloor;
        Registry.vipRandomFloor = -1;
        Registry.vipStage = 1;
        Registry.floors[start].waitingGuests.push({
            id: `guest-${++Registry.guestSequence}`,
            dest: roomFloor,
            status: GuestStatus.ANNOYED, 
            spawnTime: now - (Config.happySec * 1000) - 100, 
            isVip: true, 
            isFarter: false, 
            isSunset: false, 
            isPartying: false, 
            isGymBro: false,
            isBulky: false,
            boardingWeight: 1.0,
            vipStage: 1
        });
        window.Game.BalanceTelemetry?.recordSpawn();
        window.Game.Audio?.publish('vip_arrival', { guestType: 'vip', floor: start, destination: roomFloor, stage: 1 });
        window.showToast?.(`VIP arrival: escort her from G to Room ${roomFloor}.`);
        Registry.vipSpawned = true;
    }

    // 3. Sunset Happy Hour Event Logic
    if (Registry.stats.round >= 9) {
        if (Registry.sunsetActive) {
            if (now >= Registry.sunsetEndTime) {
                Registry.sunsetActive = false;
                window.Game.Audio?.publish('rooftop_released', { floor: Config.numFloors - 1 });
                window.showToast?.('Rooftop Party over — guests are returning to their rooms.');
                const revertGuest = (g) => {
                    if (g.isSunset) {
                        g.isSunset = false; 
                        g.dest = g.originalDest;
                        g.isPartying = false;
                        g.status = GuestStatus.HAPPY;
                        g.spawnTime = now;
                    }
                };
                Registry.floors.forEach(f => f.waitingGuests.forEach(revertGuest));
                Registry.lifts.forEach(l => l.passengers.forEach(revertGuest));
            }
        } else if (!Registry.sunsetHasHappened && now >= Registry.sunsetTargetTime && Registry.sunsetTargetTime !== 0) {
            Registry.sunsetActive = true;
            Registry.sunsetHasHappened = true;
            Registry.sunsetEndTime = now + (Config.sunsetDurationSec * 1000);
            window.Game.Audio?.publish('rooftop_started', { floor: Config.numFloors - 1, duration: Config.sunsetDurationSec });
            window.showToast?.('Rooftop Party started — guests are heading upstairs!');
            
            const infectGuest = (g) => {
                if (!g.isVip && seededRandom() < Config.sunsetGuestRatio) {
                    g.isSunset = true; 
                    g.originalDest = g.dest; 
                    g.dest = Config.numFloors - 1; 
                }
            };
            Registry.floors.forEach(f => f.waitingGuests.forEach(infectGuest));
            Registry.lifts.forEach(l => l.passengers.forEach(infectGuest));
        }
    }

    // 4. Standard Runtime Spawner Engine
    let tempChance = Registry.stats.currentSpawnChance;
    let spawnedThisTick = false;
    
    while (tempChance > 0) {
        if (seededRandom() < tempChance) {
            let start = window.getRandomGuestFloor();
            let dest;
            let isCheckout = false;
            
            const roundDefinition = window.getRoundDefinition(Registry.stats.round);
            if (roundDefinition.checkoutEvent || (Registry.stats.round === 7 && seededRandom() < Config.checkoutChance)) {
                dest = 0;
                isCheckout = true;
                if (start === 0) start = window.getRandomInt(1, Config.numFloors - 1);
            } else {
                dest = window.getRandomGuestFloor();
                while (dest === start) dest = window.getRandomGuestFloor();
            }
            
            let isGym = !isCheckout && (start === Registry.gymFloor);
            let isRoomService = (Registry.stats.round >= 3 && seededRandom() < (Config.roomServiceChance || 0.05));
            
            let newGuest = {
                id: `guest-${++Registry.guestSequence}`,
                dest: dest,
                status: GuestStatus.HAPPY, 
                spawnTime: now, 
                isVip: false,
                isCheckout,
                isFarter: false, 
                isSunset: false, 
                isPartying: false, 
                isGymBro: isGym,
                isBulky: isGym || isRoomService,
                isRoomService: isRoomService,
                boardingWeight: isRoomService ? 3.0 : (isGym ? 2.0 : 1.0)
            };
            
            if (Registry.sunsetActive && !newGuest.isVip && seededRandom() < Config.sunsetGuestRatio) {
                newGuest.isSunset = true; 
                newGuest.originalDest = newGuest.dest; 
                newGuest.dest = Config.numFloors - 1;
            }
            Registry.floors[start].waitingGuests.push(newGuest);
            window.Game.BalanceTelemetry?.recordSpawn();
            spawnedThisTick = true;
        }
        tempChance -= 1.0;
    }
    
    if (spawnedThisTick) {
        Registry.lastSpawnTime = now;
    } else if (now - Registry.lastSpawnTime >= Config.maxSpawnDelaySec * 1000) {
        const spawner = GameSpawner();
        if (typeof spawner.forceFirstSpawn === 'function') {
            spawner.forceFirstSpawn(now);
        } else {
            window.forceFirstSpawn(now);
        }
    }
};

window.Spawner = window.Spawner || {};
window.Spawner.forceFirstSpawn = window.forceFirstSpawn;
window.Spawner.runSpawnerTick = window.runSpawnerTick;
window.Spawner.queueVipNextJourney = function(vip, floor, now) {
    if (!vip?.isVip || Registry.vipStage >= 4) return false;
    const maxFloor = Math.max(1, Config.numFloors - 1);
    if (Registry.vipStage === 1) {
        let randomFloor = window.getRandomInt(1, maxFloor);
        while (randomFloor === Registry.vipRoomFloor && maxFloor > 1) randomFloor = window.getRandomInt(1, maxFloor);
        Registry.vipRandomFloor = randomFloor;
        Registry.vipStage = 2;
        vip.dest = randomFloor;
        vip.vipStage = 2;
        vip.status = GuestStatus.ANNOYED;
        vip.spawnTime = now - (Config.happySec * 1000) - 100;
        Registry.vipPendingGuest = vip;
        Registry.vipPendingFloor = floor;
        Registry.vipNextJourneyTime = now + (window.getRandomInt(10, 30) * 1000);
        return true;
    }
    if (Registry.vipStage === 2) {
        Registry.vipStage = 3;
        vip.dest = 0;
        vip.vipStage = 3;
        vip.status = GuestStatus.ANNOYED;
        vip.spawnTime = now - (Config.happySec * 1000) - 100;
        Registry.vipPendingGuest = vip;
        Registry.vipPendingFloor = floor;
        Registry.vipNextJourneyTime = now + (window.getRandomInt(10, 30) * 1000);
        return true;
    }
    Registry.vipStage = 4;
    vip.vipStage = 4;
    window.showToast?.('VIP has completed all three journeys.');
    return false;
};
window.forceFirstSpawn = window.Spawner.forceFirstSpawn;
window.runSpawnerTick = window.Spawner.runSpawnerTick;

window.Game = window.Game || {};
window.Game.Spawner = window.Game.Spawner || {};
window.Game.Spawner.forceFirstSpawn = window.forceFirstSpawn;
window.Game.Spawner.runSpawnerTick = window.runSpawnerTick;
window.Game.Spawner.queueVipNextJourney = window.Spawner.queueVipNextJourney;
