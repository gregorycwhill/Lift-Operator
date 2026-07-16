const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const design = JSON.parse(fs.readFileSync(path.join(root, 'design', 'game-balance.v1.json'), 'utf8'));
const generatedSource = fs.readFileSync(path.join(root, 'generated', 'game-balance.js'), 'utf8');
const configSource = fs.readFileSync(path.join(root, 'config.js'), 'utf8');
const context = {
    console,
    window: {},
    localStorage: {
        getItem: () => null,
        setItem: () => {}
    }
};
context.window.window = context.window;
context.window.localStorage = context.localStorage;
vm.createContext(context);
vm.runInContext(generatedSource, context, { filename: 'generated/game-balance.js' });
vm.runInContext(`${configSource}\nwindow.__validatedConfig = Config;`, context, { filename: 'config.js' });

const config = context.window.__validatedConfig;
const errors = [];
const assert = (condition, message) => {
    if (!condition) errors.push(message);
};

assert(typeof design.balanceVersion === 'string' && design.balanceVersion.length > 0, 'Missing balanceVersion.');
assert(config.balanceVersion === design.balanceVersion, 'Runtime balance version differs from canonical design data.');
assert(
    JSON.stringify(config.GAME_DATA) === JSON.stringify(design),
    'Generated runtime balance data differs from canonical design data.'
);

const rounds = design.rounds;
for (let round = 1; round <= 13; round++) {
    const value = rounds[round];
    assert(value, `Missing round ${round}.`);
    if (!value) continue;
    assert(Number.isInteger(value.floors) && value.floors > 1, `Round ${round}: invalid floors.`);
    assert(Number.isInteger(value.lifts) && value.lifts > 0, `Round ${round}: invalid lifts.`);
    assert(value.spawnStart > 0 && value.spawnEnd > 0, `Round ${round}: invalid spawn curve.`);
    assert(value.spawnEnd >= value.spawnStart, `Round ${round}: spawn curve decreases.`);
    assert(['SURVIVAL', 'ENDURANCE', 'PEDAL_SURVIVAL', 'QUOTA'].includes(value.objective), `Round ${round}: invalid objective.`);
}

assert(rounds[12].objective === 'ENDURANCE', 'Round 12 must be Endurance.');
assert(rounds[12].quota === undefined, 'Round 12 must not have a quota.');

Object.entries(design.powerups).forEach(([id, powerup]) => {
    assert(Array.isArray(powerup.tiers) && powerup.tiers.length === 3, `${id}: expected three tiers.`);
    let priorCost = -1;
    powerup.tiers.forEach((tier, index) => {
        assert(Number.isFinite(tier.cost) && tier.cost >= 0, `${id} tier ${index + 1}: invalid cost.`);
        assert(tier.cost >= priorCost, `${id}: tier costs must not decrease.`);
        priorCost = tier.cost;
        if (tier.duration !== undefined) {
            assert(Number.isFinite(tier.duration) && tier.duration >= 0, `${id} tier ${index + 1}: invalid duration.`);
        }
    });
});

Object.entries(design.achievements).forEach(([id, achievement]) => {
    assert(achievement.id === id, `${id}: achievement id mismatch.`);
    let priorRequirement = -1;
    for (const tierName of ['bronze', 'silver', 'gold']) {
        const tier = achievement[tierName];
        assert(tier && Number.isFinite(tier.req) && tier.req >= 0, `${id} ${tierName}: invalid requirement.`);
        assert(tier && Number.isFinite(tier.reward) && tier.reward >= 0, `${id} ${tierName}: invalid reward.`);
        if (tier) {
            assert(tier.req >= priorRequirement, `${id}: achievement requirements must not decrease.`);
            priorRequirement = tier.req;
        }
    }
});

const probabilities = [
    ['checkoutChance', design.system.checkoutChance],
    ['roomServiceChance', design.system.roomServiceChance],
    ['jam.chancePerSec', design.system.jam.chancePerSec],
    ['stink.chancePerSec', design.system.stink.chancePerSec],
    ['sunset.guestRatio', design.system.sunset.guestRatio]
];
probabilities.forEach(([name, value]) => {
    assert(Number.isFinite(value) && value >= 0 && value <= 1, `${name}: probability must be between 0 and 1.`);
});

const patience = design.system.patience;
assert(
    patience.happy < patience.annoyed &&
    patience.annoyed < patience.critical &&
    patience.critical < patience.rage,
    'Patience thresholds must increase.'
);

if (errors.length) {
    console.error(errors.map(error => `- ${error}`).join('\n'));
    process.exit(1);
}

console.log(`Config valid: balance ${design.balanceVersion}, 13 rounds, ${Object.keys(design.powerups).length} power-ups.`);
