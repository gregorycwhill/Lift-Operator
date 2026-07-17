# Current Implementation Baseline

**Baseline date:** 16 July 2026  
**Purpose:** Describe observable implementation, not desired balance.  
**Authority:** The code remains authoritative where this document is incomplete.

This document prevents target design changes from being confused with current behaviour. Values described here may be intentionally replaced during stabilization.

## Product state

Lift Operator is a static browser application deployed through GitHub Pages. It uses traditional script tags and global browser namespaces rather than ES modules. Node tooling now provides validation, automated browser testing, and CI without changing the static deployment model.

The normal interface exposes rounds 1–13. Some documents previously described rounds 14–15, but those rounds do not have complete playable configuration and are not part of the implemented campaign.

## Architecture

| Area | Main files | Current responsibility |
| --- | --- | --- |
| Configuration | `config.js` | Legacy top-level parameters, partial `GAME_DATA`, seeded PRNG, storage keys |
| Runtime state | `state.js` | `Registry`, lift and floor state, routing queries |
| Lifecycle | `engine-core.js` | Startup, shared round factory, reset, retry, round warp, pause/resume, manifests |
| Spawning | `engine-spawner.js` | Guests, VIP, Room Service, checkout traffic, rooftop event |
| Physics | `engine-physics.js` | Game tick, patience, hazards, movement, state machine, boarding |
| Simulation | `engine-simulator.js` | Accelerated runs inside a disposable isolated browser realm |
| Automation | `automation-vm.js`, `workshop.js` | Built-in scripts, Blockly, generated JavaScript execution |
| Economy | `powerups.js`, `achievements.js` | Shop catalog, inventory, payout, career badges |
| Interface | `ui-*.js`, `ui-overlay.js` | World rendering, modals, shop, workshop, debug, leaderboard |
| Testing | `tests/*.js`, `playwright.config.js` | Browser regression harness, simulation checks, and Playwright lifecycle tests |

The split into files is useful, but modules remain coupled through globals such as `Config`, `Registry`, `PowerUps`, `GameUI`, and `AutomationWorkshop`.

## Implemented core loop

1. The player enters a name and starts a seeded round.
2. Guests spawn with random origins and destinations.
3. The player routes lifts manually or assigns automations.
4. Waiting guests age through patience states.
5. Guests board, travel, disembark, or rage and cost lives.
6. A round ends by timer, a special objective, or loss of lives.
7. Performance and achievements award points.
8. The player buys power-ups before the next round.

The loop is playable, but transitions between review, shop, briefing, pause, and resume require stabilization.

## Implemented lift model

Lifts use the states:

- `IDLE`
- `DOORS_OPENING`
- `BOARDING`
- `DOORS_CLOSING`
- `TRANSIT`

Base configuration currently includes:

| Parameter | Current value |
| --- | ---: |
| Starting lives | 20 |
| Standard round duration | 180 seconds |
| Base capacity | 10 weight units |
| Travel time | 0.5 seconds per floor |
| Door transition | 0.5 seconds |
| Standard boarding time | 0.5 seconds per weight unit |
| Starting floor count | 10 |
| Floor count from round 6 | 15 |

These values describe current configuration, not approved target balance.

## Implemented guest patience

Some legacy top-level compatibility fields remain, while canonical round structure and the main patience rules now live in versioned `GAME_DATA`:

- Legacy top-level fields: 20 / 40 / 60 seconds.
- `GAME_DATA.system.patience`: 20 / 40 / 60 / 80 seconds.
- Physics currently reads the `GAME_DATA` patience object.
- Some supporting logic still reads legacy fields.

The intended interpretation in the current physics path is:

| State | Elapsed wait |
| --- | --- |
| Happy | 0–20 seconds |
| Annoyed | 20–40 seconds |
| Critical | 40–60 seconds |
| Rage | 80+ seconds |

The 60–80 second interval requires code-level confirmation during centralization because documentation and UI language have not consistently represented it.

VIPs spawn with an artificial patience head start and cost 10 lives when they rage. Standard guests cost one life.

## Implemented guest types and traffic events

| Mechanic | Status | Current behaviour |
| --- | --- | --- |
| Standard guest | Implemented | Weight 1; random origin and destination |
| Room Service | Implemented | Round 3+; 5% chance; weight 3; slower boarding |
| VIP | Implemented | Round 8+; one scheduled spawn; requires exclusive lift; 10-life rage penalty |
| Checkout traffic | Implemented | Round 7 only; 50% chance for a new guest to target Ground |
| Rooftop event | Implemented | Round 9+; redirects a proportion of non-VIPs to top floor temporarily |
| Fart/stink | Implemented | Round 9+ physics hazard; blocks boarding and can trigger evacuation |
| Gym Bro | Implemented | Round 11 gym-floor spawns; weight 2; groups can cause stink |
| Gravity | Implemented | Round 13 upward movement penalty based on load |

