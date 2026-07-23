# Test Plan

This document is the execution checklist for the strategy in `TESTING_STRATEGY.md`.

## Milestone A — Stabilization safety net

- [x] Five-second countdown freezes guest spawning and the round timer while automation controls remain usable.
- [x] First automation availability receives a transient, acknowledgeable teaching cue extensible to custom and shared scripts.
- [x] Capacity appears transiently during countdown and when effective capacity changes.
- [x] Round review uses Credits terminology consistently.
- [x] Live delivered-guest wait time uses spawn-to-destination epoch/virtual time and does not clamp to zero.

- [x] Round evaluation occurs once.
- [x] Review → shop/briefing → next round works through the full Monkey campaign.
- [x] Average wait uses spawn-to-destination delivery time for actually served guests.
- [x] Purchase checkout commits once.
- [x] Pause/resume preserves guest, lift, spawn, VIP, and sunset clocks.
- [x] Ordinary failure restores the previous-round point checkpoint.
- [x] Ordinary failure clears inventory and cart.
- [x] Ordinary failure preserves round and seed and returns to the shop.
- [x] Ordinary failure clears all runtime and achievement effects from the attempt.
- [x] Ordinary failure shows a non-paying failed-attempt review before returning to the shop.
- [x] Failed Round 2 review and retry controls explicitly retain and display Round 2.
- [x] Successful review explicitly identifies the won round and newly unlocked round.
- [x] Round 1 review and Round 2 briefing omit Supply Closet and purchase language before the first shop unlock.
- [x] Successful retry/evaluation can commit only one payout.
- [x] Round 12 death commits one Endurance payout and progresses to Round 13 through review.
- [ ] Reset clears runtime state and retains intended career state.

## Milestone B — Round factory

- [x] Fresh attempt state is created through the shared round factory.
- [x] Normal start, warp, retry, and simulation produce equivalent structures.
- [x] All supported rounds have explicit floor/lift/objective configuration.
- [x] No supported round relies on fallback lift values.
- [x] Simulation runs in a disposable browser realm and cannot mutate the live Registry or PRNG state.
- [x] Environment and automation random streams are separate.

## Milestone C — Balance data

- [x] Schema validator covers all 13 rounds.
- [x] Power-up and achievement references resolve.
- [x] Tier prices and duration rules validate.
- [x] Canonical config has a balance version.
- [ ] Legacy duplicate parameters are rejected or removed.
- [ ] Production engine consumes generated values.

## Milestone D — Mechanic coverage

- [x] Patience and rage.
- [ ] VIP exclusivity and penalty.
- [x] Room Service weight and boarding.
- [ ] Gym Bro weight and stink threshold.
- [ ] Jam and Wrench.
- [ ] Stink, evacuation, and Freshener.
- [ ] Rooftop redirect and release.
- [x] Wide Doors.
- [x] Turbo.
- [ ] Musak.
- [x] TARDIS.
- [ ] Group Think.
- [x] Double-Decker.
- [x] Gravity.
- [ ] Open Plan remains experimental and is excluded from campaign gates.

## Milestone E — Deterministic campaign tests

Campaign balance acceptance follows `E2E_BALANCE_PLAN.md`: classify all rounds first, accept broad behavioural separation, and reserve fine tuning for human-identified outliers.

