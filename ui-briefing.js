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

window.getRoundChallengePresentation = function(round) {
    const definition = Config.GAME_DATA.rounds[round] || {};
    const metadata = {
        roomService: { label: 'Room Service', icon: '🛎️' }, checkout: { label: 'Checkout', icon: '💼' },
        vip: { label: 'VIP', icon: '⭐' }, rooftop: { label: 'Rooftop Party', icon: '🎉' },
        jam: { label: 'Jams', icon: '⚠️' }, stink: { label: 'Stink', icon: '💨' },
        gym: { label: 'Gym Bros', icon: '💪' }, gravity: { label: 'Gravity', icon: '⬆️' },
        counterweights: { label: 'Counterweights', icon: '⚙⇅' }, capsule: { label: 'Capsule lifts', icon: '🚀' },
        zoning: { label: 'Zoning', icon: '⚙️' }, openPlan: { label: 'Open Plan', icon: '↔️' },
        endurance: { label: 'Endurance', icon: '⏱️' }
    };
    return (window.getRoundChallengeIds?.({ ...definition, round }) || [])
        .map(challenge => ({ id: challenge, ...(metadata[challenge] || { label: challenge, icon: '•' }) }));
};

window.getCampaignIntroductionTerms = function(round) {
    const events = Config.GAME_DATA.events || {};
    const shopUnlocks = Config.GAME_DATA.shopUnlocks || {};
    const terms = [];
    const challengeTerms = {
        roomService: ['Room Service', '🛎️'], checkout: ['Checkout', '💼'], vip: ['VIP', '👑'],
        rooftop: ['Rooftop Party', '🎉'], jam: ['Jams', '⚠️'], stink: ['Stink', '💨'],
        gym: ['Gym Bros', '💪'], gravity: ['Gravity', '⬆️'], counterweights: ['Counterweight', '⚙⇅'],
        capsule: ['capsules', '🚀'], zoning: ['Service Zoning', '⚙️'], openPlan: ['Open Plan', '↔️']
    };
    Object.entries(challengeTerms).forEach(([id, [label, icon]]) => {
        const introducedRound = id === 'gravity' ? 13 : id === 'counterweights' ? 21 : id === 'capsule' ? 24 : id === 'zoning' ? 14 : id === 'openPlan' ? 22 : events[id]?.introducedRound;
        if (introducedRound === round) terms.push({ label, icon });
    });
    const powerupTerms = {
        wrench: ['Wrench', '🔧'], freshener: ['Air Freshener', '🧴'], musak: ['Musak', '🎵'], turbo: ['Turbo', '🚀'],
        tardis: ['TARDIS Mode', '🌌'], doors: ['Wide Doors', '🚪'], groupThink: ['Group Think', '✨'],
        doubleDecker: ['Double-Decker', '↕️'], openPlan: ['Open Plan', '↔️']
    };
    Object.entries(powerupTerms).forEach(([id, [label, icon]]) => {
        const introducedRound = shopUnlocks[id]?.[0];
        if (introducedRound === round) terms.push({ label, icon });
    });
    return terms.sort((a, b) => b.label.length - a.label.length);
};

