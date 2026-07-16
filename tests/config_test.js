/**
 * CONFIG_TEST.JS
 * Helper utility to generate encoded URI payloads for the Manifest Gateway.
 * Useful for debugging physics, rounds, and system constants without code changes.
 */

if (typeof window !== 'undefined') {
    window.generateDebugPayload = function(overrides = {}) {
        const payload = {
            auth: "ELEVATOR_GO_BRRR_2026",
            overrides: overrides
        };
        const encoded = window.encodePayload(payload);
        const url = window.location.origin + window.location.pathname + "?manifest=" + encoded;
        console.log("🚀 Debug Payload Generated:");
        console.log(url);
        return url;
    };

    window.testFastPhysics = function() {
        return window.generateDebugPayload({
            system: { lateralTolerance: 0.8 },
            rounds: { 1: { gravityScalar: 5.0 } }
        });
    };

    window.generateMonkeyPayload = function(options = {}) {
        const payload = {
            auth: "ELEVATOR_GO_BRRR_2026",
            overrides: options.overrides || {},
            monkey: {
                agentSeed: options.agentSeed || 9999,
                roundDurationSeconds: options.roundDurationSeconds || 30,
                enduranceLifeLossIntervalSec: options.enduranceLifeLossIntervalSec || 1
            }
        };
        const encoded = window.encodePayload(payload);
        const url = window.location.origin + window.location.pathname + "?manifest=" + encoded;
        console.log("UNIT_01 Manifest URL:");
        console.log(url);
        return url;
    };
}