- [x] Representative golden seeds recorded.
- [x] Same seed/config/strategy produces the same result.
- [x] Canonical balance data matches the generated runtime artifact.
- [x] Patience thresholds invoke production status rules.
- [x] Boarding duration invokes production weight and Wide Doors rules.
- [x] Gravity invokes the production loaded-lift multiplier.
- [x] Onboarding Sweep strategy beats a deliberately idle policy on its named golden seed.
- [x] A manually selected stop overrides Sweep direction for all waiting guests, while unattended Sweep retains directional boarding.
- [ ] Unattended all-Sweep fails accepted seeds for every campaign round from Round 2 onward.
- [ ] Round 2 unattended Sweep fails late while the approved minimal-intervention policy survives.
- [ ] Each later intended strategy materially outperforms all-Sweep on its representative seeds.
- [x] Hands-Free rejects every built-in automation and accepts eligible player-authored custom automation only.
- [x] All-Sweep baseline report covers three fixed seeds across Rounds 2–13.
- [x] Simulator candidate overrides, loadouts, and intervention strategies run in an isolated realm without changing the live configuration.
- [x] Built-in-only balance comparators record zero manual decisions and cannot fall through into rescue-controller actions.
- [x] Campaign envelope classifies all rounds and marks an underperforming candidate comparator as Unproven rather than Overloaded.
- [x] Resource-supported campaign profiles combine auditable inventory use with bounded urgent-queue manual rescue.
- [x] Round 3 `1.00→1.20` candidate makes all-Sweep fail 3/3 fixed seeds while active Wide Doors comparators survive 3/3.
- [x] Coarse campaign balance makes Rounds 4–6 all-Sweep fail 3/3 while supported portfolio profiles survive 3/3.
- [x] Event/strategic portfolio compares multiple unlocked policies and condition-driven resource use without changing player-facing behavior.
- [ ] Human playtest confirms Round 3 remains readable and does not require an excessive Wide Doors purchase count.
- [x] Baseline report freshness is tied to canonical balance and matrix hashes.
- [x] Baseline policy records zero manual decisions.
- [x] Deterministic baseline returns finite state and the full Monkey campaign completes without deadlock.
- [x] Queue rendering remains bounded under a 250-guest backlog.
- [x] Queue is physically anchored at the right-hand lift edge with the oldest guest nearest the door.
- [x] Stable lift passenger DOM is not rebuilt across repeated animation frames.
- [x] Idle automation evaluation is bounded under repeated animation calls.
- [x] Round Review column labels precede their statistics.
- [x] Projected Survival Index combines observed and imminent weighted life loss.
- [x] VIP pressure uses the actual life penalty.
- [x] Little's Law inputs and residual are exported deterministically.
- [x] Design telemetry is absent from player UI and automation sensors.
- [ ] Quota rounds terminate correctly.
- [x] Endurance has no timer or quota and terminates only at zero lives.
- [x] Endurance score records survival time and guests served.
- [x] Endurance envelope keeps unattended all-Sweep below 4 minutes and supported play within 4–8 minutes across accepted seeds.
- [x] Accelerated Monkey Endurance reaches death and continues to Round 13.
- [x] Economy paths remain non-negative for struggling, typical, and expert models; accumulated-bank inflation remains a tuning finding.
- [x] Shop tiers and automation choices follow canonical progression unlocks.
- [x] Standard and Endurance payouts consume canonical parameters and Endurance respects its cap.

## Milestone F — Automation containment and manifest resilience

- [x] Loop constructs are rejected before interim main-thread execution.
- [x] Direct browser-global access constructs are rejected before execution.
- [x] Invalid automation targets are rejected.
- [ ] Imported blueprint identifies its origin and requires consent.
- [x] Malformed or oversized payload fails gracefully.
- [x] Obfuscated Monkey capability can be accepted and launched through the intended Debug workflow.
- [ ] Main game remains responsive after script failure.

## Milestone G — Production packaging

- [x] Test scripts absent from normal production page and loaded only after Debug opt-in.
- [x] Local pinned dependencies used.
- [x] Debug/test suite requires explicit manifest-gated Debug opt-in.
- [ ] UTF-8 validation.
- [x] CI workflow and reproducible npm commands added.

## Milestone H — Executable balance search and handoff completion

The exact architecture, thresholds, seed partitions, commands, reporting caps, sequence, and stopping rules are in `IMPLEMENTATION_HANDOFF.md`.

