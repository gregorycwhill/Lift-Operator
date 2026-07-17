const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');
const { startTestServer } = require('../tests/test-server');

const root = path.resolve(__dirname, '..');
const balance = JSON.parse(fs.readFileSync(path.join(root, 'design', 'game-balance.v1.json'), 'utf8'));
const baseline = JSON.parse(fs.readFileSync(path.join(root, 'reports', 'all-sweep-baseline.json'), 'utf8'));
const earlyExperiments = JSON.parse(fs.readFileSync(path.join(root, 'reports', 'early-balance-experiments.json'), 'utf8'));
const seeds = [1234, 3141, 6060];
const rounds = Array.from({ length: 12 }, (_, index) => index + 2);
const repeat = (id, tier, count) => Array.from({ length: count }, () => ({ id, tier }));
const profileForRound = round => {
    const automations = round >= 5
        ? ['sweep', 'priority-sweep', 'weighted-voting']
        : round >= 4 ? ['sweep', 'priority-sweep'] : ['sweep'];
    const loadouts = {
        4: repeat('doors', 1, 2),
        5: repeat('doors', 1, 2),
        6: [...repeat('wrench', 1, 2), { id: 'doors', tier: 1 }],
        7: [...repeat('turbo', 1, 2), { id: 'wrench', tier: 1 }],
        8: [...repeat('musak', 1, 2), { id: 'turbo', tier: 1 }],
        9: [...repeat('freshener', 1, 2), { id: 'musak', tier: 1 }],
        10: [...repeat('tardis', 1, 2), { id: 'freshener', tier: 1 }],
        11: [...repeat('doubleDecker', 1, 2), { id: 'tardis', tier: 1 }],
        12: ['wrench', 'freshener', 'musak', 'turbo', 'tardis', 'doors'].flatMap(id => repeat(id, 2, 3)),
        13: ['wrench', 'freshener', 'musak', 'turbo', 'tardis', 'doors'].flatMap(id => repeat(id, 2, 2))
    };
    return { automations, loadout: loadouts[round] || [] };
};

const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
const lastSample = result => result.designTelemetry.samples[result.designTelemetry.samples.length - 1] || {};
const metricsFor = result => {
    const telemetry = result.designTelemetry;
    const last = lastSample(result);
    return {
        survived: result.success,
        elapsedSeconds: result.elapsedSeconds,
        served: result.served,
        livesRemaining: result.livesRemaining,
        firstPerilSecond: telemetry.summary.firstPerilSecond,
        peakQueue: telemetry.summary.peakQueue,
        arrivalRate: last.arrivalRate || 0,
        deliveryRate: last.deliveryRate || 0,
        utilisationProxy: last.deliveryRate > 0 ? last.arrivalRate / last.deliveryRate : null,
        littlesLawResidual: last.littlesLawResidual || 0,
        queueTrend: (last.arrivalRate || 0) - (last.deliveryRate || 0)
    };
};

const aggregate = runs => {
    const utilisation = run => run.metrics.utilisationProxy ?? (
        run.metrics.deliveryRate > 0 ? run.metrics.arrivalRate / run.metrics.deliveryRate : 0
    );
    const queueTrend = run => run.metrics.queueTrend ?? (run.metrics.arrivalRate - run.metrics.deliveryRate);
    const residuals = runs.map(run => run.metrics.littlesLawResidual).filter(Number.isFinite);
    return {
        survivors: runs.filter(run => run.metrics.survived).length,
        averageElapsedSeconds: mean(runs.map(run => run.metrics.elapsedSeconds)),
        averageServed: mean(runs.map(run => run.metrics.served)),
        averageArrivalRate: mean(runs.map(run => run.metrics.arrivalRate)),
        averageDeliveryRate: mean(runs.map(run => run.metrics.deliveryRate)),
        averageUtilisationProxy: mean(runs.map(utilisation)),
        averageLittleLawResidual: residuals.length ? mean(residuals) : null,
        averageQueueTrend: mean(runs.map(queueTrend)),
        averageFirstPerilSecond: mean(runs.map(run => run.metrics.firstPerilSecond || run.metrics.elapsedSeconds))
    };
};

const classify = (round, unattended, strong) => {
    const comparatorUnderperforms =
        strong.survivors <= unattended.survivors &&
        strong.averageElapsedSeconds <= unattended.averageElapsedSeconds;
    if (round === 12) {
        if (unattended.averageElapsedSeconds >= 240) return 'UNDERLOADED';
        if (comparatorUnderperforms) return 'UNPROVEN';
        if (strong.averageElapsedSeconds < 240) return 'OVERLOADED';
        if (strong.averageElapsedSeconds > 480) return 'UNDERLOADED';
        return 'CONTESTED';
    }
    if (unattended.survivors > 0) return 'UNDERLOADED';
    if (comparatorUnderperforms) return 'UNPROVEN';
    if (strong.survivors >= 2) return 'CONTESTED';
    return 'OVERLOADED';
};

