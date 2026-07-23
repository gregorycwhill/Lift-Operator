# Lift Operator — Implementation Handoff Plan

**Status:** Historical decision and implementation record; not current delivery authority.
**Use instead:** `DOCUMENTATION.md`, `ROADMAP.md`, `DELIVERY_PLAN.md`, and `TEST_PLAN.md`.
**Baseline commit:** `f10f135` (`Add round orientation and clarify player feedback`)  
**Baseline balance:** `0.2.2-round-2-accessibility`  
**Prepared:** 18 July 2026  
**Original scope:** Stabilization completion, trustworthy executable simulation, replay, automated balance search, economy feasibility, and campaign-wide satisficing balance.
**Out of scope:** New rounds, hazards, guest types, power-ups, themes, online services, player-facing telemetry, and adversarial security hardening.

## 1. Product intent that must not be reinterpreted

Lift Operator begins as a fast arcade game and becomes a resource-management and automation puzzle. Each important round follows a problem–solution–mastery loop:

1. The player encounters a legible new bottleneck.
2. A familiar tactic becomes insufficient.
3. Failure reveals why it became insufficient.
4. The player revises lift roles, manual interventions, automation, loadout, or timing.
5. The same seeded traffic can be retried with no failed-attempt carryover.
6. Success comes from understanding and execution.

The following are binding design rules:

- The game does not need additional mechanics; balance the existing ones.
- Rounds 1–3 are arcade onboarding. Rounds 4–9 add tactical coordination. Rounds 10–13 are increasingly strategic.
- Built-in automation is a force multiplier, not an autoplay win button.
- From Round 2 onward, unattended built-in Sweep must not complete a standard round.
- Hands-Free is reserved for eligible player-authored custom automation, never a built-in policy.
- A manual floor selection while Sweep is active is an explicit pickup command: direction is ignored at that stop, subject to capacity, VIP, rage, and hazard restrictions.
- Waiting time means spawn-to-successful-destination delivery, not queue-only time.
- Ordinary death restores the previous-round credit checkpoint, clears inventory/cart and all attempt state, retains round and seed, shows a failed review, and returns to the same round's shop/briefing flow.
- Round 12 Endurance starts with 20 lives, has no timer or quota, ends only at death, awards a capped payout, and advances to Round 13.
- Endurance should last 4–8 minutes under competent active play and materially less than 4 minutes under unattended built-ins.
- Design telemetry is developer-only. It must not appear in the player UI or ordinary automation sensors. Round 20+ use is deferred.
- Player-facing currency is **Credits**. Internal identifiers may remain `points` until a deliberate compatibility migration.
- Security is lightweight access gating and accidental-misuse containment for a hobby/learning project. Curious source inspection and reverse engineering are acceptable outcomes. UI freezes, corrupt imports, and accidental infinite automation are not acceptable.

## 2. Current architecture and execution paths

### 2.1 Deployment and module model

The product is a static GitHub Pages application. `index.html` loads classic scripts in dependency order:

```text
utils
generated balance → config → state → telemetry
audio → automation VM → power-ups → achievements → workshop
engine core → spawner → physics → simulator
UI modules → overlay/event binding
```

There is no bundler or ES-module boundary. Production code communicates through `window.Game`, `Registry`, `Config`, `PowerUps`, and compatibility globals. Do not begin this work with a wholesale module rewrite.

### 2.2 Canonical configuration path

```text
design/game-balance.v1.json
        ↓ scripts/generate-balance.js
generated/game-balance.js
        ↓ loaded before config.js
Config.GAME_DATA and legacy compatibility fields
        ↓
round factory, engine, shop, achievements, simulator
```

`design/game-balance.v1.json` is the only canonical numerical balance source. Any candidate search must use an in-memory overlay and must not edit this file. Only an explicitly accepted candidate may update canonical JSON, increment `balanceVersion`, regenerate the artifact, and refresh reports.

### 2.3 Campaign lifecycle path

`engine-core.js` owns the shared lifecycle:

```text
reset/skip/retry/advance
  → createRoundState
  → applyRoundState
  → resetAttemptTelemetry
  → initializeRound/buildWorld/show briefing
  → five-second countdown
  → first spawn + resume
  → gameTick (1 Hz) + animationTick (60 Hz)
  → completeRound OR handleOrdinaryDeath
  → review
  → next briefing/shop OR same-round retry
```

Round state is created by `createRoundState`; lift state by `createLiftState`; attempt telemetry by `createRoundStats`. Normal start, retry, warp, and simulation already share these factories.

### 2.4 Physics and traffic path

- `engine-spawner.js`: first spawn, normal arrivals, Room Service, checkout traffic, VIP, rooftop event.
- `engine-physics.js::gameTick`: round clock/objective, spawning, patience, rage/defenestration, hazards, timer decay, telemetry sampling.
- `engine-physics.js::animationTick`: movement, doors, boarding, delivery, automation decisions.
- `state.js`: routing queries, weight, Sweep/Voting target helpers.
- `automation-vm.js`: built-ins and custom-script execution bridge.
- `powerups.js`: catalog, activation, capacity, inventory consumption.
- `achievements.js`: payout and once-per-tier achievement transactions.

Environment and automation randomness use separate seeded streams in `config.js`. Preserve this separation.

### 2.5 Simulation path

`Game.Simulator.runRound` creates a hidden same-origin iframe with `?simulation=true`. That disposable realm owns `Registry`, configuration overrides, PRNGs, and virtual time. `runRoundLocal`:

1. Replaces UI/audio with no-op adapters.
2. Applies optional in-memory round overrides.
3. Initializes the real round factory.
4. Installs automation scripts and an optional loadout.
5. Advances one game tick and sixty production animation ticks per simulated second.
6. Runs a named strategy controller.
7. Returns terminal state, round statistics, and exported design telemetry.

This gives production-path fidelity but is too slow and too monolithic for broad parameter search. Strategy definitions, action recording, aggregation, and parameter search are embedded or absent.

### 2.6 Existing balance/report path

- `scripts/run-balance-matrix.js`: three fixed seeds × Rounds 2–13, unattended all-Sweep.
- `scripts/run-early-balance-experiments.js`: hand-coded early-round candidates and strategies.
- `scripts/run-campaign-envelope.js`: unattended baseline plus an idealized/resource-supported portfolio.
- `scripts/simulate-economy.js`: three deterministic campaign-credit profiles.
- `scripts/validate-balance-report.js`: report freshness, matrix completeness, classifications, and Endurance bounds.
- `reports/*.json`: machine-readable evidence.
- `reports/*.md`: compact human summaries.

Current campaign envelope:

| Rounds | Current result |
| --- | --- |
| 2 | Underloaded: all-Sweep survives 3/3; accessibility was prioritized provisionally |
| 3–6 | Contested on the accepted three-seed evidence |
| 7–11 | Overloaded: both unattended and current strong profiles die |
| 12 | Contested Endurance: unattended average ~147s; supported average ~294s |
| 13 | Overloaded |

A uniform 20% late-campaign pressure reduction was tested and rejected because it created unattended survivors in Rounds 7–8 without establishing competent survival later.

### 2.7 Existing tests

The current `npm.cmd test` gate runs syntax, config generation/freshness, economy, report validation, 50 Playwright tests, and the complete Monkey campaign. At the baseline commit it passes in approximately 8.4 minutes on the development machine.

Important remaining gaps are recorded in `TEST_PLAN.md`: reset/career persistence, legacy compatibility rejection, several mechanic interactions, blueprint consent/origin, automation failure responsiveness, UTF-8 validation, Round 2 separation, late-round strategy separation, and economy inflation.

## 3. Required behavioral changes

### 3.1 Preserve already-correct behavior

Before tuning, freeze the following with regression tests rather than rewriting them:

- Five-second orientation countdown and temporary capacity cues.
- Retry/checkpoint transaction semantics.
- Endurance death-to-progression semantics.
- Manual pickup override during Sweep.
- FIFO/right-anchored lobby queue.
- `0.5s` base lift travel and `0.5s` base boarding speed.
- Design telemetry exclusion from player UI and automation sensors.
- Hands-Free custom-automation requirement.

### 3.2 Complete correctness and containment gaps

Implement and test:

