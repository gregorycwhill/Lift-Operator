const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('@playwright/test');
const { startTestServer } = require('../tests/test-server');

const root = path.resolve(__dirname, '..');
const balanceSource = fs.readFileSync(path.join(root, 'design', 'game-balance.v1.json'), 'utf8');
const balance = JSON.parse(balanceSource);
const matrix = JSON.parse(fs.readFileSync(path.join(root, 'tests', 'balance-matrix.json'), 'utf8'));
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const round2TargetStart = balance.system.roundTime * 0.7;
const round2TargetEnd = balance.system.roundTime * 0.8;

function roundMetrics(result) {
    const telemetry = result.designTelemetry;
    const samples = telemetry.samples;
    const last = samples[samples.length - 1] || {};
    return {
        survived: result.success,
        elapsedSeconds: result.elapsedSeconds,
        served: result.served,
        livesRemaining: result.livesRemaining,
        firstPerilSecond: telemetry.summary.firstPerilSecond,
        minimumSurvivalIndex: telemetry.summary.minimumSurvivalIndex,
        secondsInPeril: telemetry.summary.secondsInPeril,
        recoveries: telemetry.summary.recoveries,
        peakQueue: telemetry.summary.peakQueue,
        peakCritical: telemetry.summary.peakCritical,
        arrivalRate: last.arrivalRate || 0,
        deliveryRate: last.deliveryRate || 0,
        p90JourneyTime: last.p90JourneyTime || 0,
        liftUtilisation: last.liftUtilisation || 0,
        manualDecisionsPerMinute: last.manualDecisionsPerMinute || 0
    };
}

function classify(round, metrics) {
    if (round === 12) return 'COMPARATOR_REQUIRED';
    if (metrics.survived) return 'VIOLATION_SURVIVED';
    if (round === 2 && (metrics.elapsedSeconds < round2TargetStart || metrics.elapsedSeconds > round2TargetEnd)) {
        return 'VIOLATION_FAILURE_TIMING';
    }
    return 'MEETS_ALL_SWEEP_FLOOR';
}

function markdown(report) {
    const lines = [
        '# All-Sweep Balance Baseline',
        '',
        `Balance version: \`${report.balanceVersion}\`  `,
        `Policy: ${report.policy.description}`,
        '',
        '| Round | Seed | Outcome | Elapsed | Lives | Served | First peril | Min SI | Peak queue | P90 journey | Classification |',
        '| ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |'
    ];
    report.runs.forEach(run => lines.push(
        `| ${run.round} | ${run.seed} | ${run.metrics.survived ? 'survived' : 'died'} | ${run.metrics.elapsedSeconds.toFixed(0)}s | ${run.metrics.livesRemaining} | ${run.metrics.served} | ${run.metrics.firstPerilSecond === null ? '-' : run.metrics.firstPerilSecond.toFixed(0) + 's'} | ${run.metrics.minimumSurvivalIndex === null ? '-' : run.metrics.minimumSurvivalIndex.toFixed(2)} | ${run.metrics.peakQueue} | ${run.metrics.p90JourneyTime.toFixed(1)}s | ${run.classification} |`
    ));
    lines.push('', '## Current findings', '');
    lines.push(`- Hard invariant violations: ${report.summary.hardViolations}`);
    lines.push(`- Runs meeting the all-Sweep failure floor: ${report.summary.meetsFloor}`);
    lines.push(`- Round 12 runs awaiting a competent-strategy comparator: ${report.summary.comparatorRequired}`);
    lines.push('', 'A violation is a measured balance finding, not a test-runner failure. Parameter tuning should reduce violations without silently regenerating acceptance criteria.', '');
    return lines.join('\n');
}

(async () => {
    let server;
    let browser;
    try {
        server = await startTestServer();
        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto('http://127.0.0.1:5500/index.html');

        const runs = [];
        for (const round of matrix.rounds) {
            const lifts = balance.rounds[round].lifts;
            const scripts = Object.fromEntries(Array.from({ length: lifts }, (_, index) => [index, 'sweep']));
            for (const seed of matrix.seeds) {
                const result = await page.evaluate(
                    ({ seed, scripts, round }) => Game.Simulator.runRound(seed, scripts, round),
                    { seed, scripts, round }
                );
                if (result.error) throw new Error(`Round ${round}, seed ${seed}: ${result.error}`);
                const metrics = roundMetrics(result);
                runs.push({ round, seed, metrics, classification: classify(round, metrics) });
                process.stdout.write(`R${round} seed ${seed}: ${metrics.survived ? 'survived' : 'died'} (${metrics.elapsedSeconds.toFixed(0)}s)\n`);
            }
        }

        const report = {
            schemaVersion: 1,
            balanceVersion: balance.balanceVersion,
            balanceHash: hash(balanceSource),
            matrixHash: hash(JSON.stringify(matrix)),
            policy: { id: matrix.policy, description: matrix.description },
            seeds: matrix.seeds,
            rounds: matrix.rounds,
            summary: {
                totalRuns: runs.length,
                hardViolations: runs.filter(run => run.classification.startsWith('VIOLATION')).length,
                meetsFloor: runs.filter(run => run.classification === 'MEETS_ALL_SWEEP_FLOOR').length,
                comparatorRequired: runs.filter(run => run.classification === 'COMPARATOR_REQUIRED').length
            },
            runs
        };

        const reportDir = path.join(root, 'reports');
        fs.mkdirSync(reportDir, { recursive: true });
        fs.writeFileSync(path.join(reportDir, 'all-sweep-baseline.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
        fs.writeFileSync(path.join(reportDir, 'all-sweep-baseline.md'), markdown(report), 'utf8');
        console.log(`Matrix complete: ${report.summary.hardViolations} hard violations across ${report.summary.totalRuns} runs.`);
    } finally {
        if (browser) await browser.close();
        if (server) await new Promise(resolve => server.close(resolve));
    }
})().catch(error => {
    console.error(error);
    process.exit(1);
});
