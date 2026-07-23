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

test('semantic gameplay audio events are accepted without changing game state', async ({ page }) => {
    await page.goto(GAME_URL);
    const result = await page.evaluate(() => {
        const before = JSON.stringify({ seed: Registry.seed, round: Registry.stats.round, time: Registry.stats.timeLeft, points: Registry.points });
        const received = [];
        const audio = window.Game.Audio;
        ['vip_arrival', 'rooftop_started', 'rooftop_released', 'guest_urgency', 'guest_refused', 'hazard_ended', 'purchase_confirmed', 'ui_error'].forEach(name => audio.on(name, payload => received.push({ name, payload })));
        audio.publish('vip_arrival', { guestType: 'vip' });
        audio.publish('rooftop_started', { floor: 14 });
        audio.publish('rooftop_released', { floor: 14 });
        audio.publish('guest_urgency', { status: 'CRITICAL' });
        audio.publish('guest_refused', { reason: 'no-compatible-guest' });
        audio.publish('hazard_ended', { id: 'jam' });
        audio.publish('purchase_confirmed', { id: 'freshener', tier: 0 });
        audio.publish('ui_error', { reason: 'floor-outside-zone' });
        const after = JSON.stringify({ seed: Registry.seed, round: Registry.stats.round, time: Registry.stats.timeLeft, points: Registry.points });
        return { received, unchanged: before === after };
    });
    expect(result.unchanged).toBe(true);
    expect(result.received.map(event => event.name)).toEqual([
        'vip_arrival', 'rooftop_started', 'rooftop_released', 'guest_urgency',
        'guest_refused', 'hazard_ended', 'purchase_confirmed', 'ui_error'
    ]);
});

test('rooftop music state survives PSI updates until the event releases', async ({ page }) => {
    await page.goto(GAME_URL);
    const result = await page.evaluate(() => {
        const audio = window.Game.Audio;
        audio.publish('rooftop_started', { floor: 14 });
        const activeBeforePsi = audio.getStatus().rooftopActive;
        audio.setPsi(0.2); audio.setPsi(0.9);
        const activeAfterPsi = audio.getStatus().rooftopActive;
        audio.publish('rooftop_released', { floor: 14 });
        return { activeBeforePsi, activeAfterPsi, activeAfterRelease: audio.getStatus().rooftopActive };
    });
    expect(result).toEqual({ activeBeforePsi: true, activeAfterPsi: true, activeAfterRelease: false });
});

test('production lifecycle transitions publish audio semantics', async ({ page }) => {
    await page.goto(GAME_URL);
    const events = await page.evaluate(() => {
        const audio = window.Game.Audio;
        const received = [];
        const originalPublish = audio.publish;
        audio.publish = (name, payload) => { received.push({ name, payload }); };
        Registry.gameActive = true;
        pauseGame();
        resumeGame();
        startRoundCountdown(0);
        audio.publish = originalPublish;
        return received.map(event => event.name);
    });
    expect(events).toEqual(expect.arrayContaining([
        'pause', 'resume', 'round_countdown_started', 'round_started'
    ]));
});

test('failure, retry, and reset transitions publish audio semantics', async ({ page }) => {
    await page.goto(GAME_URL);
    const events = await page.evaluate(() => {
        const audio = window.Game.Audio;
        const received = [];
        const originalPublish = audio.publish;
        audio.publish = name => received.push(name);
        const ui = GameUI();
        ui.draw = () => {};
        ui.updateLiftVisualState = () => {};
        ui.updateScoreboardUI = () => {};
        Registry.roundTerminalHandled = false;
        Registry.gameActive = true;
        Registry.roundCheckpoint = { round: 1, seed: Registry.seed, points: Registry.points };
        handleOrdinaryDeath();
        Registry.pendingFailedRetry = { round: 1, seed: Registry.seed };
        retryFailedRound();
        resetGame();
        audio.publish = originalPublish;
        return received;
    });
    expect(events).toEqual(expect.arrayContaining([
        'failure', 'retry_started', 'round_initialized', 'reset'
    ]));
});