1. Campaign reset clears runtime/attempt state while retaining only documented career state.
2. Every production balance consumer resolves through generated canonical data; remove or validate remaining duplicate compatibility values.
3. Production-path tests cover VIP penalty/exclusivity, Gym Bro weight/stink threshold, jam/Wrench, stink/evacuation/Freshener, rooftop redirect/release, Musak, Group Think, and experimental exclusion of Open Plan.
4. Imported blueprints show origin, validate schema/version/checksum/size, and require explicit consent.
5. Custom automation cannot freeze the UI. Prefer a Web Worker or constrained interpreter; a strict terminate-on-deadline worker is sufficient. Do not pursue adversarial sandboxing beyond the documented hobby-project threat model.
6. Repository text passes UTF-8 validation; do not silently normalize gameplay assets or third-party libraries.

### 3.3 Balance changes to pursue

- **Round 2:** retain novice accessibility while making unattended Sweep fail late and making a small number of meaningful manual rescues succeed. Strengthen the intended action before increasing generic pressure.
- **Rounds 3–6:** freeze numerical pressure unless regression evidence breaks their accepted separation or human evidence identifies an outlier.
- **Rounds 7–9:** build event-specific competent profiles for checkout, VIP, rooftop/stink, and associated resources. Only then search event leverage and pressure.
- **Rounds 10–11:** make customization, capacity/weight, and resource planning materially useful. Custom automation must be deterministic and timeout-safe before it becomes a release comparator.
- **Round 12:** freeze `0.80→1.00` unless the new harness disproves the current 4–8-minute supported window.
- **Round 13:** build a gravity-aware comparator and then tune solution leverage/pressure.
- **Economy:** reduce accumulated-credit inflation while preserving retry recovery and at least one affordable intended loadout per wall.

## 4. Proposed architecture and file-level changes

The names below are prescriptive unless an existing repository convention makes a nearby name clearly better. If a name changes, update this document and the README in the same commit.

### 4.1 Production/runtime files

| File | Required change |
| --- | --- |
| `engine-core.js` | Add explicit reset/career persistence contract tests. Do not add replay hashing or balance-search logic to the campaign lifecycle. |
| `engine-physics.js` | Add only mechanic corrections revealed by production-path tests. Emit structured design events through telemetry; do not render them. |
| `engine-spawner.js` | Emit deterministic spawn/event records with stable guest IDs. IDs must come from a resettable monotonic counter and must not consume either PRNG stream. Preserve environment RNG order. |
| `state.js` | Add stable IDs/counters needed for replay; correct effective-capacity/weight sensors used by custom automation. |
| `balance-telemetry.js` | Move from cumulative-only samples to windowed aggregates plus structured summary counters; retain existing fields for one compatibility version. |
| `engine-simulator.js` | Reduce to a deterministic production-engine adapter: initialize/reset, step by integer simulation tick, validate/apply actions, return a normalized terminal snapshot/hash. Move strategy/search/report concerns out. Add batch-local execution without creating an iframe per individual run. |
| `automation-vm.js` | Add deadline-isolated custom execution and deterministic request/response validation before using custom profiles in Rounds 10–13. |
| `ui-manifest.js`, `workshop.js` | Implement blueprint origin/consent/version behavior. |
| `config.js` | Keep seed derivation and generated-data compatibility; reject unknown/missing canonical references. Do not introduce new numeric sources. |

### 4.2 New simulation modules

Create developer-only modules under `tests/simulation/` and load/inject them only in simulation/test pages:

| New file | Responsibility |
| --- | --- |
| `tests/simulation/action-schema.js` | Validate normalized actions: target floor, set automation, activate power-up, no-op. |
| `tests/simulation/strategy-profiles.js` | Versioned auditable strategy registry. No anonymous inline strategies in runners. |
| `tests/simulation/round-profiles.js` | Per-round intended profile, loadout, intervention bounds, and declared assumptions. |
| `tests/simulation/replay.js` | Record/replay action traces, metadata, state hashes, anomaly slices. |
| `tests/simulation/metrics.js` | Pure metric derivation, aggregation, percentiles, classification, and anomaly selection. |
| `tests/simulation/seed-sets.json` | Named discovery, release, robustness, and golden seed sets with a generation master seed. |
| `tests/simulation/search-spaces.json` | Allowed parameter families, bounds, and coarse steps. No arbitrary engine-field search. |

### 4.3 New Node orchestration scripts

| New file | Responsibility |
| --- | --- |
| `scripts/run-simulation-batch.js` | Parallel Playwright worker/pages, sequential isolated runs per worker, compact run records. |
| `scripts/replay-simulation.js` | Replay one recorded action trace and verify terminal/metric hashes. |
| `scripts/search-balance.js` | Generate candidate overlays, execute profiles/seeds, apply hard gates, rank feasible candidates, stop automatically. |
| `scripts/validate-reproducibility.js` | Repeat selected runs and require byte-identical normalized results. |
| `scripts/summarize-balance-run.js` | Produce bounded JSON/Markdown summaries and anomaly manifests without raw logs. |
| `scripts/validate-utf8.js` | Validate first-party text/source files; explicitly exclude pinned third-party libraries unless separately migrated. |

### 4.4 Tests and reports

| Path | Required change |
| --- | --- |
| `tests/lifecycle-correctness.spec.js` | Keep browser/lifecycle coverage; move pure metric/search/replay assertions into Node unit tests. |
| `tests/auto-pilot.spec.js` | Retain full campaign; add a shorter tagged smoke path so every small search change does not require 8+ minutes. |
| `tests/unit/*.test.js` | Node tests for schemas, seed derivation, aggregation, classification, candidate generation, stopping rules, replay codec. |
| `tests/integration/*.spec.js` | Simulation batch isolation, production mechanics, event profiles, custom-worker timeout, replay equivalence. |
| `reports/balance/<run-id>/` | `summary.json`, `summary.md`, `anomalies.json`, selected replay files, and manifest. |
| `reports/latest-balance.json` | Small pointer/summary for the latest accepted production balance only. |

Do not commit raw per-frame logs or one replay per run. Commit accepted summaries and a small anomaly/replay set only.

## 5. Metrics and explicit acceptance thresholds

### 5.1 Metric definitions

Every simulated run must produce:

- Outcome, elapsed seconds, lives remaining, guests spawned/served/lost.
- Arrival rate and delivery rate over the full run and by thirds.
- Queue length and system work-in-progress: mean, peak, end, and slope by thirds.
- Journey time: mean, median, p90, and maximum for delivered guests.
- Life-loss rate by 15/30/60-second windows and cause.
- Projected Survival Index (PSI): minimum, first crossing below 1, seconds below 1, recoveries.
- Lift active utilisation and productive utilisation. Define active as moving/doors/boarding; productive as carrying passengers or boarding/delivering. Report both.
- Manual target count, automation changes, custom decisions, and decisions/minute.
- Power-up uses by ID/tier/time, declared loadout cost, unused inventory, and credits required.
- Event-specific counters: checkout backlog, VIP wait/loss, stink seconds/evacuations, jam seconds, rooftop redirected/released, heavy-weight backlog, gravity-loaded travel.
- Determinism metadata and terminal-state hash.

Little's Law is diagnostic, not a pass/fail oracle. For the middle steady window (seconds 31–120 for standard rounds), report time-average system guests `L`, delivered throughput `λ`, completed journey mean `W`, residual `L - λW`, and normalized absolute residual `|L - λW| / max(1,L)`. Non-stationary rounds may have a large residual and must not be tuned solely to reduce it.

### 5.2 Correctness/reproducibility gates

- Same commit + balance hash + seed + round + strategy version + loadout + candidate overlay must produce byte-identical normalized summary and identical terminal-state hash in 3 consecutive executions.
- Recorded replay must reproduce the same terminal-state hash and all integer counters. Floating metrics may differ by at most `1e-9` after normalization; prefer integer tick/millisecond storage.
- Built-in unattended profiles must record exactly zero manual targets, zero policy changes after setup, zero power-up uses, and zero custom ticks.
- No run may emit `NaN`, `Infinity`, invalid floor/lift IDs, negative inventory, or an uncaught error.
- Candidate overlays must leave canonical JSON, generated runtime data, live `Registry`, and both live PRNG streams unchanged after the batch.

### 5.3 Three-seed release gate

Use release seeds `1234`, `3141`, and `6060` for every candidate:

