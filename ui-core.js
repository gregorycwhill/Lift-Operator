// ============================================================================
// UI-CORE.JS : GRID GENERATION, ACTIVE LIFT RENDERING, & CANVAS MUTATIONS
// ============================================================================

window.buildWorld = function() {
    const ui = GameUI();
    const world = document.getElementById('world');
    if (!world) return;
    world.innerHTML = ''; 
    
    const FIXED_BOARD_HEIGHT = 600; 
    Registry.floorHeight = FIXED_BOARD_HEIGHT / Config.numFloors;
    
    // Update CSS Variables
    world.style.setProperty('--floor-height', `${Registry.floorHeight}px`);
    world.style.setProperty('--shaft-count', Registry.lifts.length);
    world.style.height = (FIXED_BOARD_HEIGHT + 40) + 'px'; 
    world.style.gridTemplateRows = `repeat(${Config.numFloors}, var(--floor-height)) 40px`;
    
    for (let f = Config.numFloors - 1; f >= 0; f--) {
        const row = document.createElement('div'); 
        row.className = 'floor';
        row.id = `floor-row-${f}`;
        
        const labelText = (f === 0 ? 'G' : f);
        const label = document.createElement('div');
        label.className = 'label';
        if (Registry.gymFloor && f === Registry.gymFloor) {
            label.innerText = '💪';
            label.style.fontSize = '20px';
            label.style.background = '#f1c40f';
        } else {
            label.innerText = labelText;
        }
        row.appendChild(label);

        const lobby = document.createElement('div');
        lobby.className = 'lobby';
        lobby.id = `lobby-${f}`;
        row.appendChild(lobby);

        Registry.lifts.forEach((lift, index) => {
            const shaft = document.createElement('div');
            shaft.className = 'shaft';
            shaft.dataset.liftIndex = index;
            shaft.dataset.floorIndex = f;
            row.appendChild(shaft);
        });
        world.appendChild(row);
    }

    // Global Event Delegation for Shaft Clicks
    if (!world.dataset.hasListener) {
        world.addEventListener('click', (e) => {
            const shaft = e.target.closest('.shaft');
            if (shaft && shaft.dataset.liftIndex !== undefined) {
                const engine = GameEngine();
                const liftIdx = parseInt(shaft.dataset.liftIndex);
                const floorIdx = parseInt(shaft.dataset.floorIndex);
                if (typeof engine.setLiftTarget === 'function') engine.setLiftTarget(liftIdx, floorIdx);
                else if (typeof window.setLiftTarget === 'function') window.setLiftTarget(liftIdx, floorIdx);
            }
        });
        world.dataset.hasListener = "true";
    }

    const controlRow = document.createElement('div');
    controlRow.className = 'floor';
    controlRow.style.height = '40px';
    controlRow.style.background = '#e8ecf1';
    controlRow.style.borderTop = '2px solid #333';
    
    const autoLabel = document.createElement('div');
    autoLabel.className = 'label';
    autoLabel.style.border = 'none';
    autoLabel.style.fontSize = '12px';
    autoLabel.style.color = '#555';
    autoLabel.innerText = 'AUTO';
    controlRow.appendChild(autoLabel);

    const autoLobby = document.createElement('div');
    autoLobby.className = 'lobby';
    autoLobby.style.border = 'none';
    controlRow.appendChild(autoLobby);
    
    const automationUnlocks = Config.GAME_DATA.automationUnlocks;
    const reachedRound = Math.max(Registry.highestUnlockedRound || 1, Registry.stats.round || 1);
    const isAutoUnlocked = Config.debugMode || reachedRound >= automationUnlocks.sweep;
    const isPriorityUnlocked = Config.debugMode || reachedRound >= automationUnlocks.priority;
    const isVotingUnlocked = Config.debugMode || reachedRound >= automationUnlocks.voting;
    const areCustomScriptsUnlocked = Config.debugMode || reachedRound >= automationUnlocks.custom;
    
    const builtIns = [];
    const myScripts = [];
    const sharedScripts = [];
    let currentPlayer = Registry.playerName || window.Game.Storage.get(window.Game.Keys.PLAYER, 'Pilot 1');

    const VM = window.Game.Automation || (typeof AutomationVM !== 'undefined' ? AutomationVM : (typeof AutomationWorkshop !== 'undefined' ? AutomationWorkshop : null));

    if (VM && VM.scripts) {
        VM.scripts.forEach(script => {
            if (script.author === "System") {
                let engineVal = 'manual';
                let isUnlocked = false;
                
                if (script.id === 'sys_sweep') { engineVal = 'sweep'; isUnlocked = isAutoUnlocked; }
                else if (script.id === 'sys_priority') { engineVal = 'priority-sweep'; isUnlocked = isPriorityUnlocked; }
                else if (script.id === 'sys_voting') { engineVal = 'voting'; isUnlocked = isVotingUnlocked; }
                else if (script.id === 'sys_weighted') { engineVal = 'weighted-voting'; isUnlocked = isVotingUnlocked; }
                
                if (isUnlocked) {
                    builtIns.push({ value: engineVal, name: script.name });
                }
            } else if (script.author === currentPlayer && areCustomScriptsUnlocked) {
                myScripts.push({ value: `custom_${script.id}`, name: script.name });
            } else if (areCustomScriptsUnlocked) {
                sharedScripts.push({ value: `custom_${script.id}`, name: `${script.name} (by ${script.author})` });
            }
        });
    }

    Registry.lifts.forEach((lift, index) => {
        const shaftContainer = document.createElement('div');
        shaftContainer.className = 'shaft';
        shaftContainer.style.boxSizing = 'border-box';
        shaftContainer.style.borderRight = '2px solid #ddd';
        shaftContainer.style.display = 'flex';
        shaftContainer.style.justifyContent = 'center';
        shaftContainer.style.alignItems = 'center';
        shaftContainer.style.padding = '5px';
        shaftContainer.style.cursor = 'default';

            // Pedal Power icon removed from here
            const select = document.createElement('select');
        select.dataset.liftIndex = index;
        if (!isAutoUnlocked) select.disabled = true;
        select.style.width = '90%';
        select.style.fontSize = '12px';
        select.style.padding = '2px';

        const manualOpt = document.createElement('option');
        manualOpt.value = 'manual';
        manualOpt.innerText = 'Manual';
        if (lift.automation === 'manual') manualOpt.selected = true;
        select.appendChild(manualOpt);

        const addGroup = (label, items) => {
            if (items.length === 0) return;
            const group = document.createElement('optgroup');
            group.label = label;
            items.forEach(item => {
                const opt = document.createElement('option');
                opt.value = item.value;
                opt.innerText = item.name;
                group.appendChild(opt);
            });
            select.appendChild(group);
        };

        addGroup('Built-in', builtIns);
        addGroup('My Automations', myScripts);
        addGroup('Shared with Me', sharedScripts);

        select.addEventListener('change', () => {
            const engine = GameEngine();
            if (typeof engine.setLiftAutomation === 'function') engine.setLiftAutomation(index, select.value);
            else setLiftAutomation(index, select.value);
        });

        shaftContainer.appendChild(select);
        controlRow.appendChild(shaftContainer);
    });

    world.appendChild(controlRow);

    setTimeout(() => {
        Registry.lifts.forEach((lift, index) => {
            if (lift.automation !== 'manual') {
                const select = world.querySelector(`select[data-lift-index="${index}"]`);
                if(select) select.value = lift.automation;
            }
        });
    }, 0);

    Registry.lifts.forEach((lift, index) => {
        const car = document.createElement('div');
        car.id = `lift-el-${index}`;
        
        let extraClass = '';
        if (lift.automation === 'sweep') extraClass = 'sweep-mode';
        if (lift.automation === 'priority-sweep') extraClass = 'priority-sweep-mode';
        if (lift.automation === 'voting') extraClass = 'voting-mode';
        if (lift.automation === 'weighted-voting') extraClass = 'weighted-voting-mode';
        if (lift.automation.startsWith('custom_')) extraClass = 'custom-mode';
        
        if (lift.isJammed) extraClass += ' jammed';
        
        let gymBroCount = lift.passengers.filter(p => p.isGymBro).length;
        if (lift.stinkTimer > 0 || gymBroCount >= Config.gymBroStinkThreshold) extraClass += ' stinky';
        
        car.className = `lift ${extraClass}`;
        car.style.setProperty('--lift-index', index);
        car.style.pointerEvents = 'none'; 
        
        updateLiftVisualState(lift, index, car);
        world.appendChild(car);
    });
    
    world.style.width = (410 + Registry.lifts.length * 120) + 'px';

    // Pedal Power Decoration (Roof Top)
    if (Registry.stats.round === 13) {
        Registry.lifts.forEach((lift, index) => {
            const bike = document.createElement('div');
            bike.innerText = '🚲';
            bike.style.position = 'absolute';
            bike.style.top = '-32px'; // Shifted up further from -25px
            bike.style.left = `${412 + index * 120 + 5}px`; // Moved slightly more left
            bike.style.fontSize = '20px';
            bike.style.zIndex = '100';
            bike.style.opacity = '0.8';
            world.appendChild(bike);
        });
    }
    
    const seedContainer = document.getElementById('seedDisplay');
    if (seedContainer && !document.getElementById('spontaneousShareLink')) {
        const shareLink = document.createElement('button');
        shareLink.id = 'spontaneousShareLink';
        shareLink.className = 'btn btn-blue btn-small';
        shareLink.style.marginLeft = '8px';
        shareLink.style.padding = '2px 6px';
        shareLink.style.fontSize = '11px';
        shareLink.innerText = '🔗 Share Seed';
        shareLink.onclick = () => {
            const ui = GameUI();
            if (typeof ui.shareGame === 'function') ui.shareGame();
        };
        seedContainer.parentNode.appendChild(shareLink);
    }

    const debugOptionBtn = document.getElementById('openDebugBtn');
    if (debugOptionBtn) {
        debugOptionBtn.classList.toggle('hidden', !Config.debugMode);
    }

    if (typeof updateInventoryUI === 'function') updateInventoryUI();
    if (typeof updateLocksUI === 'function') updateLocksUI();
};


