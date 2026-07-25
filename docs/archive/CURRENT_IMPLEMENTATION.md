# Current Implementation Baseline

**Snapshot date:** 18 July 2026, with later appended implementation notes.
**Status:** Historical technical context; not a current plan or source of delivery status.
**Use instead:** Code and focused tests for current behavior; `DELIVERY_PLAN.md` for current scope; `TEST_PLAN.md` for
evidence. This snapshot is retained because it explains prior architectural decisions.

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

## Extension implementation status

Rounds 14-20 now have structural factory definitions, 20/25/30-floor layouts, larger fleet rendering, and direct
single-lift Service Zoning controls. Floor 0 is the G service floor when included in a range. Spawn curves remain
provisional pending structural playtesting; transfers and G-hub routing are not implemented.

## Implemented core loop

1. The player enters a name and starts a seeded round.
2. Guests spawn with random origins and destinations.
3. The player routes lifts manually or assigns automations.
4. Waiting guests age through patience states.
5. Guests board, travel, disembark, or rage and cost lives.
6. A round ends by timer, a special objective, or loss of lives.
7. Performance and achievements award points.
8. The player buys power-ups before the next round.

Round entry includes a five-second orientation countdown. Automation controls remain active while the game clock and spawner are frozen. Capacity is communicated through temporary lift effects during this countdown and whenever effective capacity changes. First-use automation discovery uses the same transient cue approach and is structured to extend to custom and shared automation.

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
| Sweep | Implemented | Directional routing using waiting and onboard demand; a manually selected stop boards waiting guests in either direction, subject to normal capacity and compatibility rules |
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

The stabilization handoff infrastructure is now implemented: unit, mechanics, integration, smoke, full, and
UTF-8 validation tiers are available through `package.json`; production simulations support batch execution,
reproducibility checks, replay hashing, compact summaries, named strategy profiles, bounded balance search, and
economy candidate experiments. Custom automation runs in a deadline-terminated worker, and imported blueprints
require schema/version/checksum validation plus explicit consent.

The full 91-test gate and Round 13 Monkey playtest-boundary campaign pass. Canonical promotion remains intentionally blocked:
Round 2 has no feasible candidate satisfying both the all-Sweep failure invariant and low-intervention hybrid
success, and human campaign evidence has not yet been collected. Provisional economy bands are owner-accepted for
now; Round 10 custom automation is optional but must provide measurable advantage.

The project contains:

- A browser regression scorecard.
- A global-state simulator.
- Simulation baseline scripts.
- A reproducible Playwright autonomous-pilot lifecycle suite.

The Playwright suite invokes the obfuscated manifest gateway, launches UNIT_01 through the visible Debug modal, reaches the Round 13 playtest boundary, verifies the human-intervention kill switch, and verifies ordinary-death rollback. With the real five-second countdown on every round, the current Monkey boundary campaign passes in approximately 8.3 minutes and the complete 91-test gate in approximately 9.6 minutes on the development machine.

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

1. Round 2 remains underloaded: unattended all-Sweep survives all three accepted release seeds.
2. Rounds 7–11 and 13 are overloaded under the current strong-comparator portfolio.
3. Deterministic economy scenarios remain inflationary: struggling/typical/expert paths end with 81/99/174 Credits.
4. The simulator is isolated and deterministic but lacks first-class action replay, a batch execution contract, compact anomaly reporting, a held-out robustness set, and bounded parameter search.
5. Several production mechanics still lack independent coverage: VIP penalty, Gym Bro stink threshold, jam/stink recovery, rooftop release, Musak, and Group Think.
6. Campaign reset/career persistence needs an explicit browser regression test.
7. Remaining legacy compatibility parameters are not yet rejected as independent numerical sources.
8. Workshop capacity sensors use passenger count rather than weight/effective capacity.
9. Imported blueprints still need explicit origin/consent behavior, and custom automation needs deadline isolation to guarantee UI responsiveness.
10. UTF-8 text is inconsistently represented in first-party source files.

These are historical findings. Current scope and evidence are maintained in `DELIVERY_PLAN.md` and `TEST_PLAN.md`.

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