- Rounds 2–11 and 13 unattended all-Sweep: `0/3` survive.
- Intended strong profile: at least `2/3` survive; prefer `3/3` but do not optimize a valid `2/3` result without human evidence.
- Round 2 unattended deaths: each between `126s` and `144s` (70–80% elapsed); intended hybrid survives at least `2/3`, uses no power-up, and has median manual targets `≤ 6`.
- Round 3 unattended death should occur no earlier than `120s`; strong profile survives `≥2/3` with no more than two Bronze Wide Doors in its declared loadout.
- Rounds 4–6 remain accepted if the unattended/strong gates hold; otherwise reopen only the broken round.
- Rounds 7–9 unattended median death must be `≥90s`, first peril median `≥45s`, and the event-specific strong profile must survive `≥2/3`.
- Rounds 10–11 unattended median death must be `≥75s`; strong profile survives `≥2/3` and uses at least one round-intended customization/resource mechanism.
- Round 13 unattended median death must be `≥75s`; gravity-aware strong profile survives `≥2/3`.
- Round 12: every unattended run `<240s`; every strong run `240–480s`. This is per seed, not only an average.

If a baseline dies before a diagnostic floor, classify it `TOO_EARLY` even if the all-Sweep invariant technically passes.

### 5.4 Robustness gate

After passing the three release seeds, run the fixed 30-seed robustness set:

- Standard-round unattended all-Sweep: `0/30` survive. This is a design invariant, so do not use a permissive percentage.
- Strong profile: at least `24/30` survive (`80%`).
- Round 2: at least `24/30` unattended deaths fall in `120–156s`; strong profile survives at least `24/30`; median manual targets `≤6`, p90 `≤10`.
- Other standard rounds: no more than `3/30` baseline deaths before the band's diagnostic floor.
- Round 12: unattended p90 `<240s`; strong p10 `≥240s`, strong p90 `≤480s`.
- No single seed may fail because of an invalid/unavoidable event combination. Such seeds are anomalies requiring mechanic diagnosis, not automatic exclusion.

The 30 seeds measure robustness; they do not replace human success-rate targets in `Game Play Map.md`.

### 5.5 Strategy advantage gate

For each standard round, in addition to survival:

- Strong profile median elapsed time must exceed unattended by at least `20s`, unless both already reach the 180-second boundary and survival/lives separates them.
- Strong profile median served count must be at least `10%` higher, or median lives at completion at least `3` higher.
- The profile must use the mechanic named in the round profile. A generic omniscient dispatcher may remain an upper-bound diagnostic but cannot be the sole acceptance comparator.

### 5.6 Economy gates

These are provisional defaults and require owner confirmation before canonical economy changes:

- No profile ever has negative Credits or a permanent inability to purchase an intended Bronze response after failure rollback.
- Each accepted strong loadout is affordable from the modeled typical credits entering that round while retaining a reserve of `2 Credits` in Rounds 3–6 and `5 Credits` in Rounds 7–13.
- Struggling profile ending Credits: `5–30`.
- Typical profile ending Credits: `10–45`.
- Expert profile ending Credits: `25–90`.
- Typical profile purchases a relevant item in `7–11` of 13 rounds; no single power-up exceeds `40%` of all modeled purchases unless explicitly justified.
- Achievement rewards contribute no more than `30%` of typical total campaign income.
- Failure cannot earn Credits or achievements and restores exactly the checkpoint amount.

Do not tune prices and payouts simultaneously in the first economy experiment. First test price scaling against fixed payouts; change payout weights only if price-only candidates cannot meet affordability and reserve gates.

### 5.7 Human targets

Automated simulation cannot certify fun, clarity, or fairness. Preserve the human target bands in `Game Play Map.md`:

- Rounds 1–2: 80–95% first-attempt completion; 95%+ after two retries.
- Rounds 3–5: 55–80%; 80–95% after two retries.
- Rounds 6–9: 35–65%; 65–85% after two retries.
- Rounds 10–11: 25–55%; 55–80% after two retries.
- Round 13: 15–40%; 45–70% after two retries.

These become decision evidence only after enough real sessions exist; do not fabricate statistical confidence from a few family playtests.

## 6. Simulation, replay, and parameter-search approach

### 6.1 Deterministic simulation clock

Use an integer `simulationTick` at 60 Hz. Derive virtual time as `virtualStartMs + simulationTick * 1000 / 60` only at the production call boundary. Schedule strategy actions by integer tick. Call `gameTick` once per 60 ticks and `animationTick` every tick. Never use wall-clock time inside a simulation realm.

### 6.2 Batch execution

The Node batch runner must:

1. Start one local test server.
2. Start a bounded number of Chromium workers; default `min(4, logical CPU count)` but allow `--workers`.
3. Create one simulation page/realm per worker.
4. Run multiple cases sequentially in that realm using a hard reset and canonical-config restore between cases.
5. Verify pre/post state hashes around every case.
6. Retry infrastructure failures once; never retry a deterministic gameplay failure.
7. Emit one compact run record per case to the aggregator, not console replay narration.

The batch runner must prove equivalence with the existing disposable-iframe runner on release seeds before replacing it as authoritative.

### 6.3 Replay format

Use versioned JSON:

```json
{
  "schemaVersion": 1,
  "commit": "...",
  "balanceVersion": "...",
  "balanceHash": "...",
  "round": 9,
  "environmentSeed": 9090,
  "automationSeed": 1597463007,
  "strategy": { "id": "r9-rooftop-response", "version": 1, "hash": "..." },
  "loadout": [{ "id": "freshener", "tier": 1 }],
  "overrides": {},
  "actions": [{ "tick": 720, "type": "target", "lift": 2, "floor": 14 }],
  "terminalHash": "...",
  "metricHash": "..."
}
```

Record only player/controller actions. Environment events are regenerated from seed and verified by the terminal hash. For a determinism mismatch, an optional diagnostic replay may include compact environment-event hashes every simulated second.

### 6.4 Seed sets

Create and freeze:

- `golden`: the existing mechanic seeds (`1234`, `3141`, `6060`, `7070`, `8080`, `9090`, `1111`, `1313`). Used for named regressions, never search scoring.
- `release`: `1234`, `3141`, `6060`. Used for the fast acceptance gate.
- `discovery`: 12 seeds generated once from a documented master seed. Used to compare candidates.
- `robustness`: 30 different seeds generated once from a second documented master seed. Used only after a candidate passes discovery/release.

Seed lists are committed and immutable within a balance major/minor cycle. A rejected candidate must not cause seed removal. If a seed reveals an engine bug, fix the bug and retain the seed.

### 6.5 Strategy profiles

Every strategy has an ID, integer version, description, allowed sensors, action interval, loadout, maximum manual decisions, and expected round mechanic. Required profiles:

- `all-sweep-unattended` — binding behavioral floor.
- `idle/manual-poor` — lower diagnostic bound only.
- `idealized-dispatch` — privileged upper bound only.
- `r2-sweep-manual-rescue`.
- `r3-wide-doors-roles`.
- `r4-priority-triage`.
- `r5-voting-zones`.
- `r6-jam-recovery`.
- `r7-checkout-funnel`.
- `r8-vip-reservation`.
- `r9-rooftop-stink-response`.
- `r10-custom-capacity`.
- `r11-heavy-load-double-decker`.
- `r12-endurance-resource-plan`.
- `r13-gravity-aware`.

Acceptance profiles must use production actions and inventory consumption. Privileged telemetry is allowed for target selection but must be declared. Built-in-only profiles cannot silently invoke a manual controller.

### 6.6 Search spaces

Parameter search is constrained and feasibility-first. Candidate overlays may modify only fields listed in `search-spaces.json`.

Order of search:

1. Intended solution leverage: duration, scalar, event response, automation behavior, or mechanic-specific traffic shape.
2. Arrival pressure: `spawnStart`, `spawnEnd`, scheduled burst magnitude/timing.
3. Patience/speed only if telemetry proves neither leverage nor arrival shape can meet the gate.
4. Economy after gameplay feasibility, not concurrently.

Use coarse multiplicative steps `0.80, 0.90, 1.00, 1.10, 1.20` around the canonical value. Search one primary parameter family per hypothesis. Fine `5%` steps are allowed only for a human-identified outlier after a feasible bracket exists.

### 6.7 Candidate evaluation

Use lexicographic gates, not a single opaque fitness score:

