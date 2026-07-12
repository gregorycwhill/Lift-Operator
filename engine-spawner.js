// ============================================================================
// ENGINE-SPAWNER.JS : PASSENGER SPAWNING MECHANICS & ENVIRONMENT EVENTS
// ============================================================================

window.forceFirstSpawn = function(now) {
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
    Registry.floors[start].waitingGuests.push({
        dest: dest, 
        status: 'happy', 
        spawnTime: now, 
        isVip: false, 
        isFarter: false, 
        isSunset: false, 
        isPartying: false, 
        isGymBro: isGym
    });
    Registry.lastSpawnTime = now;
};

window.runSpawnerTick = function(now) {
    // 1. Calculate Spawn Rates by interpolation across rounds
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

    // 2. VIP Event Orchestration
    if (Registry.stats.round >= 8 && !Registry.vipSpawned && now >= Registry.vipTargetTime && Registry.vipTargetTime !== 0) {
        let start = Math.floor(seededRandom() * Config.numFloors);
        let dest = Math.floor(seededRandom() * Config.numFloors);
        while (dest === start) dest = Math.floor(seededRandom() * Config.numFloors);
        
        let isGym = (start === Registry.gymFloor);
        Registry.floors[start].waitingGuests.push({
            dest: dest, 
            status: 'annoyed', 
            spawnTime: now - (Config.happySec * 1000) - 100, 
            isVip: true, 
            isFarter: false, 
            isSunset: false, 
            isPartying: false, 
            isGymBro: isGym
        });
        Registry.vipSpawned = true;
    }

    // 3. Sunset Happy Hour Event Logic
    if (Registry.stats.round >= 9) {
        if (Registry.sunsetActive) {
            if (now >= Registry.sunsetEndTime) {
                Registry.sunsetActive = false;
                const revertGuest = (g) => {
                    if (g.isSunset) {
                        g.isSunset = false; 
                        g.dest = g.originalDest;
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
            let newGuest = {
                dest: dest, 
                status: 'happy', 
                spawnTime: now, 
                isVip: false, 
                isFarter: false, 
                isSunset: false, 
                isPartying: false, 
                isGymBro: isGym
            };
            
            if (Registry.sunsetActive && !newGuest.isVip && seededRandom() < Config.sunsetGuestRatio) {
                newGuest.isSunset = true; 
                newGuest.originalDest = newGuest.dest; 
                newGuest.dest = Config.numFloors - 1;
            }
            Registry.floors[start].waitingGuests.push(newGuest);
            spawnedThisTick = true;
        }
        tempChance -= 1.0;
    }
    
    if (spawnedThisTick) {
        Registry.lastSpawnTime = now;
    } else if (now - Registry.lastSpawnTime >= Config.maxSpawnDelaySec * 1000) {
        window.forceFirstSpawn(now); 
    }
};