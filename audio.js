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
        victory: 'victory', error: 'error'
    };
    let context = null, masterGain = null, musicGain = null, sfxGain = null, menuBuffer = null, menuSource = null;
    const buffers = {}, musicSources = [];
    const assetPaths = { menu: 'assets/audio/menu-somewhere-in-the-elevator.ogg', base: 'assets/audio/gameplay-chiploop.mp3', pressure: 'assets/audio/gameplay-pressure-chip-bit-danger.mp3', victory: 'assets/audio/victory.mp3', door: 'assets/audio/elevator-door.wav' };
    let initialized = false, currentContext = 'menu', psi = 1, musicTimer = null;
    let settings = { muted: false, music: 0.22, sfx: 0.50 };
    const listeners = new Map();

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
            try { const response = await fetch(path); if (response.ok) buffers[name] = await context.decodeAudioData(await response.arrayBuffer()); } catch (_) { /* fallback */ }
        }));
        menuBuffer = buffers.menu || null;
        if (currentContext === 'menu' || currentContext === 'gameplay') startMusic();
    }
    function stopMenuTrack() {
        if (menuSource) { try { menuSource.stop(); } catch (_) {} menuSource.disconnect(); menuSource = null; }
    }
    function stopMusicTracks() { while (musicSources.length) { const source = musicSources.pop(); try { source.stop(); } catch (_) {} source.disconnect(); } }
    function playBuffer(name, destination = sfxGain, volume = 1) {
        if (!initialized || !buffers[name] || settings.muted) return false;
        const source = context.createBufferSource(), gain = context.createGain(); source.buffer = buffers[name]; gain.gain.value = volume; source.connect(gain); gain.connect(destination); source.start(); return true;
    }
    function startMusic() {
        if (musicTimer) clearInterval(musicTimer);
        stopMenuTrack(); stopMusicTracks();
        if (currentContext === 'menu' && menuBuffer && initialized && !settings.muted) {
            menuSource = context.createBufferSource(); menuSource.buffer = menuBuffer; menuSource.loop = true;
            menuSource.connect(musicGain); menuSource.start();
        }
        if (currentContext === 'gameplay' && initialized && !settings.muted) {
            [['base', 0.22], ['pressure', Math.max(0, Math.min(0.32, (1 - psi) * 0.32))]].forEach(([name, volume]) => { if (!buffers[name]) return; const source = context.createBufferSource(), gain = context.createGain(); source.buffer = buffers[name]; gain.gain.value = volume; source.loop = true; source.connect(gain); gain.connect(musicGain); source.start(); musicSources.push(source); });
        }
        // A quiet, layered procedural fallback. PSI only selects a bounded layer rate.
        const pulse = () => { if (currentContext === 'gameplay') tone(psi < 0.65 ? 'hazard' : 'door', musicGain); };
        musicTimer = setInterval(pulse, 2600);
    }
    function setContext(next) { currentContext = next || 'menu'; if (initialized) startMusic(); emit('context_changed', { context: currentContext }); }
    function setPsi(value) { const numeric = Number(value); if (Number.isFinite(numeric)) psi = Math.max(0, Math.min(2, numeric)); }
    function play(name) { init(); if (!playBuffer(name === 'door' ? 'door' : name)) tone(name); emit('effect_played', { name }); }
    function on(name, handler) { if (typeof handler !== 'function') return () => {}; const list = listeners.get(name) || []; list.push(handler); listeners.set(name, list); return () => listeners.set(name, list.filter(fn => fn !== handler)); }
    function publish(name, payload = {}) { init(); const mapped = eventMap[name]; if (name === 'victory' && !playBuffer('victory')) tone('victory'); else if (name === 'guest_boarded' && !playBuffer('door')) tone(mapped, sfxGain, payload.id || name); else if (mapped) tone(mapped, sfxGain, payload.id || name); emit(name, payload); }
    function setMuted(value) { settings.muted = !!value; applyVolumes(); persist(); }
    function setVolume(kind, value) { const n = Math.max(0, Math.min(1, Number(value) || 0)); if (kind === 'music') settings.music = n; else if (kind === 'sfx') settings.sfx = n; applyVolumes(); persist(); }
    function getSettings() { return { ...settings }; }
    ['pointerdown', 'keydown', 'touchstart'].forEach(type => document.addEventListener(type, init, { once: true, passive: true }));

    return { init, play, publish, on, setContext, setPsi, setMuted, setVolume, getSettings };
})();

window.Game.AudioBus = window.Game.Audio;
