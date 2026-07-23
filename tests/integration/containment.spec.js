const { test, expect } = require('@playwright/test');
const { startTestServer } = require('../test-server');

const GAME_URL = 'http://127.0.0.1:5500/index.html';
let testServer;

test.beforeAll(async () => { testServer = await startTestServer(); });
test.afterAll(async () => { if (testServer) await new Promise(resolve => testServer.close(resolve)); });
test.beforeEach(async ({ page }) => { await page.goto(GAME_URL); });

test('blueprint import requires supported schema, checksum, and explicit consent', async ({ page }) => {
    const result = await page.evaluate(() => {
        const data = {
            schema: 'lift-operator-blueprint', schemaVersion: 1, name: 'Safe Import',
            description: 'A checked blueprint', author: 'Pilot Test', version: '1.0', xml: 'payload'
        };
        data.checksum = Game.Blueprints.checksum(data);
        const valid = Game.Blueprints.validate(data);
        const tampered = Game.Blueprints.validate({ ...data, name: 'Tampered' });
        Registry.pendingManifest = [{ type: 'blueprint', data }];
        processNextManifestItem();
        return {
            valid, tampered,
            prompt: document.getElementById('manifestInstructions').innerText,
            scriptsBeforeConsent: Game.Automation.scripts.filter(script => script.name === data.name).length
        };
    });
    expect(result.valid.valid).toBe(true);
    expect(result.tampered.valid).toBe(false);
    expect(result.prompt).toContain('explicitly consent');
    expect(result.scriptsBeforeConsent).toBe(0);
});

test('custom automation worker terminates an over-deadline script without blocking the page', async ({ page }) => {
    const result = await page.evaluate(async () => {
        const vm = Game.Automation;
        const lift = Registry.lifts[0];
        const script = { id: 'timeout-check', name: 'Timeout Check', compiledJS: 'while (true) {}' };
        const originalDeadline = vm.executionDeadlineMs;
        vm.executionDeadlineMs = 20;
        vm.executeIsolated(lift, script, script.id);
        await new Promise(resolve => setTimeout(resolve, 80));
        vm.executionDeadlineMs = originalDeadline;
        return { pending: vm.pendingWorkers.size, responsive: document.readyState, target: lift.targetFloor };
    });
    expect(result.pending).toBe(0);
    expect(result.responsive).toBe('complete');
    expect(result.target).toBeGreaterThanOrEqual(0);
});

test('custom automation applies only validated worker actions', async ({ page }) => {
    const result = await page.evaluate(async () => {
        const vm = Game.Automation;
        const lift = Registry.lifts[0];
        const script = { id: 'worker-action', name: 'Worker Action', compiledJS: 'Building.setTarget(2); lift.sweepDirection = -1;', author: 'Pilot 1' };
        vm.execute(lift, script.id);
        vm.executeIsolated(lift, script, script.id);
        await new Promise(resolve => setTimeout(resolve, 500));
        return { target: lift.targetFloor, direction: lift.sweepDirection, ticks: Registry.customScriptTicks };
    });
    expect(result.target).toBe(2);
    expect(result.direction).toBe(-1);
    expect(result.ticks).toBeGreaterThan(0);
});
