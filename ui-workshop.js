// ============================================================================
// UI-WORKSHOP.JS : AUTOMATION WORKSHOP INTERFACE BINDINGS
// ============================================================================

const GameEngine = () => (window.Game && window.Game.Engine) || window;
const GameUI = () => (window.Game && window.Game.UI) || window.UI || {};

/**
 * Update the selectable script list in the Automation Workshop sidebar.
 */
window.updateWorkshopScriptList = function() {
    const wsSelect = document.getElementById('scriptSelect');
    if (wsSelect && typeof AutomationWorkshop !== 'undefined' && AutomationWorkshop.scripts) {
        wsSelect.replaceChildren();

        const createNew = document.createElement('option');
        createNew.value = 'new';
        createNew.textContent = '+ Create New Script';
        wsSelect.appendChild(createNew);

        const builtInsGroup = document.createElement('optgroup');
        builtInsGroup.label = 'Built-ins';
        
        const myScriptsGroup = document.createElement('optgroup');
        myScriptsGroup.label = 'My Automations';
        
        const sharedScriptsGroup = document.createElement('optgroup');
        sharedScriptsGroup.label = 'Shared with Me';
        
        let currentPlayer = Registry.playerName || window.Game.Storage.get(window.Game.Keys.PLAYER, 'Pilot 1');
        
        AutomationWorkshop.scripts.forEach(s => {
            const opt = document.createElement('option');
            opt.value = `custom_${s.id}`;
            
            if (s.author === 'System') {
                opt.textContent = `[Built-in] ${s.name}`;
                builtInsGroup.appendChild(opt);
            } else if (s.author === currentPlayer) {
                opt.textContent = s.name;
                myScriptsGroup.appendChild(opt);
            } else {
                opt.textContent = `${s.name} (by ${s.author})`;
                sharedScriptsGroup.appendChild(opt);
            }
        });
        
        if (builtInsGroup.children.length > 0) wsSelect.appendChild(builtInsGroup);
        if (myScriptsGroup.children.length > 0) wsSelect.appendChild(myScriptsGroup);
        if (sharedScriptsGroup.children.length > 0) wsSelect.appendChild(sharedScriptsGroup);
    }
};

/**
 * Open the Automation Workshop modal and initialize Blockly if needed.
 */
window.openWorkshopModal = function() {
    const engine = GameEngine();
    if (typeof engine.pause === 'function') engine.pause();

    const workshopOverlay = document.getElementById('workshopOverlay');
    if (workshopOverlay) workshopOverlay.style.display = 'flex';

    if (typeof AutomationWorkshop !== 'undefined' && AutomationWorkshop.workspace) {
        setTimeout(() => Blockly.svgResize(AutomationWorkshop.workspace), 50);
    } else if (typeof AutomationWorkshop !== 'undefined' && !AutomationWorkshop.workspace) {
        AutomationWorkshop.init();
    }
};

// API Registration
window.UI = window.UI || {};
window.UI.updateWorkshopScriptList = window.updateWorkshopScriptList;
window.UI.openWorkshopModal = window.openWorkshopModal;