The Round Review places its three column labels—Served, Credits Earned, and Total Credits—directly below the outcome heading and above their statistics.

## Balance data pipeline

`design/game-balance.v1.json` is the canonical machine-readable numerical source. `scripts/generate-balance.js` produces `generated/game-balance.js`, which loads before `config.js`. Runtime `Config.GAME_DATA` references that generated object.

Top-level `Config` fields retained for debug controls and older consumers are initialized from canonical data rather than repeating independent values. Validation checks canonical/runtime parity, probabilities, round coverage, achievement tiers, power-up tiers, and generated-artifact freshness.

Canonical data now also defines the implemented payout formula, shop tier visibility, and automation introduction rounds. Normal play reveals power-ups and automation progressively; Debug mode can still expose the complete catalog for testing.

The current payout magnitudes and power-up prices have deliberately not been rebalanced yet. Deterministic economy scenarios show that the existing low prices leave large unspent balances, especially for expert play. This is evidence for the candidate economy redesign, not a reason to change several economic variables without playtest baselines.

### Playtest tuning: R1-R3 capacity and R2 traffic

Balance `0.2.3-r2-capacity-playtest` sets lift capacity to 15 for Rounds 1, 2, and 3 only. Round 2's final spawn
rate changes from `0.52` to `0.468` (a 10% reduction); all other round parameters remain unchanged. The release
all-Sweep matrix still records R2 survival on all three seeds, while R3 death timing changes from `179/145/136s` to
`177/145/131s` on seeds `1234/3141/6060`. This is a playtest build, not a completed campaign-wide balance promotion.

### Open playtest diagnostics

Round 13 playtesting reported lifts stopping between floors and failing to board or progress, including when empty.
This is treated as a runtime correctness issue, not a balance result. Related observations include jammed lifts moving
while flashing, accumulating effect icons, and a rocket/Turbo effect appearing to restrict the top floor.

The first correction is now implemented: animation ticks hard-stop jammed lifts, Round 13 gravity/Turbo regression
coverage confirms empty lifts can reach floor 14 without changing legal bounds, and repeated effect icons refresh
instead of accumulating. Full expiry behavior remains covered by the shared timer path and should be rechecked during
the next full campaign run.

### Playtest follow-up: Credits, rooftop party, jams, and Gym Bros

Balance `0.2.5-clarity-endurance-gravity-debug` raises Endurance earned Credits to a `0.6` multiplier while
leaving Supply Closet prices unchanged. Rooftop party guests are non-boardable until release, jams are capped at 20
seconds, and Gym Bros/Gym Floor persist through Rounds 11–13. The Gym Floor label uses the flex symbol.

The post-change full panel completed 60 tests with one transient Monkey Protocol Beta kill-switch failure; that test
passed on immediate isolated rerun and is accepted as a pass for this playtest push.

### Playtest remediation: Debug access, checkout clarity, and late-round pacing

Balance `0.2.6-playtest-remediation` implements the clarified playtest batch. Debug Warp now exposes every configured
round. Checkout guests heading to floor G carry an explicit checkout marker and render with a suitcase; ordinary guests
whose destination happens to be G still render `G`. Room Service guests render at 70% of the previous horizontal width.
Rocket duration is verified at 10 seconds. Rooftop events use a seeded 30–90 second start window and a 90-second active
duration. Endurance payout multiplier is 1.0, and Round 13 spawn rates are reduced 20% to `1.20→1.40`.

Lifecycle coverage is 63/63, targeted remediation coverage passes, mechanics coverage is 10/10, economy/config/generated
balance checks pass, and regenerated balance reports validate 36 matrix runs with 5 documented all-Sweep violations.
Human confirmation of rooftop readability and Round 13 affordability remains outstanding.

## Design-only balance telemetry

`balance-telemetry.js` samples operational state once per game second. It records arrivals, deliveries, queue and onboard work in progress, journey time, Little's Law diagnostics, productive lift utilisation, manual decision rate, critical exposure, weighted life loss, and the Projected Survival Index.

