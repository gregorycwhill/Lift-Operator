// ============================================================================
// UI-CORE.JS : GRID GENERATION, ACTIVE LIFT RENDERING, & CANVAS MUTATIONS
// ============================================================================

window.buildWorld = function() {
    const world = document.getElementById('world');
    if (!world) return;
    world.innerHTML = ''; 
    
    const FIXED_BOARD_HEIGHT = 600; 
    Registry.floorHeight = FIXED_BOARD_HEIGHT / Config.numFloors;
    world.style.height = (FIXED_BOARD_HEIGHT + 40) + 'px'; 
    world.style.gridTemplateRows = `repeat(${Config.numFloors}, ${Registry.floorHeight}px) 40px`;
    
    for (let f = Config.numFloors - 1; f >= 0; f--) {
        const row = document.createElement('div'); 
        row.className = 'floor';
        row.id = `floor-row-${f}`;
        
        let labelText = (f === 0 ? 'G' : f); 
        if (Registry.gymFloor && f === Registry.gymFloor) labelText = '💪';
        
        let html = `<div class="label" ${labelText === '💪' ? 'style="font-size:20px; background:#f1c40f;"' : ''}>${labelText}</div><div class="lobby" id="lobby-${f}"></div>`;
        Registry.lifts.forEach((lift, index) => { html += `<div class="shaft" onclick="setLiftTarget(${index}, ${f})"></div>`; });
        row.innerHTML = html;
        world.appendChild(row);
    }

    const controlRow = document.createElement('div');
    controlRow.className = 'floor';
    controlRow.style.height = '40px';
    controlRow.style.background = '#e8ecf1';
    controlRow.style.borderTop = '2px solid #333';
    
    let ctrlHtml = `<div class="label" style="border:none; font-size:12px; color:#555;">AUTO</div><div class="lobby" style="border:none;"></div>`;
    
    const isAutoUnlocked = Config.debugMode || Registry.highestUnlockedRound >= 2 || Registry.stats.round >= 2;
    const isPriorityUnlocked = Config.debugMode || Registry.highestUnlockedRound >= 4 || Registry.stats.round >= 4;
    const isVotingUnlocked = Config.debugMode || Registry.highestUnlockedRound >= 5 || Registry.stats.round >= 5;
    
    let builtInsOpts = "";
    let myScriptsOpts = "";
    let sharedScriptsOpts = "";
    let currentPlayer = Registry.playerName || safeGetItem('lastPlayer', 'Pilot 1');

    if (typeof AutomationWorkshop !== 'undefined' && AutomationWorkshop.scripts) {
        AutomationWorkshop.scripts.forEach(script => {
            if (script.author === "System") {
                let engineVal = 'manual';
                let isUnlocked = false;
                
                if (script.id === 'script_sys_sweep') { engineVal = 'sweep'; isUnlocked = isAutoUnlocked; }
                if (script.id === 'script_sys_priority') { engineVal = 'priority-sweep'; isUnlocked = isPriorityUnlocked; }
                if (script.id === 'script_sys_voting') { engineVal = 'voting'; isUnlocked = isVotingUnlocked; }
                if (script.id === 'script_sys_weighted') { engineVal = 'weighted-voting'; isUnlocked = isVotingUnlocked; }
                
                if (isUnlocked) {
                    builtInsOpts += `<option value="${engineVal}">${script.name}</option>`;
                }
            } else if (script.author === currentPlayer) {
                myScriptsOpts += `<option value="custom_${script.id}">${script.name}</option>`;
            } else {
                sharedScriptsOpts += `<option value="custom_${script.id}">${script.name} (by ${script.author})</option>`;
            }
        });
    }

    Registry.lifts.forEach((lift, index) => {
        ctrlHtml += `
        <div class="shaft" style="box-sizing: border-box; border-right: 2px solid #ddd; display: flex; justify-content: center; align-items: center; padding: 5px; cursor: default;">
            <select onchange="setLiftAutomation(${index}, this.value)" ${isAutoUnlocked ? '' : 'disabled'} style="width: 90%; font-size: 12px; padding: 2px;">
                <option value="manual" ${lift.automation === 'manual' ? 'selected' : ''}>Manual</option>
                ${builtInsOpts ? `<optgroup label="Built-in">${builtInsOpts}</optgroup>` : ''}
                ${myScriptsOpts ? `<optgroup label="My Automations">${myScriptsOpts}</optgroup>` : ''}
                ${sharedScriptsOpts ? `<optgroup label="Shared with Me">${sharedScriptsOpts}</optgroup>` : ''}
            </select>
        </div>`;
    });
    controlRow.innerHTML = ctrlHtml;
    world.appendChild(controlRow);

    setTimeout(() => {
        Registry.lifts.forEach((lift, index) => {
            if (lift.automation !== 'manual') {
                const selects = document.querySelectorAll('.shaft select');
                if(selects[index]) selects[index].value = lift.automation;
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
        
        const liftHeight = Math.min(50, Registry.floorHeight * 0.85);
        const bottomOffset = 40 + (Registry.floorHeight - liftHeight) / 2; 
        
        car.className = `lift ${extraClass}`;
        car.style.height = liftHeight + 'px';
        car.style.bottom = (lift.pos + bottomOffset) + 'px'; 
        car.style.left = (412 + index * 120) + 'px'; 
        car.style.pointerEvents = 'none'; 
        
        world.appendChild(car);
    });
    
    world.style.width = (410 + Registry.lifts.length * 120) + 'px';
    
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
            if (typeof window.shareGame === 'function') window.shareGame();
        };
        seedContainer.parentNode.appendChild(shareLink);
    }

    const debugOptionBtn = document.getElementById('openDebugBtn');
    if (debugOptionBtn) {
        debugOptionBtn.style.display = Config.debugMode ? "block" : "none";
    }

    if (typeof updateInventoryUI === 'function') {
        updateInventoryUI();
    }
    if (typeof updateLocksUI === 'function') {
        updateLocksUI();
    }
};

window.draw = function() {
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
            let html = lift.passengers.map(p => `<div class="guest ${p.status} ${p.isVip ? 'vip' : ''} ${p.isGymBro ? 'swol' : ''}">${window.getGuestText(p)}</div>`).join('');
            
            let activeIcons = [];
            
            if (lift.tardisTimer > 0 || (typeof PowerUps !== 'undefined' && PowerUps.timers.globalTardis > 0)) activeIcons.push('🌌');
            if (lift.turboTimer > 0 || (typeof PowerUps !== 'undefined' && PowerUps.timers.globalTurbo > 0)) activeIcons.push('🚀'); 
            if (lift.freshenerTimer > 0 || (typeof PowerUps !== 'undefined' && PowerUps.timers.stinkImmunity > 0)) activeIcons.push('🌲');
            if (lift.musakTimer > 0) activeIcons.push('🎵');
            if (typeof PowerUps !== 'undefined' && PowerUps.timers.jamImmunity > 0) activeIcons.push('🔧');
            if (lift.isJammed) activeIcons.push('<span class="jammed-alert">⚠️</span>'); 
            
            if (activeIcons.length > 0) {
                const unicodeBlock = [...activeIcons].join('');
                html += `<div style="position:absolute; top:-28px; left:0; width:100%; text-align:center; font-size:22px; z-index:100; pointer-events:none; text-shadow: 0 2px 5px rgba(0,0,0,0.5);">${unicodeBlock}</div>`;
            }
            
            car.innerHTML = html;
        }
    });
    
    const lobbies = document.querySelectorAll('.lobby');
    lobbies.forEach((lobby, idx) => {
        let actualFloorId = Config.numFloors - 1 - idx;
        if (lobby && Registry.floors[actualFloorId]) {
            let html = Registry.floors[actualFloorId].waitingGuests.map(g => `<div class="guest ${g.status} ${g.isVip ? 'vip' : ''} ${g.isPartying ? 'partying' : ''} ${g.isGymBro ? 'swol' : ''}">${window.getGuestText(g)}</div>`).join('');
            
            if (typeof PowerUps !== 'undefined' && (PowerUps.timers.globalAngerPause > 0 || (PowerUps.floorAngerPause && PowerUps.floorAngerPause[actualFloorId] > 0))) {
                html += `<div style="display:inline-block; vertical-align:top; margin-left:10px; font-size:22px; text-shadow: 0 2px 5px rgba(0,0,0,0.3);">🎵</div>`;
            }
            
            lobby.innerHTML = html;
        }
    });
};

