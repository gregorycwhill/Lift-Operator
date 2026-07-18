const profiles = {
    'all-sweep-unattended': { version: 1, builtIn: true, scripts: 'all-sweep', manualTargets: 0, powerUps: 0, assumptions: ['no clicks', 'no policy changes'] },
    strong: { version: 1, builtIn: false, scripts: 'resource-supported', manualTargets: 'bounded', powerUps: 'declared', assumptions: ['event-aware rescue'] },
    'r2-hybrid-rescue': { version: 1, builtIn: false, scripts: 'manual', strategy: 'hybrid-manual-r2', manualTargetLimit: 6, powerUps: 0 },
    'r7-checkout': { version: 1, builtIn: false, scripts: 'featured', strategy: 'resource-supported', mechanic: 'checkout' },
    'r8-vip': { version: 1, builtIn: false, scripts: 'featured', strategy: 'resource-supported', mechanic: 'VIP exclusivity' },
    'r9-rooftop-stink': { version: 1, builtIn: false, scripts: 'featured', strategy: 'resource-supported', mechanic: 'rooftop/stink' },
    'r10-custom': { version: 1, builtIn: false, scripts: 'custom', strategy: 'resource-supported', mechanic: 'custom routing' },
    'r11-weight': { version: 1, builtIn: false, scripts: 'custom', strategy: 'resource-supported', mechanic: 'weight' },
    'r13-gravity': { version: 1, builtIn: false, scripts: 'featured', strategy: 'resource-supported', mechanic: 'gravity' }
};
function getStrategyProfile(id) { if (!profiles[id]) throw new Error(`Unknown strategy profile: ${id}`); return { id, ...profiles[id] }; }
module.exports = { profiles, getStrategyProfile };
