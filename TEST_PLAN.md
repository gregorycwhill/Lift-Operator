# Major Release Candidate Test Plan

**Document role:** Current release evidence, acceptance gates, and playtest protocol only
**Status:** Active acceptance plan for the 25-round major release candidate
**Owner class:** Engineering and playtest
**Last reviewed:** 1 August 2026
**Testing principles:** `TESTING_STRATEGY.md`
**Delivery scope:** `DELIVERY_PLAN.md`

## Current evidence

The active remediation working tree is based on `3dbfc5d` on `master`; a release-candidate commit is not yet cut.

Recent focused evidence:

- JavaScript syntax: 65 files passed.
- Documentation: 23 Markdown files passed after the documentation refactor.
- UTF-8: 102 first-party text files passed; unit gate passed.
- Mechanics suite: 18/18 passed, including VIP priority boarding and Gym Bro stink boarding.
- Audio suite: 23/23 passed; `guest_refused` is telemetry-only and has no sound asset or fallback.
- Integration suite: 3/3 passed.
- Capsule rendering regression passed: capsule cars have no cable pseudo-element and tube separators use the intended
  dark 4px treatment; the capsule-specific cable pseudo-element is disabled.
- Current 13-item remediation coverage includes Turbo floor snapping, capsule centering, synthetic-fart asset mapping,
  Gym Bro stink boarding, wall-clock power-up expiry, R14+ credit uplift, Room Service/Checkout exclusion, challenge
  briefings, countdown policy, counterweight command arbitration, zoning visuals, and R24/R25 performance smoke.
- Protocol Alpha/Beta/Gamma passed: Alpha reached the Round-13 playtest boundary in 7.1 minutes; Beta verified the kill
  switch and Gamma verified death/rebirth.
- The all-Sweep negative-control rescue tuning is recorded in canonical data: R3, R5, and R9 received small spawn-end
  increases after the Turbo floor-snap fix caused one seed each to survive unattended Sweep.
- The 25-round balance acceptance harness, canonical economy projection, event-persistence resolver, production-faithful
  simulator routing, and representative reproducibility command are now implemented. All-Sweep is the hard simulator
  gate; intended-strategy profiles are diagnostic evidence pending human round-level difficulty reports.
- The acceptance harness now records a versioned intended profile ID and diagnostic trace for every intended seed. The
  current report confirms all-Sweep survives all five fixed R2 seeds after the further reduction; intended results
  remain diagnostic only and are not a
  release gate. The checked-in full report is the authoritative per-seed result. Simulation runs no
  longer yield to browser timers, and a regression test proves that an R6 acceptance run is invariant alone and after
  R2–R5. R2 is explicitly deferred by the current
  remediation instruction; R3–R6 remain the next staged recovery slice, while later-family failures require custom
  event/mechanic criteria before they are treated as balance tuning failures.

Completed historical gates and implementation checkpoints are summarized in `docs/archive/RELEASE_HISTORY.md`. Detailed
test evolution remains in Git history rather than this active plan.

## Automated release gate

Run from PowerShell on the release-candidate commit:

```powershell
npm.cmd run test:syntax
npm.cmd run docs:check
npm.cmd run test:config
npm.cmd run balance:check
npm.cmd run test:economy
  npm.cmd run balance:check
npm.cmd run test:utf8
npm.cmd run test:unit
npm.cmd run test:mechanics
npm.cmd run test:integration
npx.cmd playwright test tests/audio.spec.js --workers=1
npx.cmd playwright test tests/lifecycle-correctness.spec.js --workers=1
npm.cmd run test:e2e
```

Record the commit, Node/browser versions, operating system, pass counts, duration, and any failure artifact. The
aggregate `npm.cmd test` may also be used when the runner allows more than ten minutes.

## RC hardening cycle checks

Run targeted checks for each 4–12 item playtest batch: syntax, config when canonical data changes, docs, and the
smallest relevant browser test. Do not run long end-to-end or simulator protocols for ordinary polish fixes. Run the
full release gate only at H4, or when a fix changes shared simulation, balance, lifecycle, or capsule-performance code.

- [x] H0 traffic invariants: Checkout remains probabilistic; Rooftop redirects only its canonical share; normal and
  max-delay fallback spawning use the same standard-guest decision path.
- [ ] H1 R9–R15 human evidence: no progression blocker; zoning and named challenges are understandable.
- [ ] H2 R15–R20 human evidence: no large-fleet clipping, event/briefing mismatch, or reset leakage.
- [ ] H3 R20–R25 human evidence: counterweight/Open Plan correctness and capsule responsiveness on target hardware.
- [ ] H4 candidate gate: full release command, licence/attribution package, and triaged remaining-issue list.

