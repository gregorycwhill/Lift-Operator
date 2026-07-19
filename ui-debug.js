// ============================================================================
// UI-DEBUG.JS : GAME ENGINE CONFIGURATION & SANDBOX CONTROLS
// ============================================================================

/**
 * Render the dynamic debug menu with configuration sliders.
 */
window.renderDebugMenu = function() {
    const ui = GameUI();
    const engine = GameEngine();
    const container = document.getElementById('debugControls');
    if (!container) return;
    container.innerHTML = '';
    
    // Quick Actions Group
    const quickGroup = document.createElement('div');
    quickGroup.style.padding = "10px";
    quickGroup.style.background = "#ecf0f1";
    quickGroup.style.display = "flex";
    quickGroup.style.gap = "8px";
    quickGroup.style.borderBottom = "2px solid #bdc3c7";
    
    const resetAwardsBtn = document.createElement('button');
    resetAwardsBtn.className = "btn btn-red btn-small";
    resetAwardsBtn.innerText = "🔄 Reset Career Medals";
    resetAwardsBtn.onclick = () => {
        const currentPlayer = Registry.playerName || window.Game.Storage.get(window.Game.Keys.PLAYER, 'Pilot 1');
        localStorage.removeItem(window.Game.Keys.ACHIEVEMENTS + currentPlayer);
        localStorage.removeItem(window.Game.Keys.TROPHIES);
        Registry.trophyCase = [];
        if (typeof ui.showToast === 'function') ui.showToast("Wiped career achievement storage map.");
    };
    quickGroup.appendChild(resetAwardsBtn);

    const runTestsBtn = document.createElement('button');
    runTestsBtn.className = "btn btn-blue btn-small";
    runTestsBtn.innerText = "🧪 Run Simulation Tests";
    runTestsBtn.onclick = async () => {
        if (typeof window.Game.Tests !== 'undefined' && typeof window.Game.Tests.runAll === 'function') {
            runTestsBtn.disabled = true;
            runTestsBtn.innerText = "⏳ Running...";
            await window.Game.Tests.runAll();
            runTestsBtn.innerText = "🧪 Tests Detailed in Console";
            runTestsBtn.disabled = false;
        }
    };
    quickGroup.appendChild(runTestsBtn);

    const autoBtn = document.createElement('button');
    autoBtn.className = Registry.autoPilotActive ? "btn btn-red btn-small" : "btn btn-green btn-small";
    autoBtn.innerText = Registry.autoPilotActive ? "🤖 Hault UNIT_01" : "🚀 Launch UNIT_01";
    autoBtn.onclick = () => {
        console.log("UNIT_01 Button Clicked. Active:", Registry.autoPilotActive);
        Registry.autoPilotActive = !Registry.autoPilotActive;
        Config.autoPilot = Registry.autoPilotActive;
        if (Registry.autoPilotActive) {
            console.log("Engaging UNIT_01 and closing modal...");
            Registry.manualIntervention = false;
            const monkey = Registry.monkeySettings || {};
            Registry.agentSeed = monkey.agentSeed || Config.autoPilotSettings.agentSeed;
            const shortDuration = monkey.roundDurationSeconds || Config.autoPilotSettings.shortRoundDuration || 30;
            Config.roundTime = shortDuration;
            if (Registry.stats.round !== 12) Registry.stats.timeLeft = shortDuration;
            const hb = document.getElementById('heartbeatMonitor');
            if (hb) hb.classList.remove('hidden');
            if (typeof ui.showToast === 'function') ui.showToast("UNIT_01 Autonomous Agent Engaged.");
            
            // Close the debug modal so the user can watch the agent
            const debugOverlay = document.getElementById("debugOverlay");
            if (debugOverlay) debugOverlay.style.display = "none";
            if (typeof engine.resume === "function") engine.resume();
            return; // Modal closed, stop execution

        } else {
            if (typeof engine.disengageAutoPilot === 'function') engine.disengageAutoPilot(false);
            else if (typeof window.disengageAutoPilot === 'function') window.disengageAutoPilot(false);
            if (typeof ui.showToast === 'function') ui.showToast("UNIT_01 Disengaged.");
        }
        window.renderDebugMenu();
    };
    quickGroup.appendChild(autoBtn);

    container.appendChild(quickGroup);
    
    // Telemetry Console Section
    const consoleHeader = document.createElement('h3');
    consoleHeader.innerText = "System Console";
    consoleHeader.style.margin = "20px 0 10px 0";
    consoleHeader.style.borderBottom = "1px solid #ccc";
    container.appendChild(consoleHeader);

    const consoleDiv = document.createElement('div');
    consoleDiv.id = "telemetry-console";
    consoleDiv.style.background = "#2c3e50";
    consoleDiv.style.color = "#ecf0f1";
    consoleDiv.style.fontFamily = "monospace";
    consoleDiv.style.fontSize = "11px";
    consoleDiv.style.height = "150px";
    consoleDiv.style.overflowY = "auto";
    consoleDiv.style.padding = "10px";
    consoleDiv.style.borderRadius = "4px";
    consoleDiv.style.marginBottom = "20px";
    
    const renderLogs = () => {
        if (typeof Telemetry === 'undefined') return;
        consoleDiv.innerHTML = Telemetry.logs.map(log => {
            const color = log.importance === 'error' ? '#e74c3c' : (log.importance === 'warning' ? '#f1c40f' : '#bdc3c7');
            const plainCategory = ({ PHYSICS: 'Game engine', RENDER: 'Display', VM: 'Automation', SYSTEM: 'System' })[log.category] || log.category;
            return `<div style="margin-bottom: 4px; border-bottom: 1px solid #34495e; padding-bottom: 2px;">
                <span style="color: #95a5a6;">[${log.timestamp}]</span> 
                <span style="color: #3498db; font-weight: bold;">[${plainCategory}]</span> 
                <span style="color: ${color};">${log.message}</span>
            </div>`;
        }).join('');
    };
    
    renderLogs();
    container.appendChild(consoleDiv);

    // Listen for telemetry updates while modal is open
    window.addEventListener('telemetryUpdate', renderLogs);

    // Configuration Spinners
    if (typeof debugDefinitions !== 'undefined') {
        debugDefinitions.forEach(def => {
            const row = document.createElement('div'); row.className = 'debug-row';
            const label = document.createElement('span'); label.innerText = def.label;
            const ctrl = document.createElement('div'); ctrl.className = 'spinner-ctrl';
            
            const minus = document.createElement('button'); minus.innerText = '-';
            const valDisplay = document.createElement('div'); 
            const currentVal = Config[def.key] !== undefined ? Config[def.key] : (def.default || 0);
            valDisplay.innerText = def.dispFormat(currentVal);
            const plus = document.createElement('button'); plus.innerText = '+';
            
            minus.onclick = () => { 
                Config[def.key] = Math.max(def.min, Math.round((Config[def.key] - def.step) * 1000) / 1000); 
                valDisplay.innerText = def.dispFormat(Config[def.key]); 
            };
            plus.onclick = () => { 
                Config[def.key] = Math.min(def.max, Math.round((Config[def.key] + def.step) * 1000) / 1000); 
                valDisplay.innerText = def.dispFormat(Config[def.key]); 
            };
            
            ctrl.appendChild(minus); 
            ctrl.appendChild(valDisplay); 
            ctrl.appendChild(plus);
            row.appendChild(label); 
            row.appendChild(ctrl); 
            container.appendChild(row);
        });
    }
};

window.loadDebugTestSuite = function() {
    if (window.Game && window.Game.RegressionSuite) return Promise.resolve();
    const sources = [
        'tests/config_test.js',
        'tests/simulation-tests.js',
        'tests/regression-suite.js'
    ];
    return sources.reduce((promise, source) => promise.then(() => new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = source;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Unable to load ${source}`));
        document.head.appendChild(script);
    })), Promise.resolve());
};

window.refreshDebugVisibility = function() {
    const btn = document.getElementById('openDebugBtn');
    if (btn) {
        if (Config.debugMode) btn.classList.remove('hidden');
        else btn.classList.add('hidden');
    }
};

window.openDebugModal = function() {
    if (!Config.debugMode) return;
    window.renderDebugMenu();
    const overlay = document.getElementById('debugOverlay');
    if (overlay) overlay.style.display = 'flex';
};
