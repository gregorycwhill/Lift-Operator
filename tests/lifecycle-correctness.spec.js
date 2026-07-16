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

test('round evaluation commits payout only once', async ({ page }) => {
    const result = await page.evaluate(() => {
        Registry.playerName = 'Evaluation Test';
        Registry.points = 10;
        Registry.stats.round = 1;
        Registry.stats.timeLeft = 20;
        Registry.roundStats = createRoundStats();
        Registry.roundStats.servedThisRound = 2;
        Registry.roundStats.happyServed = 2;
        Registry.roundStats.totalWaitTimeServed = 12;
        Registry.roundEvaluation = null;

        const first = Achievements.evaluateRound();
        const afterFirst = Registry.points;
        const second = Achievements.evaluateRound();

        return {
            afterFirst,
            afterSecond: Registry.points,
            sameEvaluation: first === second
        };
    });

    expect(result.afterSecond).toBe(result.afterFirst);
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
        return Achievements.evaluateRound().averageWaitTime;
    });

    expect(averageWait).toBe('15.0');
});

test('retry resets attempt-scoped achievement telemetry', async ({ page }) => {
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
            destinationsInDomOrder: guests.map(guest => guest.textContent),
            firstLeft: guests[0].getBoundingClientRect().left,
            lastLeft: guests[guests.length - 1].getBoundingClientRect().left
        };
    });

    expect(result.flexDirection).toBe('row-reverse');
    expect(result.firstLeft).toBeGreaterThan(result.lastLeft);
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

    await page.click('#continueToBriefingBtn');
    await expect(page.locator('#roundModalOverlay')).toBeVisible();
    expect(await page.evaluate(() => Registry.stats.round)).toBe(2);
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
                sunsetEndTime: Registry.sunsetEndTime
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
        sunsetEndTime: 135000
    });
});

test('all supported rounds have explicit factory configuration', async ({ page }) => {
    const definitions = await page.evaluate(() => {
        return Array.from({ length: 13 }, (_, index) => getRoundDefinition(index + 1));
    });

    expect(definitions).toHaveLength(13);
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
        const summarize = () => ({
            round: Registry.stats.round,
            seed: Registry.seed,
            floors: Registry.floors.length,
            lifts: Registry.lifts.map(lift => Object.keys(lift).sort()),
            lives: Registry.stats.lives,
            timeLeft: Registry.stats.timeLeft,
            spawnChance: Registry.stats.currentSpawnChance,
            vipTargetTime: Registry.vipTargetTime,
            sunsetTargetTime: Registry.sunsetTargetTime,
            gymFloor: Registry.gymFloor
        });

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
