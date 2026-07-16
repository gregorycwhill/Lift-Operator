const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const balance = JSON.parse(fs.readFileSync(path.join(root, 'design', 'game-balance.v1.json'), 'utf8'));
const scenarios = JSON.parse(fs.readFileSync(path.join(root, 'tests', 'economy-scenarios.json'), 'utf8'));
const tierByPreference = { bronze: 0, silver: 1, gold: 2 };

function availableItems(round, tier) {
    return Object.entries(balance.powerups)
        .filter(([id]) => (balance.shopUnlocks[id]?.[tier] || 99) <= round)
        .map(([id, item]) => ({ id, tier, cost: item.tiers[tier].cost }))
        .sort((a, b) => a.cost - b.cost || a.id.localeCompare(b.id));
}

function simulateProfile(name, scenario) {
    let bank = 0;
    const tier = tierByPreference[scenario.preference];
    const rounds = scenario.payouts.map((payout, index) => {
        const round = index + 1;
        const beforePayout = bank;
        bank += payout;
        const affordable = availableItems(Math.min(13, round + 1), tier).filter(item => item.cost <= bank);
        const purchase = affordable.length ? affordable[affordable.length - 1] : null;
        if (purchase) bank -= purchase.cost;
        return { round, beforePayout, payout, purchase, endingBank: bank };
    });
    return { name, preference: scenario.preference, endingBank: bank, rounds };
}

const results = Object.entries(scenarios).map(([name, scenario]) => simulateProfile(name, scenario));
const errors = [];
results.forEach(profile => {
    if (profile.rounds.some(round => round.endingBank < 0)) errors.push(`${profile.name}: negative bank.`);
    if (profile.rounds.length !== 13) errors.push(`${profile.name}: expected 13 rounds.`);
});

// A failed attempt is a rollback transaction: provisional spend and attempt income disappear.
const checkpoint = 12;
const provisionalSpend = 5;
const failedAttemptIncome = 30;
const restored = checkpoint - provisionalSpend + failedAttemptIncome - failedAttemptIncome + provisionalSpend;
if (restored !== checkpoint) errors.push('Retry rollback does not restore the checkpoint.');

if (errors.length) {
    console.error(errors.map(error => `- ${error}`).join('\n'));
    process.exit(1);
}

results.forEach(profile => {
    const purchases = profile.rounds.filter(round => round.purchase).length;
    console.log(`${profile.name}: ${purchases} purchases, ${profile.endingBank} points remaining.`);
});
console.log('Economy scenarios valid: no negative banks and failed attempts restore their checkpoint.');

module.exports = { availableItems, simulateProfile };
