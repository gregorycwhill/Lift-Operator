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
        globalTardis: 0,
        wideDoors: 0
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
        if (this.timers.wideDoors > 0) {
            this.timers.wideDoors--;
            if (this.timers.wideDoors <= 0) {
                Config.boardingSpeedMultiplier = 1.0;
            }
        }
    },

    calculateRoundPoints: function() {
        const payouts = Config.GAME_DATA.payouts;
        if (Registry.stats.round === 12) {
            const endurance = payouts.endurance;
            const survivalPoints = Math.floor((Registry.enduranceSeconds || 0) / endurance.survivalIntervalSec);
            const servicePoints = Math.floor((Registry.roundStats.servedThisRound || 0) / endurance.serviceIntervalGuests);
            return Math.min(endurance.cap, survivalPoints + servicePoints);
        }
        // Tally points earned this round + time bonus
        const standard = payouts.standard;
        let points = (Registry.roundStats.servedThisRound || 0) * standard.pointsPerGuest;
        if (Registry.stats.timeLeft > 0) {
            points += Math.floor(Registry.stats.timeLeft / standard.remainingTimeIntervalSec);
        }
        return points;
    },

    showEffectOnLift: function(liftId, icon) {
        const lift = Registry.lifts[liftId];
        if (lift && lift.effects) {
            const now = (window.Game && window.Game.virtualTime) || Date.now();
            lift.effects = lift.effects.filter(effect => effect.icon !== icon);
            lift.effects.push({ icon, startTime: now, duration: 1500 });
        }

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

    announceLiftCapacity: function(liftId) {
        const ui = GameUI();
        if (typeof ui.showLiftCapacity === 'function') ui.showLiftCapacity(liftId);
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
                { cost: window.Config.GAME_DATA.powerups.wrench.tiers[0].cost, desc: 'Instantly fix 1 jammed lift.', target: 'lift', 
                  execute: (liftId, floorId) => { Registry.lifts[liftId].jamTimer = 0; PowerUps.showEffectOnLift(liftId, '🔧'); } },
                { cost: window.Config.GAME_DATA.powerups.wrench.tiers[1].cost, desc: 'Instantly fix ALL jammed lifts.', target: 'instant', 
                  execute: () => { Registry.lifts.forEach(l => { l.jamTimer = 0; PowerUps.showEffectOnLift(l.id, '🔧'); }); } },
                { cost: window.Config.GAME_DATA.powerups.wrench.tiers[2].cost, desc: `Fix ALL lifts + ${window.Config.GAME_DATA.powerups.wrench.tiers[2].duration}s Global Jam Immunity.`, target: 'instant', 
                  execute: () => { Registry.lifts.forEach(l => { l.jamTimer = 0; PowerUps.showEffectOnLift(l.id, '🔧'); }); PowerUps.timers.jamImmunity = window.Config.GAME_DATA.powerups.wrench.tiers[2].duration; } }
            ]
        },
        freshener: {
            id: 'freshener', name: 'Air Freshener', icon: '🌲',
            tiers: [
                { cost: window.Config.GAME_DATA.powerups.freshener.tiers[0].cost, desc: `Clears stink + ${window.Config.GAME_DATA.powerups.freshener.tiers[0].duration}s Immunity to 1 lift.`, target: 'lift', 
                  execute: (liftId, floorId) => { Registry.lifts[liftId].stinkTimer = 0; Registry.lifts[liftId].freshenerTimer = window.Config.GAME_DATA.powerups.freshener.tiers[0].duration; PowerUps.showEffectOnLift(liftId, '🌲'); } },
                { cost: window.Config.GAME_DATA.powerups.freshener.tiers[1].cost, desc: `Clears stink + ${window.Config.GAME_DATA.powerups.freshener.tiers[1].duration}s Immunity to ALL lifts.`, target: 'instant', 
                  execute: () => { Registry.lifts.forEach(l => { l.stinkTimer = 0; l.freshenerTimer = window.Config.GAME_DATA.powerups.freshener.tiers[1].duration; PowerUps.showEffectOnLift(l.id, '🌲'); }); } },
                { cost: window.Config.GAME_DATA.powerups.freshener.tiers[2].cost, desc: `Clears ALL lifts + ${window.Config.GAME_DATA.powerups.freshener.tiers[2].duration}s Global Stink Immunity.`, target: 'instant', 
                  execute: () => { Registry.lifts.forEach(l => { l.stinkTimer = 0; PowerUps.showEffectOnLift(l.id, '🌲'); }); PowerUps.timers.stinkImmunity = window.Config.GAME_DATA.powerups.freshener.tiers[2].duration; } }
            ]
        },
        musak: {
            id: 'musak', name: 'Calming Musak', icon: '🎵',
            tiers: [
                { cost: window.Config.GAME_DATA.powerups.musak.tiers[0].cost, desc: `Pauses anger timers in 1 lift for ${window.Config.GAME_DATA.powerups.musak.tiers[0].duration}s.`, target: 'lift', 
                  execute: (liftId, floorId) => { Registry.lifts[liftId].musakTimer = window.Config.GAME_DATA.powerups.musak.tiers[0].duration; PowerUps.showEffectOnLift(liftId, '🎵'); } },
                { cost: window.Config.GAME_DATA.powerups.musak.tiers[1].cost, desc: `Pauses anger timers in ALL lifts for ${window.Config.GAME_DATA.powerups.musak.tiers[1].duration}s.`, target: 'instant', 
                  execute: () => { Registry.lifts.forEach(l => { l.musakTimer = window.Config.GAME_DATA.powerups.musak.tiers[1].duration; PowerUps.showEffectOnLift(l.id, '🎵'); }); } },
                { cost: window.Config.GAME_DATA.powerups.musak.tiers[2].cost, desc: `Pauses EVERYTHING for ${window.Config.GAME_DATA.powerups.musak.tiers[2].duration}s & reduces anger by 1 level.`, target: 'instant', 
                  execute: () => { 
                      PowerUps.timers.globalAngerPause = window.Config.GAME_DATA.powerups.musak.tiers[2].duration; 
                      Registry.lifts.forEach(l => PowerUps.showEffectOnLift(l.id, '🎵'));
                      const soothe = (g) => {
                          if (g.status === GuestStatus.CRITICAL) { g.status = GuestStatus.ANNOYED; g.spawnTime += (Config.annoyedSec - Config.happySec) * 1000; }
                          else if (g.status === GuestStatus.ANNOYED) { g.status = GuestStatus.HAPPY; g.spawnTime = (window.Game.virtualTime || Date.now()); }
                      };
                      Registry.floors.forEach(f => f.waitingGuests.forEach(soothe));
                      Registry.lifts.forEach(l => l.passengers.forEach(soothe));
                  } }
            ]
        },
        turbo: {
            id: 'turbo', name: 'Turbo Module', icon: '🚀',
            tiers: [
                { cost: window.Config.GAME_DATA.powerups.turbo.tiers[0].cost, desc: `1 lift travels at Turbo speed (${window.Config.GAME_DATA.powerups.turbo.tiers[0].scalar}) for ${window.Config.GAME_DATA.powerups.turbo.tiers[0].duration}s.`, target: 'lift', 
                  execute: (liftId, floorId) => { 
                      Registry.lifts[liftId].turboTimer = window.Config.GAME_DATA.powerups.turbo.tiers[0].duration; 
                      Registry.lifts[liftId].activeTurboSpeed = window.Config.GAME_DATA.powerups.turbo.tiers[0].scalar;
                      PowerUps.showEffectOnLift(liftId, '🚀'); 
                  } 
                },
                { cost: window.Config.GAME_DATA.powerups.turbo.tiers[1].cost, desc: `1 lift travels at Max Turbo speed (${window.Config.GAME_DATA.powerups.turbo.tiers[1].scalar}) for ${window.Config.GAME_DATA.powerups.turbo.tiers[1].duration}s.`, target: 'lift', 
                  execute: (liftId, floorId) => { 
                      Registry.lifts[liftId].turboTimer = window.Config.GAME_DATA.powerups.turbo.tiers[1].duration; 
                      Registry.lifts[liftId].activeTurboSpeed = window.Config.GAME_DATA.powerups.turbo.tiers[1].scalar;
                      PowerUps.showEffectOnLift(liftId, '🚀'); 
                  } 
                },
                { cost: window.Config.GAME_DATA.powerups.turbo.tiers[2].cost, desc: `ALL lifts travel at Max Turbo speed (${window.Config.GAME_DATA.powerups.turbo.tiers[2].scalar}) for ${window.Config.GAME_DATA.powerups.turbo.tiers[2].duration}s.`, target: 'instant', 
                  execute: () => { 
                      PowerUps.timers.globalTurbo = window.Config.GAME_DATA.powerups.turbo.tiers[2].duration; 
                      Registry.lifts.forEach(l => PowerUps.showEffectOnLift(l.id, '🚀')); 
                  } 
                }
            ]
        },
        tardis: {
            id: 'tardis', name: 'TARDIS Mode', icon: '🌌',
            tiers: [
                { cost: window.Config.GAME_DATA.powerups.tardis.tiers[0].cost, desc: `1 lift gets infinite capacity for ${window.Config.GAME_DATA.powerups.tardis.tiers[0].duration}s.`, target: 'lift', 
                  execute: (liftId, floorId) => { Registry.lifts[liftId].tardisTimer = window.Config.GAME_DATA.powerups.tardis.tiers[0].duration; PowerUps.showEffectOnLift(liftId, '🌌'); PowerUps.announceLiftCapacity(liftId); } },
                { cost: window.Config.GAME_DATA.powerups.tardis.tiers[1].cost, desc: `ALL lifts get infinite capacity for ${window.Config.GAME_DATA.powerups.tardis.tiers[1].duration}s.`, target: 'instant', 
                  execute: () => { Registry.lifts.forEach(l => { l.tardisTimer = window.Config.GAME_DATA.powerups.tardis.tiers[1].duration; PowerUps.showEffectOnLift(l.id, '🌌'); PowerUps.announceLiftCapacity(l.id); }); } },
                { cost: window.Config.GAME_DATA.powerups.tardis.tiers[2].cost, desc: `ALL lifts get infinite capacity for ${window.Config.GAME_DATA.powerups.tardis.tiers[2].duration}s.`, target: 'instant', 
                  execute: () => { PowerUps.timers.globalTardis = window.Config.GAME_DATA.powerups.tardis.tiers[2].duration; Registry.lifts.forEach(l => { PowerUps.showEffectOnLift(l.id, '🌌'); PowerUps.announceLiftCapacity(l.id); }); } }
            ]
        },
        doors: {
            id: 'doors', name: 'Wide Doors', icon: '🚪',
            tiers: [
                { cost: window.Config.GAME_DATA.powerups.doors.tiers[0].cost, desc: `Increase boarding speed (${window.Config.GAME_DATA.powerups.doors.tiers[0].scalar}x delay) for ${window.Config.GAME_DATA.powerups.doors.tiers[0].duration}s.`, target: 'instant', 
                  execute: () => { Config.boardingSpeedMultiplier = window.Config.GAME_DATA.powerups.doors.tiers[0].scalar; PowerUps.timers.wideDoors = window.Config.GAME_DATA.powerups.doors.tiers[0].duration; PowerUps.flashScreen('rgba(241, 196, 15, 0.4)'); } },
                { cost: window.Config.GAME_DATA.powerups.doors.tiers[1].cost, desc: `Further increase boarding speed (${window.Config.GAME_DATA.powerups.doors.tiers[1].scalar}x delay) for ${window.Config.GAME_DATA.powerups.doors.tiers[1].duration}s.`, target: 'instant', 
                  execute: () => { Config.boardingSpeedMultiplier = window.Config.GAME_DATA.powerups.doors.tiers[1].scalar; PowerUps.timers.wideDoors = window.Config.GAME_DATA.powerups.doors.tiers[1].duration; PowerUps.flashScreen('rgba(241, 196, 15, 0.5)'); } },
                { cost: window.Config.GAME_DATA.powerups.doors.tiers[2].cost, desc: `Instantly board/unboard all guests for ${window.Config.GAME_DATA.powerups.doors.tiers[2].duration}s.`, target: 'instant', 
                  execute: () => { Config.boardingSpeedMultiplier = window.Config.GAME_DATA.powerups.doors.tiers[2].scalar; PowerUps.timers.wideDoors = window.Config.GAME_DATA.powerups.doors.tiers[2].duration; PowerUps.flashScreen('rgba(241, 196, 15, 0.7)'); } }
            ]
        },
        groupThink: {
            id: 'groupThink', name: 'Group Think', icon: '✨',
            tiers: [
                { cost: window.Config.GAME_DATA.powerups.groupThink.tiers[0].cost, desc: 'Target a floor: All waiting guests change dest to the majority choice.', target: 'floor',
                  execute: (liftId, floorId) => { 
                      const guests = Registry.floors[floorId].waitingGuests;
                      if (!guests.length) return;
                      const counts = {};
                      guests.forEach(g => counts[g.dest] = (counts[g.dest] || 0) + 1);
                      let majorityDest = guests[0].dest;
                      let maxCount = 0;
                      for (const d in counts) {
                          if (counts[d] > maxCount) {
                              maxCount = counts[d];
                              majorityDest = parseInt(d);
                          }
                      }
                      guests.forEach(g => g.dest = majorityDest);
                      PowerUps.showEffectOnFloor(floorId, '✨');
                  } 
                },
                { cost: window.Config.GAME_DATA.powerups.groupThink.tiers[1].cost, desc: 'Target a lift: All passengers change dest to the majority choice.', target: 'lift',
                  execute: (liftId, floorId) => { 
                      const passengers = Registry.lifts[liftId].passengers;
                      if (!passengers.length) return;
                      const counts = {};
                      passengers.forEach(p => counts[p.dest] = (counts[p.dest] || 0) + 1);
                      let majorityDest = passengers[0].dest;
                      let maxCount = 0;
                      for (const d in counts) {
                          if (counts[d] > maxCount) {
                              maxCount = counts[d];
                              majorityDest = parseInt(d);
                          }
                      }
                      passengers.forEach(p => p.dest = majorityDest);
                      PowerUps.showEffectOnLift(liftId, '✨');
                  } 
                },
                { cost: window.Config.GAME_DATA.powerups.groupThink.tiers[2].cost, desc: 'Global Consensus: All guests (floors & lifts) sync to their group majority.', target: 'instant',
                  execute: () => { 
                      Registry.floors.forEach((f, fIdx) => {
                          const guests = f.waitingGuests;
                          if (!guests.length) return;
                          const counts = {};
                          guests.forEach(g => counts[g.dest] = (counts[g.dest] || 0) + 1);
                          let majorityDest = guests[0].dest;
                          let maxCount = 0;
                          for (const d in counts) {
                              if (counts[d] > maxCount) {
                                  maxCount = counts[d];
                                  majorityDest = parseInt(d);
                              }
                          }
                          guests.forEach(g => g.dest = majorityDest);
                          PowerUps.showEffectOnFloor(fIdx, '✨');
                      });
                      Registry.lifts.forEach((l, lIdx) => {
                          const passengers = l.passengers;
                          if (!passengers.length) return;
                          const counts = {};
                          passengers.forEach(p => counts[p.dest] = (counts[p.dest] || 0) + 1);
                          let majorityDest = passengers[0].dest;
                          let maxCount = 0;
                          for (const d in counts) {
                              if (counts[d] > maxCount) {
                                  maxCount = counts[d];
                                  majorityDest = parseInt(d);
                              }
                          }
                          passengers.forEach(p => p.dest = majorityDest);
                          PowerUps.showEffectOnLift(lIdx, '✨');
                      });
                  } 
                }
            ]
        },
        doubleDecker: {
            id: 'doubleDecker', name: 'Double-Decker', icon: '🚡',
            tiers: [
                { cost: window.Config.GAME_DATA.powerups.doubleDecker.tiers[0].cost, desc: `Bronze: One lift gains double capacity for ${window.Config.GAME_DATA.powerups.doubleDecker.tiers[0].duration}s.`, target: 'lift', 
                  execute: (liftId, floorId) => { 
                      Registry.lifts[liftId].doubleDeckerTimer = window.Config.GAME_DATA.powerups.doubleDecker.tiers[0].duration * 60; // ticks
                      Registry.lifts[liftId].isDoubleDecker = true;
                      PowerUps.showEffectOnLift(liftId, '🚡'); 
                      PowerUps.announceLiftCapacity(liftId);
                  } 
                },
                { cost: window.Config.GAME_DATA.powerups.doubleDecker.tiers[1].cost, desc: `Silver: One lift gains double capacity for ${window.Config.GAME_DATA.powerups.doubleDecker.tiers[1].duration}s.`, target: 'lift', 
                  execute: (liftId, floorId) => { 
                      Registry.lifts[liftId].doubleDeckerTimer = window.Config.GAME_DATA.powerups.doubleDecker.tiers[1].duration * 60; // ticks
                      Registry.lifts[liftId].isDoubleDecker = true;
                      PowerUps.showEffectOnLift(liftId, '🚡'); 
                      PowerUps.announceLiftCapacity(liftId);
                  } 
                },
                { cost: window.Config.GAME_DATA.powerups.doubleDecker.tiers[2].cost, desc: `Gold: ALL lifts gain double capacity for ${window.Config.GAME_DATA.powerups.doubleDecker.tiers[2].duration}s.`, target: 'instant', 
                  execute: () => { 
                      Registry.lifts.forEach(l => {
                          l.doubleDeckerTimer = window.Config.GAME_DATA.powerups.doubleDecker.tiers[2].duration * 60;
                          l.isDoubleDecker = true;
                          PowerUps.showEffectOnLift(l.id, '🚡');
                          PowerUps.announceLiftCapacity(l.id);
                      });
                  } 
                }
            ]
        },
        openPlan: {
            id: 'openPlan', name: 'Open Plan', icon: '↔️',
            tiers: [
                { cost: window.Config.GAME_DATA.powerups.openPlan.tiers[0].cost, desc: `Bronze: One lift allows lateral transfer for ${window.Config.GAME_DATA.powerups.openPlan.tiers[0].duration}s.`, target: 'lift', 
                  execute: (liftId, floorId) => { 
                      Registry.lifts[liftId].openPlanTimer = window.Config.GAME_DATA.powerups.openPlan.tiers[0].duration * 60; 
                      PowerUps.showEffectOnLift(liftId, '↔️'); 
                  } 
                },
                { cost: window.Config.GAME_DATA.powerups.openPlan.tiers[1].cost, desc: `Silver: One lift allows lateral transfer for ${window.Config.GAME_DATA.powerups.openPlan.tiers[1].duration}s.`, target: 'lift', 
                  execute: (liftId, floorId) => { 
                      Registry.lifts[liftId].openPlanTimer = window.Config.GAME_DATA.powerups.openPlan.tiers[1].duration * 60; 
                      PowerUps.showEffectOnLift(liftId, '↔️'); 
                  } 
                },
                { cost: window.Config.GAME_DATA.powerups.openPlan.tiers[2].cost, desc: `Gold: ALL lifts allow lateral transfer for ${window.Config.GAME_DATA.powerups.openPlan.tiers[2].duration}s.`, target: 'instant', 
                  execute: () => { 
                      Registry.lifts.forEach(l => {
                          l.openPlanTimer = window.Config.GAME_DATA.powerups.openPlan.tiers[2].duration * 60;
                          PowerUps.showEffectOnLift(l.id, '↔️');
                      });
                  } 
                }
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
            if (typeof window.Game.Audio !== 'undefined') window.Game.Audio.play('powerup');
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
        if (typeof window.Game.Audio !== 'undefined') window.Game.Audio.play('powerup');
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
        if (liftId !== null && Registry.lifts[liftId]) {
            const lift = Registry.lifts[liftId];
            if (lift.tardisTimer > 0) return 999;
            let cap = Config.liftCapacity;
            if (lift.isDoubleDecker || lift.doubleDeckerTimer > 0) cap *= 2;
            return cap;
        }
        return Config.liftCapacity;
    }
};

PowerUps.init();
