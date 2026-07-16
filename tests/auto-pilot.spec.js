const { test, expect } = require('@playwright/test');
const { startTestServer } = require('./test-server');

const GAME_URL = 'http://127.0.0.1:5500/index.html';
let testServer;

test.beforeAll(async () => {
    testServer = await startTestServer();
});

test.afterAll(async () => {
    if (testServer) {
        await new Promise(resolve => testServer.close(resolve));
    }
});

async function launchUnit01(page, extraQuery = '') {
    await page.goto(GAME_URL);
    const manifest = await page.evaluate(() => window.encodePayload({
        auth: window.SHARE_SECRET,
        overrides: {},
        monkey: {
            agentSeed: 9999,
            roundDurationSeconds: 30,
            enduranceLifeLossIntervalSec: 1
        }
    }));
    await page.goto(`${GAME_URL}?manifest=${manifest}${extraQuery}`);
    for (let item = 0; item < 3; item++) {
        await expect(page.locator('#manifestOverlay')).toBeVisible({ timeout: 10000 });
        await page.click('#manifestAcceptBtn');
        if (await page.evaluate(() => window.Config.debugMode)) break;
    }
    await expect.poll(() => page.evaluate(() => window.Config.debugMode)).toBe(true);
    await expect(page.locator('#openDebugBtn')).toBeVisible();
    await page.click('#openDebugBtn');
    await page.getByRole('button', { name: /Launch UNIT_01/i }).click();
    await expect.poll(() => page.evaluate(() => window.Registry.autoPilotActive)).toBe(true);
}

/**
 * UNIT_01: Autonomous Regression Pilot
 * This spec drives the Lift Operator engine using the auto-pilot hook.
 * It validates UI-Logic transitions, modal handling, and crash recovery.
 */
test.describe('UNIT_01 Auto-Pilot Regression', () => {
    
    test('Protocol Alpha: Full 13-Round Workflow', async ({ page }) => {
        test.setTimeout(600000);
        // 1. Launch through the manifest-gated Debug workflow.
        await launchUnit01(page, '&GameID=7777');

        // UNIT_01 owns modal navigation. Verify the complete campaign,
        // including accelerated Endurance death and the Round 13 finish.
        await expect(page.locator('#leaderboardOverlay')).toBeVisible({ timeout: 540000 });
        await expect(page.locator('#lbTitle')).toHaveText('You Won!');

        const state = await page.evaluate(() => ({
            active: window.Registry.autoPilotActive,
            round: window.Registry.stats.round,
            terminalHandled: window.Registry.roundTerminalHandled
        }));
        expect(state.active).toBe(true);
        expect(state.round).toBe(13);
        console.log('Protocol Alpha Success.');
    });

    test('Protocol Beta: Kill Switch Verification', async ({ page }) => {
        await launchUnit01(page);
        await expect.poll(() => page.evaluate(() => window.Registry.gameActive)).toBe(true);
        
        // Verify autopilot is active
        const isActive = await page.evaluate(() => window.Registry.autoPilotActive);
        expect(isActive).toBe(true);
        
        // Simulate human click
        console.log('Simulating human intervention...');
        await page.mouse.click(100, 100);
        
        // Verify autopilot halted
        const isHalted = await page.evaluate(() => window.Registry.manualIntervention);
        expect(isHalted).toBe(true);
        
        const autoActiveNow = await page.evaluate(() => window.Registry.autoPilotActive);
        expect(autoActiveNow).toBe(false);
        expect(await page.evaluate(() => window.Config.roundTime)).toBe(180);
        expect(await page.evaluate(() => window.Registry.stats.timeLeft)).toBe(180);
        console.log('Kill switch verified.');
    });

    test('Protocol Gamma: Death & Rebirth Cycle', async ({ page }) => {
        await launchUnit01(page);
        await expect.poll(() => page.evaluate(() => window.Registry.gameActive)).toBe(true);

        // Artificially kill player
        await page.evaluate(() => {
            window.Registry.autoPilotActive = false;
            window.Registry.stats.lives = 0;
            window.Registry.gameActive = true; 
        });

        // Ordinary death rolls back and returns to the same round's shop.
        await expect(page.locator('#roundModalOverlay')).toBeVisible({ timeout: 5000 });
        const rollback = await page.evaluate(() => ({
            inventory: PowerUps.inventory.length,
            cart: PowerUps.cart.length,
            round: window.Registry.stats.round,
            points: window.Registry.points,
            checkpointPoints: window.Registry.roundCheckpoint.points
        }));
        expect(rollback.inventory).toBe(0);
        expect(rollback.cart).toBe(0);
        expect(rollback.points).toBe(rollback.checkpointPoints);
    });
});
