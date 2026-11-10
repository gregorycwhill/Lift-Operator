const { test, expect } = require('@playwright/test');
const { startTestServer } = require('./test-server');

const GAME_URL = 'http://127.0.0.1:5500/index.html';
let testServer;

test.beforeAll(async () => {
    testServer = await startTestServer();
});

test.afterAll(async () => {
    if (testServer) await new Promise(resolve => testServer.close(resolve));
});

test.beforeEach(async ({ page }) => {
    await page.goto(GAME_URL);
});

test('every authored round renders its canonical briefing title and active challenges', async ({ page }) => {
    const result = await page.evaluate(() => {
        const labels = {
            roomService: 'Room Service', checkout: 'Checkout', vip: 'VIP', rooftop: 'Rooftop Party',
            jam: 'Jams', stink: 'Stink', gym: 'Gym Bros', gravity: 'Gravity',
            capsule: 'Capsule lifts', zoning: 'Zoning', transfers: 'Transfers',
            pets: 'Pets', endurance: 'Endurance'
        };
        return Object.entries(Config.GAME_DATA.rounds).map(([round, definition]) => {
            showRoundModal(Number(round));
            const renderedChallenges = Array.from(document.querySelectorAll('#roundChallengeList .challenge-chip'))
                .map(chip => chip.innerText);
            return {
                round: Number(round),
                title: document.getElementById('roundTitle').innerText,
                expectedTitle: definition.briefing.title,
                rank: document.getElementById('roundRank').innerText,
                expectedRank: definition.briefing.rank,
                missingChallenges: (definition.activeChallenges || [])
                    .map(challenge => labels[challenge] || challenge)
                    .filter(label => !renderedChallenges.some(rendered => rendered.includes(label)))
            };
        });
    });
    expect(new Set(result.map(row => row.expectedTitle)).size).toBe(25);
    for (const row of result) {
        expect(row.title).toContain(row.expectedTitle);
        expect(row.rank).toContain(row.expectedRank.toUpperCase());
        expect(row.missingChallenges, `Round ${row.round} briefing omitted an active challenge`).toEqual([]);
    }
});

test('campaign promotions appear only at approved progression boundaries and persist acknowledgement', async ({ page }) => {
    const result = await page.evaluate(() => {
        Registry.playerName = 'Promotion Test';
        Registry.promotionAcknowledgements = [];
        showRoundModal(3, { showPromotion: true });
        const first = {
            banner: !document.getElementById('promotionBanner').classList.contains('hidden'),
            detailsHidden: document.querySelector('.round-briefing-modal').classList.contains('promotion-pending'),
            heading: document.getElementById('promotionHeading').innerText,
            modalHeight: document.querySelector('.round-briefing-modal').getBoundingClientRect().height,
            viewportHeight: window.innerHeight
        };
        document.getElementById('dismissPromotionBtn').click();
        const acknowledged = [...Registry.promotionAcknowledgements];
        showRoundModal(3, { showPromotion: true });
        const repeated = !document.getElementById('promotionBanner').classList.contains('hidden');
        showRoundModal(4, { showPromotion: true });
        const nonTransition = !document.getElementById('promotionBanner').classList.contains('hidden');
        showRoundModal(6, { showPromotion: false });
        const directEntry = !document.getElementById('promotionBanner').classList.contains('hidden');
        return { first, acknowledged, repeated, nonTransition, directEntry };
    });
    expect(result.first.banner).toBe(true);
    expect(result.first.detailsHidden).toBe(true);
    expect(result.first.heading).toBe('PROMOTION — OPERATOR');
    expect(result.first.modalHeight).toBeLessThan(result.first.viewportHeight);
    expect(result.acknowledged).toEqual([3]);
    expect(result.repeated).toBe(false);
    expect(result.nonTransition).toBe(false);
    expect(result.directEntry).toBe(false);
});

test('structured briefing uses the compact modal while keeping Supply Closet items four across', async ({ page }) => {
    const result = await page.evaluate(() => {
        skipToRound(10, { showBriefing: false });
        showRoundModal(10);
        const modal = document.querySelector('.round-briefing-modal');
        const grid = document.querySelector('#shopContainer .shop-items-grid');
        return {
            width: modal.getBoundingClientRect().width,
            modalOverflow: getComputedStyle(modal).overflowY,
            gridDisplay: getComputedStyle(grid).display,
            gridColumns: getComputedStyle(grid).gridTemplateColumns.split(' ').length
        };
    });
    expect(result.width).toBeGreaterThanOrEqual(580);
    expect(result.width).toBeLessThanOrEqual(610);
    expect(result.modalOverflow).toBe('hidden');
    expect(result.gridDisplay).toBe('grid');
    expect(result.gridColumns).toBe(4);
});

test('briefings without a Supply Closet use compact content-sized geometry', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(2, { showBriefing: false });
        showRoundModal(2, { showPromotion: false });
        const modal = document.querySelector('.round-briefing-modal');
        return {
            compact: modal.classList.contains('briefing-compact'),
            promotion: modal.classList.contains('promotion-pending'),
            height: modal.getBoundingClientRect().height,
            viewportHeight: window.innerHeight,
            shopVisible: document.getElementById('shopContainer').style.display !== 'none'
        };
    });
    expect(result.compact).toBe(true);
    expect(result.promotion).toBe(false);
    expect(result.height).toBeLessThan(result.viewportHeight * 0.75);
    expect(result.shopVisible).toBe(false);
});

test('briefing removes redundant objective/loadout copy and presents introductions and shop tiers', async ({ page }) => {
    const result = await page.evaluate(() => {
        skipToRound(3, { showBriefing: false });
        showRoundModal(3);
        const roomServiceIntro = {
            richText: document.getElementById('roundInstructions').innerHTML,
            introTerms: document.querySelectorAll('.briefing-intro-term').length,
            chips: Array.from(document.querySelectorAll('#roundChallengeList .challenge-chip')).map(chip => chip.innerText),
            objectiveCard: document.querySelector('.briefing-objective'),
            loadoutHint: document.getElementById('roundLoadoutHint'),
            tierLabels: [],
            cart: document.querySelector('.cart-container')?.innerText || ''
        };
        showRoundModal(4);
        const laterRound = { introTerms: document.querySelectorAll('.briefing-intro-term').length };
        skipToRound(12, { showBriefing: false });
        showRoundModal(12);
        const enduranceRule = document.getElementById('roundRuleBody')?.innerText || '';
        roomServiceIntro.tierLabels = Array.from(document.querySelectorAll('.shop-btn-tier')).slice(0, 3).map(node => node.innerText);
        roomServiceIntro.shopCardWidth = document.querySelector('.shop-btn')?.getBoundingClientRect().width || 0;
        roomServiceIntro.sharedScroll = getComputedStyle(document.querySelector('.shop-scroll-region')).overflowY;
        roomServiceIntro.nestedScroll = [
            getComputedStyle(document.querySelector('.shop-items-grid')).overflowY,
            getComputedStyle(document.querySelector('.cart-items-grid')).overflowY
        ];
        PowerUps.cart = [{ id: 'freshener', tier: 0 }];
        window.renderShop();
        roomServiceIntro.startButtonVisible = document.getElementById('startRoundBtn').getBoundingClientRect().height > 0;
        roomServiceIntro.footerPosition = getComputedStyle(document.querySelector('.briefing-footer')).position;
        roomServiceIntro.cartHeader = document.querySelector('.cart-header')?.innerText || '';
        roomServiceIntro.cartItemCount = document.querySelector('.cart-item .quantity-badge')?.innerText || '';
        roomServiceIntro.cartItemLabel = document.querySelector('.cart-item')?.getAttribute('aria-label') || '';
        roomServiceIntro.cartTotal = document.querySelector('.cart-total')?.innerText || '';
        roomServiceIntro.cartColumns = getComputedStyle(document.querySelector('.cart-items-grid')).gridTemplateColumns;
        return { roomServiceIntro, laterRound, enduranceRule };
    });
    expect(result.roomServiceIntro.richText).toContain('Room Service');
    expect(result.roomServiceIntro.richText).toContain('briefing-intro-icon');
    expect(result.roomServiceIntro.introTerms).toBeGreaterThan(0);
    expect(result.roomServiceIntro.chips.every(chip => /[🛎️]/u.test(chip))).toBe(true);
    expect(result.roomServiceIntro.objectiveCard).toBe(null);
    expect(result.roomServiceIntro.loadoutHint).toBe(null);
    expect(result.roomServiceIntro.tierLabels).toEqual(['Bronze', 'Silver', 'Gold']);
    expect(result.roomServiceIntro.cart).toContain('Cart empty');
    expect(result.roomServiceIntro.shopCardWidth).toBeGreaterThan(80);
    expect(result.roomServiceIntro.sharedScroll).toBe('auto');
    expect(result.roomServiceIntro.nestedScroll).toEqual(['visible', 'visible']);
    expect(result.roomServiceIntro.startButtonVisible).toBe(true);
    expect(result.roomServiceIntro.footerPosition).toBe('static');
    expect(result.roomServiceIntro.cartHeader).not.toContain('Cart');
    expect(result.roomServiceIntro.cartItemCount).toBe('1');
    expect(result.roomServiceIntro.cartItemLabel).toContain('Air Freshener');
    expect(result.roomServiceIntro.cartTotal).toBe('1 Credits');
    expect(result.roomServiceIntro.cartColumns).toBe('38px 38px');
    expect(result.laterRound.introTerms).toBe(0);
    expect(result.enduranceRule).toContain('twentieth life');
});

test('campaign shell restores only a validated pre-round checkpoint', async ({ page }) => {
    const result = await page.evaluate(() => {
        localStorage.removeItem(Game.Keys.CAMPAIGN);
        Registry.playerName = 'Campaign Test';
        Registry.seed = 2468;
        Registry.points = 17;
        Registry.highestUnlockedRound = 9;
        skipToRound(8, { showBriefing: false });
        Registry.stats.lives = 14;
        PowerUps.inventory = [{ id: 'turbo', tier: 0 }];
        Game.Campaign.saveCurrent();
        Registry.points = 0;
        Registry.highestUnlockedRound = 1;
        Registry.stats.lives = 1;
        PowerUps.inventory = [];
        const restored = Game.Campaign.restore();
        return {
            restored, round: Registry.stats.round, seed: Registry.seed, campaignSeed: Registry.campaignSeed, points: Registry.points,
            unlock: Registry.highestUnlockedRound, lives: Registry.stats.lives,
            inventory: PowerUps.inventory, briefing: document.getElementById('roundModalOverlay').style.display
        };
    });

    expect(result).toMatchObject({ restored: true, round: 8, campaignSeed: 2468, points: 17, unlock: 9, lives: 14, briefing: 'flex' });
    expect(result.seed).toEqual(expect.any(Number));
    expect(result.inventory).toEqual([{ id: 'turbo', tier: 0 }]);
});

test('campaign checkpoint saves committed purchases but not an unpurchased cart', async ({ page }) => {
    const result = await page.evaluate(() => {
        localStorage.removeItem(Game.Keys.CAMPAIGN);
        initializeRound(3, { showBriefing: false });
        Registry.playerName = 'Campaign Shop Test';
        Registry.campaignSeed = 9876;
        Registry.useCampaignSeeds = true;
        Registry.points = 5;
        PowerUps.inventory = [];
        PowerUps.cart = [{ id: 'freshener', tier: 0 }];
        checkoutCart();
        const saved = JSON.parse(localStorage.getItem(Game.Keys.CAMPAIGN));
        Registry.points = 0;
        PowerUps.inventory = [];
        PowerUps.cart = [{ id: 'turbo', tier: 0 }];
        Game.Campaign.restore();
        return {
            savedPoints: saved.points,
            savedInventory: saved.inventory,
            savedCart: saved.cart,
            restoredPoints: Registry.points,
            restoredInventory: PowerUps.inventory,
            restoredCart: PowerUps.cart
        };
    });
    expect(result).toEqual({
        savedPoints: 4,
        savedInventory: [{ id: 'freshener', tier: 0 }],
        savedCart: undefined,
        restoredPoints: 4,
        restoredInventory: [{ id: 'freshener', tier: 0 }],
        restoredCart: []
    });
});

test('campaign shell rejects stale checkpoints and exposes credited completion', async ({ page }) => {
    const result = await page.evaluate(() => {
        localStorage.setItem(Game.Keys.CAMPAIGN, JSON.stringify({ schemaVersion: 1, balanceVersion: 'stale', playerName: 'Old', seed: 1, round: 3, highestUnlockedRound: 3, lives: 20, points: 2 }));
        const stale = Game.Campaign.load();
        Game.Shell.showWelcome();
        const playLabel = document.getElementById('welcomeStartBtn').textContent;
        Game.Shell.showCampaignComplete();
        return { stale, playLabel, completed: document.getElementById('campaignCompleteOverlay').style.display, credits: document.getElementById('creditsOverlay').textContent };
    });

    expect(result.stale).toBeNull();
    expect(result.playLabel).toBe('Play');
    expect(result.completed).toBe('flex');
    expect(result.credits).toContain('Gregory Hill');
    expect(result.credits).toContain('Marie Barnard');
});

test('Campaign Complete returns from Leaderboard without resuming a terminal round', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(25, { showBriefing: false });
        Registry.playerName = 'Campaign Test';
        Registry.gameActive = false;
        Registry.roundTerminalHandled = true;
        Game.Shell.showCampaignComplete();
        showLeaderboard('Campaign Complete');
        document.getElementById('closeLbBtn').click();
        return {
            gameActive: Registry.gameActive,
            leaderboard: document.getElementById('leaderboardOverlay').style.display,
            complete: document.getElementById('campaignCompleteOverlay').style.display,
            closeLabel: document.getElementById('closeLbBtn').textContent
        };
    });
    expect(result).toEqual({ gameActive: false, leaderboard: 'none', complete: 'flex', closeLabel: 'Back' });
});

test('campaign completion records every completed seed once and shows the active run on the Leaderboard', async ({ page }) => {
    const result = await page.evaluate(() => {
        localStorage.removeItem(Game.Keys.LEADERBOARD);
        Registry.debugSession = false;
        Registry.playerName = 'Campaign Score Test';
        Registry.useCampaignSeeds = true;
        Registry.campaignSeed = 111;
        Registry.campaignScore = 73;
        Game.Shell.showCampaignComplete();
        Game.Shell.showCampaignComplete();
        const afterRepeat = JSON.parse(localStorage.getItem(Game.Keys.LEADERBOARD));
        Registry.campaignSeed = 222;
        Registry.campaignScore = 41;
        Game.Shell.showCampaignComplete();
        showLeaderboard('Campaign Complete');
        const records = JSON.parse(localStorage.getItem(Game.Keys.LEADERBOARD));
        return {
            records,
            afterRepeatCount: afterRepeat.length,
            rendered: [...document.querySelectorAll('#lbList li')].map(item => item.textContent)
        };
    });
    expect(result.afterRepeatCount).toBe(1);
    expect(result.records).toHaveLength(2);
    expect(result.records.map(record => record.score).sort((a, b) => a - b)).toEqual([41, 73]);
    expect(result.records.every(record => record.name === 'Campaign Score Test')).toBe(true);
    expect(result.rendered.some(item => item.includes('41'))).toBe(true);
});

test('campaign shell Play reaches Round 1 briefing and New Game only clears its checkpoint', async ({ page }) => {
    await page.evaluate(() => {
        localStorage.setItem(Game.Keys.CAMPAIGN, JSON.stringify({ schemaVersion: 1, balanceVersion: Config.balanceVersion, playerName: 'Saved', seed: 77, round: 4, highestUnlockedRound: 4, lives: 20, points: 4, inventory: [], completed: false }));
        localStorage.setItem(Game.Keys.PLAYER, 'Saved');
        localStorage.setItem('shell-preference', 'retain');
        Game.Shell.showWelcome();
    });
    await page.locator('#welcomeNewGameBtn').click();
    await page.locator('#confirmNewGameBtn').click();
    const result = await page.evaluate(() => ({
        checkpoint: localStorage.getItem(Game.Keys.CAMPAIGN),
        preference: localStorage.getItem('shell-preference'),
        briefing: document.getElementById('roundModalOverlay').style.display,
        round: Registry.stats.round
    }));
    expect(result).toEqual({ checkpoint: null, preference: 'retain', briefing: 'flex', round: 1 });
});

test('Friends and Family onboarding keeps developer identifiers out of normal play', async ({ page }) => {
    const result = await page.evaluate(() => {
        Config.debugMode = false;
        Registry.highestUnlockedRound = 1;
        updateLocksUI();
        Game.Shell.showWelcome();
        return {
            gameId: Boolean(document.getElementById('gameIdContainer')),
            welcome: document.getElementById('welcomeOverlay').innerText,
            howTo: document.getElementById('howToPlayOverlay').innerText,
            seedHidden: document.getElementById('seedContainer').hidden,
            newCampaign: document.getElementById('restartBtn').innerText,
            workshopHint: document.getElementById('openWorkshopBtn').title
        };
    });

    expect(result.gameId).toBe(false);
    expect(result.welcome).toContain('desktop Chrome or Edge');
    expect(result.howTo).toContain('Ground is marked G');
    expect(result.howTo).toContain('Progress saves at round boundaries');
    expect(result.seedHidden).toBe(true);
    expect(result.newCampaign).toBe('New Campaign');
    expect(result.workshopHint).toBe('Unlocks at Round 10');
});

test('environment guard classifies supported and unsupported player environments', async ({ page }) => {
    const result = await page.evaluate(() => {
        const detect = window.Game.Environment.detectEnvironment;
        const cases = {
            edgeDesktop: detect({ userAgent: 'Mozilla/5.0 Windows NT 10.0 Edg/126.0', maxTouchPoints: 0 }),
            firefoxDesktop: detect({ userAgent: 'Mozilla/5.0 Windows NT 10.0 Firefox/128.0', maxTouchPoints: 0 }),
            safariDesktop: detect({ userAgent: 'Mozilla/5.0 Macintosh Intel Mac OS X Safari/605.1.15', maxTouchPoints: 0 }),
            android: detect({ userAgent: 'Mozilla/5.0 Android 14 Mobile Chrome/126.0', maxTouchPoints: 5 }),
            ipadDesktopUa: detect({ userAgent: 'Mozilla/5.0 Macintosh Intel Mac OS X Safari/605.1.15', maxTouchPoints: 5 })
        };
        window.Game.Environment.show(cases.firefoxDesktop);
        const shown = {
            display: document.getElementById('environmentNoticeOverlay').style.display,
            label: document.getElementById('environmentNoticeDetected').innerText
        };
        document.getElementById('environmentNoticeContinue').click();
        return { cases, shown, afterContinue: document.getElementById('environmentNoticeOverlay').style.display };
    });

    expect(result.cases.edgeDesktop.supported).toBe(true);
    expect(result.cases.edgeDesktop.label).toContain('Edge on a desktop or laptop');
    expect(result.cases.firefoxDesktop.supported).toBe(false);
    expect(result.cases.firefoxDesktop.label).toContain('Firefox');
    expect(result.cases.safariDesktop.supported).toBe(false);
    expect(result.cases.android.isMobile).toBe(true);
    expect(result.cases.android.isTablet).toBe(false);
    expect(result.cases.ipadDesktopUa.isTablet).toBe(true);
    expect(result.cases.ipadDesktopUa.supported).toBe(false);
    expect(result.shown).toEqual({ display: 'flex', label: 'Firefox on a desktop or laptop' });
    expect(result.afterContinue).toBe('none');
});

test('feedback privacy copy explains prefill transmission and Submit requirement', async ({ page }) => {
    const copy = await page.evaluate(() => document.querySelector('.feedback-privacy-note')?.innerText || '');
    expect(copy).toContain('Opening the feedback form sends these technical details to Google');
    expect(copy).toContain('round, seed, browser and viewport');
    expect(copy).toContain('No feedback response is submitted unless you press Submit');
});

test('manifest Debug access is welcoming and cannot overwrite a saved campaign', async ({ page }) => {
    const result = await page.evaluate(() => {
        const saved = {
            schemaVersion: 1, balanceVersion: Config.balanceVersion, playerName: 'Saved Pilot', seed: 2468,
            round: 6, highestUnlockedRound: 6, lives: 14, points: 12, inventory: [], completed: false
        };
        localStorage.setItem(Game.Keys.CAMPAIGN, JSON.stringify(saved));
        Registry.playerName = 'Playtest Pilot';
        Registry.debugSession = false;
        Config.debugMode = false;
        Registry.pendingManifest = [{ type: 'debug_override', overrides: {} }];
        processNextManifestItem();
        const prompt = {
            title: document.getElementById('manifestTitle').innerText,
            text: document.getElementById('manifestInstructions').innerText,
            accept: document.getElementById('manifestAcceptBtn').innerText,
            reject: document.getElementById('manifestRejectBtn').innerText
        };
        document.getElementById('manifestAcceptBtn').click();
        const persisted = Game.Campaign.saveCurrent();
        return {
            prompt,
            debug: Config.debugMode,
            debugSession: Registry.debugSession,
            unlock: Registry.highestUnlockedRound,
            persisted,
            saved: JSON.parse(localStorage.getItem(Game.Keys.CAMPAIGN))
        };
    });

    expect(result.prompt).toMatchObject({ title: 'Playtest Access', accept: 'Enable Playtest Access', reject: 'Use Normal Play' });
    expect(result.prompt.text).toContain('does not replace your saved campaign progress');
    expect(result.debug).toBe(true);
    expect(result.debugSession).toBe(true);
    expect(result.unlock).toBe(25);
    expect(result.persisted).toBeNull();
    expect(result.saved).toMatchObject({ playerName: 'Saved Pilot', round: 6, points: 12 });
});

