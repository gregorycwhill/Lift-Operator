# Lift Operator: High-Level Implementation Plan

This document maps the conceptual goals in `ROADMAP.md` to specific architectural changes. Each phase is designed to minimize redundant edits to the same functions.

---

## 🏗️ Phase 1: Technical Foundation & QA [COMPLETED]
**Focus:** Infrastructure that makes all future features easier to verify without manual clicking.

### 1.1 Headless Physics Runner ("The Time-Warp") [COMPLETED]
*   **Target:** `engine-physics.js`, `engine-simulator.js`, `tests/simulation-tests.js`.
*   **Change:** Decoupled physics loops from real-time clocks by passing `now` timestamps.
*   **New Object:** `window.Game.Simulator`.
*   **Key Function:** `runRound(seed, scriptMap, round)`.
*   **UI Integration:** "Run Regression Suite" button in Debug and Main menus.

### 1.2 The Manifest Gateway Evolution [COMPLETED]
*   **Target:** `ui-manifest.js` and `engine-core.js`.
*   **Change:** Transitioned to a robust **Manifest Controller** using a `switch` statement.
*   **Logic Refactor:** Handles `challenge` payloads (fixed seed/lives) and blueprint versioning.
*   **Sanitization:** Implemented script ID cleaning/deduplication.

---

## 🚀 Phase 2: Gameplay Depth (Power-ups & Hazards) [COMPLETED]
**Focus:** Modifying the passenger and lift data structures to accommodate complex interactions and "Weight-based" physics.

### 2.1 Physics Engine Extensions: The State Machine [COMPLETED]
*   **Target:** `engine-physics.js` (Boarding Loop) and `config.js`.
*   **Architecture Change:** Refactor the boarding/unboarding logic in `animationTick` from a timer-gate into a formal **Discrete State Machine** on the Lift object.
*   **States:**
    *   `IDLE`: Waiting for command.
    *   `DOORS_OPENING`: Transitioning to open state.
    *   `BOARDING`: Actively transferring passengers (Progress tracked).
    *   `DOORS_CLOSING`: Transitioning to closed state.
    *   `TRANSIT`: Physically moving between floors.
*   **Dynamic Boarding:**
    *   **Room Service:** Occupies 3x weight, boards at $1/3$ speed, slows other boarders in the same state by $50\%$.
    *   **Wide Doors:** Multiplier applied directly to the state transition speed.

### 2.2 Pedal Power & Gravity [COMPLETED]
*   **Target:** `engine-physics.js` (Movement Logic).
*   **Change:** Introduce a variable speed factor based on lift load.
*   **New Formula:** `effectivePixelsPerTick = basePixels * (1 - (lift.currentWeight / lift.maxCapacity) * gravityConstant)`.
*   **Constraint:** This only applies in **Round 13** when `lift.targetFloor > currentFloor` (moving up).

### 2.3 Advanced Power-up Effects Hooks [COMPLETED]
*   **Target:** `powerups.js` and `Registry` in `state.js`.
*   **Change:** Add an `effects` array to both `Lift` and `Guest` objects. 
*   **Visuals:** Room Service carts now render with `🛎️🍽️` indicators.

### 2.4 Survival Round Logic (Endurance) [COMPLETED]
*   **Target:** `engine-physics.js` and `ui-briefing.js`.
*   **Change:** Round 12 bypasses timer logic. Shift ends only on 50 guests served or 0 lives.
*   **Refinement:** Fixed modal loop bug where review screen wouldn't transition to Round 13.

### 2.5 Advanced Power-up Expansion & Safety [COMPLETED]
*   **Double-Decker:** Dual-deck physics allowing for two `passengers` arrays per lift. Alignment check targets the bottom deck by default.
*   **Routing Safety:** Implemented `targetFloor` clamping for multi-floor entities in `engine-physics.js` to prevent shaft overflow.
*   **Hazards Correction:** Removed `/60` math divisor from `gameTick` hazard checks to ensure 0.5% chance per second matches Config at 1Hz execution.
*   **Open Plan (Lateral Transfer): [IN-PROGRESS]** 
    *   **Trigger:** Active whenever aligned lifts have the `openPlan` effect.
    *   **Decision Logic:** Guests move if target lift is healthy and closer/moving to their destination.
    *   **Visuals:** Side walls transition to "airflow" dashed lines; icons slide horizontally. Logic present in prototype form in `engine-physics.js`.

---

## ⚙️ Phase 3: Total Parameter Centralization & Secure Debug
**Focus:** Consolidating design truth into a single source of truth and establishing a secure URI-unlocked developer environment.

### 3.1 The "Solo Config" Consolidation
*   **Target:** `config.js`, `achievements.js`, `powerups.js`.
*   **Architecture:** Move all round-specific logic (R1-R15), achievement requirements, power-up costs, and hazard probabilities into a single structured object: `window.Config.GAME_DATA`.
*   **Pointers:** Update modules to consume values via `Config.GAME_DATA[type][round/tier]` rather than hard-coded constants.
*   **Benefit:** Allows for instantaneous balance updates and supports the loading of external JSON manifests in the future.

### 3.2 Hot-Swappable Test Configs
*   **Target:** `index.html`.
*   **Logical Injection:** Implement a secondary script tag check that attempts to load `config_test.js` if it exists.
*   **Safety:** The test config will perform a shallow merge into `window.Config`, ensuring experiments don't require permanent code changes until ready for "Promotion" to the main `config.js`.

