# Balance Workflow

## 1. Objective

Create a short, repeatable loop in which design changes can be proposed in documentation, validated, converted into configuration, exercised by the unchanged engine, and evaluated through simulation and human play.

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

### Campaign economy simulation

Models struggling, typical, and expert spending paths across all rounds.

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

### Lift operations

- Automation per lift over time
- Manual clicks
- Distance traveled
- Empty distance
- Time in each lift state
- Average and peak load
- Boarding throughput
- Jam/stink downtime

### Economy

- Starting bank
- Cart and committed spend
- Items used and time used
- Ending bank
- Payout components

For Endurance, separately record points earned from survival time, service volume, quality, and achievements. Preserve uncapped personal-best score even if Operational Points are capped.

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
