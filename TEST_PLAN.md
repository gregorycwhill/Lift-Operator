# Test Plan

This document is the execution checklist for the strategy in `TESTING_STRATEGY.md`.

## Milestone A — Stabilization safety net

- [x] Round evaluation occurs once.
- [ ] Review → shop/briefing → next round works.
- [x] Average wait uses spawn-to-destination delivery time for actually served guests.
- [x] Purchase checkout commits once.
- [x] Pause/resume preserves guest, lift, spawn, VIP, and sunset clocks.
- [x] Ordinary failure restores the previous-round point checkpoint.
- [x] Ordinary failure clears inventory and cart.
- [x] Ordinary failure preserves round and seed and returns to the shop.
- [x] Ordinary failure clears all runtime and achievement effects from the attempt.
- [ ] Successful retry awards one payout.
- [x] Round 12 death commits one Endurance payout and progresses to Round 13 through review.
- [ ] Reset clears runtime state and retains intended career state.

## Milestone B — Round factory

- [ ] Fresh state for every test.
- [ ] Normal start, warp, retry, and simulation produce equivalent structures.
- [ ] All supported rounds have explicit floor/lift/objective configuration.
- [ ] No supported round relies on fallback values.
- [ ] Environment and automation random streams are separate.

## Milestone C — Balance data

- [ ] Schema validates all 13 rounds.
- [ ] Power-up and achievement references resolve.
- [ ] Tier prices and duration rules validate.
- [ ] Generated config has a balance version.
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

- [ ] Golden seeds recorded.
- [ ] Same seed/config/strategy produces the same result.
- [ ] Intended specialist strategy beats a deliberately poor strategy.
- [ ] No `NaN`, deadlock, or impossible state.
- [ ] Quota rounds terminate correctly.
- [x] Endurance has no timer or quota and terminates only at zero lives.
- [x] Endurance score records survival time and guests served.
- [x] Accelerated Monkey Endurance reaches death and continues to Round 13.
- [ ] Economy paths remain viable for struggling, typical, and expert models.

## Milestone F — Automation containment and manifest resilience

- [ ] Infinite loop terminates safely.
- [ ] Accidental browser-global access cannot corrupt ordinary campaign state.
- [ ] Invalid actions are rejected.
- [ ] Imported blueprint identifies its origin and requires consent.
- [ ] Malformed or oversized payload fails gracefully.
- [x] Obfuscated Monkey capability can be accepted and launched through the intended Debug workflow.
- [ ] Main game remains responsive after script failure.

## Milestone G — Production packaging

- [ ] Test scripts absent from normal production page.
- [x] Local pinned dependencies used.
- [ ] Dedicated debug/test entry point.
- [ ] UTF-8 validation.
- [ ] CI command documented and running.

## Reporting format

Every authoritative run includes:

- Commit hash.
- Balance version.
- Browser/runtime.
- Seed set.
- Passed, failed, and skipped counts.
- Links or paths to telemetry artifacts.

The historical statement that the suite achieved 15/15 should not be used as a current quality gate; several of those checks require replacement under the new strategy.