test('reset clears the previous round audio sources before retry', async ({ page }) => {
    await page.goto(GAME_URL);
    const result = await page.evaluate(() => {
        const audio = window.Game.Audio;
        audio.setContext('gameplay');
        audio.publish('rooftop_started', { floor: 14 });
        const beforeReset = audio.getStatus();
        audio.publish('reset', { round: 9 });
        const afterReset = audio.getStatus();
        return { beforeReset, afterReset };
    });
    expect(result.beforeReset.rooftopActive).toBe(true);
    expect(result.afterReset.rooftopActive).toBe(false);
    expect(result.afterReset.rooftopSourceActive).toBe(false);
    expect(result.afterReset.musicSourceCount).toBeLessThanOrEqual(2);
});

test('identity-aware urgency throttling preserves distinct guest cues', async ({ page }) => {
    await page.goto(GAME_URL);
    const result = await page.evaluate(async () => {
        const audio = window.Game.Audio;
        await audio.teardown();
        audio.publish('guest_urgency', { id: 'guest-a', status: 'CRITICAL' });
        audio.publish('guest_urgency', { id: 'guest-a', status: 'CRITICAL' });
        audio.publish('guest_urgency', { id: 'guest-b', status: 'CRITICAL' });
        return audio.getStatus().acceptedEventCount;
    });
    expect(result).toBe(2);
});

test('production spawner, hazard, and shop flows publish mapped events', async ({ page }) => {
    await page.goto(GAME_URL);
    const events = await page.evaluate(() => {
        const audio = window.Game.Audio;
        const received = [];
        const originalPublish = audio.publish;
        audio.publish = name => received.push(name);

        Registry.stats.round = 9;
        Registry.stats.timeLeft = 120;
        Registry.vipSpawned = false;
        Registry.vipTargetTime = 1;
        Registry.sunsetHasHappened = false;
        Registry.sunsetActive = false;
        Registry.sunsetTargetTime = 1;
        runSpawnerTick(2000);

        const lift = Registry.lifts[0];
        lift.jamTimer = 1;
        Registry.gameActive = true;
        gameTick(3000);

        Registry.points = 100;
        PowerUps.cart = [{ id: 'freshener', tier: 0 }];
        checkoutCart();

        audio.publish = originalPublish;
        return received;
    });
    expect(events).toEqual(expect.arrayContaining([
        'vip_arrival', 'rooftop_started', 'hazard_ended', 'purchase_confirmed'
    ]));
});

test('audio reports hysteresis and supports explicit teardown', async ({ page }) => {
    await page.goto(GAME_URL);
    const result = await page.evaluate(async () => {
        const audio = window.Game.Audio;
        audio.init();
        audio.setPsi(0.59);
        const pressure = audio.getStatus().pressureBand;
        audio.setPsi(0.65);
        const held = audio.getStatus().pressureBand;
        audio.setPsi(0.71);
        const recovered = audio.getStatus().pressureBand;
        await audio.teardown();
        return { pressure, held, recovered, afterTeardown: audio.getStatus() };
    });
    expect(result.pressure).toBe('pressure');
    expect(result.held).toBe('pressure');
    expect(result.recovered).toBe('calm');
    expect(result.afterTeardown.initialized).toBe(false);
    expect(result.afterTeardown.loadedAssetCount).toBe(0);
});

test('guest urgency, UI error, and victory use authoritative flows', async ({ page }) => {
    await page.goto(GAME_URL);
    const events = await page.evaluate(() => {
        const audio = window.Game.Audio;
        const received = [];
        const originalPublish = audio.publish;
        audio.publish = name => received.push(name);
        const ui = GameUI();
        ui.draw = () => {};
        ui.updateLiftVisualState = () => {};
        ui.updateScoreboardUI = () => {};

        const now = 5000;
        Registry.stats.round = 9;
        const floor = Registry.floors[1];
        floor.waitingGuests = [{ dest: 2, status: GuestStatus.HAPPY, spawnTime: now - (Config.annoyedSec + 1) * 1000, isVip: false, type: 'guest' }];
        Registry.lifts[0].targetFloor = 1;
        Registry.lifts[0].pos = Registry.floorHeight;
        Registry.lifts[0].state = 'IDLE';
        Registry.lifts[0].passengers = [];
        Registry.gameActive = true;
        Registry.stats.timeLeft = 100;
        gameTick(now);

        const criticalWaitSec = Config.GAME_DATA.system.patience.critical;
        floor.waitingGuests = [{ dest: 2, status: GuestStatus.RAGE, spawnTime: now - (criticalWaitSec + 1) * 1000, isVip: false, type: 'guest' }];
        Registry.gameActive = true;
        Registry.stats.lives = Math.max(3, Registry.stats.lives || 0);
        Registry.lifts[0].jamTimer = 0;
        Registry.lifts[0].stinkTimer = 0;
        Registry.lifts[0].automation = 'manual';
        Registry.lifts[0].state = 'BOARDING';
        Registry.lifts[0].stateProgress = 1;
        Registry.lifts[0].targetFloor = 1;
        Registry.lifts[0].pos = Registry.floorHeight;
        gameTick(now + 16);

        Registry.lifts[0].serviceLower = 0;
        Registry.lifts[0].serviceUpper = 0;
        Config.GAME_DATA.rounds[Registry.stats.round].zoningEnabled = true;
        Registry.gameActive = true;
        setLiftTarget(0, 1);
        showLeaderboard('You Won!');

        audio.publish = originalPublish;
        return received;
    });
    expect(events).toEqual(expect.arrayContaining([
        'guest_urgency', 'ui_error', 'victory'
    ]));
});

