# Current Playtest Release — Service Zoning Campaign Preview

**Status:** Active playtest release  
**Release target:** `0.3.0-network-campaign-preview`  
**Owner class:** Product and engineering  
**Last reviewed:** 28 July 2026
**Scope boundary:** Promote the implemented R14–R20 direct-service zoning foundation into a diagnosable, playable,
and testable campaign slice. This plan does not add transfers, a G hub, new hazards, or new power-ups.

## Current state

**Implementation:** Current `master` baseline `a0b9c58` (28 July 2026), with the permanent Automation Dock promotion,
Service Zoning, counterweight visual revision, and the latest playtest remediation implemented.
**Automated baseline:** Component gates are recorded in `TEST_PLAN.md`; the aggregate browser command is limited by the
execution environment rather than an observed test failure.

### Completed follow-up slice

**Status:** Implemented and pushed to `master`.<br>
This slice tightens the permanent Automation Dock presentation: wider carousel arrow hit targets, compact
policy text without a visible “Armed” label, a true Dock Library toggle, and an icon-only Library-panel close control.
The empty-cart credit warning now shares the canonical Supply Closet eligibility predicate, so carried-forward credits do
not trigger a warning before power-ups are available, including Debug-mode Round 1.
**Promotion status:** Not promoted. The remaining release work is structured human/device evidence, R14–R20 tuning
only where evidence supports it, and a release decision with a recorded test/device/seed pack.

## Future vertical slice — R21–R23 Counterweight Network

**Status:** Implemented vertical slice; awaiting focused human playtest and balance tuning.<br>
**Implementation status (current):** Vertical slice implemented; focused human balance, accessibility, and visual playtesting remains open.<br>
**Scope:** Three authored post-R20 rounds: a two-lift counterweight teaching puzzle, a four-lift Open Plan recovery
round, and an eight-lift network round that combines counterweights, Service Zoning, Open Plan, and the existing
power-up economy.<br>
**Design authority:** `ROADMAP.md`, `Game Play Map.md`, `Lift-Operator_GDD.md`, and `Automation_Workshop_Spec.md`<br>
**Test authority:** `TEST_PLAN.md`

### Locked behaviour

1. Fixed immediately-adjacent pairs are `L1↔L2`, `L3↔L4`, `L5↔L6`, and `L7↔L8`; each pair maintains complementary
   floors during travel.
2. Either car receives ordinary player and automation commands. There is no master/slave control, restriction, warning,
   or consequence preview; commanding one car moves its partner in the opposite direction.
3. Loads, doors, boarding, alighting, guest status, and ordinary suitability rules remain independent per car.
4. A jam immobilises its car and prevents its partner travelling, but the stationary partner may finish ordinary
   boarding/alighting. Wrench recovery remains available.
5. Turbo applies to the pair at half ordinary speed benefit; Gravity always evaluates the upward-moving car; Stink
   remains unchanged; all existing power-ups and automations remain legal.
6. Open Plan is introduced in R22. While its timed tier effect is active, destination-aware guests may transfer between
   any adjacent lifts stopped on the same floor. Capacity, stink, Gym Bro, VIP, and every other ordinary boarding rule
   still apply. Bronze/Silver are longer local windows; Gold is whole-building.
7. Zoned policies retain their current manual-override semantics: a manual command may leave the zone temporarily, then
   the policy resumes its zone behaviour.

### Delivery sequence

1. Add counterweight-pair state and deterministic paired movement without changing ordinary unpaired-round behaviour.
2. Render fixed adjacent pair identity with matching colours, centred cables, top/bottom pulleys, and a continuous loop
   that makes simultaneous opposite movement legible.
3. Author R21 at 2 lifts/11 floors with low arrival pressure and a briefing that teaches the physical rule.
4. Implement the timed, tiered Open Plan transfer window and author R22 at 4 lifts/15 floors around recoverable
   passenger-distribution mistakes.
5. Author R23 at 8 lifts/29 floors, combining counterweights with zoning, Open Plan, and existing power-ups; tune
   only after deterministic and human evidence identifies the bottleneck.

### Explicitly deferred from this slice

- Dynamic pair rewiring, player-selectable pair assignment, or non-adjacent counterweights.
- Transfers outside an active Open Plan window, between non-adjacent lifts, or while cars are on different floors.
- New automation primitives beyond exposing canonical counterweight/open-plan state needed for existing policies to
  operate correctly.
