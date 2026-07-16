const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.resolve(__dirname, '..', 'config.js'), 'utf8');
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
vm.runInContext(`${source}\nwindow.__validatedConfig = Config;`, context, { filename: 'config.js' });

const config = context.window.__validatedConfig;
const errors = [];
const assert = (condition, message) => {
    if (!condition) errors.push(message);
};

assert(typeof config.balanceVersion === 'string' && config.balanceVersion.length > 0, 'Missing balanceVersion.');

const rounds = config.GAME_DATA.rounds;
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

Object.entries(config.GAME_DATA.powerups).forEach(([id, powerup]) => {
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

const patience = config.GAME_DATA.system.patience;
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

console.log(`Config valid: balance ${config.balanceVersion}, 13 rounds, ${Object.keys(config.GAME_DATA.powerups).length} power-ups.`);