1. Reject correctness/determinism failures.
2. Reject any unattended survivor.
3. Reject strong-profile feasibility failure.
4. Reject diagnostic-timing failure.
5. Reject unaffordable loadout.
6. Among feasible candidates, prefer the smallest normalized distance from canonical values.
7. Tie-break by stronger median lives, lower p90 journey time, and fewer interventions, in that order.

The search tool must output `ACCEPTABLE`, `REJECTED_<gate>`, or `UNPROVEN_<reason>` for every candidate.

## 7. Tests to implement

### 7.1 Unit tests

- Balance schema, overlay deep merge, allowed search fields, bounds, version/hash generation.
- Seed derivation and separate environment/automation streams.
- Action schema and invalid target rejection.
- Replay encoding/decoding, stable normalization, terminal/metric hashing.
- Metric definitions, percentiles, slopes, PSI, Little's Law window, classifications.
- Candidate generation, lexicographic gates, tie-breaking, anomaly selection, stopping rules.
- Economy affordability/reserve/dominance calculations.

### 7.2 Production mechanic tests

Add independent tests for every unchecked Milestone D item in `TEST_PLAN.md`. Each test must invoke production behavior and fail if the feature is absent. Include activation and expiry where relevant.

### 7.3 Integration tests

- New batch runner equals legacy isolated runner on release seeds and profiles.
- Sequential cases in one worker do not leak Registry, Config, inventory, telemetry, or PRNG state.
- Replay equals controller-driven terminal hash.
- Environment outcomes do not change when controller randomness consumption changes.
- Candidate overlay never mutates canonical configuration.
- Strategy actions consume real inventory and obey unlock/capacity/target rules.
- Event-specific strategies actually encounter and respond to their named event.
- Custom automation timeout terminates worker execution and leaves main page responsive.
- Blueprint consent/origin/version paths.

### 7.4 Regression/E2E tests

- Retain all current 50 tests.
- Add reset/career-state E2E.
- Add full ordinary failure/retry/success transaction.
- Add Round 12 payout/progression replay.
- Add one custom-worker timeout and recovery browser test.
- Keep full Monkey campaign as the final gate; create a shorter smoke tag for intermediate stages.

### 7.5 Statistical/robustness tests

- Release 3-seed gate on every candidate surviving discovery.
- 30-seed robustness gate only on feasible finalists.
- Compare candidate vs canonical using paired seeds.
- Report median and p10/p90 rather than only means.
- Do not claim population confidence intervals from deterministic sampled seeds; label results as sampled robustness.
- Record every anomalous seed and replay the smallest diagnostic set.

## 8. Telemetry and compact reporting

### 8.1 Run record

Each case returns one normalized record. Do not return per-second samples to the implementation agent unless the case is anomalous. The record contains metadata, aggregate metrics, classification, gate failures, action counts, loadout cost, and hashes.

### 8.2 Search summary

`summary.json` must contain:

- Run ID, commit, dirty-worktree flag, Node/Chromium versions.
- Balance version/hash, search-space hash, strategy hashes, seed-set hashes.
- Candidate counts: generated, executed, rejected by each gate, feasible.
- Best feasible candidate per round/band.
- Canonical-vs-candidate aggregate deltas.
- Completion reason/stopping rule.

`summary.md` is limited to:

- One campaign table.
- One candidate-decision table.
- At most ten anomaly rows.
- A short recommended action.

### 8.3 Anomaly selection

Write replays only for:

- Any determinism/hash mismatch.
- Any unattended survivor.
- Any strong-profile death in an otherwise feasible candidate.
- Earliest death, latest death, worst p90 journey, lowest PSI, and largest paired regression per round.
- Any invalid state or timeout.

Deduplicate overlaps and cap normal search output at three anomaly replays per round plus all correctness failures. Raw detailed logs remain temporary CI artifacts and are not committed.

### 8.4 Console output

During execution print progress every completed candidate or 30 seconds, whichever comes first. Final console output must be fewer than 100 lines and point to artifact paths. The implementation agent should reason over `summary.md`, `summary.json`, and `anomalies.json`, not individual replay logs.

## 9. Implementation sequence and checkpoints

### Stage 0 — Baseline and authority

1. Read this document, `Lift-Operator_GDD.md`, `Game Play Map.md`, `Game Economy.md`, and `CURRENT_IMPLEMENTATION.md`.
2. Confirm clean baseline and run existing gates.
3. Record baseline duration and hashes.

Commands:

```powershell
git status --short
npm.cmd test
npm.cmd run balance:matrix
npm.cmd run balance:envelope
npm.cmd run balance:report:check
```

Checkpoint: no implementation begins until the current 50-test suite passes and committed reports validate.

### Stage 1 — Correctness debt and fast test tiers

1. Add `test:unit`, `test:mechanics`, `test:integration`, `test:smoke`, `test:full` scripts.
2. Implement reset/career test, remaining mechanic tests, UTF-8 validation, canonical-consumer validation.
3. Implement blueprint origin/consent and automation timeout containment before late custom profiles.

Required commands after adding scripts:

```powershell
npm.cmd run test:unit
npm.cmd run test:mechanics
npm.cmd run test:integration
npm.cmd run test:smoke
npm.cmd run test:utf8
```

Checkpoint: all Milestones A–D correctness items needed by balance are checked; no balance value changed.

### Stage 2 — Deterministic batch kernel and replay

1. Add integer-tick stepping and normalized terminal snapshot.
2. Add batch-local reset/restore contract.
3. Add action recording/replay and seed sets.
4. Prove legacy/new runner equivalence.

Commands:

```powershell
npm.cmd run sim:repro -- --round 3 --profile all-sweep-unattended --seeds release --repeat 3
npm.cmd run sim:replay -- --record tests/fixtures/replays/r3-sweep-1234.json
npm.cmd run test:integration -- --grep "batch|replay|isolation"
```

Checkpoint: three repeat runs and recorded replay have identical hashes; batch state is clean between cases.

### Stage 3 — Metrics and compact reporting

1. Implement pure aggregate metrics and windowed telemetry.
2. Implement summary/anomaly writers and validators.
3. Backfill the current all-Sweep/envelope reports through the new pipeline and compare classifications.

Commands:

```powershell
npm.cmd run sim:matrix -- --profiles all-sweep-unattended --seeds release
npm.cmd run balance:summarize -- --input reports/balance/<run-id>/runs.jsonl
npm.cmd run balance:report:check
```

Checkpoint: classification differences from current reports are explained and approved; compact output stays within the reporting caps.

### Stage 4 — Round-specific competent profiles

Implement profiles in order: R2, R7, R8, R9, R10, R11, R13. Preserve accepted R3–6 and R12 profiles.

Commands:

```powershell
npm.cmd run sim:matrix -- --profiles all-sweep-unattended,strong --seeds discovery
npm.cmd run sim:repro -- --seeds release --repeat 3
```

Checkpoint per profile: named mechanic is exercised; action/loadout budget is auditable; profile outperforms Sweep; no production balance changes yet. If it cannot outperform Sweep at canonical settings, classify the round `SOLUTION_LEVERAGE_REQUIRED` rather than immediately lowering traffic.

### Stage 5 — Automated search: Round 2

Search manual-rescue leverage/traffic shape first, then limited arrival pressure. Preserve novice behavior and the no-power-up constraint.

```powershell
npm.cmd run balance:search -- --rounds 2 --space r2-accessibility --seeds discovery
npm.cmd run balance:gate -- --candidate reports/balance/<run-id>/best-candidate.json --seeds release
npm.cmd run balance:robustness -- --candidate reports/balance/<run-id>/best-candidate.json --seeds robustness
```

Checkpoint: exact R2 release and robustness thresholds in Section 5 pass. Only then propose a canonical balance update.

### Stage 6 — Automated search: late campaign

Work in bounded bands and commit/checkpoint after each accepted band:

1. R7–9 event profiles and solution leverage.
2. R10–11 custom/capacity/weight profiles.
3. R13 gravity profile.
4. Revalidate frozen R3–6 and R12 after each accepted batch.

Checkpoint: each standard round is Contested; no unattended survivors; strong robustness ≥80%; no diagnostic-too-early failure.

### Stage 7 — Economy feasibility

1. Attach loadout cost to every accepted strong profile.
2. Run fixed-payout price candidates first.
3. If necessary, run a separate payout-family experiment.
4. Update `Game Economy.md` and canonical data together for an accepted version.

```powershell
npm.cmd run economy:search -- --profiles tests/economy-scenarios.json
npm.cmd run test:economy
npm.cmd run balance:gate -- --include-economy
```