- Procedural Counterweight rounds. The first trilogy is authored and seed-tested.

### Implementation result

The engine now carries explicit counterweight partners, initializes complementary positions, mirrors manual and
automation targets, blocks pair travel when the partner is jammed, applies the half-benefit Turbo rule, and renders the
paired pulley/cable treatment. Open Plan uses a single active local hub for Bronze/Silver and adjacent whole-building
exchange for Gold, with ordinary boarding constraints preserved. Canonical balance, generated artifacts, Debug Warp,
briefings, and focused browser tests cover R21–R23. Human balance, accessibility, and visual playtesting remain open.

### Locked decisions before implementation

1. **Open Plan local scope:** Bronze/Silver target one lift as a transfer hub. That lift may exchange compatible guests
   with either immediately adjacent neighbour at the same floor. Gold remains whole-building adjacent transfer.
2. **Open Plan economy:** move the canonical unlock to R22 and set Bronze/Silver/Gold durations to 20/45/60 seconds.
   Gold is the longest tier and applies across the whole building.
3. **Authored balance envelope:** R21 uses 11 floors and R23 uses 29 floors. Arrival curves remain deterministic and are
   tuned only after the R14–R20 evidence provides an economy baseline.

## Next remediation slice — settings, shared Ground, and counterweight polish

**Status:** Implemented; ready for focused human playtest from 28 July 2026 feedback.<br>
**Scope:** Replace the ordinary Leaderboard entry point with Settings; make Ground shared and weighted once zoning
unlocks; improve guest/briefing readability; correct R6 and counterweight authored balance; fix Open Plan expiry; and
reproduce the reported R22 manual-stop boarding issue before changing boarding rules.<br>
**Design authority:** `ROADMAP.md` and `Game Play Map.md`<br>
**Test authority:** `TEST_PLAN.md`

### Locked behaviour

1. **Settings and Leaderboard:** the normal button/modal becomes Settings. Settings shows current achievements, audio
   controls, attribution, and a link to the separate Leaderboard. Campaign completion continues to open Leaderboard.
2. **Shared Ground:** when zoning is enabled, every lift can legally serve G. G receives a weight of three ordinary
   floors for both spawned origins and selected destinations.
3. **Checkout readability:** checkout status does not replace the guest's normal happy/annoyed/critical colour. Use a
   light monochrome suitcase treatment that remains legible on those status colours.
4. **Briefing and R6:** R15–R20 briefings name their actual combined challenge and relevant preparation. R6 changes
   from `0.80→0.92` to `0.90→1.05` spawn pressure.
5. **Counterweight and Open Plan:** R21/R22/R23 use 11/15/29 floors. Open Plan timers decrement once per gameplay
   second and expiry removes both transfer eligibility and active treatment.
6. **Gym Bros:** two-digit Gym Bro destinations fit within their tile without reducing normal guest readability.
7. **R22 boarding report:** first add a deterministic reproduction covering manual target, Sweep direction, parked-lift
   arbitration, capacity, and zoning. Do not weaken ordinary direction/boarding rules until the observed cause is known.

### Implementation sequence

1. Refactor the existing Leaderboard presentation into a reusable score modal; introduce Settings as the ordinary
   navigation modal and move achievements/audio/attribution there.
2. Add canonical Ground weighting and shared-G zoning semantics through spawning, direct-route checks, automation
   labels, telemetry, and replay/simulation inputs.
3. Replace the checkout emoji-only colour dependency with a status-preserving suitcase treatment; tighten Gym Bro type.
4. Author R15–R20 challenge-specific briefing copy and apply the accepted R6/R21/R23 canonical balance changes.
5. Restore Open Plan timer decay in the single timer owner and ensure expiry removes the transfer capability.
6. Build the R22 boarding reproduction. If parked-lift arbitration is confirmed, surface or revise that arbitration only
   with a separately documented behavioural decision.

### Implementation result

Settings, shared Ground zoning, weighted post-R14 guest traffic, status-preserving checkout luggage, compact Gym Bro
tiles, R15–R20 challenge briefings, R6/R21/R23 balance changes, and single-owner Open Plan expiry are implemented and
covered by focused browser tests. The R22 manual-stop report remains an evidence-gathering item for playtest; no
boarding rule was changed speculatively.

### Explicit non-goals

