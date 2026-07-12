// ============================================================================
// AUDIO.JS : PROCEDURAL & BUFFERED SOUND MANAGEMENT
// ============================================================================

window.Game = window.Game || {};

window.Game.Audio = (function() {
    let context = null;
    let masterGain = null;
    let initialized = false;

    const sounds = {
        'ding': { frequency: 880, type: 'triangle', duration: 0.1, volume: 0.2 },
        'error': { frequency: 110, type: 'sawtooth', duration: 0.3, volume: 0.1 },
        'powerup': { sweep: [440, 880], type: 'sine', duration: 0.5, volume: 0.2 },
        'door': { frequency: 220, type: 'sine', duration: 0.1, volume: 0.05 }
    };

    function init() {
        if (initialized) return;
        try {
            context = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = context.createGain();
            masterGain.connect(context.destination);
            masterGain.gain.value = 0.5;
            initialized = true;
            console.log("Audio Engine Initialized");
        } catch (e) {
            console.warn("Audio Context failed to initialize", e);
        }
    }

    function play(effect) {
        if (!initialized) init();
        if (!context || context.state === 'suspended') {
            context?.resume();
            if (!context) return;
        }

        const cfg = sounds[effect];
        if (!cfg) return;

        const osc = context.createOscillator();
        const g = context.createGain();

        osc.type = cfg.type || 'sine';
        
        if (cfg.sweep) {
            osc.frequency.setValueAtTime(cfg.sweep[0], context.currentTime);
            osc.frequency.exponentialRampToValueAtTime(cfg.sweep[1], context.currentTime + cfg.duration);
        } else {
            osc.frequency.setValueAtTime(cfg.frequency, context.currentTime);
        }

        g.gain.setValueAtTime(cfg.volume, context.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, context.currentTime + cfg.duration);

        osc.connect(g);
        g.connect(masterGain);

        osc.start();
        osc.stop(context.currentTime + cfg.duration);
    }

    return {
        init: init,
        play: play
    };
})();
