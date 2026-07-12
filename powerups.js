// ============================================================================
// POWERUPS.JS : ABILITIES, SHOP DATA, & TARGETING LOGIC
// ============================================================================

const PowerUps = {
    inventory: [],
    cart: [], 
    activeTargeting: null,

    // Global timers for Tier 3 abilities
    timers: {
        jamImmunity: 0,
        stinkImmunity: 0,
        globalAngerPause: 0,
        globalTurbo: 0, // Replaced globalTeleport
        globalTardis: 0
    },

    init: function() {
        // Initialization can remain empty as we moved away from floor arrays
    },

    tick: function() {
        if (!Registry.gameActive) return;
        
        // Decrement Global Tier 3 Timers
        if (this.timers.jamImmunity > 0) this.timers.jamImmunity--;
        if (this.timers.stinkImmunity > 0) this.timers.stinkImmunity--;
        if (this.timers.globalAngerPause > 0) this.timers.globalAngerPause--;
        if (this.timers.globalTurbo > 0) this.timers.globalTurbo--;
        if (this.timers.globalTardis > 0) this.timers.globalTardis--;
    },

    calculateRoundPoints: function() {
        // Tally points earned this round + time bonus
        let points = Registry.roundStats.servedThisRound || 0;
        if (Registry.stats.timeLeft > 0) {
            points += Math.floor(Registry.stats.timeLeft / 10);
        }
        return points;
    },

    showEffectOnLift: function(liftId, icon) {
        const world = document.getElementById('world');
        const car = document.getElementById(`lift-el-${liftId}`);
        if (world && car) {
            const effect = document.createElement('div');
            effect.innerText = icon;
            effect.style.position = 'absolute';
            const worldRect = world.getBoundingClientRect();
            const carRect = car.getBoundingClientRect();
            effect.style.left = (carRect.left - worldRect.left) + 'px';
            effect.style.width = (carRect.width ? `${carRect.width}px` : '50px');
            effect.style.textAlign = 'center';
            effect.style.fontSize = '32px';
            effect.style.zIndex = '9999';
            effect.style.pointerEvents = 'none';
            effect.style.transition = 'all 1s ease-out';
            effect.style.textShadow = '0 2px 10px rgba(0,0,0,0.5)';
            world.appendChild(effect);
            
            effect.style.top = (carRect.top - worldRect.top + 20) + 'px';
            
            void effect.offsetWidth;

            effect.style.top = (carRect.top - worldRect.top - 80) + 'px';
            effect.style.opacity = '0';
            
            setTimeout(() => { if (effect.parentNode) effect.remove(); }, 1000);
        }
    },

    showEffectOnFloor: function(floorId, icon) {
        const world = document.getElementById('world');
        const row = document.getElementById(`floor-row-${floorId}`);
        if (world && row) {
            const effect = document.createElement('div');
            effect.innerText = icon;
            effect.style.position = 'absolute';
            effect.style.left = '30px';
            effect.style.fontSize = '32px';
            effect.style.transition = 'all 1s ease-out';
            effect.style.zIndex = '9999';
            effect.style.pointerEvents = 'none';
            effect.style.textShadow = '0 2px 10px rgba(0,0,0,0.5)';
            
            effect.style.top = `${row.offsetTop + 10}px`;
            world.appendChild(effect);
            
            void effect.offsetWidth;
            
            effect.style.top = `${row.offsetTop - 30}px`;
            effect.style.opacity = '0';
            
            setTimeout(() => { if (effect.parentNode) effect.remove(); }, 1000);
        }
    },

    catalog: {
        wrench: {
            id: 'wrench', name: 'The Wrench', icon: '🔧',
            tiers: [
                { cost: 1, desc: 'Instantly fix 1 jammed lift.', target: 'lift', 
                  execute: (liftId, floorId) => { Registry.lifts[liftId].jamTimer = 0; PowerUps.showEffectOnLift(liftId, '🔧'); } },
                { cost: 3, desc: 'Instantly fix ALL jammed lifts.', target: 'instant', 
                  execute: () => { Registry.lifts.forEach(l => { l.jamTimer = 0; PowerUps.showEffectOnLift(l.id, '🔧'); }); } },
                { cost: 5, desc: 'Fix ALL lifts + 30s Global Jam Immunity.', target: 'instant', 
                  execute: () => { Registry.lifts.forEach(l => { l.jamTimer = 0; PowerUps.showEffectOnLift(l.id, '🔧'); }); PowerUps.timers.jamImmunity = 30; } }
            ]
        },
        freshener: {
            id: 'freshener', name: 'Air Freshener', icon: '🌲',
            tiers: [
                { cost: 1, desc: 'Clears stink + 15s Immunity to 1 lift.', target: 'lift', 
                  execute: (liftId, floorId) => { Registry.lifts[liftId].stinkTimer = 0; Registry.lifts[liftId].freshenerTimer = 15; PowerUps.showEffectOnLift(liftId, '🌲'); } },
                { cost: 3, desc: 'Clears stink + 15s Immunity to ALL lifts.', target: 'instant', 
                  execute: () => { Registry.lifts.forEach(l => { l.stinkTimer = 0; l.freshenerTimer = 15; PowerUps.showEffectOnLift(l.id, '🌲'); }); } },
                { cost: 5, desc: 'Clears ALL lifts + 30s Global Stink Immunity.', target: 'instant', 
                  execute: () => { Registry.lifts.forEach(l => { l.stinkTimer = 0; PowerUps.showEffectOnLift(l.id, '🌲'); }); PowerUps.timers.stinkImmunity = 30; } }
            ]
        },
        musak: {
            id: 'musak', name: 'Calming Musak', icon: '🎵',
            tiers: [
                { cost: 1, desc: 'Pauses anger timers in 1 lift for 15s.', target: 'lift', 
                  execute: (liftId, floorId) => { Registry.lifts[liftId].musakTimer = 15; PowerUps.showEffectOnLift(liftId, '🎵'); } },
                { cost: 3, desc: 'Pauses anger timers in ALL lifts for 15s.', target: 'instant', 
                  execute: () => { Registry.lifts.forEach(l => { l.musakTimer = 15; PowerUps.showEffectOnLift(l.id, '🎵'); }); } },
                { cost: 5, desc: 'Pauses EVERYTHING for 15s & reduces anger by 1 level.', target: 'instant', 
                  execute: () => { 
                      PowerUps.timers.globalAngerPause = 15; 
                      Registry.lifts.forEach(l => PowerUps.showEffectOnLift(l.id, '🎵'));
                      const soothe = (g) => {
                          if (g.status === GuestStatus.CRITICAL) { g.status = GuestStatus.ANNOYED; g.spawnTime += (Config.annoyedSec - Config.happySec) * 1000; }
                          else if (g.status === GuestStatus.ANNOYED) { g.status = GuestStatus.HAPPY; g.spawnTime = Date.now(); }
                      };
                      Registry.floors.forEach(f => f.waitingGuests.forEach(soothe));
                      Registry.lifts.forEach(l => l.passengers.forEach(soothe));
                  } }
            ]
        },
        turbo: {
            id: 'turbo', name: 'Turbo Module', icon: '🚀',
            tiers: [
                { cost: 1, desc: '1 lift travels at Turbo speed (0.1) for 10s.', target: 'lift', 
                  execute: (liftId, floorId) => { 
                      Registry.lifts[liftId].turboTimer = 10; 
                      Registry.lifts[liftId].activeTurboSpeed = 0.1;
                      PowerUps.showEffectOnLift(liftId, '🚀'); 
                  } 
                },
                { cost: 3, desc: '1 lift travels at Max Turbo speed (0.05) for 15s.', target: 'lift', 
                  execute: (liftId, floorId) => { 
                      Registry.lifts[liftId].turboTimer = 15; 
                      Registry.lifts[liftId].activeTurboSpeed = 0.05;
                      PowerUps.showEffectOnLift(liftId, '🚀'); 
                  } 
                },
                { cost: 5, desc: 'ALL lifts travel at Max Turbo speed (0.05) for 20s.', target: 'instant', 
                  execute: () => { 
                      PowerUps.timers.globalTurbo = 20; 
                      Registry.lifts.forEach(l => PowerUps.showEffectOnLift(l.id, '🚀')); 
                  } 
                }
            ]
        },
        tardis: {
            id: 'tardis', name: 'TARDIS Mode', icon: '🌌',
            tiers: [
                { cost: 1, desc: '1 lift gets infinite capacity for 15s.', target: 'lift', 
                  execute: (liftId, floorId) => { Registry.lifts[liftId].tardisTimer = 15; PowerUps.showEffectOnLift(liftId, '🌌'); } },
                { cost: 3, desc: 'ALL lifts get infinite capacity for 15s.', target: 'instant', 
                  execute: () => { Registry.lifts.forEach(l => { l.tardisTimer = 15; PowerUps.showEffectOnLift(l.id, '🌌'); }); } },
                { cost: 5, desc: 'ALL lifts get infinite capacity for 30s.', target: 'instant', 
                  execute: () => { PowerUps.timers.globalTardis = 30; Registry.lifts.forEach(l => PowerUps.showEffectOnLift(l.id, '🌌')); } }
            ]
        }
    },

    flashScreen: function(color) {
        const world = document.getElementById('world');
        if (world) {
            world.style.transition = 'box-shadow 0.1s ease-out';
            world.style.boxShadow = `inset 0 0 100px ${color}`;
            setTimeout(() => { world.style.boxShadow = 'none'; }, 300);
        }
    },

    primeAbility: function(powerUpId, tierIndex) {
        const ability = this.catalog[powerUpId].tiers[tierIndex];
        
        if (ability.target === 'instant') {
            ability.execute(null, null);
            this.consumeFromInventory(powerUpId, tierIndex);
            this.flashScreen('rgba(46, 204, 113, 0.6)'); 
            if (typeof updateInventoryUI === 'function') updateInventoryUI();
            if (typeof draw === 'function') draw();
        } else {
            if (typeof pauseGame === 'function') pauseGame();
            this.activeTargeting = { id: powerUpId, tier: tierIndex };
            
            const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" style="font-size: 24px"><text y="24">${this.catalog[powerUpId].icon}</text></svg>`;
            const cursorUrl = `url('data:image/svg+xml;utf8,${encodeURIComponent(svgData)}') 16 16, crosshair`;
            
            let styleEl = document.getElementById('targeting-style');
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = 'targeting-style';
                document.head.appendChild(styleEl);
            }
            styleEl.innerHTML = `* { cursor: ${cursorUrl} !important; }`;
            
            const world = document.getElementById('world');
            if (world) world.style.boxShadow = 'inset 0 0 50px rgba(52, 152, 219, 0.6)';
            if (typeof updateInventoryUI === 'function') updateInventoryUI();
        }
    },

    resolveTargeting: function(liftId, floorId) {
        if (!this.activeTargeting) return false;

        const abilityId = this.activeTargeting.id;
        const lift = Registry.lifts[liftId];

        if (abilityId === 'wrench' && lift.jamTimer <= 0) {
            this.flashScreen('rgba(231, 76, 60, 0.4)'); 
            return false;
        }

        const ability = this.catalog[abilityId].tiers[this.activeTargeting.tier];
        ability.execute(liftId, floorId);
        
        this.flashScreen('rgba(46, 204, 113, 0.6)'); 
        this.consumeFromInventory(abilityId, this.activeTargeting.tier);
        this.cancelTargeting();
        
        if (typeof updateInventoryUI === 'function') updateInventoryUI();
        if (typeof draw === 'function') draw(); 
        if (typeof resumeGame === 'function') resumeGame();
        
        return true; 
    },

    cancelTargeting: function() {
        this.activeTargeting = null;
        
        const styleEl = document.getElementById('targeting-style');
        if (styleEl) styleEl.innerHTML = '';
        
        const world = document.getElementById('world');
        if (world) world.style.boxShadow = 'none';
        if (typeof updateInventoryUI === 'function') updateInventoryUI();
        if (typeof resumeGame === 'function' && document.getElementById('leaderboardOverlay') && !document.getElementById('leaderboardOverlay').style.display.includes('flex')) {
            resumeGame();
        }
    },

    consumeFromInventory: function(powerUpId, tierIndex) {
        const index = this.inventory.findIndex(item => item.id === powerUpId && item.tier === tierIndex);
        if (index !== -1) this.inventory.splice(index, 1);
    },

    isAngerPaused: function(floorId) {
        return this.timers.globalAngerPause > 0;
    },
    
    getLiftCapacity: function(liftId) {
        if (this.timers.globalTardis > 0) return 999;
        if (liftId !== null && Registry.lifts[liftId] && Registry.lifts[liftId].tardisTimer > 0) return 999;
        return Config.liftCapacity;
    }
};

PowerUps.init();