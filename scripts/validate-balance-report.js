const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const balanceSource = fs.readFileSync(path.join(root, 'design', 'game-balance.v1.json'), 'utf8');
const balance = JSON.parse(balanceSource);
const matrix = JSON.parse(fs.readFileSync(path.join(root, 'tests', 'balance-matrix.json'), 'utf8'));
const report = JSON.parse(fs.readFileSync(path.join(root, 'reports', 'all-sweep-baseline.json'), 'utf8'));
const envelope = JSON.parse(fs.readFileSync(path.join(root, 'reports', 'campaign-envelope.json'), 'utf8'));
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };

assert(report.schemaVersion === 1, 'Unsupported balance report schema.');
assert(report.balanceVersion === balance.balanceVersion, 'Balance report version is stale.');
assert(report.balanceHash === hash(balanceSource), 'Balance report does not match canonical balance data.');
assert(report.matrixHash === hash(JSON.stringify(matrix)), 'Balance report does not match the matrix definition.');
assert(report.runs.length === matrix.rounds.length * matrix.seeds.length, 'Balance report has missing runs.');
report.runs.forEach(run => {
    assert(matrix.rounds.includes(run.round), `Unexpected round ${run.round}.`);
    assert(matrix.seeds.includes(run.seed), `Unexpected seed ${run.seed}.`);
    assert(Number.isFinite(run.metrics.elapsedSeconds), `R${run.round}/${run.seed}: invalid elapsed time.`);
    assert(Number.isFinite(run.metrics.served), `R${run.round}/${run.seed}: invalid served count.`);
    assert(run.metrics.manualDecisionsPerMinute === 0, `R${run.round}/${run.seed}: policy was not unattended.`);
    assert(typeof run.classification === 'string', `R${run.round}/${run.seed}: missing classification.`);
});

const envelopeClasses = new Set(['UNDERLOADED', 'CONTESTED', 'OVERLOADED', 'UNPROVEN']);
assert(envelope.schemaVersion === 1, 'Unsupported campaign envelope schema.');
assert(envelope.balanceVersion === balance.balanceVersion, 'Campaign envelope version is stale.');
assert(envelope.rounds.length === matrix.rounds.length, 'Campaign envelope has missing rounds.');
envelope.rounds.forEach(entry => {
    assert(matrix.rounds.includes(entry.round), `Campaign envelope has unexpected Round ${entry.round}.`);
    assert(envelopeClasses.has(entry.classification), `Round ${entry.round}: invalid envelope classification.`);
    assert(Number.isFinite(entry.unattended.averageUtilisationProxy), `Round ${entry.round}: invalid utilisation proxy.`);
    assert(Number.isFinite(entry.unattended.averageQueueTrend), `Round ${entry.round}: invalid queue trend.`);
    assert(entry.unattended.survivors >= 0 && entry.unattended.survivors <= matrix.seeds.length, `Round ${entry.round}: invalid unattended outcome count.`);
    assert(entry.strong.survivors >= 0 && entry.strong.survivors <= matrix.seeds.length, `Round ${entry.round}: invalid strong outcome count.`);
});

if (errors.length) {
    console.error(errors.map(error => `- ${error}`).join('\n'));
    process.exit(1);
}
console.log(`Balance reports valid: ${report.runs.length} floor runs, ${envelope.rounds.length} envelope classifications, ${report.summary.hardViolations} documented violations.`);