The gameplay map previously implied that some hazards continued or scaled after introduction. Current code does not consistently implement per-round hazard scaling.

## Implemented automations

| Automation | Status | Summary |
| --- | --- | --- |
| Manual | Implemented | Player clicks a shaft floor |
| Sweep | Implemented | Directional routing using waiting and onboard demand |
| Priority Sweep | Implemented | Favors urgent guests |
| Voting | Implemented | Selects the floor with greatest request volume |
| Weighted Voting | Implemented | Gives urgent requests greater weight |
| Custom Blockly script | Implemented, lockup-prone | Generated JavaScript controls target-floor selection through a bridge |

Automation availability is introduced through UI logic, but unlocks are not yet driven by one canonical round data object.

## Implemented power-ups

All nine catalog entries are present in the shop:

- Wrench
- Air Freshener
- Calming Musak
- Turbo Module
- TARDIS Mode
- Wide Doors
- Group Think
- Double-Decker
- Open Plan

Each has three tiers. Current prices are generally between 1 and 10 points. Those prices are known to be too low relative to current round earnings.

Open Plan contains prototype lateral-transfer behaviour and should be treated as **Partial**, not fully released.

## Current points and achievements

Current repeatable round payout is:

```text
1 point per guest served
+ floor(time remaining / 10)
one-time achievement tier rewards
```

Achievement tier rewards are currently 2 / 5 / 10 points.

This produces excessive early purchasing power and does not create the intended scarcity. It also mixes repeatable operational income with permanent career achievements.

Implemented achievement families:

- Service Award
- Hands-Free Inventor
- Sardine Packer
- Hacker Award
- Parallel Universe
- Double Trouble

Some counters are per round while others are effectively career totals. Their semantics need to be made explicit during economy redesign.

## Current round structure

| Round | Current title/theme | Floors | Lifts | Main implemented change |
| ---: | --- | ---: | ---: | --- |
| 1 | Welcome | 10 | 1 | Manual control |
| 2 | Automation 101 | 10 | 1 | Sweep |
| 3 | Rush Hour | 10 | 2 | Room Service eligible; more traffic |
| 4 | Triage | 10 | 2 | Priority Sweep |
| 5 | Democracy | 10 | 3 | Voting and Weighted Voting |
| 6 | Maintenance Crisis | 15 | 3 | Lift jams; taller building |
| 7 | Checkout Challenge | 15 | 4 | Ground-floor traffic funnel |
| 8 | VIP Security | 15 | 4 | VIP |
| 9 | Happy Hour | 15 | 5 | Rooftop event and stink hazard |
| 10 | Workshop Sandbox | 15 | 5 | Custom automation |
| 11 | Heavy Lifting | 15 | 5 | Gym floor and Gym Bros |
| 12 | Endurance | 15 | 4 | Untimed; runs until all 20 lives are lost; death completes the round |
| 13 | Pedal Power | 15 | 4 | Gravity/load penalty |

All 13 supported rounds now have explicit floor, lift, spawn, and objective definitions consumed by the shared round factory.

### Round 12 Endurance

- Start with the normal 20 lives.
- No timer and no delivery quota.
- Continue until the 20th life is lost.
- Measure survival time and total service.
- Award a potentially large score/payout for the extended performance.
- Treat death as the expected completion event.
- Automatically advance to Round 13 rather than retrying Round 12.

The round now follows this lifecycle. Its final numerical payout and traffic escalation remain balance candidates.

## Current testing state

The project contains:

- A browser regression scorecard.
- A global-state simulator.
- Simulation baseline scripts.
- A reproducible Playwright autonomous-pilot lifecycle suite.

The Playwright suite invokes the obfuscated manifest gateway, launches UNIT_01 through the visible Debug modal, completes all 13 accelerated rounds, verifies the human-intervention kill switch, and verifies ordinary-death rollback. The first complete local campaign run passed in approximately 6.6 minutes.

The older in-browser scorecard remains useful diagnostically but is not yet authoritative because several checks:

- Reimplement the rule being tested instead of invoking production behaviour.
- Assign expected values directly.
- Use fallback mocks that can pass when production APIs are absent.
- Mutate shared configuration without complete isolation.

“100% pass” therefore means the browser harness passed its own checks, not that the product is fully regression-safe.

## Current access and execution model

Blueprint and debug manifests are XOR-obfuscated with a client-visible key. This is intentional lightweight access gating for a hobby learning project. It prevents accidental discovery without trying to resist a curious player inspecting the source. Reverse-engineering it is considered a positive educational outcome.

Custom scripts still execute using `new Function`, but generated source is now size-limited and rejects loops and direct browser-global constructs before execution. This is interim accidental-misuse containment, not a security sandbox. A Web Worker or constrained interpreter remains the target.

