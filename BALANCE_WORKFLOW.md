# Balance Workflow

**Status:** Marie's Birthday Edition design workflow  
**Goal:** Satisfice the full 25-round experience before optimising isolated rounds.

## Source-of-truth loop

1. Edit intent and thresholds in current design docs.
2. Change parameters only in `design/game-balance.v1.json`.
3. Run `npm.cmd run balance:generate`.
4. Run deterministic correctness and acceptance simulations.
5. Review compact aggregates and anomalous seeds, not every replay log.
6. Human-play the selected bands, record observations, and accept/reject the candidate.

Never hand-edit `generated/game-balance.js`. One candidate changes one coherent parameter family at a time and records
the before/after balance version.

## Campaign bands

| Band | Rounds | Main question |
|---|---:|---|
| Onboarding | 1–4 | Are manual basics, Sweep, rescue, and Room Service legible and recoverable? |
| Pet/event introduction | 5–9 | Do pets persist without dominating; do jams, Checkout, VIP, and Rooftop create distinct responses? |
| Operating systems | 10–13 | Are zoning, Gym/Stink, Endurance, and Gravity understandable with Sweep/manual play? |
| Zoned scale | 14–20 | Do overlap, resources, strong Checkout waves, and manual rescue outperform unattended Sweep? |
| Interchange | 21–23 | Are direct/one-transfer routes correct, legible, pet-compatible, and strategically useful? |
| Capsules | 24–25 | Does independent high-volume dispatch remain readable and performant? |

## Required profiles

- **Unattended all-Sweep:** every lift Sweep, no clicks, zone/filter changes, Workshop, or power-ups. Negative control.
- **Bounded target-player:** Sweep plus a documented maximum of high-leverage manual decisions and operating changes.
- **Resource-supported:** target-player profile plus declared purchasable inventory.
- **Mechanic focus:** a deterministic profile that actively exercises the new mechanic (pet filters/conflict or zoned
  transfer coverage) rather than merely surviving around it.

Custom automation is not the target-player baseline. It remains useful as an exploratory comparator.

## Design telemetry

Telemetry is internal only and must never render in player UI or enter the automation bridge in this release.

- Flow: spawns, direct deliveries, transfers, delivery rate, queue/system population, peak queue by floor.
- Time: mean/median/P90/max journey, transfer wait, critical exposure, first life loss.
- Pressure: lives, loss rate, projected time to death, projected Survival Index, seconds in peril, recoveries.
- Utilisation: productive lift time, manual decisions/minute, zone refusals, uncovered routes/passengers,
  route recalculations.
- Pets: spawned/served, filter changes, conflicts, Pet Snacks resolutions, ejections, pet Stink episodes.
- Economy: opening/closing Credits, spend, items selected/used/unspent.
- Reproducibility: build, balance version, round, campaign/round seed, profile version, overrides, result hash.

Projected Survival Index is projected time to death divided by time remaining. Above 1 is provisionally safe; below 1
is peril. It is a noisy forecast, so use duration/recovery patterns rather than a single crossing. Endurance has no time
remaining; report projected time to death directly.

Little's Law (`L ≈ λW`) is a diagnostic consistency check, not a tuning target. Large residuals may identify transient
waves, stalled transfers, or instrumentation defects.

## Acceptance thresholds

Correctness always outranks balance:

- zero crashes, NaN/invalid state, disappearing guests, route loops, second transfers, or seed divergence;
- zero final uncovered routes for the accepted R21–R23 authored starting configuration;
- direct service always preferred; original spawn time retained across transfer/ejection;
- pet role exclusions, filter compatibility, conflict timer, Stink threshold, and power-up separation pass all seeds;
- Checkout is active only inside its authored R7/R10/R18/R20 wave;
- every round initialises and a complete campaign traversal reaches R25.

Balance satisficing thresholds:

- intended profiles complete at least 80% of the fixed seed set for R21–R23;
- intended profile materially improves survival/delivery over unattended Sweep in each reviewed band;
- no reviewed standard-round seed produces an unavoidable loss before the player has a plausible response window;
- R12 competent survival is 240–480 seconds; runs above 480 seconds are boredom risks;
- R5 produces cats, dogs, at least one conflict opportunity, and possible five-pet congregation across the focused seed
  set without requiring Pet Snacks for immediate survival;
- R22 produces pet filtering and transfer use across every focused seed;
- P90 journey time and critical exposure do not regress by more than 20% in unaffected adjacent bands without an
  explicit design justification.

Unattended Sweep results are reviewed as a floor. Do not distort a good human-play round solely to make every synthetic
seed die at an exact time.

## Parameter search

Search in broad bands, not round-by-round micro-optimisation:

1. Fix correctness and observability.
2. Sweep spawn curves/capacity/travel only within one campaign band.
3. For pets, sweep pet chance and power-up economics separately from base arrival pressure.
4. For transfers, sweep zone layouts and demand before raw spawn rates.
5. Rank candidates by hard-gate pass, competent completion, negative-control separation, journey/pressure bounds, then
   economy. Do not optimise a single scalar score.
6. Rerun finalists on the full campaign matrix and human-play boundary rounds.

The code performs the parameter grid, seeds, aggregation, anomaly selection, and report generation. The implementation
agent receives per-round/profile aggregates plus the smallest anomalous replay set: first failure, worst P90, any
correctness invariant breach, and any seed whose classification changes from the prior candidate.

## Reproducibility

- Environment, automation, and campaign/round seeds are explicit and independent.
- Same build + balance version + round + seed + profile + overrides must produce the same compact result hash.
- Browser wall time must not contaminate virtual simulations.
- A failed seed is rerunnable with trace enabled without changing its outcome.
- Reports include command, timestamp, git commit, dirty-state flag, profile version, and canonical override diff.

## Stopping rules

Stop automated tuning and request human judgment when any of these applies:

- a correctness invariant fails;
- two consecutive accepted sweeps improve no hard threshold or key band metric materially;
- improvement in one target band causes >20% regression in an unaffected adjacent band;
- the remaining difference is primarily comprehension, fun, visual legibility, or boredom;
- the best candidates trade off completion and engagement without a clear product preference;
- R12 lies inside 4–8 minutes and further changes only move it within that band;
- the release deadline requires shipping a correct satisficing candidate rather than exploring more parameters.

Do not continue searching after thresholds pass merely to maximise survival, score, or an aggregate objective.

## Commands

```powershell
npm.cmd run balance:generate
npm.cmd run test:config
npm.cmd run balance:check
npm.cmd run balance:acceptance
npm.cmd run test:release
```

Focused trace/anomaly tools may be used after aggregate classification, but `test:release` remains the release gate.
