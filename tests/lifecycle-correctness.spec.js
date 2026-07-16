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
        return {
            customScriptTicks: Registry.customScriptTicks,
            roundEvaluation: Registry.roundEvaluation
        };
    });

    expect(result.customScriptTicks).toBe(0);
    expect(result.roundEvaluation).toBeNull();
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
