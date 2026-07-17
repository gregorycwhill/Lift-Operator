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

## Reporting format

Every authoritative run includes:

- Commit hash.
- Balance version.
- Browser/runtime.
- Seed set.
- Passed, failed, and skipped counts.
- Links or paths to telemetry artifacts.

The historical statement that the suite achieved 15/15 should not be used as a current quality gate; several of those checks require replacement under the new strategy.
