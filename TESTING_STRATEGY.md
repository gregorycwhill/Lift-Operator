# Testing Strategy: Lift Operator

This document outlines the automated testing strategy for the *Lift Operator* engine, automation sandbox, and UI components. The goal is to ensure stability as new power-ups, achievements, and hazards are added to the simulation.

## 1. Automated Logic & Unit Testing
**Focus:** Pure functions, calculations, and data codecs.
**Implementation:** Vitest or Jest.

*   **PRNG Consistency:**
    *   Verify that `window.Game.Seed.set(12345)` followed by multiple `random()` calls produces the exact same sequence every time.
    *   *Why:* Crucial for leaderboard integrity and replaying shared Game IDs via the manifest.
*   **Payload Encryption (XOR Codec):**
    *   Test `encodePayload` / `decodePayload` with nested objects (blueprints, seeds).
    *   Negative Test: Ensure tampered strings or incorrect secrets fail gracefully without crashing the `handleSharedData` loop.
*   **Guest Aging Logic:**
    *   Verify `checkStatus(g)` transitions through HAPPY -> ANNOYED -> CRITICAL -> RAGE at the exact thresholds defined in `Config`.

## 2. Headless Simulation Testing ("The Time-Warp")
**Focus:** Physics stability, balancing, and rare hazard triggers.
**Implementation:** Custom scripts using the existing `gameTick()` logic.

*   **Stability Stress Test:**
    *   Run a full 3-minute round at "High Speed" (skipping `requestAnimationFrame` and executing `gameTick` in a `while` loop) with a fixed seed.
    *   Ensure `Registry.stats` values (served, lives, timeLeft) are valid numbers (no `NaN`).
*   **Regression - Determinism Check:**
    *   Record a "Golden Run" (a log of every served guest time for Seed X).
    *   After adding code (e.g., a new Power-up), re-run Seed X. If the served count or timing changes without a power-up being used, a physics-breaking change was introduced.
*   **Achievement Trigger Verification:**
    *   Inject specific conditions (e.g., force 10 Critical guests) and verify `Achievements.evaluateRound()` returns the specific award.

## 3. Automation VM Validation
**Focus:** The `Building` bridge and Blockly-generated code sandbox.

*   **Sandbox Safety:**
    *   Attempt to execute scripts that try to access `window`, `document`, or `Registry` directly. Verify the `AutomationVM` (via `new Function` scope) throws or prevents access.
*   **Bridge Functionality:**
    *   Mock a `lift` and verify `Building.getFloor()`, `Building.getLoad()`, and `Building.setTarget()` interact correctly with the mock object properties.
*   **Blockly Consistency:**
    *   Automated check to generate code from all `liftOperatorBlocks` definitions to ensure no missing generators (`jsGen.forBlock`).

## 4. E2E (End-to-End) UI Testing
**Focus:** User flow and DOM state changes.
**Implementation:** Playwright / VS Code Browser Tools.

*   **The Workshop Loop:**
    *   Open Workshop -> Create Script -> Drag "Set Target Floor" block -> Save -> Share.
    *   Verify the URL updates and the system clipboard contains the encoded link.
*   **The Economy System:**
    *   Start game -> Achieve served count -> Open Shop -> Click a Tier 1 Power-up.
    *   Verify: `Registry.points` decreases, inventory icon appears, and the shop button reflects "Owned" or disabled state.
*   **Shared Manifest Ingestion:**
    *   Simulate a URL load with `?Data=...`.
    *   Verify the "Manifest Gateway" modal appears and clicking "Accept" correctly imports the script/seed into the `Registry`.

## 5. Continuous Integration (CI)
*   **Linting:** ESLint to enforce the `window.Game` namespace usage and prevent accidental global variable creation.
*   **Automated Runs:** Every PR should trigger the Headless Stress Test to verify that code changes haven't introduced "Simulation Jitter" (physics inconsistencies).

## 6. Future-Proofing for Power-ups
When adding a new Power-up, the test suite must be updated with:
1.  **Effect Test:** Does the timer decrement in `PowerUps.tick()`?
2.  **Physics Test:** Does the physics engine (e.g., `boardingSpeedMultiplier`) actually use the power-up's config?
3.  **Visual Cleanup:** Does the power-up icon UI cleanup after the timer hits 0?
