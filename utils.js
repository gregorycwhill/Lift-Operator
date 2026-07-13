/**
 * UTILS.JS
 * Consolidated utility functions for the Lift Operator engine.
 */

window.GameUI = () => (window.Game && window.Game.UI) || window.UI || {};
window.GameEngine = () => (window.Game && window.Game.Engine) || window;
window.GameSpawner = () => (window.Game && window.Game.Spawner) || window.Spawner || {};
window.GameShared = () => window.Game || window;

const Utils = {
    /**
     * Seeded random number generator state.
     */
    _seed: 1234,

    /**
     * Sets the seed for the PRNG.
     * @param {number} seed 
     */
    setSeed: function(seed) {
        this._seed = seed;
    },

    /**
     * Returns a seeded pseudo-random number between 0 and 1.
     * @returns {number}
     */
    random: function() {
        const x = Math.sin(this._seed++) * 10000;
        return x - Math.floor(x);
    },

    /**
     * Returns a random integer between min (inclusive) and max (exclusive).
     */
    randomInt: function(min, max) {
        return Math.floor(this.random() * (max - min)) + min;
    },

    /**
     * Probability helper: returns true if a random roll is below the threshold.
     */
    chance: function(threshold) {
        return this.random() < threshold;
    },

    /**
     * Gets a random floor index.
     */
    randomFloor: function() {
        return Math.floor(this.random() * Config.numFloors);
    },

    /**
     * Persistence wrapper.
     */
    storage: {
        save: function(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.error("Storage save failed", e);
            }
        },
        load: function(key, defaultValue) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                return defaultValue;
            }
        }
    },

    /**
     * Telemetry & Logging System
     */
    telemetry: {
        logs: [],
        maxLogs: 50,
        add: function(category, message, importance = 'info') {
            const entry = {
                timestamp: new Date().toLocaleTimeString(),
                category: category.toUpperCase(),
                message: message,
                importance: importance
            };
            this.logs.unshift(entry);
            if (this.logs.length > this.maxLogs) this.logs.pop();
            
            // Dispatch event for UI updates
            window.dispatchEvent(new CustomEvent('telemetryUpdate', { detail: entry }));
            
            if (importance === 'error') console.error(`[${entry.category}] ${message}`);
            else console.log(`[${entry.category}] ${message}`);
        },
        clear: function() {
            this.logs = [];
            window.dispatchEvent(new CustomEvent('telemetryUpdate'));
        }
    }
};

// Global compatibility layer
window.seededRandom = () => Utils.random();
window.setSeed = (s) => Utils.setSeed(s);
window.safeGetItem = (k, d) => Utils.storage.load(k, d);
window.safeSetItem = (k, v) => Utils.storage.save(k, v);
window.Telemetry = Utils.telemetry;
