// ============================================================================
// UI-BRIEFING.JS : ROUND MODALS, REVIEWS, & PERFORMANCE EVALUATION
// ============================================================================

/**
 * The Supply Closet is a progression gate, not a consequence of having
 * carry-forward credits or being in Debug mode. Keep shop rendering and the
 * empty-cart start warning on the same predicate.
 */
window.isSupplyClosetAvailable = function(round) {
    const currentRound = Number(round);
    return currentRound >= 3
        && typeof PowerUps !== 'undefined'
        && Object.values(Config.GAME_DATA.shopUnlocks || {})
            .some(tiers => tiers.some(unlockRound => unlockRound <= currentRound));
};

window.getRoundChallengeSummary = function(round) {
    const definition = Config.GAME_DATA.rounds[round] || {};
    const labels = {
        roomService: 'Room Service', checkout: 'Checkout', vip: 'VIP', rooftop: 'Rooftop Party',
        jam: 'Jams', stink: 'Stink', gym: 'Gym Bros', gravity: 'Gravity',
        counterweights: 'Counterweights', capsule: 'Capsule lifts', zoning: 'Zoning',
        openPlan: 'Open Plan', endurance: 'Endurance'
    };
    return (window.getRoundChallengeIds?.({ ...definition, round }) || [])
        .map(challenge => labels[challenge] || challenge);
};

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
        const savedPlayer = window.Game.Storage.get(window.Game.Keys.PLAYER, Registry.fallbackName || "Pilot 1");
        if (document.getElementById('playerName')) document.getElementById('playerName').value = savedPlayer;
        btn.innerText = `Start Session: Round ${round}`;
        btn.className = 'btn btn-green btn-large btn-full-width';
    }

    const briefing = Config.GAME_DATA.rounds[round]?.briefing;
    if (!briefing?.title || !briefing?.teaching || !briefing?.emphasis) {
        throw new Error(`Missing authored briefing for round ${round}`);
    }
    title.innerText = `Round ${round}: ${briefing.title} (${rank})`;
    instructions.innerText = `${briefing.teaching} ${briefing.emphasis}`;

    const challenges = window.getRoundChallengeSummary(round);
    if (challenges.length) instructions.innerText += ` Active challenges: ${challenges.join(', ')}.`;

    let shopDiv = document.getElementById('shopContainer');
    if (!shopDiv && btn) {
        shopDiv = document.createElement('div');
        shopDiv.id = 'shopContainer';
        btn.parentNode.insertBefore(shopDiv, btn);
    }
    
    const hasShopUnlocks = window.isSupplyClosetAvailable(round);
    if (hasShopUnlocks) {
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

    window.Game.Audio?.setContext('menu');
    window.openModalExclusive('roundModalOverlay');
};

/**
 * Open the round review modal and display performance metrics/medals.
 */
window.showRoundReview = function(completedRound, reason, suppliedEvaluation) {
    const evaluation = suppliedEvaluation || window.evaluateRoundPayout();
    const heading = document.querySelector('#roundReviewOverlay h2');
    const outcome = document.getElementById('reviewOutcomeMessage');
    const continueButton = document.getElementById('continueToBriefingBtn');
    const failed = reason === 'failed';
    const authoredRounds = Object.keys(Config.GAME_DATA.rounds || {}).map(Number).filter(Number.isInteger);
    const finalAuthoredRound = authoredRounds.length ? Math.max(...authoredRounds) : completedRound;
    const destinationRound = failed ? completedRound : Math.min(finalAuthoredRound, completedRound + 1);
    const destinationHasShop = Object.values(Config.GAME_DATA.shopUnlocks || {})
        .some(tiers => tiers.some(unlockRound => unlockRound <= destinationRound));
    Registry.lastRoundOutcome = reason;
    Registry.lastRoundFailureReason = reason === 'failed' ? 'ordinary-death' : null;
    if (!failed) {
        window.Game.Campaign?.saveCurrent?.({
            round: destinationRound,
            lives: Registry.stats.lives,
            points: evaluation.totalPoints,
            inventory: []
        });
    }
    if (heading) heading.innerText = failed
        ? `Round ${completedRound} Attempt Failed`
        : `You Did It! Round ${completedRound} Complete!`;
    if (outcome) outcome.innerText = failed
        ? `Your Round ${completedRound} checkpoint is safe. Review the results, revise your plan, and try the same round again.`
        : `Excellent work — Round ${completedRound} is won and Round ${destinationRound} is unlocked!`;
    if (continueButton) continueButton.innerText = failed
        ? destinationHasShop ? `Supply Closet & Retry Round ${completedRound}` : `Retry Round ${completedRound}`
        : completedRound >= finalAuthoredRound
            ? 'Finish Campaign'
            : destinationHasShop
                ? `Supply Closet & Continue to Round ${completedRound + 1}`
                : `Continue to Round ${completedRound + 1}`;
    
    document.getElementById('reviewServedText').innerText = evaluation.guestsServed;
    document.getElementById('breakdownHappy').innerText = Registry.roundStats.happyServed || 0;
    document.getElementById('breakdownAnnoyed').innerText = Registry.roundStats.annoyedServed || 0;
    document.getElementById('breakdownCritical').innerText = Registry.roundStats.criticalServed || 0;
    document.getElementById('breakdownDefenestrations').innerText = evaluation.defenestrations;
    
    document.getElementById('reviewPointsEarned').innerText = evaluation.pointsEarned > 0
        ? `+${evaluation.pointsEarned}`
        : '0';
    document.getElementById('reviewAvgWait').innerText = evaluation.guestsServed > 0
        ? `${evaluation.averageWaitTime}s`
        : 'No deliveries';
    
    document.getElementById('reviewTotalPoints').innerText = evaluation.totalPoints;
    
    window.Game.Audio?.setContext('menu');
    window.openModalExclusive('roundReviewOverlay');
};
