# Current Delivery Plan — Service Zoning Playtest Readiness

**Status:** Next release proposal  
**Release target:** `0.3.0-network-campaign-preview`  
**Owner class:** Product and engineering  
**Scope boundary:** Promote the implemented R14–R20 direct-service zoning foundation into a diagnosable, playable,
and testable campaign slice. This plan does not add transfers, a G hub, new hazards, or new power-ups.

**Implementation checkpoint:** The first vertical slice is implemented and is ready for structured playtesting. The
remaining release work is human/device evidence, R14–R20 balance tuning, and promotion of any accepted balance changes.

## Release outcome

Ship a credible second campaign arc: R14–R20 are structurally playable, Service Zoning is a real strategic tool,
players can understand and recover from coverage failures, and the team has enough telemetry and deterministic evidence
to tune the extended campaign without guessing. The release also includes a constrained Endless Operations alpha that
proves the generation/validation pipeline without making unbounded runtime generation a campaign dependency.

The release is ambitious because it closes the loop from product design through generated data, production behavior,
responsive UI, simulation evidence, deployment, and human playtest. It is bounded because transfers, a G hub, new
mechanics, and a fully open-ended generator remain outside the release gate.

## Development scope

### Must ship

- Complete the shared Service Zoning model: canonical range state, normalization, inclusive G handling, overlap and
  uncovered-route analysis, persistence, import validation, and one `canLiftDirectlyServe` decision path.
- Integrate the predicate across live boarding, simulation, built-in automation, custom automation, manual targeting,
  refusal messaging, and Review diagnostics.
- Finish Workshop configuration UX: range editing, coverage preview, warnings, readable in-play zone labels, and
  recovery guidance when a lift is unavailable or a route is uncovered.
- Complete 20/25/30-floor rendering and 5–10 lift presentation, including responsive desktop/tablet/mobile behavior,
  fleet scrolling, sticky floor references, bounded DOM updates, and clear shaft selection.
- Add deterministic zoning metrics and replay identity: refusals, uncovered routes, overlap utilization, empty travel,
  restrictive-zone idle time, zoning configuration, and failure classification.
- Validate and conservatively tune R14–R20 one parameter family at a time after structural evidence passes. Preserve
  viable manual/hybrid, built-in-plus-loadout, and custom Workshop strategies where practical.
- Close the known R9 rooftop and R13 affordability/manageability playtest gates, or record explicit owner decisions to
  defer them with evidence.
- Complete release documentation, generated-balance freshness, attribution/audio status, and a reproducible release
  command path.

### Ambitious alpha slice

- Build a constrained offline Endless Operations generator from approved templates and seeded parameters.
- Validate generated operations through simulation, feasibility thresholds, strategy profiles, and replay identity.
- Expose a small pre-checked challenge catalogue or debug-only Endless Operations entry point for playtesting.
- Do not expose arbitrary runtime generation to the normal campaign until generated fairness and failure diagnosis are
  demonstrated.

### Explicitly out of scope

- Guest transfers, multi-lift journeys, or G-hub routing.
- New gameplay mechanics, power-ups, hazards, guest types, themes, online services, or player-facing telemetry.
- Full procedural generation of unconstrained rounds in the live campaign.
- Broad module/ESM migration or a framework rewrite.

## Release workflow

1. Create a release branch from the tested baseline and keep scope changes documented here.
2. Implement in vertical slices: zoning core, Workshop/UI, diagnostics, R14–R20 tuning, then Endless alpha.
3. Keep canonical numerical changes in `design/game-balance.v1.json`; regenerate and validate artifacts in the same
   change.
4. Run the fast checks after each slice and the complete release gate before merge.
5. Push the release branch, review the diff and generated assets, merge/promote only after the release gate is green,
   and deploy the static GitHub Pages build.
6. Tag the release with the balance version, commit, test counts, supported browser/device matrix, and playtest seed
   pack.

## Playtest phases

- **Internal verification:** automated gates, seeded smoke sessions, responsive viewport checks, and audio-capable
  desktop/WebKit checks.
- **Structured team playtest:** R9, R13, R14, and one combination round from R15–R20 using declared seeds/loadouts;
  capture failure explanations and zoning configuration.
- **Broader playtest:** compare authored R1–R13 baseline, zoning introduction, late-round combinations, and Endless
  alpha challenges. No balance promotion occurs from anecdotal feedback alone; record the hypothesis and evidence.

## Current foundation

Players can configure direct lift service bands, understand coverage gaps and refusals, and play the structural
R14–R20 rounds without silent routing failures. Developers can reproduce a zoning failure from a seed, configuration,
and compact telemetry report before tuning traffic.

## Starting point

The current build already has R14–R20 factory definitions, 20/25/30-floor layouts, 5–10 lift rendering, inclusive
service ranges, live boarding enforcement, manual/automation target enforcement, and Workshop lower/upper controls.
This slice is about validation, observability, usability, and conservative tuning—not rebuilding that foundation.

## Workstreams

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

## Sequence

1. Establish production-path zoning tests and compact telemetry/replay fields.
2. Improve Workshop/refusal/Review explanations and verify responsive large-fleet layouts.
3. Run structural R14–R20 scenarios with fixed seeds and declared strategy profiles.
4. Conduct human playtests for R9, R13, and the zoning introduction/combination rounds.
5. Tune one parameter family at a time in canonical balance data only after the prior evidence is reviewed.

## Exit criteria

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

## Deferred decisions

- Guest transfers, multi-lift journeys, and G-hub routing.
- New gameplay mechanics, power-ups, hazards, themes, online services, or player-facing telemetry.
- Broad architectural rewrites beyond changes required by this slice.

See `TEST_PLAN.md` for the evidence matrix and `ROADMAP.md` for what follows this delivery slice.