test('round evaluation commits payout only once', async ({ page }) => {
    const result = await page.evaluate(() => {
        Registry.playerName = 'Evaluation Test';
        Registry.points = 10;
        Registry.campaignScore = 0;
        Registry.stats.round = 1;
        Registry.stats.timeLeft = 20;
        Registry.roundStats = createRoundStats();
        Registry.roundStats.servedThisRound = 2;
        Registry.roundStats.happyServed = 2;
        Registry.roundStats.totalWaitTimeServed = 12;
        Registry.roundEvaluation = null;

        const first = evaluateRoundPayout();
        const afterFirst = Registry.points;
        const campaignScoreAfterFirst = Registry.campaignScore;
        const second = evaluateRoundPayout();

        return {
            afterFirst,
            afterSecond: Registry.points,
            campaignScoreAfterFirst,
            campaignScoreAfterSecond: Registry.campaignScore,
            sameEvaluation: first === second
        };
    });

    expect(result.afterSecond).toBe(result.afterFirst);
    expect(result.campaignScoreAfterSecond).toBe(result.campaignScoreAfterFirst);
    expect(result.campaignScoreAfterFirst).toBe(result.afterFirst - 10);
    expect(result.sameEvaluation).toBe(true);
});

test('average wait measures spawn-to-destination delivery time', async ({ page }) => {
    const averageWait = await page.evaluate(() => {
        Registry.playerName = 'Wait Test';
        Registry.points = 0;
        Registry.stats.round = 1;
        Registry.stats.timeLeft = 0;
        Registry.roundStats = createRoundStats();
        Registry.roundStats.servedThisRound = 1;
        Registry.roundStats.happyServed = 1;
        Registry.roundStats.totalWaitTimeServed = 15;
        Registry.roundEvaluation = null;
        return evaluateRoundPayout().averageWaitTime;
    });

    expect(averageWait).toBe('15.0');
});

test('live animation delivery uses the same clock domain as guest spawn time', async ({ page }) => {
    const result = await page.evaluate(() => {
        buildWorld();
        const lift = Registry.lifts[0];
        lift.pos = 0;
        lift.targetFloor = 0;
        lift.state = 'BOARDING';
        lift.stateProgress = 1;
        lift.passengers = [{
            dest: 0,
            status: GuestStatus.HAPPY,
            spawnTime: Date.now() - 15000,
            boardingWeight: 1
        }];
        Registry.gameActive = true;
        animationTick(performance.now());
        Registry.gameActive = false;
        return {
            served: Registry.roundStats.servedThisRound,
            wait: Registry.roundStats.totalWaitTimeServed
        };
    });

    expect(result.served).toBe(1);
    expect(result.wait).toBeGreaterThanOrEqual(14.5);
    expect(result.wait).toBeLessThan(17);
});

test('retry resets attempt-scoped round telemetry', async ({ page }) => {
    const result = await page.evaluate(() => {
        skipToRound(3);
        Registry.customScriptTicks = 500;
        Registry.roundEvaluation = { pointsEarned: 99 };
        Registry.roundCheckpoint = { round: 3, seed: Registry.seed, points: Registry.points };
        Registry.roundTerminalHandled = false;
        handleOrdinaryDeath();
        retryFailedRound();
        return {
            customScriptTicks: Registry.customScriptTicks,
            roundEvaluation: Registry.roundEvaluation
        };
    });

    expect(result.customScriptTicks).toBe(0);
    expect(result.roundEvaluation).toBeNull();
});

test('campaign reset clears campaign and attempt state while retaining career identity', async ({ page }) => {
    const result = await page.evaluate(() => {
        Registry.playerName = 'Career Pilot';
        Registry.points = 88;
        Registry.highestUnlockedRound = 9;
        Registry.stats.round = 9;
        Registry.roundStats = { servedThisRound: 44 };
        Registry.customScriptTicks = 123;
        PowerUps.inventory = [{ id: 'wrench', tier: 0 }];
        PowerUps.cart = [{ id: 'turbo', tier: 0 }];
        resetGame({ forceProduction: true });
        return {
            playerName: Registry.playerName,
            points: Registry.points,
            highestUnlockedRound: Registry.highestUnlockedRound,
            round: Registry.stats.round,
            served: Registry.roundStats.servedThisRound,
            customScriptTicks: Registry.customScriptTicks,
            inventory: PowerUps.inventory.length,
            cart: PowerUps.cart.length
        };
    });

    expect(result).toEqual({
        playerName: 'Career Pilot', points: 0,
        highestUnlockedRound: 1, round: 1, served: 0, customScriptTicks: 0, inventory: 0, cart: 0
    });
});

test('queue renders oldest guest at the right-hand lift side', async ({ page }) => {
    const result = await page.evaluate(() => {
        Registry.floors[0].waitingGuests = [
            { dest: 1, status: GuestStatus.HAPPY, spawnTime: 1000 },
            { dest: 2, status: GuestStatus.HAPPY, spawnTime: 2000 },
            { dest: 3, status: GuestStatus.HAPPY, spawnTime: 3000 }
        ];
        Registry.lastLobbyRenderTime = 0;
        draw();
        const lobby = document.getElementById('lobby-0');
        const guests = [...lobby.querySelectorAll('.guest')];
        return {
            flexDirection: getComputedStyle(lobby).flexDirection,
            justifyContent: getComputedStyle(lobby).justifyContent,
            destinationsInDomOrder: guests.map(guest => guest.textContent),
            firstLeft: guests[0].getBoundingClientRect().left,
            lastLeft: guests[guests.length - 1].getBoundingClientRect().left,
            rightGap: lobby.getBoundingClientRect().right - guests[0].getBoundingClientRect().right
        };
    });

    expect(result.flexDirection).toBe('row-reverse');
    expect(result.justifyContent).toBe('flex-start');
    expect(result.firstLeft).toBeGreaterThan(result.lastLeft);
    expect(result.rightGap).toBeLessThan(12);
});

test('failed attempt review awards nothing and continues to same-round shop', async ({ page }) => {
    const result = await page.evaluate(() => {
        skipToRound(2, { showBriefing: false });
        Registry.points = 8;
        captureRoundCheckpoint(2);
        Registry.roundStats.servedThisRound = 4;
        Registry.roundStats.totalWaitTimeServed = 40;
        Registry.roundStats.defenestrationsThisRound = 20;
        Registry.stats.lives = 0;
        Registry.roundTerminalHandled = false;
        handleOrdinaryDeath();
        return {
            reviewVisible: getComputedStyle(document.getElementById('roundReviewOverlay')).display,
            briefingVisible: getComputedStyle(document.getElementById('roundModalOverlay')).display,
            points: Registry.points,
            evaluation: Registry.roundEvaluation,
            pending: Registry.pendingFailedRetry
        };
    });

    expect(result.reviewVisible).toBe('flex');
    expect(result.briefingVisible).not.toBe('flex');
    expect(result.points).toBe(8);
    expect(result.evaluation).toBeNull();
    expect(result.pending.round).toBe(2);
    await expect(page.locator('#roundReviewOverlay h2')).toHaveText('Round 2 Attempt Failed');
    await expect(page.locator('#reviewOutcomeMessage')).toContainText('same round again');
    await expect(page.locator('#continueToBriefingBtn')).toHaveText('Retry Round 2');

    await page.click('#continueToBriefingBtn');
    await expect(page.locator('#roundModalOverlay')).toBeVisible();
    expect(await page.evaluate(() => Registry.stats.round)).toBe(2);
    await expect(page.locator('#roundTitle')).toContainText('Probation by Automation');
});

test('successful review explicitly celebrates the completed round and next unlock', async ({ page }) => {
    await page.evaluate(() => {
        skipToRound(2, { showBriefing: false });
        Registry.roundStats.servedThisRound = 20;
        Registry.roundTerminalHandled = false;
        completeRound('completed');
    });

    await expect(page.locator('#roundReviewOverlay h2')).toHaveText('You Did It! Round 2 Complete!');
    await expect(page.locator('#reviewOutcomeMessage')).toContainText('Round 2 is won');
    await expect(page.locator('#continueToBriefingBtn')).toHaveText('Supply Closet & Continue to Round 3');
});

test('Round 1 review and Round 2 briefing do not advertise a locked Supply Closet', async ({ page }) => {
    await page.evaluate(() => {
        skipToRound(1, { showBriefing: false });
        Registry.roundTerminalHandled = false;
        completeRound('completed');
    });
    await expect(page.locator('#continueToBriefingBtn')).toHaveText('Continue to Round 2');

    await page.click('#continueToBriefingBtn');
    await expect(page.locator('#roundModalOverlay')).toBeVisible();
    await expect(page.locator('#shopContainer')).toBeHidden();
    await expect(page.locator('#startRoundBtn')).toHaveText('Start Round 2');
});

test('queue rendering is bounded under heavy late-round backlog', async ({ page }) => {
    const result = await page.evaluate(() => {
        Registry.floors[0].waitingGuests = Array.from({ length: 250 }, (_, index) => ({
            dest: (index % (Config.numFloors - 1)) + 1,
            status: GuestStatus.HAPPY,
            spawnTime: index
        }));
        Registry.lastLobbyRenderTime = 0;
        draw();
        const lobby = document.getElementById('lobby-0');
        return {
            renderedGuests: lobby.querySelectorAll('.guest').length,
            overflowText: lobby.querySelector('.queue-overflow')?.textContent
        };
    });

    expect(result.renderedGuests).toBe(18);
    expect(result.overflowText).toBe('+232');
});

test('stable lift contents are not rebuilt on every animation frame', async ({ page }) => {
    const mutations = await page.evaluate(() => {
        const lift = Registry.lifts[0];
        lift.passengers = [{ dest: 3, status: GuestStatus.HAPPY, spawnTime: 0 }];
        draw();
        const car = document.getElementById('lift-el-0');
        let childMutations = 0;
        const observer = new MutationObserver(records => {
            childMutations += records.filter(record => record.type === 'childList').length;
        });
        observer.observe(car, { childList: true, subtree: true });

        for (let frame = 0; frame < 120; frame++) {
            updateLiftVisualState(lift, 0);
            draw();
        }
        observer.disconnect();
        return childMutations;
    });

    expect(mutations).toBe(0);
});

test('idle automation decisions are bounded under repeated animation calls', async ({ page }) => {
    const executions = await page.evaluate(() => {
        const lift = Registry.lifts[0];
        lift.automation = 'sweep';
        lift.lastAutomationTime = 0;
        const originalExecute = Game.Automation.execute;
        let count = 0;
        Game.Automation.execute = () => { count++; };
        try {
            for (let now = 1000; now < 1100; now += 5) {
                runAutomationLogic(lift, 0, 0, false, false, now);
            }
            runAutomationLogic(lift, 0, 0, false, false, 1100);
            return count;
        } finally {
            Game.Automation.execute = originalExecute;
        }
    });

    expect(executions).toBe(2);
});

test('round review labels appear above their statistics', async ({ page }) => {
    const positions = await page.evaluate(() => {
        const overlay = document.getElementById('roundReviewOverlay');
        overlay.style.display = 'flex';
        return [...overlay.querySelectorAll('.review-stat')].map(column => ({
            label: column.querySelector('.review-stat-label').textContent.trim(),
            labelTop: column.querySelector('.review-stat-label').getBoundingClientRect().top,
            valueTop: column.querySelector('.review-stat-value-container').getBoundingClientRect().top
        }));
    });

    expect(positions.map(position => position.label)).toEqual(['Served', 'Credits Earned', 'Total Credits']);
    positions.forEach(position => expect(position.labelTop).toBeLessThan(position.valueTop));
});

test('checkout commits a cart only once', async ({ page }) => {
    const result = await page.evaluate(() => {
        Registry.points = 20;
        PowerUps.inventory = [];
        PowerUps.cart = [{ id: 'wrench', tier: 0 }];
        const cost = PowerUps.catalog.wrench.tiers[0].cost;
        checkoutCart();
        checkoutCart();
        return {
            points: Registry.points,
            inventoryCount: PowerUps.inventory.length,
            expectedPoints: 20 - cost
        };
    });

    expect(result.points).toBe(result.expectedPoints);
    expect(result.inventoryCount).toBe(1);
});

test('credits carry forward and eligible empty-cart starts request confirmation', async ({ page }) => {
    const result = await page.evaluate(() => {
        Registry.points = 12;
        PowerUps.cart = [];
        initializeRound(3, { showBriefing: true });
        document.getElementById('startRoundBtn').click();
        return {
            carried: Registry.points,
            confirmationVisible: document.getElementById('roundStartConfirmOverlay').style.display === 'flex',
            briefingVisible: document.getElementById('roundModalOverlay').style.display === 'flex'
        };
    });
    expect(result).toEqual({ carried: 12, confirmationVisible: true, briefingVisible: false });
});

test('Round 1 never warns about unspent credits, including in Debug mode', async ({ page }) => {
    const result = await page.evaluate(() => {
        Config.debugMode = true;
        Registry.points = 12;
        PowerUps.cart = [];
        initializeRound(1, { showBriefing: true });
        document.getElementById('startRoundBtn').click();
        return {
            supplyClosetAvailable: isSupplyClosetAvailable(1),
            shopDisplay: document.getElementById('shopContainer')?.style.display,
            confirmationDisplay: document.getElementById('roundStartConfirmOverlay')?.style.display,
            briefingDisplay: document.getElementById('roundModalOverlay')?.style.display
        };
    });
    expect(result).toEqual({
        supplyClosetAvailable: false,
        shopDisplay: 'none',
        confirmationDisplay: 'none',
        briefingDisplay: 'none'
    });
});

test('pause and resume preserve guest and scheduled-event ages', async ({ page }) => {
    const result = await page.evaluate(() => {
        const originalNow = Date.now;
        let now = 100000;
        Date.now = () => now;
        try {
            Registry.gameActive = true;
            Registry.floors[0].waitingGuests = [{ spawnTime: 90000 }];
            Registry.lifts[0].passengers = [{ spawnTime: 91000 }];
            Registry.lifts[0].lastActionTime = 92000;
            Registry.parentTickTime = 93000;
            Registry.lastSpawnTime = 94000;
            Registry.vipTargetTime = 110000;
            Registry.sunsetTargetTime = 120000;
            Registry.sunsetEndTime = 130000;
            Game.BalanceTelemetry.reset(80000);

            pauseGame();
            now += 5000;
            resumeGame();

            return {
                floorGuest: Registry.floors[0].waitingGuests[0].spawnTime,
                passenger: Registry.lifts[0].passengers[0].spawnTime,
                lastActionTime: Registry.lifts[0].lastActionTime,
                parentTickTime: Registry.parentTickTime,
                lastSpawnTime: Registry.lastSpawnTime,
                vipTargetTime: Registry.vipTargetTime,
                sunsetTargetTime: Registry.sunsetTargetTime,
                sunsetEndTime: Registry.sunsetEndTime,
                telemetryStartTime: Game.BalanceTelemetry.startTime
            };
        } finally {
            Date.now = originalNow;
        }
    });

    expect(result).toEqual({
        floorGuest: 95000,
        passenger: 96000,
        lastActionTime: 97000,
        parentTickTime: 98000,
        lastSpawnTime: 99000,
        vipTargetTime: 115000,
        sunsetTargetTime: 125000,
        sunsetEndTime: 135000,
        telemetryStartTime: 85000
    });
});

test('all supported rounds have explicit factory configuration', async ({ page }) => {
    const definitions = await page.evaluate(() => {
        return Array.from({ length: 25 }, (_, index) => getRoundDefinition(index + 1));
    });

    expect(definitions).toHaveLength(25);
    definitions.forEach((definition, index) => {
        expect(definition.round).toBe(index + 1);
        expect(definition.floors).toBeGreaterThan(0);
        expect(definition.lifts).toBeGreaterThan(0);
        expect(definition.spawnStart).toBeGreaterThan(0);
        expect(definition.spawnEnd).toBeGreaterThan(0);
        expect(definition.objective).toBeTruthy();
    });
});

test('factory produces equivalent structures for normal, retry, and simulation setup', async ({ page }) => {
    const structures = await page.evaluate(() => {
        const originalNow = Date.now;
        Date.now = () => 100000;
        const summarize = () => ({
            round: Registry.stats.round,
            seed: Registry.seed,
            floors: Registry.floors.length,
            lifts: Registry.lifts.map(lift => Object.keys(lift).sort()),
            lives: Registry.stats.lives,
            timeLeft: Registry.stats.timeLeft,
            spawnChance: Registry.stats.currentSpawnChance,
            vipToSunsetOffset: Registry.vipTargetTime - Registry.sunsetTargetTime,
            gymFloor: Registry.gymFloor
        });

        try {
            Registry.seed = 7777;
            initializeRound(11, { now: 100000, showBriefing: false });
            const normal = summarize();

            Registry.roundCheckpoint = { round: 11, seed: 7777, points: Registry.points };
            Registry.roundTerminalHandled = false;
            handleOrdinaryDeath();
            retryFailedRound();
            const retry = summarize();

            initializeRound(11, { now: 100000, showBriefing: false });
            const simulation = summarize();

            return { normal, retry, simulation };
        } finally {
            Date.now = originalNow;
        }
    });

    expect(structures.retry).toEqual(structures.normal);
    expect(structures.simulation).toEqual(structures.normal);
});

test('simulation runs in an isolated realm without mutating the live game', async ({ page }) => {
    const result = await page.evaluate(async () => {
        Registry.seed = 4321;
        Registry.points = 17;
        Registry.stats.round = 4;
        Registry.stats.lives = 13;
        Registry.stats.timeLeft = 77;
        Registry.gameActive = false;
        Registry.lifts[0].targetFloor = 3;
        Config.numFloors = 10;
        window.Game.Seed.set(4321);

        const snapshot = () => JSON.stringify({
            seed: Registry.seed,
            points: Registry.points,
            stats: Registry.stats,
            gameActive: Registry.gameActive,
            lifts: Registry.lifts,
            floors: Registry.floors,
            numFloors: Config.numFloors,
            randomState: window.Game.Seed.current
        });

        const before = snapshot();
        const simulation = await window.Game.Simulator.runRound(9999, { 0: 'sweep' }, 1);
        const after = snapshot();

        return {
            unchanged: before === after,
            simulation,
            remainingFrames: document.querySelectorAll('iframe[aria-hidden="true"]').length
        };
    });

    expect(result.unchanged).toBe(true);
    expect(result.simulation.error).toBeUndefined();
    expect(result.simulation.roundStats).toBeTruthy();
    expect(result.remainingFrames).toBe(0);
});

test('production page excludes developer test scripts', async ({ page }) => {
    const sources = await page.locator('script[src]').evaluateAll(elements =>
        elements.map(element => element.getAttribute('src'))
    );
    expect(sources.some(source => source.startsWith('tests/'))).toBe(false);
});

test('automation source validation rejects accidental lockups and browser access', async ({ page }) => {
    const result = await page.evaluate(() => ({
        normal: window.Game.Automation.validateSource('Building.setTarget(2);'),
        loop: window.Game.Automation.validateSource('while (true) {}'),
        browser: window.Game.Automation.validateSource('document.body.innerHTML = "";'),
        oversized: window.Game.Automation.validateSource('x'.repeat(12001))
    }));

    expect(result.normal.valid).toBe(true);
    expect(result.loop.valid).toBe(false);
    expect(result.browser.valid).toBe(false);
    expect(result.oversized.valid).toBe(false);
});

test('payload decoder rejects oversized and unsupported manifests', async ({ page }) => {
    const result = await page.evaluate(() => {
        Registry.pendingManifest = [];
        const oversized = decodePayload('A'.repeat(100001));
        handleSharedData(encodePayload({ type: 'unknown-capability', value: 1 }));
        return {
            oversized,
            queued: Registry.pendingManifest.length
        };
    });

    expect(result.oversized).toBeNull();
    expect(result.queued).toBe(0);
});