- No change to campaign-completion Leaderboard behaviour.
- No transfers outside active Open Plan windows.
- No speculative change to Sweep direction compatibility before the R22 report is reproduced.

## Current playtest remediation slice

**Status:** Implemented; awaiting human playtest following the latest feedback.<br>
**Scope:** Responsive R19–R20 presentation, countdown and modal timing, Supply Closet comprehension, Rooftop Party
feedback/audio/lighting, and the three-leg VIP journey.<br>
**Design authority:** `ROADMAP.md` and `Game Play Map.md`<br>
**Test authority:** `TEST_PLAN.md`

### Agreed behaviour

- R19 and R20 use a compact eight-lift layout that fits the supported desktop game area without horizontal scrolling.
- The countdown start-now control is an icon-only `×` affordance with an accessible label and timer-area hit target.
- The unused-credit confirmation is shown only from Round 3 onward, when the Supply Closet is available.
- Opening the Workshop pauses active rounds and countdowns; closing it resumes without consuming elapsed game time.
- Rooftop Party start/end states announce themselves with toasts, stop rooftop audio on release/reset, and use colourful
  disco lighting with reduced-motion support.
- One VIP makes three seeded journeys: `G → room → random non-G floor → G`. Rage-quitting on any leg costs 10 lives
  and ends the VIP event. The first arrival is delayed into active round traffic rather than occurring immediately.

### Exit criteria

- R19/R20, Round 2, countdown, Workshop, Rooftop Party, and VIP regression tests pass.
- Audio reset and rooftop lifecycle tests confirm no prior-round rooftop track survives a restart.
- Human playtest confirms the compact layout is readable, the VIP creates three meaningful service opportunities, and the
  Rooftop Party presentation is clear without overwhelming the board.

## Completed remediation slice — power-up targeting and top-floor effect icons

**Status:** Implemented and automated-tested; awaiting human visual playtest.<br>
**Design authority:** `Lift-Operator_GDD.md` and `Game Play Map.md`<br>
**Test authority:** `TEST_PLAN.md`

### Objective

Make active power-up effects unambiguously non-repeatable on their affected lift and make roof icons visually remain
above the car at every floor without influencing, obscuring, or appearing to constrain top-floor movement.

### Locked behaviour

- A player cannot apply a timed lift effect to a lift already affected by that same effect, irrespective of tier.
  A matching active global effect also makes every affected lift ineligible.
- The check applies at the authoritative activation boundary, not only in the shop or targeting presentation. No caller
  may reset or extend an active timer by bypassing the normal target UI.
- An invalid active-effect target is a handled targeting action: it consumes nothing, performs no lift movement, keeps
  targeting active so the player can choose another lift, and explains why the lift is unavailable.
- The same rule governs global effects. In particular, Wide Doors cannot be re-triggered while its timed global effect
  is active. Reactive or instant effects remain repeatable only where their own gameplay precondition is met.
- Effect icons stay above the lift car at all floors, including the top. They are a separate non-interactive overlay
  anchored to the car's simulated position; their dimensions never participate in lift placement, collision, targeting,
  or floor arrival logic.

### Implementation sequence

1. Define one canonical effect-eligibility service for power-up ID, scope, and optional lift target, derived from the
   live lift/global timer state.
2. Route targeted resolution, instant/global activation, inventory affordance, and any programmatic activation path
   through that service; retain explicit exceptions for reactive/instant effects.
3. Make a blocked lift click a consumed targeting interaction with clear feedback and no inventory, timer, audio, or
   manual-target side effect.
4. Move active lift icons into a dedicated absolute effect-overlay layer, positioned from the lift's rendered/simulated
   location and allowed to extend above the roof without changing the car's box geometry.
5. Add deterministic and browser visual regressions, then conduct targeted top-floor and duplicate-application
   playtesting.

### Exit criteria

- Every timed lift/global effect rejects duplicate use without consuming inventory or resetting its remaining duration.
- Wide Doors is covered by the same global-effect rule.
- The car reaches the exact highest-floor target with and without each active icon, while the icon remains above it.
- No duplicate effect icon, unexpected manual target, stale targeting mode, or leaked overlay remains after accepted or
  rejected use.

## Latest playtest remediation — 15-item traceability

