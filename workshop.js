// ============================================================================
// AUTOMATION WORKSHOP & BLOCKLY INTEGRATION
// ============================================================================

const jsGen = javascript.javascriptGenerator;

const liftOperatorBlocks = [
    { "type": "set_target_floor", "message0": "Set Target Floor to %1", "args0": [{ "type": "input_value", "name": "FLOOR", "check": "Number" }], "previousStatement": null, "nextStatement": null, "colour": 355 },
    { "type": "set_sweep_direction", "message0": "Set Sweep Direction to %1", "args0": [{ "type": "field_dropdown", "name": "DIRECTION", "options": [ [ "UP", "1" ], [ "DOWN", "-1" ] ] }], "previousStatement": null, "nextStatement": null, "colour": 355 },
    { "type": "my_floor", "message0": "My Current Floor", "output": "Number", "colour": 230 },
    { "type": "my_free_space", "message0": "My Free Space", "output": "Number", "colour": 230 },
    { "type": "is_empty", "message0": "Am I Empty?", "output": "Boolean", "colour": 230 },
    { "type": "is_full", "message0": "Am I Full?", "output": "Boolean", "colour": 230 },
    { "type": "my_direction", "message0": "My Physical Direction", "output": "String", "colour": 230 },
    { "type": "my_sweep_direction", "message0": "My Sweep Direction", "output": "Number", "colour": 230 },
    { "type": "nearest_target", "message0": "Nearest Floor with %1", "args0": [{ "type": "field_dropdown", "name": "TARGET_TYPE", "options": [ [ "a Critical Guest", "critical" ], [ "an Annoyed Guest", "annoyed" ], [ "a Happy Guest", "happy" ], [ "a VIP ⭐", "vip" ], [ "a Passenger Destination", "destination" ], [ "Any Waiting Guest", "any_waiting" ] ] }], "output": "Number", "colour": 290 },
    { "type": "waiting_guests_on_floor", "message0": "Waiting Guests on Floor %1", "args0": [{ "type": "input_value", "name": "FLOOR", "check": "Number" }], "output": "Number", "colour": 290 },
    { "type": "is_floor_claimed", "message0": "Is Floor %1 claimed by another lift?", "args0": [{ "type": "input_value", "name": "FLOOR", "check": "Number" }], "output": "Boolean", "colour": 290 },
    { "type": "pick_random_floor", "message0": "Pick Random Floor", "output": "Number", "colour": 160 },
    { "type": "constant_none", "message0": "NONE", "output": "Number", "colour": 160 }
];

if (typeof Blockly !== 'undefined') Blockly.defineBlocksWithJsonArray(liftOperatorBlocks);

jsGen.forBlock['set_target_floor'] = function(block, generator) { return `lift.targetFloor = ${generator.valueToCode(block, 'FLOOR', javascript.Order.NONE) || '0'};\n`; };
jsGen.forBlock['set_sweep_direction'] = function(block) { return `lift.sweepDirection = ${block.getFieldValue('DIRECTION')};\n`; };
jsGen.forBlock['my_floor'] = function() { return ['Math.round(lift.pos / Registry.floorHeight)', javascript.Order.ATOMIC]; };
jsGen.forBlock['my_free_space'] = function() { return ['(Config.liftCapacity - lift.passengers.length)', javascript.Order.ATOMIC]; };
jsGen.forBlock['is_empty'] = function() { return ['(lift.passengers.length === 0)', javascript.Order.ATOMIC]; };
jsGen.forBlock['is_full'] = function() { return ['(lift.passengers.length >= Config.liftCapacity)', javascript.Order.ATOMIC]; };
jsGen.forBlock['my_direction'] = function() { return ['Registry.getPhysicalDirection(lift)', javascript.Order.FUNCTION_CALL]; };
jsGen.forBlock['my_sweep_direction'] = function() { return ['lift.sweepDirection', javascript.Order.ATOMIC]; };
jsGen.forBlock['nearest_target'] = function(block) { return [`Registry.getNearestTarget(lift, "${block.getFieldValue('TARGET_TYPE')}")`, javascript.Order.FUNCTION_CALL]; };
jsGen.forBlock['waiting_guests_on_floor'] = function(block, generator) { return [`Registry.getWaitingCount(${generator.valueToCode(block, 'FLOOR', javascript.Order.NONE) || '0'})`, javascript.Order.FUNCTION_CALL]; };
jsGen.forBlock['is_floor_claimed'] = function(block, generator) { return [`Registry.isFloorClaimedByOther(${generator.valueToCode(block, 'FLOOR', javascript.Order.NONE) || '0'}, lift.id)`, javascript.Order.FUNCTION_CALL]; };
jsGen.forBlock['pick_random_floor'] = function() { return ['Registry.prng.randomFloor()', javascript.Order.FUNCTION_CALL]; };
jsGen.forBlock['constant_none'] = function() { return ['-1', javascript.Order.ATOMIC]; };