- [ ] Fast unit/mechanic/integration/smoke/full npm tiers exist.
- [ ] Integer-tick batch simulation matches the legacy isolated runner.
- [ ] Action replay reproduces terminal and metric hashes.
- [ ] Discovery, release, robustness, and golden seed sets are versioned separately.
- [ ] Candidate overlays cannot mutate canonical data or sequential worker state.
- [ ] Search uses hard feasibility gates and bounded stopping rules rather than an opaque fitness score.
- [ ] Compact summaries and capped anomalous replays replace raw per-run reasoning.
- [ ] Round-specific strong profiles exist for R2 and R7–11/13.
- [ ] R2 satisfies late unattended failure and low-intervention hybrid survival gates.
- [ ] R7–11/13 satisfy release and 30-seed robustness gates.
- [ ] Owner-confirmed economy affordability, reserve, inflation, and purchase-dominance gates pass.
- [ ] Full promotion command updates canonical data, generated artifact, reports, docs, and balance version atomically.

## Reporting format

Every authoritative run includes:

- Commit hash.
- Balance version.
- Browser/runtime.
- Seed set.
- Passed, failed, and skipped counts.
- Links or paths to telemetry artifacts.

The historical statement that the suite achieved 15/15 should not be used as a current quality gate; several of those checks require replacement under the new strategy.

## Milestone I - Audio system (partially implemented)

The audio boundary, local asset register, attribution records, browser service, gameplay producers, controls, and
focused Chromium coverage are implemented. The remaining acceptance boundary is in `IMPLEMENTATION_HANDOFF.md`
Sections 15.5–15.6.

- [x] Unit-test AudioEventBus routing, bounded fallback playback, no-op simulation adapter, and mute/volume persistence without a real audio device.
- [x] Register and locally resolve every reviewed source row; record licence/source/attribution evidence in the manifest and credits.
- [x] Browser-test Leaderboard mute/music/SFX controls and the simulation-invariance contract for the semantic event catalogue.
- [x] Exercise production spawner, hazard, shop, lifecycle, PSI hysteresis, and audio teardown transitions.
- [x] Exercise deterministic failed-fetch/invalid-decode fallback and basic mute/context source cleanup.
- [x] Desktop playtest gate: Chromium and WebKit audio suites pass with production mappings, lifecycle cleanup,
  modal context switching, reset/retry cleanup, and identity-aware guest throttling.
- [x] Test gameplay, menu, resume, victory, retry, and teardown transitions; no music layer or effect may leak across reset or round change in the focused browser contract.
- [x] Test one stable event mapping for every power-up and hazard, plus core lift/guest lifecycle effects, against the production manifest.
- [x] Test PSI-to-music mapping with hysteresis and prove it cannot alter engine state through the simulation-invariance contract.
- [x] Test leaderboard modal pause/open/close context switching without retaining gameplay music sources.
- [ ] Complete source-overlap acceptance across victory, retry, teardown, and other modal transitions.
- [ ] Browser-test first-gesture unlock, suspended/resumed contexts, mute and independent music/SFX sliders, and graceful failed-asset handling on mobile-sized/real-device targets. Desktop Chromium and WebKit coverage passes.
- [ ] Validate decoded audio content on a real audio-capable browser/device, not only HTTP availability, and verify no-audio operation without console-error loops.

## Milestone J - Planned R14-R20 and Service Zoning

Implementation addendum: the structural/runtime baseline is implemented. The checklist below now tracks remaining
diagnostic, cross-device, and playtest gates rather than the initial implementation work.

The original design-only status is superseded by the implementation addendum above. The complete delivery boundary is in
`IMPLEMENTATION_HANDOFF.md` Section 16 and the round intent is in `Game Play Map.md`.

- [ ] Render structural layouts for 20, 25, and 30 floors with 5–10 lifts; verify desktop, tablet, mobile, horizontal
  fleet scrolling, sticky floor labels, shaft selection, and bounded DOM updates.
- [ ] Validate canonical R14–R20 definitions, round factory initialization, reset/retry, seeded determinism, and Review
  behavior before adding tuned traffic.