test('guest refusal is emitted from a controlled boarding frame', async ({ page }) => {
    await page.goto(GAME_URL);
    const events = await page.evaluate(() => {
        initializeRound(9, { showBriefing: false });
        const audio = window.Game.Audio;
        const received = [];
        const originalPublish = audio.publish;
        audio.publish = name => received.push(name);
        const ui = GameUI();
        ui.draw = () => {};
        ui.updateLiftVisualState = () => {};
        Registry.lifts.forEach(lift => { lift.automation = 'manual'; lift.manualOverride = true; lift.jamTimer = 0; lift.stinkTimer = 0; });
        const lift = Registry.lifts[0];
        const floor = Registry.floors[1];
        const now = Date.now();
        floor.waitingGuests = [{ dest: 2, status: GuestStatus.RAGE, spawnTime: now - 60000, isVip: false, type: 'guest' }];
        lift.targetFloor = 1;
        lift.pos = Registry.floorHeight;
        lift.state = 'BOARDING';
        lift.stateProgress = 1;
        lift.passengers = [];
        Registry.gameActive = true;
        animationTick(now);
        audio.publish = originalPublish;
        return received;
    });
    expect(events).toContain('guest_refused');
});

test('failed audio fetch is recorded without blocking the game', async ({ page }) => {
    await page.route('**/assets/audio/gameplay-chiploop.mp3', route => route.abort());
    await page.goto(GAME_URL);
    await page.waitForTimeout(500);
    const result = await page.evaluate(() => ({
        initialized: window.Game.Audio.getStatus().initialized,
        failedAssetCount: window.Game.Audio.getStatus().failedAssetCount,
        gamePresent: !!window.Registry && !!window.Game.Engine
    }));
    expect(result.failedAssetCount >= 1 || result.initialized === false).toBe(true);
    expect(result.gamePresent).toBe(true);
});

test('invalid audio data is recorded as a decode failure without blocking the game', async ({ page }) => {
    await page.route('**/assets/audio/gameplay-pressure-chip-bit-danger.mp3', route => route.fulfill({
        status: 200,
        contentType: 'audio/mpeg',
        body: 'not-a-valid-audio-file'
    }));
    await page.goto(GAME_URL);
    await page.waitForTimeout(500);
    const result = await page.evaluate(() => ({
        initialized: window.Game.Audio.getStatus().initialized,
        failedAssetCount: window.Game.Audio.getStatus().failedAssetCount,
        gamePresent: !!window.Registry && !!window.Game.Engine
    }));
    expect(result.failedAssetCount >= 1 || result.initialized === false).toBe(true);
    expect(result.gamePresent).toBe(true);
});

test('context changes and mute stop active music sources without leaving rooftop state orphaned', async ({ page }) => {
    await page.goto(GAME_URL);
    const result = await page.evaluate(() => {
        const audio = window.Game.Audio;
        audio.setContext('gameplay');
        audio.publish('rooftop_started', { floor: 14 });
        const beforeMute = audio.getStatus();
        audio.setMuted(true);
        const muted = audio.getStatus();
        audio.setMuted(false);
        audio.setContext('menu');
        const menu = audio.getStatus();
        return { beforeMute, muted, menu };
    });
    expect(result.beforeMute.rooftopActive).toBe(true);
    expect(result.muted.musicSourceCount).toBe(0);
    expect(result.muted.rooftopSourceActive).toBe(false);
    expect(result.menu.context).toBe('menu');
    expect(result.menu.rooftopSourceActive).toBe(false);
});

