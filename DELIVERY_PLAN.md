# Major Release Candidate Delivery Plan

**Document role:** Current implementation and release scope only
**Status:** Active release-candidate hardening
**Release target:** `1.0` (no release tag has been created)
**Owner class:** Product and engineering
**Last reviewed:** 31 July 2026
**Implementation baseline:** `0822d81` on `master`

## Outcome

Prepare the complete 25-round desktop campaign for broader external feedback. The campaign, Service Zoning, permanent
Automation Dock, Settings, audio system, R21–R23 counterweight trilogy, and R24–R25 capsule-dispatch arc are implemented.
This slice is release hardening and evidence collection, not another feature expansion.

Product intent and future sequencing belong in `ROADMAP.md`. Durable mechanics belong in the design documents. Test
commands, evidence, and playtest acceptance belong in `TEST_PLAN.md`. Completed delivery history belongs in
`docs/archive/RELEASE_HISTORY.md` and Git history.

## Included product surface

- Twenty-five authored campaign rounds, including Service Zoning from R14, counterweights/Open Plan in R21–R23, and
  capsule dispatch in R24–R25.
- Permanent two-step Automation Dock with pinned carousel and built-in/custom/shared Library.
- Workshop-authored policies, including scalable Low/High and custom Service Zones.
- Persistent Credits, Supply Closet loadouts, tiered power-ups, Settings, achievements, Leaderboard, and audio controls.
- Desktop browser delivery through GitHub Pages from `master`.

## Remaining engineering work

These are genuine unresolved implementation or diagnosis items, not historical checklist residue.

1. **R22 manual-stop boarding:** reproduce the report deterministically and identify whether any remaining refusal is
   caused by parking arbitration, capacity, zoning, passenger state, or another rule. Stale asynchronous Sweep targets
   are already blocked; do not broaden boarding rules without a reproducible failing case.
2. **Authored event gating:** implement the confirmed persistence rule consistently. Once an event is introduced, it
   remains eligible in subsequent conventional rounds unless that round explicitly excludes it. Current runtime logic
   already persists jam, Stink, and Gym through thresholds, but VIP/Rooftop scheduling still depends on introduction or
   explicit inclusion flags. Canonical data needs explicit exclusions and one shared resolver for all event types.
3. **R24/R25 performance evidence:** profile a representative R25 run. Target 60fps on the reference desktop, accept no
   sustained rate below 45fps, and investigate repeated long tasks above 50ms. Optimize only measured hotspots.
4. **Release automation duration:** the long Auto-Pilot Alpha protocol takes approximately eight minutes and can make the
   aggregate local command exceed a ten-minute wrapper. Decide whether CI should retain the long gate, split it into a
   separate job, or use a shorter release smoke while keeping the long protocol scheduled.

## Release acceptance requiring human evidence

- R9 Rooftop Party buildup/release is legible and manageable.
- R13 remains challenging but practical after its spawn-rate adjustment and available loadouts.
- R14–R20 communicate their challenge clearly and support credible zoning/loadout strategies.
- R21–R23 teach counterweights, make Open Plan useful, and remain recoverable at scale.
- R24–R25 make automation materially useful, remain readable, and perform acceptably on target hardware.
- R19–R25 fit supported desktop viewports without board jitter, clipped controls, or unusable targets.
- Audio identity, duration, continuity, and first-gesture behavior are acceptable on desktop Chromium/WebKit and at
  least one Safari/iOS device.
- The Automation Dock is understandable without instruction for both single-lift and batch assignment.

The exact playtest matrix and evidence format are in `TEST_PLAN.md`.

## Explicitly outside this release

- Mobile edition implementation.
- Endless Operations implementation or procedural round generation.
- New guest types, hazards, power-ups, themes, online services, or player-facing telemetry.
- General multi-lift journeys or transfer hubs outside the implemented timed Open Plan behavior.
- Workshop event callbacks, persistent script memory, mandatory event-root blocks, or a visual Think block.

## Release sequence

1. Resolve or explicitly defer the four engineering items above with evidence.
2. Run the automated release gate and record commit, environment, and results in `TEST_PLAN.md`.
3. Run the structured broad-feedback playtest pack across early, zoning, counterweight, and capsule arcs.
4. Triage findings into release blockers, tuning candidates, and later-roadmap ideas.
5. Update player-facing release notes and documentation status.
6. Create the `1.0` release tag only after the release owner confirms the acceptance evidence.

## Exit criteria

- No open reproducible correctness defect can corrupt progression, routing, inventory, or saved automation.
- Remaining balance or usability concerns are documented with a seed, round, loadout, device, and disposition.
- Required automated gates pass, or any environmental limitation is isolated and recorded without being described as a
  product pass.
- `README.md`, `ROADMAP.md`, `DELIVERY_PLAN.md`, `TEST_PLAN.md`, and the design documents agree that R1–R25 are
  implemented and that Mobile/Endless remain future work.
- Broader feedback can be gathered without requiring testers to understand repository branches, debug variants, or
  obsolete interfaces.
