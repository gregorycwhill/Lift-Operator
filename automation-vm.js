// ============================================================================
// AUTOMATION-VM.JS : VIRTUAL MACHINE FOR PLAYER SCRIPTS
// ============================================================================

window.Game = window.Game || {};

(function() {
    // Hidden storage for system scripts
    const DEFAULT_SWEEP_JSON = {"blocks":{"languageVersion":0,"blocks":[{"type":"controls_if","x":20,"y":20,"extraState":{"hasElse":true},"inputs":{"IF0":{"block":{"type":"is_empty"}},"DO0":{"block":{"type":"set_target_floor","inputs":{"FLOOR":{"block":{"type":"nearest_target","fields":{"TARGET_TYPE":"any_waiting"}}}}}},"ELSE":{"block":{"type":"set_target_floor","inputs":{"FLOOR":{"block":{"type":"nearest_target","fields":{"TARGET_TYPE":"destination"}}}}}}}}]}};
    const DEFAULT_PRIORITY_JSON = {"blocks":{"languageVersion":0,"blocks":[{"type":"controls_if","x":20,"y":20,"extraState":{"hasElse":true},"inputs":{"IF0":{"block":{"type":"logic_compare","fields":{"OP":"NEQ"},"inputs":{"A":{"block":{"type":"nearest_target","fields":{"TARGET_TYPE":"critical"}}},"B":{"block":{"type":"constant_none"}}}}},"DO0":{"block":{"type":"set_target_floor","inputs":{"FLOOR":{"block":{"type":"nearest_target","fields":{"TARGET_TYPE":"critical"}}}}}},"ELSE":{"block":{"type":"set_target_floor","inputs":{"FLOOR":{"block":{"type":"nearest_target","fields":{"TARGET_TYPE":"any_waiting"}}}}}}}}]}};
    const DEFAULT_INTERNAL_JSON = {"blocks":{"languageVersion":0,"blocks":[{"type":"set_target_floor","x":20,"y":20,"inputs":{"FLOOR":{"block":{"type":"math_number","fields":{"NUM":0}}}}}]}};

    const withServiceZoneBlock = (base, mode) => {
        const data = JSON.parse(JSON.stringify(base));
        data.blocks.blocks.push({
            type: 'service_zone',
            fields: { MODE: mode, LOWER: '0', UPPER: '0' },
            x: 20,
            y: 260
        });
        return data;
    };

    const SYSTEM_SCRIPTS = [
        { id: 'sys_sweep', name: "Sweep", description: "Simple pickup and dropoff routing.", author: "System", version: "1.0", blocklyData: DEFAULT_SWEEP_JSON, compiledJS: "if (!lift.sweepDirection) lift.sweepDirection = 1; let target = Building.findSweepTarget(lift.sweepDirection, false); if (target === -1) { lift.sweepDirection *= -1; target = Building.findSweepTarget(lift.sweepDirection, false, true); } if (target !== -1) Building.setTarget(target);" },
        { id: 'sys_priority', name: "Priority Sweep", description: "Prioritizes angry guests along the route.", author: "System", version: "1.0", blocklyData: DEFAULT_PRIORITY_JSON, compiledJS: "if (!lift.sweepDirection) lift.sweepDirection = 1; let target = Building.findSweepTarget(lift.sweepDirection, true); if (target === -1) { target = Building.findSweepTarget(lift.sweepDirection, false); } if (target === -1) { lift.sweepDirection *= -1; target = Building.findSweepTarget(lift.sweepDirection, true, true); if (target === -1) target = Building.findSweepTarget(lift.sweepDirection, false, true); } if (target !== -1) Building.setTarget(target);" },
        { id: 'sys_voting', name: "Voting", description: "Guests vote on the next stop.", author: "System", version: "1.0", blocklyData: DEFAULT_INTERNAL_JSON, compiledJS: "let best = Building.getBestFloor(false); if (best !== -1) Building.setTarget(best);" },
        { id: 'sys_weighted', name: "Weighted Voting", description: "Weight based on patience levels.", author: "System", version: "1.0", blocklyData: DEFAULT_INTERNAL_JSON, compiledJS: "let best = Building.getBestFloor(true); if (best !== -1) Building.setTarget(best);" },
        { id: 'sys_zoned_low', name: "Zoned Low", description: "Sweep policy for the scalable lower service band.", author: "System", version: "1.0", serviceZone: { mode: 'low' }, blocklyData: withServiceZoneBlock(DEFAULT_SWEEP_JSON, 'LOW'), compiledJS: "if (!lift.sweepDirection) lift.sweepDirection = 1; let target = Building.findSweepTarget(lift.sweepDirection, false); if (target === -1) { lift.sweepDirection *= -1; target = Building.findSweepTarget(lift.sweepDirection, false, true); } if (target !== -1) Building.setTarget(target);" },
        { id: 'sys_zoned_high', name: "Zoned High", description: "Sweep policy for the scalable upper service band.", author: "System", version: "1.0", serviceZone: { mode: 'high' }, blocklyData: withServiceZoneBlock(DEFAULT_SWEEP_JSON, 'HIGH'), compiledJS: "if (!lift.sweepDirection) lift.sweepDirection = 1; let target = Building.findSweepTarget(lift.sweepDirection, false); if (target === -1) { lift.sweepDirection *= -1; target = Building.findSweepTarget(lift.sweepDirection, false, true); } if (target !== -1) Building.setTarget(target);" }
    ];

    const AutomationVM = {
        scripts: [],
        cache: new Map(), // scriptId -> compiled Function
        maxScriptLength: 12000,
        // Worker startup/compilation is part of the deadline in browsers. Keep
        // this bounded, but allow normal startup under an audio-enabled page.
        executionDeadlineMs: 250,
        pendingWorkers: new Map(),
        forbiddenSource: /\b(?:while|for|do|window|document|globalThis|localStorage|sessionStorage|fetch|XMLHttpRequest|WebSocket|eval|Function|constructor|import)\b/,

        validateSource: function(source) {
            if (typeof source !== 'string' || source.length === 0) {
                return { valid: false, reason: 'Script is empty.' };
            }
            if (source.length > this.maxScriptLength) {
                return { valid: false, reason: `Script exceeds ${this.maxScriptLength} characters.` };
            }
            const forbidden = source.match(this.forbiddenSource);
            if (forbidden) {
                return { valid: false, reason: `Unsupported construct: ${forbidden[0]}.` };
            }
            return { valid: true };
        },
        
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

        getScript: function(identifier) {
            if (!identifier) return null;
            const aliases = {
                'sweep': 'sys_sweep',
                'priority-sweep': 'sys_priority',
                'voting': 'sys_voting',
                'weighted-voting': 'sys_weighted',
                'zoned-low': 'sys_zoned_low',
                'zoned-high': 'sys_zoned_high'
            };
            const raw = String(identifier);
            const id = aliases[raw] || raw.replace(/^custom_/, '');
            return this.scripts.find(script => script.id === id) || null;
        },

        normalizeServiceZone: function(metadata) {
            if (!metadata || typeof metadata !== 'object') return null;
            const mode = String(metadata.mode || 'none').toLowerCase();
            if (!['low', 'high', 'custom'].includes(mode)) return null;
            const normalized = { mode };
            if (mode === 'custom') {
                const lower = Number(metadata.lower);
                const upper = Number(metadata.upper);
                if (!Number.isInteger(lower) || !Number.isInteger(upper)) return null;
                normalized.lower = lower;
                normalized.upper = upper;
            }
            return normalized;
        },

        resolveServiceZone: function(metadata, floorCount) {
            const maxFloor = Math.max(0, Number(floorCount) - 1);
            const zone = this.normalizeServiceZone(metadata);
            if (!zone) return { mode: 'none', lower: 0, upper: maxFloor, active: false };
            if (zone.mode === 'low' || zone.mode === 'high') {
                const pivot = Math.min(maxFloor, Math.ceil(maxFloor / 2));
                return zone.mode === 'low'
                    ? { mode: 'low', lower: 0, upper: pivot, active: true }
                    : { mode: 'high', lower: pivot, upper: maxFloor, active: true };
            }
            if (zone.lower < 0 || zone.upper < zone.lower || zone.upper > maxFloor) {
                return { mode: 'none', lower: 0, upper: maxFloor, active: false };
            }
            return { mode: 'custom', lower: zone.lower, upper: zone.upper, active: true };
        },

        getServiceZoneLabel: function(metadata, floorCount) {
            const resolved = this.resolveServiceZone(metadata, floorCount);
            if (!resolved.active) return 'Full building';
            const floorLabel = floor => floor === 0 ? 'G' : String(floor);
            return `${floorLabel(resolved.lower)}–${floorLabel(resolved.upper)}`;
        },

        applyPolicyToLift: function(lift, identifier) {
            const script = this.getScript(identifier);
            const zoningEnabled = typeof window.Registry?.isZoningEnabled === 'function' && window.Registry.isZoningEnabled();
            const resolved = zoningEnabled
                ? this.resolveServiceZone(script?.serviceZone, window.Config.numFloors)
                : { mode: 'none', lower: 0, upper: Math.max(0, window.Config.numFloors - 1), active: false };
            lift.servicePolicy = {
                id: script?.id || null,
                version: script?.version || null,
                mode: resolved.mode,
                active: resolved.active,
                lower: resolved.lower,
                upper: resolved.upper
            };
            lift.serviceLower = resolved.lower;
            lift.serviceUpper = resolved.upper;
            return resolved;
        },

        extractServiceZone: function(blocklyData) {
            let found = null;
            const visit = block => {
                if (!block || found) return;
                if (block.type === 'service_zone') {
                    const mode = String(block.fields?.MODE || 'CUSTOM').toLowerCase();
                    found = mode === 'low' || mode === 'high'
                        ? { mode }
                        : { mode: 'custom', lower: Number(block.fields?.LOWER), upper: Number(block.fields?.UPPER) };
                    return;
                }
                Object.values(block.inputs || {}).forEach(input => visit(input.block));
                if (block.next) visit(block.next);
            };
            (blocklyData?.blocks?.blocks || []).forEach(visit);
            return found;
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
            const script = this.getScript(id);
            
            if (!script || !script.compiledJS) return;

            if (script.author !== 'System') {
                this.executeIsolated(lift, script, id);
                return;
            }

            let fn = this.cache.get(id);
            if (!fn) {
                try {
                    const validation = this.validateSource(script.compiledJS);
                    if (!validation.valid) throw new Error(validation.reason);
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

        executeIsolated: function(lift, script, id) {
            if (this.pendingWorkers.has(lift.id) || typeof Worker === 'undefined') return;
            const validation = this.validateSource(script.compiledJS);
            if (!validation.valid) {
                this.reportExecutionError(script, validation.reason);
                return;
            }
            const bridge = this.getBuildingBridge(lift);
            const floorCount = window.Config.numFloors;
            const snapshot = {
                lift: {
                    pos: lift.pos, targetFloor: lift.targetFloor, sweepDirection: lift.sweepDirection,
                    commandRevision: lift.commandRevision || 0,
                    serviceLower: lift.serviceLower, serviceUpper: lift.serviceUpper,
                    passengers: lift.passengers.map(passenger => ({ dest: passenger.dest, boardingWeight: passenger.boardingWeight, isGymBro: passenger.isGymBro }))
                },
                floor: bridge.getFloor(),
                direction: bridge.getPhysicalDirection(),
                capacity: bridge.getEffectiveCapacity(),
                freeCapacity: bridge.getFreeCapacity(),
                nearest: ['critical', 'annoyed', 'happy', 'vip', 'destination', 'any_waiting'].reduce((result, type) => {
                    result[type] = bridge.getNearestTarget(type);
                    return result;
                }, {}),
                sweep: {
                    '1:false': bridge.findSweepTarget(1, false), '1:true': bridge.findSweepTarget(1, true),
                    '-1:false': bridge.findSweepTarget(-1, false), '-1:true': bridge.findSweepTarget(-1, true)
                },
                waiting: Array.from({ length: floorCount }, (_, floor) => bridge.getWaitingCount(floor)),
                claimed: Array.from({ length: floorCount }, (_, floor) => bridge.isFloorClaimed(floor)),
                randomFloor: bridge.randomFloor(), floorCount
            };
            const workerSource = `self.onmessage = ({ data }) => {
                const { source, snapshot } = data; const actions = {};
                const lift = { ...snapshot.lift, passengers: snapshot.lift.passengers.slice() };
                const Building = Object.freeze({
                    setTarget: floor => {
                        const lower = Number.isInteger(snapshot.lift.serviceLower) ? snapshot.lift.serviceLower : 0;
                        const upper = Number.isInteger(snapshot.lift.serviceUpper) ? snapshot.lift.serviceUpper : snapshot.floorCount - 1;
                        const existingPassenger = snapshot.lift.passengers.some(passenger => passenger.dest === floor);
                        if (Number.isInteger(floor) && (existingPassenger || (floor >= lower && floor <= upper)) && floor >= 0 && floor < snapshot.floorCount) actions.targetFloor = floor;
                    },
                    getFloor: () => snapshot.floor, getPhysicalDirection: () => snapshot.direction,
                    getCapacity: () => snapshot.capacity, getEffectiveCapacity: () => snapshot.capacity,
                    getFreeCapacity: () => snapshot.freeCapacity, getCurrentWeight: () => snapshot.capacity - snapshot.freeCapacity,
                    getNearestTarget: type => snapshot.nearest[type] ?? -1,
                    findSweepTarget: (dir, priority) => snapshot.sweep[String(dir) + ':' + Boolean(priority)] ?? -1,
                    getWaitingCount: floor => snapshot.waiting[floor] ?? 0,
                    isFloorClaimed: floor => snapshot.claimed[floor] === true,
                    randomFloor: () => snapshot.randomFloor
                });
                try { (new Function('lift', 'Building', 'Config', source))(lift, Building, Object.freeze({ numFloors: snapshot.floorCount, liftCapacity: snapshot.capacity }));
                    if (lift.sweepDirection === 1 || lift.sweepDirection === -1) actions.sweepDirection = lift.sweepDirection;
                    self.postMessage({ ok: true, actions });
                } catch (error) { self.postMessage({ ok: false, error: String(error && error.message || error) }); }
            };`;
            const url = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }));
            const worker = new Worker(url);
            const cleanup = () => {
                clearTimeout(deadline);
                this.pendingWorkers.delete(lift.id);
                worker.terminate();
                URL.revokeObjectURL(url);
            };
            const deadline = setTimeout(() => {
                cleanup();
                this.reportExecutionError(script, `execution exceeded ${this.executionDeadlineMs}ms and was terminated`);
            }, this.executionDeadlineMs);
            this.pendingWorkers.set(lift.id, worker);
            worker.onmessage = ({ data }) => {
                cleanup();
                if (!data.ok) return this.reportExecutionError(script, data.error);
                    // A player command made while the worker was running owns the
                    // lift. Never let a stale asynchronous policy result overwrite it.
                    if ((lift.commandRevision || 0) !== (snapshot.lift.commandRevision || 0) || lift.manualOverride) return;
                    if (Number.isInteger(data.actions.targetFloor)) {
                        const target = data.actions.targetFloor;
                        const inZone = !Registry.isZoningEnabled?.() || Registry.isFloorInLiftZone(lift, target);
                        const existingPassenger = lift.passengers.some(passenger => passenger.dest === target);
                        if ((inZone || existingPassenger) && typeof window.applyLiftTarget === 'function') {
                            window.applyLiftTarget(lift.id, target, { manualOverride: false });
                        }
                    }
                if (data.actions.sweepDirection === 1 || data.actions.sweepDirection === -1) lift.sweepDirection = data.actions.sweepDirection;
                if (window.Registry) window.Registry.customScriptTicks = (window.Registry.customScriptTicks || 0) + 1;
            };
            worker.onerror = event => { cleanup(); this.reportExecutionError(script, event.message || 'worker error'); };
            worker.postMessage({ source: script.compiledJS, snapshot });
        },

        reportExecutionError: function(script, message) {
            if (typeof Telemetry !== 'undefined') Telemetry.add('VM', `Runtime error in [${script.name}]: ${message}`, 'error');
            console.error(`VM: Runtime error in [${script.name}]`, message);
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
                findSweepTarget: (dir, prio, includeCurrent) => R.findSweepTarget(lift, dir, prio, includeCurrent),
                getBestFloor: (weighted) => R.getBestFloor(lift, weighted),
                randomFloor: () => (typeof window.getAutomationRandomFloor === 'function' ? window.getAutomationRandomFloor() : 0),
                
                // Control Methods
                setTarget: (floor) => {
                    let f = parseInt(floor);
                    const isDouble = lift.isDoubleDecker || (lift.doubleDeckerTimer && lift.doubleDeckerTimer > 0);
                    const maxAllowed = isDouble ? (window.Config.numFloors - 2) : (window.Config.numFloors - 1);
                    const existingPassenger = lift.passengers.some(passenger => passenger.dest === f);
                    const inZone = !R.isZoningEnabled || !R.isZoningEnabled() || R.isFloorInLiftZone(lift, f);
                    if (!isNaN(f) && f >= 0 && f <= maxAllowed && (inZone || existingPassenger)) {
                        if (typeof window.applyLiftTarget === 'function') window.applyLiftTarget(lift.id, f, { manualOverride: false });
                        else lift.targetFloor = f;
                    }
                },
                
                // Passenger Stats
                getLoad: () => R.getLiftWeight(lift),
                getCapacity: () => window.Config.liftCapacity,
                getEffectiveCapacity: () => (typeof PowerUps !== 'undefined') ? PowerUps.getLiftCapacity(lift.id) : window.Config.liftCapacity,
                getFreeCapacity: () => {
                    const capacity = (typeof PowerUps !== 'undefined') ? PowerUps.getLiftCapacity(lift.id) : window.Config.liftCapacity;
                    return Math.max(0, capacity - R.getLiftWeight(lift));
                },
                getCurrentWeight: () => R.getLiftWeight(lift),

                floorHeight: R.floorHeight,
                numFloors: window.Config.numFloors
            };
        }
    };

    window.Game.Automation = AutomationVM;
})();