### 3.3 URI-Locked Debug Mode (Secure Sandbox)
*   **Target:** `engine-core.js` and `ui-manifest.js`.
*   **Default State:** `Config.debugMode` defaults to `false`.
*   **Encoded Unlock:** Debug access is only granted via a URI `?data=` parameter containing a "System Payload" encoded with the `SHARE_SECRET`.
*   **Modal Handshake (Option A):** When the payload is decoded, a specific modal notifies the player: *"Inbound automated telemetry bundle containing Master Configuration overrides detected. Enable Sandbox Access?"*
*   **Privileges:** Upon acceptance, `Config.debugMode` is enabled, granting:
    *   Infinite points.
    *   Full round warp access (ignoring `highestUnlockedRound`).
    *   Visibility of the Debug Menu button.

---

## 🤖 Phase 4: Autonomous Regression & Experience Validation
**Focus:** Establishing the "Monkey Pilot" agent and validation environment to catch interaction bugs before deeper automation is added.

### 4.1 The "Monkey Pilot" Agent (UNIT_01)
*   **Focus:** UI/UX interaction and flow verification.
*   **Implementation:** Playwright Integration tests (`tests/auto-pilot.spec.js`).
*   **Capabilities:**
    *   **Seeded Reproducibility:** Parallel execution of game logic and agent decisions via shared random seeds.
    *   **Flow Speedrunning:** Integration of "Fast-Round" mode (30s durations) into the engine's debug entry point.
    *   **Input Integrity:** Automated Z-index "Ghost Clicks" to detect input leakage through modals.
    *   **Kill Switch:** Integration of human-intervention detection to ensure the agent yields control instantly.
    *   **Telemetry Logging:** Structured JSON console output for every round transition, badge earned, and performance metric.

### 4.2 Deterministic Stress Testing
*   **Strategy:** Combining the Phase 1 Simulator (Logic) with the Phase 4.1 Agent (UI).
*   **Validation:** Ensuring that a "Perfect Run" in the simulator results in a "Perfect Run" for the agent under identical seeds.
*   **Crash Recovery:** Verifying that a full Reset (Life Count = 0 -> Restart) leaves the `Registry` in a clean target state without memory leaks. 
*   **Dynamic Observation:** Add `onFloorReached(floor)` callback hooks to allow event-driven automation.
*   **Safety:** Expose a `forEachPassenger(callback)` method in the bridge that wraps a standard loop but limits execution time to prevent infinite loops.

---

## 🧪 Phase 5: Automation Mastery (The Logic Expansion)
**Focus:** Expanding the interface between the game engine and user-generated scripts, specifically around persistence and observation.

### 5.1 The Memory API & Bounded Loops
*   **Target:** `automation-vm.js`.
*   **Persistence:** Initialize a `lift.scriptMemory = {}` object in the Registry.
*   **Bridge Expansion:** Add `writeMemory(key, val)` and `readMemory(key)` to the `Building` bridge.

### 5.2 Social Meta & Career Logic
*   **Target:** `ui-leaderboard.js` and `achievements.js`.
*   **Change:** Refactor `Achievements.evaluateRound()` from a linear check into a **Career Registry**. 
*   **Achievements Expansion:**
    *   **Hands Free Award (RESTORED):** Verified in regression suite. Track `manualClickCount` in `Registry`.
    *   **Inventor Award:** Track cumulative `served` stats specifically when `lift.automation` starts with a custom script.

---

## 🎨 Phase 6: Creative & Polish
**Focus:** Moving visuals and audio to an **Observer Pattern** to keep the core engine "pure".

### 6.1 Audio Engine: The Event Hub
*   **Target:** `audio.js` and `engine-core.js`.
*   **Architecture Change:** Instead of calling `Audio.play()` inside the physics loop (which is messy), create a `window.Game.Events` hub using `EventTarget`. 
*   **Implementation:** The physics engine emits events like `floorReached`, `guestRaged`, `powerupUsed`. `audio.js` listens to these and plays sounds, keeping the engine and audio code in separate files and avoiding redundant edits.

### 6.2 Themes & Save Profiles
*   **Target:** `state.js`, `ui-core.js`, and `style.css`.
*   **Variables:** Refactor `style.css` to use CSS Variables (`--accent-color`, `--floor-bg`, etc.) for every element.
*   **Theme Switcher:** A simple `ui.setTheme(themeName)` that changes the `class` on the `<body>` element.
*   **Profile Storage:** Change the `localStorage` keys from `liftOp_v2_[key]` to `liftOp_v2_profile_[name]_[key]`. Update the briefing screen to allow profile selection/creation.

---

## 🏁 Development Sequence Principles
1.  **Never Edit a Core Loop Twice:** If a loop needs a new feature (like Room Service carts), first refactor the loop to support "modifiers" in Phase 1/2, then just add the modifier data in Phase 3.
2.  **Logic First, UI Last:** Functional logic is verified in the Headless Runner before any buttons are added to the DOM. This avoids "Visual Debugging" which is slow and error-prone.
3.  **Namespace Integrity:** All new functions must reside under `window.Game.[System]` to keep the global scope clean and the codebase modular.

