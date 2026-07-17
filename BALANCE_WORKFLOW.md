# Balance Workflow

## 1. Objective

Create a short, repeatable loop in which design changes can be proposed in documentation, validated, converted into configuration, exercised by the unchanged engine, and evaluated through simulation and human play.

`E2E_BALANCE_PLAN.md` defines the active campaign-wide delivery sequence. This workflow is the technical process used to execute it. The first pass satisfices across all rounds with coarse changes; fine-grained optimisation is reserved for human-identified outliers.

```text
Design hypothesis
      ↓
Versioned structured parameters
      ↓
Schema validation
      ↓
Generated game configuration
      ↓
Deterministic simulation
      ↓
Human seeded playtest
      ↓
Telemetry and notes
      ↓
Accept, revise, or reject
```

## 2. Sources of truth

The final system should use:

- `Game Play Map.md` for round intent and readable target tables.
- `Game Economy.md` for payout, prices, unlocks, and retry rules.
- A machine-readable design-data file for canonical numerical values.
- Generated `config.js` data consumed by the engine.

Markdown should explain and review the design. The machine-readable file should prevent transcription ambiguity.

## 3. Proposed data pipeline

The first three stages of this pipeline are implemented:

- Canonical source: `design/game-balance.v1.json`
- Generator: `npm.cmd run balance:generate`
- Generated runtime artifact: `generated/game-balance.js`
- Validation and stale-artifact gate: `npm.cmd run test:config` and `npm.cmd run balance:check`
- Economy scenarios: `npm.cmd run test:economy`

Markdown remains the readable design explanation; approved numerical changes must be copied into canonical JSON before generation.

### Stage 1 — Canonical design data

Create a versioned file such as:

```text
design/game-balance.v1.json
```

It should contain:

- System constants.
- Round definitions.
- Spawn curves.
- Guest types.
- Hazard schedules.
- Automation unlocks.
- Shop unlocks.
- Power-up tiers.
- Payout rules.
- Achievement tiers.
- Telemetry targets.

### Stage 2 — Validation

A validator should reject:

- Missing rounds.
- Unknown mechanic IDs.
- Negative durations or prices.
- Invalid probabilities.
- Non-increasing tier costs.
- Unlocks after required use.
- Gold tiers weaker than lower tiers without an explicit breadth tradeoff.
- Unaffordable required purchases.
- Duplicate or conflicting parameter definitions.
- Unsupported mechanics marked as campaign-required.

### Stage 3 — Generation

Generate the executable data consumed by the game:

```js
// GENERATED FILE — DO NOT EDIT
// Balance version: 1.3.0
window.Config.GAME_DATA = { ... };
```

Generation should not rewrite engine logic.

### Stage 4 — Verification

The test suite verifies that:

- Generated values load correctly.
- Round factories use them.
- No legacy hard-coded values override them.
- The balance version appears in telemetry and review output.

## 4. Balance versioning

Use semantic-style balance versions independent of application releases:

- Major: campaign structure or economy model changes.
- Minor: round sequencing, price, payout, or mechanic magnitude changes.
- Patch: corrections with minimal expected balance impact.

Every playtest record must include:

- Application commit.
- Balance version.
- Seed.
- Player profile/cohort.
- Round.
- Attempt number.

## 5. Design hypothesis template

Every tuning change should begin with:

```text
Observation:
Round 3 failures are caused by travel congestion rather than the intended
boarding bottleneck.

Hypothesis:
Reducing floor count and increasing Room Service frequency slightly will make
boarding delay more visible without increasing total traffic.

Change:
Floors 12 → 10
Room Service chance 5% → 8%
Spawn end 0.85 → 0.75

Expected evidence:
- More lift time spent boarding.
- Fewer failures caused by distant queues.
- Wide Doors use improves survival more than Turbo use.

Rollback condition:
First-time players cannot identify Room Service as the cause of failure.
```

## 6. Simulation layers

### Static validation

