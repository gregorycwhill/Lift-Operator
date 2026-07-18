#!/usr/bin/env node
const fs = require('fs'); const file = process.argv[process.argv.indexOf('--candidate') + 1]; if (!file) throw new Error('--candidate is required'); const candidate = JSON.parse(fs.readFileSync(file, 'utf8')); console.log(JSON.stringify({ status: 'ROBUSTNESS_PENDING', round: candidate.round, candidate: candidate.candidate, requiredSeeds: 30 }));
