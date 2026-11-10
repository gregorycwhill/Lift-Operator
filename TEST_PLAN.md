# Marie's Birthday Edition Test Plan

**Document role:** Current automated and human acceptance authority  
**Status:** Automated acceptance passed; focused human acceptance pending  
**Owner class:** Engineering and playtest  
**Last reviewed:** 8 November 2026  
**Delivery scope:** `DELIVERY_PLAN.md`  
**Test principles:** `TESTING_STRATEGY.md`  
**Baseline:** `master` at `2e082dd`

## Required commands

Focused commands may be used during implementation, but completion requires:

```powershell
npm.cmd run test:release
npm.cmd run balance:acceptance
npm.cmd run package:itch
```

The balance report remains diagnostic unless a deterministic correctness invariant below fails. Record the exact commit,
build version, balance version, commands, and results in `docs/archive/RELEASE_HISTORY.md` when the release closes.

## Current automated evidence — 8 November 2026

- `npm.cmd run test:release` — pass: 183/183 full browser tests, 27/27 focused mechanics tests, 3/3 containment
  integration tests, plus syntax, documentation, configuration, generated-balance, economy, UTF-8, and unit checks.
- `npm.cmd run balance:acceptance` — completed for R2–R25 using five fixed seeds per strategy.
- `npm.cmd run balance:acceptance:integrity` — pass: JSON and Markdown evidence match canonical balance and acceptance
  inputs, contain all 24 tested rounds, and agree on every per-round classification.
- Birthday-release focused thresholds — R2 is expected to permit unattended Sweep completion. R21–R23 continue to fail
  unattended all-Sweep on every seed while intended play succeeds on at least 4/5.
- `npm.cmd run package:itch` — pass: candidate ZIP produced. Repeat after the release commit so its filename and
  `BUILD.txt` identify the final source exactly.

This evidence does not substitute for the focused human acceptance below. Do not mark the release published until the
package smoke and supported-browser checks are recorded.

## P0 automated acceptance

### Removal and defaults

1. Every configured R2+ lift begins in Sweep unless a test deliberately changes it.
2. R2 has no Sweep-deployment requirement; manual targeting overrides and then returns control to Sweep.
3. Rooftop events never start a dedicated music source. Notices, release, and ordinary effects still work.
4. Production data, runtime state, shop, briefing chips, simulation profiles, and UI expose neither Counterweights nor
   Open Plan.
5. A saved Open Plan purchase is refunded or converted without losing Credits; incompatible active late-round state is
   not resumed inside the removed mechanic.

### Independent zoning

1. Changing All/Low/High/Custom coverage does not change the lift's routing automation.
2. Low/High bounds scale with floor count and Ground remains shared.
3. Sweep selects only valid pickup/drop-off reasons inside its zone, except that already-boarded passengers and a manual
   out-of-zone command complete safely.
4. R10 exposes zoning; R1-R9 do not expose it outside Debug.
5. Coverage diagnostics update after every zone or pet-filter change.

### Checkout waves

1. Checkout guests spawn only inside configured deterministic wave windows for R7, R10, R18, and R20.
2. No other authored round produces Checkout guests.
3. Room Service, Gym Bros, VIPs, and pet owners are never Checkout guests.
4. Seed plus balance version reproduces wave timing and guest classification.

### Pets

1. R1-R4 generate no pets; enabled R5+ rounds generate deterministic cats/dogs at their configured rate.
2. A pet owner is a normal-capacity guest and is mutually exclusive with VIP, Checkout, Room Service, and Gym Bro.
3. All/Cats/Dogs/No Pets filters accept and reject exactly the documented classes without changing automation.
4. A cat/dog mix starts one five-second warning. Pet Snacks cancels it; unresolved conflict clears the lift at its next
   service stop, requeues every passenger, retains spawn time/final destination, and makes both pet owners Critical.
5. Pet Snacks suppresses conflict but not Stink. Air Freshener suppresses Stink but not conflict.
6. Four pets do not create threshold Stink; five do; only one alert is emitted per congregation episode; the condition
   ends below five or while Freshener protection is active.
