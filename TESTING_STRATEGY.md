-0phgs# Testing Strategy: Lift Operator

This document outlines the automated testing strategy for the *Lift Operator* engine, automation sandbox, and UI components. The goal is to ensure stability as new power-ups, achievements, and hazards are added to the simulation.

## 1. Automated Logic & Unit Testing
**Focus:** Pure functions, calculations, and data codecs.
**Implementation:** `tests/regression-suite.js` (Modular Functions).

*   **PRNG Consistency:**
    *   Verify that `window.Game.Seed.set(12345)` followed by multiple `random()` calls produces the exact same sequence every time.
    *   *Why:* Crucial for leaderboard integrity and replaying shared Game IDs via the manifest.
*   **Payload Encryption (XOR Codec):**
    *   Test `encodePayload` / `decodePayload` with nested objects (blueprints, seeds).
    *   Negative Test: Ensure tampered strings or incorrect secrets fail gracefully without crashing the `handleSharedData` loop.
*   **Guest Mechanics & Hazards:**
    *   **Aging Logic:** Verify transitions (HAPPY -> ANNOYED -> CRITICAL -> RAGE).
    *   **Guest Weights:** Verify "Gym Bros" contribute double weight (2.0 vs 1.0) and "Room Service" contributes triple weight (3.0).
    *   **Jam Hazards:** Verify that jammings suspend lift operations and the "Wrench" power-up correctly resets `jamTimer`.
    *   **Physics: Gravity:** Verify upward speed deceleration is linear to the current lift weight ratio.

## 2. Regression & Simulation Testing ("The Golden Run")
**Focus:** Physics stability, balancing, and deterministic outcomes.
**Implementation:** `tests/regression-suite.js` (DeterministicSim) and `tests/simulation-tests.js`.

*   **State Machine Verification:**
    *   Continuous logging of state transitions (`IDLE` -> `DOORS_OPENING` -> `BOARDING` -> `DOORS_CLOSING` -> `TRANSIT`).
    *   Verify that `BOARDING` time is strictly granular (per-guest) rather than a block delay.
*   **Golden Run Determinism:**
    *   Execute a round simulation with a fixed seed and script twice.
    *   Ensure `servedCount` and `livesRemaining` are identical.
*   **Stability Stress Test:**
    *   Run a full Round 7 simulation (High volume) headlessly.
    *   Ensure no `NaN` values in `Registry.stats`.
*   **Power-up Overrides:**
    *   Verify that `AutomationVM` and `PhysicsEngine` respect active timers (e.g., TARDIS mode providing infinite capacity).
*   **Achievement Trigger Verification:**
    *   Inject specific conditions (e.g., 50 guests served) and verify `Achievements.evaluateRound()` returns the specific award and point bonus.

## 3. Automation VM Validation
**Focus:** The `Building` bridge and Blockly-generated code sandbox.

*   **Sandbox Safety:**
    *   Attempt to execute scripts that try to access `window`, `document`, or `Registry` directly.
*   **Bridge Functionality:**
    *   Verify `findSweepTarget` returns expected results for both standard and priority sweep modes.

## 4. E2E (End-to-End) UI Testing
**Focus:** User flow and DOM state changes.
**Implementation:** Playwright Integration tests.

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

## 7. Autonomous Regression Pilot (The "Monkey Pilot")
**Focus:** Full-loop E2E experience validation, UI overlap detection, and state transition stability.
**Implementation:** Playwright-driven autonomous agent (`tests/auto-pilot.spec.js`).

*   **Execution Logic:**
    *   **Seeded Reproducibility:** The agent uses two seeds: a **Game Seed** (environment) and an **Agent Seed** (decision matrix). This ensures identical runs across identical test cycles.
    *   **Time Compression:** Rounds are artificially shortened to 30 seconds to reach late-game hazards quickly.
    *   **The "Tourism" Protocol:** Once per round, the agent opens and closes the Workshop and Leaderboard to verify no UI soft-locks occur.
*   **Gameplay Modes:**
    *   **Hybrid Control:** One lift shaft is operated by random seeded floor clicks; others are set to random automation algorithms.
    *   **Greedy Shopping:** During the Shop phase, the agent buys the most expensive available power-ups until points are depleted.
    *   **Inventory Utilization:** Power-ups are deployed at staggered intervals throughout the 30-second round.
*   **Validation & Safety:**
    *   **Stall detection:** If `servedThisRound` or `animationTick` stops for 15s while `gameActive`, a "Logic Lock" error is logged.
    *   **Input Leakage:** Agent attempts to click shafts through the Leaderboard overlay; movement indicates a Z-index bug.
    *   **User Handoff (Kill Switch):** Any non-agent mouse/keyboard interaction sets `Registry.manualIntervention` to true, stopping the agent immediately.
    *   **Lifecycle:** On death, the agent logs terminal stats and restarts, verifying state persistence and clean engine resets.
    *   **Telemetry:** All decisions, badges earned, and performance metrics are logged to the console for automated analysis.