Checkpoint: affordability, reserve, ending-credit, dominance, and rollback gates pass.

### Stage 8 — Canonical promotion and whole-campaign verification

Promotion is an explicit command, never a side effect of search:

```powershell
npm.cmd run balance:promote -- --candidate reports/balance/<run-id>/best-candidate.json
npm.cmd run balance:generate
npm.cmd run balance:check
npm.cmd run sim:matrix -- --profiles all-sweep-unattended,strong --seeds release
npm.cmd run balance:report:check
npm.cmd run test:full
```

Promotion must update `balanceVersion`, canonical JSON, generated artifact, accepted reports, Game Play Map, Game Economy, CURRENT_IMPLEMENTATION, and the changelog section of this plan.

Checkpoint: clean worktree except intended files, all tests pass, report hashes match, and the Monkey completes all 13 rounds.

### Stage 9 — Human campaign and outliers

Run the short human protocol later when results are available. Do not block infrastructure work waiting for it. Reopen only rounds identified by human evidence or a broken automated gate.

## 10. Risks, assumptions, dependencies, and owner decisions

### 10.1 Risks

- **Simulator drift:** a faster runner may stop invoking production behavior. Mitigation: legacy/new paired equivalence and production-path integration tests.
- **Seed overfitting:** repeated adjustment to three seeds may create brittle balance. Mitigation: separate discovery/release/robustness sets and paired reports.
- **Comparator theater:** an idealized strategy may “prove” feasibility without expressing player intent. Mitigation: round-specific named-mechanic profiles are required for acceptance.
- **Search explosion:** too many parameters multiply runs and implementation cost. Mitigation: one hypothesis/parameter family, coarse grid, lexicographic early rejection, hard run budgets.
- **Telemetry distortion:** cumulative/non-stationary Little's Law values can mislead. Mitigation: windowed diagnostics and no direct tuning objective.
- **Economy/gameplay coupling:** simultaneous price, payout, pressure, and power changes obscure causality. Mitigation: staged families and frozen values.
- **Custom automation reliability:** main-thread `new Function` can freeze late-round tests. Mitigation: deadline isolation before custom comparators.
- **Legacy globals:** compatibility fields may hide duplicate numerical sources. Mitigation: canonical-consumer validation before promotion.
- **Encoding churn:** repository mojibake can make broad rewrites noisy. Mitigation: first-party UTF-8 validator and scoped conversions.

### 10.2 Assumptions

- Node.js 24 and npm remain available; `npm.cmd` is required because PowerShell script execution may block `npm.ps1`.
- Playwright Chromium remains the authoritative browser runtime.
- Direct pushes to `master` remain the repository workflow unless the owner changes it.
- Three release seeds remain the fast gate; 30 robustness seeds are acceptable runtime for finalists only.
- Existing accepted R3–6 and R12 values remain frozen absent contradictory evidence.
- Human playtest results will arrive asynchronously and can reopen a stopped round.

### 10.3 Decisions requiring owner input

The implementation agent must request a decision before canonical promotion if any of these remain unresolved:

1. **Owner decision (18 July 2026):** Accept the provisional economy ending-credit bands and reserves in Section 5.6 for the current promotion/search gate. Revisit after human economy evidence.
2. **Owner decision (18 July 2026):** Round 10 custom automation is optional for the accepted strong profile, but must provide a measurable advantage over a comparable built-in profile. Future rounds may make custom automation necessary.
3. Confirm whether the full 30-seed invariant is strictly `0/30` unattended survivors. Default: yes, because the stated design rule is absolute.
4. Confirm whether direct `master` commits should continue. Default: follow the current established workflow.
5. If worker isolation materially changes browser support or deployment simplicity, choose Web Worker versus constrained interpreter. Default: Web Worker with a strict deadline and immutable sensor/action messages.

No owner input is needed to build the harness, replay, metrics, tests, or exploratory search. Input is required only before promoting a candidate affected by these decisions.

## 11. Automated tuning stopping rules

Search must terminate when the first applicable rule fires:

1. **Feasible found:** first candidate passes discovery, release, robustness, strategy, timing, and affordability gates. Stop; do not optimize further.
2. **Run budget:** default maximum `60` candidates per round hypothesis, `20` for a band, or `2,000` total simulated cases per invocation. Stop with `BUDGET_EXHAUSTED`.
3. **Wall time:** default `30 minutes` per search command. Stop cleanly with resumable manifest.
4. **No progress:** three consecutive coarse levels fail the same gate without improving its primary metric by at least `10%`. Stop with `SOLUTION_LEVERAGE_REQUIRED` or `COMPARATOR_REQUIRED`.
5. **Invariant conflict:** any pressure reduction creates an unattended survivor before strong feasibility is reached. Reject that branch; do not continue reducing generic pressure.
6. **Boundary reached:** candidate hits an allowed parameter bound. Stop that branch; do not silently widen the search space.
7. **Determinism failure:** stop the entire search immediately and emit replay/anomaly artifacts.
8. **Mechanic bug:** invalid state, unavoidable event combination, or production exception stops the affected round search until corrected.
9. **Passing round:** never reopen a passing round for a better score without human evidence, a mechanic change, an economy change, or a broken regression gate.
10. **Human override:** explicit playtest evidence may reopen a stopped round with one documented hypothesis and one primary parameter family.

## 12. Exact validation commands and completion criteria

### Commands available at baseline

```powershell
$env:PATH = 'C:\Program Files\nodejs;' + $env:PATH
npm.cmd run test:syntax
npm.cmd run test:config
npm.cmd run balance:check
npm.cmd run test:economy
npm.cmd run balance:report:check
npm.cmd run test:lifecycle
npm.cmd run test:e2e
npm.cmd test
```

### Commands the implementation must add

```powershell
npm.cmd run test:unit
npm.cmd run test:mechanics
npm.cmd run test:integration
npm.cmd run test:smoke
npm.cmd run test:full
npm.cmd run test:utf8
npm.cmd run sim:matrix -- --profiles all-sweep-unattended,strong --seeds release
npm.cmd run sim:repro -- --seeds release --repeat 3
npm.cmd run sim:replay -- --record <replay.json>
npm.cmd run balance:search -- --rounds <list> --space <id> --seeds discovery
npm.cmd run balance:gate -- --candidate <candidate.json> --seeds release
npm.cmd run balance:robustness -- --candidate <candidate.json> --seeds robustness
npm.cmd run economy:search
npm.cmd run balance:promote -- --candidate <candidate.json>
```

### Definition of complete

The remaining implementation program is complete when:

- All baseline and newly added tests pass from a clean checkout.
- Simulation batch/replay is deterministic and faster than the current per-run iframe path by at least `3×` on the same 36-run matrix, without changing normalized outcomes.
- Every standard round from 2–11 and 13 is Contested under release and robustness gates.
- Round 12 passes per-seed and distributional 4–8-minute gates.
- Every accepted strong profile is mechanic-specific, auditable, and affordable.
- Economy gates pass using owner-confirmed bands.
- Canonical JSON is the only balance source and generated/runtime parity is enforced.
- Search outputs are compact; anomalous replays reproduce exactly.
- Reset, mechanics, blueprint consent, automation timeout, and UTF-8 gaps are closed.
- `npm.cmd run test:full` includes the complete Monkey campaign and passes.
- Game Play Map, Game Economy, CURRENT_IMPLEMENTATION, reports, and balance version match the accepted implementation.

## 13. Critical review: ambiguity and unintended-decision guardrails

The next agent must not make these unintended decisions:

- Do not add mechanics to solve balance.
- Do not expose telemetry or PSI to players or current automation.
- Do not make built-in Hands-Free eligible.
- Do not treat Endurance death as failure/retry.
- Do not carry failed-attempt inventory, earnings, or achievement progress.
- Do not tune around a weak comparator or interpret Monkey success as balance evidence.
- Do not lower late-round traffic uniformly; that experiment already failed.
- Do not promote a candidate merely because averages pass; apply per-seed gates and anomalies.
- Do not delete difficult seeds.
- Do not change search thresholds during a run.
- Do not edit canonical configuration during exploration.
- Do not commit raw replay floods.
- Do not pursue enterprise-grade security; do prevent accidental freezes and corrupt state.

