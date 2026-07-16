# Lift Operator — Stabilization Plan

**Objective:** Make the existing game reliable, data-driven, testable, and resilient enough for systematic balance iteration.  
**Scope:** Bug fixes, intent/behaviour alignment, configuration centralization, testing rigor, access gating, and script containment.  
**Out of scope:** New mechanics, rounds, themes, profiles, and online services.

## 1. Work classification

Every task should be classified as:

- **Defect:** Behaviour contradicts both implementation intent and user expectation.
- **Alignment:** Engine behaviour must change to match approved design.
- **Architecture:** Work required for reliable configuration, simulation, access gating, or execution containment.
- **Balance:** Correct behaviour produces the wrong player experience.
- **Evidence:** Testing or telemetry needed before a decision.

This prevents balance changes from hiding lifecycle defects and prevents refactors from being presented as player-facing design.

## 2. Exit criteria

Stabilization is complete when:

- Round 1–13 lifecycle is reliable through start, pause, workshop, review, shop, retry, and completion.
- A single versioned data object defines all balance parameters.
- Reset, warp, retry, normal play, and simulation use one round factory.
- Production tests invoke real behaviour and run reproducibly.
- Failed attempts cannot corrupt progression or farm currency.
- Shared automation cannot freeze the main game indefinitely.
- Production does not load development-only test files.
- A balance version and seed identify every playtest.
- The early campaign can be tuned without editing engine logic.

## 3. Phase 0 — Preserve and observe

### Deliverables

- Keep `CURRENT_IMPLEMENTATION.md` synchronized with material discoveries.
- Record known defects from `Game play notes.md` as tracked issues.
- Capture representative seeds for rounds 1–3, 6, 9, 11, and 13.
- Define a minimal telemetry export format.
- Establish UTF-8 repository conventions.

### Gate

No balance redesign is implemented until current defects can be reproduced and distinguished from tuning problems.

## 4. Phase 1 — Lifecycle correctness

### Priority defects

1. Shop close/start must not trigger duplicate round review.
2. Round evaluation must execute exactly once.
3. `roundStats` must reset at attempt start, not while still needed by UI.
4. Pause/resume must preserve guest age, event schedules, and lift state.
5. Workshop, leaderboard, debug, targeting, and manifest overlays must compose safely.
6. Death, retry, restart, warp, and next-round transitions must create clean state.
7. Average wait must record actual service wait.
8. Inventory purchases must commit exactly once.
9. Round 12 death must evaluate once, commit its Endurance payout, and automatically initialize Round 13.
10. Ordinary death must restore the previous-round point checkpoint, clear inventory/cart, preserve round/seed, and return to the shop.

### Architectural action

Introduce an explicit lifecycle state model:

```text
BOOT
BRIEFING
SHOP
PLAYING
PAUSED
ROUND_REVIEW
FAILED
CAMPAIGN_COMPLETE
```

Overlay visibility should not itself define whether the game is active.

### Gate

A deterministic E2E test completes:

```text
Round 1 start
→ play
→ review
→ shop/briefing
→ Round 2 start
→ pause/workshop/resume
→ failure
→ same-seed retry
```

with no duplicate evaluation, stale board, or currency mutation.

The failure checkpoint assertion is:

```text
points = post-previous-round points
inventory = []
cart = []
round = failed round
seed = failed attempt seed
screen = shop/briefing
runtime attempt state = fresh
```

## 5. Phase 2 — One round factory

### Problem

Reset, warp, simulation, and progression initialize overlapping but different fields.

### Target

One production path:

```js
createCampaignState(profile)
createRoundState(campaign, roundId, seed, mode)
startAttempt(roundState)
finishAttempt(outcome)
disposeAttempt()
```

### Requirements

- Lift creation has one schema.
- Round-stat creation has one schema.
- Floors, lifts, events, objectives, and unlocks come from round data.
- Simulation creates a separate state object.
- Debug warp uses the same round definition as normal progression.
- No fallback lift counts for supported rounds.

### Gate

Snapshot tests confirm normal, retry, warp, and simulation initialization produce equivalent round structures for the same inputs.

**Current status:** Passed. The shared production factory is used by normal play, retry, warp, and an isolated simulation realm.

## 6. Phase 3 — Parameter centralization

### Target schema

Move into canonical versioned data:

- Patience thresholds.
- Physics timings.
- Guest weight and service-time modifiers.
- Round duration/objective.
- Floors and lifts.
- Spawn curves.
- Hazard timing and rates.
- Mechanic and shop unlocks.
- Power-up price, scope, magnitude, and duration.
- Payout rules.
- Achievement thresholds and rewards.

### Removal rule

When a consumer moves to canonical data, remove the legacy duplicate. Do not leave compatibility aliases indefinitely.

### Generation

Add a validator and generated config artifact as described in `BALANCE_WORKFLOW.md`.

