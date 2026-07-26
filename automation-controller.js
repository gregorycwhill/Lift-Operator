// ============================================================================
// AUTOMATION-CONTROLLER.JS : SWAPPABLE IN-GAME AUTOMATION DEPLOYMENT UI
// ============================================================================

window.Game = window.Game || {};

(function () {
    const controller = {
        variants: { legacy: 'Legacy selectors', dock: 'Automation Dock' },

        getVariant() {
            return Registry.automationControllerVariant === 'dock' ? 'dock' : 'legacy';
        },

        getCatalog() {
            const unlocks = Config.GAME_DATA.automationUnlocks || {};
            const reachedRound = Math.max(Registry.highestUnlockedRound || 1, Registry.stats.round || 1);
            const debug = Boolean(Config.debugMode);
            const vm = window.Game.Automation;
            const currentPlayer = Registry.playerName || window.Game.Storage.get(window.Game.Keys.PLAYER, 'Pilot 1');
            const catalog = [{ value: 'manual', name: 'Manual', group: 'Built-in', author: 'System', pinned: true }];
            const systemValues = {
                sys_sweep: ['sweep', unlocks.sweep],
                sys_priority: ['priority-sweep', unlocks.priority],
                sys_voting: ['voting', unlocks.voting],
                sys_weighted: ['weighted-voting', unlocks.voting],
                sys_zoned_low: ['zoned-low', 14],
                sys_zoned_high: ['zoned-high', 14]
            };
            const customUnlocked = debug || reachedRound >= (unlocks.custom || 999);
            const zoningUnlocked = debug || reachedRound >= 14;
            (vm?.scripts || []).forEach(script => {
                const system = systemValues[script.id];
                const zoneVisible = !script.serviceZone || zoningUnlocked;
                if (script.author === 'System' && system) {
                    if (debug || reachedRound >= system[1]) {
                        const zone = script.serviceZone ? ` [${vm.getServiceZoneLabel?.(script.serviceZone, Config.numFloors) || 'zoned'}]` : '';
                        catalog.push({ value: system[0], name: `${script.name}${zone}`, group: 'Built-in', author: 'System', pinned: true });
                    }
                } else if (customUnlocked && zoneVisible) {
                    const zone = script.serviceZone ? ` [${vm.getServiceZoneLabel?.(script.serviceZone, Config.numFloors) || 'zoned'}]` : '';
                    const mine = script.author === currentPlayer;
                    catalog.push({
                        value: `custom_${script.id}`,
                        name: `${script.name}${zone}`,
                        group: mine ? 'My Automations' : 'Shared with Me',
                        author: script.author,
                        pinned: false
                    });
                }
            });
            return catalog;
        },

        getPolicy(value) { return this.getCatalog().find(item => item.value === value) || null; },

        assign(policy, liftIndexes) {
            const item = this.getPolicy(policy);
            const targets = [...new Set((liftIndexes || []).map(Number))]
                .filter(index => Number.isInteger(index) && Registry.lifts[index]);
            if (!item || !targets.length) return { ok: false, reason: 'Choose a policy and at least one lift.' };
            targets.forEach(index => {
                const engine = GameEngine();
                if (typeof engine.setLiftAutomation === 'function') engine.setLiftAutomation(index, item.value);
                else window.setLiftAutomation(index, item.value);
            });
            return { ok: true, policy: item, liftIndexes: targets };
        },

        setVariant(variant) {
            const next = variant === 'dock' && Config.debugMode ? 'dock' : 'legacy';
            Registry.automationControllerVariant = next;
            document.querySelector('.automation-library-overlay')?.remove();
            if (typeof window.buildWorld === 'function') window.buildWorld();
            const selector = document.getElementById('automationControllerVariant');
            if (selector) selector.value = next;
            return next;
        },

        renderLegacy({ controlRow }) {
            // Legacy controls remain owned by ui-core.js for compatibility.
            controlRow.dataset.automationController = 'legacy';
        },

        renderDock({ autoLobby, controlRow }) {
            const catalog = this.getCatalog();
            const state = { policy: Registry.automationControllerSelectedPolicy || 'manual', lifts: new Set(), library: null };
            autoLobby.classList.add('automation-dock-host');
            autoLobby.innerHTML = '';
            controlRow.dataset.automationController = 'dock';

            const dock = document.createElement('div');
            dock.className = 'automation-dock';
            dock.setAttribute('aria-label', 'Automation Dock');
            const title = document.createElement('div');
            title.className = 'automation-dock-title';
            title.textContent = 'Deploy automation';
            dock.appendChild(title);

            const policyName = document.createElement('span');
            policyName.className = 'automation-dock-policy';
            const updatePolicyName = () => { policyName.textContent = `Selected: ${this.getPolicy(state.policy)?.name || 'Manual'}`; };
            updatePolicyName();
            dock.appendChild(policyName);

            const pinned = document.createElement('div');
            pinned.className = 'automation-dock-pinned';
            catalog.filter(item => item.pinned).forEach(item => {
                const button = document.createElement('button');
                button.type = 'button'; button.className = 'automation-policy-btn'; button.textContent = item.name;
                button.dataset.policy = item.value;
                button.addEventListener('click', event => {
                    event.stopPropagation(); state.policy = item.value; Registry.automationControllerSelectedPolicy = item.value; updatePolicyName();
                    pinned.querySelectorAll('.automation-policy-btn').forEach(b => b.classList.toggle('selected', b === button));
                });
                pinned.appendChild(button);
            });
            dock.appendChild(pinned);

            const actions = document.createElement('div'); actions.className = 'automation-dock-actions';
            const libraryButton = document.createElement('button'); libraryButton.type = 'button'; libraryButton.className = 'btn btn-gray btn-small'; libraryButton.textContent = 'Library';
            const applyButton = document.createElement('button'); applyButton.type = 'button'; applyButton.className = 'btn btn-green btn-small'; applyButton.textContent = 'Apply';
            const clearButton = document.createElement('button'); clearButton.type = 'button'; clearButton.className = 'btn btn-gray btn-small'; clearButton.textContent = 'Clear';
            actions.append(libraryButton, applyButton, clearButton); dock.appendChild(actions); autoLobby.appendChild(dock);

            const statusRow = document.createElement('div'); statusRow.className = 'automation-status-row';
            Registry.lifts.forEach((lift, index) => {
                const status = document.createElement('button'); status.type = 'button'; status.className = 'automation-status'; status.dataset.liftIndex = index;
                status.textContent = `L${index + 1}: ${this.getPolicy(lift.automation)?.name || lift.automation}`;
                status.setAttribute('aria-pressed', 'false');
                status.addEventListener('click', event => { event.stopPropagation(); state.lifts.has(index) ? state.lifts.delete(index) : state.lifts.add(index); status.classList.toggle('selected', state.lifts.has(index)); status.setAttribute('aria-pressed', String(state.lifts.has(index))); });
                statusRow.appendChild(status);
            });
            controlRow.appendChild(statusRow);

            applyButton.addEventListener('click', event => { event.stopPropagation(); const result = this.assign(state.policy, [...state.lifts]); if (!result.ok) return window.Game.UI?.showToast?.(result.reason); state.lifts.clear(); statusRow.querySelectorAll('.automation-status').forEach(button => { button.classList.remove('selected'); button.setAttribute('aria-pressed', 'false'); }); window.Game.UI?.showToast?.(`${result.policy.name} applied to ${result.liftIndexes.length} lift${result.liftIndexes.length === 1 ? '' : 's'}.`); });
            clearButton.addEventListener('click', event => { event.stopPropagation(); state.lifts.clear(); statusRow.querySelectorAll('.automation-status').forEach(button => { button.classList.remove('selected'); button.setAttribute('aria-pressed', 'false'); }); });
            libraryButton.addEventListener('click', event => { event.stopPropagation(); this.openLibrary(state, catalog, updatePolicyName, pinned); });
        },

        openLibrary(state, catalog, updatePolicyName, pinned) {
            document.querySelector('.automation-library-overlay')?.remove();
            const overlay = document.createElement('div'); overlay.className = 'automation-library-overlay'; overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-label', 'Automation library');
            const panel = document.createElement('div'); panel.className = 'automation-library';
            const header = document.createElement('div'); header.className = 'automation-library-header'; header.innerHTML = '<strong>Automation library</strong>';
            const close = document.createElement('button'); close.type = 'button'; close.className = 'btn btn-gray btn-small'; close.textContent = 'Close'; close.onclick = () => overlay.remove(); header.appendChild(close); panel.appendChild(header);
            const search = document.createElement('input'); search.type = 'search'; search.placeholder = 'Search automations'; search.className = 'automation-library-search'; panel.appendChild(search);
            const list = document.createElement('div'); list.className = 'automation-library-list'; panel.appendChild(list);
            const draw = () => { list.innerHTML = ''; const query = search.value.trim().toLowerCase(); catalog.filter(item => !query || `${item.name} ${item.group} ${item.author}`.toLowerCase().includes(query)).forEach(item => { const button = document.createElement('button'); button.type = 'button'; button.className = 'automation-library-item'; button.innerHTML = `<span>${item.name}</span><small>${item.group}</small>`; button.onclick = () => { state.policy = item.value; Registry.automationControllerSelectedPolicy = item.value; updatePolicyName(); pinned.querySelectorAll('.automation-policy-btn').forEach(b => b.classList.toggle('selected', b.dataset.policy === item.value)); overlay.remove(); }; list.appendChild(button); }); };
            search.addEventListener('input', draw); draw(); overlay.appendChild(panel); document.body.appendChild(overlay); search.focus();
        },

        applyTeachingCue() { return null; }
    };

    window.Game.AutomationController = controller;
})();
