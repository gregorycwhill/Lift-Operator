// ============================================================================
// ENGINE-SIMULATOR.JS : HEADLESS PHYSICS RUNNER (THE TIME-WARP)
// ============================================================================

window.Game = window.Game || {};

window.Game.Simulator = {
    /**
     * Runs a full round simulation headlessly.
     * @param {number} seed - The random seed to use.
     * @param {Object} scripts - Map of lift index to script code or script name.
     * @param {number} round - The round number to simulate.
     * @returns {Object} - The resulting round stats and success/fail state.
     */
    runRound: function(seed, scripts = {}, round = 1) {
        console.log(`[Simulator] Starting headless run for Round ${round} (Seed: ${seed})`);

        // 1. Backup Registry
        const backup = JSON.parse(JSON.stringify(Registry));
        const originalGameActive = Registry.gameActive;

        try {
            // 2. Setup Deterministic Environment
            setSeed(seed);
            Registry.seed = seed;
            
            // 3. Initialize the round headlessly
            // We call skipToRound but we must suppress UI
            const originalUI = window.Game.UI;
            window.Game.UI = {
                buildWorld: () => {},
                updateScoreboardUI: () => {},
                draw: () => {},
                showRoundModal: () => {},
                showRoundReview: () => {},
                updateLocksUI: () => {},
                showLeaderboard: () => {},
                updateLiftVisualState: () => {},
                updateLiftAutomationUI: () => {}
            };

            // Also suppress Audio
            const originalAudio = window.Game.Audio;
            window.Game.Audio = { play: () => {} };

            window.skipToRound(round);
            
            // 4. Inject Scripts
            Object.keys(scripts).forEach(liftIdx => {
                const scriptData = scripts[liftIdx];
                // If it's code, we might need to register it in AutomationWorkshop first
                // For now assume it's a script name or we use a temporary ID
                if (scriptData.startsWith('blockly:')) {
                    // It's raw XML/code, handle accordingly
                }
                Registry.lifts[liftIdx].automation = scriptData;
            });

            Registry.gameActive = true;
            let virtualTime = Date.now(); // Start from "now" but move forward manually
            window.Game.virtualTime = virtualTime;

            // 5. The Time Warp Loop
            // Round is Config.roundTime seconds (usually 60)
            const totalSeconds = Config.roundTime;
            const physicsStepMs = 1000;
            const animationStepMs = 16; // 60fps approx

            for (let sec = 0; sec < totalSeconds; sec++) {
                // Run Physics Tick
                window.gameTick(virtualTime);

                // Run 60 Animation Ticks for this second
                for (let a = 0; a < 60; a++) {
                    virtualTime += animationStepMs;
                    window.animationTick(virtualTime);
                }
                
                // If lives reached 0, game over
                if (Registry.stats.lives <= 0) break;
            }

            // 6. Capture Results
            const results = {
                served: Registry.stats.served,
                livesRemaining: Registry.stats.lives,
                roundStats: { ...Registry.roundStats },
                success: Registry.stats.lives > 0
            };

            console.log(`[Simulator] Completed. Served: ${results.served}, Lives: ${results.livesRemaining}`);
            return results;

        } catch (e) {
            console.error("[Simulator] Fatal Error:", e);
            return { error: e.message, success: false };
        } finally {
            // 7. Cleanup & Restore
            // Restore Registry keys manually because it's a const
            Object.assign(Registry, backup);
            Registry.gameActive = originalGameActive;
            window.Game.UI = originalUI;
            window.Game.Audio = originalAudio;
            delete window.Game.virtualTime;
        }
    }
};
