// ============================================================================
// ENGINE-SIMULATOR.JS : ISOLATED HEADLESS PHYSICS RUNNER
// ============================================================================

window.Game = window.Game || {};

window.Game.Simulator = {
    /**
     * Runs a simulation in a disposable same-origin browser realm.
     * The iframe owns its own Registry, Config mutations, timers, and random stream.
     */
    runRound: async function(seed, scripts = {}, round = 1) {
        const frame = document.createElement('iframe');
        frame.hidden = true;
        frame.setAttribute('aria-hidden', 'true');
        frame.src = `${window.location.pathname}?simulation=true`;
        document.body.appendChild(frame);

        try {
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Simulation realm failed to load.')), 10000);
                frame.onload = () => {
                    clearTimeout(timeout);
                    resolve();
                };
                frame.onerror = () => {
                    clearTimeout(timeout);
                    reject(new Error('Simulation realm failed to load.'));
                };
            });

            const simulator = frame.contentWindow &&
                frame.contentWindow.Game &&
                frame.contentWindow.Game.Simulator;
            if (!simulator || typeof simulator.runRoundLocal !== 'function') {
                throw new Error('Simulation realm did not initialize.');
            }

            return await simulator.runRoundLocal(seed, scripts, round);
        } catch (error) {
            console.error('[Simulator] Fatal Error:', error);
            return { error: error.message, success: false };
        } finally {
            frame.remove();
        }
    },

    /**
     * Internal worker used only inside the disposable simulation realm.
     */
    runRoundLocal: async function(seed, scripts = {}, round = 1) {
        console.log(`[Simulator] Starting isolated run for Round ${round} (Seed: ${seed})`);

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

        Registry.autoPilotActive = false;
        Registry.seed = seed;
        const virtualStart = 1000000;
        window.Game.virtualTime = virtualStart;
        window.initializeRound(round, {
            now: virtualStart,
            showBriefing: false
        });

        Object.keys(scripts).forEach(liftIndex => {
            if (Registry.lifts[liftIndex]) {
                Registry.lifts[liftIndex].automation = scripts[liftIndex];
            }
        });

        Registry.gameActive = true;
        let virtualTime = virtualStart;
        const totalSeconds = Config.roundTime;
        const animationStepMs = 16;

        for (let second = 0; second < totalSeconds; second++) {
            await new Promise(resolve => setTimeout(resolve, 0));
            if (!Registry.gameActive) break;

            window.gameTick(virtualTime);
            for (let frame = 0; frame < 60; frame++) {
                virtualTime += animationStepMs;
                window.animationTick(virtualTime);
            }

            if (Registry.stats.lives <= 0) break;
        }

        const result = {
            served: Registry.stats.served,
            livesRemaining: Registry.stats.lives,
            timeLeft: Registry.stats.timeLeft,
            roundStats: JSON.parse(JSON.stringify(Registry.roundStats)),
            success: Registry.stats.lives > 0,
            designTelemetry: window.Game.BalanceTelemetry.export()
        };

        console.log(`[Simulator] Completed. Served: ${result.served}, Lives: ${result.livesRemaining}`);
        return result;
    }
};
