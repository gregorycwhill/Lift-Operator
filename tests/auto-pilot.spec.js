const { test, expect } = require('@playwright/test');

/**
 * UNIT_01: Autonomous Regression Pilot
 * This spec drives the Lift Operator engine using the auto-pilot hook.
 * It validates UI-Logic transitions, modal handling, and crash recovery.
 */
test.describe('UNIT_01 Auto-Pilot Regression', () => {
    
    test('Protocol Alpha: Full Loop 3-Round Speedrun', async ({ page }) => {
        // 1. Launch with Auto-Pilot URI Protocol
        // We use a fixed seed for the simulation to ensure traffic is identical.
        await page.goto('http://localhost:5500/index.html?autopilot=true&GameID=7777');
        
        // 2. Wait for Manifest Gateway (if any) or Welcome Screen
        const manifestOverlay = page.locator('#manifestOverlay');
        if (await manifestOverlay.isVisible()) {
            console.log('Accepting Manifest payload...');
            await page.click('#manifestAcceptBtn');
        }

        // 3. Round 1 Briefing
        await expect(page.locator('#roundModalOverlay')).toBeVisible({ timeout: 10000 });
        console.log('Starting Round 1...');
        await page.click('#startRoundBtn');
        
        // 4. Autonomous Gameplay Loop
        // We run for enough time to complete multiple 30s rounds.
        // Round 1 (30s) -> Review -> Briefing -> Round 2 (30s) -> Review -> Briefing -> Round 3 (30s)
        
        for (let r = 1; r <= 3; r++) {
            console.log(`Watching Round ${r} progression...`);
            
            // Wait for the round to finish (30s duration + buffer)
            await expect(page.locator('#roundReviewOverlay')).toBeVisible({ timeout: 45000 });
            
            const served = await page.innerText('#reviewServedText');
            console.log(`[UNIT_01] Round ${r} Complete. Served: ${served}`);
            
            // Navigate to Review -> Briefing
            await page.click('#continueToBriefingBtn');
            
            // Shop Phase / Briefing Phase
            await expect(page.locator('#roundModalOverlay')).toBeVisible();
            
            // Random Shopping Logic (Greedy)
            const shopButtons = page.locator('#shopContainer .btn-purchase:not([disabled])');
            const count = await shopButtons.count();
            if (count > 0) {
                console.log(`Buying ${count} power-ups...`);
                for (let i = 0; i < count; i++) {
                    await shopButtons.nth(0).click().catch(() => {});
                }
            }

            console.log(`Starting Round ${r + 1}...`);
            await page.click('#startRoundBtn');
        }

        // 5. Final Heartbeat Check
        const lives = await page.evaluate(() => window.Registry.stats.lives);
        expect(lives).toBeGreaterThan(0);
        console.log('Protocol Alpha Success.');
    });

    test('Protocol Beta: Kill Switch Verification', async ({ page }) => {
        await page.goto('http://localhost:5500/index.html?autopilot=true');
        await page.click('#startRoundBtn');
        
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
        console.log('Kill switch verified.');
    });

    test('Protocol Gamma: Death & Rebirth Cycle', async ({ page }) => {
        await page.goto('http://localhost:5500/index.html?autopilot=true&manifest=JTNFbiUyNCUyMzUlM0NtaCU3RCUwNSUxRCUwRCUxMCUwRCUwMCUxRCUxMGZvJTAwJTA2d3pnemMlM0I5Ny01JTI2JTNCJyFwaCUyNE9N');
        
        // Accept Debug mode
        await page.click('#manifestAcceptBtn');
        await page.click('#startRoundBtn');

        // Artificially kill player
        await page.evaluate(() => {
            window.Registry.stats.lives = 0;
            window.Registry.gameActive = true; 
        });

        // Wait for Game Over / Review
        await expect(page.locator('#roundReviewOverlay')).toBeVisible();
        console.log('Death detected. Attempting rebirth...');
        
        // Restart (The agent should handle the restart click if we bind it, or we do it here)
        // In our plan, we verify the Restart button works.
        const restartBtn = page.locator('#restartBtn');
        if (await restartBtn.isVisible()) {
            await restartBtn.click();
            await expect(page.locator('#roundModalOverlay')).toBeVisible();
            console.log('Cycle complete.');
        }
    });
});