window.triggerDefenestration = function(guestEl, floorIndex) {
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
        const firstRow = document.getElementById('floor-row-0');
        let fallbackLeft = 300; 
        if (firstRow) {
            const shafts = firstRow.querySelectorAll('.shaft');
            if (shafts.length > 0) {
                const shaftRect = shafts[0].getBoundingClientRect();
                fallbackLeft = (shaftRect.left - worldRect.left);
            }
        }
        ghost.style.left = fallbackLeft + 'px';
        ghost.style.top = ((Config.numFloors - 1 - floorIndex) * Registry.floorHeight + (Registry.floorHeight / 3)) + 'px';
    }
    
    worldEl.appendChild(ghost);
    setTimeout(() => { if (ghost.parentNode) ghost.remove(); }, 3000);
};

window.updateScoreboardUI = function() {
    const m = Math.floor(Registry.stats.timeLeft / 60);
    const s = (Registry.stats.timeLeft % 60).toString().padStart(2, '0');
    if (document.getElementById('clock-display')) document.getElementById('clock-display').innerText = `${m}:${s}`;
    if (document.getElementById('round-display')) document.getElementById('round-display').innerText = Registry.stats.round;
    if (document.getElementById('lives-display')) document.getElementById('lives-display').innerText = `Lives: ❤️ ${Registry.stats.lives}`;
};

window.getGuestText = function(g) {
    if (g.status === 'rage') return '💀';
    if (g.isVip) return '⭐';
    
    let txt = g.dest === 0 ? 'G' : g.dest;
    
    if (g.isGymBro) return `💪${txt}`;
    if (g.isSunset) return 'R';
    
    return txt;
};