**Status:** Implemented and automated-tested; awaiting human playtest evidence for visual/audio feel and late-round balance.<br>
**Design authority:** `ROADMAP.md`, `Lift-Operator_GDD.md`, and `Game Play Map.md`<br>
**Test authority:** `TEST_PLAN.md`

The following numbered decisions are the complete scope. Item 3 is intentionally closed without a code change because
the existing Round 3 briefing already explains Room Service carts.

1. **Top-floor effect icons:** keep active icons above the car at the highest floor in a non-layout overlay.
2. **Duplicate power-ups:** reject reapplying an already-active effect at the authoritative activation boundary.
3. **Room Service teaching:** retain the current Round 3 reminder; no change required.
4. **Checkout suitcase contrast:** use a warm, high-contrast suitcase treatment against the lobby background.
5. **Countdown control:** use a small close-style `×` in the countdown panel's top-right; only its control area skips.
6. **Rooftop audio reset:** stop rooftop music on every round initialization, retry, and reset transition.
7. **Rooftop presentation:** add subtle board-wide rainbow beams, with reduced-motion support.
8. **VIP timing:** insert a seeded random 10–30 second pause between each of the VIP's three legs.
9. **Guest classification:** checkout guests are never Gym Bros; the two roles remain mutually exclusive.
10. **Fart audio:** cap the stink/fart sound at two seconds.
11. **R14 zoning teaching:** make the Round 14 briefing explicitly introduce zoning and the Automation Dock/Workshop.
12. **Late-round cables:** centre lift cables using the actual lift geometry, including compact R20.
13. **Late-round capacity labels:** use compact `Cap N` labels sized to each lift slot so R20 labels do not overlap.
14. **VIP queueing:** VIPs remain FIFO and hold the front position once there; behind guests may board an occupied,
    unsuitable lift while the VIP waits for an empty suitable lift.
15. **Board jitter:** contain rooftop decoration and reserve scrollbar space so effects cannot create/remove scrollbars or
    move the board.

## Promoted implementation slice — permanent Automation Dock controller

**Status:** Promoted to the sole production controller; ready for permanent playtesting.<br>
**Design authority:** `ROADMAP.md`, `Lift-Operator_GDD.md`, `Game Play Map.md`, and `Automation_Workshop_Spec.md`<br>
**Test authority:** `TEST_PLAN.md`

### Objective

Promote the scalable in-world Automation Dock to the sole automation deployment surface and remove the dense per-lift
HTML selector and Debug-only controller switch. Policy execution, unlocks, Service Zoning, persistence, sharing, and
engine assignment semantics remain unchanged.

### Locked interaction model

1. The player chooses one policy from the dock or library, or selects one or more lift targets first.
2. The Dock is disarmed by default. Lift clicks select or deselect a batch; carousel navigation previews only.
3. Clicking the carousel card arms the preview. Clicking the already armed card disarms it. Library entries arm the
   chosen policy through the same pathway.
4. An armed policy causes lift controllers to glow for five seconds as a hint. The armed policy persists after the glow
   ends, and every clicked lift receives it immediately.
5. If lifts were selected while disarmed, arming a policy assigns it to the whole batch immediately, clears the batch,
   and leaves the policy armed. There is no Apply action.
6. The lift row displays compact assignment status only. Manual remains an assignable policy.
7. The carousel shows persistent player pins. Manual and currently unlocked built-ins are pinned by default; the
   complete Custom and Shared with Me collections are managed in a vertically scrolling accordion Library.

The Dock retains the armed policy after assignment, clears a completed batch, and announces the number of lifts changed.
These are UI interaction rules only; engine assignment and policy semantics remain unchanged.

### Architecture boundary

- Extract one canonical policy-discovery function from the current menu renderer. It returns only policies currently
  legal for the player: Manual, unlocked built-ins, eligible player scripts, and eligible shared scripts, with names,
  source category, ownership, and resolved zone label.
- Add a UI-independent assignment service accepting `{ policyId, liftIndexes }`. It validates the current catalog and
  target indexes, calls the existing engine assignment API in deterministic lift-index order, and returns a structured
  result for UI feedback.
- Define a controller adapter contract: `mount(slot)`, `render(state)`, `refresh()`, `destroy()`, and selection actions.
  The adapter may render differently but may not own unlock, policy, or assignment rules.
- Mount the Dock directly in the basement/control-row space as the sole controller.
- Remove the obsolete selector implementation, Debug-menu controller switch, variant state, and compatibility branches.
- Namespace dock, library, and lift-status CSS. Do not couple controller layout to shaft/floor click handlers.

