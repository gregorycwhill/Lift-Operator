const os = require('os');
const path = require('path');
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
    testMatch: '**/*.spec.js',
    outputDir: path.join(os.tmpdir(), 'lift-operator-playwright-results'),
    timeout: 600000,
    expect: {
        timeout: 10000
    },
    fullyParallel: false,
    workers: 1,
    reporter: [
        ['list']
    ],
    use: {
        headless: true,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure'
    }
});
