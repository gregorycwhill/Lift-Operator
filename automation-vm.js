// ============================================================================
// AUTOMATION-VM.JS : VIRTUAL MACHINE FOR PLAYER SCRIPTS
// ============================================================================

window.Game = window.Game || {};

(function() {
    // Hidden storage for system scripts
    const DEFAULT_SWEEP_JSON = {"blocks":{"languageVersion":0,"blocks":[{"type":"controls_if","x":20,"y":20,"extraState":{"hasElse":true},"inputs":{"IF0":{"block":{"type":"is_empty"}},"DO0":{"block":{"type":"set_target_floor","inputs":{"FLOOR":{"block":{"type":"nearest_target","fields":{"TARGET_TYPE":"any_waiting"}}}}}},"ELSE":{"block":{"type":"set_target_floor","inputs":{"FLOOR":{"block":{"type":"nearest_target","fields":{"TARGET_TYPE":"destination"}}}}}}}}]}};
    const DEFAULT_PRIORITY_JSON = {"blocks":{"languageVersion":0,"blocks":[{"type":"controls_if","x":20,"y":20,"extraState":{"hasElse":true},"inputs":{"IF0":{"block":{"type":"logic_compare","fields":{"OP":"NEQ"},"inputs":{"A":{"block":{"type":"nearest_target","fields":{"TARGET_TYPE":"critical"}}},"B":{"block":{"type":"constant_none"}}}}},"DO0":{"block":{"type":"set_target_floor","inputs":{"FLOOR":{"block":{"type":"nearest_target","fields":{"TARGET_TYPE":"critical"}}}}}},"ELSE":{"block":{"type":"set_target_floor","inputs":{"FLOOR":{"block":{"type":"nearest_target","fields":{"TARGET_TYPE":"any_waiting"}}}}}}}}]}};
    const DEFAULT_INTERNAL_JSON = {"blocks":{"languageVersion":0,"blocks":[{"type":"set_target_floor","x":20,"y":20,"inputs":{"FLOOR":{"block":{"type":"math_number","fields":{"NUM":0}}}}}]}};

    const SYSTEM_SCRIPTS = [
        { id: 'sys_sweep', name: "Sweep", description: "Simple pickup and dropoff routing.", author: "System", version: "1.0", blocklyData: DEFAULT_SWEEP_JSON, compiledJS: "if (!lift.sweepDirection) lift.sweepDirection = 1; let target = Building.findSweepTarget(lift.sweepDirection, false); if (target === -1) { lift.sweepDirection *= -1; target = Building.findSweepTarget(lift.sweepDirection, false); } if (target !== -1) Building.setTarget(target);" },
        { id: 'sys_priority', name: "Priority Sweep", description: "Prioritizes angry guests along the route.", author: "System", version: "1.0", blocklyData: DEFAULT_PRIORITY_JSON, compiledJS: "if (!lift.sweepDirection) lift.sweepDirection = 1; let target = Building.findSweepTarget(lift.sweepDirection, true); if (target === -1) { target = Building.findSweepTarget(lift.sweepDirection, false); } if (target === -1) { lift.sweepDirection *= -1; target = Building.findSweepTarget(lift.sweepDirection, true); if (target === -1) target = Building.findSweepTarget(lift.sweepDirection, false); } if (target !== -1) Building.setTarget(target);" },
        { id: 'sys_voting', name: "Voting", description: "Guests vote on the next stop.", author: "System", version: "1.0", blocklyData: DEFAULT_INTERNAL_JSON, compiledJS: "let best = Building.getBestFloor(false); if (best !== -1) Building.setTarget(best);" },
        { id: 'sys_weighted', name: "Weighted Voting", description: "Weight based on patience levels.", author: "System", version: "1.0", blocklyData: DEFAULT_INTERNAL_JSON, compiledJS: "let best = Building.getBestFloor(true); if (best !== -1) Building.setTarget(best);" }
    ];

    const AutomationVM = {
        scripts: [],
        cache: new Map(), // scriptId -> compiled Function
        
        /**
         * Initialize the VM by loading scripts from storage.
         */
        init: function() {
            this.loadScripts();
            console.log("VM: Automation Engine Initialized.");
        },

        /**
         * Load user scripts and merge with system defaults.
         */
        loadScripts: function() {
            const playerName = (window.Registry && window.Registry.playerName) || "Pilot 1";
            const storageKey = window.Game.Keys.SCRIPTS + playerName;
            const raw = window.Game.Storage.get(storageKey);
            
            let customScripts = [];
            if (raw) {
                try {
                    customScripts = JSON.parse(raw).filter(s => s.author !== 'System');
                } catch (e) {
                    console.error("VM: Failed to parse user scripts.", e);
                }
            }
            
            this.scripts = [...SYSTEM_SCRIPTS, ...customScripts];
        },

        /**
         * Save user scripts back to local storage.
         */
        saveScripts: function() {
            const playerName = (window.Registry && window.Registry.playerName) || "Pilot 1";
            const storageKey = window.Game.Keys.SCRIPTS + playerName;
            const customOnly = this.scripts.filter(s => s.author !== 'System');
            window.Game.Storage.set(storageKey, JSON.stringify(customOnly));
        },

        /**
         * Execute a script for a specific lift.
         */
        execute: function(lift, scriptIdentifier) {
            // Identifier can be "sys_sweep" or "custom_12345"
            const id = scriptIdentifier.replace('custom_', '');
            const script = this.scripts.find(s => s.id === id);
            
            if (!script || !script.compiledJS) return;

            let fn = this.cache.get(id);
            if (!fn) {
                try {
                    // Create the execution sandbox
                    fn = new Function('lift', 'Building', 'Config', script.compiledJS);
                    this.cache.set(id, fn);
                } catch (e) {
                    if (typeof Telemetry !== 'undefined') {
                        Telemetry.add('VM', `Compilation error in [${script.name}]: ${e.message}`, 'error');
                    }
                    console.error(`VM: Compilation error in [${script.name}]`, e);
                    return;
                }
            }

            try {
                // Pass a restricted 'Building' bridge instead of full Registry
                const bridge = this.getBuildingBridge(lift);
                fn(lift, bridge, window.Config);

                // Career Progress: Track script execution ticks
                if (window.Registry) {
                    window.Registry.customScriptTicks = (window.Registry.customScriptTicks || 0) + 1;
                }
            } catch (e) {
                if (typeof Telemetry !== 'undefined') {
                    Telemetry.add('VM', `Runtime error in [${script.name}]: ${e.message}`, 'error');
                }
                console.error(`VM: Runtime error in [${script.name}]`, e);
            }
        },

        /**
         * Invalidates the cache for a script (called after editing).
         */
        invalidate: function(scriptId) {
            this.cache.delete(scriptId);
        },

        /**
         * Returns a safe subset of Registry functions for script use.
         */
        getBuildingBridge: function(lift) {
            const R = window.Registry;
            return {
                getFloor: () => Math.round(lift.pos / R.floorHeight),
                getPhysicalDirection: () => R.getPhysicalDirection(lift),
                getNearestTarget: (type) => R.getNearestTarget(lift, type),
                getWaitingCount: (floor) => R.getWaitingCount(floor),
                isFloorClaimed: (floor) => R.isFloorClaimedByOther(floor, lift.id),
                findSweepTarget: (dir, prio) => R.findSweepTarget(lift, dir, prio),
                getBestFloor: (weighted) => R.getBestFloor(lift, weighted),
                randomFloor: () => R.prng.randomFloor(),
                
                // Control Methods
                setTarget: (floor) => {
                    const f = parseInt(floor);
                    if (!isNaN(f) && f >= 0 && f < window.Config.numFloors) {
                        lift.targetFloor = f;
                    }
                },
                
                // Passenger Stats
                getLoad: () => R.getLiftWeight(lift),
                getCapacity: () => window.Config.liftCapacity,

                floorHeight: R.floorHeight,
                numFloors: window.Config.numFloors
            };
        }
    };

    window.Game.Automation = AutomationVM;
})();