## Known high-priority issues

1. Shop exit and round-review lifecycle can repeat or restore stale state.
2. Average wait now records total journey time from spawn to successful destination delivery; broader telemetry validation remains pending.
3. Early round payouts trivialize shop choices.
4. Current configuration and documentation disagree.
5. Simulation is isolated from live state; deterministic strategy baselines and separate environment/agent random streams remain pending.
6. Production excludes developer test scripts and uses pinned local runtime assets; Debug loads diagnostics only after explicit opt-in.
7. UTF-8 text is inconsistently represented in source files.
8. Workshop capacity sensors use passenger count rather than weight/effective capacity.
9. Unattended all-Sweep is currently too effective and can complete rounds without the active supervision required by the target design.
10. Hands-Free currently checks only for zero manual clicks; it does not require player-authored custom automation and can therefore reward built-in policies incorrectly.

These are addressed in `STABILIZATION_PLAN.md`.

## Implemented ordinary-death retry behaviour

Ordinary death now:

- Restore the point total held immediately after the previous round.
- Clear inventory and cart completely.
- Discard all state and progress from the failed attempt.
- Keep the same round and Game ID/seed.
- Show a failed-attempt Round Review with service, journey-time, and defenestration statistics but no payout or achievement commit.
- Continue from the review to the same round's shop for a complete loadout do-over.

Round 12 is excluded because its final death is the intended completion event.

## Queue rendering and performance

Waiting guests remain FIFO in runtime state. Visually, the queue is anchored against the right-hand lift doors: the oldest guest is nearest the lift and new arrivals extend the queue to the left.

Lobby rendering is throttled to 10 updates per second and bounded to 18 visible guests per floor. Larger queues display an overflow count while retaining every guest in simulation state. This prevents late-round backlogs from creating hundreds of DOM nodes or being rehashed every animation frame.

Lift passenger rendering uses a stable state hash. Visual-state updates no longer overwrite that hash and therefore no longer destroy and recreate unchanged passenger DOM every animation frame. Idle automation policy evaluation is limited to ten decisions per second per lift, bounding full-building queue scans while retaining responsive routing.

The Round Review places its three column labels—Served, Round Performance, and Total Bank—directly below the outcome heading and above their statistics.

## Balance data pipeline

`design/game-balance.v1.json` is the canonical machine-readable numerical source. `scripts/generate-balance.js` produces `generated/game-balance.js`, which loads before `config.js`. Runtime `Config.GAME_DATA` references that generated object.

Top-level `Config` fields retained for debug controls and older consumers are initialized from canonical data rather than repeating independent values. Validation checks canonical/runtime parity, probabilities, round coverage, achievement tiers, power-up tiers, and generated-artifact freshness.

Canonical data now also defines the implemented payout formula, shop tier visibility, and automation introduction rounds. Normal play reveals power-ups and automation progressively; Debug mode can still expose the complete catalog for testing.

The current payout magnitudes and power-up prices have deliberately not been rebalanced yet. Deterministic economy scenarios show that the existing low prices leave large unspent balances, especially for expert play. This is evidence for the candidate economy redesign, not a reason to change several economic variables without playtest baselines.

## Design-only balance telemetry

`balance-telemetry.js` samples operational state once per game second. It records arrivals, deliveries, queue and onboard work in progress, journey time, Little's Law diagnostics, productive lift utilisation, manual decision rate, critical exposure, weighted life loss, and the Projected Survival Index.

The forecast combines recent weighted life-loss windows with guests expected to rage within 15 seconds. VIP exposure uses its actual life penalty. Ordinary rounds record projected time to death relative to remaining round time; Endurance records time to death without a pass/fail index.

Telemetry is included in isolated simulator results and can be exported through `Game.BalanceTelemetry.export()` for developer analysis. It has no player-facing rendering and is absent from the automation bridge.

## All-Sweep balance matrix

`scripts/run-balance-matrix.js` runs three fixed seeds for each round from 2–13 with every lift on Sweep and no manual decisions, policy changes, or power-ups. Reports are committed under `reports/` and tied to hashes of the canonical balance data and matrix definition.

The initial `0.1.0-stabilized` baseline contains 36 runs and 12 hard violations. All-Sweep survives every tested seed in Rounds 3–5 and one Round 2 seed. The other Round 2 runs die at 167 and 176 seconds, too late to provide the intended intervention window. Rounds 6–11 and 13 fail consistently. Round 12 all-Sweep survives 89–101 seconds and still needs comparison against an approved competent strategy.

The simulator now advances virtual animation time by exactly one simulated second per 60 frames and reports elapsed simulation seconds explicitly. Endurance simulations use a bounded 30-minute safety horizon rather than incorrectly stopping at the standard round duration.