`test:e2e` is a long Auto-Pilot protocol. On the current local wrapper it exceeded ten minutes without emitting a test
result; run it in an environment with a longer job allowance before release promotion.

## Full-campaign balance and economy acceptance

**Current decision point:** the further 25% R2 spawn-rate reduction (43.75% total from the original values) unblocks
playtesting, but all-Sweep now survives all five fixed R2 seeds. Product must choose a different R2 intervention or
make R2 an explicit onboarding exception; do not silently alter the fixed seeds, accept a failed gate, or counter-tune
arrival pressure.

The existing R2–R13 reports are historical diagnostic evidence only. They are not a 1.0 balance pass.

- [x] Add versioned, non-runtime balance-acceptance data for R2–R25: fixed gate seeds, all-Sweep setup, intended
  strategy profile, and round-specific thresholds.
- [x] All-Sweep assigns Sweep to every available lift and uses no manual targets, policy changes, custom automation, or
  power-ups. It must fail every gate seed in R2–R25.
- [x] R12 all-Sweep loses its twentieth life before 240 seconds. Competent-play duration remains a human-playtest
  calibration question rather than a simulator release threshold.
- [x] Intended profiles record fixed-seed outcomes and causal traces. Their survival rates are diagnostic only; round
  difficulty and arrival-rate calibration will use experienced playtester reports.
- [x] Replace the generic positive comparator with versioned intended profiles for the seven campaign families:
  hybrid rescue (R2–R3), triage/redundancy (R4–R6), events (R7–R9), advanced control (R10–R13), zoned fleet
  (R14–R20), counterweights/Open Plan (R21–R23), and capsule dispatch (R24–R25).
- [x] Every failed intended run records compact causal evidence: automation changes, manual command acceptance/rejection,
  boarding/refusal, power-up and event lifecycle, classified guest/VIP life-loss cause, and any zoning/counterweight
  constraint.
- [x] Establish a staged recovery order and record a before/after report and trace for every canonical parameter change.
  R2 is intentionally deferred for the current phase; R3–R6 are the active early-round slice before later-family
  recovery.
- [ ] For every balance-accepted round, confirm via browser/playtest evidence that the simulated profile corresponds to
  legible player actions; a simulator success alone is insufficient promotion evidence.
- [x] The balance release command fails when all-Sweep does not fail every required round. Evidence-integrity checks continue to
  validate report hashes, schema, and provenance separately.
- [x] Matrix and profiles cover R14–R20 zoning/events, R21–R23 counterweights/Open Plan, and R24–R25 capsules.
- [x] Simulated commands use production target routing, including counterweight partner consequences.
- [x] Reproducibility samples R2, R12, R14, R17, R21, R23, R24, and R25.
- [x] Replace the 13-round fixed-payout economy calculator with a 25-round current-price projection using canonical
  payout, unlock, retry, and consumable rules. Achievements are deferred from RC1.0 and cannot add Credits.
- [ ] Record affordability, savings, and dominant-purchase share for struggling, typical,
  and expert profiles. Current prices remain unchanged for 1.0; inflation is measured and documented.

### Round-by-round custom acceptance criteria

Persistent event coverage must include traffic-mix checks: an eligible Checkout round retains ordinary non-G
destinations at the canonical probability, and an active Rooftop event redirects only its configured share. A named
event must never silently replace every standard guest journey unless its authored round definition says so.

The generic survival comparator is not sufficient for every round. This matrix records where authored mechanics need
additional evidence. A custom criterion supplements the all-Sweep gate; it never relaxes that gate or changes the fixed
seed set.

