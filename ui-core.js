// ============================================================================
// UI-CORE.JS : GRID GENERATION, ACTIVE LIFT RENDERING, & CANVAS MUTATIONS
// ============================================================================

window.getLiftLayoutMetrics = function() {
    if (Registry.capsuleMode) {
        // Keep a symmetric clearance around the capsule despite the 3px tube
        // divider. The old 30/28 geometry put the car 4px right of centre and
        // let its border overlap the divider.
        return { shaftWidth: 34, liftWidth: 26, baseLeft: 412 };
    }
    const compact = Registry.lifts.length >= 8;
    return {
        shaftWidth: compact ? 72 : 120,
        liftWidth: compact ? 68 : 110,
        baseLeft: 415
    };
};

window.buildWorld = function() {
    const ui = GameUI();
    const world = document.getElementById('world');
    if (!world) return;
    const messageRail = document.getElementById('game-message-rail');
    world.innerHTML = ''; 
    world.classList.toggle('capsule-bank', Boolean(Registry.capsuleMode));
    world.classList.toggle('zoning-active', Boolean(Registry.isZoningEnabled?.()));
    
    const FIXED_BOARD_HEIGHT = 600; 
    const layout = window.getLiftLayoutMetrics();
    Registry.floorHeight = FIXED_BOARD_HEIGHT / Config.numFloors;
    
    // Update CSS Variables
    world.style.setProperty('--floor-height', `${Registry.floorHeight}px`);
    world.style.setProperty('--shaft-width', `${layout.shaftWidth}px`);
    world.style.setProperty('--lift-width', `${layout.liftWidth}px`);
    world.style.setProperty('--shaft-count', Registry.lifts.length);
    world.style.height = (FIXED_BOARD_HEIGHT + 40) + 'px'; 
    world.style.gridTemplateRows = `repeat(${Config.numFloors}, var(--floor-height)) 40px`;
    
    for (let f = Config.numFloors - 1; f >= 0; f--) {
        const row = document.createElement('div'); 
        row.className = 'floor floor-row';
        row.id = `floor-row-${f}`;
        
        const labelText = (f === 0 ? 'G' : f);
        const label = document.createElement('div');
        label.className = 'label';
        if (f === Config.numFloors - 1 && Registry.sunsetActive) {
            label.innerText = '🍹';
            label.setAttribute('aria-label', `Rooftop Party, floor ${f}`);
            label.style.fontSize = '20px';
            label.style.background = '#8e44ad';
        } else if (Registry.gymFloor && f === Registry.gymFloor) {
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
            const shaftLift = Registry.lifts[index];
            if (Registry.isZoningEnabled?.()) {
                shaft.classList.toggle('zone-served', Registry.isFloorInLiftZone(shaftLift, f));
                shaft.classList.toggle('zone-unserved', !Registry.isFloorInLiftZone(shaftLift, f));
            }
            row.appendChild(shaft);
        });
        world.appendChild(row);
    }

    if (Registry.counterweightEnabled) {
        for (let index = 0; index < Registry.lifts.length - 1; index += 2) {
            const pair = document.createElement('div');
            pair.className = 'counterweight-pair-visual';
            pair.dataset.pairStart = String(index);
            pair.style.left = `${layout.baseLeft + index * layout.shaftWidth}px`;
            pair.style.width = `${layout.shaftWidth * 2}px`;
            pair.style.height = `${FIXED_BOARD_HEIGHT}px`;
            const cableFrame = document.createElement('span');
            cableFrame.className = 'counterweight-cable-frame';
            const pulleys = ['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(position => {
                const pulley = document.createElement('span');
                pulley.className = `counterweight-pulley ${position}`;
                return pulley;
            });
            pair.append(cableFrame, ...pulleys);
            world.appendChild(pair);
        }
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
    controlRow.className = 'floor automation-control-row';
    controlRow.style.height = '40px';
    controlRow.style.background = '#e8ecf1';
    controlRow.style.borderTop = '2px solid #333';
    
    const autoLabel = document.createElement('div');
    autoLabel.className = 'label';
    autoLabel.style.border = 'none';
    autoLabel.style.fontSize = '12px';
    autoLabel.style.color = '#555';
    autoLabel.innerText = '⚙⇅';
    autoLabel.setAttribute('aria-label', 'Basement automation controls');
    autoLabel.title = 'Basement automation controls';
    controlRow.appendChild(autoLabel);

    const autoLobby = document.createElement('div');
    autoLobby.className = 'lobby';
    autoLobby.style.border = 'none';
    controlRow.appendChild(autoLobby);

    window.Game.AutomationController?.renderDock({ autoLobby, controlRow });
    if (Registry.stats.round === 1) {
        controlRow.classList.add('automation-controls-locked');
        controlRow.querySelectorAll('button, input').forEach(control => { control.disabled = true; control.setAttribute('aria-disabled', 'true'); });
    }
    world.appendChild(controlRow);

    Registry.lifts.forEach((lift, index) => {
        const car = document.createElement('div');
        car.id = `lift-el-${index}`;
        
        let extraClass = '';
        if (lift.automation === 'sweep') extraClass = 'sweep-mode';
        if (lift.automation === 'priority-sweep') extraClass = 'priority-sweep-mode';
        if (lift.automation === 'voting') extraClass = 'voting-mode';
        if (lift.automation === 'weighted-voting') extraClass = 'weighted-voting-mode';
        if (lift.automation === 'zoned-low' || lift.automation === 'zoned-high') extraClass = 'zoned-mode';
        if (lift.automation.startsWith('custom_')) extraClass = 'custom-mode';
        
        if (lift.isJammed) extraClass += ' jammed';
        
        let gymBroCount = lift.passengers.filter(p => p.isGymBro).length;
        if (lift.stinkTimer > 0 || gymBroCount >= Config.gymBroStinkThreshold) extraClass += ' stinky';
        
        car.className = `lift ${extraClass}${Registry.capsuleMode ? ' capsule-car' : ''}`;
        if (Registry.counterweightEnabled) car.classList.add('counterweight-car');
        if (Number.isInteger(lift.counterweightPartner)) car.dataset.counterweightPartner = String(lift.counterweightPartner);
        car.style.setProperty('--lift-index', index);
        car.style.pointerEvents = 'none'; 
        
        updateLiftVisualState(lift, index, car);
        world.appendChild(car);
    });
    
    world.style.width = (410 + Registry.lifts.length * layout.shaftWidth) + 'px';

    // Operational notices are an in-world shaft overlay. Moving the shared
    // rail here keeps VIP, Rooftop and teaching messages out of flex layout
    // and leaves the lobby queue visible.
    if (messageRail) world.appendChild(messageRail);

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
    
    const seedContainer = document.getElementById('seedContainer');
    if (seedContainer) seedContainer.hidden = !Config.debugMode;
    const existingShareLink = document.getElementById('spontaneousShareLink');
    if (!Config.debugMode && existingShareLink) existingShareLink.remove();
    if (Config.debugMode && seedContainer && !existingShareLink) {
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
        seedContainer.appendChild(shareLink);
    }

    const debugOptionBtn = document.getElementById('openDebugBtn');
    if (debugOptionBtn) {
        debugOptionBtn.classList.toggle('hidden', !Config.debugMode);
    }

    if (typeof updateInventoryUI === 'function') updateInventoryUI();
    if (typeof updateLocksUI === 'function') updateLocksUI();
    window.Game.Feedback?.renderBuildLabels?.();
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

    const status = document.querySelector(`.automation-status[data-lift-index="${liftIndex}"]`);
    const policy = window.Game.AutomationController?.getPolicy?.(mode);
    if (status) {
        const automationName = policy?.name || mode;
        status.textContent = automationName;
        status.title = `Lift ${liftIndex + 1}: ${automationName}`;
        status.setAttribute('aria-label', `Lift ${liftIndex + 1}, automation ${automationName}`);
    }
    window.updateZoneVisuals?.();
};

