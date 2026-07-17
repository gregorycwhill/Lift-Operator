const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');
const { startTestServer } = require('../tests/test-server');

const root = path.resolve(__dirname, '..');
const balance = JSON.parse(fs.readFileSync(path.join(root, 'design', 'game-balance.v1.json'), 'utf8'));
const seeds = [1234, 3141, 6060];
const candidateFilter = process.env.EXPERIMENT_CANDIDATE || '';
const candidates = {
    2: [
        { id: 'r2-a', spawnStart: 0.55, spawnEnd: 0.75 },
        { id: 'r2-b', spawnStart: 0.60, spawnEnd: 0.80 },
        { id: 'r2-c', spawnStart: 0.65, spawnEnd: 0.85 },
        { id: 'r2-d', spawnStart: 0.70, spawnEnd: 0.90 },
        { id: 'r2-e', spawnStart: 0.50, spawnEnd: 0.65, trafficBursts: [{ atSecond: 90, floor: 9, destination: 0, count: 5 }] },
        { id: 'r2-f', spawnStart: 0.50, spawnEnd: 0.65, trafficBursts: [{ atSecond: 90, floor: 9, destination: 0, count: 8 }] }
    ],
    3: [
        { id: 'r3-a', spawnStart: 0.75, spawnEnd: 0.95 },
        { id: 'r3-b', spawnStart: 0.85, spawnEnd: 1.05 },
        { id: 'r3-b1', spawnStart: 0.90, spawnEnd: 1.10 },
        { id: 'r3-b2', spawnStart: 0.925, spawnEnd: 1.125 },
        { id: 'r3-c', spawnStart: 0.95, spawnEnd: 1.15 },
        { id: 'r3-c1', spawnStart: 0.975, spawnEnd: 1.175 },
        { id: 'r3-c15', spawnStart: 0.985, spawnEnd: 1.185 },
        { id: 'r3-c18', spawnStart: 0.99, spawnEnd: 1.19 },
        { id: 'r3-c2', spawnStart: 1.00, spawnEnd: 1.20 },
        { id: 'r3-d', spawnStart: 1.05, spawnEnd: 1.25 }
    ],
    4: [
        { id: 'r4-a', spawnStart: 0.95, spawnEnd: 1.15 },
        { id: 'r4-b', spawnStart: 1.10, spawnEnd: 1.30 },
        { id: 'r4-c', spawnStart: 1.25, spawnEnd: 1.45 }
    ],
    5: [
        { id: 'r5-a', spawnStart: 1.10, spawnEnd: 1.30 },
        { id: 'r5-b', spawnStart: 1.25, spawnEnd: 1.45 },
        { id: 'r5-c', spawnStart: 1.40, spawnEnd: 1.60 }
    ]
};

const strategiesForRound = round => ({
    2: ['all-sweep', 'minimal-rescue'],
    3: ['all-sweep', 'minimal-rescue', 'wide-doors-rescue', 'hybrid-manual-wide-doors'],
    4: ['all-sweep', 'all-priority', 'hybrid-manual-priority'],
    5: ['all-sweep', 'all-voting', 'all-weighted-voting', 'hybrid-manual-weighted-voting']
}[round]);

const automationForStrategy = (strategy, index) => {
    if (strategy === 'hybrid-manual-wide-doors' && index === 0) return 'manual';
    if (strategy === 'hybrid-manual-priority') return index === 0 ? 'manual' : 'priority-sweep';
    if (strategy === 'hybrid-manual-weighted-voting') return index === 0 ? 'manual' : 'weighted-voting';
    if (strategy === 'all-priority') return 'priority-sweep';
    if (strategy === 'all-voting') return 'voting';
    if (strategy === 'all-weighted-voting') return 'weighted-voting';
    return 'sweep';
};

(async () => {
    let server;
    let browser;
    try {
        server = await startTestServer();
        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto('http://127.0.0.1:5500/index.html');
        const experiments = [];

        for (const round of [2, 3, 4, 5]) {
            for (const candidate of candidates[round]) {
                if (candidateFilter && candidate.id !== candidateFilter) continue;
                const strategies = strategiesForRound(round);
                for (const strategy of strategies) {
                    const scripts = Object.fromEntries(
                        Array.from({ length: balance.rounds[round].lifts }, (_, index) => [
                            index,
                            automationForStrategy(strategy, index)
                        ])
                    );
                    for (const seed of seeds) {
                        const result = await page.evaluate(
                            args => Game.Simulator.runRound(args.seed, args.scripts, args.round, args.options),
                            {
                                seed,
                                scripts,
                                round,
                                options: {
                                    strategy,
                                    loadout: strategy === 'wide-doors-rescue' || strategy === 'hybrid-manual-wide-doors'
                                        ? [
                                            { id: 'doors', tier: 0 },
                                            { id: 'doors', tier: 0 },
                                            { id: 'doors', tier: 0 },
                                            { id: 'doors', tier: 0 }
                                        ]
                                        : [],
                                    interventionIntervalSec: round === 2 ? 15 : 12,
                                    roundOverrides: {
                                        spawnStart: candidate.spawnStart,
                                        spawnEnd: candidate.spawnEnd
                                    },
                                    trafficBursts: candidate.trafficBursts || []
                                }
                            }
                        );
                        experiments.push({
                            round,
                            candidate,
                            strategy,
                            seed,
                            survived: result.success,
                            elapsedSeconds: result.elapsedSeconds,
                            livesRemaining: result.livesRemaining,
                            served: result.served,
                            manualClicks: result.roundStats.manualClicks,
                            firstPerilSecond: result.designTelemetry.summary.firstPerilSecond,
                            secondsInPeril: result.designTelemetry.summary.secondsInPeril,
                            peakQueue: result.designTelemetry.summary.peakQueue
                        });
                    }
                }
            }
        }

        const summaries = [];
        for (const round of [2, 3, 4, 5]) {
            for (const candidate of candidates[round]) {
                if (candidateFilter && candidate.id !== candidateFilter) continue;
                const strategies = strategiesForRound(round);
                for (const strategy of strategies) {
                    const runs = experiments.filter(run => run.round === round && run.candidate.id === candidate.id && run.strategy === strategy);
                    summaries.push({
                        round,
                        candidate,
                        strategy,
                        survivors: runs.filter(run => run.survived).length,
                        averageElapsedSeconds: runs.reduce((sum, run) => sum + run.elapsedSeconds, 0) / runs.length,
                        averageLivesRemaining: runs.reduce((sum, run) => sum + run.livesRemaining, 0) / runs.length,
                        averageManualClicks: runs.reduce((sum, run) => sum + run.manualClicks, 0) / runs.length,
                        averagePeakQueue: runs.reduce((sum, run) => sum + run.peakQueue, 0) / runs.length
                    });
                }
            }
        }

        fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
        fs.writeFileSync(
            path.join(root, 'reports', 'early-balance-experiments.json'),
            `${JSON.stringify({ balanceVersion: balance.balanceVersion, seeds, summaries, experiments }, null, 2)}\n`,
            'utf8'
        );
        summaries.forEach(summary => console.log(
            `${summary.candidate.id} ${summary.strategy}: ${summary.survivors}/3 survived, ` +
            `${summary.averageElapsedSeconds.toFixed(0)}s average, ${summary.averageManualClicks.toFixed(1)} clicks`
        ));
    } finally {
        if (browser) await browser.close();
        if (server) await new Promise(resolve => server.close(resolve));
    }
})().catch(error => {
    console.error(error);
    process.exit(1);
});
