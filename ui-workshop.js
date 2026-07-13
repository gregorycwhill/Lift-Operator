// ============================================================================
// UI-WORKSHOP.JS : AUTOMATION WORKSHOP INTERFACE BINDINGS
// ============================================================================

/**
 * Update the selectable script list in the Automation Workshop sidebar.
 */
window.updateWorkshopScriptList = function() {
    const wsSelect = document.getElementById('scriptSelect');
    const VM = window.Game.Automation || (typeof AutomationVM !== 'undefined' ? AutomationVM : (typeof AutomationWorkshop !== 'undefined' ? AutomationWorkshop : null));

    if (wsSelect && VM && VM.scripts) {
        wsSelect.replaceChildren();

        const createNew = document.createElement('option');
        createNew.value = 'new';
        createNew.textContent = '+ Create New Script';
        wsSelect.appendChild(createNew);
        
        // ... (rest of function inside the if)
        
        const builtInsGroup = document.createElement('optgroup');
        builtInsGroup.label = 'Built-ins';
        
        const myScriptsGroup = document.createElement('optgroup');
        myScriptsGroup.label = 'My Automations';
        
        const sharedScriptsGroup = document.createElement('optgroup');
        sharedScriptsGroup.label = 'Shared with Me';
        
        let currentPlayer = Registry.playerName || window.Game.Storage.get(window.Game.Keys.PLAYER, 'Pilot 1');
        
        VM.scripts.forEach(s => {
            const opt = document.createElement('option');
            opt.value = `custom_${s.id}`;
            
            if (s.author === 'System') {
                opt.textContent = s.name;
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
    const engine = (typeof GameEngine === 'function') ? GameEngine() : (window.Game && window.Game.Engine);
    if (engine && typeof engine.pause === 'function') engine.pause();

    if (typeof AutomationWorkshop !== 'undefined') {
        AutomationWorkshop.show();
    }
};

// API Registration
window.UI = window.UI || {};
window.UI.updateWorkshopScriptList = window.updateWorkshopScriptList;
window.UI.openWorkshopModal = window.openWorkshopModal;

