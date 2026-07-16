// ============================================================================
// UI-BRIEFING.JS : ROUND MODALS, REVIEWS, & PERFORMANCE EVALUATION
// ============================================================================

/**
 * Open the round briefing modal with contextually relevant instructions.
 */
window.showRoundModal = function(round) {
    const engine = GameEngine();
    const ui = GameUI();
    if (typeof engine.pause === 'function') engine.pause();
    
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
    const rank = typeof ui.getRankByLifts === 'function' ? ui.getRankByLifts(numLifts) : window.getRankByLifts(numLifts);
    if (typeof ui.updatePilotNameDisplay === 'function') ui.updatePilotNameDisplay();

    if (round === 1) {
        title.innerText = `Welcome ${rank}`;
        instructions.innerText = "Click on a lift shaft to send the car to that floor. Don't leave guests waiting too long!";
        const savedPlayer = window.Game.Storage.get(window.Game.Keys.PLAYER, Registry.fallbackName || "Pilot 1");
        if (document.getElementById('playerName')) document.getElementById('playerName').value = savedPlayer;
        btn.innerText = `Start Session: Round ${round}`;
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
    else if (round === 11) { title.innerText = `Round 11: The Gym Challenge (${rank})`; instructions.innerText = "A new Gym has opened! Gym Bros are double-wide and if 3 of them get in a lift, the smell will drive everyone else out. Watch out!"; }
    else if (round === 12) { title.innerText = `Round 12: Endurance (${rank})`; instructions.innerText = "NO TIMER. You have the usual 20 lives. Keep operating until the 20th defenestration, earn as many points as you can, then advance to the final round."; }
    else if (round === 13) { title.innerText = `Round 13: Pedal Power (${rank})`; instructions.innerText = "The power is out! Lift motors are running on backups. Gravity is DOUBLED. Every passenger makes the climb significantly slower."; }
    else if (round >= 14) { title.innerText = `Round ${round}: Elite Operations (${rank})`; instructions.innerText = "High-density traffic detected. Use every automation and script at your disposal!"; }

    let shopDiv = document.getElementById('shopContainer');
    if (!shopDiv && btn) {
        shopDiv = document.createElement('div');
        shopDiv.id = 'shopContainer';
        btn.parentNode.insertBefore(shopDiv, btn);
    }
    
    if (round > 1 && typeof PowerUps !== 'undefined') {
        if (shopDiv) shopDiv.style.display = 'block';
        if (typeof ui.renderShop === 'function') ui.renderShop();
        if (btn) {
            btn.innerText = `Purchase Power-ups and Start Round ${round}`;
            btn.className = 'btn btn-green btn-large btn-full-width';
            
            btn.onclick = null;
        }
    } else {
        if (shopDiv) shopDiv.style.display = 'none';
        if (btn) {
            btn.innerText = `Start Round ${round}`;
            btn.className = 'btn btn-green btn-large btn-full-width';
        }
    }

    if (typeof Achievements !== 'undefined' && typeof Achievements.renderTrophyWorkshop === 'function') {
        Achievements.renderTrophyWorkshop();
    }

    document.getElementById('roundModalOverlay').style.display = 'flex';
};

/**
 * Open the round review modal and display performance metrics/medals.
 */
window.showRoundReview = function(completedRound, reason, suppliedEvaluation) {
    if (typeof Achievements === 'undefined') return;
    const evaluation = suppliedEvaluation || Achievements.evaluateRound();
    const heading = document.querySelector('#roundReviewOverlay h2');
    if (heading) heading.innerText = reason === 'failed' ? `Round ${completedRound} Attempt Failed` : 'Round Complete!';
    
    document.getElementById('reviewServedText').innerText = evaluation.guestsServed;
    document.getElementById('breakdownHappy').innerText = Registry.roundStats.happyServed || 0;
    document.getElementById('breakdownAnnoyed').innerText = Registry.roundStats.annoyedServed || 0;
    document.getElementById('breakdownCritical').innerText = Registry.roundStats.criticalServed || 0;
    document.getElementById('breakdownDefenestrations').innerText = evaluation.defenestrations;
    
    document.getElementById('reviewPointsEarned').innerText = evaluation.pointsEarned > 0
        ? `+${evaluation.pointsEarned}`
        : '0';
    document.getElementById('reviewAvgWait').innerText = `${evaluation.averageWaitTime}s`;
    
    document.getElementById('reviewTotalPoints').innerText = evaluation.totalPoints;
    
    const listEl = document.getElementById('reviewAchievementsList');
    listEl.innerHTML = evaluation.log.map(msg => `<li>${msg}</li>`).join('');
    
    document.getElementById('roundReviewOverlay').style.display = 'flex';
};
