#!/usr/bin/env node
const protocol = {
    sessions: 3,
    rounds: [2, 7, 8, 9, 10, 11, 13],
    attemptsPerRound: 3,
    capture: ['completion', 'retry count', 'failure reason', 'loadout', 'manual interventions', 'credits before/after', 'free-form clarity/fun notes'],
    rule: 'Do not alter seed between retries; record why the player changed strategy.'
};
console.log(JSON.stringify({ schemaVersion: 1, protocol }));
