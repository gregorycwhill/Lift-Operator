const fs = require('fs');
const handoff = fs.readFileSync('IMPLEMENTATION_HANDOFF.md', 'utf8');
const checks = {
    baselineTests: true,
    simulationReplay: true,
    compactReporting: true,
    correctnessContainment: true,
    canonicalPromotion: false,
    campaignBalance: false,
    humanEvidence: false,
    ownerEconomyDecision: handoff.includes('Owner decision') && handoff.includes('economy')
};
const blocked = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
console.log(JSON.stringify({ complete: blocked.length === 0, checks, blocked }));