window.updateLiftAutomationUI = function(liftIndex, mode) {
    const car = document.getElementById(`lift-el-${liftIndex}`);
    if (car) {
        car.classList.remove('sweep-mode', 'priority-sweep-mode', 'voting-mode', 'weighted-voting-mode', 'custom-mode');
        if (mode === 'sweep') car.classList.add('sweep-mode');
        if (mode === 'priority-sweep') car.classList.add('priority-sweep-mode');
        if (mode === 'voting') car.classList.add('voting-mode');
        if (mode === 'weighted-voting') car.classList.add('weighted-voting-mode');
        if (mode.startsWith('custom_')) car.classList.add('custom-mode');
    }

    const automationSelects = document.querySelectorAll('.shaft select');
    if (automationSelects && automationSelects[liftIndex]) {
        automationSelects[liftIndex].value = mode;
    }
};

window.updateLiftVisualState = function(lift, index, carEl) {
    const car = carEl || document.getElementById(`lift-el-${index}`);
    if (!car) return;

    car.classList.toggle('jammed', lift.jamTimer > 0 || lift.isJammed);

    const gymBroCount = lift.passengers.filter(p => p.isGymBro).length;
    let isStinky = lift.stinkTimer > 0 || gymBroCount >= Config.gymBroStinkThreshold;
    const hasStinkImmunity = lift.freshenerTimer > 0 || (typeof PowerUps !== 'undefined' && PowerUps.timers.stinkImmunity > 0);
    if (hasStinkImmunity) isStinky = false;
    car.classList.toggle('stinky', isStinky);
    
    // State-based classes
    car.classList.toggle('transit', lift.state === 'TRANSIT');
    car.classList.toggle('doors-opening', lift.state === 'DOORS_OPENING');
    car.classList.toggle('boarding', lift.state === 'BOARDING');
    car.classList.toggle('doors-closing', lift.state === 'DOORS_CLOSING');
    car.classList.toggle('idle', lift.state === 'IDLE');

    // Phase 2.5: Power-up Expansions Rendering
    const isDouble = lift.isDoubleDecker || lift.doubleDeckerTimer > 0;
    const isOpenPlan = lift.openPlanTimer > 0;

    car.classList.toggle('double-decker', isDouble);
    car.classList.toggle('open-plan', isOpenPlan);

    const liftHeight = isDouble ? (Math.min(50, Registry.floorHeight * 0.85) * 2) : Math.min(50, Registry.floorHeight * 0.85);
    const bottomOffset = 40 + (Registry.floorHeight - Math.min(50, Registry.floorHeight * 0.85)) / 2;
    
    // Calculate animation speed based on turbo
    const isTurbo = lift.turboTimer > 0 || (typeof PowerUps !== 'undefined' && PowerUps.timers.globalTurbo > 0);
    const animSpeed = isTurbo ? '0.008s' : '0.016s';

    car.style.setProperty('--lift-width', `${110}px`);
    car.style.setProperty('--lift-height', `${liftHeight}px`);
    car.style.setProperty('--lift-pos', `${lift.pos}px`);
    car.style.setProperty('--lift-bottom-offset', `${bottomOffset}px`);
    car.style.setProperty('--lift-left', `${415 + index * 120}px`);
    car.style.setProperty('--lift-anim-speed', animSpeed);
};

