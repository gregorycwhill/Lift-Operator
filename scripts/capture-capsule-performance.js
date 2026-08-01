#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');
const { startTestServer } = require('../tests/test-server');

const root = path.resolve(__dirname, '..');
const percentile = (values, fraction) => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))] || 0;
};

(async () => {
    let server;
    let browser;
    try {
        server = await startTestServer();
        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
        await page.goto('http://127.0.0.1:5500/index.html');
        const result = await page.evaluate(() => {
            const captureRound = round => {
            const start = 1000000;
            initializeRound(round, { now: start, showBriefing: false });
            Registry.gameActive = true;
            Game.Seed.set(25025);
            Registry.lifts.forEach((lift, index) => setLiftAutomation(index, index % 2 ? 'zoned-high' : 'zoned-low'));
            Registry.floors.forEach((floor, floorIndex) => {
                if (floorIndex === 0) return;
                for (let index = 0; index < 3; index++) {
                    floor.waitingGuests.push({
                        id: `perf-${floorIndex}-${index}`,
                        dest: floorIndex === 1 ? Config.numFloors - 1 : 1,
                        status: GuestStatus.HAPPY,
                        spawnTime: start,
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
                }
            });
            const samples = [];
            let virtualTime = start;
            for (let frame = 0; frame < 600; frame++) {
                if (frame % 60 === 0) gameTick(virtualTime);
                const began = performance.now();
                animationTick(virtualTime);
                samples.push(performance.now() - began);
                virtualTime += 1000 / 60;
                Game.virtualTime = virtualTime;
            }
            const board = document.getElementById('gameBoard') || document.body;
            return {
                round,
                samples,
                lifts: Registry.lifts.length,
                floors: Registry.floors.length,
                capsuleCars: document.querySelectorAll('.capsule-car').length,
                domNodes: document.querySelectorAll('*').length,
                boardClientWidth: board.clientWidth,
                boardScrollWidth: board.scrollWidth,
                viewport: { width: window.innerWidth, height: window.innerHeight }
            };
            };
            return { r24: captureRound(24), r25: captureRound(25) };
        });
        const primary = result.r25;
        const report = {
            schemaVersion: 1,
            kind: 'headless-capsule-pressure-smoke',
            round: 25,
            capturedAt: new Date().toISOString(),
            environment: { browser: 'Chromium headless', viewport: primary.viewport },
            scenario: 'R24 and R25 capsule pressure, zoned automations, three waiting guests on every non-ground floor, 600 animation ticks',
            metrics: {
                rounds: [result.r24, result.r25].map(sample => ({
                    round: sample.round,
                    lifts: sample.lifts,
                    floors: sample.floors,
                    capsuleCars: sample.capsuleCars,
                    domNodes: sample.domNodes,
                    horizontalOverflow: sample.boardScrollWidth > sample.boardClientWidth,
                    averageTickMs: sample.samples.reduce((sum, value) => sum + value, 0) / sample.samples.length,
                    p95TickMs: percentile(sample.samples, 0.95),
                    maxTickMs: Math.max(...sample.samples)
                }))
            },
            limitation: 'This is a deterministic headless tick-cost smoke, not a hardware frame-rate certification. The browser/device 45fps release criterion remains in TEST_PLAN.md.'
        };
        fs.writeFileSync(path.join(root, 'reports', 'capsule-performance-smoke.json'), `${JSON.stringify(report, null, 2)}\n`);
        console.log(JSON.stringify(report, null, 2));
        for (const metrics of report.metrics.rounds) {
            const expectedCars = metrics.round === 24 ? 10 : 20;
            if (metrics.capsuleCars !== expectedCars) throw new Error(`Round ${metrics.round} rendered ${metrics.capsuleCars} capsule cars, expected ${expectedCars}.`);
            if (metrics.horizontalOverflow) throw new Error(`Round ${metrics.round} board has horizontal overflow at the reference viewport.`);
            if (metrics.p95TickMs > 50) throw new Error(`Round ${metrics.round} p95 animation tick is too slow: ${metrics.p95TickMs.toFixed(1)}ms.`);
        }
    } finally {
        if (browser) await browser.close();
        if (server) await new Promise(resolve => server.close(resolve));
    }
})().catch(error => {
    console.error(error.stack || error.message);
    process.exit(1);
});
