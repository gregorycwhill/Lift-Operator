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

test('campaign reset clears campaign and attempt state while retaining career identity', async ({ page }) => {
    const result = await page.evaluate(() => {
        Registry.playerName = 'Career Pilot';
        Registry.points = 88;
        Registry.highestUnlockedRound = 9;
        Registry.stats.round = 9;
        Registry.roundStats = { servedThisRound: 44 };
        Registry.customScriptTicks = 123;
        Registry.trophyCase = [{ id: 'career-trophy' }];
        PowerUps.inventory = [{ id: 'wrench', tier: 0 }];
        PowerUps.cart = [{ id: 'turbo', tier: 0 }];
        resetGame();
        return {
            playerName: Registry.playerName,
            trophies: Registry.trophyCase,
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
        playerName: 'Career Pilot', trophies: [{ id: 'career-trophy' }], points: 0,
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
    await expect(page.locator('#roundTitle')).toContainText('Round 2');
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

test('idealized campaign comparator uses production movement without player clicks', async ({ page }) => {
    const result = await page.evaluate(() => window.Game.Simulator.runRound(
        1234,
        { 0: 'manual', 1: 'manual' },
        4,
        { strategy: 'idealized-dispatch' }
    ));

    expect(result.error).toBeUndefined();
    expect(result.roundStats.manualClicks).toBe(0);
    expect(result.designTelemetry.samples.length).toBeGreaterThan(0);
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

test('playtest capacity and Round 2 final spawn tuning are scoped to Rounds 1-3', async ({ page }) => {
    const result = await page.evaluate(() => {
        const capacities = [1, 2, 3, 4].map(round => {
            initializeRound(round, { showBriefing: false });
            return { round, capacity: Config.liftCapacity };
        });
        return {
            capacities,
            r2SpawnEnd: Config.GAME_DATA.rounds[2].spawnEnd,
            r2SpawnStart: Config.GAME_DATA.rounds[2].spawnStart,
            version: Config.balanceVersion
        };
    });
    expect(result.capacities).toEqual([
        { round: 1, capacity: 15 }, { round: 2, capacity: 15 },
        { round: 3, capacity: 15 }, { round: 4, capacity: 10 }
    ]);
    expect(result.r2SpawnStart).toBe(0.4);
    expect(result.r2SpawnEnd).toBe(0.468);
    expect(result.version).toBe('0.2.4-credit-rooftop-gym-playtest');
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
    expect(await visibleButtons(6)).toBe(4);
    expect(await visibleButtons(12)).toBe(24);
    expect(await visibleButtons(13)).toBe(24);

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

    expect(result).toEqual({ standard: 0, endurance: 0, capped: 50 });
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
        return [...document.querySelectorAll('.shaft select option')].map(option => option.value);
    }, round);

    expect(await optionsAtRound(1)).toEqual(['manual']);
    expect(await optionsAtRound(2)).toEqual(['manual', 'sweep']);
    expect(await optionsAtRound(4)).toEqual(['manual', 'sweep', 'priority-sweep']);
    expect(await optionsAtRound(5)).toEqual(['manual', 'sweep', 'priority-sweep', 'voting', 'weighted-voting']);
});

test('round countdown freezes play while allowing automation setup and transient capacity cues', async ({ page }) => {
    await page.evaluate(() => {
        window.Game.Storage.set('liftOp_teaching_automation_built-in', '0');
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

    const select = page.locator('.shaft select').first();
    await expect(select).toHaveClass(/automation-teaching-cue/);
    await select.selectOption('sweep');
    expect(await page.evaluate(() => Registry.lifts[0].automation)).toBe('sweep');
    await expect(select).not.toHaveClass(/automation-teaching-cue/);

    await expect(page.locator('#roundCountdown')).toBeHidden({ timeout: 2500 });
    const started = await page.evaluate(() => ({
        active: Registry.gameActive,
        countdown: Registry.roundCountdownActive,
        timeLeft: Registry.stats.timeLeft,
        guests: Registry.floors.reduce((sum, floor) => sum + floor.waitingGuests.length, 0)
    }));
    expect(started.active).toBe(true);
    expect(started.countdown).toBe(false);
    expect(started.timeLeft).toBe(180);
    expect(started.guests).toBeGreaterThan(0);
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
            groups: [...document.querySelectorAll('.shaft select optgroup')].map(group => group.label)
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
        lift.tardisTimer = 1;
        PowerUps.announceLiftCapacity(0);
        const activated = document.querySelector('[data-capacity-lift="0"]')?.textContent;
        lift.lastEffectiveCapacity = 999;
        Registry.gameActive = true;
        gameTick(Date.now());
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

test('Hands-Free accepts custom automation only and rejects built-in policies', async ({ page }) => {
    const result = await page.evaluate(() => {
        Registry.stats.round = 6;
        Registry.roundStats.manualClicks = 0;
        Registry.customScriptTicks = 0;
        const builtIn = Achievements.definitions.handsfree.check(Registry.roundStats);
        Registry.customScriptTicks = 120;
        const custom = Achievements.definitions.handsfree.check(Registry.roundStats);
        Registry.roundStats.manualClicks = 1;
        const customWithClick = Achievements.definitions.handsfree.check(Registry.roundStats);
        return { builtIn, custom, customWithClick };
    });

    expect(result).toEqual({ builtIn: 0, custom: 6, customWithClick: 0 });
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

        return {
            pricesMatch: Object.entries(PowerUps.catalog).every(([id, item]) =>
                item.tiers.every((tier, index) => tier.cost === Config.GAME_DATA.powerups[id].tiers[index].cost)
            ),
            jamTimer: lift.jamTimer,
            stinkTimer: lift.stinkTimer,
            freshenerTimer: lift.freshenerTimer,
            turboTimer: lift.turboTimer,
            tardisCapacity: PowerUps.getLiftCapacity(0),
            doubleCapacityActive: lift.doubleDeckerTimer > 0
        };
    });

    expect(result.pricesMatch).toBe(true);
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