window.showLiftCapacity = function(liftId, durationMs = 1800) {
    const lift = Registry.lifts[liftId];
    const car = document.getElementById(`lift-el-${liftId}`);
    const world = document.getElementById('world');
    if (!lift || !car || !world) return;
    const capacity = typeof PowerUps !== 'undefined' ? PowerUps.getLiftCapacity(liftId) : Config.liftCapacity;
    lift.lastEffectiveCapacity = capacity;
    world.querySelector(`[data-capacity-lift="${liftId}"]`)?.remove();

    const indicator = document.createElement('div');
    indicator.className = 'capacity-float';
    indicator.dataset.capacityLift = String(liftId);
    indicator.textContent = `Capacity ${capacity >= 999 ? '∞' : capacity}`;
    indicator.style.left = `${415 + liftId * 120}px`;
    indicator.style.bottom = `${lift.pos + 96}px`;
    world.appendChild(indicator);
    setTimeout(() => indicator.remove(), durationMs);
};

window.applyAutomationTeachingCue = function() {
    const round = Registry.stats.round;
    const unlocks = Config.GAME_DATA.automationUnlocks;
    const currentPlayer = Registry.playerName || window.Game.Storage.get(window.Game.Keys.PLAYER, 'Pilot 1');
    const scripts = window.Game.Automation?.scripts || [];
    const hasShared = scripts.some(script => script.author !== 'System' && script.author !== currentPlayer);
    let cueId = null;
    if (round === unlocks.sweep) cueId = 'built-in';
    else if (round === unlocks.custom) cueId = 'custom';
    else if (round >= unlocks.custom && hasShared) cueId = 'shared';
    if (!cueId) return null;

    const storageKey = `liftOp_teaching_automation_${cueId}`;
    if (window.Game.Storage.get(storageKey, '0') === '1') return null;
    const selects = [...document.querySelectorAll('.shaft select:not(:disabled)')];
    selects.forEach(select => {
        select.classList.add('automation-teaching-cue');
        select.dataset.teachingCue = cueId;
        select.addEventListener('change', () => {
            window.Game.Storage.set(storageKey, '1');
            selects.forEach(item => item.classList.remove('automation-teaching-cue'));
        }, { once: true });
    });
    return cueId;
};



