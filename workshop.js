// ============================================================================
// WORKSHOP.JS : BLOCKLY CONFIGURATION & UI DATA HANDLING
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
    { "type": "nearest_target", "message0": "Nearest Floor with %1", "args0": [{ "type": "field_dropdown", "name": "TARGET_TYPE", "options": [ [ "a Critical Guest", "critical" ], [ "an Annoyed Guest", "annoyed" ], [ "a Happy Guest", "happy" ], [ "a VIP ?", "vip" ], [ "a Passenger Destination", "destination" ], [ "Any Waiting Guest", "any_waiting" ] ] }], "output": "Number", "colour": 290 },
    { "type": "find_sweep_target", "message0": "Next Stop In Direction %1 (Priority Mood: %2)", "args0": [
        { "type": "input_value", "name": "DIRECTION", "check": "Number" },
        { "type": "input_value", "name": "PRIORITY", "check": "Boolean" }
    ], "output": "Number", "colour": 290 },
    { "type": "waiting_guests_on_floor", "message0": "Waiting Guests on Floor %1", "args0": [{ "type": "input_value", "name": "FLOOR", "check": "Number" }], "output": "Number", "colour": 290 },
    { "type": "is_floor_claimed", "message0": "Is Floor %1 claimed by another lift?", "args0": [{ "type": "input_value", "name": "FLOOR", "check": "Number" }], "output": "Boolean", "colour": 290 },
    { "type": "pick_random_floor", "message0": "Pick Random Floor", "output": "Number", "colour": 160 },
    { "type": "constant_none", "message0": "NONE", "output": "Number", "colour": 160 }
];

if (typeof Blockly !== "undefined") Blockly.defineBlocksWithJsonArray(liftOperatorBlocks);

jsGen.forBlock["set_target_floor"] = function(block, generator) { 
    return `Building.setTarget(${generator.valueToCode(block, "FLOOR", javascript.Order.NONE) || "0"});\n`; 
};
jsGen.forBlock["set_sweep_direction"] = function(block) { return `lift.sweepDirection = ${block.getFieldValue("DIRECTION")};\n`; };
jsGen.forBlock["my_floor"] = function() { return ["Building.getFloor()", javascript.Order.FUNCTION_CALL]; };
jsGen.forBlock["my_free_space"] = function() { return ["(Config.liftCapacity - lift.passengers.length)", javascript.Order.ATOMIC]; };
jsGen.forBlock["is_empty"] = function() { return ["(lift.passengers.length === 0)", javascript.Order.ATOMIC]; };
jsGen.forBlock["is_full"] = function() { return ["(lift.passengers.length >= Config.liftCapacity)", javascript.Order.ATOMIC]; };
jsGen.forBlock["my_direction"] = function() { return ["Building.getPhysicalDirection()", javascript.Order.FUNCTION_CALL]; };
jsGen.forBlock["my_sweep_direction"] = function() { return ["lift.sweepDirection", javascript.Order.ATOMIC]; };
jsGen.forBlock["nearest_target"] = function(block) { return [`Building.getNearestTarget("${block.getFieldValue("TARGET_TYPE")}")`, javascript.Order.FUNCTION_CALL]; };
jsGen.forBlock["find_sweep_target"] = function(block, generator) {
    const dir = generator.valueToCode(block, "DIRECTION", javascript.Order.NONE) || "1";
    const prio = generator.valueToCode(block, "PRIORITY", javascript.Order.NONE) || "false";
    return [`Building.findSweepTarget(${dir}, ${prio})`, javascript.Order.FUNCTION_CALL];
};
jsGen.forBlock["waiting_guests_on_floor"] = function(block, generator) { return [`Building.getWaitingCount(${generator.valueToCode(block, "FLOOR", javascript.Order.NONE) || "0"})`, javascript.Order.FUNCTION_CALL]; };
jsGen.forBlock["is_floor_claimed"] = function(block, generator) { return [`Building.isFloorClaimed(${generator.valueToCode(block, "FLOOR", javascript.Order.NONE) || "0"})`, javascript.Order.FUNCTION_CALL]; };
jsGen.forBlock["pick_random_floor"] = function() { return ["Building.randomFloor()", javascript.Order.FUNCTION_CALL]; };
jsGen.forBlock["constant_none"] = function() { return ["-1", javascript.Order.ATOMIC]; };

