// ============================================================================
// UI-OVERLAY.JS : SHOP TRANSACTIONAL SYSTEM, OVERLAYS, SOCIAL SHARING, & MODALS
// ============================================================================

window.getRankByLifts = function(numLifts) {
    if (numLifts <= 1) return "Operator";
    if (numLifts === 2) return "Manager";
    if (numLifts === 3) return "Director";
    if (numLifts === 4) return "Captain";
    if (numLifts === 5) return "Marshal";
    return "Supremo";
};

window.updatePilotNameDisplay = function() {
    const numLifts = (typeof Registry !== 'undefined' && Registry.lifts) ? Registry.lifts.length : 1;
    const rank = window.getRankByLifts(numLifts);
    const name = (typeof Registry !== 'undefined' && Registry.playerName) ? Registry.playerName : "Pilot";
    
    const pilotDisplay = document.getElementById('pilotNameDisplay');
    if (pilotDisplay) {
        pilotDisplay.innerText = `${rank} ${name}`;
    }
};

window.addToCart = function(id, tier) {
    if (typeof PowerUps === 'undefined') return;
    const puCost = PowerUps.catalog[id].tiers[tier].cost;
    const currentCartTotal = PowerUps.cart.reduce((sum, item) => sum + PowerUps.catalog[item.id].tiers[item.tier].cost, 0);

    if (Registry.points >= currentCartTotal + puCost) {
        PowerUps.cart.push({ id: id, tier: tier });
        window.renderShop();
    }
};

window.removeFromCart = function(index) {
    if (typeof PowerUps === 'undefined') return;
    PowerUps.cart.splice(index, 1);
    window.renderShop();
};

window.checkoutCart = function() {
    if (typeof PowerUps === 'undefined') return;
    let totalCost = PowerUps.cart.reduce((sum, item) => sum + PowerUps.catalog[item.id].tiers[item.tier].cost, 0);
    if (Registry.points >= totalCost) {
        Registry.points -= totalCost;
        PowerUps.inventory.push(...PowerUps.cart);
        PowerUps.cart = [];
        window.updateInventoryUI();
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
        
        const isActive = PowerUps.activeTargeting && PowerUps.activeTargeting.id === item.id && PowerUps.activeTargeting.tier === item.tier;
        
        btn.className = `inv-btn inv-btn-t${item.tier + 1} ${isActive ? 'active' : ''}`;
        btn.innerHTML = pu.icon;
        btn.title = `${pu.name} (Tier ${item.tier + 1})`;
        
        btn.onclick = () => { 
            if (isActive) PowerUps.cancelTargeting();
            else PowerUps.primeAbility(item.id, item.tier); 
        };
        invBar.appendChild(btn);
    });
};

window.renderShop = function() {
    let shopDiv = document.getElementById('shopContainer');
    if (!shopDiv || typeof PowerUps === 'undefined') return;
    
    let listContainer = shopDiv.querySelector('.shop-items-grid');
    let scrollPos = listContainer ? listContainer.scrollTop : 0;
    
    let currentCartTotal = PowerUps.cart.reduce((sum, item) => sum + PowerUps.catalog[item.id].tiers[item.tier].cost, 0);
    let remainingPoints = Registry.points - currentCartTotal;
    let pointsClass = remainingPoints > 0 ? 'text-green' : 'text-red';

    let shopHtml = `
    <h3 class="shop-header">Supply Closet (Points: <span class="${pointsClass}">${remainingPoints}</span>)</h3>
    <div class="shop-container">
        <div class="shop-items-grid">`;
    
    Object.values(PowerUps.catalog).forEach(pu => {
        pu.tiers.forEach((tier, index) => {
            let canAfford = remainingPoints >= tier.cost;
            
            shopHtml += `
            <button class="shop-btn shop-btn-t${index + 1}" ${canAfford ? '' : 'disabled'} onclick="window.addToCart('${pu.id}', ${index})">
                <div class="shop-btn-tier">TIER ${index + 1}</div>
                <div class="shop-btn-icon">${pu.icon}</div>
                <strong class="shop-btn-cost">${tier.cost} Pts</strong>
                <span class="shop-btn-desc">${tier.desc}</span>
            </button>`;
        });
    });
    shopHtml += `</div>`;
    
    if (PowerUps.cart.length > 0) {
        shopHtml += `
        <div class="cart-container">
            <div class="cart-header">
                <span>🛒 Cart</span>
                <span class="cart-total">Total Cost: <strong>${currentCartTotal} Pts</strong></span>
            </div>
            <div class="cart-items-grid">`;
            
        PowerUps.cart.forEach((item, idx) => {
            const pu = PowerUps.catalog[item.id];
            shopHtml += `
            <div class="cart-item cart-item-t${item.tier + 1}" onclick="window.removeFromCart(${idx})" title="Click to remove">
                ${pu.icon} <span class="cart-item-remove">&times;</span>
            </div>`;
        });
        shopHtml += `</div></div>`;
    }
    shopHtml += `</div>`; 
    
    shopDiv.innerHTML = shopHtml;
    
    listContainer = shopDiv.querySelector('.shop-items-grid');
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
};

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
            workshopBtn.classList.remove('locked');
        } else {
            workshopBtn.disabled = true;
            workshopBtn.classList.add('locked');
        }
    }
};