| Rounds | Profile / mechanic | Additional acceptance evidence required | Current status |
| --- | --- | --- | --- |
| R1 | Onboarding | Briefing, first gesture, warning gating, and audio start; no campaign balance gate. | Human evidence |
| R2 | Hybrid rescue | Late-failure shape, one-lift recovery, bounded manual intervention, and deferral disposition. | Deferred; 5/5 all-Sweep survivors |
| R3 | Hybrid rescue / two lifts | Split lift roles, Room Service explanation, and credible recovery with declared loadout. | Meets threshold |
| R4 | Triage / redundancy | Two-lift coverage and target acceptance under rising demand. | Meets threshold |
| R5 | Triage / redundancy | Three-lift allocation and capacity/load distribution, not just survival. | Meets threshold |
| R6 | Triage / jam recovery | Fifteen-floor routing, jam recovery, stink interaction, and manual rescue trace. | Meets threshold |
| R7 | Checkout | Ground-floor suitcase semantics, checkout routing, and no false guest-type mixing. | Meets threshold |
| R8 | VIP | VIP priority/queue rules, three-leg tour timing, and unsuitable/occupied-lift refusal. | Meets threshold |
| R9 | Rooftop / stink | Party lifecycle, pressure duration, rooftop-only effects, and stink mitigation. | Meets threshold |
| R10 | Advanced control | Custom automation usefulness, inherited event eligibility, power-up lifecycle, and refusal attribution. | Event-aware profile implemented; below threshold |
| R11 | Advanced control / weight | Weight-aware lift selection, capacity/load trace, and inherited-event interaction. | Event-aware profile implemented; below threshold |
| R12 | Endurance | All-Sweep loses its twentieth life before 240 seconds; intended strategy survives 240–480 seconds; event pressure reported separately. | Event-aware profile implemented; 0/5 |
| R13 | Pedal / gravity | Gravity, pedal availability, spawn pressure, power-up affordability, and practical manual override. | Event-aware profile implemented; below threshold |
| R14 | Service Zoning | Zoning unlock/briefing, overlapping G coverage, zone return after override, and affordability. | Zoned profile implemented; 0/5 |
| R15 | Zoning / VIP / Rooftop | Zoning plus persistent VIP/Rooftop pressure, party release, priority, and whole-building routing. | Zoned profile implemented; 0/5 |
| R16 | Zoning / jam / stink | Jam recovery, stink eligibility, Freshener use, and zone continuity. | Zoned profile implemented; 0/5 |
| R17 | Zoning / Checkout | Authored Checkout remains identifiable while inherited events persist; suitcase and G-demand routing. | Zoned profile implemented; 0/5 |
| R18 | Zoning / multi-event | VIP, Rooftop, Stink, Gym, zoning, and six-lift coordination; gym-bro immunity observable. | Zoned profile implemented; 0/5 |
| R19 | Zoning / scale | Eight lifts, thirty floors, viewport fit, cable alignment, capacity labels, and event pressure. | Zoned profile implemented; 0/5 |
| R20 | Zoning / campaign cap | Ten lifts, thirty floors, no clipping/overlap, and correct final-authored-round messaging. | Zoned profile implemented; 0/5 |
| R21 | Counterweight intro | Adjacent pairing, odd-floor geometry, partner boarding behavior, and briefing clarity. | Pair-aware profile implemented; below threshold |
| R22 | Counterweight / Open Plan | Open Plan timing, manual-stop boarding, paired movement, and refusal-cause trace. | Pair-aware profile implemented; below threshold; deterministic manual-stop regression passes |
| R23 | Counterweight / zoning / Open Plan | Eight-lift paired network, zoning recovery, pair invariants, and capacity/stink rules. | Pair-aware profile implemented; 0/5 |
| R24 | Capsule dispatch | Single-person capacity, six-second jam retention, demand currents, tube rendering, and automation-first dispatch. | Meets threshold; browser performance open |
| R25 | Capsule dispatch scale | Twenty capsules, thirty floors, demand currents, throughput, no overflow, and 45fps floor. | Meets threshold; browser performance open |

Later intended failures are therefore not yet evidence for changing spawn rates or capacities. First-pass event-aware,
zoned, and pair-aware profiles now exist, but their traces show unresolved VIP and Rooftop pressure rather than a clean
capacity fault. Improve and validate those policies before canonical balance parameters are changed.

## Open engineering acceptance

### R22 manual-stop boarding

- [x] Reproduced the reported interaction with explicit R22 pair state: a Sweep lift manually stopped at Floor 5
  boards a compatible Floor-5 guest, mirrors its partner target, and retains the override until the stop completes.
- [x] Regression coverage proves the outcome before Sweep resumes. The original report is therefore not a general
  manual-direction defect; any new reproduction must capture its exact queue, capacity, zoning, stink, VIP, and
  parked-lift state before changing boarding arbitration.

### Canonical event gating

- [x] Product rule confirmed: after introduction, VIP, Rooftop, Stink, Gym, jam, and Checkout remain eligible in
  subsequent conventional rounds unless a round explicitly excludes them.
- [x] Canonical data records explicit exclusions and runtime event activation uses one shared persistence resolver.
- [x] R17 retains Checkout as its primary authored challenge while inherited events continue unless explicitly excluded.
- [x] Fixed-seed tests cover every event introduction, absence, and intended combination.

### Capsule performance

- [x] Capture deterministic R24/R25 acceptance traces with representative queues, automations, jams, and active
  effects. R25 meets the simulator threshold at 4/5 fixed seeds.
- [x] Run `npm.cmd run perf:capsule` and record [the headless R24/R25 tick-cost/DOM/overflow smoke report](reports/capsule-performance-smoke.json).
  The current reference run has no horizontal overflow and a 0.2ms p95 tick for both capsule rounds.
  This is a regression signal, not hardware frame-rate certification.