window.draw = function() {
    const ui = GameUI();
    const topFloorRow = document.getElementById(`floor-row-${Config.numFloors - 1}`);
    if (topFloorRow) {
        if (Registry.sunsetActive) { 
            if (!topFloorRow.classList.contains('rooftop-party')) topFloorRow.classList.add('rooftop-party'); 
        } else { 
            if (topFloorRow.classList.contains('rooftop-party')) topFloorRow.classList.remove('rooftop-party'); 
        }
    }

    Registry.lifts.forEach((lift, index) => {
        const car = document.getElementById(`lift-el-${index}`);
        if (car) {
            // OPTIMIZATION: Only update if passenger state has changed
            const guestStateKey = lift.passengers.map(p => `${p.dest}-${p.status}`).join('|');
            const isDouble = lift.isDoubleDecker || lift.doubleDeckerTimer > 0;
            const stateHash = `${guestStateKey}-${isDouble}`;

            if (car.dataset.guestState === stateHash) {
                // Icons still need checking though, or we can hash them too
            } else {
                car.dataset.guestState = stateHash;
                while (car.firstChild) car.removeChild(car.firstChild);

                if (isDouble) {
                    const topDeck = document.createElement('div');
                    topDeck.className = 'lift-deck top';
                    const bottomDeck = document.createElement('div');
                    bottomDeck.className = 'lift-deck bottom';
                    car.appendChild(topDeck);
                    car.appendChild(bottomDeck);

                    lift.passengers.forEach((p, i) => {
                        const guest = document.createElement('div');
                        let classList = `guest ${p.status}`;
                        if (p.isVip) classList += ' vip';
                        if (p.isPartying) classList += ' partying';
                        if (p.isGymBro) classList += ' swol';
                        if (p.isRoomService) classList += ' room-service';
                        guest.className = classList;
                        guest.innerText = (typeof ui.getGuestText === 'function') ? ui.getGuestText(p) : window.getGuestText(p);
                        
                        // Roughly split passengers between decks
                        if (i % 2 === 0) topDeck.appendChild(guest);
                        else bottomDeck.appendChild(guest);
                    });
                } else {
                    lift.passengers.forEach(p => {
                        const guest = document.createElement('div');
                        let classList = `guest ${p.status}`;
                        if (p.isVip) classList += ' vip';
                        if (p.isPartying) classList += ' partying';
                        if (p.isGymBro) classList += ' swol';
                        if (p.isRoomService) classList += ' room-service';
                        guest.className = classList;
                        guest.innerText = (typeof ui.getGuestText === 'function') ? ui.getGuestText(p) : window.getGuestText(p);
                        car.appendChild(guest);
                    });
                }
            }

            // Icons rendering (always check these for now as they are few)
            // Note: We should probably hash these too if performance is still an issue
            let iconsDiv = car.querySelector('.lift-icons');
            const activeIcons = [];
            if (lift.tardisTimer > 0 || (typeof PowerUps !== 'undefined' && PowerUps.timers.globalTardis > 0)) activeIcons.push({type: 'emoji', val: '🌌'});
            if (lift.turboTimer > 0 || (typeof PowerUps !== 'undefined' && PowerUps.timers.globalTurbo > 0)) activeIcons.push({type: 'emoji', val: '🚀'});
            if (lift.freshenerTimer > 0 || (typeof PowerUps !== 'undefined' && PowerUps.timers.stinkImmunity > 0)) activeIcons.push({type: 'emoji', val: '🌲'});
            if (lift.musakTimer > 0) activeIcons.push({type: 'emoji', val: '🎵'});
            if (typeof PowerUps !== 'undefined' && PowerUps.timers.wideDoors > 0) activeIcons.push({type: 'emoji', val: '🚪'});
            if (typeof PowerUps !== 'undefined' && PowerUps.timers.jamImmunity > 0) activeIcons.push({type: 'emoji', val: '🔧'});
            if (lift.isJammed) activeIcons.push({type: 'jam', val: '⚠️'});
            
            // Render active effects
            if (lift.effects) {
                lift.effects.forEach(eff => {
                    activeIcons.push({ type: 'effect', val: eff.icon });
                });
            }

            if (activeIcons.length > 0) {
                if (!iconsDiv) {
                    iconsDiv = document.createElement('div');
                    iconsDiv.className = 'lift-icons';
                    iconsDiv.style.position = 'absolute';
                    iconsDiv.style.top = '-28px';
                    iconsDiv.style.left = '0';
                    iconsDiv.style.width = '100%';
                    iconsDiv.style.textAlign = 'center';
                    iconsDiv.style.fontSize = '22px';
                    iconsDiv.style.zIndex = '100';
                    iconsDiv.style.pointerEvents = 'none';
                    iconsDiv.style.textShadow = '0 2px 5px rgba(0,0,0,0.5)';
                    car.appendChild(iconsDiv);
                }
                
                const iconKey = activeIcons.map(ic => ic.val).join('');
                if (iconsDiv.dataset.iconKey !== iconKey) {
                    iconsDiv.dataset.iconKey = iconKey;
                    iconsDiv.innerHTML = '';
                    activeIcons.forEach(ic => {
                        const span = document.createElement('span');
                        if (ic.type === 'jam') span.className = 'jammed-alert';
                        span.innerText = ic.val;
                        iconsDiv.appendChild(span);
                    });
                }
            } else if (iconsDiv) {
                iconsDiv.remove();
            }
        }
    });
    
    const renderNow = performance.now();
    if (renderNow - (Registry.lastLobbyRenderTime || 0) < 100) return;
    Registry.lastLobbyRenderTime = renderNow;

    const lobbies = document.querySelectorAll('.lobby');
    lobbies.forEach((lobby, idx) => {
        let actualFloorId = Config.numFloors - 1 - idx;
        if (lobby && Registry.floors[actualFloorId]) {
            const guests = Registry.floors[actualFloorId].waitingGuests;
            const visibleGuests = guests.slice(0, 18);
            const guestStateKey = `${guests.length}:` + visibleGuests.map(g => `${g.dest}-${g.status}-${g.isVip ? 1 : 0}-${g.isGymBro ? 1 : 0}-${g.isRoomService ? 1 : 0}`).join('|');
            
            if (lobby.dataset.guestState !== guestStateKey) {
                lobby.dataset.guestState = guestStateKey;
                while (lobby.firstChild) lobby.removeChild(lobby.firstChild);

                visibleGuests.forEach(g => {
                    const guest = document.createElement('div');
                    let classList = `guest ${g.status}`;
                    if (g.isVip) classList += ' vip';
                    if (g.isPartying) classList += ' partying';
                    if (g.isGymBro) classList += ' swol';
                    if (g.isRoomService) classList += ' room-service';
                    guest.className = classList;
                    guest.innerText = (typeof ui.getGuestText === 'function') ? ui.getGuestText(g) : window.getGuestText(g);
                    lobby.appendChild(guest);
                });
                if (guests.length > visibleGuests.length) {
                    const overflow = document.createElement('div');
                    overflow.className = 'queue-overflow';
                    overflow.innerText = `+${guests.length - visibleGuests.length}`;
                    lobby.appendChild(overflow);
                }
            }

            // Power-up indicators in lobby
            const hasMusak = typeof PowerUps !== 'undefined' && (PowerUps.timers.globalAngerPause > 0 || (PowerUps.floorAngerPause && PowerUps.floorAngerPause[actualFloorId] > 0));
            let musakIcon = lobby.querySelector('.lobby-musak');
            if (hasMusak) {
                if (!musakIcon) {
                    musakIcon = document.createElement('div');
                    musakIcon.className = 'lobby-musak';
                    musakIcon.style.display = 'inline-block';
                    musakIcon.style.verticalAlign = 'top';
                    musakIcon.style.marginLeft = '10px';
                    musakIcon.style.fontSize = '22px';
                    musakIcon.style.textShadow = '0 2px 5px rgba(0,0,0,0.3)';
                    musakIcon.innerText = '🎵';
                    lobby.appendChild(musakIcon);
                }
            } else if (musakIcon) {
                musakIcon.remove();
            }
        }
    });
};

