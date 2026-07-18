function percentile(values, p) { const sorted = [...values].sort((a, b) => a - b); return sorted.length ? sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1)] : 0; }
function derive(result) {
    const stats = result.roundStats || {}; const journeys = stats.journeyTimes || [];
    return { outcome: result.success ? 'survived' : 'died', elapsedSeconds: result.elapsedSeconds || 0, livesRemaining: result.livesRemaining || 0, guestsServed: result.served || 0, journeyMean: journeys.length ? journeys.reduce((a, b) => a + b, 0) / journeys.length : 0, journeyMedian: percentile(journeys, .5), journeyP90: percentile(journeys, .9), actionCount: stats.manualClicks || 0 };
}
function aggregate(records) { return { count: records.length, survivors: records.filter(r => r.outcome === 'survived').length, medianElapsed: percentile(records.map(r => r.elapsedSeconds), .5), p90Journey: percentile(records.map(r => r.journeyP90), .9) }; }
module.exports = { percentile, derive, aggregate };