### Gate

A static scan finds no round-specific balance constants outside generated configuration, except clearly documented engine safety limits.

**Current status:** Round structure and spawn curves are canonical and versioned. Remaining system, hazard, power-up, unlock, payout, and achievement compatibility fields still require removal during the balance-data generation pass.

## 7. Phase 4 — Trustworthy testing

### Replace misleading tests

Remove or rewrite tests that:

- Assign expected state directly.
- Reimplement the same conditional they claim to test.
- Pass through manual fallback mocks.
- Depend on removed entry points.
- leak configuration between cases.

### Test pyramid

1. Pure data/schema tests.
2. Production mechanic tests.
3. Deterministic state-machine tests.
4. Isolated round simulations.
5. Critical lifecycle E2E tests.
6. Human experience playtests.

### CI

Add a reproducible command and continuous integration for:

- Syntax/lint checks.
- Schema validation.
- Unit/mechanic tests.
- Deterministic golden simulations.
- Critical Playwright lifecycle test.

### Gate

“Pass” means production behaviour was invoked and independently asserted.

**Current status:** Syntax, config validation, lifecycle Playwright tests, and the Monkey campaign are available through npm and GitHub Actions. Mechanic and golden-seed coverage remains incomplete.

## 8. Phase 5 — Debug access and automation containment

### Project intent

The project uses lightweight obfuscation to prevent accidental access, not determined access. Inspecting the source and reverse-engineering XOR manifests is welcomed as a learning outcome.

The engineering goal is to protect sessions from accidental breakage:

- Debug and Monkey modes are entered deliberately.
- Malformed manifests fail gracefully.
- Test state does not unexpectedly overwrite normal state.
- Accidental infinite loops do not freeze the game.

### Immediate containment

- Mark imported blueprints as external so the player understands their origin.
- Do not auto-execute imported code.
- Remove unrestricted loop blocks until bounded execution exists.
- Validate generated script size and allowed constructs.
- Surface compile/runtime errors to the player.

### Preferred execution model

Run automation outside the main UI thread in a Web Worker with:

- A serializable read-only sensor snapshot.
- A small action response.
- A strict execution deadline.
- Worker termination on timeout.
- No DOM or direct Registry access.
- Versioned bridge capabilities.

Longer term, consider interpreting a constrained routing language rather than executing arbitrary JavaScript.

### Manifest access gating

- Describe XOR as intentional encoding/obfuscation.
- Treat Debug and Monkey unlock as a discoverable secret door, not authentication.
- Add payload versioning and structural validation.
- Require a visible action before starting Monkey control.
- Support a matching obfuscated manifest capability for automated Playwright invocation.
- Keep curious source inspection and payload construction possible.

### Gate

An accidental infinite loop, oversized script, and malformed blueprint cannot freeze or corrupt the main game. Debug manifests either activate the intended capability or fail cleanly.

**Current status:** Interim source and payload validation rejects loops, browser globals, oversized scripts, unsupported manifests, and oversized blueprints. Worker isolation remains required for robust containment.

## 9. Phase 6 — Production packaging

### Actions

- Use local version-pinned Blockly and LZ String.
- Separate `index.html` from a debug/test entry point.
- Do not load regression files in production.
- Remove scratch files from deployment scope.
- Add a clear local-development command.
- Ensure source and docs are UTF-8.

### Gate

The production build runs without external runtime CDN dependency and exposes no test/debug surface without explicit opt-in.

**Current status:** Passed for local dependencies and test-script loading. Debug remains discoverable by design through the obfuscated manifest capability.

## 10. Phase 7 — Balance implementation

Only after earlier gates:

1. Implement the retry transaction model.
2. Implement target unlock visibility.
3. Adopt the candidate payout model.
4. Adopt candidate prices.
5. Tune rounds 1–3 first.
6. Freeze them before tuning 4–6.
7. Continue by campaign act.
8. Record every accepted balance version.

Balance one intended bottleneck at a time.

## 11. Suggested issue groups

### Must fix before balance

- Duplicate review/shop transition
- Incorrect average wait
- Attempt-state reset timing
- Pause/resume clock integrity
- Repeatable payout/checkout
- Round 12 death → payout → automatic Round 13 initialization

### Must fix before trusted simulation

- Global-state simulator mutation
- Separate random streams
- Config restoration
- Strategy identifier consistency
- Quota and Endurance simulation termination

### Must fix for reliable blueprint sharing

- Main-thread arbitrary execution
- Unbounded loops
- Import consent and origin labeling
- Manifest version/schema handling

## 12. Definition of done for any stabilization task

- Cause documented.
- Production code path covered.
- Deterministic reproduction exists where applicable.
- Regression test fails before and passes after.
- No unrelated balance values changed.
- Documentation updated if observable behaviour changes.