test('automation randomness does not consume the environment stream', async ({ page }) => {
    const result = await page.evaluate(() => {
        window.Game.Seed.set(2468);
        window.Game.AutomationSeed.set(1357);
        const environmentFirst = window.Game.Seed.random();
        const expectedEnvironmentSecond = window.Game.Seed.random();

        window.Game.Seed.set(2468);
        window.Game.AutomationSeed.set(1357);
        const actualEnvironmentFirst = window.Game.Seed.random();
        getAutomationRandomFloor();
        getAutomationRandomFloor();
        const actualEnvironmentSecond = window.Game.Seed.random();

        return {
            environmentFirst,
            expectedEnvironmentSecond,
            actualEnvironmentFirst,
            actualEnvironmentSecond
        };
    });

    expect(result.actualEnvironmentFirst).toBe(result.environmentFirst);
    expect(result.actualEnvironmentSecond).toBe(result.expectedEnvironmentSecond);
});

test('same seed, round, and strategy produce the same simulation result', async ({ page }) => {
    const results = await page.evaluate(async () => {
        const first = await window.Game.Simulator.runRound(1234, { 0: 'sweep' }, 1);
        const second = await window.Game.Simulator.runRound(1234, { 0: 'sweep' }, 1);
        return { first, second };
    });

    expect(results.second).toEqual(results.first);
    expect(Number.isFinite(results.first.served)).toBe(true);
    expect(Number.isFinite(results.first.livesRemaining)).toBe(true);
    expect(Number.isFinite(results.first.timeLeft)).toBe(true);
});

test('simulation experiment overrides and strategy actions remain isolated', async ({ page }) => {
    const result = await page.evaluate(async () => {
        const canonical = JSON.stringify(Config.GAME_DATA.rounds[3]);
        const simulation = await window.Game.Simulator.runRound(
            1234,
            { 0: 'sweep', 1: 'sweep' },
            3,
            {
                strategy: 'minimal-rescue',
                interventionIntervalSec: 12,
                roundOverrides: { spawnStart: 1.01, spawnEnd: 1.21 }
            }
        );
        return {
            canonicalUnchanged: JSON.stringify(Config.GAME_DATA.rounds[3]) === canonical,
            simulation
        };
    });

    expect(result.canonicalUnchanged).toBe(true);
    expect(result.simulation.roundDefinition.spawnStart).toBe(1.01);
    expect(result.simulation.roundDefinition.spawnEnd).toBe(1.21);
    expect(result.simulation.roundStats.manualClicks).toBeGreaterThan(0);
});

test('built-in simulation comparators do not inject manual rescue actions', async ({ page }) => {
    const result = await page.evaluate(() => window.Game.Simulator.runRound(
        1234,
        { 0: 'priority-sweep', 1: 'priority-sweep' },
        4,
        { strategy: 'all-priority', roundOverrides: { spawnStart: 0.95, spawnEnd: 1.15 } }
    ));

    expect(result.roundStats.manualClicks).toBe(0);
});

test('idealized campaign comparator uses production-routed manual commands', async ({ page }) => {
    const result = await page.evaluate(() => window.Game.Simulator.runRound(
        1234,
        { 0: 'manual', 1: 'manual' },
        4,
        { strategy: 'idealized-dispatch' }
    ));

    expect(result.error).toBeUndefined();
    expect(result.roundStats.manualClicks).toBeGreaterThan(0);
    expect(result.designTelemetry.samples.length).toBeGreaterThan(0);
});

test('campaign seeds derive stable independent round seeds', async ({ page }) => {
    const result = await page.evaluate(() => {
        const first = Game.Campaign.deriveRoundSeed(1234, 13);
        const repeat = Game.Campaign.deriveRoundSeed(1234, 13);
        const otherRound = Game.Campaign.deriveRoundSeed(1234, 14);
        const otherCampaign = Game.Campaign.deriveRoundSeed(5678, 13);
        const generated = Array.from({ length: 5 }, () => Game.Campaign.generateSeed());
        return { first, repeat, otherRound, otherCampaign, generated };
    });
    expect(result.first).toBe(result.repeat);
    expect(result.otherRound).not.toBe(result.first);
    expect(result.otherCampaign).not.toBe(result.first);
    expect(result.first).toBeGreaterThan(0);
    expect(result.generated.every(seed => Number.isInteger(seed) && seed > 0 && seed < 2147483647)).toBe(true);
    expect(new Set(result.generated).size).toBeGreaterThan(1);
});

test('acceptance simulation is invariant when earlier rounds have run', async ({ page }) => {
    const result = await page.evaluate(async () => {
        const loadout = ['doors', 'wrench', 'turbo', 'musak', 'freshener']
            .flatMap(id => [{ id, tier: 0 }, { id, tier: 0 }]);
        const intendedOptions = {
            profileId: 'r4-r6-triage',
            strategy: 'resource-supported',
            loadout,
            interventionIntervalSec: 12,
            manualTargetLimit: 12,
            trace: true
        };
        const scriptsFor = round => Object.fromEntries(
            Array.from({ length: Config.GAME_DATA.rounds[round].lifts }, (_, index) => [index, 'priority-sweep'])
        );
        const summarize = run => ({
            success: run.success,
            elapsedSeconds: run.elapsedSeconds,
            served: run.served,
            livesRemaining: run.livesRemaining,
            manualClicks: run.roundStats.manualClicks
        });
        const alone = summarize(await Game.Simulator.runRound(6060, scriptsFor(6), 6, intendedOptions));
        for (let round = 2; round <= 5; round++) {
            await Game.Simulator.runRound(6060, scriptsFor(round), round, intendedOptions);
        }
        const afterEarlierRounds = summarize(await Game.Simulator.runRound(6060, scriptsFor(6), 6, intendedOptions));
        return { alone, afterEarlierRounds };
    });

    expect(result.afterEarlierRounds).toEqual(result.alone);
});

test('resource-supported comparator combines declared inventory with manual rescues', async ({ page }) => {
    const result = await page.evaluate(() => window.Game.Simulator.runRound(
        1234,
        { 0: 'priority-sweep', 1: 'priority-sweep' },
        4,
        {
            strategy: 'resource-supported',
            interventionIntervalSec: 12,
            loadout: [{ id: 'doors', tier: 1 }, { id: 'doors', tier: 1 }]
        }
    ));

    expect(result.error).toBeUndefined();
    expect(result.roundStats.manualClicks).toBeGreaterThan(0);
    expect(result.livesRemaining).toBeGreaterThanOrEqual(0);
});

test('automation bridge rejects out-of-range targets', async ({ page }) => {
    const result = await page.evaluate(() => {
        const lift = Registry.lifts[0];
        lift.targetFloor = 0;
        const bridge = window.Game.Automation.getBuildingBridge(lift);
        bridge.setTarget(-1);
        const afterNegative = lift.targetFloor;
        bridge.setTarget(Config.numFloors);
        return {
            afterNegative,
            afterOverflow: lift.targetFloor
        };
    });

    expect(result.afterNegative).toBe(0);
    expect(result.afterOverflow).toBe(0);
});

test('base lift and boarding speeds are both 0.5 seconds', async ({ page }) => {
    const speeds = await page.evaluate(() => ({
        lift: Config.liftSpeedSec,
        boarding: Config.boardSpeedSec,
        canonicalLift: Config.GAME_DATA.system.liftSpeedSec,
        canonicalBoarding: Config.GAME_DATA.system.boardSpeedSec
    }));

    expect(speeds).toEqual({
        lift: 0.5,
        boarding: 0.5,
        canonicalLift: 0.5,
        canonicalBoarding: 0.5
    });
});

test('canonical balance data drives runtime compatibility values', async ({ page }) => {
    const result = await page.evaluate(() => ({
        version: Config.balanceVersion,
        canonicalVersion: window.GameBalanceData.balanceVersion,
        roundTime: Config.roundTime,
        canonicalRoundTime: Config.GAME_DATA.system.roundTime,
        roundElevenLifts: Config.liftsR11,
        canonicalRoundElevenLifts: Config.GAME_DATA.rounds[11].lifts,
        roundThirteenSpawn: [Config.spawnR13Start, Config.spawnR13End],
        canonicalRoundThirteenSpawn: [
            Config.GAME_DATA.rounds[13].spawnStart,
            Config.GAME_DATA.rounds[13].spawnEnd
        ]
    }));

    expect(result.version).toBe(result.canonicalVersion);
    expect(result.roundTime).toBe(result.canonicalRoundTime);
    expect(result.roundElevenLifts).toBe(result.canonicalRoundElevenLifts);
    expect(result.roundThirteenSpawn).toEqual(result.canonicalRoundThirteenSpawn);
});

test('R14 is direct-only zoning and R15-R20 enable one-transfer networks', async ({ page }) => {
    const result = await page.evaluate(() => {
        const expected = {
            14: [20, 5], 15: [20, 6], 16: [20, 6], 17: [25, 6],
            18: [25, 7], 19: [30, 8], 20: [30, 10]
        };
        const rows = Object.entries(expected).map(([round, [floors, lifts]]) => {
            const definition = getRoundDefinition(Number(round));
            initializeRound(Number(round), { showBriefing: false });
            const lift = Registry.lifts[0];
            lift.serviceLower = 3;
            lift.serviceUpper = 10;
            return {
                round: Number(round), floors: definition.floors, lifts: definition.lifts,
                zoning: definition.zoningEnabled,
                transfers: Boolean(definition.transfersEnabled),
                local: Registry.canLiftDirectlyServe(lift, 4, 9),
                outside: Registry.canLiftDirectlyServe(lift, 4, 12)
            };
        });
        return rows;
    });
    result.forEach(row => {
        expect([20, 25, 30]).toContain(row.floors);
        expect(row.lifts).toBeGreaterThanOrEqual(5);
        expect(row.zoning).toBe(true);
        expect(row.transfers).toBe(row.round >= 15);
        expect(row.local).toBe(true);
        expect(row.outside).toBe(false);
    });
});

test('Service Zoning reports coverage, overlap, and reproducible direct-route gaps', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(14, { showBriefing: false });
        Registry.lifts[0].serviceLower = 0;
        Registry.lifts[0].serviceUpper = 10;
        Registry.lifts.forEach(lift => {
            lift.serviceLower = 0;
            lift.serviceUpper = 10;
        });
        Registry.lifts[1].serviceLower = 10;
        Registry.lifts[1].serviceUpper = 19;
        const report = Registry.getServiceZoneReport();
        return {
            gCovered: report.coverage[0],
            overlapAtTen: report.coverage[10],
            uncoveredFloors: report.uncoveredFloors,
            hasGap: report.uncoveredRoutes.some(route => route[0] === 0 && route[1] === 19),
            configuration: report.configuration.slice(0, 2),
            invalidBlank: Registry.validateServiceRange('', 10).valid,
            invalidReversed: Registry.validateServiceRange(10, 2).valid
        };
    });

    expect(result).toEqual({
        gCovered: 4,
        overlapAtTen: 5,
            uncoveredFloors: [],
        hasGap: true,
        configuration: [[0, 10], [10, 19]],
        invalidBlank: false,
        invalidReversed: false
    });
});

test('R25 keeps zoning enabled for the capsule fleet and uses flat service greys', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(25, { showBriefing: false });
        Registry.lifts[0].serviceUpper = 10;
        buildWorld();
        const served = document.querySelector('.shaft.zone-served');
        const unserved = document.querySelector('.shaft.zone-unserved');
        return {
            zoning: getRoundDefinition(25).zoningEnabled,
            capsule: Registry.capsuleMode,
            currentRound: Registry.stats.round,
            zoningActive: document.getElementById('world').classList.contains('zoning-active'),
            shaftCount: document.querySelectorAll('.shaft').length,
            servedCount: document.querySelectorAll('.shaft.zone-served').length,
            unservedCount: document.querySelectorAll('.shaft.zone-unserved').length,
            servedBackground: served ? getComputedStyle(served).backgroundColor : null,
            unservedBackground: unserved ? getComputedStyle(unserved).backgroundColor : null,
            servedShadow: served ? getComputedStyle(served).boxShadow : null,
            unservedOpacity: unserved ? getComputedStyle(unserved).opacity : null
        };
    });
    expect(result.zoning).toBe(true);
    expect(result.capsule).toBe(true);
    expect(result.currentRound).toBe(25);
    expect(result.zoningActive).toBe(true);
    expect(result.servedCount).toBeGreaterThan(0);
    expect(result.unservedCount).toBeGreaterThan(0);
    expect(result.servedBackground).toBe('rgb(208, 214, 217)');
    expect(result.unservedBackground).toBe('rgb(184, 193, 198)');
    expect(result.servedShadow).toBe('none');
    expect(result.unservedOpacity).toBe('1');
});

test('short and tall standard buildings use the accepted speed bands while special arcs retain baseline rules', async ({ page }) => {
    const result = await page.evaluate(() => ({
        baseline: Config.GAME_DATA.system.liftSpeedSec,
        short: Config.GAME_DATA.system.shortBuildingLiftSpeedSec,
        tall: Config.GAME_DATA.system.tallBuildingLiftSpeedSec,
        threshold: Config.GAME_DATA.system.shortBuildingMaxFloors,
        r11Floors: Config.GAME_DATA.rounds[11].floors,
        r20Floors: Config.GAME_DATA.rounds[20].floors,
        r14Transfers: Boolean(Config.GAME_DATA.rounds[14].transfersEnabled),
        r15Transfers: Config.GAME_DATA.rounds[15].transfersEnabled,
        r24Capsule: Config.GAME_DATA.rounds[24].capsuleMode
    }));
    expect(result).toEqual({
        baseline: 0.5,
        short: 0.45,
        tall: 0.4166666667,
        threshold: 15,
        r11Floors: 15,
        r20Floors: 30,
        r14Transfers: false,
        r15Transfers: true,
        r24Capsule: true
    });
});

test('Infinite Capacity boards every compatible waiting guest before closing', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(11, { showBriefing: false });
        Registry.gameActive = true;
        const lift = Registry.lifts[0];
        const floor = 3;
        const now = 1000000;
        Registry.lifts.slice(1).forEach(other => { other.automation = 'manual'; other.targetFloor = 0; });
        lift.pos = floor * Registry.floorHeight;
        lift.targetFloor = floor;
        lift.automation = 'manual';
        lift.state = 'IDLE';
        lift.stateProgress = 0;
        lift.manualOverride = true;
        lift.tardisTimer = 10;
        Registry.floors[floor].waitingGuests = [1, 2, 3].map(id => ({
            id: `infinite-${id}`, dest: 8, status: GuestStatus.HAPPY, spawnTime: now,
            isVip: false, isGymBro: false, isPartying: false, boardingWeight: 1
        }));
        for (let tick = 0; tick < 1200 && Registry.floors[floor].waitingGuests.length; tick++) {
            Game.Engine.animationTick(now + tick * 16);
        }
        return {
            boarded: lift.passengers.map(guest => guest.id),
            waiting: Registry.floors[floor].waitingGuests.length,
            capacity: PowerUps.getLiftCapacity(lift.id),
            state: lift.state,
            manualOverride: lift.manualOverride,
            targetFloor: lift.targetFloor
        };
    });
    expect(result.capacity).toBe(999);
    expect(result.boarded).toEqual(['infinite-1', 'infinite-2', 'infinite-3']);
    expect(result.waiting).toBe(0);
});

test('Infinite Capacity expiry normalises once without ejecting compatible passengers forever', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(11, { showBriefing: false });
        Registry.gameActive = true;
        const lift = Registry.lifts[0];
        const floor = 4;
        const now = 1000000;
        lift.pos = floor * Registry.floorHeight;
        lift.targetFloor = floor;
        lift.automation = 'manual';
        lift.manualOverride = true;
        lift.state = 'IDLE';
        lift.stateProgress = 0;
        lift.jamTimer = 0;
        lift.isJammed = false;
        lift.passengers = [
            { id: 'gym-a', dest: 12, isGymBro: true, boardingWeight: 2, status: GuestStatus.HAPPY },
            { id: 'gym-b', dest: 12, isGymBro: true, boardingWeight: 2, status: GuestStatus.HAPPY },
            ...Array.from({ length: 10 }, (_, index) => ({
                id: `ordinary-${index}`, dest: 12, isGymBro: false, boardingWeight: 1, status: GuestStatus.HAPPY
            }))
        ];
        lift.tardisExpiryExodus = true;
        Registry.floors[floor].waitingGuests = [];

        for (let tick = 0; tick < 1600; tick++) Game.Engine.animationTick(now + tick * 16);
        const weightAfterRecovery = Registry.getLiftWeight(lift);
        const passengersAfterRecovery = lift.passengers.map(passenger => passenger.id);
        for (let tick = 1600; tick < 2400; tick++) Game.Engine.animationTick(now + tick * 16);

        return {
            normalCapacity: PowerUps.getLiftCapacity(lift.id),
            weightAfterRecovery,
            passengersAfterRecovery,
            recoveryFlag: lift.tardisExpiryExodus,
            stablePassengerCount: lift.passengers.length
        };
    });

    expect(result.weightAfterRecovery).toBeLessThanOrEqual(result.normalCapacity);
    expect(result.passengersAfterRecovery).toContain('gym-a');
    expect(result.passengersAfterRecovery).toContain('gym-b');
    expect(result.recoveryFlag).toBe(false);
    expect(result.stablePassengerCount).toBe(result.passengersAfterRecovery.length);
});

test('Weighted Voting delivers an onboard VIP before selecting incompatible waiting demand', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(15, { showBriefing: false });
        const lift = Registry.lifts[0];
        const floor = 14;
        lift.pos = floor * Registry.floorHeight;
        lift.targetFloor = floor;
        lift.automation = 'weighted-voting';
        lift.manualOverride = false;
        lift.passengers = [{ id: 'vip-onboard', isVip: true, dest: 3, status: GuestStatus.HAPPY, boardingWeight: 1 }];
        Registry.floors[floor].waitingGuests = Array.from({ length: 12 }, (_, index) => ({
            id: `rooftop-${index}`, dest: 0, status: GuestStatus.CRITICAL, isVip: false,
            isGymBro: false, boardingWeight: 1
        }));
        return Registry.getBestFloor(lift, true);
    });

    expect(result).toBe(3);
});

test('R23 uses the authored interchange spawn curve', async ({ page }) => {
    const result = await page.evaluate(() => ({
        start: Config.GAME_DATA.rounds[23].spawnStart,
        end: Config.GAME_DATA.rounds[23].spawnEnd
    }));
    expect(result).toEqual({ start: 1.25, end: 1.6 });
});

test('Round 2 onward starts every eligible lift in Sweep', async ({ page }) => {
    const result = await page.evaluate(() => {
        const modes = {};
        [1, 2, 5, 10, 22, 25].forEach(round => {
            initializeRound(round, { showBriefing: false });
            modes[round] = Registry.lifts.map(lift => lift.automation);
        });
        return modes;
    });
    expect(result[1].every(mode => mode === 'manual')).toBe(true);
    for (const round of [2, 5, 10, 22, 25]) {
        expect(result[round].every(mode => mode === 'sweep'), `Round ${round}`).toBe(true);
    }
});

test('zoning changes service coverage without changing Sweep automation', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(10, { showBriefing: false });
        const lift = Registry.lifts[0];
        const before = lift.automation;
        const low = Game.AutomationController.setLiftZone(0, 'low');
        const lowState = { automation: lift.automation, lower: lift.serviceLower, upper: lift.serviceUpper };
        const high = Game.AutomationController.setLiftZone(0, 'high');
        return { before, low, lowState, high, after: lift.automation, max: Config.numFloors - 1 };
    });
    expect(result.before).toBe('sweep');
    expect(result.low).toBe(true);
    expect(result.high).toBe(true);
    expect(result.lowState.automation).toBe('sweep');
    expect(result.lowState.lower).toBe(0);
    expect(result.lowState.upper).toBeLessThan(result.max);
    expect(result.after).toBe('sweep');
});

test('pet filters enforce Cats, Dogs, No Pets, and All independently of automation', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(5, { showBriefing: false });
        const lift = Registry.lifts[0];
        const cat = { petType: 'cat' };
        const dog = { petType: 'dog' };
        const ordinary = { petType: null };
        return ['all', 'cats', 'dogs', 'none'].map(filter => {
            Game.AutomationController.setPetFilter(0, filter);
            return {
                filter,
                automation: lift.automation,
                cat: Registry.canLiftAcceptPet(lift, cat),
                dog: Registry.canLiftAcceptPet(lift, dog),
                ordinary: Registry.canLiftAcceptPet(lift, ordinary)
            };
        });
    });
    expect(result).toEqual([
        { filter: 'all', automation: 'sweep', cat: true, dog: true, ordinary: true },
        { filter: 'cats', automation: 'sweep', cat: true, dog: false, ordinary: true },
        { filter: 'dogs', automation: 'sweep', cat: false, dog: true, ordinary: true },
        { filter: 'none', automation: 'sweep', cat: false, dog: false, ordinary: true }
    ]);
});

