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

        getPinStorageKey() {
            const player = Registry.playerName || window.Game.Storage.get(window.Game.Keys.PLAYER, 'Pilot 1');
            return `liftOp_v2_automationPins_${player}`;
        },

        getSavedPins() {
            const raw = window.Game.Storage.get(this.getPinStorageKey(), '');
            if (!raw) return null;
            try {
                const pins = JSON.parse(raw);
                return Array.isArray(pins) ? pins.filter(value => typeof value === 'string') : null;
            } catch (error) {
                return null;
            }
        },

        setPinned(value, pinned) {
            const existing = this.getSavedPins() || this.getCatalog().filter(item => item.pinned).map(item => item.value);
            const pins = new Set(existing);
            if (value === 'manual') pins.add(value);
            else if (pinned) pins.add(value);
            else pins.delete(value);
            window.Game.Storage.set(this.getPinStorageKey(), JSON.stringify([...pins]));
        },

        getCatalog() {
            const unlocks = Config.GAME_DATA.automationUnlocks || {};
            const reachedRound = Math.max(Registry.highestUnlockedRound || 1, Registry.stats.round || 1);
            const debug = Boolean(Config.debugMode);
            const vm = window.Game.Automation;
            const currentPlayer = Registry.playerName || window.Game.Storage.get(window.Game.Keys.PLAYER, 'Pilot 1');
            const savedPins = this.getSavedPins();
            const isPinned = (value, group) => value === 'manual' || group === 'Built-in' && (savedPins === null || savedPins.includes(value)) || group !== 'Built-in' && savedPins !== null && savedPins.includes(value);
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
                        catalog.push({ value: system[0], name: `${script.name}${zone}`, group: 'Built-in', author: 'System', pinned: isPinned(system[0], 'Built-in') });
                    }
                } else if (customUnlocked && zoneVisible) {
                    const zone = script.serviceZone ? ` [${vm.getServiceZoneLabel?.(script.serviceZone, Config.numFloors) || 'zoned'}]` : '';
                    const mine = script.author === currentPlayer;
                    catalog.push({
                        value: `custom_${script.id}`,
                        name: `${script.name}${zone}`,
                        group: mine ? 'My Automations' : 'Shared with Me',
                        author: script.author,
                        pinned: isPinned(`custom_${script.id}`, mine ? 'My Automations' : 'Shared with Me')
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
            this.closeLibrary();
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
            const state = { policy: Registry.automationControllerSelectedPolicy || 'manual', previewPolicy: Registry.automationControllerSelectedPolicy || 'manual', policyExplicit: Registry.automationControllerSelectedPolicy && Registry.automationControllerSelectedPolicy !== 'manual', lifts: new Set(), library: null };
            autoLobby.classList.add('automation-dock-host');
            autoLobby.innerHTML = '';
            controlRow.dataset.automationController = 'dock';

            const dock = document.createElement('div');
            dock.className = 'automation-dock automation-dock-compact';
            dock.setAttribute('aria-label', 'Automation Dock');
            let guidanceTimer = null;
            let guidanceActive = false;
            const clearGuidance = () => {
                if (guidanceTimer) clearTimeout(guidanceTimer);
                guidanceTimer = null;
                guidanceActive = false;
                dock.classList.remove('automation-policy-hint', 'automation-target-hint-active');
                controlRow.querySelectorAll('.automation-status').forEach(status => status.classList.remove('automation-target-hint'));
            };
            const startGuidance = () => {
                if (guidanceActive) return;
                guidanceActive = true;
                guidanceTimer = setTimeout(clearGuidance, 10000);
            };
            let policies = catalog.filter(item => item.pinned);
            const carousel = document.createElement('div'); carousel.className = 'automation-carousel';
            const previous = document.createElement('button'); previous.type = 'button'; previous.className = 'automation-carousel-arrow'; previous.textContent = '‹'; previous.setAttribute('aria-label', 'Previous automation');
            const next = document.createElement('button'); next.type = 'button'; next.className = 'automation-carousel-arrow'; next.textContent = '›'; next.setAttribute('aria-label', 'Next automation');
            const viewport = document.createElement('div'); viewport.className = 'automation-carousel-viewport';
            const card = document.createElement('button'); card.type = 'button'; card.className = 'automation-policy-btn automation-carousel-card';
            const indicator = document.createElement('span'); indicator.className = 'automation-carousel-indicator';
            const pinned = document.createElement('div'); pinned.className = 'automation-dock-pinned';
            const refreshGuidance = () => {
                const ready = state.policyExplicit && state.lifts.size > 0;
                dock.dataset.policyExplicit = String(state.policyExplicit);
                dock.dataset.selectedLiftCount = String(state.lifts.size);
                applyButton.disabled = !ready;
                dock.classList.toggle('automation-ready', ready);
                const needsPolicy = !state.policyExplicit && state.lifts.size > 0;
                const needsTargets = state.policyExplicit && state.lifts.size === 0;
                if (needsPolicy || needsTargets) startGuidance();
                else clearGuidance();
                dock.classList.toggle('automation-policy-hint', guidanceActive && needsPolicy);
                dock.classList.toggle('automation-target-hint-active', guidanceActive && needsTargets);
                controlRow.querySelectorAll('.automation-status').forEach(status => {
                    status.classList.toggle('automation-target-hint', guidanceActive && needsTargets);
                });
            };
            const updatePolicy = shouldArm => {
                const index = Math.max(0, policies.findIndex(item => item.value === state.previewPolicy));
                state.carouselIndex = index === -1 ? 0 : index;
                const item = policies[state.carouselIndex] || policies[0];
                if (!item) return;
                state.previewPolicy = item.value;
                card.dataset.policy = item.value; card.textContent = item.name;
                card.classList.toggle('selected', state.policyExplicit && state.policy === item.value);
                card.classList.toggle('automation-policy-preview', !state.policyExplicit || state.policy !== item.value);
                card.dataset.selectedPolicy = state.policy;
                indicator.textContent = `${state.carouselIndex + 1}/${policies.length}`;
                if (shouldArm) window.Game.UI?.showToast?.(state.lifts.size ? 'Automation selected. Apply when ready.' : 'Choose lift(s), then Apply.');
                refreshGuidance();
            };
            const commitPreview = () => {
                state.policy = state.previewPolicy;
                state.policyExplicit = true;
                Registry.automationControllerSelectedPolicy = state.policy;
                updatePolicy(true);
            };
            card.addEventListener('click', event => { event.stopPropagation(); commitPreview(); });
            previous.addEventListener('click', event => { event.stopPropagation(); state.carouselIndex = (state.carouselIndex - 1 + policies.length) % policies.length; state.previewPolicy = policies[state.carouselIndex].value; updatePolicy(false); });
            next.addEventListener('click', event => { event.stopPropagation(); state.carouselIndex = (state.carouselIndex + 1) % policies.length; state.previewPolicy = policies[state.carouselIndex].value; updatePolicy(false); });
            viewport.append(card); carousel.append(previous, viewport, next, indicator); dock.appendChild(carousel);

            const actions = document.createElement('div'); actions.className = 'automation-dock-actions';
            const libraryButton = document.createElement('button'); libraryButton.type = 'button'; libraryButton.className = 'btn btn-gray btn-small'; libraryButton.textContent = 'Library';
            const applyButton = document.createElement('button'); applyButton.type = 'button'; applyButton.className = 'btn btn-green btn-small'; applyButton.textContent = 'Apply';
            const clearButton = document.createElement('button'); clearButton.type = 'button'; clearButton.className = 'btn btn-gray btn-small'; clearButton.textContent = 'Clear';
            actions.append(libraryButton, applyButton, clearButton); dock.appendChild(actions); autoLobby.appendChild(dock);

            const statusRow = document.createElement('div'); statusRow.className = 'automation-status-row';
            Registry.lifts.forEach((lift, index) => {
                const status = document.createElement('button'); status.type = 'button'; status.className = 'automation-status'; status.dataset.liftIndex = index;
                status.textContent = `${this.getPolicy(lift.automation)?.name || lift.automation}`;
                status.setAttribute('aria-pressed', 'false');
                status.addEventListener('click', event => { event.stopPropagation(); state.lifts.has(index) ? state.lifts.delete(index) : state.lifts.add(index); status.classList.toggle('selected', state.lifts.has(index)); status.setAttribute('aria-pressed', String(state.lifts.has(index))); refreshGuidance(); });
                statusRow.appendChild(status);
            });
            controlRow.appendChild(statusRow);
            updatePolicy(false);

            applyButton.addEventListener('click', event => { event.stopPropagation(); const result = this.assign(state.policy, [...state.lifts]); if (!result.ok) return window.Game.UI?.showToast?.(result.reason); state.lifts.clear(); statusRow.querySelectorAll('.automation-status').forEach(button => { button.classList.remove('selected', 'automation-target-hint'); button.setAttribute('aria-pressed', 'false'); }); refreshGuidance(); window.Game.UI?.showToast?.(`${result.policy.name} applied to ${result.liftIndexes.length} lift${result.liftIndexes.length === 1 ? '' : 's'}.`); });
            clearButton.addEventListener('click', event => { event.stopPropagation(); state.lifts.clear(); state.policyExplicit = false; statusRow.querySelectorAll('.automation-status').forEach(button => { button.classList.remove('selected', 'automation-target-hint'); button.setAttribute('aria-pressed', 'false'); }); refreshGuidance(); });
            libraryButton.addEventListener('click', event => { event.stopPropagation(); this.openLibrary(state, catalog, item => { state.previewPolicy = item.value; state.policy = item.value; state.policyExplicit = true; Registry.automationControllerSelectedPolicy = state.policy; updatePolicy(true); }, pinned, () => { policies = catalog.filter(item => item.pinned); updatePolicy(false); }); });
            refreshGuidance();
        },

        closeLibrary() {
            this.libraryOverlay?.remove();
            this.libraryOverlay = null;
        },

        openLibrary(state, catalog, updatePolicyName, pinned, onPinChanged) {
            if (this.libraryOverlay) {
                this.closeLibrary();
                return;
            }
            const overlay = document.createElement('div'); overlay.className = 'automation-library-overlay'; overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-label', 'Automation library');
            const panel = document.createElement('div'); panel.className = 'automation-library';
            const header = document.createElement('div'); header.className = 'automation-library-header'; header.innerHTML = '<strong>Automation library</strong>';
            const close = document.createElement('button'); close.type = 'button'; close.className = 'btn btn-gray btn-small automation-library-toggle'; close.textContent = 'Library'; close.setAttribute('aria-label', 'Close automation library'); close.onclick = () => this.closeLibrary(); header.appendChild(close); panel.appendChild(header);
            const search = document.createElement('input'); search.type = 'search'; search.placeholder = 'Search automations'; search.className = 'automation-library-search'; panel.appendChild(search);
            const list = document.createElement('div'); list.className = 'automation-library-list'; panel.appendChild(list);
            const groups = [
                { key: 'Built-in', label: 'Built-in' },
                { key: 'My Automations', label: 'Custom' },
                { key: 'Shared with Me', label: 'Shared with Me' }
            ];
            let expandedGroup = 'Built-in';
            const draw = () => {
                list.innerHTML = '';
                const query = search.value.trim().toLowerCase();
                groups.forEach(group => {
                    const items = catalog.filter(item => item.group === group.key && (!query || `${item.name} ${item.group} ${item.author}`.toLowerCase().includes(query)));
                    if (query && items.length) expandedGroup = group.key;
                    const section = document.createElement('section'); section.className = 'automation-library-group';
                    const heading = document.createElement('button'); heading.type = 'button'; heading.className = 'automation-library-group-toggle'; heading.setAttribute('aria-expanded', String(expandedGroup === group.key));
                    heading.innerHTML = `<span>${group.label}</span><span class="automation-library-chevron">${expandedGroup === group.key ? '▾' : '▸'}</span>`;
                    heading.onclick = () => { expandedGroup = expandedGroup === group.key ? null : group.key; draw(); };
                    section.appendChild(heading);
                    if (expandedGroup === group.key) {
                        const itemsEl = document.createElement('div'); itemsEl.className = 'automation-library-items';
                        if (!items.length) { const empty = document.createElement('div'); empty.className = 'automation-library-empty'; empty.textContent = query ? 'No matching automations' : 'No automations yet'; itemsEl.appendChild(empty); }
                        items.forEach(item => {
                            const row = document.createElement('div'); row.className = 'automation-library-item';
                            const select = document.createElement('button'); select.type = 'button'; select.className = 'automation-library-select'; select.innerHTML = `<span>${item.name}</span><small>${item.author === 'System' ? '' : item.author}</small>`; select.onclick = () => { updatePolicyName(item); this.closeLibrary(); };
                            const pinLabel = document.createElement('label'); pinLabel.className = 'automation-library-pin'; pinLabel.title = item.value === 'manual' ? 'Manual is always pinned' : 'Show in carousel';
                            const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = item.pinned; checkbox.disabled = item.value === 'manual'; checkbox.setAttribute('aria-label', `Pin ${item.name} in carousel`); checkbox.onclick = event => { event.stopPropagation(); this.setPinned(item.value, checkbox.checked); item.pinned = checkbox.checked; onPinChanged?.(); };
                            pinLabel.append(checkbox, document.createTextNode(' Pin')); row.append(select, pinLabel); itemsEl.appendChild(row);
                        });
                        section.appendChild(itemsEl);
                    }
                    list.appendChild(section);
                });
            };
            search.addEventListener('input', draw); draw(); overlay.appendChild(panel); document.body.appendChild(overlay); this.libraryOverlay = overlay; search.focus();
        },

        applyTeachingCue() { return null; }
    };

    window.Game.AutomationController = controller;
})();