Known areas still requiring judgment are explicitly limited to Section 10.3. The strongest ambiguity is economy: current deterministic paths end with 81/99/174 Credits, clearly inflationary, but final desirable reserves have not been human-tested. The provisional bands make the search executable while requiring owner confirmation before promotion.

The second ambiguity is custom automation's role in Round 10. Design intent says customization should become strategically meaningful, not necessarily compulsory. The default plan therefore requires a custom profile to outperform a comparable built-in profile but also preserves at least one non-custom viable solution where possible.

The third ambiguity is the absolute all-Sweep invariant versus novice Round 2 accessibility. The plan resolves this by searching solution leverage and traffic shape before raw pressure, requiring late unattended failure and low-intervention hybrid success. If no candidate satisfies both within the run budget, stop and request a design decision; do not silently choose difficulty or autoplay.

Finally, exact simulator success cannot establish the human completion bands. Automated gates prove feasibility, behavioral separation, reproducibility, and gross pacing. Human evidence remains the authority for fun, legibility, and final outlier correction.

## 14. Handoff status and accepted-change log

### Playtest remediation plan: Round 13 stalled lifts

Before changing Round 13 pressure or gravity values:

1. Add a deterministic production-path regression that starts an empty and occupied Round 13 lift at every adjacent
   floor pair, advances integer simulation ticks, and asserts that it reaches a quantized floor or remains explicitly
   in a documented transition state—never an unclassified between-floor stall.
2. Instrument lift state transitions (`TRANSIT`, door opening/closing, `BOARDING`, `IDLE`, jammed) with stable
   reason codes and assert that a jammed lift cannot board, cannot silently self-repair, and cannot move unless the
   documented repair/effect path permits it.
3. Test gravity independently at zero, partial, and full load, including upward and downward travel, with a safety
   floor on effective speed and a bounded arrival tolerance.
4. Test Turbo/rocket effects at the top floor and confirm that modifiers alter travel speed only; they must not alter
   legal floor bounds or destination routing.
5. Verify that effect icon rendering is derived from active timers and removes expired effects rather than appending
   duplicates.
6. Re-run the Round 13 release and robustness seeds only after these correctness tests pass. Do not tune gravity or
   traffic to mask a transition bug.

Acceptance: no empty or occupied lift stalls between floors for more than one simulation tick; jammed lifts obey one
consistent movement/boarding contract; top-floor access is unchanged by Turbo; and effect icons match active state.

Initial diagnostic implementation completed 18 July 2026: jammed lifts are stopped in both game and animation ticks;
Round 13 empty-lift gravity/Turbo top-floor coverage passes; repeated effect icons are deduplicated and use the
simulation clock when available. Remaining full-campaign verification is still required before treating the issue as
closed.

Playtest follow-up `0.2.5-clarity-endurance-gravity-debug`: earned Credits use a 0.1 multiplier with prices unchanged;
party guests cannot board until release; jam maximum is 20 seconds; Gym Bros persist in Rounds 11–13; and the Gym
Floor is rendered with the flex symbol.

The subsequent full panel produced one transient Protocol Beta kill-switch failure; isolated rerun passed immediately.
Owner accepted this as a pass for playtesting, with no reproducible production failure identified.

Playtest follow-up `0.2.5-clarity-endurance-gravity-debug`: Endurance earned Credits use a 0.6 multiplier; Round 13
gravity is reduced 30%; debug lift overrides support 1-10 lifts; countdown duration is 3 seconds per lift with a
5-second minimum; Check-out Challenge uses a suitcase floor marker; and modal/countdown and notification wording are
being clarified.

| Date | Commit/balance | Decision |
| --- | --- | --- |
| 18 July 2026 | `f10f135` / `0.2.2-round-2-accessibility` | Handoff baseline. R2 Underloaded; R3–6 Contested; R7–11/13 Overloaded; R12 within Endurance window. No implementation or balance changes made during handoff preparation. |

| 18 July 2026 | `02efb44` / `0.2.2-round-2-accessibility` | Owner accepted provisional economy bands/reserves for now; Round 10 custom automation is optional but must show measurable advantage. Future rounds may require custom automation. |

| 18 July 2026 | `0.2.3-r2-capacity-playtest` | Playtest tuning: lift capacity 15 in Rounds 1–3 only; Round 2 final spawn rate reduced 10% (`0.52` → `0.468`). No other balance parameters changed. |

Append one row only when a candidate is canonically promoted or a plan-level owner decision changes an acceptance gate. Exploratory candidates belong in generated search summaries, not this log.

## 15. Approved audio implementation plan (partially implemented)

Audio is a post-stabilization feedback workstream. It must preserve the game's 90s arcade/chiptune character while remaining strictly observational: playback must never change engine state, simulation results, RNG, timers, guest or lift behaviour, economy, or automation decisions.

Implementation checkpoint: the event-bus-compatible service, context handling, Leaderboard controls, selected menu
track, gameplay/pressure loops, victory fanfare, elevator cue, local asset register, manifest, attribution, and
focused Chromium browser tests are implemented. The reviewed power-up, hazard, guest, UI, VIP, and rooftop mappings
are locally imported and gameplay producers publish semantic events for their authoritative transitions. Rooftop
lifecycle protection, non-restarting PSI pressure updates, fallback pulse suppression, event throttling, and
production manifest mapping coverage are also implemented. The work
is not complete: the outstanding risks and acceptance gaps are recorded in Section 15.6.

Audio asset review update: `assets/audio/audio-review.csv` has been normalized into a source-of-truth register with
explicit `verified`, `pending`, and `blocked` statuses. The locally imported set now includes Rocket Launch (CC-BY
3.0, mapped to Turbo), and CC0 assets for Rooftop, Musak, TARDIS, Wide Doors, and Stink. Source URLs, authors,
modification notes, and attribution requirements are recorded in the schema-version-2 manifest and
`assets/audio/ATTRIBUTION.md`. Pixabay candidates for Freshener and Group Think are licence-verified and locally
imported. The register now has a local file for every listed source row; GPL/CC-BY attribution requirements are
recorded in the manifest and credits.

Gameplay wiring update: `engine-spawner.js`, `engine-physics.js`, and `ui-shop.js` now publish VIP/rooftop lifecycle,
hazard end, urgency, refusal, and purchase events. `audio.js` handles the `ui_error` alias, semantic fallback routing,
and rooftop loop start/stop. Focused audio coverage now passes 22/22, including rooftop lifecycle, production
lifecycle, authoritative guest refusal, and state-invariance contract tests for
the new event catalogue. Smoke, syntax, configuration, and UTF-8 gates also pass.

### 15.1 Boundary and architecture

1. Implemented: production publishes named, payload-light events through the `AudioEventBus` boundary; the simulator installs a no-op adapter. The engine does not wait for, inspect, or recover from playback.
2. Implemented: source modules publish semantic events (`lift_arrived`, `guest_boarded`, `hazard_started`, `powerup_used`, and the documented guest/UI/event transitions), not filenames, gain, pitch, or Web Audio details.
3. Partial: the browser audio service owns Web Audio unlock/resume, asset loading, buses, context changes, and basic
event throttling. Full deduplication and complete context teardown remain open as listed in Section 15.6. Do not
create one audio context per event.
4. Implemented: the checked-in asset manifest and attribution record contain source URLs, authors, licences, modification notes, and required attribution text for the reviewed local assets. Prefer CC0 or CC BY. Do not use NC or ND assets where distribution or modification would be restricted.
5. Partial: procedural fallback remains available for failed or unsupported assets; it must remain bounded and must not grow into a second production sound system.

### 15.2 Soundscape and event catalogue

- Gameplay uses one seamless adaptive loop with independent layers. Pressure raises tempo and/or layers smoothly; recovery removes intensity gradually. There are no track jumps on individual PSI samples.
- Menus, briefing, shop, leaderboard, pause, and mid-game modal pauses use quiet neutral music. Pausing gameplay swaps or ducks the gameplay mix; it does not leave intense gameplay music running behind a modal.
- Victory plays a distinct fanfare. Failure/retry, round start/countdown, and teardown must have explicit, non-overlapping context rules.
- Provide recognizable unique effects for core lift/guest lifecycle actions and for **every** power-up and hazard. The final mapping is discovered and recorded in the manifest before implementation; it must not rely on generic placeholder sounds for two different power-ups or hazards.
- Candidate core effects include lift arrival/door/boarding/alighting, successful and refused boarding, urgency, jam start/end, stink start/end, rooftop party start/release, VIP arrival, purchase, and UI confirmation/error.