Checks internal consistency without running the game.

### Mechanic simulation

Exercises isolated production rules such as:

- Boarding time by guest type.
- Capacity and weight.
- Patience transitions.
- Gravity speed.
- Power-up duration and effect.

### Round simulation

Runs fixed seeds using defined strategy profiles:

- Manual approximation.
- All Sweep.
- Mixed built-ins.
- Idealized specialist policy.
- Representative custom scripts.

Simulation should identify impossibility, dominance, and sensitivity. It should not declare a round fun.

All-Sweep is the principal behavioural floor: every lift uses Sweep with no manual targeting, policy changes, or power-ups. It must fail every campaign round from Round 2 onward. For Round 2 it should fail late and be recoverable with minimal high-leverage intervention; later rounds should show increasingly clear separation between all-Sweep and the intended strategy. Round 12 compares survival duration rather than completion.

For each intended strategy, report improvement over all-Sweep in survival time, first peril crossing, time below Survival Index 1, delivery deficit, P90 journey time, critical exposure, and manual decisions required.

Run the committed all-Sweep matrix with:

```powershell
npm.cmd run balance:matrix
```

The command executes three fixed seeds for Rounds 2–13 and regenerates `reports/all-sweep-baseline.json` plus its readable Markdown summary. `npm.cmd run balance:report:check` verifies that the committed report matches both canonical balance data and the matrix definition. Known balance violations remain report findings rather than making the general correctness suite fail.

### Early-round candidate experiments

Candidate curves can be evaluated without mutating the live balance data with:

```powershell
npm.cmd run balance:experiment:early
```

Set `EXPERIMENT_CANDIDATE` to a candidate ID such as `r3-c2` to run one candidate. The simulator applies curve overrides, loadouts, strategies, and experimental traffic only inside its disposable realm. `reports/early-balance-experiments.json` is evidence, not a release gate.

The accepted Round 3 pressure candidate is `r3-c2` (`1.00→1.20`). Across seeds 1234, 3141, and 6060, unattended all-Sweep failed all three runs, while supervised Wide Doors and hybrid-manual/Wide Doors comparators survived all three. The automated comparator carries four Bronze Wide Doors to establish recoverability conservatively; it does not establish an intended purchase quota. Human playtesting remains required.

Round 2 remains unresolved. Raising general arrival pressure and adding a late synthetic burst caused both all-Sweep and the current minimal-rescue proxy to fail. No Round 2 candidate should be promoted until a small, legible intervention reliably separates the intended strategy from unattended Sweep.

Rounds 4 and 5 candidate experiments also remain exploratory. Increased traffic can make all-Sweep fail, but all-Priority, all-Voting, and the current hybrid-manual proxies do not reliably outperform it. These results must not be interpreted as evidence that the featured policies are useless: the scripted manual controller is a deliberately simple heuristic and currently performs worse than Sweep. Before promoting further curves, define competent, round-specific strategy profiles and validate them against observed human play.

### Campaign economy simulation

Models struggling, typical, and expert spending paths across all rounds.

### Campaign envelope

Run the coarse end-to-end classification with:

```powershell
npm.cmd run balance:envelope
```

This writes `reports/campaign-envelope.json` and a readable Markdown summary. A candidate strong comparator that does not outperform all-Sweep causes an `UNPROVEN` classification; it must never be used to justify raising or lowering production pressure.

The strong result is selected per seed from a small, auditable portfolio rather than one controller. Portfolio rows retain their policy, loadout, and telemetry in the JSON report. This permits broad feasibility classification while keeping affordability and dominant-resource assumptions reviewable.

Resource-supported profiles select items from observed conditions rather than inventory order: Wrench for jams, Freshener for stink, Musak for critical exposure, and throughput items for large queues. Where available, the portfolio compares Sweep, Priority Sweep, and Weighted Voting. A band-wide pressure change is rejected wholesale if it creates unattended survivors without establishing competent survival.