test('mixed pets warn once and Pet Snacks resolves conflict without suppressing pet Stink', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(5, { showBriefing: false });
        Registry.gameActive = true;
        const lift = Registry.lifts[0];
        const now = Date.now();
        const guest = petType => ({ petType, dest: 1, status: GuestStatus.HAPPY, spawnTime: now, boardingWeight: 1 });
        lift.passengers = [guest('cat'), guest('dog'), guest('cat'), guest('dog'), guest('cat')];
        lift.targetFloor = 1;
        gameTick(now);
        const warned = {
            pending: lift.petConflictPending,
            conflicts: Registry.roundStats.petConflicts,
            stinky: Registry.isLiftStinky(lift),
            petCount: lift.passengers.filter(passenger => passenger.petType).length,
            petEvent: isRoundEventEnabled(Config.GAME_DATA.rounds[Registry.stats.round], 'pets'),
            freshener: lift.freshenerTimer,
            immunity: PowerUps.timers.stinkImmunity,
            threshold: Config.petStinkThreshold
        };
        PowerUps.catalog.petSnacks.tiers[0].execute(0, 0);
        gameTick(now + 1000);
        return {
            warned,
            resolved: Registry.roundStats.petConflictResolutions,
            pending: lift.petConflictPending,
            snacks: lift.petSnacksTimer,
            stillStinky: Registry.isLiftStinky(lift)
        };
    });
    expect(result.warned).toEqual({ pending: true, conflicts: 1, stinky: true, petCount: 5, petEvent: true, freshener: 0, immunity: 0, threshold: 5 });
    expect(result.resolved).toBe(1);
    expect(result.pending).toBe(false);
    expect(result.snacks).toBeGreaterThan(0);
    expect(result.stillStinky).toBe(true);
});

test('R15 one-transfer routing prefers direct service and chooses a deterministic pet-compatible interchange', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(15, { showBriefing: false });
        Registry.lifts.forEach((lift, index) => {
            lift.serviceLower = index % 2 === 0 ? 0 : 10;
            lift.serviceUpper = index % 2 === 0 ? 10 : 19;
            lift.petFilter = 'cats';
        });
        const cat = { dest: 18, finalDestination: 18, transferCount: 0, petType: 'cat', spawnTime: 1234 };
        const transfer = Registry.findGuestRoute(2, 18, cat);
        const prepared = Registry.prepareGuestRoute(cat, 2);
        Registry.lifts[0].serviceUpper = 19;
        const direct = Registry.findGuestRoute(2, 18, { ...cat, dest: 18, transferFloor: null, transferCount: 0 });
        Registry.lifts[0].serviceUpper = 10;
        Registry.lifts.filter((_, index) => index % 2 === 1).forEach(lift => { lift.petFilter = 'dogs'; });
        const blocked = Registry.findGuestRoute(2, 18, { ...cat, dest: 18, transferFloor: null, transferCount: 0 });
        return { transfer, prepared, cat, direct, blocked };
    });
    expect(result.transfer).toMatchObject({ legDestination: 10, transferFloor: 10, direct: false });
    expect(result.prepared).toBe(true);
    expect(result.cat).toMatchObject({ dest: 10, finalDestination: 18, transferFloor: 10, transferCount: 0, spawnTime: 1234 });
    expect(result.direct).toMatchObject({ legDestination: 18, transferFloor: null, direct: true });
    expect(result.blocked).toBeNull();
});

test('R15 transfer alighting requeues the same guest once without resetting patience', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(15, { showBriefing: false });
        Registry.gameActive = true;
        const [low, high] = Registry.lifts;
        Registry.lifts.forEach((lift, index) => {
            lift.serviceLower = index === 0 ? 0 : 10;
            lift.serviceUpper = index === 0 ? 10 : 19;
        });
        const spawnTime = 123456;
        const guest = {
            id: 'transfer-test', dest: 10, finalDestination: 18, transferFloor: 10, transferCount: 0,
            status: GuestStatus.HAPPY, spawnTime, boardingWeight: 1, routePrepared: true
        };
        low.passengers = [guest];
        low.pos = 10 * Registry.floorHeight;
        low.targetFloor = 10;
        low.state = 'BOARDING';
        low.stateProgress = 1;
        low.serviceCycleId = 1;
        Game.virtualTime = 200000;
        Game.Engine.animationTick();
        const queued = Registry.floors[10].waitingGuests.find(candidate => candidate.id === guest.id);
        return {
            sameObject: queued === guest,
            queued: queued && {
                dest: queued.dest, finalDestination: queued.finalDestination, transferFloor: queued.transferFloor,
                transferCount: queued.transferCount, spawnTime: queued.spawnTime
            },
            transferCount: Registry.roundStats.transfers,
            secondLegCompatible: queued ? Registry.canLiftServeGuest(high, 10, queued.dest, queued) : false
        };
    });
    expect(result.sameObject).toBe(true);
    expect(result.queued).toEqual({ dest: 18, finalDestination: 18, transferFloor: null, transferCount: 1, spawnTime: 123456 });
    expect(result.transferCount).toBe(1);
    expect(result.secondLegCompatible).toBe(true);
});

test('unresolved pet conflict clears the cabin at the next stop and only pet owners become Critical', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(5, { showBriefing: false });
        Registry.gameActive = true;
        const now = Date.now();
        Game.virtualTime = now;
        const lift = Registry.lifts[0];
        const passengers = [
            { id: 'cat', petType: 'cat', dest: 2, finalDestination: 2, status: GuestStatus.HAPPY, spawnTime: now, boardingWeight: 1 },
            { id: 'dog', petType: 'dog', dest: 3, finalDestination: 3, status: GuestStatus.HAPPY, spawnTime: now, boardingWeight: 1 },
            { id: 'ordinary', petType: null, dest: 4, finalDestination: 4, status: GuestStatus.HAPPY, spawnTime: now, boardingWeight: 1 }
        ];
        lift.passengers = passengers;
        lift.pos = 0;
        lift.targetFloor = 0;
        lift.state = 'IDLE';
        lift.petConflictPending = true;
        lift.petConflictDeadline = now - 1;
        gameTick(now);
        for (let tick = 0; tick < 220 && lift.passengers.length; tick++) {
            Game.virtualTime = now + tick * 16;
            Game.Engine.animationTick();
        }
        const queue = Registry.floors[0].waitingGuests.filter(guest => ['cat', 'dog', 'ordinary'].includes(guest.id));
        return {
            remaining: lift.passengers.length,
            queue: queue.map(guest => ({ id: guest.id, status: guest.status, spawnTime: guest.spawnTime, finalDestination: guest.finalDestination })),
            ejections: Registry.roundStats.petConflictEjections
        };
    });
    expect(result.remaining).toBe(0);
    expect(result.ejections).toBe(1);
    expect(result.queue.map(guest => guest.id).sort()).toEqual(['cat', 'dog', 'ordinary']);
    expect(result.queue.filter(guest => guest.id !== 'ordinary').every(guest => guest.status === 'critical')).toBe(true);
    expect(result.queue.find(guest => guest.id === 'ordinary').status).toBe('happy');
    expect(result.queue.every(guest => Number.isFinite(guest.spawnTime) && Number.isInteger(guest.finalDestination))).toBe(true);
});

test('generated pet owners remain ordinary one-capacity guests', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(10, { showBriefing: false });
        const definition = Config.GAME_DATA.rounds[10];
        const guests = Array.from({ length: 1000 }, (_, index) => createStandardGuest(definition, 0.6, index * 1000).guest);
        const pets = guests.filter(guest => guest.petType);
        return {
            petCount: pets.length,
            invalidRole: pets.some(guest => guest.isCheckout || guest.isVip || guest.isGymBro || guest.isRoomService),
            invalidWeight: pets.some(guest => guest.boardingWeight !== 1),
            species: [...new Set(pets.map(guest => guest.petType))].sort()
        };
    });
    expect(result.petCount).toBeGreaterThan(0);
    expect(result.invalidRole).toBe(false);
    expect(result.invalidWeight).toBe(false);
    expect(result.species).toEqual(['cat', 'dog']);
});

test('pet faces render as overlay badges without displacing destination labels', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(5, { showBriefing: false });
        const makeGuest = (petType, dest) => ({
            id: `${petType}-${dest}`,
            petType,
            dest,
            finalDestination: dest,
            status: GuestStatus.HAPPY,
            spawnTime: performance.now(),
            boardingWeight: 1
        });
        Registry.floors[0].waitingGuests = [makeGuest('cat', 9)];
        Registry.lifts[0].passengers = [makeGuest('dog', 7)];
        Registry.lastLobbyRenderTime = -Infinity;
        draw();

        const lobbyGuest = document.querySelector('#lobby-0 .guest');
        const liftGuest = document.querySelector('#lift-el-0 .guest');
        const describe = element => ({
            width: Math.round(element.getBoundingClientRect().width),
            destination: element.querySelector('.guest-destination')?.textContent,
            badge: element.querySelector('.guest-pet-badge')?.textContent,
            badgePosition: getComputedStyle(element.querySelector('.guest-pet-badge')).position,
            aria: element.getAttribute('aria-label')
        });
        return {
            catText: getGuestText(Registry.floors[0].waitingGuests[0]),
            dogText: getGuestText(Registry.lifts[0].passengers[0]),
            lobby: describe(lobbyGuest),
            lift: describe(liftGuest)
        };
    });

    expect(result.catText).toBe('9');
    expect(result.dogText).toBe('7');
    expect(result.lobby).toEqual({ width: 20, destination: '9', badge: '🐱', badgePosition: 'absolute', aria: 'Cat owner, destination 9' });
    expect(result.lift).toEqual({ width: 20, destination: '7', badge: '🐶', badgePosition: 'absolute', aria: 'Dog owner, destination 7' });
});

test('legacy Open Plan inventory is removed and refunded during the narrow campaign migration', async ({ page }) => {
    const result = await page.evaluate(() => {
        const legacy = {
            schemaVersion: 1,
            balanceVersion: '0.2.13-rail-pair-regressions',
            playerName: 'Legacy Player', seed: 1234, round: 22, highestUnlockedRound: 22,
            lives: 20, points: 10, campaignScore: 100,
            inventory: [{ id: 'openPlan', tier: 0 }, { id: 'openPlan', tier: 2 }, { id: 'wrench', tier: 0 }]
        };
        Game.Storage.set(Game.Keys.CAMPAIGN, JSON.stringify(legacy));
        return Game.Campaign.load();
    });
    expect(result.balanceVersion).toBe('0.3.2-maries-birthday');
    expect(result.points).toBe(17);
    expect(result.campaignScore).toBe(100);
    expect(result.inventory).toEqual([{ id: 'wrench', tier: 0 }]);
    expect(result.round).toBe(22);
});

test('Checkout appears only in the four authored strong-wave rounds', async ({ page }) => {
    const result = await page.evaluate(() => Object.entries(Config.GAME_DATA.rounds)
        .filter(([, definition]) => definition.activeChallenges.includes('checkout'))
        .map(([round, definition]) => ({ round: Number(round), waves: definition.checkoutWaves })));
    expect(result.map(item => item.round)).toEqual([7, 10, 18, 20]);
    expect(result.every(item => item.waves.length === 1 && item.waves[0].chance >= 0.8)).toBe(true);
});

test('capsule dispatch rounds have canonical scale, travel, and exclusions', async ({ page }) => {
    const result = await page.evaluate(() => ({
        r24: Config.GAME_DATA.rounds[24],
        r25: Config.GAME_DATA.rounds[25],
        available: ['turbo', 'petSnacks', 'freshener', 'tardis', 'doubleDecker']
            .map(id => [id, PowerUps.isPowerUpAvailableForRound(id, 24)])
    }));

    expect(result.r24).toMatchObject({ floors: 15, lifts: 10, liftCapacity: 1, capsuleMode: true, capsuleTravelSecPerFloor: 0.2, jamMinSec: 6, jamMaxSec: 10 });
    expect(result.r25).toMatchObject({ floors: 30, lifts: 20, liftCapacity: 1, capsuleMode: true, capsuleTravelSecPerFloor: 0.2, jamMinSec: 6, jamMaxSec: 10 });
    expect(result.available).toEqual([
        ['turbo', true], ['petSnacks', false], ['freshener', false],
        ['tardis', false], ['doubleDecker', false]
    ]);
});

test('capsule rounds render narrow cars and use seeded continuous demand currents', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(24, { showBriefing: false });
        Game.Seed.set(2468);
        const first = Array.from({ length: 8 }, () => getCapsuleDemandFloor(24, 0.35));
        Game.Seed.set(2468);
        const replay = Array.from({ length: 8 }, () => getCapsuleDemandFloor(24, 0.35));
        const r24View = {
            capsuleMode: Registry.capsuleMode,
            liftCount: Registry.lifts.length,
            capsuleCars: document.querySelectorAll('.capsule-car').length,
            capsuleCable: getComputedStyle(document.querySelector('.capsule-car'), '::before').display,
            tubeBoundaryWidth: getComputedStyle(document.querySelector('.capsule-bank .shaft')).borderRightWidth,
            shaftWidth: getLiftLayoutMetrics().shaftWidth,
            liftWidth: getLiftLayoutMetrics().liftWidth
        };
        initializeRound(25, { showBriefing: false });
        return {
            ...r24View,
            r25LiftCount: Registry.lifts.length,
            r25CapsuleCars: document.querySelectorAll('.capsule-car').length,
            groundPresent: first.includes(0),
            varied: new Set(first).size > 1,
            first,
            replay
        };
    });

    expect(result.capsuleMode).toBe(true);
    expect(result.liftCount).toBe(10);
    expect(result.capsuleCars).toBe(10);
    expect(result.capsuleCable).toBe('none');
    expect(result.tubeBoundaryWidth).toBe('4px');
    expect(result.shaftWidth).toBe(34);
    expect(result.liftWidth).toBe(26);
    expect(result.r25LiftCount).toBe(20);
    expect(result.r25CapsuleCars).toBe(20);
    expect(result.groundPresent).toBe(true);
    expect(result.varied).toBe(true);
    expect(result.replay).toEqual(result.first);
});

test('automation-native zoning scales, assigns, overrides, and preserves existing passengers', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(14, { showBriefing: false });
        const VM = window.Game.Automation;
        const low = VM.getScript('zoned-low');
        const high = VM.getScript('zoned-high');
        const scaled = [20, 25, 30].map(floorCount => ({
            floorCount,
            low: VM.resolveServiceZone(low.serviceZone, floorCount),
            high: VM.resolveServiceZone(high.serviceZone, floorCount)
        }));

        const lift = Registry.lifts[0];
        setLiftAutomation(0, 'zoned-low');
        const assigned = {
            mode: lift.servicePolicy.mode,
            lower: lift.serviceLower,
            upper: lift.serviceUpper,
            active: lift.servicePolicy.active
        };

        Registry.gameActive = true;
        setLiftTarget(0, Config.numFloors - 1);
        const override = {
            target: lift.targetFloor,
            manualOverride: lift.manualOverride
        };

        lift.passengers = [{ dest: Config.numFloors - 1 }];
        const passengerTarget = Registry.findSweepTarget(lift, 1);
        const bridge = VM.getBuildingBridge(lift);
        bridge.setTarget(Config.numFloors - 1);
        const existingPassengerTarget = lift.targetFloor;

        setLiftAutomation(0, 'manual');
        const reset = {
            mode: lift.servicePolicy.mode,
            lower: lift.serviceLower,
            upper: lift.serviceUpper,
            active: lift.servicePolicy.active
        };

        return { scaled, assigned, override, passengerTarget, existingPassengerTarget, reset };
    });

    expect(result.scaled).toEqual([
        { floorCount: 20, low: { mode: 'low', lower: 0, upper: 10, active: true }, high: { mode: 'high', lower: 10, upper: 19, active: true } },
        { floorCount: 25, low: { mode: 'low', lower: 0, upper: 12, active: true }, high: { mode: 'high', lower: 12, upper: 24, active: true } },
        { floorCount: 30, low: { mode: 'low', lower: 0, upper: 15, active: true }, high: { mode: 'high', lower: 15, upper: 29, active: true } }
    ]);
    expect(result.assigned).toEqual({ mode: 'low', lower: 0, upper: 10, active: true });
    expect(result.override).toEqual({ target: 19, manualOverride: true });
    expect(result.passengerTarget).toBe(19);
    expect(result.existingPassengerTarget).toBe(19);
    expect(result.reset).toEqual({ mode: 'none', lower: 0, upper: 19, active: false });
});

test('Service Zone Blockly metadata and Round 14 policy discovery are available', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(14, { showBriefing: false });
        const VM = window.Game.Automation;
        const customData = {
            blocks: { blocks: [
                { type: 'service_zone', fields: { MODE: 'CUSTOM', LOWER: '3', UPPER: '12' } }
            ] }
        };
        const custom = VM.extractServiceZone(customData);
        const names = Game.AutomationController.getCatalog().map(item => item.name);
        return {
            custom,
            zoningPanelHasLiftSelector: Boolean(document.getElementById('zoneLiftSelect')),
            policyBlock: typeof Blockly.Blocks.service_zone !== 'undefined',
            lowVisible: names.includes('Zoned Low [G–10]'),
            highVisible: names.includes('Zoned High [10–19]')
        };
    });

    expect(result.custom).toEqual({ mode: 'custom', lower: 3, upper: 12 });
    expect(result.zoningPanelHasLiftSelector).toBe(false);
    expect(result.policyBlock).toBe(true);
    expect(result.lowVisible).toBe(true);
    expect(result.highVisible).toBe(true);
});

test('RC1.0 excludes deferred Endless Alpha and achievement systems from the player runtime', async ({ page }) => {
    const result = await page.evaluate(() => ({
        achievements: typeof window.Achievements,
        endlessOperations: typeof window.Game.EndlessOperations,
        endlessStarter: typeof window.startEndlessOperation,
        trophyWorkshop: Boolean(document.getElementById('trophyWorkshopContainer')),
        reviewAchievements: Boolean(document.getElementById('reviewAchievementsList')),
        settingsAchievements: Boolean(document.getElementById('settingsAchievements')),
        regressionScorecard: Boolean(document.getElementById('testScorecardOverlay')),
        debug: (() => {
            Config.debugMode = true;
            refreshDebugVisibility();
            document.getElementById('openDebugBtn').click();
            const text = document.getElementById('debugControls').innerText;
            return {
                visible: !document.getElementById('openDebugBtn').classList.contains('hidden'),
                opened: document.getElementById('debugOverlay').style.display === 'flex',
                hasRetiredTools: /Simulation Tests|UNIT_01|Endless Alpha|Regression Suite|Career Medals/.test(text)
            };
        })()
    }));

    expect(result).toEqual({
        achievements: 'undefined', endlessOperations: 'undefined', endlessStarter: 'undefined',
        trophyWorkshop: false, reviewAchievements: false, settingsAchievements: false, regressionScorecard: false,
        debug: { visible: true, opened: true, hasRetiredTools: false }
    });
});

test('onboarding capacity and gentle Round 1/2 spawn tuning are canonical', async ({ page }) => {
    const result = await page.evaluate(() => {
        const capacities = [1, 2, 3, 4].map(round => {
            initializeRound(round, { showBriefing: false });
            return { round, capacity: Config.liftCapacity };
        });
        return {
            capacities,
            r1SpawnEnd: Config.GAME_DATA.rounds[1].spawnEnd,
            r1SpawnStart: Config.GAME_DATA.rounds[1].spawnStart,
            r2SpawnEnd: Config.GAME_DATA.rounds[2].spawnEnd,
            r2SpawnStart: Config.GAME_DATA.rounds[2].spawnStart,
            version: Config.balanceVersion
        };
    });
    expect(result.capacities).toEqual([
        { round: 1, capacity: 15 }, { round: 2, capacity: 15 },
        { round: 3, capacity: 15 }, { round: 4, capacity: 10 }
    ]);
    expect(result.r1SpawnStart).toBe(0.08);
    expect(result.r1SpawnEnd).toBe(0.18);
    expect(result.r2SpawnStart).toBe(0.27);
    expect(result.r2SpawnEnd).toBe(0.3375);
    expect(result.version).toBe('0.3.2-maries-birthday');
});

test('jammed lifts remain stationary and cannot enter boarding during animation ticks', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(13, { showBriefing: false });
        const lift = Registry.lifts[0];
        lift.pos = Registry.floorHeight * 3.5;
        lift.targetFloor = 10;
        lift.state = 'TRANSIT';
        lift.jamTimer = 120;
        Registry.gameActive = true;
        const before = { pos: lift.pos, state: lift.state, progress: lift.stateProgress };
        for (let frame = 0; frame < 60; frame++) animationTick(100000 + frame * 16);
        return { before, after: { pos: lift.pos, state: lift.state, progress: lift.stateProgress } };
    });
    expect(result.after).toEqual({ pos: result.before.pos, state: 'IDLE', progress: 0 });
});

