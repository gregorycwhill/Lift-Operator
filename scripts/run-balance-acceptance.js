#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('@playwright/test');
const { startTestServer } = require('../tests/test-server');
const { profiles: roundProfiles } = require('../tests/simulation/round-profiles');
const { getStrategyProfile } = require('../tests/simulation/strategy-profiles');

const root = path.resolve(__dirname, '..');
const balanceSource = fs.readFileSync(path.join(root, 'design', 'game-balance.v1.json'), 'utf8');
const balance = JSON.parse(balanceSource);
const acceptance = JSON.parse(fs.readFileSync(path.join(root, 'tests', 'balance-acceptance.json'), 'utf8'));
const roundArgIndex = process.argv.indexOf('--rounds');
const selectedRounds = roundArgIndex >= 0
    ? process.argv[roundArgIndex + 1].split(',').map(Number)
    : acceptance.rounds;
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const repeat = (id, tier, count) => Array.from({ length: count }, () => ({ id, tier }));

function scriptsFor(round, lifts, mode) {
    if (mode === 'all-sweep') return Object.fromEntries(Array.from({ length: lifts }, (_, index) => [index, 'sweep']));
    if (mode === 'intended' && round === 3) return { 0: 'weighted-voting', 1: 'sweep' };
    const profile = getStrategyProfile(roundProfiles[round].intended);
    const defaultMode = profile.scripts === 'zoned' || profile.scripts === 'paired-zoned'
        ? 'zoned'
        : profile.family === 'triage-redundancy' || profile.family === 'event-handling'
            ? 'priority-sweep'
                : profile.family === 'advanced-control'
                    ? 'priority-sweep'
                : 'sweep';
    const selected = mode === 'intended' ? defaultMode : 'sweep';
    if (mode === 'intended' && profile.family === 'advanced-control') {
        return Object.fromEntries(Array.from({ length: lifts }, (_, index) => [index, index === 0 ? 'manual' : selected]));
    }
    if (selected !== 'zoned') return Object.fromEntries(Array.from({ length: lifts }, (_, index) => [index, selected]));
    return Object.fromEntries(Array.from({ length: lifts }, (_, index) => [index, index % 2 === 0 ? 'zoned-low' : 'zoned-high']));
}

function loadoutFor(round) {
    if (round === 2) return repeat('doors', 0, 4);
    if (round === 3) return repeat('doors', 0, 4);
    if (round < 4) return [];
    const ids = round >= 14
        ? ['wrench', 'freshener', 'musak', 'doors', 'tardis', 'doubleDecker', 'turbo', 'openPlan']
        : ['doors', 'wrench', 'turbo', 'musak', 'freshener'];
    return ids.flatMap(id => repeat(id, round >= 12 ? 1 : 0, 2));
}

function metrics(result, round, mode) {
    const endurance = round === 12;
    const accepted = mode === 'all-sweep'
        ? endurance ? !result.success && result.elapsedSeconds < acceptance.intended.r12.allSweepMaxSeconds : !result.success
        : endurance
            ? result.elapsedSeconds >= acceptance.intended.r12.intendedMinSeconds && result.elapsedSeconds <= acceptance.intended.r12.intendedMaxSeconds
            : result.success;
    return {
        accepted,
        success: result.success,
        elapsedSeconds: result.elapsedSeconds,
        served: result.served,
        livesRemaining: result.livesRemaining,
        roundStats: result.roundStats,
        trace: result.trace,
        diagnostics: result.diagnostics
    };
}

