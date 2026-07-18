#!/usr/bin/env node
/* Promotion is intentionally explicit and conservative. Exploration artifacts
 * never mutate canonical balance; this command requires a fully gated candidate. */
const fs = require('fs'); const path = require('path');
const file = process.argv[process.argv.indexOf('--candidate') + 1];
if (!file) throw new Error('--candidate is required');
const candidate = JSON.parse(fs.readFileSync(file, 'utf8'));
const required = ['schemaVersion', 'round', 'candidate', 'runs'];
const missing = required.filter(key => candidate[key] === undefined);
if (missing.length) throw new Error(`Candidate is incomplete: ${missing.join(', ')}`);
const failures = (candidate.runs || []).filter(run => run.unattended || !run.strong);
if (failures.length) throw new Error(`Candidate fails release gate for ${failures.length} seed(s).`);
if (candidate.source !== 'accepted-owner-candidate') {
    throw new Error('Promotion requires an owner-accepted candidate artifact; exploratory overlays are not promotable.');
}
const canonical = path.resolve(__dirname, '..', 'design', 'game-balance.v1.json');
console.log(`Promotion ready for ${canonical}. No files changed; use an accepted-owner-candidate artifact after final review.`);