test('Round 13 gravity reaches the top floor and Turbo does not change floor bounds', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(13, { showBriefing: false });
        Registry.gameActive = true;
        const lift = Registry.lifts[0];
        const top = Config.numFloors - 1;
        lift.targetFloor = top;
        for (let frame = 0; frame < 2400 && Math.abs(lift.pos - top * Registry.floorHeight) > 0.01; frame++) animationTick(100000 + frame * 16);
        const normal = { floor: Math.round(lift.pos / Registry.floorHeight), target: lift.targetFloor };
        lift.pos = 0; lift.targetFloor = top; lift.state = 'IDLE'; lift.turboTimer = 20; lift.activeTurboSpeed = 0.1;
        for (let frame = 0; frame < 240 && Math.abs(lift.pos - top * Registry.floorHeight) > 0.01; frame++) animationTick(200000 + frame * 16);
        return { normal, turbo: { floor: Math.round(lift.pos / Registry.floorHeight), target: lift.targetFloor } };
    });
    expect(result.normal).toEqual({ floor: 14, target: 14 });
    expect(result.turbo).toEqual({ floor: 14, target: 14 });
});

test('Round 10 Turbo preserves top-floor access', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(10, { showBriefing: false });
        Registry.gameActive = true;
        const lift = Registry.lifts[0];
        const top = Config.numFloors - 1;
        lift.targetFloor = top;
        lift.turboTimer = 20;
        lift.activeTurboSpeed = 0.1;
        for (let frame = 0; frame < 240; frame++) animationTick(300000 + frame * 16);
        return { target: lift.targetFloor, floor: Math.round(lift.pos / Registry.floorHeight) };
    });
    expect(result).toEqual({ target: 14, floor: 14 });
});

test('Double-Decker Turbo preserves the top-floor target', async ({ page }) => {
    const result = await page.evaluate(() => {
        Registry.stats.round = 13;
        Registry.floors = Array.from({ length: Config.numFloors }, (_, id) => ({ id, waitingGuests: [] }));
        Registry.lifts = [createLiftState(0)];
        const lift = Registry.lifts[0];
        lift.isDoubleDecker = true;
        lift.targetFloor = Config.numFloors - 1;
        lift.turboTimer = 10;
        lift.pos = (Config.numFloors - 2) * Registry.floorHeight;
        window.gameTick(window.Game.virtualTime || Date.now());
        return { target: lift.targetFloor, top: Config.numFloors - 1 };
    });
    expect(result.target).toBe(result.top);
});

test('effect icons refresh and expire against the simulation clock', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(13, { showBriefing: false });
        Game.virtualTime = 50000;
        const lift = Registry.lifts[0];
        PowerUps.showEffectOnLift(0, '🚀');
        PowerUps.showEffectOnLift(0, '🚀');
        lift.effects.forEach(effect => { effect.startTime = 50000; });
        const during = lift.effects.length;
        return { during };
    });
    expect(result).toEqual({ during: 1 });
});

test('shop visibility follows canonical round and tier unlocks', async ({ page }) => {
    const visibleButtons = async round => page.evaluate(value => {
        Registry.stats.round = value;
        Registry.points = 999;
        Config.debugMode = false;
        renderShop();
        return document.querySelectorAll('#shopContainer .shop-btn').length;
    }, round);

    expect(await visibleButtons(2)).toBe(0);
    expect(await visibleButtons(3)).toBe(1);
    expect(await visibleButtons(6)).toBe(6);
    expect(await visibleButtons(12)).toBe(27);
    expect(await visibleButtons(13)).toBe(27);

    const debugCount = await page.evaluate(() => {
        Registry.stats.round = 1;
        Config.debugMode = true;
        renderShop();
        return document.querySelectorAll('#shopContainer .shop-btn').length;
    });
    expect(debugCount).toBe(27);
});

test('canonical payout parameters drive standard and Endurance awards', async ({ page }) => {
    const result = await page.evaluate(() => {
        Registry.stats.round = 4;
        Registry.stats.timeLeft = 25;
        Registry.roundStats.servedThisRound = 7;
        const standard = PowerUps.calculateRoundPoints();

        Registry.stats.round = 12;
        Registry.enduranceSeconds = 125;
        Registry.roundStats.servedThisRound = 27;
        const endurance = PowerUps.calculateRoundPoints();
        Registry.enduranceSeconds = 99999;
        Registry.roundStats.servedThisRound = 99999;
        const capped = PowerUps.calculateRoundPoints();
        return { standard, endurance, capped };
    });

    expect(result.standard).toBe(0);
    expect(result.endurance).toBeGreaterThan(0);
    expect(result.capped).toBe(50);
});

test('R14 onward applies the canonical 50 percent credit uplift', async ({ page }) => {
    const result = await page.evaluate(() => {
        const pointsFor = round => {
            Registry.stats.round = round;
            Registry.stats.timeLeft = 0;
            Registry.roundStats.servedThisRound = 100;
            return PowerUps.calculateRoundPoints();
        };
        return { r13: pointsFor(13), r14: pointsFor(14), r25: pointsFor(25) };
    });
    expect(result).toEqual({ r13: 15, r14: 15, r25: 15 });
});

test('party guests remain at the rooftop until the event releases them', async ({ page }) => {
    const result = await page.evaluate(() => {
        const lift = { passengers: [], automation: 'manual', manualOverride: false, sweepDirection: 1 };
        const partyGuest = { dest: 4, status: GuestStatus.HAPPY, isPartying: true };
        const releasedGuest = { dest: 4, status: GuestStatus.HAPPY, isPartying: false };
        return {
            partyBoards: Game.Engine.canGuestBoardLift(lift, partyGuest, 14, false, 10),
            releasedBoards: Game.Engine.canGuestBoardLift(lift, releasedGuest, 14, false, 10)
        };
    });
    expect(result).toEqual({ partyBoards: false, releasedBoards: true });
});

test('Gym Floor persists after introduction and jam duration stays within 20 seconds', async ({ page }) => {
    const result = await page.evaluate(() => {
        const floors = [11, 12, 13].map(round => {
            initializeRound(round, { showBriefing: false });
            return { round, gymFloor: Registry.gymFloor };
        });
        return { floors, jamMax: Config.jamMaxSec, multiplier: Config.GAME_DATA.payouts.standard.creditMultiplier };
    });
    expect(result.floors.every(item => item.gymFloor > 0 && item.gymFloor < 14)).toBe(true);
    expect(result.jamMax).toBe(20);
    expect(result.multiplier).toBe(0.1);
});

test('explicit round challenge matrix drives runtime event activation', async ({ page }) => {
    const result = await page.evaluate(() => {
        const events = ['jam', 'checkout', 'vip', 'rooftop', 'stink', 'gym', 'roomService'];
        const snapshot = round => {
            const definition = Config.GAME_DATA.rounds[round];
            return Object.fromEntries(events.map(event => [event, isRoundEventEnabled({ round, ...definition }, event)]));
        };
        return { r5: snapshot(5), r14: snapshot(14), r23: snapshot(23), r24: snapshot(24) };
    });
    expect(result.r5).toEqual({ jam: false, checkout: false, vip: false, rooftop: false, stink: false, gym: false, roomService: true });
    expect(result.r14).toEqual({ jam: true, checkout: false, vip: true, rooftop: false, stink: true, gym: true, roomService: true });
    expect(result.r23).toEqual({ jam: true, checkout: false, vip: true, rooftop: false, stink: true, gym: true, roomService: true });
    expect(result.r24).toEqual({ jam: true, checkout: false, vip: true, rooftop: false, stink: false, gym: false, roomService: false });
});

test('Checkout is a strong temporary wave that leaves ordinary traffic outside the window', async ({ page }) => {
    const result = await page.evaluate(() => {
        const sampleRound = (round, progress) => {
            skipToRound(round, { showBriefing: false });
            Registry.sunsetTargetTime = Number.MAX_SAFE_INTEGER;
            const definition = Config.GAME_DATA.rounds[round];
            const guests = Array.from({ length: 120 }, (_, index) => createStandardGuest(definition, progress, index * 1000).guest);
            return {
                checkout: guests.filter(guest => guest.isCheckout && guest.dest === 0).length,
                ordinary: guests.filter(guest => !guest.isCheckout).length
            };
        };
        return { r7Wave: sampleRound(7, 0.3), r7Outside: sampleRound(7, 0.95), r9: sampleRound(9, 0.3) };
    });

    expect(result.r7Wave.checkout).toBeGreaterThan(0);
    expect(result.r7Wave.ordinary).toBeGreaterThan(0);
    expect(result.r7Wave.checkout / 120).toBeGreaterThan(0.65);
    expect(result.r7Outside.checkout).toBe(0);
    expect(result.r9.checkout).toBe(0);
});

test('Rooftop redirect applies equally to runtime and max-delay fallback spawns without erasing ordinary traffic', async ({ page }) => {
    const result = await page.evaluate(() => {
        skipToRound(9, { showBriefing: false });
        Registry.sunsetActive = true;
        Registry.sunsetEndTime = Number.MAX_SAFE_INTEGER;
        Registry.sunsetTargetTime = Number.MAX_SAFE_INTEGER;
        Registry.vipTargetTime = Number.MAX_SAFE_INTEGER;
        const sample = spawn => {
            const guests = [];
            for (let index = 0; index < 120; index++) {
                spawn(index * 1000);
                guests.push(...Registry.floors.flatMap(floor => floor.waitingGuests.splice(0)));
            }
            return {
                redirected: guests.filter(guest => guest.isSunset && guest.dest === Config.numFloors - 1).length,
                ordinary: guests.filter(guest => !guest.isSunset && !guest.isCheckout && guest.dest > 0).length
            };
        };
        return {
            fallback: sample(now => forceFirstSpawn(now)),
            runtime: sample(now => runSpawnerTick(now))
        };
    });

    for (const mix of [result.fallback, result.runtime]) {
        expect(mix.redirected).toBeGreaterThan(25);
        expect(mix.redirected).toBeLessThan(95);
        expect(mix.ordinary).toBeGreaterThan(0);
    }
});

test('Rooftop guests already at the roof are party-bound and return to Ground', async ({ page }) => {
    const result = await page.evaluate(() => {
        skipToRound(9, { showBriefing: false });
        Registry.sunsetActive = false;
        Registry.sunsetHasHappened = false;
        Registry.sunsetTargetTime = 1;
        Registry.sunsetEndTime = 60000;
        Registry.sunsetWarningShown = false;
        Registry.sunsetActive = false;
        const originalRatio = Config.sunsetGuestRatio;
        Config.sunsetGuestRatio = 1;
        const top = Config.numFloors - 1;
        Registry.floors[top].waitingGuests.push({ id: 'roof-bound', dest: top, status: GuestStatus.HAPPY, isVip: false, isSunset: false, isPartying: false });
        runSpawnerTick(2);
        const guest = Registry.floors[top].waitingGuests.find(item => item.id === 'roof-bound');
        const redirected = guest.isSunset;
        Registry.sunsetEndTime = 3;
        runSpawnerTick(4);
        Config.sunsetGuestRatio = originalRatio;
        return { redirected, partyBlocked: !Game.Engine.canGuestBoardLift({ passengers: [], manualOverride: true }, guest, top, false, 10), destination: guest.dest, party: guest.isPartying };
    });
    expect(result.redirected).toBe(true);
    expect(result.destination).toBe(0);
    expect(result.party).toBe(false);
});

test('golden onboarding seed rewards Sweep over an idle manual lift', async ({ page }) => {
    const result = await page.evaluate(async () => {
        const seeds = await fetch('/tests/golden-seeds.json').then(response => response.json());
        const seed = seeds.onboarding;
        const idle = await Game.Simulator.runRound(seed, { 0: 'manual' }, 1);
        const sweep = await Game.Simulator.runRound(seed, { 0: 'sweep' }, 1);
        return { idle, sweep };
    });

    expect(result.sweep.served).toBeGreaterThan(result.idle.served);
    expect(result.sweep.livesRemaining).toBeGreaterThanOrEqual(result.idle.livesRemaining);
});

test('automation menus follow canonical progression unlocks', async ({ page }) => {
    const optionsAtRound = round => page.evaluate(value => {
        Registry.stats.round = value;
        Registry.highestUnlockedRound = value;
        Config.debugMode = false;
        buildWorld();
        return Game.AutomationController.getCatalog().map(item => item.value);
    }, round);

    expect(await optionsAtRound(1)).toEqual(['manual']);
    expect(await optionsAtRound(2)).toEqual(['manual', 'sweep']);
    expect(await optionsAtRound(3)).toEqual(['manual', 'sweep', 'priority-sweep']);
    expect(await optionsAtRound(4)).toEqual(['manual', 'sweep', 'priority-sweep']);
    expect(await optionsAtRound(5)).toEqual(['manual', 'sweep', 'priority-sweep', 'voting', 'weighted-voting']);
});

test('Automation Dock policy-first assignment is immediate and armed', async ({ page }) => {
    const result = await page.evaluate(() => {
        Config.debugMode = true;
        Registry.stats.round = 5;
        Registry.highestUnlockedRound = 5;
        Registry.lifts = [createLiftState(0), createLiftState(1)];
        buildWorld();
        const statuses = [...document.querySelectorAll('.automation-status')];
        const before = Registry.lifts.map(lift => lift.automation);
        document.querySelector('.automation-carousel-arrow[aria-label="Next automation"]')?.click();
        const previewBeforeCommit = document.querySelector('.automation-carousel-card')?.textContent || '';
        const explicitBeforeCommit = document.querySelector('.automation-dock')?.dataset.armedPolicy || '';
        const hintBeforeCommit = document.querySelectorAll('.automation-status.automation-target-hint').length;
        document.querySelector('.automation-carousel-card')?.click();
        const hintAfterPolicy = document.querySelectorAll('.automation-status.automation-target-hint').length;
        const noApply = !document.querySelector('.automation-dock-actions .btn-green');
        statuses.slice(0, 2).forEach(status => status.click());
        const afterAssignment = Registry.lifts.map(lift => lift.automation);
        const armedAfterAssignment = document.querySelector('.automation-dock')?.dataset.armedPolicy || '';
        document.querySelector('.automation-carousel-card')?.click();
        return {
            dock: Boolean(document.querySelector('[data-automation-controller="dock"]')),
            statusCount: statuses.length,
            before,
            afterAssignment,
            previewBeforeCommit,
            explicitBeforeCommit,
            hintBeforeCommit,
            hintAfterPolicy,
            noApply,
            armedAfterAssignment,
            disarmedAfterToggle: document.querySelector('.automation-dock')?.dataset.armedPolicy || '',
            selectedAfterAssignment: document.querySelectorAll('.automation-status.selected').length,
            assignedTooltip: statuses[0].title,
            retainedPolicy: document.querySelector('.automation-carousel-card')?.textContent || '',
            hasVerboseTitle: Boolean(document.querySelector('.automation-dock-title, .automation-dock-policy')),
            policyStripDisplay: document.querySelector('.automation-dock-pinned') ? getComputedStyle(document.querySelector('.automation-dock-pinned')).display : 'none',
            basementMarker: document.querySelector('.automation-control-row > .label')?.textContent || ''
        };
    });
    expect(result.dock).toBe(true);
    expect(result.statusCount).toBeGreaterThan(1);
    expect(result.afterAssignment.slice(0, 2)).toEqual(['sweep', 'sweep']);
    expect(result.previewBeforeCommit).toContain('Sweep');
    expect(result.explicitBeforeCommit).toBe('');
    expect(result.hintBeforeCommit).toBe(0);
    expect(result.hintAfterPolicy).toBe(result.statusCount);
    expect(result.noApply).toBe(true);
    expect(result.armedAfterAssignment).toBe('sweep');
    expect(result.disarmedAfterToggle).toBe('');
    expect(result.selectedAfterAssignment).toBe(0);
    expect(result.assignedTooltip).toContain('Sweep');
    expect(result.retainedPolicy).toContain('Sweep');
    expect(result.hasVerboseTitle).toBe(false);
    expect(result.policyStripDisplay).toBe('none');
    expect(result.basementMarker).toContain('⚙⇅');
});

test('Automation Dock assigns a lift-first batch when the policy is armed', async ({ page }) => {
    const result = await page.evaluate(() => {
        Config.debugMode = true;
        Registry.stats.round = 5;
        Registry.highestUnlockedRound = 5;
        Registry.lifts = [createLiftState(0), createLiftState(1)];
        buildWorld();
        const statuses = [...document.querySelectorAll('.automation-status')];
        statuses.slice(0, 2).forEach(status => status.click());
        const policyHint = Boolean(document.querySelector('.automation-dock.automation-policy-hint'));
        const disarmedBeforePolicy = document.querySelector('.automation-dock')?.dataset.armedPolicy || '';
        document.querySelector('.automation-carousel-arrow[aria-label="Next automation"]')?.click();
        const targetsStillSelected = document.querySelectorAll('.automation-status.selected').length;
        const stillDisarmed = document.querySelector('.automation-dock')?.dataset.armedPolicy || '';
        document.querySelector('.automation-carousel-card')?.click();
        return { policyHint, disarmedBeforePolicy, targetsStillSelected, stillDisarmed, armedAfterPolicy: document.querySelector('.automation-dock')?.dataset.armedPolicy || '', selectedAfterPolicy: document.querySelectorAll('.automation-status.selected').length, applied: Registry.lifts.map(lift => lift.automation) };
    });
    expect(result.policyHint).toBe(true);
    expect(result.disarmedBeforePolicy).toBe('');
    expect(result.targetsStillSelected).toBe(2);
    expect(result.stillDisarmed).toBe('');
    expect(result.armedAfterPolicy).toBe('sweep');
    expect(result.selectedAfterPolicy).toBe(0);
    expect(result.applied.slice(0, 2)).toEqual(['sweep', 'sweep']);
});

test('Automation carousel browsing previews without arming until the card is clicked', async ({ page }) => {
    const result = await page.evaluate(() => {
        Config.debugMode = true;
        Registry.stats.round = 5;
        Registry.highestUnlockedRound = 5;
        Registry.lifts = [createLiftState(0), createLiftState(1)];
        Registry.automationControllerPreviewPolicy = 'sweep';
        buildWorld();
        const initialFlashing = document.querySelectorAll('.automation-status.automation-target-hint').length;
        const initialArmed = document.querySelector('.automation-dock')?.dataset.armedPolicy || '';
        document.querySelector('.automation-carousel-arrow[aria-label="Next automation"]')?.click();
        const flashAfterBrowse = document.querySelectorAll('.automation-status.automation-target-hint').length;
        const armedAfterBrowse = document.querySelector('.automation-dock')?.dataset.armedPolicy || '';
        document.querySelector('.automation-carousel-card')?.click();
        const flashAfterCommit = document.querySelectorAll('.automation-status.automation-target-hint').length;
        return { initialFlashing, initialArmed, flashAfterBrowse, armedAfterBrowse, flashAfterCommit, armedAfterCommit: document.querySelector('.automation-dock')?.dataset.armedPolicy || '' };
    });
    expect(result.initialFlashing).toBe(0);
    expect(result.initialArmed).toBe('');
    expect(result.flashAfterBrowse).toBe(0);
    expect(result.armedAfterBrowse).toBe('');
    expect(result.flashAfterCommit).toBe(2);
    expect(result.armedAfterCommit).not.toBe('');
});

test('Automation Dock armed hint expires after five seconds without disarming', async ({ page }) => {
    test.setTimeout(30000);
    const result = await page.evaluate(async () => {
        Config.debugMode = true;
        Registry.stats.round = 5;
        Registry.highestUnlockedRound = 5;
        Registry.lifts = [createLiftState(0), createLiftState(1)];
        buildWorld();
        document.querySelector('.automation-carousel-arrow[aria-label="Next automation"]')?.click();
        document.querySelector('.automation-carousel-card')?.click();
        const flashingBefore = document.querySelectorAll('.automation-status.automation-target-hint').length;
        await new Promise(resolve => setTimeout(resolve, 5100));
        return {
            flashingBefore,
            flashingAfter: document.querySelectorAll('.automation-status.automation-target-hint').length,
            policyStillArmed: document.querySelector('.automation-dock')?.dataset.armedPolicy || ''
        };
    });
    expect(result.flashingBefore).toBe(2);
    expect(result.flashingAfter).toBe(0);
    expect(result.policyStillArmed).not.toBe('');
});