window.renderBriefingCopy = function(text, round, seenTerms = new Set()) {
    const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
    let html = escape(text || '');
    window.getCampaignIntroductionTerms(round).forEach(({ label, icon }) => {
        if (seenTerms.has(label)) return;
        const escapedLabel = escape(label);
        const marker = new RegExp(escapedLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        if (!marker.test(html)) return;
        html = html.replace(marker, `<span class="briefing-intro-term"><span class="briefing-intro-icon" aria-hidden="true">${icon}</span><strong>${escapedLabel}</strong></span>`);
        seenTerms.add(label);
    });
    return html;
};

// Keep briefing symbols aligned with runtime power-up/effect icons. Challenge
// icons without a runtime effect use this small, shared presentation vocabulary.
window.getRoundChallengePresentation = function(round) {
    const definition = Config.GAME_DATA.rounds[round] || {};
    const icon = (...codes) => String.fromCodePoint(...codes);
    const metadata = {
        roomService: { label: 'Room Service', icon: icon(0x1f37d, 0xfe0f) }, checkout: { label: 'Checkout', icon: icon(0x1f4bc) },
        vip: { label: 'VIP', icon: icon(0x2b50) }, rooftop: { label: 'Rooftop Party', icon: icon(0x1f378) },
        jam: { label: 'Jams', icon: icon(0x26a0, 0xfe0f) }, stink: { label: 'Stink', icon: icon(0x1f4a8) },
        gym: { label: 'Gym Bros', icon: icon(0x1f4aa) }, gravity: { label: 'Gravity', icon: icon(0x2b06, 0xfe0f) },
        counterweights: { label: 'Counterweights', icon: icon(0x2699, 0x21c5) }, capsule: { label: 'Capsule lifts', icon: icon(0x1f6d7) },
        zoning: { label: 'Zoning', icon: icon(0x2699, 0x21c5) }, openPlan: { label: 'Open Plan', icon: icon(0x2194, 0xfe0f) },
        endurance: { label: 'Endurance', icon: icon(0x23f1, 0xfe0f) }
    };
    return (window.getRoundChallengeIds?.({ ...definition, round }) || [])
        .map(challenge => ({ id: challenge, ...(metadata[challenge] || { label: challenge, icon: '•' }) }));
};

window.getCampaignIntroductionTerms = function(round) {
    const events = Config.GAME_DATA.events || {};
    const shopUnlocks = Config.GAME_DATA.shopUnlocks || {};
    const icon = (...codes) => String.fromCodePoint(...codes);
    const challengeTerms = {
        roomService: ['Room Service', icon(0x1f37d, 0xfe0f)], checkout: ['Checkout', icon(0x1f4bc)], vip: ['VIP', icon(0x2b50)],
        rooftop: ['Rooftop Party', icon(0x1f378)], jam: ['Jams', icon(0x26a0, 0xfe0f)], stink: ['Stink', icon(0x1f4a8)],
        gym: ['Gym Bros', icon(0x1f4aa)], gravity: ['Gravity', icon(0x2b06, 0xfe0f)],
        counterweights: ['Counterweight', icon(0x2699, 0x21c5)], capsule: ['capsules', icon(0x1f6d7)],
        zoning: ['Service Zoning', icon(0x2699, 0x21c5)], openPlan: ['Open Plan', icon(0x2194, 0xfe0f)]
    };
    const terms = [];
    Object.entries(challengeTerms).forEach(([id, [label, symbol]]) => {
        const introducedRound = id === 'gravity' ? 13 : id === 'counterweights' ? 21 : id === 'capsule' ? 24 : id === 'zoning' ? 14 : id === 'openPlan' ? 22 : events[id]?.introducedRound;
        if (introducedRound === round) terms.push({ label, icon: symbol });
    });
    const powerupTerms = {
        wrench: 'Wrench', freshener: 'Air Freshener', musak: 'Musak', turbo: 'Turbo', tardis: 'TARDIS Mode',
        doors: 'Wide Doors', groupThink: 'Group Think', doubleDecker: 'Double-Decker', openPlan: 'Open Plan'
    };
    Object.entries(powerupTerms).forEach(([id, label]) => {
        if (shopUnlocks[id]?.[0] !== round) return;
        const runtimeIcon = typeof PowerUps !== 'undefined' ? PowerUps.catalog?.[id]?.icon : null;
        terms.push({ label, icon: runtimeIcon || icon(0x2699, 0x21c5) });
    });
    return terms.sort((a, b) => b.label.length - a.label.length);
};

window.getCampaignRank = function(round) {
    return Config.GAME_DATA.rounds[round]?.briefing?.rank || 'Trainee';
};

/**
 * Open the round briefing modal with contextually relevant instructions.
 */
window.showRoundModal = function(round, options = {}) {
    const engine = GameEngine();
    const ui = GameUI();
    if (typeof engine.pause === 'function') engine.pause();
    
    const title = document.getElementById('roundTitle');
    const instructions = document.getElementById('roundInstructions');
    const nameContainer = document.getElementById('playerNameContainer');
    const btn = document.getElementById('startRoundBtn');

    const isRound1 = (round === 1);
    if (nameContainer) nameContainer.style.display = isRound1 ? "flex" : "none";

    if (typeof ui.updatePilotNameDisplay === 'function') ui.updatePilotNameDisplay();

    if (round === 1) {
        const savedPlayer = window.Game.Storage.get(window.Game.Keys.PLAYER, Registry.fallbackName || "Pilot 1");
        if (document.getElementById('playerName')) document.getElementById('playerName').value = savedPlayer;
        btn.innerText = `Start Session: Round ${round}`;
        btn.className = 'btn btn-green btn-large btn-full-width';
    }

    const definition = typeof window.getRoundDefinition === 'function'
        ? window.getRoundDefinition(round)
        : Config.GAME_DATA.rounds[round];
    const briefing = definition?.briefing;
    if (!briefing?.rank || !briefing?.title || !briefing?.narrative || !briefing?.learningFocus ||
        !Object.prototype.hasOwnProperty.call(briefing, 'ruleCard')) {
        throw new Error(`Missing authored briefing for round ${round}`);
    }
    const roundRank = document.getElementById('roundRank');
    const ruleCard = document.getElementById('roundRuleCard');
    const ruleHeading = document.getElementById('roundRuleHeading');
    const ruleBody = document.getElementById('roundRuleBody');
    const challengeList = document.getElementById('roundChallengeList');
    if (roundRank) roundRank.innerText = `${briefing.rank} · Round ${round} · ${definition.lifts} lifts · ${definition.floors} floors`;
    title.innerText = briefing.title;
    const seenTerms = new Set();
    instructions.innerHTML = window.renderBriefingCopy(briefing.narrative, round, seenTerms);
    if (ruleCard) ruleCard.classList.toggle('hidden', !briefing.ruleCard);
    if (briefing.ruleCard) {
        if (ruleHeading) ruleHeading.innerText = briefing.ruleCard.heading;
        if (ruleBody) ruleBody.innerHTML = window.renderBriefingCopy(briefing.ruleCard.body, round, seenTerms);
    }
    const challenges = window.getRoundChallengePresentation(round);
    if (challengeList) {
        challengeList.replaceChildren();
        const labels = challenges.length ? challenges : [{ label: 'No special challenges', icon: '' }];
        labels.forEach(({ label, icon }) => {
            const chip = document.createElement('span');
            chip.className = 'challenge-chip';
            if (icon) {
                const iconSpan = document.createElement('span');
                iconSpan.className = 'challenge-chip-icon';
                iconSpan.setAttribute('aria-hidden', 'true');
                iconSpan.innerText = icon;
                chip.appendChild(iconSpan);
            }
            chip.appendChild(document.createTextNode(label));
            challengeList.appendChild(chip);
        });
    }

    let shopDiv = document.getElementById('shopContainer');
    if (!shopDiv && btn) {
        shopDiv = document.createElement('div');
        shopDiv.id = 'shopContainer';
        const footer = btn.closest('.briefing-footer');
        (footer?.parentNode || btn.parentNode).insertBefore(shopDiv, footer || btn);
    }
    
    const hasShopUnlocks = window.isSupplyClosetAvailable(round);
    if (hasShopUnlocks) {
        if (shopDiv) shopDiv.style.display = 'flex';
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

    const promotionBanner = document.getElementById('promotionBanner');
    const promotionHeading = document.getElementById('promotionHeading');
    const promotionCopy = document.getElementById('promotionCopy');
    const dismissPromotion = document.getElementById('dismissPromotionBtn');
    const modalContent = document.querySelector('#roundModalOverlay .round-briefing-modal');
    const shouldShowPromotion = Boolean(options.showPromotion && briefing.promotion &&
        window.Game.Campaign?.shouldShowPromotion?.(round));
    if (promotionBanner) promotionBanner.classList.toggle('hidden', !shouldShowPromotion);
    if (modalContent) modalContent.classList.toggle('promotion-pending', shouldShowPromotion);
    if (modalContent) modalContent.classList.toggle('briefing-compact', !shouldShowPromotion && !hasShopUnlocks);
    if (shouldShowPromotion) {
        if (promotionHeading) promotionHeading.innerText = `${briefing.promotion.label} — ${briefing.promotion.rank}`;
        if (promotionCopy) promotionCopy.innerText = briefing.promotion.copy;
        if (dismissPromotion) dismissPromotion.onclick = () => {
            window.Game.Campaign?.acknowledgePromotion?.(round);
            promotionBanner?.classList.add('hidden');
            modalContent?.classList.remove('promotion-pending');
        };
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
