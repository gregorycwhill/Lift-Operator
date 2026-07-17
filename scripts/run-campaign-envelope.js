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
    lines.push('', 'The candidate strong comparator is an omniscient direct dispatcher. Where it fails to outperform Sweep, the round is Unproven rather than Overloaded; direct dispatch loses en-route pickup efficiency and is not yet a credible feasibility bound.');
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
        const strongRuns = [];

        for (const round of rounds) {
            const liftCount = balance.rounds[round].lifts;
            const scripts = Object.fromEntries(Array.from({ length: liftCount }, (_, index) => [index, 'manual']));
            for (const seed of seeds) {
                const result = await page.evaluate(
                    args => Game.Simulator.runRound(args.seed, args.scripts, args.round, { strategy: 'idealized-dispatch' }),
                    { seed, scripts, round }
                );
                strongRuns.push({ round, seed, metrics: metricsFor(result) });
                console.log(`R${round} seed ${seed}: ${result.success ? 'survived' : 'died'} (${result.elapsedSeconds}s)`);
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
                const roundStrongRuns = strongRuns.filter(run => run.round === round);
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
            strongRuns
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