- [ ] Unit-test zone normalization, inclusive bounds, G inclusion, invalid ranges, overlap detection, and direct-route
  coverage analysis.
- [ ] Test `canLiftDirectlyServe` through live boarding, simulation, built-in automation, custom automation, refusal
  messaging, and Review diagnostics.
- [ ] Verify guests never transfer in this release, cannot board a lift outside its zone, and remain visible with a
  plain explanation when no direct lift is available.
- [ ] Verify capacity, direction, VIP, Rooftop Party, Gym Bro, jam, stink, patience, Turbo, and Double-Decker rules
  remain authoritative after zoning is enabled.
- [ ] Test Workshop range edits, preview/warnings, invalid imports, persistence scope, and prevention of manual or
  automation bypass.
- [ ] Add simulation metrics for zone refusals, uncovered routes, overlap utilization, empty travel, and restrictive-zone
  idle time; test compact reports and replay determinism.
- [ ] Validate R14–R20 structural combo coverage: VIP/Rooftop, jam/stink recovery, Checkout/special floors, Gym Bros,
  and large-fleet Workshop advantage.
- [ ] Tune spawn rates only after all structural, routing, rendering, and simulation checks pass.

Implementation status: the structural and direct-service baseline is now implemented and covered by the syntax,
config, generated-balance, unit, and targeted lifecycle checks. The remaining unchecked items are intentionally
playtest/diagnostic work, especially coverage telemetry, overlap analysis, and full Safari/mobile visual validation.

## Milestone K - Playtest remediation: Debug, checkout, icons, rockets, rooftop, and Round 13

Plan authority: `IMPLEMENTATION_HANDOFF.md` Section 17. These checks are pending implementation and must run against
the production path as well as isolated deterministic simulation where noted.

- [x] Debug Warp derives its choices from all available round definitions and can launch every available round without
  altering normal unlock/progression state.
- [x] Checkout Challenge renders a suitcase icon only for checkout guests whose destination is floor G; other checkout
  destinations and ordinary guests retain their existing markers.
- [x] Room Service icons render at 70% of the previous horizontal width, retain their height, and do not overlap or
  obscure adjacent UI at supported viewport sizes.
- [x] Rocket/Turbo duration is 10.0 seconds within documented tolerance in Round 7 and Round 13, including empty/
  occupied lifts, top-floor use, pause/resume, retry, reset, one-time expiry, and icon cleanup.
- [x] Seeded rooftop schedules vary start time across seeds, replay identically for the same seed, remain active for a
  long window (target: at least half the round), and release a substantial valid return wave from floor 14.
- [ ] Rooftop release does not deadlock, create invalid destinations, or make the return demand unreadable in browser
  playtest.
- [ ] Round 13 candidate increases the preceding Endurance payout enough to afford the intended required mechanics,
  deodoriser, and rockets, with struggling/typical/expert economy scenarios recorded.
- [x] Round 13 canonical spawn-rate inputs are reduced by exactly 20%; generated/runtime parity passes and unrelated
  rounds remain unchanged.
- [ ] Round 13 release and robustness seeds pass supported-play feasibility gates while unattended Sweep remains within
  the approved difficulty boundary.
- [x] Controlled stink-use testing confirms stink can relieve overloaded lifts, preserves valid state, and does not
  bypass the round objective.
- [ ] Full regression panel passes syntax, config, balance/economy, lifecycle, mechanics, deterministic E2E, and UI
  smoke tests.
- [ ] Human playtest confirms the rooftop event is the round's defining pressure shift, Round 13 is affordable and
  manageable, and stink provides meaningful discretion rather than a mandatory solution.

Evidence must include commit, balance version, seeds, loadout, economy totals, effect timings, rooftop schedule and
release metrics, spawn-rate values, stink uses, and passed/failed/skipped counts. Automated evidence is recorded in
the implementation handoff; browser playtest gates for rooftop readability and Round 13 affordability remain open.
