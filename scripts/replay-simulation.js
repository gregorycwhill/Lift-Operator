#!/usr/bin/env node
const fs = require('fs'); const { verifyReplay } = require('../tests/simulation/replay');
const file = process.argv[process.argv.indexOf('--record') + 1]; if (!file) throw new Error('--record is required'); const replay = JSON.parse(fs.readFileSync(file, 'utf8')); if (!verifyReplay(replay, replay.terminal)) throw new Error('Replay terminal hash mismatch'); console.log(`Replay verified: ${file}`);
