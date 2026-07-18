const test = require('node:test');
const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const path = require('node:path');

test('first-party repository text is valid UTF-8', () => {
    const root = path.resolve(__dirname, '..', '..');
    const result = childProcess.spawnSync(process.execPath, ['scripts/validate-utf8.js'], {
        cwd: root,
        encoding: 'utf8'
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /UTF-8 valid:/);
});