window.updateWorkshopScriptList = function() {
    const wsSelect = document.getElementById('scriptSelect');
    if (wsSelect && typeof AutomationWorkshop !== 'undefined' && AutomationWorkshop.scripts) {
        let optionsHtml = '<option value="new">+ Create New Script</option>';
        let builtIns = '';
        let myScripts = '';
        let sharedScripts = '';
        
        let currentPlayer = Registry.playerName || safeGetItem('lastPlayer', 'Pilot 1');
        
        AutomationWorkshop.scripts.forEach(s => {
            if (s.author === 'System') {
                builtIns += `<option value="custom_${s.id}">[Built-in] ${s.name}</option>`;
            } else if (s.author === currentPlayer) {
                myScripts += `<option value="custom_${s.id}">${s.name}</option>`;
            } else {
                sharedScripts += `<option value="custom_${s.id}">${s.name} (by ${s.author})</option>`;
            }
        });
        
        if (builtIns) optionsHtml += `<optgroup label="Built-ins">${builtIns}</optgroup>`;
        if (myScripts) optionsHtml += `<optgroup label="My Automations">${myScripts}</optgroup>`;
        if (sharedScripts) optionsHtml += `<optgroup label="Shared with Me">${sharedScripts}</optgroup>`;
        
        wsSelect.innerHTML = optionsHtml;
    }
};

