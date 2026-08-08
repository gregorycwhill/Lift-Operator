// ============================================================================
// AUDIO.JS : EVENT BUS, MIXER, AND PROCEDURAL FALLBACK
// ============================================================================

window.Game = window.Game || {};

window.Game.Audio = (function () {
    const STORAGE_KEY = 'lift-operator-audio-v1';
    const sounds = {
        ding: { frequency: 880, type: 'triangle', duration: 0.10, volume: 0.20 },
        error: { frequency: 110, type: 'sawtooth', duration: 0.30, volume: 0.10 },
        powerup: { sweep: [440, 880], type: 'sine', duration: 0.25, volume: 0.20 },
        door: { frequency: 220, type: 'sine', duration: 0.10, volume: 0.05 },
        victory: { sweep: [392, 784], type: 'square', duration: 0.70, volume: 0.16 },
        hazard: { sweep: [180, 80], type: 'sawtooth', duration: 0.22, volume: 0.12 }
    };
    const eventMap = {
        lift_arrived: 'ding', guest_boarded: 'ding',
        powerup_used: 'powerup', hazard_started: 'hazard', hazard_ended: 'ding',
        victory: 'victory', vip_arrival: 'vipArrival', vip_journey: 'vipArrival',
        purchase_confirmed: 'purchase', ui_error: 'uiError', error: 'uiError',
        guest_served: 'ding', guest_defenestrated: 'defenestration', shop_item_selected: 'purchase', round_started: 'ding', failure: 'uiError', retry_started: 'ding'
    };
    let context = null, masterGain = null, musicGain = null, sfxGain = null, menuBuffer = null, menuSource = null, menuSourceStartedAt = 0, menuOffset = 0, rooftopSource = null, pressureLayerGain = null, musakSource = null, musakStopTimer = null;
    const buffers = {}, failedAssets = new Map(), musicSources = [];
    // RC1 policy: ordinary gameplay background tracks are disabled. Menu and Rooftop music remain available;
    // Musak remains a timed player-triggered Power-up effect and non-music SFX remain unchanged.
    const GAMEPLAY_BACKGROUND_MUSIC_ENABLED = false;
    const assetPaths = { menu: 'assets/audio/menu-somewhere-in-the-elevator.ogg', rooftop: 'assets/audio/gameplay-rooftop-trance.mp3', victory: 'assets/audio/victory.mp3', wrench: 'assets/audio/sfx/powerup-wrench-metal.wav', turbo: 'assets/audio/sfx/powerup-rocket-launch.wav', musak: 'assets/audio/sfx/musak-electronic-jazz.mp3', freshener: 'assets/audio/sfx/freesound_community-spray-48068.mp3', tardis: 'assets/audio/sfx/tardis-air-whoosh.wav', doors: 'assets/audio/sfx/wide-doors-old-elevator.mp3', groupThink: 'assets/audio/sfx/dragon-studio-alien-song-323613.mp3', doubleDecker: 'assets/audio/sfx/powerup-double-decker-robot-step.wav', openPlan: 'assets/audio/sfx/powerup-open-plan-metal.wav', jam: 'assets/audio/sfx/hazard-metal-interaction.wav', stink: 'assets/audio/sfx/hazard-tooteffect-90578.mp3', vipArrival: 'assets/audio/sfx/event-vip-fanfare.wav', purchase: 'assets/audio/sfx/ui-purchase-coin.wav', uiError: 'assets/audio/sfx/ui-error-failed.mp3' };
    let initialized = false, currentContext = 'menu', psi = 1, pressureBand = 'calm', musicTimer = null, rooftopActive = false, acceptedEventCount = 0;
    let settings = { muted: false, music: 0.22, sfx: 0.50 };
    const listeners = new Map();
    const fallbackMap = { vipArrival: 'victory', purchase: 'ding', uiError: 'error', defenestration: 'error' };
    const eventCooldownMs = { guest_urgency: 300 };
    const lastPlayedEventAt = new Map();
    let attributionHtml = '';
    let attributionLoad = null;

    try { settings = { ...settings, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; } catch (_) { /* private mode */ }
    const persist = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (_) {} };
    const emit = (name, payload = {}) => (listeners.get(name) || []).forEach(fn => { try { fn(payload); } catch (_) {} });
    const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
    const requiredCredits = manifest => Object.values(manifest?.assets || {}).filter(asset => /^CC-BY\s+[0-9.]+$/i.test(asset.license || ''));
    const licenceUrl = licence => ({
        'CC-BY 3.0': 'https://creativecommons.org/licenses/by/3.0/',
        'CC-BY 4.0': 'https://creativecommons.org/licenses/by/4.0/'
    })[String(licence || '').toUpperCase()] || '';
    const formatAttribution = asset => {
        const title = escapeHtml(asset.title || asset.attribution || 'Untitled audio asset');
        const author = escapeHtml(asset.author || 'Unknown author');
        const licenseName = escapeHtml(asset.license || 'Licence unavailable');
        const licenceLink = licenceUrl(asset.license);
        const license = licenceLink
            ? `<a href="${licenceLink}" target="_blank" rel="noopener noreferrer">${licenseName}</a>`
            : licenseName;
        const modification = escapeHtml(asset.modification || 'No modification recorded');
        const source = String(asset.source || '');
        const sourceLink = /^https:\/\//i.test(source)
            ? ` <a href="${escapeHtml(source)}" target="_blank" rel="noopener noreferrer">Source</a>`
            : '';
        return `<li><strong>${title}</strong> — ${author} (${license}). ${modification}.${sourceLink}</li>`;
    };
    const applyAttributions = html => {
        ['settingsAudioAttribution', 'audioAttribution', 'shellAudioAttribution'].forEach(id => {
            const target = document.getElementById(id);
            if (target) target.innerHTML = html;
        });
    };
    const renderAttributions = () => {
        if (attributionHtml) { applyAttributions(attributionHtml); return Promise.resolve(attributionHtml); }
        if (!attributionLoad) {
            attributionLoad = fetch('assets/audio/manifest.json')
                .then(response => response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`)))
                .then(manifest => {
                    const credits = requiredCredits(manifest);
                    attributionHtml = credits.length
                        ? `<p>CC-BY audio used by Lift Operator:</p><ul class="audio-attribution-list">${credits.map(formatAttribution).join('')}</ul><p>CC0 and Pixabay assets are recorded in the bundled audio attribution file.</p>`
                        : '<p>No CC-BY audio assets are currently loaded.</p>';
                    applyAttributions(attributionHtml);
                    return attributionHtml;
                })
                .catch(() => {
                    attributionHtml = '<p>Unable to load audio credits. See <code>assets/audio/ATTRIBUTION.md</code> in the distribution.</p>';
                    applyAttributions(attributionHtml);
                    return attributionHtml;
                });
        }
        return attributionLoad;
    };

    function init() {
        if (initialized) { if (context && context.state === 'suspended') context.resume().catch(() => {}); return true; }
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return false;
            context = new AudioContext();
            masterGain = context.createGain(); musicGain = context.createGain(); sfxGain = context.createGain();
            musicGain.connect(masterGain); sfxGain.connect(masterGain); masterGain.connect(context.destination);
            initialized = true; applyVolumes(); loadAudioAssets(); startMusic();
            return true;
        } catch (_) { context = null; return false; }
    }
    function applyVolumes() {
        if (!masterGain) return;
        masterGain.gain.value = settings.muted ? 0 : 1;
        musicGain.gain.value = settings.music * (currentContext === 'menu' ? 0.75 : 1); sfxGain.gain.value = settings.sfx;
    }
    function tone(name, destination = sfxGain, variation = '') {
        if (!initialized || !context || !destination || settings.muted) return;
        const cfg = sounds[name]; if (!cfg) return;
        const osc = context.createOscillator(), gain = context.createGain(), now = context.currentTime;
        osc.type = cfg.type || 'sine';
        if (cfg.sweep) { osc.frequency.setValueAtTime(cfg.sweep[0], now); osc.frequency.exponentialRampToValueAtTime(cfg.sweep[1], now + cfg.duration); }
        else {
            const hash = String(variation).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
            osc.frequency.setValueAtTime(cfg.frequency + (hash % 7) * 18, now);
        }
        gain.gain.setValueAtTime(cfg.volume, now); gain.gain.exponentialRampToValueAtTime(0.01, now + cfg.duration);
        osc.connect(gain); gain.connect(destination); osc.start(now); osc.stop(now + cfg.duration);
    }
    async function loadAudioAssets() {
        if (!context) return;
        await Promise.all(Object.entries(assetPaths).map(async ([name, path]) => {
            try {
                const response = await fetch(path);
                if (!response.ok) { failedAssets.set(name, `HTTP ${response.status}`); return; }
                buffers[name] = await context.decodeAudioData(await response.arrayBuffer());
                failedAssets.delete(name);
            } catch (_) { failedAssets.set(name, 'decode-or-fetch-failed'); }
        }));
        menuBuffer = buffers.menu || null;
        if (currentContext === 'menu' || currentContext === 'gameplay') startMusic();
    }
    function stopMenuTrack(preservePosition = true) {
        if (menuSource) {
            if (preservePosition && menuBuffer && context) menuOffset = (context.currentTime - menuSourceStartedAt) % menuBuffer.duration;
            try { menuSource.stop(); } catch (_) {} menuSource.disconnect(); menuSource = null;
        }
    }
    function stopMusicTracks() { while (musicSources.length) { const source = musicSources.pop(); try { source.stop(); } catch (_) {} source.disconnect(); } pressureLayerGain = null; }
    function stopMusak() { if (musakStopTimer) clearTimeout(musakStopTimer); musakStopTimer = null; if (musakSource) { try { musakSource.stop(); } catch (_) {} musakSource.disconnect(); musakSource = null; } }
    function stopRooftopMusic() { if (rooftopSource) { try { rooftopSource.stop(); } catch (_) {} rooftopSource.disconnect(); rooftopSource = null; } }
    function startRooftopMusic() {
        if (!rooftopActive || currentContext !== 'gameplay' || !initialized || !buffers.rooftop || rooftopSource || settings.muted) return;
        rooftopSource = context.createBufferSource(); rooftopSource.buffer = buffers.rooftop; rooftopSource.loop = true;
        rooftopSource.connect(musicGain); rooftopSource.start();
    }
    function playBuffer(name, destination = sfxGain, volume = 1, options = {}) {
        if (!initialized || !buffers[name] || settings.muted) return false;
        const source = context.createBufferSource(), gain = context.createGain(); source.buffer = buffers[name]; const loop = !!options.loop; source.loop = loop; gain.gain.value = volume * (name === 'defenestration' ? 0.8 : 1); source.connect(gain); gain.connect(destination); source.start();
        const durationMs = Number.isFinite(options.durationMs) ? options.durationMs : 5000;
        if (!loop || Number.isFinite(options.durationMs)) {
            const stopMs = loop ? durationMs : Math.min(durationMs, Math.max(1, buffers[name].duration * 1000));
            setTimeout(() => { try { source.stop(); } catch (_) {} }, stopMs);
        }
        return true;
    }
    function startMusic() {
        if (musicTimer) clearInterval(musicTimer);
        if (musicGain) musicGain.gain.value = settings.music * (currentContext === 'menu' ? 0.75 : 1);
        stopMenuTrack(); stopMusicTracks(); stopRooftopMusic();
        if (currentContext === 'menu' && menuBuffer && initialized && !settings.muted) {
            menuSource = context.createBufferSource(); menuSource.buffer = menuBuffer; menuSource.loop = true;
            menuSource.connect(musicGain); menuSource.start(0, menuOffset); menuSourceStartedAt = context.currentTime - menuOffset;
        }
        if (GAMEPLAY_BACKGROUND_MUSIC_ENABLED && currentContext === 'gameplay' && initialized && !settings.muted) {
            [['base', 0.22], ['pressure', Math.max(0, Math.min(0.32, (1 - psi) * 0.32))]].forEach(([name, volume]) => { if (!buffers[name]) return; const source = context.createBufferSource(), gain = context.createGain(); source.buffer = buffers[name]; source.loop = true; gain.gain.value = name === 'pressure' ? 0 : volume; source.connect(gain); gain.connect(musicGain); source.start(); musicSources.push(source); if (name === 'pressure') { pressureLayerGain = gain; gain.gain.setTargetAtTime(pressureBand === 'pressure' ? volume : 0, context.currentTime, 0.35); } });
        }
        startRooftopMusic();
        // Do not replace suppressed background music with a procedural fallback.
        if (GAMEPLAY_BACKGROUND_MUSIC_ENABLED) {
            const pulse = () => { if (currentContext === 'gameplay' && !buffers.base && !buffers.pressure) tone(pressureBand === 'pressure' ? 'hazard' : 'door', musicGain); };
            musicTimer = setInterval(pulse, 2600);
        }
    }
    function setContext(next) { currentContext = next || 'menu'; if (currentContext !== 'gameplay') stopMusak(); init(); if (initialized) startMusic(); emit('context_changed', { context: currentContext }); }
    function setPsi(value) { const numeric = Number(value); if (!Number.isFinite(numeric)) return; psi = Math.max(0, Math.min(2, numeric)); if (pressureBand === 'calm' && psi < 0.60) pressureBand = 'pressure'; else if (pressureBand === 'pressure' && psi > 0.70) pressureBand = 'calm'; if (pressureLayerGain && context) pressureLayerGain.gain.setTargetAtTime(pressureBand === 'pressure' ? Math.max(0, Math.min(0.32, (1 - psi) * 0.32)) : 0, context.currentTime, 0.35); }
    function play(name) { init(); if (!playBuffer(name === 'door' ? 'door' : name)) tone(name); emit('effect_played', { name }); }
    function on(name, handler) { if (typeof handler !== 'function') return () => {}; const list = listeners.get(name) || []; list.push(handler); listeners.set(name, list); return () => listeners.set(name, list.filter(fn => fn !== handler)); }
    function publish(name, payload = {}) { init(); if (name === 'rooftop_started') { rooftopActive = true; startRooftopMusic(); } if (name === 'rooftop_released') { rooftopActive = false; stopRooftopMusic(); } if (name === 'reset') { rooftopActive = false; stopRooftopMusic(); startMusic(); } if (name === 'powerup_used' && payload.id === 'musak') { stopMusak(); if (buffers.musak && initialized && !settings.muted) { musakSource = context.createBufferSource(); musakSource.buffer = buffers.musak; musakSource.loop = true; musakSource.connect(sfxGain); musakSource.start(); musakStopTimer = setTimeout(stopMusak, Math.max(1, Number(payload.duration) || 5000) * 1000); } } const mapped = eventMap[name]; const eventNow = Date.now(); const eventKey = `${name}:${payload.id || ''}:${payload.liftId ?? ''}:${payload.floor ?? ''}:${payload.status || ''}`; const lastEvent = lastPlayedEventAt.get(eventKey) || 0; const throttled = eventCooldownMs[name] && eventNow - lastEvent < eventCooldownMs[name]; const asset = name === 'powerup_used' && payload.id === 'musak' ? null : name === 'powerup_used' ? payload.id : name === 'hazard_started' ? payload.id : name === 'victory' ? 'victory' : mapped && buffers[mapped] ? mapped : null; const fallback = name === 'powerup_used' && payload.id === 'musak' ? null : fallbackMap[mapped] || mapped; const effectDurationMs = name === 'hazard_started' && payload.id === 'stink' ? 2000 : 5000; if (!throttled) { if (asset && playBuffer(asset, sfxGain, 1, { durationMs: effectDurationMs })) {} else if (asset) { if (fallback) tone(fallback, sfxGain, payload.id || name); } else if (fallback) tone(fallback, sfxGain, payload.id || name); lastPlayedEventAt.set(eventKey, eventNow); acceptedEventCount++; } emit(name, payload); }
    function setMuted(value) { settings.muted = !!value; applyVolumes(); if (settings.muted) { stopMenuTrack(); stopMusicTracks(); stopRooftopMusic(); stopMusak(); } else if (initialized) startMusic(); persist(); }
    function setVolume(kind, value) { const n = Math.max(0, Math.min(1, Number(value) || 0)); if (kind === 'music') settings.music = n; else if (kind === 'sfx') settings.sfx = n; applyVolumes(); persist(); }
    function getSettings() { return { ...settings }; }
    async function teardown() {
        if (musicTimer) clearInterval(musicTimer);
        musicTimer = null;
        stopMenuTrack(false); stopMusicTracks(); stopRooftopMusic(); stopMusak();
        if (context) {
            // Safari/WebKit can leave close() pending when an AudioContext has never fully resumed.
            // Cleanup must not block a round reset, page shutdown, or browser test indefinitely.
            await new Promise(resolve => {
                const timeout = setTimeout(resolve, 250);
                Promise.resolve(context.close()).catch(() => {}).then(() => { clearTimeout(timeout); resolve(); });
            });
        }
        context = null; masterGain = null; musicGain = null; sfxGain = null; menuBuffer = null;
        Object.keys(buffers).forEach(name => delete buffers[name]);
        failedAssets.clear(); lastPlayedEventAt.clear(); acceptedEventCount = 0; initialized = false; rooftopActive = false; pressureBand = 'calm'; menuOffset = 0;
    }
    ['pointerdown', 'keydown', 'touchstart'].forEach(type => document.addEventListener(type, init, { once: true, passive: true }));

    function getStatus() { return { initialized, context: currentContext, gameplayBackgroundMusicEnabled: GAMEPLAY_BACKGROUND_MUSIC_ENABLED, rooftopActive, rooftopSourceActive: !!rooftopSource, menuSourceActive: !!menuSource, menuPositionSec: menuOffset, musicSourceCount: musicSources.length, pressureBand, acceptedEventCount, menuLoaded: !!buffers.menu, baseLoaded: !!buffers.base, pressureLoaded: !!buffers.pressure, rooftopLoaded: !!buffers.rooftop, victoryLoaded: !!buffers.victory, doorLoaded: !!buffers.door, loadedAssetCount: Object.keys(buffers).length, failedAssetCount: failedAssets.size, muted: settings.muted }; }
    return { init, play, publish, on, setContext, setPsi, setMuted, setVolume, teardown, getSettings, getStatus, renderAttributions };
})();

window.Game.AudioBus = window.Game.Audio;
