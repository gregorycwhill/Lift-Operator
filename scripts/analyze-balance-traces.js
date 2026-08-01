const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const report = JSON.parse(fs.readFileSync(path.join(root, 'reports', 'campaign-balance-acceptance.json'), 'utf8'));
const args = process.argv.slice(2);
const roundArg = args.indexOf('--rounds');
const rounds = roundArg >= 0
    ? args[roundArg + 1].split(',').map(Number)
    : [2, 3, 4, 5, 6];

const average = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const format = value => Number(value.toFixed(1));

for (const round of rounds) {
    const entry = report.rounds.find(candidate => candidate.round === round);
    if (!entry) throw new Error(`R${round} is not present in the acceptance report.`);
    const runs = entry.intended.runs;
    const rows = runs.map(run => {
        const diagnostics = run.metrics.diagnostics;
        const totals = diagnostics?.totals || {};
        const liftRows = Object.values(diagnostics?.lifts || {});
        return {
            seed: run.seed,
            success: run.metrics.success,
            elapsed: run.metrics.elapsedSeconds,
            boardings: totals.boardings || 0,
            served: totals.served || 0,
            refusals: totals.refusals || 0,
            directionOrCompatibility: totals.refusalCauses?.directionOrCompatibility || 0,
            capacityRefusals: totals.refusalCauses?.capacity || 0,
            refusalReasons: totals.refusalCauses?.byReason || {},
            lifeLossCauses: totals.lifeLossCauses || {},
            acceptedTargets: totals.acceptedTargets || 0,
            rejectedTargets: totals.rejectedTargets || 0,
            maxLoad: Math.max(0, ...liftRows.map(lift => lift.maxPassengers || 0)),
            averageLoad: average(liftRows.flatMap(lift => lift.passengerSamples ? [lift.passengerTotal / lift.passengerSamples] : [])),
            lifeLosses: totals.lifeLosses || 0
        };
    });
    console.log(`R${round} (${runs[0]?.profileId || 'profile unavailable'})`);
    console.table(rows);
    console.log(JSON.stringify({
        round,
        survivalRate: format(rows.filter(row => row.success).length / rows.length),
        averageBoardings: format(average(rows.map(row => row.boardings))),
        averageServed: format(average(rows.map(row => row.served))),
        averageRefusals: format(average(rows.map(row => row.refusals))),
        averageDirectionOrCompatibility: format(average(rows.map(row => row.directionOrCompatibility))),
        averageCapacityRefusals: format(average(rows.map(row => row.capacityRefusals))),
        refusalReasons: rows.reduce((result, row) => {
            Object.entries(row.refusalReasons).forEach(([reason, value]) => {
                result[reason] = (result[reason] || 0) + value;
            });
            return result;
        }, {}),
        lifeLossCauses: rows.reduce((result, row) => {
            Object.entries(row.lifeLossCauses).forEach(([cause, value]) => {
                result[cause] = (result[cause] || 0) + value;
            });
            return result;
        }, {}),
        averageAcceptedTargets: format(average(rows.map(row => row.acceptedTargets))),
        averageRejectedTargets: format(average(rows.map(row => row.rejectedTargets))),
        averageMaxLoad: format(average(rows.map(row => row.maxLoad))),
        averageLoad: format(average(rows.map(row => row.averageLoad))),
        averageLifeLosses: format(average(rows.map(row => row.lifeLosses)))
    }));
}