### Implementation sequence

1. Characterize policy discovery, unlock, zoning-label, teaching-cue, and refresh behaviour in focused tests.
2. Implement the catalog and assignment service as the sole automation control path.
3. Implement the Dock: preview/armed policy card, fixed Manual/unlocked-built-in pinned strip, disarmed batch target
   selection, armed five-second lift hint, immediate assignment feedback, and no Apply control.
4. Implement the searchable accordion library with Built-in, Custom, and Shared with Me sections, persistent pin
   checkboxes, and Library-toggle/modal cleanup. Selecting an entry returns to the dock armed and assigns any pending
   batch immediately.
5. Keep teaching cues and status refresh inside the Dock contract; do not couple controller layout to shaft/floor click
   handlers.
6. Add visual/responsive treatment for one through eight lifts and ensure compact late-fleet layout remains intact.
7. Run automated gates and structured Dock playtesting on the same rounds, seed, loadout, and policy set.

### Explicit non-goals

- No change to `setLiftAutomation`, policy execution, Service Zone enforcement, script storage, import/share format, or
  unlock progression.
- No drag-and-drop, automatic paint-mode assignment, controller preference persistence, mobile
  adaptation, or Workshop redesign in this slice.
- No alternate in-game automation selector or Debug controller switch remains in the product build.

### Exit criteria

- Every legal policy is discoverable in Dock/library under the same round, player, and sharing state.
- Single and batch assignments produce the canonical engine state, including Manual and zoned policies.
- Previewing cannot alter a lift. Armed controller clicks and armed batch confirmation use the canonical assignment
  service and explain invalid assignments without changing lifts.
- The product has one controller path, with no variant state, stale selector UI, leaked overlays, or Debug-only dependency.
- The dock remains readable and operable from one through eight lifts; custom/shared collections remain usable at scale.

### Delivered checkpoint (26 July 2026)

- Added `automation-controller.js` as the permanent Automation Dock boundary and shared policy catalog/assignment path.
- Added fixed pinned policies, multi-lift target selection, armed/disarmed assignment, searchable library, and
  post-assignment batch clearing.
- Added lifecycle cleanup and regression coverage for selection-before-arming, batch assignment, library discovery, and
  permanent Dock mounting. Human responsive visual acceptance remains open.
- Replaced inferred Dock guidance with explicit session state: preview, armed policy, targets, and guidance intent
  are independent. Browsing cannot arm a policy or start lift flashing.
- Assignment now cancels pending guidance, clears completed batch selections, and leaves the armed policy available for
  subsequent lift clicks.
- Refined the prototype after first visual review: the row now uses a compact vanilla-JS carousel without a native
  policy scrollbar or verbose status labels, and armed policies pulse the lift targets as a next-step cue.
- Reframed the controller row as a fixed-width basement level beneath G, marked with the non-interactive `⚙⇅` badge;
  armed-lift guidance flashes for five seconds and then expires without disarming the policy.
- Removed the obsolete legacy selector, Debug controller option, variant state, and selector-specific teaching/status
  branches. The Dock is now the permanent production path.

## Completed implementation slice — automation-native Service Zoning

**Status:** Implemented on `master`; retained here as the design and delivery record.<br>
**Design authority:** `ROADMAP.md` and `Automation_Workshop_Spec.md`<br>
**Test authority:** `TEST_PLAN.md`

### Objective

Move Service Zoning from the current Workshop lift-selector workflow into saved automation policies, so the player
constructs, saves, copies, and deploys zoning through the established Workshop philosophy.

### Agreed behaviour

- Round 14 unlocks zoning. Existing non-zoned built-ins remain available at all times.
- Add scalable read-only `Zoned Low` and `Zoned High` built-ins. Their bands share one midpoint floor as an overlap.
- Add a declarative Service Zone Blockly block with Low, High, and Custom modes.
- Custom lower/upper values are edited through a contextual block-parameter panel, not a lift selector.
- Assigning a Zoned automation applies its resolved band to the lift for as long as that routine is active.
- Manual override may move a lift outside its band temporarily; incompatible guests still cannot board, and the Zoned
  routine resumes when the override completes.
- Existing passengers complete their current destinations when a new zone is assigned.
- Manual or unzoned automation restores full-building service.
- Zone metadata survives save, copy, import, and blueprint sharing; scripts without metadata remain unzoned.