Resource-supported profiles also perform bounded manual rescues: when visible pressure crosses the intervention threshold, one available lift is redirected to the highest-scoring urgent queue. This represents the intended hybrid play loop rather than treating power-up activation alone as competent play. The July 2026 late-campaign 20% pressure experiment failed the batch gate—Rounds 7 and 8 gained unattended survivors while Rounds 9–11 and 13 still lacked competent survival—and was rolled back. Further late-round experiments should add event-specific response logic or improve the leverage of the introduced solution before changing arrival curves.

## 7. Human playtest protocol

For each candidate balance version:

1. Reset campaign state.
2. Use assigned seed.
3. Do not read hidden implementation values.
4. Record loadout and automation choices before the attempt.
5. After failure, state the perceived cause before viewing telemetry.
6. Retry the same seed with a revised plan.
7. Compare perceived cause with measured cause.
8. Record whether the successful strategy felt discovered, forced, or accidental.

Key qualitative questions:

- Did the player understand why they failed?
- Could they imagine a different plan?
- Did the shop contain understandable answers?
- Was any purchase obviously dominant?
- Did timing matter?
- Did success feel earned?
- Was the retry attractive?

## 8. Required telemetry

### Round metadata

- Balance version
- Commit
- Seed
- Round
- Attempt
- Duration
- Outcome and reason

For Round 12, the terminal outcome is always Endurance completion at zero lives. Record survival duration, guests served, and automatic progression to Round 13 rather than classifying the result as an ordinary failure.

### Traffic

- Guests spawned
- Guests served
- Status at service
- Defenestrations
- Average, median, 90th percentile, and maximum wait
- Queue size over time and peak by floor
- Average guests in queue and in the complete system
- Arrival and delivery rates
- Little's Law estimate (`arrival rate × average journey time`) and residual against observed average work in progress

### Lift operations

- Automation per lift over time
- Manual clicks
- Distance traveled
- Empty distance
- Time in each lift state
- Average and peak load
- Boarding throughput
- Jam/stink downtime
- Productive lift utilisation sampled over time

### Economy

- Starting bank
- Cart and committed spend
- Items used and time used
- Ending bank
- Payout components

For Endurance, separately record points earned from survival time, service volume, quality, and achievements. Preserve uncapped personal-best score even if Operational Points are capped.

### Design-only pressure forecast

These values are recorded for simulation and developer analysis only. They are not displayed to players and are not exposed to current campaign automation:

- Weighted recent life-loss rate over 15, 30, and 60-second windows
- Lives represented by guests forecast to reach rage within 15 seconds
- Projected life-loss rate
- Projected time to death
- Projected Survival Index: projected time to death divided by round time remaining
- Minimum index, first crossing below 1.0, seconds below 1.0, and recoveries above 1.0
- Manual decisions per minute

VIP losses are weighted by lives lost rather than counted as one defenestration. Round 12 records projected time to death but has no Survival Index because it has no remaining-time success boundary.

### Automation

- Script identifier/version
- Target changes
- Invalid target attempts
- Runtime errors
- Decision count
- Oscillation/stall indicators

## 9. Decision rule

A change is accepted only when:

- It moves the intended metric.
- It does not introduce a worse unintended bottleneck.
- Human failure diagnosis matches the designed problem.
- At least two viable strategies remain.
- Economy affordability remains within target bands.
- Regression tests pass.

Balance changes should be small enough to explain. Avoid changing spawn rate, patience, speed, prices, and power simultaneously unless the economy model itself is being reset.

## 10. LLM-supported iteration

LLM assistance is particularly suitable for:

- Checking documents for contradictions.
- Converting approved structured design into generated config.
- Producing validator rules.
- Comparing telemetry across balance versions.
- Clustering player failure explanations.
- Identifying dominant strategies.
- Drafting bounded tuning hypotheses.

The LLM should not silently change design values. Every proposed change must retain the observation, hypothesis, expected evidence, and rollback condition.
