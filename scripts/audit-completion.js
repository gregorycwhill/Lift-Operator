const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));

// This is a release-hygiene audit, not a claim that the product is ready.  It
// deliberately reports unfinished acceptance work separately from missing
// infrastructure so an old handoff cannot make the audit crash.
const checks = {
    activeDocumentation: ['README.md', 'DOCUMENTATION.md', 'ROADMAP.md', 'DELIVERY_PLAN.md', 'TEST_PLAN.md']
        .every(exists),
    canonicalBalance: exists('design/game-balance.v1.json') && exists('generated/game-balance.js'),
    acceptancePolicy: exists('tests/balance-acceptance.json') && exists('scripts/run-balance-acceptance.js') && exists('scripts/validate-balance-acceptance.js'),
    economyProjection: exists('tests/economy-scenarios.json') && read('scripts/simulate-economy.js').includes("path.join(root, 'design', 'game-balance.v1.json')") && read('scripts/simulate-economy.js').includes('Object.keys(balance.rounds).length'),
    productionTargetRouting: read('engine-simulator.js').includes('window.setLiftTarget') && read('engine-simulator.js').includes('window.setLiftAutomation'),
    legacyHandoffRetired: !exists('IMPLEMENTATION_HANDOFF.md'),
    balanceAcceptancePass: false,
    humanEvidence: false
};

const blocked = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
console.log(JSON.stringify({
    complete: blocked.length === 0,
    checks,
    blocked,
    note: 'balanceAcceptancePass and humanEvidence require the release gate and playtest evidence; this audit does not infer either.'
}, null, 2));
process.exitCode = blocked.length ? 1 : 0;
