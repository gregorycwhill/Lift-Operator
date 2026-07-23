# Current Test Plan — Service Zoning and Playtest Evidence

**Status:** Active test plan for `DELIVERY_PLAN.md`
**Testing principles:** `TESTING_STRATEGY.md`
**Product scope:** `ROADMAP.md` and the product design documents

## Next-release gate — `0.3.0-network-campaign-preview`

The release is green only when the following evidence is complete:

- All existing validation and regression gates remain green.
- Service Zoning is tested through every production decision path and cannot be bypassed by manual or custom
  automation actions.
- R14–R20 initialize, reset, retry, simulate, render, and review deterministically at their target scales.
- Workshop, refusal explanations, large-fleet layouts, and responsive viewport checks pass.
- Zoning metrics and configuration are present in deterministic reports/replays.
- R9/R13 human playtest evidence is captured, with accepted issues explicitly recorded.
- The Endless Operations alpha produces only valid, reproducible, pre-checked operations and is clearly isolated from
  the normal campaign.
- A pushed release commit, generated artifacts, documentation snapshot, seed pack, and test report are available.

## Release baseline

The current baseline passed `npm.cmd test` on 23 July 2026: validation, economy, reports, unit, mechanics,
integration, and 91 Playwright tests. The long UNIT_01 test reaches the Round 13 playtest boundary; it is not a claim
that Round 13 completes the 20-round campaign.

Run before merging a material change:

```powershell
npm.cmd test
```

Use focused checks while developing:

```powershell
npm.cmd run test:syntax
npm.cmd run test:config
npm.cmd run test:smoke
npx.cmd playwright test tests/lifecycle-correctness.spec.js
npx.cmd playwright test tests/audio.spec.js
```

## Current evidence matrix

### A. Direct-service zoning correctness

- [ ] Unit-test range normalization, inclusive endpoints, G inclusion, invalid input, and overlap detection.
- [ ] Test the same `canLiftDirectlyServe` result through live boarding, simulation, built-in automation, custom
  automation, and manual targeting.
- [ ] Test that an uncovered direct route remains visible, is refused with a plain reason, and never creates a transfer.
- [ ] Test zoning alongside capacity, direction, VIP, Rooftop, Gym Bro, jam, stink, patience, Turbo, and Double-Decker.
- [ ] Test reset/retry/warp/import persistence and prevention of manual or automation bypass.

### B. Workshop and responsive UI

- [ ] Browser-test Workshop edits, coverage preview, invalid-range feedback, overlap warnings, and saved configuration.
- [ ] Render 20/25/30 floors with 5–10 lifts at desktop, tablet, mobile, and large-fleet horizontal-scroll layouts.
- [ ] Verify zone labels, selected shafts, sticky floor references, and refusal text remain readable without unbounded DOM
  growth.

### C. Simulation, telemetry, and tuning safeguards

- [ ] Record deterministic zone-refusal, uncovered-route, overlap-utilization, empty-travel, and restrictive-idle
  metrics in compact reports/replays.
- [ ] Verify zoning configuration is included in replay identity and does not break seeded reproducibility.
- [ ] Compare declared manual/hybrid, built-in-plus-loadout, and custom Workshop profiles before any R14–R20 traffic
  tuning.
- [ ] Change one canonical balance parameter family at a time; regenerate and validate generated balance artifacts.

### D. Human playtest acceptance

- [ ] R9 rooftop release: readable buildup, substantial but manageable return wave, no deadlock or invalid destination.
- [ ] R13: intended mechanics, deodoriser, and rockets are affordable; pressure is manageable; stink remains optional
  emergency discretion.
- [ ] R14: players can configure a workable first zoning scheme and explain a direct-service refusal.
- [ ] R15–R20: record at least one reproducible failure diagnosis per structural combination before tuning spawn rates.
- [ ] Record browser/device, seed, balance version, loadout, zone configuration, outcome, and player explanation.

### E. Audio follow-up on real devices

- [ ] Test first-gesture unlock, suspended/resumed context, and no-console-error fallback on an audio-capable Chromium
  device and Safari/iOS device.
- [ ] Verify independent music/SFX controls and no audible source overlap through victory, retry, teardown, and mobile
  modal flows.

### F. Endless Operations alpha

- [ ] Generator output is deterministic for seed, template, and balance version.
- [ ] Invalid, infeasible, or out-of-envelope operations are rejected before presentation.
- [ ] Generated operations retain an objective, intended bottleneck, difficulty envelope, and supported strategy
  profile.
- [ ] Generated operations replay identically and include their generation inputs in the report identity.
- [ ] At least one pre-checked generated challenge is playable through the debug/test entry point without affecting
  normal campaign progression.

## Completion record

### Automated implementation checkpoint — 23 July 2026

- Full `npm.cmd test` passed: 93 Playwright tests, including Service Zoning diagnostics and Endless alpha entry.
- Syntax, documentation, config, balance freshness, economy, balance-report, UTF-8, unit, mechanics, and integration
  gates passed.
- The new automated coverage proves deterministic zone reports, overlap/direct-route gaps, and a pre-checked seeded
  Endless operation can enter a playable round in Debug mode.
- Human/device items below remain open; this is a playtest handoff, not a release-promotion sign-off.

When a delivery slice completes, replace its checklist with a short dated completion note: commit, command results,
playtest evidence, accepted decisions, and remaining follow-up. Detailed historical checklists belong in Git history and
historical handoff documents, not this active plan.
