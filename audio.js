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
        lift_arrived: 'ding', guest_boarded: 'door', guest_alighted: 'ding',
        powerup_used: 'powerup', hazard_started: 'hazard', hazard_ended: 'ding',
        victory: 'victory', vip_arrival: 'vipArrival', guest_urgency: 'guestUrgency',
        guest_refused: 'guestRefused', purchase_confirmed: 'purchase', ui_error: 'uiError', error: 'uiError',
        round_started: 'ding', failure: 'uiError', retry_started: 'ding'
    };
    let context = null, masterGain = null, musicGain = null, sfxGain = null, menuBuffer = null, menuSource = null, rooftopSource = null, pressureLayerGain = null;
    const buffers = {}, failedAssets = new Map(), musicSources = [];
    const assetPaths = { menu: 'assets/audio/menu-somewhere-in-the-elevator.ogg', base: 'assets/audio/gameplay-chiploop.mp3', pressure: 'assets/audio/gameplay-pressure-chip-bit-danger.mp3', rooftop: 'assets/audio/gameplay-rooftop-trance.mp3', victory: 'assets/audio/victory.mp3', door: 'assets/audio/elevator-door.wav', wrench: 'assets/audio/sfx/powerup-wrench-toolbox.wav', turbo: 'assets/audio/sfx/powerup-rocket-launch.wav', musak: 'assets/audio/sfx/musak-electronic-jazz.mp3', freshener: 'assets/audio/sfx/freesound_community-spray-48068.mp3', tardis: 'assets/audio/sfx/tardis-air-whoosh.wav', doors: 'assets/audio/sfx/wide-doors-old-elevator.mp3', groupThink: 'assets/audio/sfx/dragon-studio-alien-song-323613.mp3', doubleDecker: 'assets/audio/sfx/powerup-double-decker-robot-step.wav', openPlan: 'assets/audio/sfx/powerup-open-plan-metal.wav', jam: 'assets/audio/sfx/hazard-metal-interaction.wav', stink: 'assets/audio/sfx/hazard-gastric-distress.wav', vipArrival: 'assets/audio/sfx/event-vip-fanfare.wav', guestUrgency: 'assets/audio/sfx/guest-urgency-aww.ogg', guestRefused: 'assets/audio/sfx/guest-refused-alert.wav', purchase: 'assets/audio/sfx/ui-purchase-coin.wav', uiError: 'assets/audio/sfx/ui-error-failed.mp3' };
    let initialized = false, currentContext = 'menu', psi = 1, pressureBand = 'calm', musicTimer = null, rooftopActive = false, acceptedEventCount = 0;
    let settings = { muted: false, music: 0.22, sfx: 0.50 };
    const listeners = new Map();
    const fallbackMap = { vipArrival: 'victory', guestUrgency: 'error', guestRefused: 'error', purchase: 'ding', uiError: 'error' };
    const eventCooldownMs = { guest_urgency: 300, guest_refused: 250 };
    const lastPlayedEventAt = new Map();

    try { settings = { ...settings, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; } catch (_) { /* private mode */ }
    const persist = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (_) {} };
    const emit = (name, payload = {}) => (listeners.get(name) || []).forEach(fn => { try { fn(payload); } catch (_) {} });

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
        musicGain.gain.value = settings.music; sfxGain.gain.value = settings.sfx;
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
    function stopMenuTrack() {
        if (menuSource) { try { menuSource.stop(); } catch (_) {} menuSource.disconnect(); menuSource = null; }
    }
    function stopMusicTracks() { while (musicSources.length) { const source = musicSources.pop(); try { source.stop(); } catch (_) {} source.disconnect(); } pressureLayerGain = null; }
    function stopRooftopMusic() { if (rooftopSource) { try { rooftopSource.stop(); } catch (_) {} rooftopSource.disconnect(); rooftopSource = null; } }
    function startRooftopMusic() {
        if (!rooftopActive || currentContext !== 'gameplay' || !initialized || !buffers.rooftop || rooftopSource || settings.muted) return;
        rooftopSource = context.createBufferSource(); rooftopSource.buffer = buffers.rooftop; rooftopSource.loop = true;
        rooftopSource.connect(musicGain); rooftopSource.start();
    }
    function playBuffer(name, destination = sfxGain, volume = 1) {
        if (!initialized || !buffers[name] || settings.muted) return false;
        const source = context.createBufferSource(), gain = context.createGain(); source.buffer = buffers[name]; gain.gain.value = volume; source.connect(gain); gain.connect(destination); source.start(); return true;
    }
    function startMusic() {
        if (musicTimer) clearInterval(musicTimer);
        stopMenuTrack(); stopMusicTracks(); stopRooftopMusic();
        if (currentContext === 'menu' && menuBuffer && initialized && !settings.muted) {
            menuSource = context.createBufferSource(); menuSource.buffer = menuBuffer; menuSource.loop = true;
            menuSource.connect(musicGain); menuSource.start();
        }
        if (currentContext === 'gameplay' && initialized && !settings.muted) {
            [['base', 0.22], ['pressure', Math.max(0, Math.min(0.32, (1 - psi) * 0.32))]].forEach(([name, volume]) => { if (!buffers[name]) return; const source = context.createBufferSource(), gain = context.createGain(); source.buffer = buffers[name]; gain.gain.value = volume; source.loop = true; source.connect(gain); gain.connect(musicGain); source.start(); musicSources.push(source); if (name === 'pressure') pressureLayerGain = gain; });
        }
        startRooftopMusic();
        // A quiet procedural fallback is only needed when no decoded gameplay layer is available.
        const pulse = () => { if (currentContext === 'gameplay' && !buffers.base && !buffers.pressure) tone(pressureBand === 'pressure' ? 'hazard' : 'door', musicGain); };
        musicTimer = setInterval(pulse, 2600);
    }
    function setContext(next) { currentContext = next || 'menu'; init(); if (initialized) startMusic(); emit('context_changed', { context: currentContext }); }
    function setPsi(value) { const numeric = Number(value); if (!Number.isFinite(numeric)) return; psi = Math.max(0, Math.min(2, numeric)); if (pressureBand === 'calm' && psi < 0.60) pressureBand = 'pressure'; else if (pressureBand === 'pressure' && psi > 0.70) pressureBand = 'calm'; if (pressureLayerGain && context) pressureLayerGain.gain.setTargetAtTime(Math.max(0, Math.min(0.32, (1 - psi) * 0.32)), context.currentTime, 0.12); }
    function play(name) { init(); if (!playBuffer(name === 'door' ? 'door' : name)) tone(name); emit('effect_played', { name }); }
    function on(name, handler) { if (typeof handler !== 'function') return () => {}; const list = listeners.get(name) || []; list.push(handler); listeners.set(name, list); return () => listeners.set(name, list.filter(fn => fn !== handler)); }
    function publish(name, payload = {}) { init(); if (name === 'rooftop_started') { rooftopActive = true; startRooftopMusic(); } if (name === 'rooftop_released') { rooftopActive = false; stopRooftopMusic(); } if (name === 'reset') { rooftopActive = false; startMusic(); } const mapped = eventMap[name]; const eventNow = Date.now(); const eventKey = `${name}:${payload.id || ''}:${payload.liftId ?? ''}:${payload.floor ?? ''}:${payload.status || ''}`; const lastEvent = lastPlayedEventAt.get(eventKey) || 0; const throttled = eventCooldownMs[name] && eventNow - lastEvent < eventCooldownMs[name]; const asset = name === 'powerup_used' ? payload.id : name === 'hazard_started' ? payload.id : name === 'victory' ? 'victory' : name === 'guest_boarded' ? 'door' : mapped && buffers[mapped] ? mapped : null; const fallback = fallbackMap[mapped] || mapped; if (!throttled) { if (asset && !playBuffer(asset)) { if (fallback) tone(fallback, sfxGain, payload.id || name); } else if (!asset && fallback) tone(fallback, sfxGain, payload.id || name); lastPlayedEventAt.set(eventKey, eventNow); acceptedEventCount++; } emit(name, payload); }
    function setMuted(value) { settings.muted = !!value; applyVolumes(); if (settings.muted) { stopMenuTrack(); stopMusicTracks(); stopRooftopMusic(); } else if (initialized) startMusic(); persist(); }
    function setVolume(kind, value) { const n = Math.max(0, Math.min(1, Number(value) || 0)); if (kind === 'music') settings.music = n; else if (kind === 'sfx') settings.sfx = n; applyVolumes(); persist(); }
    function getSettings() { return { ...settings }; }
    async function teardown() {
        if (musicTimer) clearInterval(musicTimer);
        musicTimer = null;
        stopMenuTrack(); stopMusicTracks(); stopRooftopMusic();
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
        failedAssets.clear(); lastPlayedEventAt.clear(); acceptedEventCount = 0; initialized = false; rooftopActive = false; pressureBand = 'calm';
    }
    ['pointerdown', 'keydown', 'touchstart'].forEach(type => document.addEventListener(type, init, { once: true, passive: true }));

    function getStatus() { return { initialized, context: currentContext, rooftopActive, rooftopSourceActive: !!rooftopSource, menuSourceActive: !!menuSource, musicSourceCount: musicSources.length, pressureBand, acceptedEventCount, menuLoaded: !!buffers.menu, baseLoaded: !!buffers.base, pressureLoaded: !!buffers.pressure, rooftopLoaded: !!buffers.rooftop, victoryLoaded: !!buffers.victory, doorLoaded: !!buffers.door, loadedAssetCount: Object.keys(buffers).length, failedAssetCount: failedAssets.size, muted: settings.muted }; }
    return { init, play, publish, on, setContext, setPsi, setMuted, setVolume, teardown, getSettings, getStatus };
})();

window.Game.AudioBus = window.Game.Audio;