window.showRoundModal = function(round) {
    if (typeof pauseGame === 'function') pauseGame();
    
    const title = document.getElementById('roundTitle');
    const instructions = document.getElementById('roundInstructions');
    const nameContainer = document.getElementById('playerNameContainer');
    const gameIdContainer = document.getElementById('gameIdContainer');
    const btn = document.getElementById('startRoundBtn');

    const seedInput = document.getElementById('gameSeed');
    if (seedInput && !seedInput.value) {
        seedInput.value = Registry.seed || (Math.floor(Math.random() * 9000) + 1000);
    }

    const isRound1 = (round === 1);
    if (nameContainer) nameContainer.style.display = isRound1 ? "flex" : "none";
    if (gameIdContainer) gameIdContainer.style.display = "none";

    let numLifts = 1;
    if (typeof Registry !== 'undefined') {
        if (Registry.lifts && Registry.lifts.length > 0) {
            numLifts = Registry.lifts.length;
        }
    }
    const rank = window.getRankByLifts(numLifts);
    window.updatePilotNameDisplay();

    if (round === 1) {
        title.innerText = `Welcome ${rank}`;
        instructions.innerText = "Click on a lift shaft to send the car to that floor. Don't leave guests waiting too long!";
        const savedPlayer = safeGetItem('lastPlayer', Registry.fallbackName || "Pilot");
        if (document.getElementById('playerName')) document.getElementById('playerName').value = savedPlayer;
        btn.innerText = "Start Round 1";
        btn.className = 'btn btn-green btn-large btn-full-width';
    } 
    else if (round === 2) { title.innerText = `Round 2: Automations Unlocked (${rank})`; instructions.innerText = "Manual control is tough! Activate 'Sweep' to let the lift manage itself."; }
    else if (round === 3) { title.innerText = `Round 3: Rush Hour (${rank})`; instructions.innerText = "Management approved a second lift! The spawn rate is climbing."; }
    else if (round === 4) { title.innerText = `Round 4: Triage (${rank})`; instructions.innerText = "New automation: 'Priority Sweep'. It ignores everyone else to save Critical (Red) guests."; }
    else if (round === 5) { title.innerText = `Round 5: Democracy (${rank})`; instructions.innerText = "Three lifts! 'Voting' automations added. They act as express trains to the floor with the most votes."; }
    else if (round === 6) { title.innerText = `Round 6: The Wild Card (${rank})`; instructions.innerText = "WARNING: Management added 5 more floors. Elevators now have a chance to randomly jam in the shaft."; }
    else if (round === 7) { title.innerText = `Round 7: Check-out Rush (${rank})`; instructions.innerText = "Check-out time! Half the hotel is trying to leave right now and head to the Ground Floor."; }
    else if (round === 8) { title.innerText = `Round 8: VIP Arrival (${rank})`; instructions.innerText = "A VIP demands an entirely empty lift. If they are left waiting, it will cost us 10 lives. Watch for the Star!"; }
    else if (round === 9) { title.innerText = `Round 9: Happy Hour & Hazards (${rank})`; instructions.innerText = "The Rooftop bar opens! Watch out for Farts. Stinky lifts force evacuations and block boarding. Adapt!"; }
    else if (round === 10) { title.innerText = `Round 10: Sandbox Unlocked (${rank})`; instructions.innerText = "You can now write Custom Scripts in the Automation Workshop to handle the intense passenger loads!"; }
    else if (round >= 11) { title.innerText = `Round ${round}: The Gym Challenge (${rank})`; instructions.innerText = "A new Gym has opened! Gym Bros are double-wide and if 3 of them get in a lift, the smell will drive everyone else out. Watch out!"; }

    let shopDiv = document.getElementById('shopContainer');
    if (!shopDiv && btn) {
        shopDiv = document.createElement('div');
        shopDiv.id = 'shopContainer';
        btn.parentNode.insertBefore(shopDiv, btn);
    }
    
    if (round > 1 && typeof PowerUps !== 'undefined') {
        if (shopDiv) shopDiv.style.display = 'block';
        window.renderShop();
    } else {
        if (shopDiv) shopDiv.style.display = 'none';
        if (btn && round === 1) {
            btn.innerText = `Start Round 1`;
            btn.className = 'btn btn-green btn-large btn-full-width';
        } else if (btn) {
            btn.innerText = `Start Round`;
            btn.className = 'btn btn-green btn-large btn-full-width';
        }
    }

    if (typeof Achievements !== 'undefined' && typeof Achievements.renderTrophyWorkshop === 'function') {
        Achievements.renderTrophyWorkshop();
    }

    document.getElementById('roundModalOverlay').style.display = 'flex';
};

window.showRoundReview = function(completedRound) {
    if (typeof Achievements === 'undefined') return;
    const evaluation = Achievements.evaluateRound();
    
    document.getElementById('reviewServedText').innerText = evaluation.guestsServed;
    document.getElementById('breakdownHappy').innerText = Registry.roundStats.happyServed || 0;
    document.getElementById('breakdownAnnoyed').innerText = Registry.roundStats.annoyedServed || 0;
    document.getElementById('breakdownCritical').innerText = Registry.roundStats.criticalServed || 0;
    document.getElementById('breakdownDefenestrations').innerText = evaluation.defenestrations;
    
    document.getElementById('reviewPointsEarned').innerText = `+${evaluation.pointsEarned}`;
    document.getElementById('reviewAvgWait').innerText = `${evaluation.averageWaitTime}s`;
    
    document.getElementById('reviewTotalPoints').innerText = evaluation.totalPoints;
    
    const listEl = document.getElementById('reviewAchievementsList');
    listEl.innerHTML = evaluation.log.map(msg => `<li>${msg}</li>`).join('');
    
    Registry.roundStats = { 
        manualClicks: 0, jammedLiftsFixed: 0, fullyLoadedLifts: 0, servedThisRound: 0,
        happyServed: 0, annoyedServed: 0, criticalServed: 0, vipServed: 0,
        defenestrationsThisRound: 0, totalWaitTimeServed: 0
    };
    
    document.getElementById('roundReviewOverlay').style.display = 'flex';
};

