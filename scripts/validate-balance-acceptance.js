const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'design', 'game-balance.v1.json'), 'utf8');
const acceptanceSource = fs.readFileSync(path.join(root, 'tests', 'balance-acceptance.json'), 'utf8');
const acceptance = JSON.parse(acceptanceSource);
const report = JSON.parse(fs.readFileSync(path.join(root, 'reports', 'campaign-balance-acceptance.json'), 'utf8'));
const integrityOnly = process.argv.includes('--integrity');
const strict = process.argv.includes('--strict');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };

assert(report.schemaVersion === acceptance.schemaVersion, 'Unsupported balance acceptance schema.');
assert(report.traceSchemaVersion === acceptance.traceSchemaVersion, 'Unsupported balance trace schema.');
assert(report.balanceVersion === JSON.parse(source).balanceVersion, 'Balance acceptance report has stale balance version.');
assert(report.balanceHash === hash(source), 'Balance acceptance report does not match canonical balance data.');
assert(report.acceptanceHash === hash(acceptanceSource), 'Balance acceptance report does not match acceptance policy.');
assert(report.rounds.length === acceptance.rounds.length, 'Balance acceptance report has missing rounds.');
report.rounds.forEach(entry => {
    assert(acceptance.rounds.includes(entry.round), `Unexpected acceptance round ${entry.round}.`);
    assert(entry.allSweep.runs.length === acceptance.seeds.length, `R${entry.round}: missing all-Sweep seeds.`);
    assert(entry.intended.runs.length === acceptance.seeds.length, `R${entry.round}: missing intended seeds.`);
    const expectedSeeds = new Set(acceptance.seeds);
    [...entry.allSweep.runs, ...entry.intended.runs].forEach(run => {
        assert(expectedSeeds.has(run.seed), `R${entry.round}: unexpected seed ${run.seed}.`);
        assert(typeof run.metrics.accepted === 'boolean', `R${entry.round}, seed ${run.seed}: missing acceptance result.`);
        assert(run.metrics.diagnostics && run.metrics.diagnostics.totals, `R${entry.round}, seed ${run.seed}: missing compact diagnostics.`);
    });
    if (strict) {
        assert(entry.allSweep.accepted, `R${entry.round}: all-Sweep acceptance failed.`);
        // Intended profiles remain diagnostic until human playtesting supplies
        // round-level difficulty evidence. The hard simulator gate is the
        // deliberate all-Sweep negative-control failure only.
    }
});

if (errors.length) {
    console.error(errors.map(error => `- ${error}`).join('\n'));
    process.exit(1);
}
console.log(integrityOnly
    ? `Balance acceptance evidence is current: ${report.rounds.length} rounds, ${report.seedCount} seeds.`
    : strict
        ? `Balance acceptance valid: ${report.rounds.length} rounds, ${report.seedCount} seeds; all-Sweep negative-control gate met.`
        : `Balance acceptance evidence is valid: ${report.rounds.length} rounds, ${report.seedCount} seeds.`);