7. Pet owners can board a stinky lift and do not receive onboard Stink patience acceleration.
8. Pet Snacks expiry with an incompatible pair aboard begins a normal warning rather than immediately ejecting them.
9. Cat/dog faces render as overlay badges in queues and cabins; the destination remains a separate centred label and
   the guest token retains its ordinary width.

### One-transfer journeys

1. Direct service is always preferred when available.
2. With no direct lift, a deterministic valid interchange creates exactly two legs.
3. Transfer alighting requeues the same guest state with final destination intact and no spawn-time reset.
4. A guest never transfers more than once, returns to a visited floor, or selects its current floor as final delivery.
5. Pet-filter compatibility is checked for both legs. A pet owner is never sent into a connection it cannot board under
   the current configuration.
6. Waiting connection routes recalculate after zone/filter changes; uncovered guests remain visible and age normally.
7. Delivery scoring and average wait occur only at the final destination, not at the interchange.

### Regression

- Existing capacity, VIP, Room Service, Gym Bro, Stink, Jam, Rooftop, Gravity, Endurance, retry rollback, Credits,
  capsule, feedback, build identity, and containment tests remain green.
- Pet/transfer logic does not reintroduce same-floor board/alight loops or frame-dependent nondeterminism.
- Syntax, UTF-8, documentation links, canonical/generated balance parity, economy checks, integration containment, and
  supported Playwright tests pass.

## Campaign and statistical checks

- All 25 rounds initialise from canonical data and complete/retry without exceptions.
- Fixed-seed reports include pet spawns/deliveries, conflicts, resolutions/ejections, pet Stink episodes, filter
  changes, direct deliveries, transfers, transfer waits, uncovered passengers, and route recalculations.
- R5 exposes each pet rule across the focused seed set without requiring a purchase to avoid immediate failure.
- R22 exercises both pet filtering and transfers across every focused seed.
- Intended profiles complete at least 80% of fixed seeds for newly authored R21-R23 after correctness stabilises.
- R2 unattended Sweep is allowed to win as onboarding. From R3 onward unattended all-Sweep remains a diagnostic
  negative control; a changed result is reviewed rather than blindly tuned to a specific death time.

## Focused human acceptance

Use current Chrome or Edge desktop. Record build, balance version, round, seed, viewport, and result.

1. **R2:** Sweep is visibly active and may win unattended; a player can still manually rescue a floor and see Sweep
   resume without learning the Automation Dock workflow.
2. **R5 Pet-Friendly Hotel:** cat/dog identity, four filters, conflict warning, Pet Snacks, and five-pet Stink are
   understandable without permanently cluttering the board.
3. **R7/R10/R18/R20:** Checkout is a noticeable temporary surge rather than the entire round's repetitive solution.
4. **R10:** a Sweep-only player can set Low/High zones without changing automation or opening the Workshop.
5. **R21:** a player understands why a guest leaves at an interchange and where it is ultimately going.
6. **R22 Best in Show:** pet filters and transfer coverage produce deliberate network decisions rather than random
   unavoidable conflicts.
7. **R23:** the large conventional network is playable and legible without Counterweight/Open Plan knowledge.
8. **R24-R25:** capsules remain readable and performant with pet-owner rendering.
9. Rooftop events contain no Rooftop music; Settings/Mute and remaining audio behave normally.
10. Load an older campaign containing Open Plan or an active R21-R23 attempt and confirm safe recovery/refund.

## Release package gates

- `npm.cmd run test:release` passes on the candidate commit.
- The itch ZIP opens locally and contains current licences/notices, no retired Rooftop track, and matching `BUILD.txt`.
- Settings, Round Review, feedback diagnostic, packaged build, and deployed GitHub Pages identify the same release.
- Signed-out feedback submission remains optional and functional.
- No unresolved P0 correctness, save-loss, packaging, or provenance issue remains.