The forecast combines recent weighted life-loss windows with guests expected to rage within 15 seconds. VIP exposure uses its actual life penalty. Ordinary rounds record projected time to death relative to remaining round time; Endurance records time to death without a pass/fail index.

Telemetry is included in isolated simulator results and can be exported through `Game.BalanceTelemetry.export()` for developer analysis. It has no player-facing rendering and is absent from the automation bridge.

## Audio status and approved direction

Audio is partially implemented. The current build has an `AudioEventBus`-compatible browser service in `audio.js`,
menu/gameplay context handling, Leaderboard mute/music/SFX controls, a checked-in asset register, manifest, and
attribution. The local set includes the title loop, gameplay base and pressure layers, rooftop loop, victory fanfare,
elevator-door cue, every reviewed power-up and hazard effect, VIP arrival, guest urgency/refusal, purchase, and UI
error effects. Procedural fallback remains active for missing or unsupported files.

The verified register now has a local file for every listed source row, with licence and attribution evidence recorded.
Gameplay publishes semantic audio events for VIP arrival, rooftop lifecycle, hazard start/end, guest urgency/refusal,
boarding/alighting, lift arrival, power-up use, purchases, UI errors, and victory; the audio service owns asset
resolution and fallback. PSI may drive internal music layers and tempo, but remains unavailable to player UI,
automation, saved state, and balance decisions.

The audio review register is now normalized in `assets/audio/audio-review.csv`. Verified local imports include the
CC-BY 3.0 Rocket Launch mapped to Turbo, plus CC0 Rooftop, Musak, TARDIS, Wide Doors, and Stink assets. Their source
and attribution records are in the manifest and `assets/audio/ATTRIBUTION.md`. Rooftop lifecycle protection,
non-restarting PSI pressure updates, fallback pulse suppression, identity-aware throttling, production mapping
coverage, hysteresis, explicit teardown, and production-flow coverage for spawner, hazard, shop, and core lifecycle
transitions are implemented. The local test server now supplies audio-specific MIME types and teardown bounds pending
Web Audio closure. The focused Chromium and WebKit audio suites both pass 22/22 after moving Playwright output to the
OS temp directory. Remaining device acceptance work is listed in `TEST_PLAN.md`. The
semantic event contract is covered by focused browser tests and remains simulation-neutral.

## All-Sweep balance matrix

`scripts/run-balance-matrix.js` runs three fixed seeds for each round from 2–13 with every lift on Sweep and no manual decisions, policy changes, or power-ups. Reports are committed under `reports/` and tied to hashes of the canonical balance data and matrix definition.

The initial `0.1.0-stabilized` baseline contains 36 runs and 12 hard violations. All-Sweep survives every tested seed in Rounds 3–5 and one Round 2 seed. The other Round 2 runs die at 167 and 176 seconds, too late to provide the intended intervention window. Rounds 6–11 and 13 fail consistently. Round 12 all-Sweep survives 89–101 seconds and still needs comparison against an approved competent strategy.

Balance `0.1.1-round-3-pressure` promotes the tested Round 3 arrival curve `1.00→1.20`. On the three fixed seeds, all-Sweep fails 3/3 while two active Wide Doors comparators survive 3/3. This is simulation evidence of separation, not a completed fun or affordability judgment. Round 2 remains an open design problem because tested increases in generic pressure defeated both the unattended floor and the minimal-rescue proxy.

The regenerated 36-run matrix now has 9 hard violations, down from 12. Round 3 is no longer a violation; Rounds 2, 4, and 5 remain above the all-Sweep floor.

The candidate runner now covers Rounds 4 and 5 with pure featured-policy and hybrid-manual comparators. Initial experiments found no defensible separation: pressure sufficient to defeat Sweep also defeated Priority/Voting and the simple manual proxy. No production values were changed. Built-in-only comparators are now explicitly prevented from falling through into manual rescue actions, preserving zero-click evidence.