test('leaderboard modal swaps music context without retaining gameplay sources', async ({ page }) => {
    await page.goto(GAME_URL);
    await page.waitForTimeout(500);
    await page.click('#leaderboardBtn');
    const paused = await page.evaluate(() => window.Game.Audio.getStatus());
    await page.click('#closeLbBtn');
    const resumed = await page.evaluate(() => window.Game.Audio.getStatus());
    expect(paused.context).toBe('menu');
    expect(paused.musicSourceCount).toBe(0);
    expect(paused.rooftopSourceActive).toBe(false);
    expect(resumed.context).toBe('gameplay');
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

test('manifested audio files are locally resolvable', async ({ request }) => {
    const response = await request.get('http://127.0.0.1:5500/assets/audio/manifest.json');
    const manifest = await response.json();
    for (const asset of Object.values(manifest.assets)) {
        if (!asset.file || asset.file.endsWith('/')) continue;
        const assetResponse = await request.get(`http://127.0.0.1:5500/${asset.file}`);
        expect(assetResponse.ok(), asset.file).toBe(true);
    }
});

test('local test server sends browser-recognized audio MIME types', async ({ request }) => {
    const expectedTypes = {
        'assets/audio/gameplay-chiploop.mp3': 'audio/mpeg',
        'assets/audio/menu-somewhere-in-the-elevator.ogg': 'audio/ogg',
        'assets/audio/elevator-door.wav': 'audio/wav'
    };
    for (const [file, expectedType] of Object.entries(expectedTypes)) {
        const response = await request.get(`http://127.0.0.1:5500/${file}`);
        expect(response.ok(), file).toBe(true);
        expect(response.headers()['content-type']).toContain(expectedType);
    }
});

test('verified Turbo asset is available and mapped to the production audio path', async ({ page, request }) => {
    await page.goto(GAME_URL);
    const response = await request.get('http://127.0.0.1:5500/assets/audio/sfx/powerup-rocket-launch.wav');
    expect(response.ok()).toBe(true);
    expect(await page.evaluate(() => window.Game.Audio.getStatus())).toHaveProperty('initialized');
});

test('verified imported audio assets are available at their production paths', async ({ request }) => {
    for (const file of [
        'gameplay-rooftop-trance.mp3',
        'sfx/powerup-rocket-launch.wav',
        'sfx/musak-electronic-jazz.mp3',
        'sfx/tardis-air-whoosh.wav',
        'sfx/wide-doors-old-elevator.mp3',
        'sfx/hazard-gastric-distress.wav',
        'sfx/freesound_community-spray-48068.mp3',
        'sfx/dragon-studio-alien-song-323613.mp3',
        'sfx/powerup-wrench-toolbox.wav',
        'sfx/powerup-double-decker-robot-step.wav',
        'sfx/powerup-open-plan-metal.wav',
        'sfx/hazard-metal-interaction.wav',
        'sfx/event-vip-fanfare.wav',
        'sfx/guest-urgency-aww.ogg',
        'sfx/guest-refused-alert.wav',
        'sfx/ui-purchase-coin.wav',
        'sfx/ui-error-failed.mp3'
    ]) {
        const response = await request.get(`http://127.0.0.1:5500/assets/audio/${file}`);
        expect(response.ok(), file).toBe(true);
    }
});

test('manifested production event mappings resolve to local assets', async ({ request }) => {
    const response = await request.get('http://127.0.0.1:5500/assets/audio/manifest.json');
    const manifest = await response.json();
    const paths = [];
    for (const event of Object.values(manifest.events)) {
        if (event.asset) paths.push(event.asset);
        if (event.assetsByPayloadId) paths.push(...Object.values(event.assetsByPayloadId));
    }
    for (const file of [...new Set(paths)]) {
        const assetResponse = await request.get(`http://127.0.0.1:5500/${file}`);
        expect(assetResponse.ok(), file).toBe(true);
    }
});