window.updateZoneVisuals = function() {
    const zoning = Boolean(Registry.isZoningEnabled?.());
    document.getElementById('world')?.classList.toggle('zoning-active', zoning);
    document.querySelectorAll('.shaft[data-lift-index][data-floor-index]').forEach(shaft => {
        const lift = Registry.lifts[Number(shaft.dataset.liftIndex)];
        const floor = Number(shaft.dataset.floorIndex);
        shaft.classList.toggle('zone-served', zoning && Registry.isFloorInLiftZone(lift, floor));
        shaft.classList.toggle('zone-unserved', zoning && !Registry.isFloorInLiftZone(lift, floor));
    });
};

window.updateLiftVisualState = function(lift, index, carEl) {
    const car = carEl || document.getElementById(`lift-el-${index}`);
    if (!car) return;

    car.classList.toggle('jammed', lift.jamTimer > 0 || lift.isJammed);
    car.classList.toggle('counterweight-car', Boolean(Registry.counterweightEnabled && Number.isInteger(lift.counterweightPartner)));
    const capacity = typeof PowerUps !== 'undefined' ? PowerUps.getLiftCapacity(index) : Config.liftCapacity;
    car.classList.toggle('capacity-full', Registry.getLiftWeight(lift) >= capacity);

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
    const isDouble = !Registry.capsuleMode && (lift.isDoubleDecker || lift.doubleDeckerTimer > 0);
    const isOpenPlan = lift.openPlanTimer > 0;

    car.classList.toggle('double-decker', isDouble);
    car.classList.toggle('open-plan', isOpenPlan);

    const baseLiftHeight = Registry.capsuleMode
        ? Math.min(28, Registry.floorHeight * 0.65)
        : Math.min(50, Registry.floorHeight * 0.85);
    const liftHeight = isDouble ? baseLiftHeight * 2 : baseLiftHeight;
    const bottomOffset = 40 + (Registry.floorHeight - baseLiftHeight) / 2;
    
    // Calculate animation speed based on turbo
    const isTurbo = lift.turboTimer > 0 || (typeof PowerUps !== 'undefined' && PowerUps.timers.globalTurbo > 0);
    const animSpeed = isTurbo ? '0.008s' : '0.016s';

    const layout = window.getLiftLayoutMetrics();
    car.style.setProperty('--lift-width', `${layout.liftWidth}px`);
    car.style.setProperty('--lift-height', `${liftHeight}px`);
    car.style.setProperty('--lift-pos', `${lift.pos}px`);
    car.style.setProperty('--lift-bottom-offset', `${bottomOffset}px`);
    car.style.setProperty('--lift-left', `${layout.baseLeft + index * layout.shaftWidth}px`);
    car.style.setProperty('--lift-anim-speed', animSpeed);
    const overlay = document.getElementById(`lift-effects-${index}`);
    if (overlay) {
        overlay.style.setProperty('--lift-width', `${layout.liftWidth}px`);
        overlay.style.setProperty('--lift-height', `${liftHeight}px`);
        overlay.style.setProperty('--lift-pos', `${lift.pos}px`);
        overlay.style.setProperty('--lift-bottom-offset', `${bottomOffset + liftHeight + 4}px`);
        overlay.style.setProperty('--lift-left', `${layout.baseLeft + index * layout.shaftWidth}px`);
    }
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
    const layout = window.getLiftLayoutMetrics();
    indicator.textContent = `${layout.shaftWidth < 100 ? 'Cap' : 'Capacity'} ${capacity >= 999 ? '∞' : capacity}`;
    indicator.style.left = `${layout.baseLeft + liftId * layout.shaftWidth}px`;
    indicator.style.width = `${layout.shaftWidth}px`;
    indicator.style.bottom = `${lift.pos + 96}px`;
    world.appendChild(indicator);
    setTimeout(() => indicator.remove(), durationMs);
};