### Implementation sequence

1. Define and validate the policy metadata schema, including scalable Low/High presets and Custom ranges.
2. Add Blockly serialization, code-generation/runtime extraction, migration for existing scripts, and blueprint support.
3. Replace the live lift-selector zoning controls with contextual parameters for the selected Service Zone block.
4. Resolve policy metadata on automation assignment and preserve the existing engine-level direct-service predicate.
5. Implement manual-override resumption and safe handling of passengers already onboard.
6. Add Round 14 unlocks, built-in policy entries, readable automation-menu zone labels, and Welcome copy.
7. Add telemetry/replay identity for policy ID, policy revision, resolved zone, and resulting coverage.
8. Run focused tests, the full gate, and structured Round 14–20 playtesting.

### Exit criteria

- No lift can have a zoning band except through its active automation policy.
- Low and High policies scale correctly across 20-, 25-, and 30-floor buildings with one-floor overlap.
- A saved/copied/imported/shared policy retains its zoning metadata.
- Manual overrides, existing passengers, boarding refusal, automation, simulation, and telemetry remain consistent.
- The Workshop no longer offers a lift-selection zoning workflow.
- Round 14 Welcome copy explains that zoning is optional and encourages copying/adapting a policy in Workshop.

## Acceptance work now

- Run the structured R9, R13, R14, and R15-R20 combination-round sessions with browser/device, seed, loadout,
  zoning configuration, observed failure cause, and player explanation recorded in the playtest archive.
- Confirm real-device audio behaviour: first gesture, menu/pressure continuity, SFX duration, Musak duration, modal
  toggling, and no unwanted door/distress sounds.
- Verify top-floor rocket placement and R19/R20 responsive framing at supported viewports.
- Review zoning telemetry against declared strategy profiles, then promote only conservative canonical balance changes
  supported by reproducible evidence.
- Record the final release decision, generated-artifact freshness, test count, supported device matrix, seed pack, and
  tag before calling this release promoted.

## Release outcome

Ship a credible second campaign arc: R14–R20 are structurally playable, Service Zoning is a real strategic tool,
players can understand and recover from coverage failures, and the team has enough telemetry and deterministic evidence
to tune the extended campaign without guessing. The release also includes a constrained Endless Operations alpha that
proves the generation/validation pipeline without making unbounded runtime generation a campaign dependency.

The release is ambitious because it closes the loop from product design through generated data, production behavior,
responsive UI, simulation evidence, deployment, and human playtest. It is bounded because transfers, a G hub, new
mechanics, and a fully open-ended generator remain outside the release gate.

## Delivered implementation scope

### Delivered foundation

- Completed the shared Service Zoning model: canonical range state, normalization, inclusive G handling, overlap and
  uncovered-route analysis, persistence, import validation, and one `canLiftDirectlyServe` decision path.
- Integrated the predicate across live boarding, simulation, built-in automation, custom automation, manual targeting,
  refusal messaging, and Review diagnostics.
- Finished Workshop configuration UX: range editing, coverage preview, warnings, readable in-play zone labels, and
  recovery guidance when a lift is unavailable or a route is uncovered.
- Completed 20/25/30-floor rendering and 5–10 lift presentation, including responsive desktop/tablet/mobile behavior,
  fleet scrolling, sticky floor references, bounded DOM updates, and clear shaft selection.
- Added deterministic zoning metrics and replay identity: refusals, uncovered routes, overlap utilization, empty travel,
  restrictive-zone idle time, zoning configuration, and failure classification.

### Pending release-promotion evidence

- Validate and conservatively tune R14–R20 one parameter family at a time after structural evidence passes. Preserve
  viable manual/hybrid, built-in-plus-loadout, and custom Workshop strategies where practical.
- Close the known R9 rooftop and R13 affordability/manageability playtest gates, or record explicit owner decisions to
  defer them with evidence.
- Complete release documentation, generated-balance freshness, attribution/audio status, and a reproducible release
  command path.

### Delivered Endless Operations alpha

- Built a constrained offline Endless Operations generator from approved templates and seeded parameters.
- Validated generated operations through simulation, feasibility thresholds, strategy profiles, and replay identity.
- Exposed a debug-only entry point that starts a pre-checked playable operation.
- Do not expose arbitrary runtime generation to the normal campaign until generated fairness and failure diagnosis are
  demonstrated.

