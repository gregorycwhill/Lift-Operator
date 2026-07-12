// ============================================================================
// UI.JS : RENDERING, MODALS, AND ANIMATIONS
// ============================================================================

function buildWorld() {
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
        
        let labelText = (f===0?'G':f); 
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
    
    let customScriptsOptions = "";
    if (typeof AutomationWorkshop !== 'undefined' && AutomationWorkshop.scripts) {
        AutomationWorkshop.scripts.forEach(script => {
            if (script.author !== "System") customScriptsOptions += `<option value="custom_${script.id}">${script.name}</option>`;
        });
    }

    Registry.lifts.forEach((lift, index) => {
        ctrlHtml += `
        <div class="shaft" style="box-sizing: border-box; border-right: 2px solid #ddd; display: flex; justify-content: center; align-items: center; padding: 5px; cursor: default;">
            <select onchange="setLiftAutomation(${index}, this.value)" ${isAutoUnlocked ? '' : 'disabled'} style="width: 90%; font-size: 12px; padding: 2px;">
                <option value="manual" ${lift.automation === 'manual' ? 'selected' : ''}>Manual</option>
                <option value="sweep" ${lift.automation === 'sweep' ? 'selected' : ''}>Sweep</option>
                ${isPriorityUnlocked ? `<option value="priority-sweep" ${lift.automation === 'priority-sweep' ? 'selected' : ''}>Priority Sweep</option>` : ''}
                ${isVotingUnlocked ? `<option value="voting" ${lift.automation === 'voting' ? 'selected' : ''}>Voting</option>` : ''}
                ${isVotingUnlocked ? `<option value="weighted-voting" ${lift.automation === 'weighted-voting' ? 'selected' : ''}>Weighted Voting</option>` : ''}
                ${customScriptsOptions ? `<optgroup label="My Scripts">${customScriptsOptions}</optgroup>` : ''}
            </select>
        </div>`;
    });
    controlRow.innerHTML = ctrlHtml;
    world.appendChild(controlRow);

    setTimeout(() => {
        Registry.lifts.forEach((lift, index) => {
            if (lift.automation.startsWith('custom_')) {
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
        
        let gymBroCount = lift.passengers.filter(p => p.isGymBro).length;
        if (lift.stinkTimer > 0 || gymBroCount >= Config.gymBroStinkThreshold) extraClass += ' stinky';
        
        const liftHeight = Math.min(50, Registry.floorHeight * 0.85);
        const bottomOffset = 40 + (Registry.floorHeight - liftHeight) / 2; 
        
        car.className = `lift ${extraClass}`;
        car.style.left = (410 + index * 120 + 2) + 'px'; 
        car.style.height = liftHeight + 'px';
        car.style.bottom = (lift.pos + bottomOffset) + 'px'; 
        car.style.pointerEvents = 'none'; 
        
        world.appendChild(car);
    });
    
    world.style.width = (410 + Registry.lifts.length * 120) + 'px';
    
    updateInventoryUI();
    if (typeof updateLocksUI === 'function') updateLocksUI();
}

// ----------------------------------------------------------------------------
// ECONOMY & INVENTORY UI
// ----------------------------------------------------------------------------

const TIER_COLORS = ['#cd7f32', '#bdc3c7', '#f1c40f'];
const TIER_BGS = ['#fdf6e3', '#f8f9fa', '#fffbf0'];

window.addToCart = function(id, tier) {
    const puCost = PowerUps.catalog[id].tiers[tier].cost;
    const currentCartTotal = PowerUps.cart.reduce((sum, item) => sum + PowerUps.catalog[item.id].tiers[item.tier].cost, 0);

    if (Registry.points >= currentCartTotal + puCost) {
        PowerUps.cart.push({ id: id, tier: tier });
        renderShop();
    }
};

window.removeFromCart = function(index) {
    PowerUps.cart.splice(index, 1);
    renderShop();
};

window.checkoutCart = function() {
    if (typeof PowerUps === 'undefined') return;
    let totalCost = PowerUps.cart.reduce((sum, item) => sum + PowerUps.catalog[item.id].tiers[item.tier].cost, 0);
    if (Registry.points >= totalCost) {
        Registry.points -= totalCost;
        PowerUps.inventory.push(...PowerUps.cart);
        PowerUps.cart = [];
        updateInventoryUI();
    }
};

window.updateInventoryUI = function() {
    if (typeof PowerUps === 'undefined') return;
    
    let invBar = document.getElementById('inventory-bar');
    if (!invBar) return;
    
    invBar.innerHTML = '';
    
    if (PowerUps.inventory.length === 0) {
        invBar.innerHTML = '<span class="inventory-empty">Empty</span>';
        return;
    }
    
    PowerUps.inventory.forEach((item, index) => {
        const pu = PowerUps.catalog[item.id];
        const btn = document.createElement('button');
        const tColor = TIER_COLORS[item.tier] || '#333';

        btn.innerHTML = pu.icon;
        btn.style.fontSize = '18px';
        btn.style.width = '36px'; 
        btn.style.height = '36px';
        btn.style.boxSizing = 'border-box';
        btn.style.borderRadius = '50%';
        btn.style.cursor = 'pointer';
        btn.title = `${pu.name} (Tier ${item.tier + 1})`;
        
        btn.style.display = 'flex';
        btn.style.justifyContent = 'center';
        btn.style.alignItems = 'center';
        
        const isActive = PowerUps.activeTargeting && PowerUps.activeTargeting.id === item.id && PowerUps.activeTargeting.tier === item.tier;
        
        if (isActive) {
            btn.style.border = `2px solid #3498db`;
            btn.style.background = '#e0f7fa';
            btn.style.boxShadow = `0 0 10px #3498db, 0 0 5px ${tColor} inset`;
        } else {
            btn.style.border = `2px solid ${tColor}`;
            btn.style.background = TIER_BGS[item.tier] || '#fff';
            btn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        }
        
        btn.onclick = () => { 
            if (isActive) PowerUps.cancelTargeting();
            else PowerUps.primeAbility(item.id, item.tier); 
        };
        invBar.appendChild(btn);
    });
};

function renderShop() {
    let shopDiv = document.getElementById('shopContainer');
    if (!shopDiv) return;
    
    let listContainer = shopDiv.querySelector('.shop-items-container');
    let scrollPos = listContainer ? listContainer.scrollTop : 0;
    
    let currentCartTotal = PowerUps.cart.reduce((sum, item) => sum + PowerUps.catalog[item.id].tiers[item.tier].cost, 0);
    let remainingPoints = Registry.points - currentCartTotal;

    let shopHtml = `<h3 style="margin-top:0px; margin-bottom:5px; border-bottom:1px solid #ccc; padding-bottom:5px; font-size: 16px;">Supply Closet (Points: <span style="color:${remainingPoints > 0 ? '#27ae60' : '#e74c3c'};">${remainingPoints}</span>)</h3>
    <div style="display: flex; flex-direction: column; height: 290px; gap: 10px; margin-bottom: 10px;">
        <div class="shop-items-container" style="flex: 1 1 auto; display:flex; flex-wrap:wrap; gap:10px; justify-content:center; align-content:flex-start; overflow-y: auto; padding: 5px 5px 5px 0;">`;
    
    Object.values(PowerUps.catalog).forEach(pu => {
        pu.tiers.forEach((tier, index) => {
            let canAfford = remainingPoints >= tier.cost;
            let tColor = TIER_COLORS[index] || '#ddd';
            let tBg = TIER_BGS[index] || '#fff';
            
            shopHtml += `
            <button ${canAfford ? '' : 'disabled'} onclick="addToCart('${pu.id}', ${index})" 
                    style="padding:8px; background:${canAfford ? tBg : '#f5f5f5'}; border:2px solid ${canAfford ? tColor : '#ddd'}; border-radius:6px; cursor:${canAfford ? 'pointer' : 'not-allowed'}; width:115px; text-align:center; display:flex; flex-direction:column; align-items:center; opacity:${canAfford ? '1' : '0.4'}; transition: transform 0.1s; position: relative; flex-shrink: 0;">
                
                <div style="position: absolute; top: 0; left: 0; width: 100%; font-size: 9px; font-weight: bold; background: ${tColor}; color: ${index===1?'#333':'#fff'}; border-radius: 4px 4px 0 0; padding: 2px 0;">TIER ${index+1}</div>
                
                <div style="font-size:32px; margin-bottom:2px; margin-top: 12px; display:flex; justify-content:center; align-items:center;">${pu.icon}</div>
                <strong style="color:#333; font-size:12px;">${tier.cost} Pts</strong>
                <span style="font-size:11px; color:#666; margin-top:5px; line-height:1.2;">${tier.desc}</span>
            </button>`;
        });
    });
    shopHtml += `</div>`;
    
    if (PowerUps.cart.length > 0) {
        shopHtml += `<div style="flex: 0 0 auto; background:#f8f9fa; border:1px dashed #f39c12; border-radius:6px; padding:10px; box-sizing: border-box; text-align:left; display: flex; flex-direction: column; max-height: 100px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-shrink: 0;">
                <span style="font-size:14px; font-weight:bold; color:#2c3e50;">🛒 Cart</span>
                <span style="font-size:14px; color:#7f8c8d;">Total Cost: <strong style="color:#e74c3c;">${currentCartTotal} Pts</strong></span>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:5px; overflow-y: auto; padding-right: 5px; flex-grow: 1; align-content: flex-start;">`;
            
        PowerUps.cart.forEach((item, idx) => {
            const pu = PowerUps.catalog[item.id];
            const tColor = TIER_COLORS[item.tier];
            shopHtml += `<div onclick="removeFromCart(${idx})" title="Click to remove" style="background:${TIER_BGS[item.tier]}; border:2px solid ${tColor}; border-radius:4px; padding:3px 8px; font-size:14px; cursor:pointer; display:flex; align-items:center; gap:5px; box-shadow:0 1px 3px rgba(0,0,0,0.1); flex-shrink: 0; height: 26px; box-sizing: border-box;">
                ${pu.icon} <span style="font-size:10px; color:#e74c3c; font-weight:bold;">&times;</span>
            </div>`;
        });
        shopHtml += `</div></div>`;
    }
    shopHtml += `</div>`; 
    
    shopDiv.innerHTML = shopHtml;
    
    listContainer = shopDiv.querySelector('.shop-items-container');
    if (listContainer) listContainer.scrollTop = scrollPos;

    let startBtn = document.getElementById('startRoundBtn');
    if (startBtn) {
        if (PowerUps.cart.length > 0) {
            startBtn.innerText = `Checkout & Start Round`;
            startBtn.className = 'btn btn-yellow btn-large btn-full-width';
        } else {
            startBtn.innerText = `Start Round`;
            startBtn.className = 'btn btn-green btn-large btn-full-width';
        }
    }
}

window.updateLocksUI = function() {
    if (!Registry.highestUnlockedRound) Registry.highestUnlockedRound = 1;
    let maxRoundAllowed = Config.debugMode ? 11 : Registry.highestUnlockedRound;

    const jumpSelect = document.getElementById('jumpRoundSelect');
    if (jumpSelect) {
        Array.from(jumpSelect.options).forEach(opt => {
            const roundNum = parseInt(opt.value);
            if (roundNum > maxRoundAllowed) {
                opt.disabled = true;
                opt.text = `Round ${roundNum} 🔒`;
            } else {
                opt.disabled = false;
                opt.text = `Round ${roundNum}`;
            }
        });
        jumpSelect.value = Registry.stats.round; 
    }

    const workshopBtn = document.getElementById('openWorkshopBtn');
    if (workshopBtn) {
        if (maxRoundAllowed >= 10) {
            workshopBtn.disabled = false;
            workshopBtn.style.opacity = '1';
            workshopBtn.style.cursor = 'pointer';
        } else {
            workshopBtn.disabled = true;
            workshopBtn.style.opacity = '0.5';
            workshopBtn.style.cursor = 'not-allowed';
        }
    }
};

function showRoundModal(round) {
    if (typeof pauseGame === 'function') pauseGame();
    if (typeof PowerUps !== 'undefined') PowerUps.cart = [];
    
    const title = document.getElementById('roundTitle');
    const instructions = document.getElementById('roundInstructions');
    const nameContainer = document.getElementById('playerNameContainer');
    const btn = document.getElementById('startRoundBtn');

    const seedInput = document.getElementById('gameSeed');
    if (seedInput && !seedInput.value) {
        seedInput.value = Registry.seed || (Math.floor(Math.random() * 9000) + 1000);
    }

    if (round === 1) {
        title.innerText = "Welcome Pilot";
        instructions.innerText = "Click on a lift shaft to send the car to that floor. Don't leave guests waiting too long!";
        nameContainer.style.display = "block";
        const savedPlayer = safeGetItem('lastPlayer', Registry.fallbackName);
        if (document.getElementById('playerName')) document.getElementById('playerName').value = savedPlayer;
        btn.innerText = "Start Round 1";
    } 
    else if (round === 2) { title.innerText = "Round 2: Automations Unlocked"; instructions.innerText = "Manual control is tough! Activate 'Sweep' to let the lift manage itself."; nameContainer.style.display = "none"; }
    else if (round === 3) { title.innerText = "Round 3: Rush Hour"; instructions.innerText = "Management approved a second lift! The spawn rate is climbing."; nameContainer.style.display = "none"; }
    else if (round === 4) { title.innerText = "Round 4: Triage"; instructions.innerText = "New automation: 'Priority Sweep'. It ignores everyone else to save Critical (Red) guests."; nameContainer.style.display = "none"; }
    else if (round === 5) { title.innerText = "Round 5: Democracy"; instructions.innerText = "Three lifts! 'Voting' automations added. They act as express trains to the floor with the most votes."; nameContainer.style.display = "none"; }
    else if (round === 6) { title.innerText = "Round 6: The Wild Card"; instructions.innerText = "WARNING: Management added 5 more floors. Elevators now have a chance to randomly jam in the shaft."; nameContainer.style.display = "none"; }
    else if (round === 7) { title.innerText = "Round 7: Check-out Rush"; instructions.innerText = "Check-out time! Half the hotel is trying to leave right now and head to the Ground Floor."; nameContainer.style.display = "none"; }
    else if (round === 8) { title.innerText = "Round 8: VIP Arrival"; instructions.innerText = "A VIP demands an entirely empty lift. If they are left waiting, it will cost us 10 lives. Watch for the Star!"; nameContainer.style.display = "none"; }
    else if (round === 9) { title.innerText = "Round 9: Happy Hour & Hazards"; instructions.innerText = "The Rooftop bar opens! Watch out for Farts. Stinky lifts force evacuations and block boarding. Adapt!"; nameContainer.style.display = "none"; }
    else if (round === 10) { title.innerText = "Round 10: Sandbox Unlocked"; instructions.innerText = "You can now write Custom Scripts in the Automation Workshop to handle the intense passenger loads!"; nameContainer.style.display = "none"; }
    else if (round === 11) { title.innerText = "Round 11: The Gym Challenge"; instructions.innerText = "A new Gym has opened! Gym Bros are double-wide and if 3 of them get in a lift, the smell will drive everyone else out. Watch out!"; nameContainer.style.display = "none"; }

    let shopDiv = document.getElementById('shopContainer');
    if (!shopDiv && btn) {
        shopDiv = document.createElement('div');
        shopDiv.id = 'shopContainer';
        btn.parentNode.insertBefore(shopDiv, btn);
    }
    
    if (round > 1 && typeof PowerUps !== 'undefined') {
        shopDiv.style.display = 'block';
        renderShop();
    } else {
        if (shopDiv) shopDiv.style.display = 'none';
        btn.innerText = `Start Round`;
        btn.className = 'btn btn-green btn-large btn-full-width';
    }

    document.getElementById('roundModalOverlay').style.display = 'flex';
}

function showRoundReview(completedRound) {
    if (typeof Achievements === 'undefined') return;
    const evaluation = Achievements.evaluateRound();
    document.getElementById('reviewServedText').innerText = evaluation.guestsServed;
    document.getElementById('reviewPointsEarned').innerText = "+" + evaluation.pointsEarned;
    document.getElementById('reviewTotalPoints').innerText = evaluation.totalPoints;
    const listEl = document.getElementById('reviewAchievementsList');
    listEl.innerHTML = evaluation.log.map(msg => `<li>${msg}</li>`).join('');
    document.getElementById('roundReviewOverlay').style.display = 'flex';
}

// ----------------------------------------------------------------------------
// SOCIAL & TOAST NOTIFICATIONS
// ----------------------------------------------------------------------------

window.showToast = function(message) {
    let toast = document.getElementById('game-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'game-toast';
        toast.style.position = 'fixed';
        toast.style.top = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.background = '#2c3e50';
        toast.style.color = '#fff';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '8px';
        toast.style.fontWeight = 'bold';
        toast.style.zIndex = '10000';
        toast.style.transition = 'opacity 0.4s ease-in-out';
        toast.style.pointerEvents = 'none';
        toast.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
        toast.style.border = '2px solid #34495e';
        document.body.appendChild(toast);
    }
    toast.innerText = message;
    toast.style.opacity = '1';
    
    setTimeout(() => {
        toast.style.opacity = '0';
    }, 3500);
};

window.shareLeaderboard = function() {
    const localScores = JSON.parse(safeGetItem('liftArcadeBoard', '[]'));
    if (localScores.length === 0) {
        window.showToast("No scores to share yet! Play a round first.");
        return;
    }
    
    const payload = { type: 'leaderboard', data: localScores };
    if (typeof encodePayload === 'function') {
        const encoded = window.encodePayload(payload);
        const shareUrl = window.location.origin + window.location.pathname + '?Data=' + encoded;
        
        navigator.clipboard.writeText(shareUrl).then(() => {
            window.showToast("🔗 Leaderboard Link Copied to Clipboard!");
        }).catch(err => {
            console.error("Could not copy text: ", err);
            window.showToast("Failed to copy link.");
        });
    } else {
        console.error("Social payload encoder missing.");
    }
};

window.shareGame = function() {
    let seedStr = document.getElementById('gameSeed').value;
    let seed = parseInt(seedStr);
    if (isNaN(seed)) seed = Registry.seed;
    
    let round = Registry.stats.round; 
    
    const payload = { type: 'invite', data: { seed: seed, round: round } };
    
    if (typeof encodePayload === 'function') {
        const encoded = window.encodePayload(payload);
        const shareUrl = window.location.origin + window.location.pathname + '?Data=' + encoded;
        
        navigator.clipboard.writeText(shareUrl).then(() => {
            window.showToast("🔗 Game Invite Link Copied to Clipboard!");
        }).catch(err => {
            console.error("Could not copy text: ", err);
            window.showToast("Failed to copy link.");
        });
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const shareBtn = document.getElementById('shareScriptBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            if (typeof AutomationWorkshop === 'undefined' || typeof LZString === 'undefined') {
                window.showToast("Libraries missing to share blueprint!");
                return;
            }
            
            const scriptIdStr = document.getElementById('scriptSelect').value; 
            if (!scriptIdStr || scriptIdStr === 'new') {
                window.showToast("Select a saved script to share first!");
                return;
            }
            
            const scriptId = scriptIdStr.replace('custom_', '');
            const scriptObj = AutomationWorkshop.scripts.find(s => s.id == scriptId);
            if (!scriptObj || !scriptObj.blocklyData) { 
                window.showToast("Invalid script data.");
                return;
            }

            const compressedXml = LZString.compressToEncodedURIComponent(JSON.stringify(scriptObj.blocklyData));
            const authorName = document.getElementById('playerName')?.value || Registry.fallbackName || "Unknown Pilot";
            
            const payload = {
                type: 'blueprint',
                data: {
                    name: scriptObj.name,
                    author: authorName,
                    xml: compressedXml
                }
            };
            
            if (typeof encodePayload === 'function') {
                const encoded = window.encodePayload(payload);
                const shareUrl = window.location.origin + window.location.pathname + '?Data=' + encoded;
                
                navigator.clipboard.writeText(shareUrl).then(() => {
                    window.showToast(`🔗 Blueprint '${scriptObj.name}' Copied!`);
                }).catch(err => {
                    console.error("Could not copy text: ", err);
                    window.showToast("Failed to copy link.");
                });
            }
        });
    }
});