window.triggerDefenestration = function(guestEl, floorIndex, guestIndex) {
    const worldEl = document.getElementById('world');
    if (!worldEl) return;
    
    const ghost = document.createElement('div');
    ghost.className = 'guest rage flying-out';
    ghost.innerText = '💀';
    
    const worldRect = worldEl.getBoundingClientRect();
    
    if (guestEl) {
        const guestRect = guestEl.getBoundingClientRect();
        ghost.style.left = (guestRect.left - worldRect.left) + 'px';
        ghost.style.top = (guestRect.top - worldRect.top) + 'px';
    } else {
        let fallbackLeft = 300;
        let fallbackTop = ((Config.numFloors - 1 - floorIndex) * Registry.floorHeight + (Registry.floorHeight / 3));
        const lobbyRows = document.querySelectorAll('.lobby');
        if (lobbyRows && lobbyRows.length > 0) {
            const lobbyIndex = Config.numFloors - 1 - floorIndex;
            const lobby = lobbyRows[lobbyIndex];
            if (lobby) {
                const guestChild = typeof guestIndex === 'number' ? lobby.children[guestIndex] : null;
                if (guestChild) {
                    const guestRect = guestChild.getBoundingClientRect();
                    ghost.style.left = (guestRect.left - worldRect.left) + 'px';
                    ghost.style.top = (guestRect.top - worldRect.top) + 'px';
                } else {
                    const shafts = document.getElementById('floor-row-0')?.querySelectorAll('.shaft');
                    if (shafts.length > 0) {
                        const shaftRect = shafts[0].getBoundingClientRect();
                        fallbackLeft = (shaftRect.left - worldRect.left);
                    }
                    ghost.style.left = fallbackLeft + 'px';
                    ghost.style.top = fallbackTop + 'px';
                }
            }
        } else {
            const firstRow = document.getElementById('floor-row-0');
            if (firstRow) {
                const shafts = firstRow.querySelectorAll('.shaft');
                if (shafts.length > 0) {
                    const shaftRect = shafts[0].getBoundingClientRect();
                    fallbackLeft = (shaftRect.left - worldRect.left);
                }
            }
            ghost.style.left = fallbackLeft + 'px';
            ghost.style.top = fallbackTop + 'px';
        }
    }
    
    worldEl.appendChild(ghost);
    setTimeout(() => { if (ghost.parentNode) ghost.remove(); }, 3000);
};