test('Automation Dock library selects a policy without assigning it', async ({ page }) => {
    const result = await page.evaluate(() => {
        Config.debugMode = true;
        Registry.stats.round = 5;
        Registry.highestUnlockedRound = 5;
        Registry.lifts = [createLiftState(0), createLiftState(1)];
        buildWorld();
        const before = Registry.lifts.map(lift => lift.automation);
        document.querySelector('.automation-dock-actions .btn-gray')?.click();
        const libraryOpen = Boolean(document.querySelector('.automation-library-overlay'));
        const sweep = [...document.querySelectorAll('.automation-library-select')].find(button => button.textContent.includes('Sweep'));
        sweep?.click();
        return { before, after: Registry.lifts.map(lift => lift.automation), libraryOpen, selected: document.querySelector('.automation-carousel-card')?.textContent || '', armed: document.querySelector('.automation-dock')?.dataset.armedPolicy || '' };
    });
    expect(result.libraryOpen).toBe(true);
    expect(result.after).toEqual(result.before);
    expect(result.selected).toContain('Sweep');
    expect(result.armed).toBe('sweep');
});

test('Automation library arms and assigns a pending lift batch', async ({ page }) => {
    const result = await page.evaluate(() => {
        Config.debugMode = true;
        Registry.stats.round = 5;
        Registry.highestUnlockedRound = 5;
        Registry.lifts = [createLiftState(0), createLiftState(1)];
        buildWorld();
        [...document.querySelectorAll('.automation-status')].slice(0, 2).forEach(status => status.click());
        document.querySelector('.automation-dock-actions .btn-gray')?.click();
        [...document.querySelectorAll('.automation-library-select')].find(button => button.textContent.includes('Sweep'))?.click();
        return {
            automation: Registry.lifts.map(lift => lift.automation),
            selected: document.querySelectorAll('.automation-status.selected').length,
            armed: document.querySelector('.automation-dock')?.dataset.armedPolicy || ''
        };
    });
    expect(result.automation.slice(0, 2)).toEqual(['sweep', 'sweep']);
    expect(result.selected).toBe(0);
    expect(result.armed).toBe('sweep');
});

test('Automation library toggles, groups automations, persists pins, and closes with other modals', async ({ page }) => {
    const result = await page.evaluate(() => {
        Config.debugMode = true;
        Registry.playerName = 'Library Toggle Test';
        Registry.stats.round = 5;
        Registry.highestUnlockedRound = 5;
        Registry.lifts = [createLiftState(0)];
        localStorage.removeItem(Game.AutomationController.getPinStorageKey());
        buildWorld();
        document.querySelector('.automation-dock-actions .btn-gray')?.click();
        const opened = Boolean(document.querySelector('.automation-library-overlay'));
        const groups = [...document.querySelectorAll('.automation-library-group-toggle')].map(button => button.textContent.trim());
        const sweepPin = [...document.querySelectorAll('.automation-library-pin input')].find(input => input.getAttribute('aria-label')?.includes('Sweep'));
        const beforePolicy = Registry.automationControllerSelectedPolicy;
        sweepPin?.click();
        const pinPersisted = Game.AutomationController.getCatalog().find(item => item.value === 'sweep')?.pinned === false;
        const policyAfterPin = Registry.automationControllerSelectedPolicy;
        document.querySelector('.automation-library-toggle')?.click();
        const closedByToggle = !document.querySelector('.automation-library-overlay');
        document.querySelector('.automation-dock-actions .btn-gray')?.click();
        openModalExclusive('debugOverlay');
        const closedByModal = !document.querySelector('.automation-library-overlay');
        const arrowLabels = [...document.querySelectorAll('.automation-carousel-arrow')].map(button => button.textContent);
        const arrowWidths = [...document.querySelectorAll('.automation-carousel-arrow')].map(button => getComputedStyle(button).width);
        document.querySelector('.automation-dock-actions .btn-gray')?.click();
        const reopened = Boolean(document.querySelector('.automation-library-overlay'));
        const closeText = document.querySelector('.automation-library-toggle')?.textContent;
        return { opened, groups, pinPersisted, beforePolicy, policyAfterPin, closedByToggle, closedByModal, arrowLabels, arrowWidths, reopened, closeText };
    });
    expect(result.opened).toBe(true);
    expect(result.groups).toEqual(['Built-in▾', 'Custom▸', 'Shared with Me▸']);
    expect(result.pinPersisted).toBe(true);
    expect(result.beforePolicy).toBe(null);
    expect(result.policyAfterPin).toBe(null);
    expect(result.closedByToggle).toBe(true);
    expect(result.closedByModal).toBe(true);
    expect(result.arrowLabels).toEqual(['‹', '›']);
    expect(result.arrowWidths).toEqual(['36px', '36px']);
    expect(result.reopened).toBe(true);
    expect(result.closeText).toBe('×');
});

test('Debug Warp exposes every configured round', async ({ page }) => {
    const rounds = await page.evaluate(() => {
        Config.debugMode = true;
        updateLocksUI();
        return [...document.querySelectorAll('#jumpRoundSelect option')].map(option => Number(option.value));
    });

    expect(rounds).toEqual(Object.keys(await page.evaluate(() => Config.GAME_DATA.rounds)).map(Number));
});

test('checkout guests heading to Ground use suitcase text only when marked checkout', async ({ page }) => {
    const result = await page.evaluate(() => ({
        checkout: getGuestText({ dest: 0, isCheckout: true, status: GuestStatus.HAPPY }),
        ordinaryGround: getGuestText({ dest: 0, isCheckout: false, status: GuestStatus.HAPPY }),
        checkoutUpper: getGuestText({ dest: 4, isCheckout: true, status: GuestStatus.HAPPY })
    }));

    expect(result).toEqual({ checkout: '💼︎', ordinaryGround: 'G', checkoutUpper: '4' });
});

test('Settings links to the scoreboard without presenting deferred achievements', async ({ page }) => {
    const result = await page.evaluate(() => {
        document.getElementById('settingsBtn').click();
        const settingsOpen = document.getElementById('settingsOverlay').style.display === 'flex';
        const hasAchievements = Boolean(document.getElementById('settingsAchievements'));
        document.getElementById('settingsLeaderboardBtn').click();
        return { settingsOpen, hasAchievements, leaderboardOpen: document.getElementById('leaderboardOverlay').style.display === 'flex', settingsClosed: document.getElementById('settingsOverlay').style.display !== 'flex' };
    });
    expect(result).toEqual({ settingsOpen: true, hasAchievements: false, leaderboardOpen: true, settingsClosed: true });
});

test('Leaderboard opened from Settings closes back to Settings without resuming play', async ({ page }) => {
    const result = await page.evaluate(() => {
        Registry.gameActive = true;
        document.getElementById('settingsBtn').click();
        document.getElementById('settingsLeaderboardBtn').click();
        document.getElementById('closeLbBtn').click();
        return {
            settings: document.getElementById('settingsOverlay').style.display,
            leaderboard: document.getElementById('leaderboardOverlay').style.display,
            gameActive: Registry.gameActive,
            closeLabel: document.getElementById('closeLbBtn').textContent
        };
    });
    expect(result).toEqual({ settings: 'flex', leaderboard: 'none', gameActive: false, closeLabel: 'Close' });
});

test('release candidate uses the approved power-up prices and VIP star icon', async ({ page }) => {
    const result = await page.evaluate(() => ({
        doors: Config.GAME_DATA.powerups.doors.tiers.map(tier => tier.cost),
        musak: Config.GAME_DATA.powerups.musak.tiers.map(tier => tier.cost),
        vipChallengeIcon: getRoundChallengePresentation(8).find(item => item.id === 'vip')?.icon,
        vipIntroIcon: getCampaignIntroductionTerms(8).find(term => term.label === 'VIP')?.icon
    }));
    expect(result).toEqual({ doors: [1, 2, 3], musak: [2, 4, 8], vipChallengeIcon: '⭐', vipIntroIcon: '⭐' });
});

test('Debug seed controls expose transient replay actions', async ({ page }) => {
    const result = await page.evaluate(() => {
        Config.debugMode = true;
        Registry.stats.round = 3;
        Registry.seed = 1234;
        Registry.debugSeedOverride = null;
        Registry.debugSeedOverrideRound = null;
        renderDebugMenu();
        const controls = document.querySelector('.debug-seed-controls');
        controls.querySelector('input').value = '4321';
        controls.querySelector('button:last-child').click();
        if (Registry.roundCountdownTimer) clearInterval(Registry.roundCountdownTimer);
        Registry.roundCountdownTimer = null;
        return {
            present: Boolean(controls),
            input: controls?.querySelector('input')?.value,
            buttons: Array.from(controls?.querySelectorAll('button') || []).map(button => button.innerText)
            , appliedSeed: Registry.seed, campaignSeed: Registry.campaignSeed,
            persistedSeed: JSON.parse(localStorage.getItem(Game.Keys.CAMPAIGN) || '{}').seed
        };
    });
    expect(result.present).toBe(true);
    expect(result.input).toBe('4321');
    expect(result.buttons).toEqual(['Randomise', 'Copy', 'Apply & Restart Round']);
    expect(result.appliedSeed).toBe(4321);
    expect(result.persistedSeed).not.toBe(4321);
});

test('Give Feedback copies local diagnostics and opens only the configured external form', async ({ page }) => {
    const result = await page.evaluate(async () => {
        initializeRound(9, { showBriefing: false });
        buildWorld();
        window.LiftOperatorRelease = {
            ...window.LiftOperatorRelease,
            feedbackFormUrl: 'https://docs.google.com/forms/d/e/test-form/viewform',
            feedbackDiagnosticEntry: 'entry.1033382669'
        };
        let copied = '';
        let opened = '';
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText: async text => { copied = text; } }
        });
        window.open = url => { opened = url; return null; };
        await Game.Feedback.open('settings');
        return {
            copied,
            opened,
            settingsButton: document.getElementById('settingsFeedbackBtn')?.textContent,
            reviewButton: document.getElementById('reviewFeedbackBtn')?.textContent,
            build: document.querySelector('[data-build-version]')?.textContent
        };
    });

    const feedbackUrl = new URL(result.opened);
    expect(feedbackUrl.origin + feedbackUrl.pathname).toBe('https://docs.google.com/forms/d/e/test-form/viewform');
    expect(feedbackUrl.searchParams.get('usp')).toBe('pp_url');
    expect(feedbackUrl.searchParams.get('entry.1033382669')).toBe(result.copied);
    expect(result.copied).toContain('build=Maries-Birthday-2026-11-08.4');
    expect(result.copied).toContain('balance=0.3.2-maries-birthday');
    expect(result.copied).toContain('context=settings');
    expect(result.copied).toContain('round=9');
    expect(result.copied).toContain('seed=');
    expect(result.copied).toContain('viewport=');
    expect(result.settingsButton).toBe('Give Feedback');
    expect(result.reviewButton).toBe('Give Feedback');
    expect(result.build).toContain('Maries-Birthday-2026-11-08.4');
});

test('zoning shares Ground and post-R14 guest traffic weights Ground threefold', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(14, { showBriefing: false });
        const lift = Registry.lifts[0];
        lift.serviceLower = 10;
        lift.serviceUpper = Config.numFloors - 1;
        setSeed(314159);
        const counts = Array(Config.numFloors).fill(0);
        for (let i = 0; i < 5000; i++) counts[getRandomGuestFloor()]++;
        return { groundShared: Registry.isFloorInLiftZone(lift, 0), ground: counts[0], maxUpperFloor: Math.max(...counts.slice(1)), floors: Config.numFloors };
    });
    expect(result.groundShared).toBe(true);
    expect(result.ground).toBeGreaterThan(result.maxUpperFloor * 2);
    expect(result.ground).toBeLessThan(result.maxUpperFloor * 4);
    expect(result.floors).toBe(20);
});

test('Room Service display width is reduced without changing height', async ({ page }) => {
    const result = await page.evaluate(() => {
        const guest = document.createElement('div');
        guest.className = 'guest room-service';
        document.body.appendChild(guest);
        const style = getComputedStyle(guest);
        return { width: style.width, height: style.height };
    });

    expect(result).toEqual({ width: '42px', height: '20px' });
});

test('rocket duration is canonical and lasts ten gameplay seconds', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(7, { showBriefing: false });
        Registry.gameActive = true;
        Game.virtualTime = 100000;
        const lift = Registry.lifts[0];
        const duration = Config.GAME_DATA.powerups.turbo.tiers[0].duration;
        PowerUps.catalog.turbo.tiers[0].execute(0, 0);
        const activated = lift.turboTimer;
        for (let tick = 1; tick < duration; tick++) gameTick(100000 + tick * 1000);
        const beforeExpiry = lift.turboTimer;
        gameTick(100000 + duration * 1000);
        return { duration, activated, beforeExpiry, expired: lift.turboTimer };
    });

    expect(result).toEqual({ duration: 10, activated: 10, beforeExpiry: 1, expired: 0 });
});

test('timed power-ups expire from wall-clock time rather than callback count', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(22, { showBriefing: false });
        Registry.gameActive = true;
        Game.virtualTime = 500000;
        const lift = Registry.lifts[0];
        const timers = [
            ['turboTimer', 10], ['freshenerTimer', 10], ['musakTimer', 10],
            ['tardisTimer', 10], ['doubleDeckerTimer', 10], ['petSnacksTimer', 10]
        ];
        timers.forEach(([key, duration]) => PowerUps.setLiftTimer(lift, key, duration));
        PowerUps.setGlobalTimer('globalTurbo', 10);
        PowerUps.tick(509999);
        const justBefore = timers.map(([key]) => lift[key]);
        PowerUps.tick(510000);
        return { justBefore, expired: timers.map(([key]) => lift[key]), global: PowerUps.timers.globalTurbo };
    });
    expect(result.justBefore).toEqual([1, 1, 1, 1, 1, 1]);
    expect(result.expired).toEqual([0, 0, 0, 0, 0, 0]);
    expect(result.global).toBe(0);
});

test('rooftop event has a long seeded schedule and releases guests to their original rooms', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(9, { showBriefing: false });
        const scheduledStart = Registry.sunsetTargetTime;
        const guest = { dest: 3, status: GuestStatus.HAPPY, isVip: false, isSunset: false, isPartying: false, spawnTime: scheduledStart };
        Registry.floors[1].waitingGuests.push(guest);
        Registry.sunsetTargetTime = 100000;
        const previousRatio = Config.sunsetGuestRatio;
        const previousToast = window.showToast;
        const previousMessage = window.showGameMessage;
        const warnings = [];
        window.showToast = message => warnings.push(message);
        window.showGameMessage = (message) => warnings.push(message);
        Config.sunsetGuestRatio = 1;
        runSpawnerTick(100000);
        const active = { active: Registry.sunsetActive, redirected: guest.dest, original: guest.originalDest };
        runSpawnerTick(185000);
        runSpawnerTick(185000);
        runSpawnerTick(190000);
        Config.sunsetGuestRatio = previousRatio;
        window.showToast = previousToast;
        window.showGameMessage = previousMessage;
        return {
            scheduledStart,
            scheduleSeconds: (scheduledStart - (window.Game.virtualTime || Date.now())) / 1000,
            duration: Config.sunsetDurationSec,
            active,
            released: { active: Registry.sunsetActive, dest: guest.dest, partying: guest.isPartying },
            warnings
        };
    });

    expect(result.duration).toBeGreaterThanOrEqual(90);
    expect(result.active).toEqual({ active: true, redirected: 14, original: 3 });
    expect(result.released).toEqual({ active: false, dest: 3, partying: false });
    expect(result.warnings.filter(message => message === 'Last drinks! Rooftop Party ends in 5 seconds.')).toHaveLength(1);
});

test('R11 briefing explains the Gym Bros stink threshold and immunity', async ({ page }) => {
    const result = await page.evaluate(() => {
        const definition = getRoundDefinition(11);
        return definition.briefing.ruleCard.body;
    });

    expect(result).toContain('three or more Gym Bros make a lift stinky');
    expect(result).toContain('immune to Stink');
});

test('Round 13 playtest tuning reduces spawn pressure by 25% and gravity by 20%', async ({ page }) => {
    const result = await page.evaluate(() => ({
        enduranceMultiplier: Config.GAME_DATA.payouts.endurance.creditMultiplier,
        spawnStart: Config.GAME_DATA.rounds[13].spawnStart,
        spawnEnd: Config.GAME_DATA.rounds[13].spawnEnd,
        gravityScalar: Config.GAME_DATA.rounds[13].gravityScalar
    }));

    expect(result).toEqual({ enduranceMultiplier: 1, spawnStart: 1.08, spawnEnd: 1.26, gravityScalar: 1.12 });
});

test('round countdown freezes play while allowing automation setup and transient capacity cues', async ({ page }) => {
    await page.evaluate(() => {
        skipToRound(2, { showBriefing: false });
        startRoundCountdown(1);
    });

    await expect(page.locator('#roundCountdown')).toBeVisible();
    await expect(page.locator('.capacity-float')).toHaveCount(1);
    const frozen = await page.evaluate(() => ({
        active: Registry.gameActive,
        countdown: Registry.roundCountdownActive,
        timeLeft: Registry.stats.timeLeft,
        guests: Registry.floors.reduce((sum, floor) => sum + floor.waitingGuests.length, 0)
    }));
    expect(frozen).toEqual({ active: false, countdown: true, timeLeft: 180, guests: 0 });
    await page.evaluate(() => {
        if (Registry.roundCountdownActive) document.getElementById('roundCountdownSkip')?.click();
    });
    await expect(page.locator('#roundCountdown')).toBeHidden();
    await expect(page.locator('.capacity-float')).toHaveCount(0);

    await page.evaluate(() => document.querySelector('.automation-carousel-arrow[aria-label="Next automation"]')?.click());
    await page.evaluate(() => document.querySelector('.automation-carousel-card[data-policy="sweep"]')?.click());
    await page.evaluate(() => document.querySelector('.automation-status')?.click());
    expect(await page.evaluate(() => Registry.lifts[0].automation)).toBe('sweep');

    await expect(page.locator('#roundCountdown')).toBeHidden({ timeout: 2500 });
    const started = await page.evaluate(() => ({
        active: Registry.gameActive,
        countdown: Registry.roundCountdownActive,
        timeLeft: Registry.stats.timeLeft,
        guests: Registry.floors.reduce((sum, floor) => sum + floor.waitingGuests.length, 0)
    }));
    expect(started.active).toBe(true);
    expect(started.countdown).toBe(false);
    expect(started.timeLeft).toBeGreaterThanOrEqual(179);
    expect(started.guests).toBeGreaterThan(0);
});

test('countdown start-now control begins the round immediately', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(2, { showBriefing: false });
        startRoundCountdown(10);
        document.getElementById('roundCountdownSkip').click();
        return { countdown: Registry.roundCountdownActive, active: Registry.gameActive, timer: Registry.roundCountdownTimer };
    });
    expect(result.countdown).toBe(false);
    expect(result.active).toBe(true);
    expect(result.timer).toBe(null);
});

test('round-start countdown gives Round 2 five seconds and later fleets bounded setup time', async ({ page }) => {
    const result = await page.evaluate(() => {
        const requested = [];
        const original = window.startRoundCountdown;
        window.startRoundCountdown = seconds => requested.push(seconds);
        initializeRound(2, { showBriefing: false });
        beginSelectedRound();
        initializeRound(3, { showBriefing: false });
        beginSelectedRound();
        initializeRound(19, { showBriefing: false });
        beginSelectedRound();
        initializeRound(25, { showBriefing: false });
        beginSelectedRound();
        window.startRoundCountdown = original;
        return requested;
    });
    expect(result).toEqual([5, 6, 24, 30]);
});

test('Round 2 announces that Sweep is already active during orientation', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(2, { showBriefing: false });
        startRoundCountdown(5);
        return {
            countdownVisible: !document.getElementById('roundCountdown').classList.contains('hidden'),
            message: document.getElementById('game-message-text')?.innerText || '',
            railVisible: !document.getElementById('game-message-rail')?.hidden
        };
    });
    expect(result.countdownVisible).toBe(true);
    expect(result.message).toBe('Sweep is already on; click a floor to intervene.');
    expect(result.railVisible).toBe(true);
    await page.evaluate(() => document.getElementById('roundCountdownSkip').click());
    await expect(page.locator('#game-message-rail')).toBeHidden();
});

test('Round 3 starts in Sweep without a mandatory tutorial while Priority Sweep remains discoverable', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(3, { showBriefing: false });
        startRoundCountdown(5);
        return {
            automation: Registry.lifts.map(lift => lift.automation),
            tutorialActive: Game.Tutorial.isActive(),
            tutorialTargets: document.querySelectorAll('.tutorial-step-target').length,
            message: document.getElementById('game-message-text')?.textContent || '',
            policies: Game.AutomationController.getCatalog().map(item => item.value)
        };
    });
    expect(result.automation).toEqual(['sweep', 'sweep']);
    expect(result.tutorialActive).toBe(false);
    expect(result.tutorialTargets).toBe(0);
    expect(result.message).toBe('');
    expect(result.policies).toContain('priority-sweep');
});

