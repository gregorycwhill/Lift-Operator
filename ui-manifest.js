// ============================================================================
// UI-MANIFEST.JS : INBOUND TRANSMISSIONS & PAYLOAD PROCESSING
// ============================================================================

/**
 * Process the next pending manifest item (shared data like seeds or blueprints).
 */
window.processNextManifestItem = function() {
    const engine = GameEngine();
    const ui = GameUI();
    
    if (!Registry.pendingManifest || Registry.pendingManifest.length === 0) {
        const overlay = document.getElementById('manifestOverlay');
        if (overlay) overlay.style.display = 'none';
        
        // Return to Briefing if it was shown before
        if (typeof ui.showRoundModal === 'function') {
            ui.showRoundModal(Registry.stats.round);
        }
        return;
    }

    // Pause physics/spawning while the gateway is active
    if (typeof engine.pauseGame === 'function') {
        engine.pauseGame();
    } else if (typeof engine.pause === 'function') {
        engine.pause();
    }

    const item = Registry.pendingManifest.shift();
    const manifestOverlay = document.getElementById('manifestOverlay');
    const manifestTitle = document.getElementById('manifestTitle');
    const instructionsEl = document.getElementById('manifestInstructions');
    const acceptBtn = document.getElementById('manifestAcceptBtn');
    const rejectBtn = document.getElementById('manifestRejectBtn');

    if (!manifestOverlay || !instructionsEl || !acceptBtn || !rejectBtn) return;

    // Reset UI state for next item
    if (manifestTitle) manifestTitle.innerText = "⚠️ System Message";
    instructionsEl.style.fontSize = "14px";

    let descText = "Foreign configuration telemetry package detected.";
    let acceptCallback = () => {};

    // 1.2 Manifest Gateway Switch-Controller
    switch (item.type) {
        case 'seed':
            descText = `Foreign seed detected: ${item.value}. Apply this environment seed to your current shift?`;
            acceptCallback = () => {
                Registry.seed = item.value;
                window.setSeed(Registry.seed);
                if (typeof ui.buildWorld === 'function') ui.buildWorld();
                if (typeof ui.showToast === 'function') ui.showToast(`🌱 Seed ${item.value} Applied!`);
            };
            break;

        case 'challenge':
            const cData = item.data || {};
            descText = `⚠️ CHALLENGE PROTOCOL DETECTED: '${cData.name || "Unknown Challenge"}'\n` +
                       `Parameters: Seed ${cData.seed}, Lives: ${cData.lives || 20}, Round: ${cData.round || 1}.\n` +
                       `Accept restricted operational conditions?`;
            acceptCallback = () => {
                Registry.seed = cData.seed || 1234;
                Registry.stats.lives = cData.lives || 20;
                Registry.stats.round = cData.round || 1;
                if (cData.time) Config.roundTime = cData.time;
                
                window.setSeed(Registry.seed);
                if (typeof ui.buildWorld === 'function') ui.buildWorld();
                if (typeof ui.showToast === 'function') ui.showToast("🏆 Challenge Accepted!");
            };
            break;

        case 'system':
            if (item.data && item.data.mode === 'debug') {
                descText = "Inbound automated telemetry bundle containing Master Configuration overrides. Enable Sandbox Access?";
                acceptCallback = () => {
                    Config.debugMode = true;
                    Registry.points = 99999;
                    Registry.highestUnlockedRound = 11;
                    if (typeof ui.buildWorld === 'function') ui.buildWorld();
                    if (typeof ui.updateLocksUI === 'function') ui.updateLocksUI();
                    if (typeof ui.showToast === 'function') ui.showToast("🛠️ Sandbox Mode Deployed!");
                };
            }
            break;

        case 'debug_override':
            descText = "Enable Debug mode for testing?";
            instructionsEl.style.fontSize = "22px";
            instructionsEl.style.fontWeight = "bold";
            instructionsEl.style.textAlign = "center";
            
            acceptCallback = () => {
                Config.debugMode = true;
                Registry.points = 99999;
                Registry.highestUnlockedRound = 13;
                
                if (item.overrides) {
                    console.log("Applying Overrides:", item.overrides);
                    if (item.overrides.system) Object.assign(Config, item.overrides.system);
                    if (item.overrides.rounds) {
                        Object.keys(item.overrides.rounds).forEach(r => {
                            if (Config.GAME_DATA.rounds[r]) {
                                Object.assign(Config.GAME_DATA.rounds[r], item.overrides.rounds[r]);
                            }
                        });
                    }
                }
                
                if (typeof ui.buildWorld === 'function') ui.buildWorld();
                if (typeof ui.updateLocksUI === 'function') ui.updateLocksUI();
                if (typeof window.refreshDebugVisibility === 'function') window.refreshDebugVisibility();
                if (typeof ui.showToast === 'function') ui.showToast("🔓 Root Overrides Applied!");
            };
            break;

        case 'leaderboard':
            descText = `Incoming Arcade Telemetry data transmission containing top scores. Open High Score Archive?`;
            acceptCallback = () => {
                window.Game.Storage.set(window.Game.Keys.LEADERBOARD, JSON.stringify(item.data));
                if (typeof ui.showLeaderboard === 'function') {
                    ui.showLeaderboard("Shared High Scores");
                }
            };
            break;

        case 'blueprint':
            const bData = item.data || {};
            const bpName = bData.name || "Imported Automation";
            
            // Conflict Detection
            const VM = window.Game.Automation;
            const scripts = VM ? VM.scripts : (typeof AutomationWorkshop !== 'undefined' ? AutomationWorkshop.scripts : []);
            const conflict = scripts.find(s => s.name === bpName);
            
            if (conflict) {
                descText = `⚠️ NAMING CONFLICT: A script named '${bpName}' already exists in your Workshop.\n` +
                           `Importing this will create a duplicate. Continue with import?`;
            } else {
                descText = `Incoming Automation Blueprint: '${bpName}' authored by Pilot ${bData.author || 'Unknown'}.\n` +
                           `Import to local Workshop profiles?`;
            }

            acceptCallback = () => {
                if (typeof LZString !== 'undefined') {
                    try {
                        const decompressedBlockly = JSON.parse(LZString.decompressFromEncodedURIComponent(bData.xml));
                        const newScriptObj = {
                            id: 'shared_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
                            name: bpName,
                            author: bData.author || "Shared Pilot",
                            date: new Date().toLocaleDateString(),
                            description: bData.desc || "Shared script blueprint link.",
                            blocklyData: decompressedBlockly,
                            compiledJS: "",
                            version: bData.v || "1.0"
                        };

                        if (VM) {
                            VM.scripts.push(newScriptObj);
                            VM.saveScripts();
                        } else if (typeof AutomationWorkshop !== 'undefined') {
                            AutomationWorkshop.scripts.push(newScriptObj);
                        }

                        if (typeof ui.updateWorkshopScriptList === 'function') ui.updateWorkshopScriptList();
                        if (typeof ui.buildWorld === 'function') ui.buildWorld();
                        if (typeof ui.showToast === 'function') {
                            ui.showToast(`🤖 Script '${bpName}' saved.`);
                        }
                    } catch (err) {
                        console.error("Blueprint import error: ", err);
                        if (typeof ui.showToast === 'function') ui.showToast("❌ Error: Blueprint corrupted.");
                    }
                }
            };
            break;

        case 'seed':
        case 'invite':
            let incomingSeed = item.value || (item.data ? item.data.seed : null);
            descText = `Incoming Operational Shift Invitation. Synced core parameters requested. Calibrate board to Seed ID #${incomingSeed}?`;
            acceptCallback = () => {
                if (incomingSeed) {
                    Registry.seed = parseInt(incomingSeed);
                    window.setSeed(Registry.seed);
                    const seedDisplay = document.getElementById('seedDisplay');
                    if (seedDisplay) seedDisplay.innerText = Registry.seed;
                    const seedInput = document.getElementById('gameSeed');
                    if (seedInput) seedInput.value = Registry.seed;
                    if (typeof ui.showToast === 'function') ui.showToast(`🎲 Configured Game Seed: ${Registry.seed}`);
                }
            };
            break;

        default:
            descText = `Detected unknown payload type: '${item.type}'. Attempt decryption anyway?`;
            acceptCallback = () => {
                console.log("Attempting unknown payload handling:", item);
            };
    }

    // Preserve UI alignment
    instructionsEl.style.whiteSpace = "pre-line";
    instructionsEl.innerText = descText;
    manifestOverlay.style.display = 'flex';

    acceptBtn.onclick = () => {
        acceptCallback();
        window.processNextManifestItem();
    };

    rejectBtn.onclick = () => {
        if (typeof ui.showToast === 'function') ui.showToast("Transmission rejected.");
        window.processNextManifestItem();
    };
};