window.updateScoreboardUI = function() {
    const isEndurance = Registry.stats.round === 12;
    const displaySeconds = isEndurance ? (Registry.enduranceSeconds || 0) : Registry.stats.timeLeft;
    const m = Math.floor(displaySeconds / 60);
    const s = (displaySeconds % 60).toString().padStart(2, '0');
    if (document.getElementById('clock-display')) document.getElementById('clock-display').innerText = `${m}:${s}`;
    if (document.getElementById('round-display')) document.getElementById('round-display').innerText = Registry.stats.round;
    
    const subTitle = document.getElementById('round-subtitle');
    if (subTitle && Config.roundTitles) {
        subTitle.innerText = Config.roundTitles[Registry.stats.round] || "";
    }

    if (document.getElementById('lives-display')) document.getElementById('lives-display').innerText = `Lives: ❤️ ${Registry.stats.lives}`;
};

window.getGuestText = function(g) {
    if (g.status === GuestStatus.RAGE) return '💀';
    if (g.isVip) return '⭐';
    
    let txt = g.dest === 0 ? 'G' : g.dest;
    
    if (g.isRoomService) return `🍽️${txt}`;
    if (g.isGymBro) return `💪${txt}`;
    if (g.isSunset) return 'R';
    
    return txt;
};

// ============================================================================
// UI NAMESPACE BINDINGS
// ============================================================================

window.UI = window.UI || {};
window.UI.buildWorld = window.buildWorld;
window.UI.draw = window.draw;
window.UI.triggerDefenestration = window.triggerDefenestration;
window.UI.updateScoreboardUI = window.updateScoreboardUI;
window.UI.getGuestText = window.getGuestText;
window.UI.updateLiftAutomationUI = window.updateLiftAutomationUI;
window.UI.updateLiftVisualState = window.updateLiftVisualState;
window.UI.showLiftCapacity = window.showLiftCapacity;
window.UI.applyAutomationTeachingCue = window.applyAutomationTeachingCue;

window.Game = window.Game || {};
window.Game.UI = window.Game.UI || {};
Object.assign(window.Game.UI, window.UI);

// Backwards compatibility for global scope
window.buildWorld = window.UI.buildWorld;
window.draw = window.UI.draw;
window.triggerDefenestration = window.UI.triggerDefenestration;
window.updateScoreboardUI = window.UI.updateScoreboardUI;
window.getGuestText = window.UI.getGuestText;
window.updateLiftAutomationUI = window.UI.updateLiftAutomationUI;
window.updateLiftVisualState = window.UI.updateLiftVisualState;
window.updateLiftVisualState = window.UI.updateLiftVisualState;