### 15.3 PSI and adaptive mapping

PSI is permitted only as an internal read-only control signal for the music service. It remains developer-only: never render it, expose it to ordinary automation, add it to player saves, or use it to change game difficulty. Use bounded, smoothed thresholds/hysteresis so a noisy value cannot produce audible pumping. Round 12, which has no remaining-time PSI, must use a documented fallback pressure mapping or a stable default layer state.

### 15.4 Controls, accessibility, and attribution

- Put compact controls on the Leaderboard modal: mute, Music volume, and SFX volume. Persist preferences locally; default safely until a user gesture unlocks audio.
- Respect browser autoplay restrictions. A failed decode, unsupported codec, blocked context, or unavailable audio device must leave the game fully playable and must not produce console-error loops.
- Support current Chromium, Safari/WebKit, and mobile-sized interaction targets. Use conservative, widely supported Web Audio APIs and test touch/first-gesture unlock and context resume.
- The Leaderboard includes a subtle side-scrolling attribution line and a readable, non-prominent Audio Credits section. The latter is the accessible source of truth; the scroller is supplementary. Keep matching attribution in the checked-in manifest and documentation.

### 15.5 Delivery sequence and test gates

1. Inventory CC0/CC BY chiptune assets and document candidates, license evidence, formats, sizes, and fallback.
2. Define the event catalogue and manifest, then add a no-op-capable event bus and unit coverage before wiring production emitters.
3. Implement user-gesture-safe mixer/context handling and the quiet menu/modal loop.
4. Add the layered gameplay loop with PSI smoothing and the victory fanfare; then map core effects, each power-up, and each hazard.
5. Add Leaderboard controls and both attribution presentations; verify no visual prominence or modal-layout harm.
6. Run unit/integration/browser coverage for event routing, reset/teardown, context transitions, asset failure, first gesture, persistence, Chromium, WebKit/Safari, and mobile layouts. Run the full existing panel to prove audio remains simulation-neutral.

Completion requires all listed audio tests to pass, an attribution-complete manifest, graceful no-audio operation, and no regression of deterministic simulation or player-facing telemetry boundaries.

### 15.6 Current implementation gaps

These are active gaps, not abandoned requirements. Items already resolved in the current implementation are recorded
first so they are not mistaken for outstanding work.

Playtest readiness: the audio workstream is cleared for desktop Chromium/WebKit playtesting. The event boundary,
production guest identity propagation, lifecycle/source cleanup, modal context switching, asset failure fallback, and
manifest mapping checks are implemented. Playtesting should still record browser/device, whether audio unlocked after
the first gesture, whether any console errors appeared, and whether music/effects overlap across victory, retry, and
pause flows.

Resolved in the current implementation:

- Rooftop music remains active across PSI updates and context refreshes while the rooftop event is active.
- PSI updates adjust the pressure layer without restarting music, and procedural pulses are limited to no-asset fallback.
- Urgency/refusal playback has basic bounded throttling.
- The manifest records production power-up/hazard mappings and the focused test checks those mappings instead of stale
  provisional filenames.
- Round start/countdown, pause/resume, failure, retry, reset, and round-completion semantic events are wired and have
  focused production-transition coverage.
- Spawner VIP/rooftop transitions, hazard recovery, and shop purchase confirmation are exercised through production
  functions rather than only by manually publishing event names.
- PSI hysteresis, decoded-buffer failure status, and explicit audio teardown are implemented and covered.
- Deterministic failed-fetch/invalid-decode, mute, and context-source cleanup cases are covered; unsupported browser
  codecs, unavailable devices, and suspended-context recovery remain environment-dependent gaps.
- The test server now returns audio-specific MIME types (`audio/mpeg`, `audio/ogg`, and `audio/wav`), and teardown
  bounds a pending `AudioContext.close()` call so Safari/WebKit cleanup cannot block indefinitely.
- Playwright output now uses the operating-system temporary directory instead of the OneDrive reparse-point
  `test-results/` directory. This restores normal execution; the focused Chromium and WebKit audio suites both pass
  22/22.
- The guest refusal path is covered from a controlled `BOARDING` frame through the production `animationTick` state
  machine, rather than by manually publishing `guest_refused`.
- Leaderboard modal acceptance verifies that gameplay music sources are stopped while the menu context is active and
  gameplay context is restored on close in both Chromium and WebKit.
- Reset acceptance verifies that a prior round's rooftop and gameplay sources are cleared before retry/round
  reinitialization in both Chromium and WebKit.
- Identity-aware urgency throttling acceptance verifies that duplicate same-guest cues are suppressed while distinct
  guest cues are preserved under concurrent publication.

High priority:

- Keep extending real-flow coverage as new producers are added. VIP, rooftop, hazard, shop, urgency, refusal, UI error,
  victory, and core lifecycle transitions are now covered through production functions.
- Complete the context-mix rules and acceptance coverage for retry, victory, and teardown so sources cannot leak or
  overlap across lifecycle boundaries. Leaderboard modal pause/open/close and reset/retry source cleanup are covered;
  playtesting should confirm victory and teardown on an audio-capable device.
- Reset clears prior-round rooftop and gameplay sources before retry/round reinitialization.

Medium priority:

- Identity-aware throttling is covered for duplicate and distinct guest cues; broader high-volume load profiling remains
  optional acceptance work rather than a known correctness gap.

Testing gaps:

- Test failed fetch/decode, unsupported codecs, unavailable audio devices, suspended contexts, and first-gesture
  unlock without console-error loops or gameplay failure. Deterministic failed-fetch and invalid-decode cases are
  covered; codec, device, suspended-context, and first-gesture acceptance remain open.
- Test independent volume changes while one-shot effects, gameplay music, and rooftop music are active; mute and
  leaderboard modal source cleanup are covered, but retry/victory/teardown overlap acceptance remains open.
- Test reset, retry, modal pause, victory, context transitions, and source cleanup for leaks or overlapping tracks.
- Run the audio acceptance suite on Chromium, WebKit/Safari, and mobile-sized layouts; HTTP asset availability alone
  is insufficient evidence of successful decoding. Chromium and WebKit suites now pass; mobile-sized interaction and
  real-device audio acceptance remain playtest follow-up checks, not blockers for desktop playtesting.
- Production mapping availability is now asserted against the manifest; legacy files are not used as evidence for
  current audio wiring.

## 16. Historical R14–R20 and Service Zoning proposal

This proposal predates the implemented R14–R20 structural foundation. Its later implementation-status addendum records
what was built; the active delivery boundary and evidence now live in `DELIVERY_PLAN.md` and `TEST_PLAN.md`.

### 16.1 Structural scope

The extension increases scale before traffic tuning:

| Round | Floors | Lifts | Structural purpose |
| --- | ---: | ---: | --- |
| 14 | 20 | 5 | Introduce direct local service zones |
| 15 | 20 | 6 | Combine VIP and Rooftop Party |
| 16 | 20 | 6 | Combine zoning with jam/stink recovery |
| 17 | 25 | 6 | Checkout/special-floor concentration |
| 18 | 25 | 7 | Rooftop, VIP, Gym Bros, and stink combination |
| 19 | 30 | 8 | Large-fleet Workshop advantage |
| 20 | 30 | 10 | Full direct-service fleet architecture |

The current screen renders approximately seven lifts comfortably. R14–R18 must remain usable within that limit;
R19–R20 require an intentional large-fleet presentation (prefer horizontal fleet scrolling with readable shafts and
sticky floor labels). Twenty floors is the initial vertical target; 25 and 30 floors are late-round scale targets.

### 16.2 Service Zoning boundary

Service Zoning is a Workshop-configured, direct single-lift service range. Each zoned lift has inclusive lower and
upper bounds. G is an ordinary serviced floor within the range, not a transfer hub; including G supports real-world
operation and Room Service/Checkout journeys that begin or end at the lobby.

The authoritative production predicate must be shared by live boarding, simulation, built-in automation, custom
automation, refusal messaging, and Review diagnostics:

```text
canLiftDirectlyServe(lift, originFloor, destinationFloor)
```

The predicate is true only when both floors are inside the lift’s range and all existing capacity, direction, VIP,
party, Gym Bro, jam, stink, and patience rules also permit boarding. A guest never transfers in this release. G-hub
routing, overlapping-zone transfers, transfer patience, and arbitrary multi-lift journeys remain deferred.

