// ============================================================================
// TESTS/SIMULATION-TESTS.JS : GAMEPLAY BASELINE VALIDATION
// ============================================================================

window.Game = window.Game || {};
window.Game.Tests = {
    /**
     * Runs a set of baseline tests to ensure game physics and serving logic
     * hasn't regressed during refactoring.
     */
    runAll: async function() {
        console.group("🚀 Running Simulation Test Suite");
        
        const results = [];
        
        // Test 1: Round 1 Baseline (Manual logic - should serve SOME guests if they spawn at 0)
        // Note: Without manual clicks, only guests who happen to be at G and want G (none) will be served? 
        // Actually, without clicks, manual lifts just sit at 0.
        // If a guest spawns at 0, they won't be served unless the lift moves.
        // Wait, if a guest spawns at 0, they board, but they won't leave unless lift moves to their floor.
        
        // Test 2: 'sweep' Automation Baseline
        results.push(this.testSweepAutomation());

        // Test 3: High Round Stress Test
        results.push(this.testRound7Stress());

        console.table(results);
        console.groupEnd();
        
        return results;
    },

    testSweepAutomation: async function() {
        console.log("Testing 'sweep' automation on Round 1...");
        const seed = 1234;
        const scripts = { 0: 'sweep' }; 
        const round = 1;

        const result = await window.Game.Simulator.runRound(seed, scripts, round);
        
        const passed = result.served > 0 && result.success;
        return {
            name: "Sweep Automation Baseline (R1)",
            passed: passed,
            served: result.served,
            message: passed ? "Passed" : "Failed (Served 0 or died)"
        };
    },

    testRound7Stress: async function() {
        console.log("Testing Round 7 Stress (15 floors, 3 lifts)...");
        const seed = 8888;
        const scripts = { 0: 'sweep', 1: 'sweep', 2: 'sweep' };
        const round = 7;

        const result = await window.Game.Simulator.runRound(seed, scripts, round);
        
        const passed = result.success; 
        return {
            name: "Round 7 Stress Test",
            passed: passed,
            served: result.served,
            message: passed ? "Survived" : "Failed (Total Defenestration)"
        };
    }
};
