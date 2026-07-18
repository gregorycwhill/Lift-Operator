# End-to-End Satisficing Balance Plan

**Status:** Design rationale retained by `IMPLEMENTATION_HANDOFF.md`. When thresholds, commands, sequence, replay, reporting, or stopping rules differ, the handoff is authoritative.

## Objective

Bring the complete 13-round campaign into a broadly playable, progressively demanding shape quickly. This pass seeks a defensible balance envelope, not an optimum for every seed or round.

The pass succeeds when:

- Unattended built-in automation fails every campaign round from Round 2 onward.
- A deliberately strong competent strategy demonstrates that each standard round is survivable.
- Early baseline failures occur late enough to reveal the problem rather than immediately overwhelming the player.
- Round 12 competent survival lies between 4 and 8 minutes; unattended built-ins survive materially less than 4 minutes.
- Required solution loadouts are affordable on a plausible campaign path.
- Lifecycle, retry, economy, and performance tests remain green.

Human playtests decide whether a round is engaging. Simulation establishes feasibility, rejects dominant autoplay, and identifies gross outliers.

## Satisficing rules

1. Tune the campaign envelope before individual rounds.
2. Use coarse changes of approximately 10–20%; do not search in tiny increments during this pass.
3. Change arrival pressure first. Change patience, speed, prices, or power magnitude only when telemetry shows arrival pressure cannot express the intended problem.
4. Use three fixed seeds for the release gate. Additional seeds measure robustness but do not start an optimisation search.
5. Accept the first candidate that meets the gate. Do not improve a passing score without human evidence of a problem.
6. A strong comparator may use privileged design telemetry. It establishes an upper bound on competent play; it does not need to imitate human clicks.
7. Keep known failures visible. Exploratory balance findings are not correctness failures until a candidate is accepted as canonical.

## Campaign pressure bands

| Band | Rounds | Intended pressure | Baseline failure target | Competent-play role |
| --- | --- | --- | --- | --- |
| Onboarding | 1 | Safe learning | Not applicable | Manual fundamentals |
| Arcade | 2–3 | Low overload, visible late peril | Final 20–30% | A few high-leverage actions and an affordable Bronze response |
| Tactical | 4–6 | Moderate overload | Middle-to-late round | Lift roles, policy switching, timed resources |
| Event | 7–9 | Event-shaped overload | After the problem becomes legible | Preparation, reassignment, hazard response |
| Strategic | 10–11, 13 | Structural overload | Clearly before completion | Loadout planning, resource management, automation design |
| Endurance | 12 | Inevitable collapse | Built-ins below 4 minutes | Competent survival 4–8 minutes |

These are broad targets. A round is not rejected for missing an exact percentile if the behavioural gate is clear and progression remains coherent.

## Heuristic envelope

For every round, report:

- Arrival and delivery rates.
- Effective utilisation: arrival rate divided by delivery rate or estimated service capacity.
- Average work in progress and Little's Law residual.
- Queue-growth direction in the middle and final third.
- First Projected Survival Index crossing below 1 for standard rounds.
- Survival time, guests served, and recent life-loss rate for Endurance.

Classify each round:

- **Underloaded:** baseline automation wins or queues trend downward without intervention.
- **Contested:** baseline eventually fails while competent play survives.
- **Overloaded:** baseline and competent play both collapse too early.
- **Unproven:** comparator quality or telemetry is insufficient to classify the round.

The desired provisional state for Rounds 2–11 and 13 is Contested. Round 12 uses its bounded survival window.

## Minimal strategy matrix

Run only three profiles during the coarse pass:

1. **Unattended floor:** all lifts use Sweep with no clicks, policy changes, custom automation, or power-ups.
2. **Strong comparator:** a round-specific idealised strategy using intended policies, lift roles, relevant power-ups, and design telemetry where useful.
3. **Monkey lifecycle:** blind accelerated play proving workflow completion, not balance.

| Unattended floor | Strong comparator | Decision |
| --- | --- | --- |
| Survives | Survives | Increase pressure by one coarse step |
| Fails | Survives | Accept provisionally |
| Fails | Fails | Reduce pressure or strengthen the intended solution |
| Survives | Fails | Mark Unproven; repair the comparator or round design |

The competent comparator should survive at least 2 of 3 fixed seeds. Prefer 3 of 3, but do not fine-tune a plausible 2-of-3 result without human evidence.

## Endurance gate

Round 12 always ends at zero lives and then progresses to Round 13.

- Unattended built-in automation: less than 4 minutes.
- Strong active strategy: 4–8 minutes.
- Above 8 minutes: increase late pressure because the round risks becoming boring.
- Below 4 minutes for competent play: reduce pressure or strengthen viable resource responses.

Survival time is primary. Guests served and points earned are secondary checks. The economy must bound payout even near 8 minutes.

## Implementation phases

### A — Measurement readiness

- Produce one campaign summary containing heuristic and profile outcomes.
- Add round-specific strong comparators without changing production behavior.
- Record comparator assumptions, policies, interventions, and loadouts.
- Ensure built-in-only profiles record zero manual decisions.

**Gate:** Every round is classified, including Unproven where evidence is insufficient.

### B — Coarse campaign pass

- Adjust failing bands in 10–20% pressure steps.
- Run three fixed seeds after each band-level change.
- Promote the first candidate where unattended automation fails and the strong comparator survives.
- Regenerate canonical configuration and reports once per accepted batch, not per exploratory candidate.

**Gate:** Standard rounds are provisionally Contested and Round 12 meets its survival window.

### C — Economy feasibility

- Give each strong comparator a declared loadout and cost.
- Verify a typical bank can afford the newly introduced answer plus a small reserve.
- Verify failure restores the checkpoint and permits a revised plan.
- Never assume that buying everything is a valid solution.

**Gate:** Every accepted round has at least one affordable solution path.

### D — Short human campaign pass

- Play the whole campaign instead of repeatedly testing one round.
- Allow at most two attempts per standard round during the first pass.
- Record perceived cause, revised plan, outcome, purchases, and whether the round felt trivial, fair, or opaque.
- For Round 12, record survival time and whether interest declined before death.

**Gate:** The complete progression is playable and difficulty broadly rises.

### E — Outlier correction

Optimise only rounds with human evidence of:

- Trivial built-in autoplay.
- Early unavoidable collapse.
- Unclear failure cause.
- Mandatory unaffordable loadout.
- One dominant solution eliminating meaningful choice.
- Endurance below 4 or above 8 minutes for competent play.

Limit each correction to one hypothesis and one primary parameter family.

## Reporting and stopping rules

Use one compact campaign table. For each round record classification, three-seed outcomes for both profiles, first-peril timing or Endurance survival, arrival and delivery rates, utilisation proxy, queue trend, loadout cost, and decision.

Stop tuning a round when it passes its behavioural and affordability gates. Reopen it only after human evidence, a mechanic change, or a materially changed economy invalidates the result.

## Deliverables

- A versioned campaign-wide candidate balance.
- A compact machine-readable report and readable summary.
- Strong-comparator definitions with declared assumptions.
- Updated Game Play Map and Game Economy values for accepted batches.
- A short human campaign playtest record.
- A small outlier list for the next iteration.

The result should be a balanced-enough complete campaign quickly, followed by selective refinement where players—not exhaustive parameter search—show it is valuable.