const toolboxXML = `
<xml id="toolbox" style="display: none">
  <category name="Lift Actions" colour="355"><block type="set_target_floor"></block><block type="set_sweep_direction"></block></category>
  <category name="Lift Telemetry" colour="230"><block type="my_floor"></block><block type="my_free_space"></block><block type="is_empty"></block><block type="is_full"></block><block type="my_direction"></block><block type="my_sweep_direction"></block></category>
  <category name="Building Sensors" colour="290"><block type="nearest_target"></block><block type="find_sweep_target"></block><block type="waiting_guests_on_floor"></block><block type="is_floor_claimed"></block></category>
  <category name="Logic" colour="#5b80a5"><block type="controls_if"></block><block type="logic_compare"></block><block type="logic_operation"></block><block type="logic_boolean"></block></category>
  <category name="Maths" colour="160"><block type="math_number"></block><block type="math_arithmetic"></block><block type="constant_none"></block><block type="pick_random_floor"></block></category>
  <category name="Loops" colour="#5ba55b"><block type="controls_for"></block></category>
  <category name="Variables" colour="#a55b80" custom="VARIABLE"></category>
</xml>
`;

const AutomationWorkshop = {
    workspace: null,
    currentScriptId: null,
    initialized: false,

    init: function() {
        if (typeof Blockly === "undefined") return;
        if (this.initialized) return;
        this.initialized = true;

        const VM = window.Game.Automation;
        if (VM) VM.init();

        document.getElementById("closeWorkshopBtn")?.addEventListener("click", () => {
            this.saveCurrentScript();
            const overlay = document.getElementById("workshopOverlay");
            if (overlay) overlay.style.display = "none";
            
            const engine = (typeof GameEngine === 'function') ? GameEngine() : (window.Game && window.Game.Engine);
            const ui = (typeof GameUI === 'function') ? GameUI() : (window.Game && window.UI);

            if (ui && typeof ui.buildWorld === "function") ui.buildWorld(); 
            if (engine && typeof engine.resume === "function") engine.resume();
        });

        document.getElementById("scriptSelect")?.addEventListener("change", (e) => {
            if (this.currentScriptId === e.target.value) return; 
            this.openScript(e.target.value);
        });
        
        document.getElementById("saveScriptBtn")?.addEventListener("click", () => {
            this.saveCurrentScript();
            this.updateSidebarUI();
            if (typeof window.UI.showToast === "function") window.UI.showToast("💾 Script Saved");
        });

        document.getElementById("copyScriptBtn")?.addEventListener("click", () => this.copyCurrentScript());

        document.getElementById("deleteScriptBtn")?.addEventListener("click", () => {
            if (confirm("Delete this automation? Any lifts actively running it will be forcefully reverted to Manual mode.")) {
                this.deleteCurrentScript();
            }
        });

        document.getElementById("shareScriptBtn")?.addEventListener("click", () => this.shareCurrentScript());
    },

    show: function() {
        this.init();
        const overlay = document.getElementById("workshopOverlay");
        if (overlay) overlay.style.display = "flex";

        const VM = this.getVM();
        setTimeout(() => {
            if (!this.currentScriptId && VM && VM.scripts.length > 0) {
                this.openScript(VM.scripts[0].id); // Default to Sweep
            } else if (this.currentScriptId) {
                this.openScript(this.currentScriptId);
            } else {
                this.createNewScript();
            }
        }, 50);
    },

    getVM: function() {
        return window.Game.Automation;
    },

    saveCurrentScript: function() {
        const VM = this.getVM();
        if (!this.currentScriptId || !VM) return;
        
        const currentObj = VM.scripts.find(s => s.id === this.currentScriptId);
        const currentPlayer = (typeof window.Registry !== "undefined" && window.Registry.playerName) || "Pilot 1";

        if (!currentObj || currentObj.author !== currentPlayer) return;
        
        const nameInput = document.getElementById("scriptNameInput").value || "Untitled Script";
        const descInput = document.getElementById("scriptDescInput").value || "";
        
        currentObj.name = nameInput;
        currentObj.description = descInput;

        if (this.workspace) {
            currentObj.blocklyData = Blockly.serialization.workspaces.save(this.workspace);
            const generatedSource = jsGen.workspaceToCode(this.workspace);
            const validation = VM.validateSource(generatedSource);
            if (!validation.valid) {
                if (typeof showToast === 'function') showToast(`Script not saved: ${validation.reason}`);
                return;
            }
            currentObj.compiledJS = generatedSource;
            VM.invalidate(currentObj.id);
        }

        VM.saveScripts();
    },

    createNewScript: function() {
        this.saveCurrentScript(); 
        const VM = this.getVM();
        if (!VM) return;
        
        const newId = "script_" + Date.now();
        const playerName = (typeof window.Registry !== "undefined" && window.Registry.playerName) || "Pilot 1";
        
        const newScriptObj = {
            id: newId,
            name: "New Script",
            description: "",
            author: playerName,
            date: new Date().toLocaleDateString(),
            version: "1.0",
            blocklyData: null,
            compiledJS: ""
        };

        VM.scripts.push(newScriptObj);
        VM.saveScripts();
        this.openScript(newId);
    },

    copyCurrentScript: function() {
        const VM = this.getVM();
        if (!this.currentScriptId || !VM) return;
        
        const srcScript = VM.scripts.find(s => s.id === this.currentScriptId);
        if (!srcScript) return;

        const currentPlayer = (typeof window.Registry !== "undefined" && window.Registry.playerName) || "Pilot 1";
        let baseName = srcScript.name.replace(/\s\(Copy(\s\d+)?\)$/, "");
        let newName = baseName + " (Copy)";
        
        let copyIndex = 2;
        while (VM.scripts.some(s => s.name === newName && s.author === currentPlayer)) {
            newName = baseName + ` (Copy ${copyIndex})`;
            copyIndex++;
        }

        const newId = "script_" + Date.now();
        const copiedScript = {
            id: newId,
            name: newName,
            description: srcScript.description,
            author: currentPlayer,
            date: new Date().toLocaleDateString(),
            version: srcScript.version || "1.0",
            blocklyData: srcScript.blocklyData ? JSON.parse(JSON.stringify(srcScript.blocklyData)) : null,
            compiledJS: srcScript.compiledJS
        };

        VM.scripts.push(copiedScript);
        this.saveCurrentScript();
        this.openScript(newId);
        if (typeof window.UI.showToast === "function") window.UI.showToast("?? Script Copied");
    },

    openScript: function(id) {
        if (id === "new") {
            this.createNewScript();
            return;
        }

        this.saveCurrentScript();
        const VM = this.getVM();
        if (!VM) return;
        
        // Strip prefix if present from UI select values
        const cleanId = id.replace('custom_', '');
        const scriptObj = VM.scripts.find(s => s.id === cleanId);
        if (!scriptObj) return;

        this.currentScriptId = scriptObj.id; 
        const currentPlayer = (window.Registry && window.Registry.playerName) || "Pilot 1";
        const isReadOnly = (scriptObj.author !== currentPlayer);
        
        document.getElementById("scriptNameInput").value = scriptObj.name;
        document.getElementById("scriptDescInput").value = scriptObj.description || "";
        document.getElementById("scriptAuthorSpan").innerText = scriptObj.author;
        document.getElementById("scriptDateSpan").innerText = scriptObj.date;

        const overlay = document.getElementById("workshopOverlay");
        
        if (this.workspace) {
            if (this.workspace.options.readOnly !== isReadOnly) {
                this.workspace.dispose();
                this.workspace = null;
            }
        }

        if (!this.workspace && overlay && overlay.style.display === "flex") {
            this.workspace = Blockly.inject("blocklyDiv", {
                toolbox: isReadOnly ? undefined : toolboxXML,
                readOnly: isReadOnly,
                trashcan: !isReadOnly,
                scrollbars: true,
                sounds: false,
                theme: Blockly.Themes.Classic
            });

            this.workspace.addChangeListener(() => {
                const terminalBox = document.getElementById("policyInput");
                if (terminalBox) terminalBox.value = jsGen.workspaceToCode(this.workspace);
            });
        }

        if (this.workspace) {
            this.workspace.clear();
            if (scriptObj.blocklyData) {
                try {
                    // Try modern serialization first
                    Blockly.serialization.workspaces.load(scriptObj.blocklyData, this.workspace);
                } catch (e) {
                    console.warn("Modern serialization failed, trying XML fallback", e);
                    try {
                        // Fallback: If it's an object with a 'blocks' key that isn't modern JSON, 
                        // or if we have an older format.
                        const xml = Blockly.utils.xml.textToDom(scriptObj.blocklyXml || scriptObj.blocklyData);
                        Blockly.Xml.domToWorkspace(xml, this.workspace);
                    } catch (e2) {
                        console.error("Blockly Load Error:", e2);
                    }
                }
            }
            
            this.workspace.render();

            setTimeout(() => { 
                if (this.workspace) {
                    Blockly.svgResize(this.workspace); 
                    this.workspace.scrollCenter();
                }
            }, 50);
        }
        
        this.updateSidebarUI(); 
    },
    
    deleteCurrentScript: function() {
        const VM = this.getVM();
        if (!this.currentScriptId || !VM) return;
        
        const currentObj = VM.scripts.find(s => s.id === this.currentScriptId);
        const currentPlayer = (window.Registry && window.Registry.playerName) || "Pilot 1";
        
        if (!currentObj || currentObj.author !== currentPlayer) return; 

        VM.scripts = VM.scripts.filter(s => s.id !== this.currentScriptId);
        VM.saveScripts();

        if (window.Registry && window.Registry.lifts) {
            window.Registry.lifts.forEach(lift => {
                if (lift.automation === `custom_${this.currentScriptId}`) {
                    lift.automation = "manual";
                    lift.manualOverride = false;
                    const car = document.getElementById(`lift-el-${lift.id}`);
                    if (car) {
                        car.classList.remove("sweep-mode", "priority-sweep-mode", "voting-mode", "weighted-voting-mode", "custom-mode");
                    }
                }
            });
        }
        
        if (VM.scripts.length > 0) this.openScript(VM.scripts[0].id);
    },

    shareCurrentScript: function() {
        const VM = this.getVM();
        if (!this.currentScriptId || !VM) return;

        const script = VM.scripts.find(s => s.id === this.currentScriptId);
        if (!script) return;

        // Ensure we include all components for a complete restoration on the other side
        // Note: Manifest expects 'xml' for the compressed blockly data
        const payload = {
            type: 'blueprint',
            data: {
                name: script.name,
                description: script.description || "",
                author: script.author,
                date: script.date,
                version: script.version || "1.0",
                xml: LZString.compressToEncodedURIComponent(JSON.stringify(script.blocklyData)),
                compiledJS: script.compiledJS
            }
        };

        const encoded = (typeof GameShared === 'function' ? GameShared().encodePayload(payload) : null) || (window.Game.encodePayload ? window.Game.encodePayload(payload) : null);

        if (encoded) {
            const url = new URL(window.location.href);
            url.searchParams.set('Data', encoded);
            
            const shareData = {
                title: 'Lift Operator Blueprint',
                text: `Check out my automation script: ${script.name}`,
                url: url.toString()
            };

            if (navigator.share) {
                navigator.share(shareData).catch(() => {
                    navigator.clipboard.writeText(url.toString()).then(() => {
                        const ui = (typeof GameUI === 'function') ? GameUI() : window.UI;
                        if (ui && typeof ui.showToast === 'function') ui.showToast("🔗 Blueprint link copied to clipboard!");
                    });
                });
            } else {
                navigator.clipboard.writeText(url.toString()).then(() => {
                    const ui = (typeof GameUI === 'function') ? GameUI() : window.UI;
                    if (ui && typeof ui.showToast === 'function') ui.showToast("🔗 Blueprint link copied to clipboard!");
                });
            }
        }
    },

    updateSidebarUI: function() {
        if (typeof window.UI.updateWorkshopScriptList === "function") {
            window.UI.updateWorkshopScriptList();
        }
        
        const VM = this.getVM();
        if (!VM) return;

        const saveBtn = document.getElementById("saveScriptBtn");
        const deleteBtn = document.getElementById("deleteScriptBtn");
        const nameInput = document.getElementById("scriptNameInput");
        const descInput = document.getElementById("scriptDescInput");
        
        const currentPlayer = (window.Registry && window.Registry.playerName) || "Pilot 1";
        const currentObj = VM.scripts.find(s => s.id === this.currentScriptId);
        const isReadOnly = currentObj ? (currentObj.author !== currentPlayer) : false;
            
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

window.AutomationWorkshop = AutomationWorkshop;

// Bridge VM scripts to the Workshop UI
Object.defineProperty(AutomationWorkshop, 'scripts', {
    get: function() {
        return (window.Game && window.Game.Automation && window.Game.Automation.scripts) || [];
    }
});