- [x] Record deterministic frame intervals, tick cost, DOM count, and horizontal overflow for R24/R25 headless pressure.
- [ ] Record frame intervals, long tasks, DOM count, and layout/paint hotspots on the supported reference device.
- [ ] R25 targets 60fps, remains at or above 45fps under representative pressure, and avoids sustained tasks above 50ms.
- [ ] Twenty capsules and thirty floors remain fully operable without horizontal scrolling or Dock overlap on the
  reference desktop viewport.

### Canonical data, content, and tooling hygiene

- [x] Move remaining active mechanic parameters out of compatibility/debug aliases and into canonical data, or remove
  the unused aliases.
- [ ] Debug controls either alter a documented temporary round overlay or are removed; no visible control may silently
  fail to affect the round definition.
- [x] Validate event exclusions, counterweight odd-floor geometry, capsule constraints, unlock availability, and
  required mechanic support.
- [x] Reconcile all R1–R25 Gameplay Map rows, canonical data, and briefings. The audited late briefings now identify
  R15 VIP/Rooftop pressure, R17 Checkout demand, R20's post-conventional role, counterweight/capsule arcs, and the
  current R24/R25 scale; R20 does not claim to be the final authored round.
- [x] Repair, complete, relabel, or retire the broken completion audit, hash-only replay, placeholder robustness command,
  and misleading simulation-batch default.
- [x] Retire the stale `balance:report:check` from the active verification surface. It is retained as the explicitly
  historical `balance:legacy:report:check`; `test:full` no longer treats an archived R2â€“R13 baseline as a current
  canonical gate. `balance:acceptance:integrity` verifies the committed report's schema, provenance, seeds, and traces;
  `balance:acceptance:check` remains the active full-campaign release gate and rejects unmet thresholds.

### Long-running release automation

- [x] Protocols Alpha, Beta, and Gamma pass on the release-candidate working tree (1 August 2026). Alpha reached the
  current Round-13 playtest boundary in approximately eight minutes; Beta verified the kill switch and Gamma verified
  the death/rebirth cycle.
- [ ] CI gives Protocol Alpha enough time, or runs it as an isolated/scheduled job with a shorter blocking smoke gate.
- [ ] Documentation reports timeouts as environmental limitations, not successful test results.

### Acceptance run-order reproducibility

- [x] Fixed a simulation run-order leak caused by yielding to browser timers inside the virtual loop. Each iframe also
  has a unique realm identity and pins `Date.now()` to virtual time. Regression coverage proves the R6 seed/profile
  result is unchanged alone and after R2–R5; the representative reproducibility suite passes.

## Structured broad-feedback playtest

For every session record: commit, balance version, browser/device, round, seed, starting Credits, purchases, automation
layout, result, observed failure cause, and the tester's own explanation.

| Arc | Minimum sample | Questions |
| --- | --- | --- |
| Onboarding | R1–R3 | Are controls, Room Service, Credits, countdown, and first automation legible? |
| Core events | R7, R9, R11, R13 | Are Checkout, Rooftop, Gym Bros, stink, gravity, and resource pressure understandable and fair? |
| Zoning network | R14, R17, R19, R20 | Can players choose a loadout, deploy zones, diagnose refusals, and keep the fleet visible? |
| Counterweights | R21–R23 | Can players explain paired movement, recover with Open Plan, and scale to the network round? |
| Capsule dispatch | R24–R25 | Does automation outperform frantic manual play; are demand currents, jams, tubes, and controllers readable? |

Cross-cutting observations:

- [ ] Automation Dock: policy-first, lift-first batch, disarm, Library toggle, pin persistence, keyboard, and touch.
- [ ] Audio: first gesture, menu resume, pressure fade, Rooftop lifecycle, Musak duration, one-shot SFX caps, mute, and
  independent volume controls.
- [ ] Visual stability: top-floor icons, tube/cable treatment, capacity labels, suitcase contrast, rooftop decoration,
  board jitter, and supported viewport fit.
- [ ] Economy: carried Credits are understood; no-spend confirmation appears only when a shop is available; loadouts
  create choices rather than mandatory purchases.
- [x] Progression: briefing text matches actual events and “Finish Campaign” appears only after R25.

## Promotion rule

Promote only when:

- automated engineering gates are green or explicitly dispositioned;
- full-campaign balance and economy acceptance are satisfied, or any exception is explicitly approved as a release risk;
- no reproducible progression, save, routing, or inventory corruption remains;
- broad feedback covers all five arcs above;
- balance changes are made through canonical data, one parameter family at a time, with generated artifacts refreshed;
- unresolved feedback is classified as blocker, accepted limitation, tuning candidate, or later-roadmap work.

Unchecked human items do not mean the feature is unimplemented. They mean release acceptance evidence has not yet been
recorded.
