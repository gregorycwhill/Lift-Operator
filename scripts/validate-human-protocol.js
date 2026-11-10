#!/usr/bin/env node
const protocol = {
    sessions: 2,
    rounds: [1, 2, 3, 5, 7, 10, 15, 18, 20, 21, 22, 23, 24, 25],
    attemptsPerRound: 2,
    requiredChecks: ['Sweep default/manual rescue', 'pet identity and filters', 'Pet Snacks/conflict/Stink', 'Checkout wave clarity', 'zoning independent of Sweep', 'one-transfer legibility', 'Best in Show decisions', 'capsule readability', 'legacy save recovery', 'no Rooftop music'],
    capture: ['completion', 'retry count', 'failure reason', 'loadout', 'manual interventions', 'credits before/after', 'pet/filter/transfer observations', 'free-form clarity/fun notes'],
    rule: 'Keep the seed fixed between retries; record why the player changed strategy. Do not delay the birthday build for non-P0 balance polish.'
};
console.log(JSON.stringify({ schemaVersion: 2, release: "Maries-Birthday-2026-11-08.4", protocol }));
