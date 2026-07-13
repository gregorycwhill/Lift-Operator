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
    runRound: async function(seed, scripts = {}, round = 1) {
        console.log(`[Simulator] Starting headless run for Round ${round} (Seed: ${seed})`);

        // 1. Backup Registry
        const backup = JSON.parse(JSON.stringify(Registry));
        const originalGameActive = Registry.gameActive;
        const originalUI = window.Game.UI;
        const originalAudio = window.Game.Audio;

        try {
            // 2. Setup Deterministic Environment
            setSeed(seed);
            Registry.seed = seed;
            
            // 3. Initialize the round headlessly
            window.Game.UI = {
                buildWorld: () => {},
                updateScoreboardUI: () => {},
                draw: () => {},
                showRoundModal: () => {},
                showRoundReview: () => {},
                updateLocksUI: () => {},
                showLeaderboard: () => {},
                updateLiftVisualState: () => {},
                updateLiftAutomationUI: () => {},
                triggerDefenestration: () => {}
            };

            window.Game.Audio = { play: () => {} };

            window.skipToRound(round);
            
            // Re-initialize floors AFTER skipToRound to ensure dimensions match target Round
            Registry.floors = Array.from({length: Config.numFloors}, () => ({ waitingGuests: [] }));

            Object.keys(scripts).forEach(liftIdx => {
                const scriptData = scripts[liftIdx];
                Registry.lifts[liftIdx].automation = scriptData;
            });

            Registry.gameActive = true;
            let virtualTime = Date.now(); 
            window.Game.virtualTime = virtualTime;

            const totalSeconds = Config.roundTime;
            const animationStepMs = 16; 

            for (let sec = 0; sec < totalSeconds; sec++) {
                await new Promise(r => setTimeout(r, 0));
                if (!Registry.gameActive) break;

                window.gameTick(virtualTime);

                for (let a = 0; a < 60; a++) {
                    virtualTime += animationStepMs;
                    window.animationTick(virtualTime);
                }
                
                if (Registry.stats.lives <= 0) break;
            }

            const results = {
                served: Registry.stats.served,
                livesRemaining: Registry.stats.lives,
                timeLeft: Registry.stats.timeLeft,
                roundStats: JSON.parse(JSON.stringify(Registry.roundStats)),
                success: Registry.stats.lives > 0
            };

            console.log(`[Simulator] Completed. Served: ${results.served}, Lives: ${results.livesRemaining}`);
            return results;

        } catch (e) {
            console.error("[Simulator] Fatal Error:", e);
            return { error: e.message, success: false };
        } finally {
            Object.keys(backup).forEach(key => {
                Registry[key] = backup[key];
            });
            window.Game.UI = originalUI;
            window.Game.Audio = originalAudio;
            Registry.gameActive = originalGameActive;
            delete window.Game.virtualTime;
        }
    }
};