test('Round 2 guidance presents active Sweep and later fleets retain the default', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(2, { showBriefing: false });
        startRoundCountdown(5);
        const r2 = Registry.lifts.map(lift => lift.automation);
        const message = document.getElementById('game-message-text')?.textContent;
        initializeRound(3, { showBriefing: false });
        const r3 = Registry.lifts.map(lift => lift.automation);
        initializeRound(21, { showBriefing: false });
        const r21 = Registry.lifts.map(lift => lift.automation);
        return { r2, message, r3, r21 };
    });
    expect(result.r2).toEqual(['sweep']);
    expect(result.message).toContain('Sweep is already on');
    expect(result.r3).toEqual(['sweep', 'sweep']);
    expect(result.r21).toHaveLength(6);
    expect(result.r21.every(mode => mode === 'sweep')).toBe(true);
});

test('passenger display prioritises urgency without changing service order', async ({ page }) => {
    const result = await page.evaluate(() => {
        const passengers = [
            { id: 'happy-9', dest: 9, status: GuestStatus.HAPPY },
            { id: 'annoyed-8', dest: 8, status: GuestStatus.ANNOYED },
            { id: 'critical-7', dest: 7, status: GuestStatus.CRITICAL },
            { id: 'vip-2', dest: 2, status: GuestStatus.HAPPY, isVip: true },
            { id: 'happy-3', dest: 3, status: GuestStatus.HAPPY }
        ];
        return { displayed: getPassengerDisplayOrder(passengers).map(passenger => passenger.id), original: passengers.map(passenger => passenger.id) };
    });
    expect(result).toEqual({
        displayed: ['vip-2', 'critical-7', 'annoyed-8', 'happy-3', 'happy-9'],
        original: ['happy-9', 'annoyed-8', 'critical-7', 'vip-2', 'happy-3']
    });
});

test('Sweep reversal reconsiders compatible guests at the current floor', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(3, { showBriefing: false });
        const lift = Registry.lifts[0];
        const floor = 2;
        lift.automation = 'sweep';
        lift.pos = floor * Registry.floorHeight;
        lift.targetFloor = floor;
        lift.passengers = [];
        lift.sweepDirection = -1;
        Registry.floors[floor].waitingGuests = [{ id: 'up-after-reversal', dest: 5, status: GuestStatus.HAPPY, isVip: false, isGymBro: false, isPartying: false, boardingWeight: 1 }];
        Game.Automation.execute(lift, 'sys_sweep');
        return { target: lift.targetFloor, direction: lift.sweepDirection };
    });
    expect(result).toEqual({ target: 2, direction: 1 });
});

test('shared high-pressure queues rotate boarding assignments while ordinary queues remain consolidated', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(11, { showBriefing: false });
        const floor = Config.numFloors - 1;
        Registry.lifts.forEach(lift => { lift.pos = floor * Registry.floorHeight; lift.targetFloor = floor; lift.passengers = []; lift.state = 'BOARDING'; });
        Registry.floors[floor].waitingGuests = Array.from({ length: 12 }, (_, id) => ({ id: `queue-${id}`, dest: 0, status: GuestStatus.HAPPY, boardingWeight: 1 }));
        const guest = Registry.floors[floor].waitingGuests[0];
        const first = getSharedFloorBoardingLift(Registry.lifts[0], guest, floor)?.id;
        const second = getSharedFloorBoardingLift(Registry.lifts[1], guest, floor)?.id;
        Registry.floors[floor].waitingGuests = [guest];
        const consolidated = getSharedFloorBoardingLift(Registry.lifts[1], guest, floor)?.id;
        Registry.lifts.forEach((lift, index) => {
            lift.pos = index < 2 ? floor * Registry.floorHeight : 0;
            lift.targetFloor = index < 2 ? floor : 0;
            lift.passengers = [];
            lift.state = index === 0 ? 'BOARDING' : (index === 1 ? 'DOORS_CLOSING' : 'TRANSIT');
        });
        Registry.floors[floor].waitingGuests = Array.from({ length: 12 }, (_, id) => ({ id: `active-${id}`, dest: 0, status: GuestStatus.HAPPY, boardingWeight: 1 }));
        const ignoresInactive = getSharedFloorBoardingLift(Registry.lifts[0], Registry.floors[floor].waitingGuests[0], floor)?.id;
        return { first, second, consolidated, ignoresInactive };
    });
    expect(result.first).toBe(0);
    expect(result.second).toBe(1);
    expect(result.consolidated).toBe(0);
    expect(result.ignoresInactive).toBe(0);
});

test('message rail remains a game-area sibling in the roof lane across messages, rebuilds, and resize', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(21, { showBriefing: false });
        buildWorld();
        const rail = document.getElementById('game-message-rail');
        const world = document.getElementById('world');
        const area = document.getElementById('game-area');
        const messages = ['Automation tip', 'VIP arrival', 'Rooftop Party started', 'Last drinks!'];
        const placements = messages.map(message => {
            showGameMessage(message);
            const railRect = rail.getBoundingClientRect();
            const worldRect = world.getBoundingClientRect();
            const lobbyRect = document.getElementById('lobby-0').getBoundingClientRect();
            return {
                aboveWorld: railRect.bottom <= worldRect.top,
                clearsLobby: railRect.left >= lobbyRect.right,
                parent: rail.parentElement?.id
            };
        });
        buildWorld();
        window.dispatchEvent(new Event('resize'));
        const railRect = rail.getBoundingClientRect();
        const worldRect = world.getBoundingClientRect();
        const label = Number.parseFloat(getComputedStyle(world).getPropertyValue('--label-width')) || 50;
        const lobby = Number.parseFloat(getComputedStyle(world).getPropertyValue('--lobby-width')) || 360;
        return {
            placements,
            remainsAboveAfterRebuild: railRect.bottom <= worldRect.top,
            startsAtShaftBank: railRect.left >= worldRect.left + label + lobby,
            noPersistentShaftHover: !Array.from(document.styleSheets)
                .flatMap(sheet => Array.from(sheet.cssRules || []))
                .some(rule => rule.cssText.includes('.shaft:hover'))
        };
    });
    expect(result.placements).toEqual(Array.from({ length: 4 }, () => ({ aboveWorld: true, clearsLobby: true, parent: 'game-area' })));
    expect(result.remainsAboveAfterRebuild).toBe(true);
    expect(result.startsAtShaftBank).toBe(true);
    expect(result.noPersistentShaftHover).toBe(true);
});

test('abandoned tutorial clears numbered targets after its 30-second opportunity timeout', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(2, { showBriefing: false });
        const originalSetTimeout = window.setTimeout;
        let expiry = null;
        window.setTimeout = (callback, delay) => {
            if (delay === 30000) expiry = callback;
            return 1;
        };
        const started = Game.Tutorial.startAutomationSweep();
        const before = document.querySelectorAll('.tutorial-step-target').length;
        expiry?.();
        const after = document.querySelectorAll('.tutorial-step-target').length;
        const railHidden = document.getElementById('game-message-rail').hidden;
        const persisted = Game.Storage.get(`liftOp_teaching_campaign_${Registry.campaignSeed}_automation_sweep_v1`, '0');
        window.setTimeout = originalSetTimeout;
        return { started, before, after, railHidden, active: Game.Tutorial.isActive(), persisted };
    });
    expect(result.started).toBe(true);
    expect(result.before).toBeGreaterThan(0);
    expect(result).toMatchObject({ after: 0, railHidden: true, active: false, persisted: '0' });
});

test('same-service-cycle alighting blocks an immediate reboard to the same car', async ({ page }) => {
    const result = await page.evaluate(() => {
        const lift = { id: 0, automation: 'manual', manualOverride: false, sweepDirection: 1, passengers: [], serviceCycleId: 4 };
        const guest = { dest: 4, status: GuestStatus.HAPPY, lastAlightedLiftId: 0, lastAlightedFloor: 2, lastAlightedServiceCycle: 4 };
        return Game.Engine.canGuestBoardLift(lift, guest, 2, false, 10);
    });
    expect(result).toBe(false);
});

test('Round 2 teaching rail is a wide roof overlay that does not alter board layout', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(2, { showBriefing: false });
        startRoundCountdown(10);
        const rail = document.getElementById('game-message-rail').getBoundingClientRect();
        const world = document.getElementById('world').getBoundingClientRect();
        const lobby = document.getElementById('lobby-0').getBoundingClientRect();
        return {
            aboveWorld: rail.bottom <= world.top,
            keepsLobbyClear: rail.left >= lobby.right,
            extendsBeyondShaftBoard: rail.right > world.right,
            width: Math.round(rail.width)
        };
    });
    expect(result).toEqual({ aboveWorld: true, keepsLobbyClear: true, extendsBeyondShaftBoard: true, width: 360 });
});

test('critical notices queue in the roof overlay without obscuring the lobby or floors', async ({ page }) => {
    const result = await page.evaluate(() => {
        showGameMessage('VIP arrival', { critical: true, durationMs: 5000 });
        showGameMessage('Rooftop Party started', { critical: true, durationMs: 5000 });
        const rail = document.getElementById('game-message-rail');
        const world = document.getElementById('world');
        const first = document.getElementById('game-message-text').textContent;
        document.getElementById('game-message-dismiss').click();
        return {
            first,
            second: document.getElementById('game-message-text').textContent,
            queued: rail?.dataset.critical === 'true',
            aboveWorld: rail.getBoundingClientRect().bottom <= world.getBoundingClientRect().top,
            keepsLobbyClear: rail.getBoundingClientRect().left >= document.getElementById('lobby-0').getBoundingClientRect().right
        };
    });
    expect(result.first).toBe('VIP arrival');
    expect(result.second).toBe('Rooftop Party started');
    expect(result.queued).toBe(true);
    expect(result.aboveWorld).toBe(true);
    expect(result.keepsLobbyClear).toBe(true);
});

test('Round 2 and every later eligible fleet start in Sweep', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(2, { showBriefing: false });
        const tutorialFleet = Registry.lifts.map(lift => lift.automation);
        initializeRound(3, { showBriefing: false });
        const firstFleet = Registry.lifts.map(lift => lift.automation);
        initializeRound(6, { showBriefing: false });
        const laterFleet = Registry.lifts.map(lift => lift.automation);
        initializeRound(7, { showBriefing: false });
        const largerFleet = Registry.lifts.map(lift => lift.automation);
        return { tutorialFleet, firstFleet, laterFleet, largerFleet };
    });
    expect(result.tutorialFleet).toEqual(['sweep']);
    expect(result.firstFleet.every(mode => mode === 'sweep')).toBe(true);
    expect(result.laterFleet.every(mode => mode === 'sweep')).toBe(true);
    expect(result.largerFleet).toHaveLength(4);
    expect(result.largerFleet.every(mode => mode === 'sweep')).toBe(true);
});

test('late-round fleet layout fits the game area and countdown skip is icon-only', async ({ page }) => {
    const result = await page.evaluate(() => {
        skipToRound(19, { showBriefing: false });
        buildWorld();
        const world = document.getElementById('world');
        const skip = document.getElementById('roundCountdownSkip');
        return {
            worldWidth: world.getBoundingClientRect().width,
            gameAreaWidth: document.getElementById('game-area').clientWidth,
            liftCount: Registry.lifts.length,
            shaftWidth: getComputedStyle(world).getPropertyValue('--shaft-width').trim(),
            skipText: skip.textContent.trim(),
            skipLabel: skip.getAttribute('aria-label')
        };
    });
    expect(result.liftCount).toBe(8);
    expect(result.worldWidth).toBeLessThanOrEqual(result.gameAreaWidth);
    expect(result.shaftWidth).toBe('72px');
    expect(result.skipText).toBe('×');
    expect(result.skipLabel).toBe('Start the round now');
});

test('Round 2 hides the Supply Closet and does not show the empty-cart credit reminder', async ({ page }) => {
    const result = await page.evaluate(() => {
        Registry.points = 10;
        skipToRound(2, { showBriefing: false });
        showRoundModal(2);
        document.getElementById('startRoundBtn').click();
        return {
            shopDisplay: document.getElementById('shopContainer')?.style.display,
            confirmationDisplay: document.getElementById('roundStartConfirmOverlay')?.style.display,
            roundModalDisplay: document.getElementById('roundModalOverlay')?.style.display
        };
    });
    expect(result.shopDisplay).toBe('none');
    expect(result.confirmationDisplay).not.toBe('flex');
    expect(result.roundModalDisplay).toBe('none');
});

test('Workshop pauses and resumes an active countdown without consuming time', async ({ page }) => {
    const result = await page.evaluate(() => {
        skipToRound(2, { showBriefing: false });
        startRoundCountdown(5);
        openWorkshopModal();
        const paused = { active: Registry.roundCountdownActive, paused: Registry.roundCountdownPaused, remaining: Registry.countdownRemaining, timer: Registry.roundCountdownTimer };
        openWorkshopModal();
        const resumed = { active: Registry.roundCountdownActive, paused: Registry.roundCountdownPaused, remaining: Registry.countdownRemaining, timer: Registry.roundCountdownTimer !== null };
        if (Registry.roundCountdownTimer) clearInterval(Registry.roundCountdownTimer);
        Registry.roundCountdownTimer = null;
        return { paused, resumed };
    });
    expect(result.paused).toEqual({ active: true, paused: true, remaining: 5, timer: null });
    expect(result.resumed).toEqual({ active: true, paused: false, remaining: 5, timer: true });
});

test('VIP follows three seeded journeys from Ground to room to random floor and back', async ({ page }) => {
    const result = await page.evaluate(() => {
        skipToRound(8, { showBriefing: false });
        Registry.vipTargetTime = 1;
        Registry.vipSpawned = false;
        Registry.vipStage = 0;
        Registry.vipRoomFloor = -1;
        Registry.vipRandomFloor = -1;
        runSpawnerTick(2);
        const vip = Registry.floors[0].waitingGuests.find(guest => guest.isVip);
        const first = { floor: 0, destination: vip?.dest, stage: Registry.vipStage };
        const room = vip.dest;
        Spawner.queueVipNextJourney(vip, room, 1000);
        const second = { floor: room, destination: vip.dest, stage: Registry.vipStage, randomFloor: Registry.vipRandomFloor };
        const randomFloor = vip.dest;
        Spawner.queueVipNextJourney(vip, randomFloor, 2000);
        const third = { floor: randomFloor, destination: vip.dest, stage: Registry.vipStage };
        return { first, second, third, penalty: Config.vipPenalty };
    });
    expect(result.first.floor).toBe(0);
    expect(result.first.destination).toBeGreaterThan(0);
    expect(result.first.stage).toBe(1);
    expect(result.second.floor).toBe(result.first.destination);
    expect(result.second.destination).toBeGreaterThan(0);
    expect(result.second.destination).not.toBe(result.second.floor);
    expect(result.second.stage).toBe(2);
    expect(result.third.floor).toBe(result.second.destination);
    expect(result.third.destination).toBe(0);
    expect(result.third.stage).toBe(3);
    expect(result.penalty).toBe(10);
});

test('VIP inter-leg travel waits 10-30 seconds and re-enters at the queue front', async ({ page }) => {
    const result = await page.evaluate(() => {
        skipToRound(8, { showBriefing: false });
        Registry.vipTargetTime = 1;
        Registry.vipSpawned = false;
        runSpawnerTick(2);
        const vip = Registry.floors[0].waitingGuests.find(guest => guest.isVip);
        const room = vip.dest;
        Spawner.queueVipNextJourney(vip, room, 1000);
        const pending = { hasGuest: Registry.vipPendingGuest === vip, floor: Registry.vipPendingFloor, delay: (Registry.vipNextJourneyTime - 1000) / 1000, visible: Registry.floors[room].waitingGuests.includes(vip) };
        runSpawnerTick(Registry.vipNextJourneyTime - 1);
        const beforeRelease = Registry.floors[room].waitingGuests.includes(vip);
        runSpawnerTick(Registry.vipNextJourneyTime + 1);
        const afterRelease = { first: Registry.floors[room].waitingGuests[0] === vip, pending: Registry.vipPendingGuest };
        return { pending, beforeRelease, afterRelease };
    });
    expect(result.pending.hasGuest).toBe(true);
    expect(result.pending.delay).toBeGreaterThanOrEqual(10);
    expect(result.pending.delay).toBeLessThanOrEqual(30);
    expect(result.pending.visible).toBe(false);
    expect(result.beforeRelease).toBe(false);
    expect(result.afterRelease).toEqual({ first: true, pending: null });
});

test('VIP arrival announces itself without changing lift targets', async ({ page }) => {
    const result = await page.evaluate(() => {
        skipToRound(17, { showBriefing: false });
        Registry.gameActive = true;
        Registry.vipTargetTime = 1;
        Registry.vipSpawned = false;
        Registry.lifts.forEach((lift, index) => { lift.targetFloor = index + 1; });
        const before = Registry.lifts.map(lift => lift.targetFloor);
        runSpawnerTick(2);
        return { before, after: Registry.lifts.map(lift => lift.targetFloor), vip: Registry.floors[0].waitingGuests.some(guest => guest.isVip), message: document.getElementById('game-message-text')?.textContent || '' };
    });
    expect(result.after).toEqual(result.before);
    expect(result.vip).toBe(true);
    expect(result.message).toContain('VIP arrival');
});

test('duplicate targeted power-up is blocked without manual targeting or consumption', async ({ page }) => {
    const result = await page.evaluate(() => {
        skipToRound(8, { showBriefing: false });
        Registry.gameActive = true;
        Registry.lifts[0].turboTimer = 7;
        PowerUps.inventory = [{ id: 'turbo', tier: 0 }];
        PowerUps.primeAbility('turbo', 0);
        const before = { targeting: !!PowerUps.activeTargeting, inventory: PowerUps.inventory.length, timer: Registry.lifts[0].turboTimer };
        Game.Engine.setLiftTarget(0, 0);
        Registry.lifts[0].wideDoorsTimer = 7;
        PowerUps.inventory = [{ id: 'doors', tier: 0 }];
        PowerUps.primeAbility('doors', 0);
        return { before, after: { targeting: !!PowerUps.activeTargeting, inventory: PowerUps.inventory.length, timer: Registry.lifts[0].turboTimer, manual: Registry.lifts[0].manualOverride }, wideDoors: { timer: Registry.lifts[0].wideDoorsTimer, inventory: PowerUps.inventory.length } };
    });
    expect(result.before).toEqual({ targeting: true, inventory: 1, timer: 7 });
    expect(result.after).toEqual({ targeting: true, inventory: 1, timer: 7, manual: false });
    expect(result.wideDoors).toEqual({ timer: 7, inventory: 1 });
});

test('R8 traffic and late campaign briefing titles use the current authored polish', async ({ page }) => {
    const result = await page.evaluate(() => ({
        r8: { start: Config.GAME_DATA.rounds[8].spawnStart, end: Config.GAME_DATA.rounds[8].spawnEnd },
        r11: Config.GAME_DATA.rounds[11].briefing.title,
        r25: Config.GAME_DATA.rounds[25].briefing.title
    }));
    expect(result).toEqual({ r8: { start: 1.2, end: 1.5 }, r11: 'Do you even lift, bro?', r25: 'A series of tubes' });
});

test('Bronze Wide Doors targets one lift and uses canonical tier wording', async ({ page }) => {
    const result = await page.evaluate(() => {
        skipToRound(3, { showBriefing: false });
        Registry.gameActive = true;
        PowerUps.inventory = [{ id: 'doors', tier: 0 }];
        PowerUps.primeAbility('doors', 0);
        const armed = { target: PowerUps.activeTargeting?.id, liftTimer: Registry.lifts[0].wideDoorsTimer, inventory: PowerUps.inventory.length, tooltip: document.querySelector('#inventory-bar button')?.title || '' };
        PowerUps.resolveTargeting(0, 0);
        return { armed, applied: { timer: Registry.lifts[0].wideDoorsTimer, multiplier: Registry.lifts[0].wideDoorsMultiplier, inventory: PowerUps.inventory.length }, tooltip: document.querySelector('#inventory-bar button')?.title || '' };
    });
    expect(result.armed.target).toBe('doors');
    expect(result.armed.liftTimer).toBe(0);
    expect(result.armed.inventory).toBe(1);
    expect(result.armed.tooltip).toContain('Bronze');
    expect(result.applied.timer).toBe(20);
    expect(result.applied.multiplier).toBe(2);
    expect(result.applied.inventory).toBe(0);
});

