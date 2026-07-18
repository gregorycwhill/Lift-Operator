const crypto = require('crypto');
function normalize(value) { return JSON.stringify(value, Object.keys(value || {}).sort()); }
function hash(value) { return crypto.createHash('sha256').update(typeof value === 'string' ? value : normalize(value)).digest('hex'); }
function createReplay(metadata, actions, terminal) { return { schemaVersion: 1, metadata, actions, terminal, terminalHash: hash(terminal) }; }
function verifyReplay(replay, terminal) { return replay.terminalHash === hash(terminal); }
module.exports = { normalize, hash, createReplay, verifyReplay };