window.clearTransientLiftCues = function() {
    document.querySelectorAll('.capacity-float, [data-capacity-lift]').forEach(node => node.remove());
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
    const controls = [...document.querySelectorAll('.automation-status')];
    controls.forEach(control => {
        control.classList.add('automation-teaching-cue');
        control.dataset.teachingCue = cueId;
        control.addEventListener('click', () => {
            window.Game.Storage.set(storageKey, '1');
            controls.forEach(item => item.classList.remove('automation-teaching-cue'));
        }, { once: true });
    });
    return cueId;
};



window.draw = function() {
    const ui = GameUI();
    const topFloorRow = document.getElementById(`floor-row-${Config.numFloors - 1}`);
    const world = document.getElementById('world');
    world?.classList.toggle('rooftop-party-board', Boolean(Registry.sunsetActive));
    if (topFloorRow) {
        const topLabel = topFloorRow.querySelector('.label');
        if (Registry.sunsetActive) { 
            if (!topFloorRow.classList.contains('rooftop-party')) topFloorRow.classList.add('rooftop-party'); 
            if (topLabel) { topLabel.innerText = '🍹'; topLabel.setAttribute('aria-label', `Rooftop Party, floor ${Config.numFloors - 1}`); }
        } else { 
            if (topFloorRow.classList.contains('rooftop-party')) topFloorRow.classList.remove('rooftop-party'); 
            if (topLabel) { topLabel.innerText = Config.numFloors - 1; topLabel.removeAttribute('aria-label'); }
        }
    }

    Registry.lifts.forEach((lift, index) => {
        const car = document.getElementById(`lift-el-${index}`);
        if (car) {
            // OPTIMIZATION: Only update if passenger state has changed
            const guestStateKey = lift.passengers.map(p => `${p.dest}-${p.status}`).join('|');
            const isDouble = !Registry.capsuleMode && (lift.isDoubleDecker || lift.doubleDeckerTimer > 0);
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
                        if (p.isCheckout && p.dest === 0) classList += ' checkout-ground';
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
                        if (p.isCheckout && p.dest === 0) classList += ' checkout-ground';
                        guest.className = classList;
                        guest.innerText = (typeof ui.getGuestText === 'function') ? ui.getGuestText(p) : window.getGuestText(p);
                        car.appendChild(guest);
                    });
                }
            }

            // Icons rendering (always check these for now as they are few)
            // Note: We should probably hash these too if performance is still an issue
            let iconsDiv = document.getElementById(`lift-effects-${index}`);
            const activeIcons = [];
            if (lift.tardisTimer > 0 || (typeof PowerUps !== 'undefined' && PowerUps.timers.globalTardis > 0)) activeIcons.push({type: 'emoji', val: '🌌'});
            if (lift.turboTimer > 0 || (typeof PowerUps !== 'undefined' && PowerUps.timers.globalTurbo > 0)) activeIcons.push({type: 'emoji', val: '🚀'});
            if (lift.freshenerTimer > 0 || (typeof PowerUps !== 'undefined' && PowerUps.timers.stinkImmunity > 0)) activeIcons.push({type: 'emoji', val: '🌲'});
            if (lift.musakTimer > 0) activeIcons.push({type: 'emoji', val: '🎵'});
            if (lift.doubleDeckerTimer > 0 || lift.isDoubleDecker) {
                activeIcons.push({
                    type: 'emoji',
                    val: (typeof PowerUps !== 'undefined' && PowerUps.catalog?.doubleDecker?.icon) ||
                        String.fromCodePoint(0x1fa9c)
                });
            }
            if (lift.openPlanTimer > 0) activeIcons.push({type: 'emoji', val: '↔️'});
            if (lift.wideDoorsTimer > 0 || (typeof PowerUps !== 'undefined' && PowerUps.timers.wideDoors > 0)) activeIcons.push({type: 'emoji', val: '🚪'});
            if (typeof PowerUps !== 'undefined' && PowerUps.timers.jamImmunity > 0) activeIcons.push({type: 'emoji', val: '🔧'});
            if (lift.jamTimer > 0 || lift.isJammed) activeIcons.push({type: 'jam', val: '⚠️'});
            
            // Render active effects
            if (lift.effects) {
                lift.effects.forEach(eff => {
                    activeIcons.push({ type: 'effect', val: eff.icon });
                });
            }

            const uniqueIcons = activeIcons.filter((icon, iconIndex, icons) => icons.findIndex(other => other.val === icon.val) === iconIndex);
            if (uniqueIcons.length > 0) {
                if (!iconsDiv) {
                    iconsDiv = document.createElement('div');
                    iconsDiv.id = `lift-effects-${index}`;
                    iconsDiv.className = 'lift-icons lift-effect-overlay';
                    iconsDiv.style.position = 'absolute';
                    iconsDiv.style.top = 'auto';
                    iconsDiv.style.left = `${window.getLiftLayoutMetrics().baseLeft + index * window.getLiftLayoutMetrics().shaftWidth}px`;
                    iconsDiv.style.width = `${window.getLiftLayoutMetrics().liftWidth}px`;
                    iconsDiv.style.textAlign = 'center';
                    iconsDiv.style.fontSize = '22px';
                    iconsDiv.style.zIndex = '100';
                    iconsDiv.style.pointerEvents = 'none';
                    iconsDiv.style.textShadow = '0 2px 5px rgba(0,0,0,0.5)';
                    world.appendChild(iconsDiv);
                    updateLiftVisualState(lift, index, car);
                }
                
                const iconKey = uniqueIcons.map(ic => ic.val).join('');
                if (iconsDiv.dataset.iconKey !== iconKey) {
                    iconsDiv.dataset.iconKey = iconKey;
                    iconsDiv.innerHTML = '';
                    uniqueIcons.forEach(ic => {
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
                    if (g.isCheckout && g.dest === 0) classList += ' checkout-ground';
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
    if (subTitle) {
        subTitle.innerText = Config.GAME_DATA.rounds[Registry.stats.round]?.briefing?.title || "";
    }

    if (document.getElementById('lives-display')) document.getElementById('lives-display').innerText = `Lives: ❤️ ${Registry.stats.lives}`;
};

window.getGuestText = function(g) {
    if (g.status === GuestStatus.RAGE) return '💀';
    if (g.isVip) return '⭐';
    
    let txt = g.isCheckout && g.dest === 0 ? '💼︎' : (g.dest === 0 ? 'G' : g.dest);
    
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
window.UI.clearTransientLiftCues = window.clearTransientLiftCues;
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