function showLeaderboard(titleText) {
    if (typeof pauseGame === 'function') pauseGame(); 
    if (document.getElementById('lbTitle')) document.getElementById('lbTitle').innerText = titleText;
    
    const closeBtn = document.getElementById('closeLbBtn');
    const restartBtn = document.getElementById('lbRestartBtn');
    
    let shareBtn = document.getElementById('shareLbBtn');
    if (!shareBtn && document.getElementById('leaderboardOverlay')) {
        const contentBox = document.getElementById('leaderboardOverlay').querySelector('.modal-content');
        if (contentBox) {
            shareBtn = document.createElement('button');
            shareBtn.id = 'shareLbBtn';
            shareBtn.innerText = '🔗 Share Board';
            shareBtn.className = 'btn btn-blue btn-full-width btn-margin-top';
            shareBtn.onclick = window.shareLeaderboard;
            const listEl = document.getElementById('lbList');
            if(listEl) listEl.parentNode.insertBefore(shareBtn, listEl.nextSibling);
        }
    }

    if (closeBtn) closeBtn.style.display = (titleText === "Game Over!" || titleText === "You Won!") ? "none" : "block";
    if (restartBtn) restartBtn.style.display = (titleText === "Game Over!" || titleText === "You Won!") ? "block" : "none";
    if (shareBtn) shareBtn.style.display = 'block';

    const listContainer = document.getElementById('lbList');
    if (listContainer) {
        listContainer.innerHTML = '';
        const records = JSON.parse(safeGetItem('liftArcadeBoard', '[]'));
        if (records.length === 0) {
            listContainer.innerHTML = '<li>No scores registered yet!</li>';
        } else {
            records.slice(0, 10).forEach((record, index) => { 
                listContainer.innerHTML += `<li><span>${index + 1}. ${record.name}</span> <span>${record.score} served</span></li>`; 
            });
        }
    }
    document.getElementById('leaderboardOverlay').style.display = 'flex';
}