const toolboxXML = `
<xml id="toolbox" style="display: none">
  <category name="Lift Actions" colour="355"><block type="set_target_floor"></block><block type="set_sweep_direction"></block></category>
  <category name="Lift Telemetry" colour="230"><block type="my_floor"></block><block type="my_free_space"></block><block type="is_empty"></block><block type="is_full"></block><block type="my_direction"></block><block type="my_sweep_direction"></block></category>
  <category name="Building Sensors" colour="290"><block type="nearest_target"></block><block type="waiting_guests_on_floor"></block><block type="is_floor_claimed"></block></category>
  <category name="Logic" colour="#5b80a5"><block type="controls_if"></block><block type="logic_compare"></block><block type="logic_operation"></block><block type="logic_boolean"></block></category>
  <category name="Maths" colour="160"><block type="math_number"></block><block type="math_arithmetic"></block><block type="constant_none"></block><block type="pick_random_floor"></block></category>
  <category name="Loops" colour="#5ba55b"><block type="controls_for"></block></category>
  <category name="Variables" colour="#a55b80" custom="VARIABLE"></category>
</xml>
`;

const defaultSweepJson = {"blocks":{"languageVersion":0,"blocks":[{"type":"controls_if","x":20,"y":20,"extraState":{"hasElse":true},"inputs":{"IF0":{"block":{"type":"is_empty"}},"DO0":{"block":{"type":"set_target_floor","inputs":{"FLOOR":{"block":{"type":"nearest_target","fields":{"TARGET_TYPE":"any_waiting"}}}}}},"ELSE":{"block":{"type":"set_target_floor","inputs":{"FLOOR":{"block":{"type":"nearest_target","fields":{"TARGET_TYPE":"destination"}}}}}}}}]}};
const defaultPrioritySweepJson = {"blocks":{"languageVersion":0,"blocks":[{"type":"controls_if","x":20,"y":20,"extraState":{"hasElse":true},"inputs":{"IF0":{"block":{"type":"logic_compare","fields":{"OP":"NEQ"},"inputs":{"A":{"block":{"type":"nearest_target","fields":{"TARGET_TYPE":"critical"}}},"B":{"block":{"type":"constant_none"}}}}},"DO0":{"block":{"type":"set_target_floor","inputs":{"FLOOR":{"block":{"type":"nearest_target","fields":{"TARGET_TYPE":"critical"}}}}}},"ELSE":{"block":{"type":"set_target_floor","inputs":{"FLOOR":{"block":{"type":"nearest_target","fields":{"TARGET_TYPE":"any_waiting"}}}}}}}}]}};
const defaultVotingJson = {"blocks":{"languageVersion":0,"blocks":[{"type":"controls_if","x":20,"y":20,"extraState":{"hasElse":true},"inputs":{"IF0":{"block":{"type":"logic_compare","fields":{"OP":"NEQ"},"inputs":{"A":{"block":{"type":"nearest_target","fields":{"TARGET_TYPE":"destination"}}},"B":{"block":{"type":"constant_none"}}}}},"DO0":{"block":{"type":"set_target_floor","inputs":{"FLOOR":{"block":{"type":"nearest_target","fields":{"TARGET_TYPE":"destination"}}}}}},"ELSE":{"block":{"type":"set_target_floor","inputs":{"FLOOR":{"block":{"type":"nearest_target","fields":{"TARGET_TYPE":"any_waiting"}}}}}}}}]}};
const defaultWeightedVotingJson = {"blocks":{"languageVersion":0,"blocks":[{"type":"controls_if","x":20,"y":20,"extraState":{"hasElse":true},"inputs":{"IF0":{"block":{"type":"logic_compare","fields":{"OP":"NEQ"},"inputs":{"A":{"block":{"type":"nearest_target","fields":{"TARGET_TYPE":"vip"}}},"B":{"block":{"type":"constant_none"}}}}},"DO0":{"block":{"type":"set_target_floor","inputs":{"FLOOR":{"block":{"type":"nearest_target","fields":{"TARGET_TYPE":"vip"}}}}}},"ELSE":{"block":{"type":"set_target_floor","inputs":{"FLOOR":{"block":{"type":"nearest_target","fields":{"TARGET_TYPE":"destination"}}}}}}}}]}};

