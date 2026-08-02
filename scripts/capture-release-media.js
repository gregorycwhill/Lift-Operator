#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');
const { startTestServer } = require('../tests/test-server');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'assets', 'media');
const captures = [
    { round: 1, name: 'campaign-onboarding.png' },
    { round: 9, name: 'campaign-rooftop.png' },
    { round: 21, name: 'campaign-counterweights.png' },
    { round: 25, name: 'campaign-capsules.png' }
];

async function prepareRound(page, round) {
    await page.goto('http://127.0.0.1:5500/index.html');
    await page.evaluate(value => {
        initializeRound(value, { now: 1000000, showBriefing: false });
        Registry.gameActive = true;
        Registry.seed = 25025;
        Game.Seed.set(Registry.seed);
        Registry.floors.forEach((floor, index) => {
            if (index === 0) return;
            floor.waitingGuests.push({
                id: `capture-${value}-${index}`,
                dest: index === 1 ? Config.numFloors - 1 : 1,
                status: GuestStatus.HAPPY,
                spawnTime: 1000000,
                isVip: false,
                isCheckout: false,
                isFarter: false,
                isSunset: false,
                isPartying: false,
                isGymBro: false,
                isBulky: false,
                isRoomService: false,
                boardingWeight: 1
            });
        });
        if (value === 9) {
            Registry.sunsetActive = true;
            Registry.sunsetEndTime = Number.MAX_SAFE_INTEGER;
        }
        buildWorld();
        draw();
        document.querySelectorAll('.overlay').forEach(overlay => { overlay.style.display = 'none'; });
    }, round);
    await page.waitForTimeout(150);
}

(async () => {
    fs.mkdirSync(output, { recursive: true });
    let server;
    let browser;
    try {
        server = await startTestServer();
        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
        for (const capture of captures) {
            await prepareRound(page, capture.round);
            await page.locator('#game-area').screenshot({ path: path.join(output, capture.name) });
        }
        await page.setViewportSize({ width: 1200, height: 630 });
        await page.setContent(`<!doctype html><html><head><style>
          *{box-sizing:border-box} body{margin:0;background:#11212d;color:#f8fafc;font:700 32px/1.2 system-ui,sans-serif}
          main{height:630px;padding:64px;background:linear-gradient(135deg,#11212d,#26465e 55%,#1d9b75)}
          h1{font-size:96px;margin:0 0 24px;letter-spacing:-4px} p{max-width:790px;font-size:38px;margin:0}
          .lift{position:absolute;right:105px;bottom:58px;width:185px;height:410px;border:12px solid #d9e4eb;border-radius:28px;background:#0d1720;box-shadow:0 0 0 16px #4ecdc4 inset}
          .car{position:absolute;left:18px;right:18px;bottom:55px;height:86px;border-radius:18px;background:#ffd166;color:#243b53;text-align:center;padding-top:18px;font-size:38px}
          small{position:absolute;left:68px;bottom:60px;color:#9fb3c8;font-size:24px}
        </style></head><body><main><h1>Lift Operator</h1><p>Keep the hotel moving. Route the fleet, automate the pressure, and solve the next shift.</p><small>25-round desktop campaign · GitHub Pages playtest</small><div class="lift"><div class="car">⚙</div></div></main></body></html>`);
        await page.screenshot({ path: path.join(output, 'social-preview.png') });
        console.log(`Captured ${captures.length} campaign screenshots and one social preview in ${path.relative(root, output)}.`);
    } finally {
        if (browser) await browser.close();
        if (server) await new Promise(resolve => server.close(resolve));
    }
})().catch(error => { console.error(error.stack || error.message); process.exit(1); });