window.showToast = function(message) {
    let toast = document.getElementById('game-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'game-toast';
        toast.className = 'game-toast';
        document.body.appendChild(toast);
    }
    toast.innerText = message;
    void toast.offsetWidth;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 3500);
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
    }
};

window.shareGame = function() {
    let seed = Registry.seed;
    const payload = { type: 'seed', value: seed };
    
    if (typeof encodePayload === 'function') {
        const encoded = window.encodePayload(payload);
        const shareUrl = window.location.origin + window.location.pathname + '?Data=' + encoded;
        
        navigator.clipboard.writeText(shareUrl).then(() => {
            window.showToast("🔗 Seed Configuration Link Saved to Clipboard!");
        }).catch(err => {
            console.error("Could not copy text: ", err);
            window.showToast("Failed to copy link.");
        });
    }
};

window.showLeaderboard = function(titleText) {
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
                let badgeIcons = "";
                if (record.trophies && Array.isArray(record.trophies)) {
                    record.trophies.forEach(tKey => {
                        const parts = tKey.split('_');
                        if (parts.length === 2 && Achievements.definitions[parts[0]]) {
                            badgeIcons += [...Achievements.definitions[parts[0]][parts[1]].icon].join('');
                        }
                    });
                }
                
                listContainer.innerHTML += `
                <li>
                    <span>${index + 1}. ${record.name} <span style="margin-left:5px; font-size:14px;" title="Trophy Showcase">${badgeIcons}</span></span> 
                    <span>${record.score} served</span>
                </li>`; 
            });
        }
    }
    document.getElementById('leaderboardOverlay').style.display = 'flex';
};

window.renderDebugMenu = function() {
    const container = document.getElementById('debugControls');
    if (!container) return;
    container.innerHTML = '';
    
    const quickGroup = document.createElement('div');
    quickGroup.style.padding = "10px";
    quickGroup.style.background = "#ecf0f1";
    quickGroup.style.display = "flex";
    quickGroup.style.gap = "8px";
    quickGroup.style.borderBottom = "2px solid #bdc3c7";
    
    const resetAwardsBtn = document.createElement('button');
    resetAwardsBtn.className = "btn btn-red btn-small";
    resetAwardsBtn.innerText = "🔄 Reset Career Medals";
    resetAwardsBtn.onclick = () => {
        const currentPlayer = Registry.playerName || safeGetItem('lastPlayer', 'Pilot 1');
        localStorage.removeItem(`liftOperator_achievements_${currentPlayer}`);
        localStorage.removeItem('liftOperator_activeTrophies');
        Registry.trophyCase = [];
        window.showToast("Wiped career achievement storage map.");
    };
    quickGroup.appendChild(resetAwardsBtn);
    container.appendChild(quickGroup);
    
    debugDefinitions.forEach(def => {
        const row = document.createElement('div'); row.className = 'debug-row';
        const label = document.createElement('span'); label.innerText = def.label;
        const ctrl = document.createElement('div'); ctrl.className = 'spinner-ctrl';
        const minus = document.createElement('button'); minus.innerText = '-';
        const valDisplay = document.createElement('div'); valDisplay.innerText = def.dispFormat(Config[def.key]);
        const plus = document.createElement('button'); plus.innerText = '+';
        minus.onclick = () => { Config[def.key] = Math.max(def.min, Math.round((Config[def.key] - def.step) * 1000) / 1000); valDisplay.innerText = def.dispFormat(Config[def.key]); };
        plus.onclick = () => { Config[def.key] = Math.min(def.max, Math.round((Config[def.key] + def.step) * 1000) / 1000); valDisplay.innerText = def.dispFormat(Config[def.key]); };
        ctrl.appendChild(minus); ctrl.appendChild(valDisplay); ctrl.appendChild(plus);
        row.appendChild(label); row.appendChild(ctrl); container.appendChild(row);
    });
};

document.addEventListener("DOMContentLoaded", () => {
    window.updateWorkshopScriptList();

    const closeWsBtn = document.getElementById('closeWorkshopBtn');
    const wsOverlay = document.getElementById('workshopOverlay');
    
    if (closeWsBtn && wsOverlay) {
        closeWsBtn.addEventListener('click', () => {
            wsOverlay.style.display = 'none';
            if (typeof window.resumeGame === 'function') window.resumeGame();
        });
    }

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