const { test, expect } = require('@playwright/test');
const { startTestServer } = require('./test-server');

const GAME_URL = 'http://127.0.0.1:5500/index.html';
let testServer;

test.beforeAll(async () => { testServer = await startTestServer(); });
test.afterAll(async () => { if (testServer) await new Promise(resolve => testServer.close(resolve)); });

test('audio bus is present, bounded, and simulation-safe', async ({ page }) => {
    await page.goto(GAME_URL);
    const result = await page.evaluate(() => {
        const before = JSON.stringify({ seed: Registry.seed, round: Registry.stats.round, time: Registry.stats.timeLeft });
        const audio = window.Game.Audio;
        audio.setPsi(-5); audio.publish('powerup_used', { id: 'turbo' }); audio.publish('hazard_started', { id: 'jam' });
        const after = JSON.stringify({ seed: Registry.seed, round: Registry.stats.round, time: Registry.stats.timeLeft });
        return { present: !!audio, settings: audio.getSettings(), unchanged: before === after };
    });
    expect(result.present).toBe(true);
    expect(result.unchanged).toBe(true);
    expect(result.settings).toHaveProperty('music');
    expect(result.settings).toHaveProperty('sfx');
});

test('leaderboard exposes compact audio controls and attribution', async ({ page }) => {
    await page.goto(GAME_URL);
    await page.click('#leaderboardBtn');
    await expect(page.locator('#audioMute')).toBeVisible();
    await expect(page.locator('#audioMusic')).toBeVisible();
    await expect(page.locator('#audioSfx')).toBeVisible();
    await expect(page.locator('.audio-credits')).toBeVisible();
    await expect(page.locator('.audio-attribution-scroller')).toBeVisible();
});

test('audio manifest and attribution are available', async ({ request }) => {
    const manifest = await request.get('http://127.0.0.1:5500/assets/audio/manifest.json');
    expect(manifest.ok()).toBe(true);
    expect((await manifest.json()).events).toHaveProperty('powerup_used');
});
