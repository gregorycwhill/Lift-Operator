# Current Playtest Release — Service Zoning Campaign Preview

**Status:** Active playtest release  
**Release target:** `0.3.0-network-campaign-preview`  
**Owner class:** Product and engineering  
**Last reviewed:** 25 July 2026  
**Scope boundary:** Promote the implemented R14–R20 direct-service zoning foundation into a diagnosable, playable,
and testable campaign slice. This plan does not add transfers, a G hub, new hazards, or new power-ups.

## Current state

**Implementation:** Delivered in playtest build `872b8f8` (25 July 2026).  
**Automated baseline:** The latest full gate passed with 96 Playwright tests; see `TEST_PLAN.md`.  
**Promotion status:** Not promoted. The remaining release work is structured human/device evidence, R14–R20 tuning
only where evidence supports it, and a release decision with a recorded test/device/seed pack.

## Next implementation slice — automation-native Service Zoning

**Status:** Planned implementation slice following the current zoning playtest feedback.<br>
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