### Explicitly out of scope

- Guest transfers, multi-lift journeys, or G-hub routing.
- New gameplay mechanics, power-ups, hazards, guest types, themes, online services, or player-facing telemetry.
- Full procedural generation of unconstrained rounds in the live campaign.
- Broad module/ESM migration or a framework rewrite.

## Release workflow

1. Work directly on `master` for this project; keep scope changes documented here and preserve a clean, reviewable commit history.
2. For a future scope extension, create a new vertical-slice plan rather than reopening this completed implementation
   sequence.
3. Keep canonical numerical changes in `design/game-balance.v1.json`; regenerate and validate artifacts in the same
   change.
4. Run the fast checks after each slice and the complete release gate before merge.
5. Review the diff and generated assets, run the release gate, then commit and push `master` for the GitHub Pages
   playtest build.
6. Tag the release with the balance version, commit, test counts, supported browser/device matrix, and playtest seed
   pack.

## Playtest phases

- **Internal verification:** automated gates, seeded smoke sessions, responsive viewport checks, and audio-capable
  desktop/WebKit checks.
- **Structured team playtest:** R9, R13, R14, and one combination round from R15–R20 using declared seeds/loadouts;
  capture failure explanations and zoning configuration.
- **Broader playtest:** compare authored R1–R13 baseline, zoning introduction, late-round combinations, and Endless
  alpha challenges. No balance promotion occurs from anecdotal feedback alone; record the hypothesis and evidence.

## Delivered foundation detail

Players can configure direct lift service bands, understand coverage gaps and refusals, and play the structural
R14–R20 rounds without silent routing failures. Developers can reproduce a zoning failure from a seed, configuration,
and compact telemetry report before tuning traffic.

## Pre-delivery foundation

The current build already has R14–R20 factory definitions, 20/25/30-floor layouts, 5–10 lift rendering, inclusive
service ranges, live boarding enforcement, manual/automation target enforcement, and Workshop lower/upper controls.
This slice is about validation, observability, usability, and conservative tuning—not rebuilding that foundation.

## Historical implementation workstreams

### 1. Direct-service correctness

- Normalize and validate inclusive lower/upper ranges, including G (floor 0).
- Prove live boarding, simulation, built-in automation, custom automation, and manual targeting all use the same
  direct-service rule.
- Make uncovered origin/destination pairs fail visibly with a plain explanation; guests never transfer in this release.
- Verify existing boarding constraints remain authoritative: capacity, direction, VIP, Rooftop, Gym Bro, jam, stink,
  patience, Turbo, and Double-Decker.

### 2. Workshop and player comprehension

- Make range edits, previews, invalid-range handling, overlap warnings, and persistence easy to inspect.
- Show each lift’s configured zone clearly enough for a player to diagnose a refusal.
- Validate large-fleet presentation at 20, 25, and 30 floors on desktop, tablet, mobile, and horizontal scroll layouts.

### 3. Observability and balance evidence

- Add compact deterministic metrics for zone refusals, uncovered direct routes, overlap utilization, empty travel, and
  idle time caused by restrictive zones.
- Add replay/report evidence for zoning configuration and resulting coverage.
- Run representative manual/hybrid, built-in-plus-loadout, and custom Workshop profiles before changing R14–R20 spawn
  curves.

### 4. Parallel human-playtest evidence

- Confirm the R9 rooftop release wave is dramatic but readable.
- Confirm Round 13 offers an affordable, manageable loadout and that stink is useful discretion rather than a mandatory
  tactic.
- Record browser/device, seed, balance version, loadout, zoning configuration, and observed failure reason for each
  session.

## Historical implementation sequence

1. Establish production-path zoning tests and compact telemetry/replay fields.
2. Improve Workshop/refusal/Review explanations and verify responsive large-fleet layouts.
3. Run structural R14–R20 scenarios with fixed seeds and declared strategy profiles.
4. Conduct human playtests for R9, R13, and the zoning introduction/combination rounds.
5. Tune one parameter family at a time in canonical balance data only after the prior evidence is reviewed.

## Release-promotion criteria