The campaign envelope runner (`npm.cmd run balance:envelope`) now compares the committed all-Sweep floor with a candidate idealized dispatcher and reports Little's Law pressure summaries across Rounds 2–13. Its first run confirms Rounds 4 and 5 are Underloaded. The direct dispatcher underperforms Sweep elsewhere because it sacrifices en-route pickups, so those rounds are correctly classified Unproven rather than being tuned around an invalid comparator. Round-specific strong profiles remain the next evidence task.

The strong side is now a band-level portfolio combining direct dispatch with featured built-in policies and declared resource loadouts. The current envelope classifies Round 3 as Contested; Rounds 2, 4, and 5 as Underloaded; Rounds 6, 7, and 13 as provisionally Overloaded; and Rounds 8–12 as Unproven. No production pressure changed in this measurement phase.

Balance `0.2.0-e2e-coarse` applies the first satisficing batch. Rounds 4–6 are now Contested alongside Round 3: all-Sweep fails every accepted seed and the supported portfolio survives every accepted seed. The all-Sweep matrix has 3 remaining violations, all in Round 2. Rounds 7 and 13 retain their prior production pressure because exploratory reductions did not improve credible separation. Rounds 8–13 remain provisional pending stronger event/strategic comparators, with Round 12 still requiring a 4–8-minute competent profile.

The event/strategic portfolio now selects condition-appropriate resources and compares Sweep, Priority Sweep, and Weighted Voting where unlocked. It classifies Rounds 7–11 and 13 as Overloaded. A uniform 20% pressure reduction failed the satisficing gate—it introduced additional unattended Sweep survivors without producing competent survival—so the entire experimental batch was rolled back. Late-campaign progress now requires stronger solution leverage or event-specific strategy, not further blind pressure reduction.

Round 12 now uses the Endurance-specific `0.80→1.00` arrival curve. Across accepted seeds, unattended all-Sweep lasts 104–184 seconds (about 147 seconds average), while the supported portfolio lasts 264–357 seconds (about 314 seconds average). This satisfies the design window: built-ins remain below four minutes and competent play lasts four to eight minutes. Death remains the intended completion event.

Human playtest feedback found Round 1 too difficult and the review/retry outcome unclear. Balance `0.2.1-early-onboarding` reduces Round 1 arrival pressure to `0.15→0.30`. Successful reviews now explicitly celebrate the won round and next unlock; failed reviews explicitly promise and label a same-round retry. The Round 2 retry transaction was reconfirmed in production-path tests: failure preserves Round 2, its seed, and its checkpoint. Round 2 pressure remains an open human-play outlier because reducing it blindly would worsen the existing unattended-Sweep violation.

Repeated human playtesting still found Round 2 inaccessible, so balance `0.2.2-round-2-accessibility` provisionally reduces its pressure to `0.40→0.52`. This prioritizes novice progression while leaving the resulting unattended-Sweep violation explicit. Manual floor selection now supplies the missing supervised action: while Sweep is active, the selected stop ignores Sweep direction and boards all legally compatible guests until capacity is reached, then returns to automation. Review and briefing copy now derives Supply Closet language from canonical unlocks: Round 1 continues directly to Round 2, and Round 2 shows `Start Round 2` with no locked shop messaging.

The resource-supported campaign comparator now combines featured automation, condition-driven power-up use, and bounded manual rescue of the most urgent queue. This confirms Rounds 4–6 as Contested and Round 12 within its Endurance window. Rounds 7–11 and 13 remain Overloaded. A fresh 20% coarse pressure reduction was rejected and fully rolled back because it allowed unattended Sweep to survive Rounds 7 and 8 without establishing competent survival later. The next balance work must strengthen mechanic-specific solutions rather than reduce generic traffic.

The simulator now advances virtual animation time by exactly one simulated second per 60 frames and reports elapsed simulation seconds explicitly. Endurance simulations use a bounded 30-minute safety horizon rather than incorrectly stopping at the standard round duration.

Player-facing economy language uses **Credits**: reviews distinguish Credits Earned from Total Credits. Average wait is the complete spawn-to-destination journey. A browser timestamp-domain defect previously clamped live journey durations to zero; runtime animation and guest telemetry now share the epoch/virtual-time clock.
