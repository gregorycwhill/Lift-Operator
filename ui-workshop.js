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
        const reachedRound = Math.max(Registry.highestUnlockedRound || 1, Registry.stats.round || 1);
        const isZoningUnlocked = Config.debugMode || reachedRound >= 14;
        
        VM.scripts.forEach(s => {
            if (s.serviceZone && !isZoningUnlocked) return;
            const opt = document.createElement('option');
            opt.value = `custom_${s.id}`;
            const zoneLabel = s.serviceZone ? ` [${VM.getServiceZoneLabel?.(s.serviceZone, Config.numFloors) || 'zoned'}]` : '';
            
            if (s.author === 'System') {
                opt.textContent = `${s.name}${zoneLabel}`;
                builtInsGroup.appendChild(opt);
            } else if (s.author === currentPlayer) {
                opt.textContent = `${s.name}${zoneLabel}`;
                myScriptsGroup.appendChild(opt);
            } else {
                opt.textContent = `${s.name}${zoneLabel} (by ${s.author})`;
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
    const overlay = document.getElementById('workshopOverlay');
    if (overlay && overlay.style.display === 'flex') {
        overlay.style.display = 'none';
        window.Game.Audio?.setContext('gameplay');
        engine?.resume?.();
        return;
    }
    if (engine && typeof engine.pause === 'function') engine.pause();
    window.Game.Audio?.setContext('menu');
    window.openModalExclusive('workshopOverlay');

    if (typeof AutomationWorkshop !== 'undefined') {
        AutomationWorkshop.show();
    }
};

// API Registration
window.UI = window.UI || {};
window.UI.updateWorkshopScriptList = window.updateWorkshopScriptList;
window.UI.openWorkshopModal = window.openWorkshopModal;