- No direct-service bypass exists in live play, simulation, or automation.
- Coverage gaps and refusal causes are visible and reproducible.
- R14–R20 initialize, retry, reset, simulate, and review deterministically.
- Large-fleet layouts remain usable at supported viewport classes.
- Reports identify whether a zoning failure was coverage, capacity, timing, automation, or balance pressure.
- Human evidence supports the R9/R13 experience and identifies the first R14–R20 tuning hypothesis.

## Implementation checkpoint — 23 July 2026

Completed in the current working tree:

- Service-zone range validation and deterministic coverage/overlap/direct-route reporting.
- Zoning refusal counters and zoning configuration in design telemetry exports and samples.
- Workshop coverage status now reports uncovered and overlapping floors and uses canonical range validation.
- Constrained seeded Endless Operations alpha with envelope validation, reproducibility metadata, and a Debug-only
  entry point that starts a playable operation.
- Browser regression coverage for the new diagnostics and Endless entry point.
- Full repository gate: 93 Playwright tests passed; syntax, docs, config, balance, economy, report, UTF-8, unit,
  mechanics, and integration checks passed.

Still required before release promotion:

- Human R9/R13 acceptance and structured R14–R20 playtesting.
- Real-device audio checks and responsive viewport evidence.
- Review of zoning telemetry against declared strategy profiles, followed by conservative balance changes if needed.
- Release branch push, generated-artifact review, deployment, and a tagged playtest build.

## Implementation checkpoint — 25 July 2026 — audio/playtest remediation

Implemented on `master` for the next human playtest pass:

- Imported and wired the CSV-authoritative Dream Raid and Orbital Colossus gameplay tracks and Jazz Chromatic Musak.
- Menu music is managed across briefing, review, leaderboard, Debug, and Workshop modal transitions; those primary
  modals are mutually exclusive and their buttons toggle the current modal closed.
- Disabled elevator-door and guest-distress playback per the CSV `NO SOUND` decisions. Added the preferred placeholder
  beep for guest served and defenestration events, plus shop-item selection feedback.
- Prevented repeated timed power-ups on an already affected lift, deduplicated lift effect icons, added visible jam and
  capacity-full states, and made Infinite Capacity expiry unload passengers at the next stop.
- Restored Party guests to green/HAPPY when the rooftop event ends. Gym Bros remain exempt from stink refusal.
- Added the approved Round 3 Room Service explanation; Round 9 now has 50% more lift capacity and 20% lower spawn
  rates; Round 13 has 50% lower spawn rates and 20% lower gravity.
- Regenerated balance artifacts and refreshed deterministic balance evidence for version `0.2.7-audio-playtest-remediation`.

The build is ready for structured playtesting. Human evidence remains required for audio playback on target devices,
modal transitions, rocket rendering on the top floor, Round 9/13 feel, R19/R20 responsive framing, and the new expiry/
party-state behaviours.

## Implementation checkpoint — 25 July 2026 — economy and audio continuity follow-up

Implemented for the next playtest pass:

- Credits now carry forward across successful rounds and the Supply Closet explains this. Starting a round with unused
  Credits and no purchases asks for confirmation before proceeding.
- The opening countdown has a visible `Start now` control limited to the timer area.
- Menu music resumes from its previous position; one-shot SFX are capped at five seconds, while Musak runs for its
  canonical power-up duration. Pressure music now fades in and remains active while the game is under pressure.
- Leaderboard, Debug, and Workshop buttons toggle their current modal. Guest boarding uses the short beep, with ordinary
  elevator-door sounds still silent except for Wide Doors.
- Gym Bros retain immunity to all stink effects, checkout suitcases have improved contrast, and timed power-up icons are
  rendered on the lift for the full active effect without free-floating rocket duplicates.
- Round 13 now uses the approved 25% spawn-pressure reduction while retaining the 20% gravity reduction.
- Campaign review text now derives the final authored round from canonical round data; “Finish Campaign” is reserved for
  the final authored round.

The remaining acceptance work is timing and feel: confirm exact power-up durations on device, verify pressure/music
continuity, reproduce Gym Bro boarding and top-floor rocket placement, and assess Round 13 difficulty and Round 14’s
intentional credit-saving strategy.

## Deferred decisions

- Guest transfers, multi-lift journeys, and G-hub routing.
- New gameplay mechanics, power-ups, hazards, themes, online services, or player-facing telemetry.
- Broad architectural rewrites beyond changes required by this slice.

See `TEST_PLAN.md` for the evidence matrix and `ROADMAP.md` for what follows this delivery slice.