function triggerDefenestration(guestEl, floorIndex) {
    const worldEl = document.getElementById('world');
    if (!worldEl) return;
    const ghost = document.createElement('div');
    ghost.className = 'guest rage flying-out';
    ghost.innerText = '💀';
    if (guestEl) {
        const worldRect = worldEl.getBoundingClientRect();
        const guestRect = guestEl.getBoundingClientRect();
        ghost.style.left = (guestRect.left - worldRect.left) + 'px';
        ghost.style.top = (guestRect.top - worldRect.top) + 'px';
    } else {
        ghost.style.right = '130px'; 
        ghost.style.top = ((Config.numFloors - 1 - floorIndex) * Registry.floorHeight + (Registry.floorHeight / 3)) + 'px';
    }
    worldEl.appendChild(ghost);
    setTimeout(() => { if (ghost.parentNode) ghost.remove(); }, 2000);
}

function updateScoreboardUI() {
    const m = Math.floor(Registry.stats.timeLeft / 60);
    const s = (Registry.stats.timeLeft % 60).toString().padStart(2, '0');
    if (document.getElementById('clock-display')) document.getElementById('clock-display').innerText = `${m}:${s}`;
    if (document.getElementById('round-display')) document.getElementById('round-display').innerText = Registry.stats.round;
    if (document.getElementById('lives-display')) document.getElementById('lives-display').innerText = `Lives: ❤️ ${Registry.stats.lives}`;
}

function getGuestText(g) {
    if (g.status === 'rage') return '💀';
    if (g.isVip) return '⭐';
    let txt = g.dest === 0 ? 'G' : g.dest;
    if (g.isGymBro) return `💪${txt}`;
    if (g.isSunset) return 'R';
    return txt;
}