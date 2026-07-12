// ============================================================================
// UI-MANIFEST.JS : INBOUND TRANSMISSIONS & PAYLOAD PROCESSING
// ============================================================================

const GameEngine = () => (window.Game && window.Game.Engine) || window;
const GameUI = () => (window.Game && window.Game.UI) || window.UI || {};

/**
 * Process the next pending manifest item (shared data like seeds or blueprints).
 */
window.processNextManifestItem = function() {
    const ui = GameUI();
    if (!Registry.pendingManifest || Registry.pendingManifest.length === 0) {
        const overlay = document.getElementById('manifestOverlay');
        if (overlay) overlay.style.display = 'none';
        if (typeof ui.showRoundModal === 'function') {
            ui.showRoundModal(Registry.stats.round);
        }
        return;
    }

    const item = Registry.pendingManifest.shift();
    const manifestOverlay = document.getElementById('manifestOverlay');
    const instructionsEl = document.getElementById('manifestInstructions');
    const acceptBtn = document.getElementById('manifestAcceptBtn');
    const rejectBtn = document.getElementById('manifestRejectBtn');

    if (!manifestOverlay || !instructionsEl || !acceptBtn || !rejectBtn) return;

    let descText = "Foreign configuration telemetry package detected.";
    let acceptCallback = () => {};

    if (item.type === 'system' && item.data && item.data.mode === 'debug') {
        descText = "Inbound automated telemetry bundle containing Master Configuration overrides. Enable Sandbox Access?";
        acceptCallback = () => {
            Config.debugMode = true;
            Registry.points = 99999;
            Registry.highestUnlockedRound = 11;
            if (typeof ui.buildWorld === 'function') ui.buildWorld();
            if (typeof ui.updateLocksUI === 'function') ui.updateLocksUI();
            if (typeof ui.showToast === 'function') ui.showToast("🛠️ Sandbox Mode Deployed!");
        };
    } else if (item.type === 'leaderboard' && item.data) {
        descText = `Incoming Arcade Telemetry data transmission containing top scores. Open High Score Archive?`;
        acceptCallback = () => {
            window.Game.Storage.set(window.Game.Keys.LEADERBOARD, JSON.stringify(item.data));
            if (typeof ui.showLeaderboard === 'function') {
                ui.showLeaderboard("Shared High Scores");
            }
        };
    } else if (item.type === 'blueprint' && item.data) {
        descText = `Incoming Automation Blueprint transmission containing script configuration '${item.data.name}' authored by Pilot ${item.data.author || 'Unknown'}. Import to local Workshop profiles?`;
        acceptCallback = () => {
            if (typeof AutomationWorkshop !== 'undefined' && typeof LZString !== 'undefined') {
                try {
                    const decompressedBlockly = JSON.parse(LZString.decompressFromEncodedURIComponent(item.data.xml));
                    const newScriptObj = {
                        id: 'shared_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
                        name: item.data.name || "Imported Automation",
                        author: item.data.author || "Shared Pilot",
                        date: new Date().toLocaleDateString(),
                        description: "Shared script blueprint link.",
                        blocklyData: decompressedBlockly,
                        compiledJS: ""
                    };

                    const VM = window.Game.Automation;
                    if (VM) {
                        VM.scripts.push(newScriptObj);
                        VM.saveScripts();
                    } else if (typeof AutomationWorkshop !== 'undefined') {
                        AutomationWorkshop.scripts.push(newScriptObj);
                    }

                    if (typeof ui.updateWorkshopScriptList === 'function') ui.updateWorkshopScriptList();
                    if (typeof ui.buildWorld === 'function') ui.buildWorld();
                    if (typeof ui.showToast === 'function') {
                        ui.showToast(`🤖 Script '${newScriptObj.name}' saved to Workshop catalog.`);
                    }
                } catch (err) {
                    console.error("Blueprint compilation import error: ", err);
                }
            }
        };
    } else if (item.type === 'seed' || item.type === 'invite') {
        let incomingSeed = item.value || (item.data ? item.data.seed : null);
        descText = `Incoming Operational Shift Invitation. Synced core parameters requested. Calibrate board to Seed ID #${incomingSeed}?`;
        acceptCallback = () => {
            if (incomingSeed) {
                Registry.seed = parseInt(incomingSeed);
                window.Game.Seed.set(Registry.seed);
                const seedDisplay = document.getElementById('seedDisplay');
                if (seedDisplay) seedDisplay.innerText = Registry.seed;
                const seedInput = document.getElementById('gameSeed');
                if (seedInput) seedInput.value = Registry.seed;
                if (typeof ui.showToast === 'function') ui.showToast(`🎲 Configured Game Seed: ${Registry.seed}`);
            }
        };
    }

    instructionsEl.innerText = descText;
    manifestOverlay.style.display = 'flex';

    acceptBtn.onclick = null;
    rejectBtn.onclick = null;

    acceptBtn.onclick = () => {
        acceptCallback();
        window.processNextManifestItem();
    };

    rejectBtn.onclick = () => {
        if (typeof ui.showToast === 'function') ui.showToast("Transmission rejected cleanly.");
        window.processNextManifestItem();
    };
};
