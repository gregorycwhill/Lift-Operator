// ============================================================================
// AUTOMATION-CONTROLLER.JS : IN-GAME AUTOMATION DEPLOYMENT UI
// ============================================================================

window.Game = window.Game || {};

(function () {
    const controller = {
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

        renderDock({ autoLobby, controlRow }) {
            const catalog = this.getCatalog();
            const state = { committedPolicy: null, previewPolicy: Registry.automationControllerPreviewPolicy || 'manual', lifts: new Set(), guidance: 'none', isApplying: false };
            autoLobby.classList.add('automation-dock-host');
            autoLobby.innerHTML = '';
            controlRow.dataset.automationController = 'dock';

            const dock = document.createElement('div');
            dock.className = 'automation-dock automation-dock-compact';
            dock.setAttribute('aria-label', 'Automation Dock');
            let guidanceTimer = null;
            const clearGuidance = () => {
                if (guidanceTimer) clearTimeout(guidanceTimer);
                guidanceTimer = null;
                state.guidance = 'none';
                dock.classList.remove('automation-policy-hint', 'automation-target-hint-active');
                controlRow.querySelectorAll('.automation-status').forEach(status => status.classList.remove('automation-target-hint'));
            };
            const requestGuidance = type => {
                if (state.isApplying) return;
                clearGuidance();
                state.guidance = type;
                guidanceTimer = setTimeout(() => {
                    guidanceTimer = null;
                    state.guidance = 'none';
                    renderInteraction();
                }, 10000);
                renderInteraction();
            };
            let policies = catalog.filter(item => item.pinned);
            const carousel = document.createElement('div'); carousel.className = 'automation-carousel';
            const previous = document.createElement('button'); previous.type = 'button'; previous.className = 'automation-carousel-arrow'; previous.textContent = '‹'; previous.setAttribute('aria-label', 'Previous automation');
            const next = document.createElement('button'); next.type = 'button'; next.className = 'automation-carousel-arrow'; next.textContent = '›'; next.setAttribute('aria-label', 'Next automation');
            const viewport = document.createElement('div'); viewport.className = 'automation-carousel-viewport';
            const card = document.createElement('button'); card.type = 'button'; card.className = 'automation-policy-btn automation-carousel-card';
            const indicator = document.createElement('span'); indicator.className = 'automation-carousel-indicator';
            const pinned = document.createElement('div'); pinned.className = 'automation-dock-pinned';
            const renderInteraction = () => {
                const policyExplicit = Boolean(state.committedPolicy);
                const ready = policyExplicit && state.lifts.size > 0;
                dock.dataset.policyExplicit = String(policyExplicit);
                dock.dataset.selectedLiftCount = String(state.lifts.size);
                applyButton.disabled = !ready;
                dock.classList.toggle('automation-ready', ready);
                const guidance = state.isApplying ? 'none' : state.guidance;
                dock.classList.toggle('automation-policy-hint', guidance === 'policy');
                dock.classList.toggle('automation-target-hint-active', guidance === 'lifts');
                controlRow.querySelectorAll('.automation-status').forEach(status => {
                    status.classList.toggle('automation-target-hint', guidance === 'lifts');
                });
            };
            const renderPreview = () => {
                const index = Math.max(0, policies.findIndex(item => item.value === state.previewPolicy));
                state.carouselIndex = index === -1 ? 0 : index;
                const item = policies[state.carouselIndex] || policies[0];
                if (!item) return;
                state.previewPolicy = item.value;
                Registry.automationControllerPreviewPolicy = item.value;
                card.dataset.policy = item.value; card.textContent = item.name;
                card.classList.toggle('selected', state.committedPolicy === item.value);
                card.classList.toggle('automation-policy-preview', state.committedPolicy !== item.value);
                card.dataset.selectedPolicy = state.committedPolicy || '';
                indicator.textContent = `${state.carouselIndex + 1}/${policies.length}`;
                renderInteraction();
            };
            const commitPreview = () => {
                state.committedPolicy = state.previewPolicy;
                Registry.automationControllerSelectedPolicy = state.committedPolicy;
                window.Game.UI?.showToast?.(state.lifts.size ? 'Automation selected. Apply when ready.' : 'Choose lift(s), then Apply.');
                if (state.lifts.size) {
                    clearGuidance();
                    renderPreview();
                } else {
                    renderPreview();
                    requestGuidance('lifts');
                }
            };
            card.addEventListener('click', event => { event.stopPropagation(); commitPreview(); });
            previous.addEventListener('click', event => { event.stopPropagation(); state.carouselIndex = (state.carouselIndex - 1 + policies.length) % policies.length; state.previewPolicy = policies[state.carouselIndex].value; clearGuidance(); renderPreview(); });
            next.addEventListener('click', event => { event.stopPropagation(); state.carouselIndex = (state.carouselIndex + 1) % policies.length; state.previewPolicy = policies[state.carouselIndex].value; clearGuidance(); renderPreview(); });
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
                status.addEventListener('click', event => {
                    event.stopPropagation();
                    if (state.isApplying) return;
                    state.lifts.has(index) ? state.lifts.delete(index) : state.lifts.add(index);
                    status.classList.toggle('selected', state.lifts.has(index));
                    status.setAttribute('aria-pressed', String(state.lifts.has(index)));
                    if (!state.committedPolicy && state.lifts.size) requestGuidance('policy');
                    else { clearGuidance(); renderInteraction(); }
                });
                statusRow.appendChild(status);
            });
            controlRow.appendChild(statusRow);
            renderPreview();

            applyButton.addEventListener('click', event => {
                event.stopPropagation();
                if (state.isApplying) return;
                const targets = [...state.lifts];
                if (!state.committedPolicy || !targets.length) return;
                state.isApplying = true;
                clearGuidance();
                const result = this.assign(state.committedPolicy, targets);
                state.lifts.clear();
                statusRow.querySelectorAll('.automation-status').forEach(button => { button.classList.remove('selected', 'automation-target-hint'); button.setAttribute('aria-pressed', 'false'); });
                state.isApplying = false;
                clearGuidance();
                renderInteraction();
                if (result.ok) window.Game.UI?.showToast?.(`${result.policy.name} applied to ${result.liftIndexes.length} lift${result.liftIndexes.length === 1 ? '' : 's'}.`);
                else window.Game.UI?.showToast?.(result.reason);
            });
            clearButton.addEventListener('click', event => { event.stopPropagation(); state.lifts.clear(); state.committedPolicy = null; clearGuidance(); statusRow.querySelectorAll('.automation-status').forEach(button => { button.classList.remove('selected', 'automation-target-hint'); button.setAttribute('aria-pressed', 'false'); }); renderPreview(); });
            libraryButton.addEventListener('click', event => { event.stopPropagation(); this.openLibrary(state, catalog, item => { state.previewPolicy = item.value; state.committedPolicy = item.value; Registry.automationControllerSelectedPolicy = state.committedPolicy; window.Game.UI?.showToast?.(state.lifts.size ? 'Automation selected. Apply when ready.' : 'Choose lift(s), then Apply.'); renderPreview(); if (state.lifts.size) clearGuidance(); else requestGuidance('lifts'); }, pinned, () => { policies = catalog.filter(item => item.pinned); clearGuidance(); renderPreview(); }); });
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
            const close = document.createElement('button'); close.type = 'button'; close.className = 'btn btn-gray btn-small automation-library-toggle'; close.textContent = '\u00D7'; close.setAttribute('aria-label', 'Close automation library'); close.title = 'Close automation library'; close.onclick = () => this.closeLibrary(); header.appendChild(close); panel.appendChild(header);
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
                    const groupLabel = document.createElement('span'); groupLabel.textContent = group.label;
                    const chevron = document.createElement('span'); chevron.className = 'automation-library-chevron'; chevron.textContent = expandedGroup === group.key ? '\u25BE' : '\u25B8';
                    heading.append(groupLabel, chevron);
                    heading.onclick = () => { expandedGroup = expandedGroup === group.key ? null : group.key; draw(); };
                    section.appendChild(heading);
                    if (expandedGroup === group.key) {
                        const itemsEl = document.createElement('div'); itemsEl.className = 'automation-library-items';
                        if (!items.length) { const empty = document.createElement('div'); empty.className = 'automation-library-empty'; empty.textContent = query ? 'No matching automations' : 'No automations yet'; itemsEl.appendChild(empty); }
                        items.forEach(item => {
                            const row = document.createElement('div'); row.className = 'automation-library-item';
                            const select = document.createElement('button'); select.type = 'button'; select.className = 'automation-library-select';
                            const name = document.createElement('span'); name.textContent = item.name;
                            const author = document.createElement('small'); author.textContent = item.author === 'System' ? '' : item.author;
                            select.append(name, author); select.onclick = () => { updatePolicyName(item); this.closeLibrary(); };
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

    controller.renderDock = function ({ autoLobby, controlRow }) {
        const catalog = this.getCatalog();
        const api = this;
        const state = { armedPolicy: null, previewPolicy: Registry.automationControllerPreviewPolicy || 'manual', lifts: new Set(), guidance: 'none' };
        autoLobby.classList.add('automation-dock-host');
        autoLobby.innerHTML = '';
        controlRow.dataset.automationController = 'dock';
        Registry.automationControllerSelectedPolicy = null;

        const dock = document.createElement('div');
        dock.className = 'automation-dock automation-dock-compact';
        dock.setAttribute('aria-label', 'Automation Dock');
        let guidanceTimer = null;
        let policies = catalog.filter(item => item.pinned);
        const clearGuidance = () => {
            if (guidanceTimer) clearTimeout(guidanceTimer);
            guidanceTimer = null;
            state.guidance = 'none';
            dock.classList.remove('automation-policy-hint', 'automation-target-hint-active');
            controlRow.querySelectorAll('.automation-status').forEach(status => status.classList.remove('automation-target-hint'));
        };
        const requestGuidance = type => {
            clearGuidance();
            state.guidance = type;
            guidanceTimer = setTimeout(() => { guidanceTimer = null; state.guidance = 'none'; renderInteraction(); }, 5000);
            renderInteraction();
        };
        const carousel = document.createElement('div'); carousel.className = 'automation-carousel';
        const previous = document.createElement('button'); previous.type = 'button'; previous.className = 'automation-carousel-arrow'; previous.textContent = '\u2039'; previous.setAttribute('aria-label', 'Previous automation');
        const next = document.createElement('button'); next.type = 'button'; next.className = 'automation-carousel-arrow'; next.textContent = '\u203A'; next.setAttribute('aria-label', 'Next automation');
        const viewport = document.createElement('div'); viewport.className = 'automation-carousel-viewport';
        const card = document.createElement('button'); card.type = 'button'; card.className = 'automation-policy-btn automation-carousel-card';
        const indicator = document.createElement('span'); indicator.className = 'automation-carousel-indicator';
        const actions = document.createElement('div'); actions.className = 'automation-dock-actions';
        const libraryButton = document.createElement('button'); libraryButton.type = 'button'; libraryButton.className = 'btn btn-gray btn-small'; libraryButton.textContent = 'Library';
        actions.append(libraryButton); dock.append(actions); autoLobby.appendChild(dock);

        const statusRow = document.createElement('div'); statusRow.className = 'automation-status-row';
        const renderInteraction = () => {
            dock.dataset.armedPolicy = state.armedPolicy || '';
            dock.dataset.selectedLiftCount = String(state.lifts.size);
            dock.classList.toggle('automation-armed', Boolean(state.armedPolicy));
            dock.classList.toggle('automation-policy-hint', state.guidance === 'policy');
            dock.classList.toggle('automation-target-hint-active', state.guidance === 'lifts');
            statusRow.querySelectorAll('.automation-status').forEach(status => {
                const selected = state.lifts.has(Number(status.dataset.liftIndex));
                status.classList.toggle('selected', selected);
                status.classList.toggle('automation-target-hint', state.guidance === 'lifts' && Boolean(state.armedPolicy));
                status.setAttribute('aria-pressed', String(selected));
            });
        };
        const renderPreview = () => {
            const found = policies.findIndex(item => item.value === state.previewPolicy);
            state.carouselIndex = found < 0 ? 0 : found;
            const item = policies[state.carouselIndex] || policies[0];
            if (!item) return;
            state.previewPolicy = item.value;
            Registry.automationControllerPreviewPolicy = item.value;
            card.dataset.policy = item.value;
            card.dataset.armedPolicy = state.armedPolicy || '';
            card.textContent = item.name;
            card.classList.toggle('selected', state.armedPolicy === item.value);
            card.classList.toggle('automation-policy-preview', state.armedPolicy !== item.value);
            card.title = state.armedPolicy && state.armedPolicy !== item.value
                ? `Preview ${item.name}; another automation is active`
                : state.armedPolicy === item.value ? `${item.name} selected; click again to disarm` : `Preview ${item.name}; click to select`;
            indicator.textContent = `${state.carouselIndex + 1}/${policies.length}`;
            renderInteraction();
        };
        const refreshStatuses = targets => targets.forEach(index => {
            const status = statusRow.querySelector(`[data-lift-index="${index}"]`);
            const lift = Registry.lifts[index];
            if (status && lift) {
                const automationName = api.getPolicy(lift.automation)?.name || lift.automation;
                status.textContent = automationName;
                status.title = `Lift ${index + 1}: ${automationName}`;
                status.setAttribute('aria-label', `Lift ${index + 1}, automation ${automationName}`);
            }
        });
        const assignTo = (policy, targets, clearBatch = false) => {
            const result = api.assign(policy, targets);
            if (!result.ok) { window.Game.UI?.showToast?.(result.reason); return result; }
            refreshStatuses(result.liftIndexes);
            if (clearBatch) state.lifts.clear();
            clearGuidance();
            renderInteraction();
            window.Game.UI?.showToast?.(`${result.policy.name} applied to ${result.liftIndexes.length} lift${result.liftIndexes.length === 1 ? '' : 's'}.`);
            return result;
        };
        const armPolicy = policy => {
            if (!api.getPolicy(policy)) return;
            state.previewPolicy = policy;
            state.armedPolicy = policy;
            Registry.automationControllerSelectedPolicy = policy;
            document.dispatchEvent(new CustomEvent('automation-tutorial-action', { detail: { action: 'arm', policy } }));
            renderPreview();
            if (state.lifts.size) assignTo(policy, [...state.lifts], true);
            else requestGuidance('lifts');
        };
        const togglePolicy = () => {
            if (state.armedPolicy === state.previewPolicy) {
                state.armedPolicy = null;
                Registry.automationControllerSelectedPolicy = null;
                clearGuidance();
                renderPreview();
                window.Game.UI?.showToast?.('Automation disarmed. Select lift(s) for a batch.');
            } else armPolicy(state.previewPolicy);
        };
        card.addEventListener('click', event => { event.stopPropagation(); togglePolicy(); });
        previous.addEventListener('click', event => { event.stopPropagation(); clearGuidance(); state.carouselIndex = (state.carouselIndex - 1 + policies.length) % policies.length; state.previewPolicy = policies[state.carouselIndex].value; document.dispatchEvent(new CustomEvent('automation-tutorial-action', { detail: { action: 'browse', policy: state.previewPolicy } })); renderPreview(); });
        next.addEventListener('click', event => { event.stopPropagation(); clearGuidance(); state.carouselIndex = (state.carouselIndex + 1) % policies.length; state.previewPolicy = policies[state.carouselIndex].value; document.dispatchEvent(new CustomEvent('automation-tutorial-action', { detail: { action: 'browse', policy: state.previewPolicy } })); renderPreview(); });
        viewport.append(card); carousel.append(previous, viewport, next, indicator); dock.insertBefore(carousel, actions);

        Registry.lifts.forEach((lift, index) => {
            const status = document.createElement('button'); status.type = 'button'; status.className = 'automation-status'; status.dataset.liftIndex = index;
            const automationName = api.getPolicy(lift.automation)?.name || lift.automation;
            status.textContent = automationName;
            status.title = `Lift ${index + 1}: ${automationName}`;
            status.setAttribute('aria-label', `Lift ${index + 1}, automation ${automationName}`);
            status.setAttribute('aria-pressed', 'false');
            status.addEventListener('click', event => {
                event.stopPropagation();
                if (state.armedPolicy) { const policy = state.armedPolicy; assignTo(policy, [index]); document.dispatchEvent(new CustomEvent('automation-tutorial-action', { detail: { action: 'deploy', index, policy } })); return; }
                state.lifts.has(index) ? state.lifts.delete(index) : state.lifts.add(index);
                clearGuidance();
                if (state.lifts.size) requestGuidance('policy'); else renderInteraction();
            });
            statusRow.appendChild(status);
        });
        controlRow.appendChild(statusRow);
        libraryButton.addEventListener('click', event => {
            event.stopPropagation();
            api.openLibrary(state, catalog, item => { api.closeLibrary(); armPolicy(item.value); }, null, () => { policies = catalog.filter(item => item.pinned); clearGuidance(); renderPreview(); });
        });
        renderPreview();
    };

    window.Game.AutomationController = controller;
})();
