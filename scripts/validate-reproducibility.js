const crypto = require('crypto');
const { chromium } = require('@playwright/test');
const { startTestServer } = require('../tests/test-server');
const seeds = require('../tests/simulation/seed-sets.json');

const args = process.argv.slice(2);
const valueAfter = flag => {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : undefined;
};
const seedSet = seeds[valueAfter('--seeds') || 'release'] || seeds.release;
const repeat = Number(valueAfter('--repeat') || 3);
const rounds = valueAfter('--rounds')
    ? valueAfter('--rounds').split(',').map(Number)
    : [2, 12, 14, 17, 21, 23, 24, 25];
const stable = result => JSON.stringify({
    success: result.success,
    elapsedSeconds: result.elapsedSeconds,
    livesRemaining: result.livesRemaining,
    served: result.served,
    stats: result.roundStats
});

(async () => {
    let server;
    let browser;
    try {
        server = await startTestServer();
        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto('http://127.0.0.1:5500/index.html');
        const hashes = [];
        for (const round of rounds) {
            for (const seed of seedSet) {
                let expected;
                for (let attempt = 0; attempt < repeat; attempt += 1) {
                    const result = await page.evaluate(({ seedValue, roundValue }) => {
                        const definition = Config.GAME_DATA.rounds[roundValue];
                        const scripts = Object.fromEntries(Array.from({ length: definition.lifts }, (_, index) => [index, 'sweep']));
                        return Game.Simulator.runRound(seedValue, scripts, roundValue);
                    }, { seedValue: seed, roundValue: round });
                    const digest = crypto.createHash('sha256').update(stable(result)).digest('hex');
                    expected = expected || digest;
                    if (digest !== expected) throw new Error(`Determinism failure for R${round}, seed ${seed}, repeat ${attempt + 1}`);
                }
                hashes.push({ round, seed, hash: expected });
            }
        }
        console.log(JSON.stringify({ rounds, repeat, seedCount: seedSet.length, hashes }, null, 2));
    } finally {
        if (browser) await browser.close();
        if (server) await new Promise(resolve => server.close(resolve));
    }
})().catch(error => {
    console.error(error.message);
    process.exit(1);
});