const markdown = report => {
    const lines = [
        '# Campaign Balance Envelope',
        '',
        `Balance version: \`${report.balanceVersion}\``,
        '',
        '| Round | Classification | Sweep survival | Strong survival | Sweep time | Strong time | Arrival | Delivery | Utilisation | Queue trend |',
        '| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |'
    ];
    report.rounds.forEach(entry => lines.push(
        `| ${entry.round} | ${entry.classification} | ${entry.unattended.survivors}/3 | ${entry.strong.survivors}/3 | ` +
        `${entry.unattended.averageElapsedSeconds.toFixed(0)}s | ${entry.strong.averageElapsedSeconds.toFixed(0)}s | ` +
        `${entry.unattended.averageArrivalRate.toFixed(2)} | ${entry.unattended.averageDeliveryRate.toFixed(2)} | ` +
        `${entry.unattended.averageUtilisationProxy.toFixed(2)} | ${entry.unattended.averageQueueTrend.toFixed(2)} |`
    ));
    lines.push('', 'The strong result is the best per-seed outcome from an auditable portfolio: an omniscient direct dispatcher and a featured-policy profile with a declared round-appropriate loadout. Where the portfolio does not outperform Sweep, the round remains Unproven rather than being tuned around weak comparator evidence.');
    return `${lines.join('\n')}\n`;
};

(async () => {
    if (baseline.balanceVersion !== balance.balanceVersion) {
        throw new Error('All-Sweep baseline is stale. Run npm.cmd run balance:matrix first.');
    }
    let server;
    let browser;
    try {
        server = await startTestServer();
        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto('http://127.0.0.1:5500/index.html');
        const comparatorRuns = [];

        for (const round of rounds) {
            const liftCount = balance.rounds[round].lifts;
            const scripts = Object.fromEntries(Array.from({ length: liftCount }, (_, index) => [index, 'manual']));
            for (const seed of seeds) {
                const result = await page.evaluate(
                    args => Game.Simulator.runRound(args.seed, args.scripts, args.round, { strategy: 'idealized-dispatch' }),
                    { seed, scripts, round }
                );
                comparatorRuns.push({ round, seed, profile: 'idealized-dispatch', loadout: [], metrics: metricsFor(result) });

                if (round !== 3) {
                    const profile = profileForRound(round);
                    const supportedTimes = [];
                    for (const automation of profile.automations) {
                        const policyScripts = Object.fromEntries(Array.from({ length: liftCount }, (_, index) => [index, automation]));
                        const supported = await page.evaluate(
                            args => Game.Simulator.runRound(args.seed, args.scripts, args.round, {
                                strategy: 'resource-supported',
                                loadout: args.loadout,
                                interventionIntervalSec: 12
                            }),
                            { seed, scripts: policyScripts, round, loadout: profile.loadout }
                        );
                        comparatorRuns.push({
                            round,
                            seed,
                            profile: `resource-supported-${automation}`,
                            loadout: profile.loadout,
                            metrics: metricsFor(supported)
                        });
                        supportedTimes.push(`${automation}:${supported.elapsedSeconds}s`);
                    }
                    console.log(`R${round} seed ${seed}: ideal ${result.elapsedSeconds}s, ${supportedTimes.join(', ')}`);
                } else {
                    console.log(`R${round} seed ${seed}: ideal ${result.elapsedSeconds}s; accepted Wide Doors evidence used`);
                }
            }
        }

        const report = {
            schemaVersion: 1,
            balanceVersion: balance.balanceVersion,
            seeds,
            profiles: {
                unattended: 'all-sweep-unattended',
                defaultStrong: 'idealized-dispatch',
                roundOverrides: { 3: 'wide-doors-rescue' }
            },
            rounds: rounds.map(round => {
                const unattendedRuns = baseline.runs.filter(run => run.round === round);
                const roundComparatorRuns = comparatorRuns.filter(run => run.round === round);
                const roundStrongRuns = seeds.map(seed => roundComparatorRuns
                    .filter(run => run.seed === seed)
                    .sort((a, b) =>
                        Number(b.metrics.survived) - Number(a.metrics.survived) ||
                        b.metrics.elapsedSeconds - a.metrics.elapsedSeconds ||
                        b.metrics.livesRemaining - a.metrics.livesRemaining
                    )[0]);
                const unattended = aggregate(unattendedRuns);
                const strong = aggregate(roundStrongRuns);
                if (round === 3) {
                    const accepted = earlyExperiments.summaries.find(summary =>
                        summary.round === 3 &&
                        summary.candidate.id === 'r3-c2' &&
                        summary.strategy === 'wide-doors-rescue'
                    );
                    if (!accepted || earlyExperiments.balanceVersion !== balance.balanceVersion) {
                        throw new Error('Accepted Round 3 comparator evidence is missing or stale.');
                    }
                    strong.survivors = accepted.survivors;
                    strong.averageElapsedSeconds = accepted.averageElapsedSeconds;
                }
                return { round, classification: classify(round, unattended, strong), unattended, strong };
            }),
            comparatorRuns
        };

        fs.writeFileSync(path.join(root, 'reports', 'campaign-envelope.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
        fs.writeFileSync(path.join(root, 'reports', 'campaign-envelope.md'), markdown(report), 'utf8');
    } finally {
        if (browser) await browser.close();
        if (server) await new Promise(resolve => server.close(resolve));
    }
})().catch(error => {
    console.error(error);
    process.exit(1);
});
