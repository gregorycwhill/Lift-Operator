# Lift Operator Testing Strategy

**Objective:** Produce trustworthy evidence that the engine is correct, deterministic, resilient to accidental misuse, and suitable for balance iteration.

## 1. What testing must distinguish

Testing has four separate questions:

1. **Correctness:** Does the engine follow approved rules?
2. **Regression safety:** Did a change break existing behaviour?
3. **Balance:** Does the configured game create the intended difficulty and economy?
4. **Experience:** Can a human understand failure and enjoy mastery?

No single suite answers all four.

## 2. Test principles

- Invoke production code rather than restating its logic.
- Independently assert outcomes.
- Do not pass through fallback mocks when a required API is missing.
- Isolate state, random streams, storage, and configuration.
- Record seed and balance version.
- Make failures reproducible.
- Keep browser diagnostics separate from CI tests.
- Treat a passing simulation as evidence of feasibility, not fun.

## 3. Layer 1 — Schema and static validation

Validate:

- Balance data schema.
- All 13 rounds exist.
- Mechanic IDs and unlocks are valid.
- Price tiers increase.
- Probabilities and durations are in range.
- Required mechanics are implemented.
- No duplicate balance sources remain.
- Production HTML excludes test-only scripts.
- Source files use UTF-8.

## 4. Layer 2 — Pure mechanic tests

Test production functions for:

- PRNG repeatability and stream separation.
- Payload round-trip and malformed input.
- Patience transitions and rage penalties.
- Weight/effective capacity.
- Standard, Room Service, and Gym Bro boarding.
- Gravity multiplier.
- Lift target clamping.
- Power-up scope, duration, and cleanup.
- Payout components and caps.
- Achievement one-time rewards.

Each test creates fresh state.

## 5. Layer 3 — State-machine tests

Use a controllable clock to verify:

```text
IDLE
→ DOORS_OPENING
→ BOARDING
→ DOORS_CLOSING
→ TRANSIT
→ IDLE
```

Include:

- Pickup and delivery.
- Empty arrival.
- VIP rejection.
- Stink evacuation.
- Jam and repair.
- Pause during every state.
- Power-up expiry during each state.
- Double-Decker target clamp.

Avoid frame-rate assumptions. Advance time explicitly.

## 6. Layer 4 — Round simulation

The simulator must create isolated state rather than mutate the active game.

For each representative seed, run strategy profiles:

- Manual approximation.
- Sweep only.
- Mixed built-ins.
- Specialist strategy matching the intended lesson.
- Deliberately poor strategy.

Assertions should include:

- No crash or `NaN`.
- Same inputs produce identical results.
- Intended specialist strategy materially outperforms poor strategy.
- Round is neither impossible nor trivial across the seed set.
- Outcome differences are caused by strategy rather than random-stream consumption.

## 7. Layer 5 — Economy simulation

Model full-campaign paths for:

- Struggling player.
- Typical player.
- Expert player.

Verify:

- No permanent progression trap.
- Typical purchase cadence matches `Game Economy.md`.
- Gold remains scarce.
- Failed retries do not farm or destroy currency.
- Achievements do not dominate income.
- No power-up has overwhelming purchase share without a deliberate design reason.

## 8. Layer 6 — Browser E2E

Critical flows:

1. New campaign → Round 1 → review → shop → Round 2.
2. Pause → Workshop → resume with clocks preserved.
3. Targeted power-up → cancel → resume.
4. Ordinary failure → full rollback → same-round shop → same-seed retry → success → one payout.
5. VIP and hazard UI states.
6. Blueprint import consent and rejection.
7. Game over → reset with clean runtime and retained career data.
8. Modal click isolation.
9. Round 12 runs until lives reach zero, awards once, and automatically advances to Round 13.
10. Monkey mode can be enabled through the intended Debug/manifest capability and completes the accelerated campaign workflow.

For the Workflow Monkey, test configuration may accelerate life loss or increase Endurance pressure. It must not replace Round 12 with a timer or quota; the tested transition remains `20 lives → zero lives → Endurance payout → Round 13`.

Ordinary-death E2E assertions:

- Point balance equals the checkpoint created after the previous round.
- Inventory and cart are empty.
- No failed-attempt achievement or payout persists.
- Round number and seed are unchanged.
- Lifts, guests, hazards, timers, and round statistics are newly initialized.
- The shop is shown before retry.

E2E should use a dedicated test configuration and explicit debug capability, not undocumented URL behaviour.

## 9. Layer 7 — Automation containment and manifest resilience

Attempt:

- Infinite loop.
- Very large script.
- `window`/`document`/storage/network access.
- Constructor escape.
- Invalid target.
- Malformed response.
- Memory exhaustion.
- Malformed or accidentally corrupted blueprint.

Expected result:

- Execution terminates.
- Main game remains responsive.
- Protected state remains unchanged.
- Player receives a useful error.

## 10. Layer 8 — Human balance testing

Automated tests cannot determine whether:

- A new problem is legible.
- A failure feels fair.
- A power-up choice is satisfying.
- The player can diagnose the bottleneck.
- Success feels earned.

Human sessions follow `BALANCE_WORKFLOW.md` and capture both perceived and measured failure causes.

## 11. Golden seeds

Maintain a small versioned set:

- Simple onboarding seed.
- Bulky boarding seed.
- Jam recovery seed.
- Checkout funnel seed.
- VIP reservation seed.
- Rooftop/stink seed.
- Heavy-load seed.
- Gravity seed.

Golden results may change when the balance version changes. Changes must be reviewed, not blindly regenerated.

## 12. Continuous integration gates

Every change:

- Syntax/lint
- Schema validation
- Pure mechanic suite
- State-machine suite

Engine/config changes:

- Golden simulations
- Economy checks

Lifecycle/UI changes:

- Critical Playwright flow

Automation/manifest changes:

- Containment and resilience suite

## 13. Test quality review

A test is unacceptable if it:

- Calculates expected behaviour using the same implementation expression.
- Sets the expected result directly.
- Silently substitutes a mock for missing production behaviour.
- Relies on previous test state.
- Passes when the feature is absent.
- Tests only that no exception was thrown.

## 14. Reporting

Every run reports:

- Commit.
- Balance version.
- Test configuration.
- Seed set.
- Pass/fail.
- Relevant telemetry deltas.

The production UI regression scorecard may remain as a developer convenience, but it must not be the authoritative CI result.
