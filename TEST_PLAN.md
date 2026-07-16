# Test Plan

This document is the execution checklist for the strategy in `TESTING_STRATEGY.md`.

## Milestone A — Stabilization safety net

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
- [ ] Power-up and achievement references resolve.
- [ ] Tier prices and duration rules validate.
- [x] Canonical config has a balance version.
- [ ] Legacy duplicate parameters are rejected or removed.
- [ ] Production engine consumes generated values.

## Milestone D — Mechanic coverage

- [ ] Patience and rage.
- [ ] VIP exclusivity and penalty.
- [ ] Room Service weight and boarding.
- [ ] Gym Bro weight and stink threshold.
- [ ] Jam and Wrench.
- [ ] Stink, evacuation, and Freshener.
- [ ] Rooftop redirect and release.
- [ ] Wide Doors.
- [ ] Turbo.
- [ ] Musak.
- [ ] TARDIS.
- [ ] Group Think.
- [ ] Double-Decker.
- [ ] Gravity.
- [ ] Open Plan remains experimental and is excluded from campaign gates.

## Milestone E — Deterministic campaign tests

- [x] Representative golden seeds recorded.
- [x] Same seed/config/strategy produces the same result.
- [x] Canonical balance data matches the generated runtime artifact.
- [x] Patience thresholds invoke production status rules.
- [x] Boarding duration invokes production weight and Wide Doors rules.
- [x] Gravity invokes the production loaded-lift multiplier.
- [x] Onboarding Sweep strategy beats a deliberately idle policy on its named golden seed.
- [x] Deterministic baseline returns finite state and the full Monkey campaign completes without deadlock.
- [x] Queue rendering remains bounded under a 250-guest backlog.
- [x] Queue is physically anchored at the right-hand lift edge with the oldest guest nearest the door.
- [x] Stable lift passenger DOM is not rebuilt across repeated animation frames.
- [x] Idle automation evaluation is bounded under repeated animation calls.
- [x] Round Review column labels precede their statistics.
- [ ] Quota rounds terminate correctly.
- [x] Endurance has no timer or quota and terminates only at zero lives.
- [x] Endurance score records survival time and guests served.
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

## Reporting format

Every authoritative run includes:

- Commit hash.
- Balance version.
- Browser/runtime.
- Seed set.
- Passed, failed, and skipped counts.
- Links or paths to telemetry artifacts.

The historical statement that the suite achieved 15/15 should not be used as a current quality gate; several of those checks require replacement under the new strategy.