// Hardcoded System Defaults - Protected from LocalStorage overwrites
const SYSTEM_SCRIPTS = [
    { id: 'script_sys_sweep', name: "Sweep", description: "Simple pickup and dropoff routing.", author: "System", date: "System Built-in", blocklyData: defaultSweepJson, compiledJS: "" },
    { id: 'script_sys_priority', name: "Priority Sweep", description: "Saves critical guests first.", author: "System", date: "System Built-in", blocklyData: defaultPrioritySweepJson, compiledJS: "" },
    { id: 'script_sys_voting', name: "Voting", description: "Goes to nearest requested destination.", author: "System", date: "System Built-in", blocklyData: defaultVotingJson, compiledJS: "" },
    { id: 'script_sys_weighted', name: "Weighted Voting", description: "Prioritizes VIPs over standard routing.", author: "System", date: "System Built-in", blocklyData: defaultWeightedVotingJson, compiledJS: "" }
];

const AutomationWorkshop = {
    workspace: null,
    scripts: [],
    currentScriptId: null,
    initialized: false, // Prevents engine fallbacks from creating duplicate event listeners

    init: function() {
        if (typeof Blockly === 'undefined') return;
        if (this.initialized) return;
        this.initialized = true;

        this.loadScriptsFromStorage();
        
        document.getElementById('openWorkshopBtn')?.addEventListener('click', () => {
            if(typeof pauseGame === 'function') pauseGame();
            const overlay = document.getElementById('workshopOverlay');
            overlay.style.display = 'flex';
            
            // Timeout fixes the race condition: browser paints the flexbox first, 
            // giving Blockly the correct canvas dimensions to inject into.
            setTimeout(() => {
                if (!this.currentScriptId && this.scripts.length > 0) {
                    this.openScript(this.scripts[0].id);
                } else if (this.currentScriptId) {
                    this.openScript(this.currentScriptId); // Forces re-injection if required
                } else {
                    this.createNewScript();
                }
            }, 50);
        });

        document.getElementById('closeWorkshopBtn')?.addEventListener('click', () => {
            this.saveCurrentScript();
            document.getElementById('workshopOverlay').style.display = 'none';
            // Force board re-render so new/deleted scripts sync to shaft menus
            if(typeof buildWorld === 'function') buildWorld(); 
            if(typeof resumeGame === 'function') resumeGame();
        });

        document.getElementById('scriptSelect')?.addEventListener('change', (e) => this.openScript(e.target.value));
        
        document.getElementById('saveScriptBtn')?.addEventListener('click', () => {
            this.saveCurrentScript();
            this.updateSidebarUI();
            if (typeof showToast === 'function') showToast("💾 Script Saved");
        });

        document.getElementById('copyScriptBtn')?.addEventListener('click', () => this.copyCurrentScript());

        document.getElementById('deleteScriptBtn')?.addEventListener('click', () => {
            if (confirm("Delete this automation? Any lifts actively running it will be forcefully reverted to Manual mode.")) {
                this.deleteCurrentScript();
            }
        });
    },

    loadScriptsFromStorage: function() {
        const playerName = (typeof Registry !== 'undefined' && Registry.playerName) ? Registry.playerName : "Pilot 1";
        const storageKey = 'liftOperator_scripts_' + playerName;
        let raw = null;
        let customScripts = [];
        
        try { raw = localStorage.getItem(storageKey); } catch (e) {}
        
        if (raw) {
            const parsed = JSON.parse(raw);
            customScripts = parsed.filter(s => s.author !== 'System');
        }
        
        // Merge the immutable System scripts with the sanitized custom saves
        this.scripts = [...SYSTEM_SCRIPTS, ...customScripts];
        this.updateSidebarUI();
    },

    saveCurrentScript: function() {
        if (!this.currentScriptId) return;
        
        const currentObj = this.scripts.find(s => s.id === this.currentScriptId);
        const currentPlayer = (typeof Registry !== 'undefined' && Registry.playerName) ? Registry.playerName : "Pilot 1";

        // ONLY save if it is a personal script
        if (!currentObj || currentObj.author !== currentPlayer) return;
        
        const nameInput = document.getElementById('scriptNameInput').value || "Untitled Script";
        const descInput = document.getElementById('scriptDescInput').value || "";
        
        currentObj.name = nameInput;
        currentObj.description = descInput;

        if (this.workspace) {
            currentObj.blocklyData = Blockly.serialization.workspaces.save(this.workspace);
            currentObj.compiledJS = jsGen.workspaceToCode(this.workspace);
        }

        const customScripts = this.scripts.filter(s => s.author !== 'System');
        try { localStorage.setItem('liftOperator_scripts_' + currentPlayer, JSON.stringify(customScripts)); } catch (e) {}
    },

    createNewScript: function() {
        this.saveCurrentScript(); 
        
        const newId = 'script_' + Date.now();
        const playerName = (typeof Registry !== 'undefined' && Registry.playerName) ? Registry.playerName : "Pilot 1";
        
        const newScriptObj = {
            id: newId,
            name: "New Script",
            description: "",
            author: playerName,
            date: new Date().toLocaleDateString(),
            blocklyData: null,
            compiledJS: ""
        };

        this.scripts.push(newScriptObj);
        
        // Save to inject it into local storage immediately
        const customScripts = this.scripts.filter(s => s.author !== 'System');
        try { localStorage.setItem('liftOperator_scripts_' + playerName, JSON.stringify(customScripts)); } catch (e) {}

        this.openScript(newId);
    },

    copyCurrentScript: function() {
        if (!this.currentScriptId) return;
        
        const srcScript = this.scripts.find(s => s.id === this.currentScriptId);
        if (!srcScript) return;

        const currentPlayer = (typeof Registry !== 'undefined' && Registry.playerName) ? Registry.playerName : "Pilot 1";

        // Regex to strip out any existing " (Copy 2)" suffix so we don't get "Sweep (Copy) (Copy 2)"
        let baseName = srcScript.name.replace(/\s\(Copy(\s\d+)?\)$/, '');
        let newName = baseName + " (Copy)";
        
        let copyIndex = 2;
        // Check for exact name collisions inside the user's personal saves
        while (this.scripts.some(s => s.name === newName && s.author === currentPlayer)) {
            newName = baseName + ` (Copy ${copyIndex})`;
            copyIndex++;
        }

        const newId = 'script_' + Date.now();
        const copiedScript = {
            id: newId,
            name: newName,
            description: srcScript.description,
            author: currentPlayer, // Safely transitions ownership
            date: new Date().toLocaleDateString(),
            blocklyData: srcScript.blocklyData ? JSON.parse(JSON.stringify(srcScript.blocklyData)) : null, // Deep clone to avoid referential corruption
            compiledJS: srcScript.compiledJS
        };

        this.scripts.push(copiedScript);
        
        // Force the save so the new array gets pushed to local storage
        this.saveCurrentScript();
        this.openScript(newId);
        
        if (typeof showToast === 'function') showToast("📑 Script Copied");
    },

    openScript: function(id) {
        if (id === 'new') {
            this.createNewScript();
            return;
        }

        // Auto-save the outgoing script before we swap
        this.saveCurrentScript();
        
        const scriptObj = this.scripts.find(s => s.id === id);
        if (!scriptObj) return;

        this.currentScriptId = scriptObj.id; 
        const currentPlayer = (typeof Registry !== 'undefined' && Registry.playerName) ? Registry.playerName : "Pilot 1";
        const isReadOnly = (scriptObj.author !== currentPlayer);
        
        document.getElementById('scriptNameInput').value = scriptObj.name;
        document.getElementById('scriptDescInput').value = scriptObj.description || "";
        document.getElementById('scriptAuthorSpan').innerText = scriptObj.author;
        document.getElementById('scriptDateSpan').innerText = scriptObj.date;

        // Dynamic Blockly Re-injection (Handles toggling between Read-Only and Editable states)
        const overlay = document.getElementById('workshopOverlay');
        
        if (this.workspace) {
            if (this.workspace.options.readOnly !== isReadOnly) {
                // The state changed. Blockly cannot toggle readOnly dynamically, it must be destroyed and rebuilt.
                this.workspace.dispose();
                this.workspace = null;
            }
        }

        if (!this.workspace && overlay.style.display === 'flex') {
            this.workspace = Blockly.inject('blocklyDiv', {
                toolbox: isReadOnly ? undefined : toolboxXML,
                readOnly: isReadOnly,
                trashcan: !isReadOnly,
                scrollbars: true,
                sounds: false,
                theme: Blockly.Themes.Classic
            });

            this.workspace.addChangeListener(() => {
                const terminalBox = document.getElementById('policyInput');
                if (terminalBox) terminalBox.value = jsGen.workspaceToCode(this.workspace);
            });
        }

        if (this.workspace) {
            this.workspace.clear();
            if (scriptObj.blocklyData) {
                Blockly.serialization.workspaces.load(scriptObj.blocklyData, this.workspace);
            }
            // Fire the resize event just in case it looks squished
            setTimeout(() => { Blockly.svgResize(this.workspace); }, 10);
        }
        
        this.updateSidebarUI(); 
    },
    
    deleteCurrentScript: function() {
        if (!this.currentScriptId) return;
        
        const currentObj = this.scripts.find(s => s.id === this.currentScriptId);
        const currentPlayer = (typeof Registry !== 'undefined' && Registry.playerName) ? Registry.playerName : "Pilot 1";
        
        // Double protection: Ensure it isn't system OR shared
        if (!currentObj || currentObj.author !== currentPlayer) return; 

        // Remove from master array
        this.scripts = this.scripts.filter(s => s.id !== this.currentScriptId);
        
        // Save the freshly scrubbed custom list
        const customScripts = this.scripts.filter(s => s.author !== 'System');
        try { localStorage.setItem('liftOperator_scripts_' + currentPlayer, JSON.stringify(customScripts)); } catch (e) {}
        
        // Cascade Engine Fix: Reset any active lifts relying on the deleted script
        if (typeof Registry !== 'undefined' && Registry.lifts) {
            Registry.lifts.forEach(lift => {
                if (lift.automation === `custom_${this.currentScriptId}`) {
                    lift.automation = 'manual';
                    lift.manualOverride = false;
                    const car = document.getElementById(`lift-el-${lift.id}`);
                    if (car) {
                        car.classList.remove('sweep-mode', 'priority-sweep-mode', 'voting-mode', 'weighted-voting-mode', 'custom-mode');
                    }
                }
            });
        }
        
        // Fallback to Sweep
        if (this.scripts.length > 0) this.openScript(this.scripts[0].id);
    },

    updateSidebarUI: function() {
        const select = document.getElementById('scriptSelect');
        const saveBtn = document.getElementById('saveScriptBtn');
        const deleteBtn = document.getElementById('deleteScriptBtn');
        const nameInput = document.getElementById('scriptNameInput');
        const descInput = document.getElementById('scriptDescInput');
        
        if (!select) return;
        
        let builtIns = '';
        let myScripts = '<option value="new" style="font-weight: bold; font-style: italic; color: #27ae60;">+ Create New Script</option>';
        let sharedScripts = '';
        const currentPlayer = (typeof Registry !== 'undefined' && Registry.playerName) ? Registry.playerName : "Pilot 1";
        
        let isReadOnly = false;
        
        this.scripts.forEach(s => {
            const isSelected = s.id === this.currentScriptId ? 'selected' : '';
            if (s.id === this.currentScriptId && s.author !== currentPlayer) {
                isReadOnly = true;
            }
            
            if (s.author === 'System') {
                builtIns += `<option value="${s.id}" ${isSelected}>${s.name}</option>`;
            } else if (s.author === currentPlayer) {
                myScripts += `<option value="${s.id}" ${isSelected}>${s.name}</option>`;
            } else {
                sharedScripts += `<option value="${s.id}" ${isSelected}>${s.name} (by ${s.author})</option>`;
            }
        });
        
        select.innerHTML = 
            (builtIns ? `<optgroup label="Built-in">${builtIns}</optgroup>` : '') +
            (myScripts ? `<optgroup label="My Automations">${myScripts}</optgroup>` : '') +
            (sharedScripts ? `<optgroup label="Shared with Me">${sharedScripts}</optgroup>` : '');
            
        // Toggle input disabled states strictly based on authorship
        if (saveBtn) {
            saveBtn.disabled = isReadOnly;
            saveBtn.title = isReadOnly ? "Read-Only: Copy script to save edits." : "Save Script";
        }
        if (deleteBtn) {
            deleteBtn.disabled = isReadOnly;
            deleteBtn.title = isReadOnly ? "Read-Only: Cannot delete." : "Delete Script";
        }
        if (nameInput) nameInput.disabled = isReadOnly;
        if (descInput) descInput.disabled = isReadOnly;
    }
};