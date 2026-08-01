const profiles = {
    'all-sweep-unattended': { version: 1, builtIn: true, family: 'negative-control', scripts: 'all-sweep', manualTargets: 0, powerUps: 0, assumptions: ['no clicks', 'no policy changes'] },
    'r2-hybrid-rescue': { version: 1, builtIn: false, family: 'hybrid-rescue', scripts: 'featured', strategy: 'resource-supported', manualTargetLimit: 6, powerUps: 0, assumptions: ['Sweep baseline', 'bounded rescue decisions'] },
    'r3-hybrid-rescue': { version: 1, builtIn: false, family: 'hybrid-rescue', scripts: 'featured', strategy: 'resource-supported', manualTargetLimit: 8, powerUps: 'declared', assumptions: ['split lift roles', 'Room Service awareness'] },
    'r4-r6-triage': { version: 1, builtIn: false, family: 'triage-redundancy', scripts: 'featured', strategy: 'resource-supported', manualTargetLimit: 12, powerUps: 'declared', assumptions: ['specialist policy', 'jam recovery from R6'] },
    'r7-r9-events': { version: 1, builtIn: false, family: 'event-handling', scripts: 'featured', strategy: 'resource-supported', manualTargetLimit: 15, powerUps: 'declared', assumptions: ['event-aware routing', 'VIP/Rooftop/Checkout response'] },
    'r10-r13-advanced': { version: 2, builtIn: false, family: 'advanced-control', scripts: 'custom', strategy: 'event-aware', interventionIntervalSec: 3, manualTargetLimit: 20, powerUps: 'declared', assumptions: ['Workshop policy', 'event-aware rescue', 'mechanic-specific evidence'] },
    'r14-r20-zoned': { version: 2, builtIn: false, family: 'zoned-fleet', scripts: 'zoned', strategy: 'zoned-dispatch', interventionIntervalSec: 4, manualTargetLimit: 24, powerUps: 'declared', assumptions: ['G coverage', 'overlapping zones', 'event-aware flexible lift'] },
    'r21-r23-counterweight': { version: 2, builtIn: false, family: 'counterweight-open-plan', scripts: 'paired-zoned', strategy: 'counterweight-dispatch', interventionIntervalSec: 4, manualTargetLimit: 30, powerUps: 'declared', assumptions: ['paired movement', 'Open Plan recovery', 'pair-aware routing'] },
    'r24-r25-capsule': { version: 1, builtIn: false, family: 'capsule-dispatch', scripts: 'zoned', strategy: 'resource-supported', manualTargetLimit: 30, powerUps: 'declared', assumptions: ['demand currents', 'automation-first dispatch'] },
    // Compatibility aliases retained for existing exploratory tools.
    strong: { version: 1, builtIn: false, family: 'generic', scripts: 'resource-supported', manualTargets: 'bounded', powerUps: 'declared', assumptions: ['event-aware rescue'] },
    'r7-checkout': { version: 1, builtIn: false, family: 'event-handling', scripts: 'featured', strategy: 'resource-supported', mechanic: 'checkout' },
    'r8-vip': { version: 1, builtIn: false, family: 'event-handling', scripts: 'featured', strategy: 'resource-supported', mechanic: 'VIP exclusivity' },
    'r9-rooftop-stink': { version: 1, builtIn: false, family: 'event-handling', scripts: 'featured', strategy: 'resource-supported', mechanic: 'rooftop/stink' },
    'r10-custom': { version: 1, builtIn: false, family: 'advanced-control', scripts: 'custom', strategy: 'resource-supported', mechanic: 'custom routing' },
    'r11-weight': { version: 1, builtIn: false, family: 'advanced-control', scripts: 'custom', strategy: 'resource-supported', mechanic: 'weight' },
    'r13-gravity': { version: 1, builtIn: false, family: 'advanced-control', scripts: 'featured', strategy: 'resource-supported', mechanic: 'gravity' },
    'zoned-scale': { version: 1, builtIn: false, family: 'zoned-fleet', scripts: 'zoned', strategy: 'resource-supported', mechanic: 'service zoning' },
    'counterweight-open-plan': { version: 1, builtIn: false, family: 'counterweight-open-plan', scripts: 'paired-zoned', strategy: 'resource-supported', mechanic: 'counterweight/Open Plan' },
    'capsule-zoned': { version: 1, builtIn: false, family: 'capsule-dispatch', scripts: 'zoned', strategy: 'resource-supported', mechanic: 'capsule dispatch' }
};
function getStrategyProfile(id) { if (!profiles[id]) throw new Error(`Unknown strategy profile: ${id}`); return { id, ...profiles[id] }; }
module.exports = { profiles, getStrategyProfile };