test('active effect icons are siblings in a non-interactive overlay at the top floor', async ({ page }) => {
    const result = await page.evaluate(() => {
        skipToRound(20, { showBriefing: false });
        const lift = Registry.lifts[0];
        lift.pos = (Config.numFloors - 1) * Registry.floorHeight;
        lift.turboTimer = 5;
        draw();
        const car = document.getElementById('lift-el-0');
        const overlay = document.getElementById('lift-effects-0');
        return {
            parentIsWorld: overlay?.parentElement?.id === 'world',
            carHasOverlay: !!car?.querySelector('.lift-icons'),
            pointerEvents: overlay?.style.pointerEvents,
            overlayBottom: overlay ? getComputedStyle(overlay).bottom : '',
            carHeight: car?.getBoundingClientRect().height,
            worldHeight: document.getElementById('world')?.getBoundingClientRect().height
        };
    });
    expect(result.parentIsWorld).toBe(true);
    expect(result.carHasOverlay).toBe(false);
    expect(result.pointerEvents).toBe('none');
    expect(result.overlayBottom).toBeTruthy();
    expect(result.carHeight).toBeGreaterThan(0);
    expect(result.worldHeight).toBeGreaterThan(0);
});

test('checkout guests and Gym Bros are mutually exclusive', async ({ page }) => {
    const result = await page.evaluate(() => {
        skipToRound(7, { showBriefing: false });
        Registry.gymFloor = 1;
        forceFirstSpawn(0);
        return Registry.floors.flatMap(floor => floor.waitingGuests).map(guest => ({ isCheckout: !!guest.isCheckout, isGymBro: !!guest.isGymBro }));
    });
    expect(result.length).toBeGreaterThan(0);
    expect(result.some(guest => guest.isCheckout && guest.isGymBro)).toBe(false);
});

test('Room Service is never generated as a Checkout guest', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(7, { showBriefing: false });
        Config.roomServiceChance = 1;
        const samples = [];
        for (let index = 0; index < 12; index++) {
            forceFirstSpawn(index * 1000);
            samples.push(...Registry.floors.flatMap(floor => floor.waitingGuests.splice(0)));
        }
        return samples.map(guest => ({ checkout: guest.isCheckout, roomService: guest.isRoomService }));
    });
    expect(result.length).toBeGreaterThan(0);
    expect(result.some(guest => guest.checkout && guest.roomService)).toBe(false);
});

test('Gym Bros board an otherwise compatible stinky lift', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(11, { showBriefing: false });
        Registry.gameActive = true;
        const floor = 1;
        const lift = Registry.lifts[0];
        lift.pos = floor * Registry.floorHeight;
        lift.targetFloor = floor;
        lift.state = 'BOARDING';
        lift.stateProgress = 1;
        lift.passengers = [];
        lift.stinkTimer = 4;
        Registry.floors[floor].waitingGuests = [{
            id: 'stinky-gym-bro', dest: 4, status: GuestStatus.HAPPY,
            spawnTime: 0, isVip: false, isGymBro: true, isCheckout: false,
            isRoomService: false, boardingWeight: 2
        }];
        Game.Engine.animationTick(1000);
        return { boarded: lift.passengers.map(guest => guest.id), waiting: Registry.floors[floor].waitingGuests.length };
    });
    expect(result).toEqual({ boarded: ['stinky-gym-bro'], waiting: 0 });
});

test('Gym Bros trigger one stink alert when their threshold is reached', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(11, { showBriefing: false });
        Registry.gameActive = true;
        const lift = Registry.lifts[0];
        lift.passengers = [1, 2, 3].map(id => ({ id, isGymBro: true, status: GuestStatus.HAPPY, dest: 4, spawnTime: 0 }));
        const events = [];
        const off = window.Game.Audio.on('hazard_started', payload => events.push(payload));
        gameTick(1000);
        gameTick(2000);
        off();
        return events.filter(event => event.source === 'gym-bros').map(event => event.id);
    });
    expect(result).toEqual(['stink']);
});

test('automation teaching cues extend to custom and shared script discovery', async ({ page }) => {
    const result = await page.evaluate(() => {
        const unlockRound = Config.GAME_DATA.automationUnlocks.custom;
        window.Game.Storage.set('liftOp_teaching_automation_custom', '0');
        window.Game.Storage.set('liftOp_teaching_automation_shared', '0');
        skipToRound(unlockRound, { showBriefing: false });
        const customCue = applyAutomationTeachingCue();
        document.querySelectorAll('.automation-teaching-cue').forEach(item => item.classList.remove('automation-teaching-cue'));
        window.Game.Storage.set('liftOp_teaching_automation_custom', '1');
        Registry.stats.round = Math.min(13, unlockRound + 1);
        const currentPlayer = Registry.playerName || window.Game.Storage.get(window.Game.Keys.PLAYER, 'Pilot 1');
        window.Game.Automation.scripts.push({ id: 'mine-cue-test', name: 'My Test', author: currentPlayer });
        window.Game.Automation.scripts.push({ id: 'shared-cue-test', name: 'Shared Test', author: 'Another Pilot' });
        buildWorld();
        const sharedCue = applyAutomationTeachingCue();
        return {
            customCue,
            sharedCue,
            groups: [...new Set(Game.AutomationController.getCatalog().map(item => item.group))]
        };
    });

    expect(result.customCue).toBe('custom');
    expect(result.sharedCue).toBe('shared');
    expect(result.groups).toContain('My Automations');
    expect(result.groups).toContain('Shared with Me');
});

test('capacity modifiers announce activation and expiry without a permanent HUD label', async ({ page }) => {
    const result = await page.evaluate(() => {
        buildWorld();
        const lift = Registry.lifts[0];
        PowerUps.setLiftTimer(lift, 'tardisTimer', 1);
        PowerUps.announceLiftCapacity(0);
        const activated = document.querySelector('[data-capacity-lift="0"]')?.textContent;
        lift.lastEffectiveCapacity = 999;
        Registry.gameActive = true;
        const now = PowerUps.timerNow();
        gameTick(now + 1000);
        Registry.gameActive = false;
        const expired = document.querySelector('[data-capacity-lift="0"]')?.textContent;
        return {
            activated,
            expired,
            permanentCapacityLabels: document.querySelectorAll('.lift .capacity-float').length
        };
    });

    expect(result).toEqual({
        activated: 'Capacity ∞',
        expired: `Capacity ${await page.evaluate(() => Config.liftCapacity)}`,
        permanentCapacityLabels: 0
    });
});

test('production patience thresholds map wait time to guest status', async ({ page }) => {
    const statuses = await page.evaluate(() => ({
        happy: Game.Engine.getGuestStatusForWait(20000),
        annoyed: Game.Engine.getGuestStatusForWait(20001),
        critical: Game.Engine.getGuestStatusForWait(40001),
        rage: Game.Engine.getGuestStatusForWait(60001)
    }));

    expect(statuses).toEqual({
        happy: 'happy',
        annoyed: 'annoyed',
        critical: 'critical',
        rage: 'rage'
    });
});

test('production boarding duration accounts for guest weight and Wide Doors', async ({ page }) => {
    const durations = await page.evaluate(() => {
        Config.boardingSpeedMultiplier = 1;
        const standard = Game.Engine.getBoardingDurationMs(1, 1);
        const roomService = Game.Engine.getBoardingDurationMs(3, 1);
        Config.boardingSpeedMultiplier = 0.5;
        const wideDoors = Game.Engine.getBoardingDurationMs(1, 1);
        Config.boardingSpeedMultiplier = 1;
        return { standard, roomService, wideDoors };
    });

    expect(durations).toEqual({
        standard: 500,
        roomService: 1500,
        wideDoors: 250
    });
});

test('manual floor selection overrides Sweep direction for every waiting guest', async ({ page }) => {
    const result = await page.evaluate(() => {
        const lift = {
            automation: 'sweep',
            manualOverride: false,
            sweepDirection: 1,
            passengers: [{ dest: 5 }]
        };
        const upwardGuest = { dest: 6 };
        const downwardGuest = { dest: 1 };
        const automatic = {
            upward: Game.Engine.isGuestDirectionCompatible(lift, upwardGuest, 3),
            downward: Game.Engine.isGuestDirectionCompatible(lift, downwardGuest, 3)
        };

        lift.manualOverride = true;
        const manuallySelected = {
            upward: Game.Engine.isGuestDirectionCompatible(lift, upwardGuest, 3),
            downward: Game.Engine.isGuestDirectionCompatible(lift, downwardGuest, 3)
        };
        return { automatic, manuallySelected };
    });

    expect(result).toEqual({
        automatic: { upward: true, downward: false },
        manuallySelected: { upward: true, downward: true }
    });
});

test('R22 manual stop boards a compatible waiting guest before Sweep resumes', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(22, { showBriefing: false });
        Registry.gameActive = true;
        const floor = 5;
        const lift = Registry.lifts[0];
        const otherLift = Registry.lifts[1];
        const now = 1000000;
        setLiftAutomation(lift.id, 'sweep');
        lift.pos = floor * Registry.floorHeight;
        lift.targetFloor = floor;
        lift.state = 'IDLE';
        lift.stateProgress = 0;
        lift.passengers = [];
        otherLift.targetFloor = 9;
        Registry.floors[floor].waitingGuests = [{
            id: 'manual-stop-guest', dest: 10, status: GuestStatus.HAPPY,
            spawnTime: now, boardingWeight: 1, isVip: false, isGymBro: false
        }];

        setLiftTarget(lift.id, floor);
        const otherTargetAfterClick = otherLift.targetFloor;
        for (let tick = 0; tick < 160 && lift.passengers.length === 0; tick++) {
            Game.Engine.animationTick(now + tick * 16);
        }
        return {
            boarded: lift.passengers.map(guest => guest.id),
            waiting: Registry.floors[floor].waitingGuests.map(guest => guest.id),
            manualOverride: lift.manualOverride,
            otherTargetAfterClick
        };
    });

    expect(result.boarded).toEqual(['manual-stop-guest']);
    expect(result.waiting).toEqual([]);
    expect(result.manualOverride).toBe(true);
    expect(result.otherTargetAfterClick).toBe(9);
});

test('deferred achievement storage cannot add campaign Credits', async ({ page }) => {
    const result = await page.evaluate(() => {
        Registry.playerName = 'Legacy Achievement Player';
        localStorage.setItem(Game.Keys.ACHIEVEMENTS + Registry.playerName, JSON.stringify({ service: 'gold' }));
        Registry.points = 0;
        Registry.stats.round = 1;
        Registry.stats.timeLeft = 0;
        Registry.roundStats = createRoundStats();
        Registry.roundStats.servedThisRound = 1;
        Registry.roundStats.happyServed = 1;
        Registry.roundEvaluation = null;
        const expected = PowerUps.calculateRoundPoints();
        const evaluation = evaluateRoundPayout();
        return { expected, awarded: evaluation.pointsEarned, points: Registry.points };
    });

    expect(result).toEqual({ expected: result.awarded, awarded: result.awarded, points: result.awarded });
});

test('runtime power-up catalog uses canonical prices and core effects', async ({ page }) => {
    const result = await page.evaluate(() => {
        buildWorld();
        const lift = Registry.lifts[0];
        lift.effects = [];
        lift.jamTimer = 99;
        PowerUps.catalog.wrench.tiers[0].execute(0, 0);
        lift.stinkTimer = 99;
        PowerUps.catalog.freshener.tiers[0].execute(0, 0);
        PowerUps.catalog.turbo.tiers[0].execute(0, 0);
        PowerUps.catalog.tardis.tiers[0].execute(0, 0);
        PowerUps.catalog.doubleDecker.tiers[0].execute(0, 0);
        draw();

        return {
            pricesMatch: Object.entries(PowerUps.catalog).every(([id, item]) =>
                item.tiers.every((tier, index) => tier.cost === Config.GAME_DATA.powerups[id].tiers[index].cost)
            ),
            selectedPrices: {
                doubleDecker: PowerUps.catalog.doubleDecker.tiers.map(tier => tier.cost),
                petSnacks: PowerUps.catalog.petSnacks.tiers.map(tier => tier.cost),
                tardis: PowerUps.catalog.tardis.tiers.map(tier => tier.cost)
            },
            doubleDeckerIcon: PowerUps.catalog.doubleDecker.icon,
            activeDoubleDeckerIcon: document.getElementById('lift-effects-0')?.textContent,
            doubleDeckerDescriptions: PowerUps.catalog.doubleDecker.tiers.map(tier => tier.desc),
            petSnacksDescriptions: PowerUps.catalog.petSnacks.tiers.map(tier => tier.desc),
            jamTimer: lift.jamTimer,
            stinkTimer: lift.stinkTimer,
            freshenerTimer: lift.freshenerTimer,
            turboTimer: lift.turboTimer,
            tardisCapacity: PowerUps.getLiftCapacity(0),
            doubleCapacityActive: lift.doubleDeckerTimer > 0
        };
    });

    expect(result.pricesMatch).toBe(true);
    expect(result.selectedPrices).toEqual({ doubleDecker: [1, 2, 3], petSnacks: [1, 3, 5], tardis: [2, 3, 5] });
    expect(result.doubleDeckerIcon).toBe('🪜');
    expect(result.activeDoubleDeckerIcon).toContain('🪜');
    expect(result.doubleDeckerDescriptions.every(desc => !/^(Bronze|Silver|Gold):/.test(desc))).toBe(true);
    expect(result.petSnacksDescriptions.every(desc => !/^(Bronze|Silver|Gold):/.test(desc))).toBe(true);
    expect(result.jamTimer).toBe(0);
    expect(result.stinkTimer).toBe(0);
    expect(result.freshenerTimer).toBeGreaterThan(0);
    expect(result.turboTimer).toBeGreaterThan(0);
    expect(result.tardisCapacity).toBe(999);
    expect(result.doubleCapacityActive).toBe(true);
});

test('production boarding enforces capacity, rage, VIP, and stink compatibility', async ({ page }) => {
    const result = await page.evaluate(() => {
        const lift = { automation: 'manual', manualOverride: false, sweepDirection: 1, passengers: [] };
        const canBoard = (guest, stinky = false, capacity = Config.liftCapacity) =>
            Game.Engine.canGuestBoardLift(lift, guest, 2, stinky, capacity);
        const ordinary = { dest: 4, status: GuestStatus.HAPPY };
        const roomService = { dest: 4, status: GuestStatus.HAPPY, type: 'room-service' };
        const gymBro = { dest: 4, status: GuestStatus.HAPPY, isGymBro: true };
        const rage = { dest: 4, status: GuestStatus.RAGE };
        const vip = { dest: 4, status: GuestStatus.HAPPY, isVip: true };

        const empty = {
            ordinary: canBoard(ordinary),
            roomServiceTooHeavy: !canBoard(roomService, false, 2),
            rageRejected: !canBoard(rage),
            ordinaryRejectedByStink: !canBoard(ordinary, true),
            gymBroAcceptsStink: canBoard(gymBro, true),
            vipBoardsAlone: canBoard(vip)
        };
        lift.passengers = [ordinary];
        const vipRejectedWithPassenger = !canBoard(vip);
        lift.passengers = [vip];
        const ordinaryRejectedWithVip = !canBoard(ordinary);
        return { empty, vipRejectedWithPassenger, ordinaryRejectedWithVip };
    });

    expect(result).toEqual({
        empty: {
            ordinary: true,
            roomServiceTooHeavy: true,
            rageRejected: true,
            ordinaryRejectedByStink: true,
            gymBroAcceptsStink: true,
            vipBoardsAlone: true
        },
        vipRejectedWithPassenger: true,
        ordinaryRejectedWithVip: true
    });
});

test('VIP takes boarding priority over an ordinary compatible queue entry', async ({ page }) => {
    const result = await page.evaluate(() => {
        initializeRound(8, { showBriefing: false });
        Registry.gameActive = true;
        const lift = Registry.lifts[0];
        lift.pos = 0;
        lift.targetFloor = 0;
        lift.state = 'BOARDING';
        lift.stateProgress = 1;
        lift.passengers = [];
        Registry.floors[0].waitingGuests = [
            { id: 'ordinary-first', dest: 3, status: GuestStatus.HAPPY, isVip: false, boardingWeight: 1 },
            { id: 'vip-priority', dest: 4, status: GuestStatus.ANNOYED, isVip: true, boardingWeight: 1 }
        ];
        animationTick(100000);
        return { boarded: lift.passengers[0]?.id, remaining: Registry.floors[0].waitingGuests.map(guest => guest.id) };
    });
    expect(result).toEqual({ boarded: 'vip-priority', remaining: ['ordinary-first'] });
});

test('production gravity multiplier slows loaded upward travel with a safety floor', async ({ page }) => {
    const result = await page.evaluate(() => ({
        noGravity: Game.Engine.getGravitySpeedMultiplier(10, 10, 0),
        halfLoad: Game.Engine.getGravitySpeedMultiplier(5, 10, 0.4),
        clamped: Game.Engine.getGravitySpeedMultiplier(20, 10, 2)
    }));

    expect(result).toEqual({
        noGravity: 1,
        halfLoad: 0.8,
        clamped: 0.1
    });
});

test('projected survival index combines observed and imminent weighted life loss', async ({ page }) => {
    const result = await page.evaluate(() => {
        const telemetry = Game.BalanceTelemetry;
        telemetry.reset(40000);
        Registry.stats.round = 2;
        Registry.stats.timeLeft = 100;
        Registry.stats.lives = 10;
        Registry.roundStats = createRoundStats();
        Registry.floors.forEach(floor => { floor.waitingGuests = []; });
        Registry.lifts.forEach(lift => { lift.passengers = []; });
        Registry.floors[0].waitingGuests.push({
            status: GuestStatus.CRITICAL,
            spawnTime: 45000,
            isVip: false
        });
        telemetry.recordLifeLoss(100000, 1, 'guest');
        return telemetry.sample(100000);
    });

    expect(result.observedLossRate).toBeCloseTo(0.04667, 4);
    expect(result.imminentLives).toBe(1);
    expect(result.projectedLossRate).toBeCloseTo(0.11333, 4);
    expect(result.projectedSurvivalIndex).toBeCloseTo(0.88235, 4);
});

test('design telemetry records Little’s Law inputs and weighted VIP exposure', async ({ page }) => {
    const result = await page.evaluate(() => {
        const telemetry = Game.BalanceTelemetry;
        telemetry.reset(100000);
        Registry.stats.round = 8;
        Registry.stats.timeLeft = 120;
        Registry.stats.lives = 20;
        Registry.roundStats = createRoundStats();
        Registry.roundStats.guestsSpawned = 12;
        Registry.roundStats.servedThisRound = 6;
        Registry.roundStats.totalWaitTimeServed = 180;
        Registry.roundStats.journeyTimes = [10, 20, 30, 30, 40, 50];
        Registry.roundStats.manualClicks = 3;
        Registry.floors.forEach(floor => { floor.waitingGuests = []; });
        Registry.lifts.forEach(lift => { lift.passengers = []; });
        Registry.floors[0].waitingGuests.push({
            status: GuestStatus.CRITICAL,
            spawnTime: 105000,
            isVip: true
        });
        const sample = telemetry.sample(160000);
        return { sample, exported: telemetry.export(), version: Config.balanceVersion };
    });

    expect(result.sample.arrivalRate).toBeCloseTo(0.2, 6);
    expect(result.sample.deliveryRate).toBeCloseTo(0.1, 6);
    expect(result.sample.averageJourneyTime).toBe(30);
    expect(result.sample.medianJourneyTime).toBe(30);
    expect(result.sample.p90JourneyTime).toBe(50);
    expect(result.sample.maximumJourneyTime).toBe(50);
    expect(result.sample.littlesLawEstimate).toBe(6);
    expect(result.sample.imminentLives).toBe(10);
    expect(result.sample.manualDecisionsPerMinute).toBe(3);
    expect(result.exported.balanceVersion).toBe(result.version);
    expect(result.exported.samples).toHaveLength(1);
});

test('design telemetry is absent from player UI and automation sensors', async ({ page }) => {
    const result = await page.evaluate(() => {
        const bridge = Game.Automation.getBuildingBridge(Registry.lifts[0]);
        return {
            visibleText: document.body.innerText,
            bridgeKeys: Object.keys(bridge)
        };
    });

    expect(result.visibleText).not.toContain('Survival Index');
    expect(result.visibleText).not.toContain('Projected Survival');
    expect(result.bridgeKeys).not.toContain('getSurvivalIndex');
    expect(result.bridgeKeys).not.toContain('getBalanceTelemetry');
});

test('disengaging Monkey restores a 180-second standard timer', async ({ page }) => {
    const result = await page.evaluate(() => {
        Registry.stats.round = 4;
        Registry.autoPilotActive = true;
        Config.autoPilot = true;
        Config.roundTime = 30;
        Registry.stats.timeLeft = 12;
        disengageAutoPilot(false);
        return {
            active: Registry.autoPilotActive,
            configuredDuration: Config.roundTime,
            timeLeft: Registry.stats.timeLeft
        };
    });

    expect(result).toEqual({
        active: false,
        configuredDuration: 180,
        timeLeft: 180
    });
});