Workshop requirements:

- Edit lower and upper bounds, with an optional G inclusion control.
- Preview covered and uncovered floors and direct route gaps.
- Reject invalid ranges before launch.
- Warn when no lift can directly serve a generated origin/destination pair.
- Show each lift’s zone clearly during play and explain refusals in plain language.
- Prevent manual targets and automation actions from bypassing the configured range.

Overlapping zones are allowed for resilience. Disjoint zones reduce empty travel but become vulnerable when a lift jams;
R14–R20 should use that trade-off as the intended strategic problem. Zoning must not alter guest destinations, create
hidden routing, or make an invalid fleet silently appear successful.

### 16.3 Delivery sequence

1. Audit and extend the renderer for 20 floors and 5–7 lifts; add large-fleet scrolling/compact layout for 8–10 lifts.
2. Add canonical structural definitions for R14–R20 with conservative placeholder traffic.
3. Add zone state, normalization, direct-service predicate, and unit tests.
4. Integrate zoning into live boarding, simulation, built-in policies, custom automation, and refusal/Review text.
5. Add Workshop controls and coverage validation.
6. Implement R14, validate structure, then add R15–R18 combo events one round at a time.
7. Add the 30-floor presentation and implement R19–R20 shells.
8. Extend telemetry/reporting for zone refusals, coverage gaps, empty travel, overlap utilization, and idle time caused
   by restrictive zones.
9. Tune spawn rates only after structural, routing, rendering, and simulation gates pass.

### 16.4 Extension acceptance gates

- Existing R1–R13 behavior and golden seeds remain unchanged.
- Every new round initializes, resets, retries, simulates, and reviews deterministically.
- Valid direct routes do not strand guests; intentional zone gaps fail visibly and are reported.
- Built-in automation respects zones and cannot win unattended by default.
- Custom automation cannot issue out-of-zone actions.
- At least manual/hybrid, built-in-plus-loadout, and custom Workshop solution classes remain viable where practical.
- 20/25/30 floors and 5–10 lifts render and remain interactive at desktop, tablet, and mobile sizes.
- No lift, guest, power-up, zone badge, or floor label produces unbounded DOM growth.

### 16.5 Implementation status (19 July 2026)

The R14-R20 structural definitions, 20/25/30-floor factory layouts, 5-10 lift rendering baseline, direct-service
zone predicate, live boarding enforcement, automation target enforcement, and Workshop lower/upper range controls
are implemented. Floor 0 remains the G service floor when included in a range; transfers and G-hub routing remain
deferred. Spawn-rate tuning, coverage-gap telemetry, overlap diagnostics, and full cross-device visual validation
remain playtest work.

## 17. Playtest remediation plan — Debug access, checkout clarity, and late-round pacing

This plan records the clarified playtest feedback received on 20 July 2026. It is an implementation and evidence
plan only; no code or canonical balance values are changed by documenting it.

### 17.1 Scope and intended behavior

1. **Debug Warp coverage:** Warp must expose every available round, including rounds beyond Round 13. The list should
   be derived from the available round definitions rather than a hard-coded upper bound. This is a testability
   requirement, not a player-facing progression unlock.
2. **Checkout Challenge destination marker:** Only checkout guests whose destination is floor G use a suitcase icon.
   Other guest types and checkout destinations retain their existing indicators.
3. **Room Service layout:** Room Service icons are too wide. Reduce their displayed horizontal width by 30% while
   leaving their displayed height unchanged, then verify that the revised width does not cause UI overlap.
4. **Rocket duration:** The intended effective duration is 10 seconds. Verify the configured timer, gameplay effect,
   visible icon/effect lifetime, expiry, and reset behavior. A perceived 3–4 second duration is a defect until explained.
5. **Rooftop bar event:** This is the defining event of its round. It should begin at an unpredictable time and remain
   active for a long duration, approximately at least half of the round where the round model permits it. On release,
   guests should create a large but readable return wave from floor 14 to their rooms. Start-time randomness must be
   seeded for simulation and reproducible test cases, while remaining unpredictable to the player.
6. **Round 13 affordability and pressure:** Increase Credits awarded in the preceding Endurance round so the intended
   Round 13 loadout is affordable, and reduce the relevant Round 13 guest spawn rates by 20%. Apply the reduction to
   canonical spawn-rate inputs, not a hidden runtime multiplier. Exact payout and affected fields require a candidate.
7. **Stink as discretion:** Stink is an intentional emergency load-management tactic. It may be used to evacuate
   overloaded lifts and should remain meaningful, provided it does not corrupt lift state, bypass objectives, or make
   the intended Round 13 challenge irrelevant.

### 17.2 Delivery sequence

1. Add production-path Debug Warp coverage for all registered/available rounds.
2. Correct destination-sensitive checkout rendering and Room Service horizontal layout.
3. Add rocket timer/effect lifecycle tests and reproduce the Round 7 observation with a fixed seed.
4. Implement a seeded rooftop event schedule with a long active window and a release surge; verify live play and
   isolated simulation.
5. Create a Round 13 balance candidate containing the preceding-Endurance payout increase and 20% spawn-rate
   reduction. Do not edit canonical values during exploration.
6. Run mechanic, lifecycle, economy, deterministic campaign, and human playtest gates before promotion.

### 17.3 Acceptance and test gates

- Debug Warp lists every available round and can start each one without changing normal unlock/progression state.
- Ground-floor checkout guests render suitcase icons; non-ground-floor checkout guests do not.
- Room Service icon rendered width is 70% of the prior value, with unchanged height and no layout collision.
- Rocket effects remain active for 10.0 seconds within documented tolerance, expire once, and leave no duplicate/stale
  icons. Test empty/occupied lifts, top-floor use, pause/resume, retry, and round reset.
- At least three seeded rooftop schedules produce different player-visible start times while replaying identically for
  the same seed. The active window lasts at least half of the round's intended event span, and release produces a
  substantial return queue without invalid destinations or deadlock.
- The Round 13 candidate makes required mechanics, deodoriser, and rockets affordable under the intended prior-round
  payout path, with a documented reserve policy. Verify struggling, typical, and expert economy scenarios.
- The 20% spawn reduction is visible in canonical/generated balance parity and does not alter unrelated rounds.
- On accepted Round 13 seeds, supported play survives the intended objective while unattended Sweep remains below the
  campaign's unattended threshold unless the owner explicitly revises that gate.
- A controlled stink-use comparator can relieve an overloaded lift and improve recovery metrics, but cannot win by
  bypassing the round objective or leave invalid guest/lift state.
- Full regression passes lifecycle, config, generated-balance, mechanics, deterministic simulation, and UI smoke
  coverage. Human playtest confirms the rooftop release wave is dramatic but manageable and Round 13 has meaningful
  loadout and discretion choices.

### 17.4 Evidence to capture

For each candidate, record commit, balance version, seeds, loadout, Credits before/after purchase, rocket observed
duration, rooftop start/end timestamps, release queue size, spawn-rate values, stink uses, lift overload/recovery
metrics, and passed/failed/skipped tests. Keep exploratory candidates and replays outside canonical data until the
owner accepts the resulting campaign behavior.

### 17.5 Implementation status — 20 July 2026

Implemented in balance `0.2.6-playtest-remediation`:

- Debug Warp now derives its Debug choices from all configured rounds, including R14–R20.
- Checkout guests carry an explicit `isCheckout` marker and only ground-floor checkout destinations render as suitcases.
- Room Service display width is 42px (70% of the prior 60px width) with unchanged 20px height.
- Rocket tier-one duration is verified at 10 seconds through production timer execution and expiry.
- Rooftop event duration is 90 seconds, with the existing seeded 30–90 second start schedule and seeded release path.
- Endurance payout multiplier is 1.0; Round 13 spawn rates are 1.20→1.40, a 20% reduction from 1.50→1.75.
- Stink behavior was not removed or weakened; it remains a valid emergency load-management tactic.

Automated evidence: syntax/config/generated-balance checks pass; lifecycle coverage passes 63/63; targeted remediation
coverage passes; mechanics coverage passes 10/10; economy simulation passes; regenerated balance reports pass with 36
matrix runs, 12 envelope classifications, and 5 documented all-Sweep violations. Human rooftop and Round 13
affordability playtest gates remain open.