function markdown(report) {
    const lines = [
        '# Campaign Balance Acceptance', '',
        `Balance version: \`${report.balanceVersion}\``,
        `Policy: ${report.policy.description}`, '',
        '| Round | All-Sweep accepted | Intended accepted | All-Sweep survivors | Intended survivors |',
        '| ---: | --- | --- | ---: | ---: |'
    ];
    report.rounds.forEach(entry => lines.push(
        `| ${entry.round} | ${entry.allSweep.accepted ? 'yes' : 'NO'} | ${entry.intended.acceptedRate >= report.policy.minimumIntendedSurvivalRate ? 'yes' : 'NO'} | ${entry.allSweep.survivors}/${report.seedCount} | ${entry.intended.survivors}/${report.seedCount} |`
    ));
    lines.push('', `- All-Sweep failures accepted: ${report.summary.allSweepAccepted}/${report.summary.allSweepRequired}`);
    lines.push(`- Intended-strategy comparator rounds currently positive (diagnostic only): ${report.summary.intendedAccepted}/${report.summary.intendedRequired}`);
    lines.push('', 'This report is an acceptance result, not merely a freshness check. Any unmet required classification blocks the balance gate.');
    return `${lines.join('\n')}\n`;
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

        for (const round of selectedRounds) {
            const lifts = balance.rounds[round].lifts;
            for (const seed of acceptance.seeds) {
                for (const mode of ['all-sweep', 'intended']) {
                    const profileId = mode === 'intended' ? roundProfiles[round].intended : 'all-sweep-unattended';
                    const profile = getStrategyProfile(profileId);
                    const options = round === 12
                        ? { maxSeconds: mode === 'all-sweep' ? acceptance.intended.r12.allSweepMaxSeconds : acceptance.intended.r12.intendedMaxSeconds,
                            ...(mode === 'intended' ? { profileId, strategy: profile.strategy || 'idealized-dispatch', loadout: loadoutFor(round), interventionIntervalSec: profile.interventionIntervalSec || (round <= 3 ? 3 : 12), manualTargetLimit: profile.manualTargetLimit, trace: true } : {}) }
                        : mode === 'intended'
                            ? { profileId, strategy: profile.strategy || (round >= 24 ? 'resource-supported' : 'idealized-dispatch'), loadout: loadoutFor(round), interventionIntervalSec: profile.interventionIntervalSec || (round <= 3 ? 3 : 12), manualTargetLimit: profile.manualTargetLimit, trace: true }
                            : {};
                    const result = await page.evaluate(
                        args => Game.Simulator.runRound(args.seed, args.scripts, args.round, args.options),
                        { seed, round, scripts: scriptsFor(round, lifts, mode), options }
                    );
                    if (result.error) throw new Error(`Round ${round}, seed ${seed}, ${mode}: ${result.error}`);
                    runs.push({ round, seed, mode, profileId, metrics: metrics(result, round, mode) });
                }
            }
            process.stdout.write(`R${round} complete\n`);
        }

        const rounds = selectedRounds.map(round => {
            const allSweepRuns = runs.filter(run => run.round === round && run.mode === 'all-sweep');
            const intendedRuns = runs.filter(run => run.round === round && run.mode === 'intended');
            const intendedAcceptedRate = intendedRuns.filter(run => run.metrics.accepted).length / acceptance.seeds.length;
            return {
                round,
                allSweep: {
                    accepted: allSweepRuns.every(run => run.metrics.accepted),
                    survivors: allSweepRuns.filter(run => run.metrics.success).length,
                    runs: allSweepRuns
                },
                intended: {
                    acceptedRate: intendedAcceptedRate,
                    survivors: intendedRuns.filter(run => run.metrics.accepted).length,
                    runs: intendedRuns
                }
            };
        });
        const report = {
            schemaVersion: acceptance.schemaVersion,
            traceSchemaVersion: acceptance.traceSchemaVersion,
            balanceVersion: balance.balanceVersion,
            balanceHash: hash(balanceSource),
            acceptanceHash: hash(fs.readFileSync(path.join(root, 'tests', 'balance-acceptance.json'), 'utf8')),
            policy: { ...acceptance, description: acceptance.description || acceptance.policy },
            seedCount: acceptance.seeds.length,
            rounds,
            summary: {
                allSweepAccepted: rounds.filter(round => round.allSweep.accepted).length,
                allSweepRequired: rounds.length,
                intendedAccepted: rounds.filter(round => round.intended.acceptedRate >= acceptance.intended.minimumSurvivalRate).length,
                intendedRequired: rounds.length
            }
        };
        const reportDir = path.join(root, 'reports');
        fs.writeFileSync(path.join(reportDir, 'campaign-balance-acceptance.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
        fs.writeFileSync(path.join(reportDir, 'campaign-balance-acceptance.md'), markdown(report), 'utf8');
        const failed = report.summary.allSweepAccepted !== report.summary.allSweepRequired;
        console.log(`Acceptance complete: ${report.summary.allSweepAccepted}/${report.summary.allSweepRequired} all-Sweep rounds; ${report.summary.intendedAccepted}/${report.summary.intendedRequired} intended rounds.`);
        if (failed) process.exitCode = 1;
    } finally {
        if (browser) await browser.close();
        if (server) await new Promise(resolve => server.close(resolve));
    }
})().catch(error => {
    console.error(error);
    process.exit(1);
});
