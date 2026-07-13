# Lift Operator: High-Level Implementation Plan

This document maps the conceptual goals in `ROADMAP.md` to specific architectural changes. Each phase is designed to minimize redundant edits to the same functions.

---

## 🏗️ Phase 1: Technical Foundation & QA
**Focus:** Infrastructure that makes all future features easier to verify without manual clicking.

### 1.1 Headless Physics Runner ("The Time-Warp") [COMPLETED]
*   **Target:** `engine-physics.js`, `engine-simulator.js`, `tests/simulation-tests.js`.
*   **Change:** Decoupled physics loops from real-time clocks by passing `now` timestamps.
*   **New Object:** `window.Game.Simulator`.
*   **Key Function:** `runRound(seed, scriptMap, round)`.
*   **UI Integration:** "Run Simulation Tests" button added to Debug Menu. Baseline tests cover Round 1 and Round 7 stress.

### 1.2 The Manifest Gateway Evolution [COMPLETED]
*   **Target:** `ui-manifest.js` and `engine-core.js`.
*   **Change:** Transitioned to a robust **Manifest Controller** using a `switch` statement.
*   **Logic Refactor:** Handles `challenge` payloads (fixed seed/lives) and blueprint versioning.
*   **Reconciler UI:** Added naming conflict detection for imported scripts.

---

## 🚀 Phase 2: Gameplay Depth (Power-ups & Hazards)
**Focus:** Modifying the passenger and lift data structures to accommodate complex interactions and "Weight-based" physics.

### 2.1 Physics Engine Extensions: The State Machine
*   **Target:** `engine-physics.js` (Boarding Loop) and `config.js`.
*   **Architecture Change:** The boarding/unboarding logic in `animationTick` is currently a timer-gate. Refactor this into a **State Machine** on the Lift object: `IDLE` -> `BOARDING(progress/total)` -> `DOORS_MOVING` -> `DONE`.
*   **Dynamic Boarding:**
    *   **Room Service:** Add `isBulky` flag to guests. 
    *   **Calculation:** Instead of a fixed 1s, boarding progress increments by `deltaTime / (Config.boardSpeedSec * guest.boardingWeight)`.
    *   **Wide Doors:** This power-up simply decreases the `guest.boardingWeight` modifier temporarily.

### 2.2 Pedal Physics & Gravity
*   **Target:** `engine-physics.js` (Movement Logic).
*   **Change:** Introduce a variable speed factor based on lift load.
*   **New Formula:** `effectivePixelsPerTick = basePixels * (1 - (lift.currentWeight / lift.maxCapacity) * gravityConstant)`.
*   **Constraint:** This only applies when `lift.targetFloor > currentFloor` (moving up).

### 2.3 Advanced Power-up Effects Hooks
*   **Target:** `powerups.js` and `Registry` in `state.js`.
*   **Change:** Add an `effects` array to both `Lift` and `Guest` objects. 
*   **Group Think Implementation:** A power-up that iterates through the `lift.passengers` array, finds the mode (most common) destination, and overwrites all `p.dest` values. Triggers a visual "💡" icon on the lift.

---

## 🤖 Phase 3: Automation Mastery (The Logic Expansion)
**Focus:** Expanding the interface between the game engine and user-generated scripts, specifically around persistence and observation.

### 3.1 The Memory API & Bounded Loops
*   **Target:** `automation-vm.js`.
*   **Persistence:** Initialize a `lift.scriptMemory = {}` object in the Registry.
*   **Bridge Expansion:** Add `writeMemory(key, val)` and `readMemory(key)` to the `Building` bridge. This allows scripts to "remember" they are heading to floor 5 to pick up a specific VIP, even if the nearest target changes.
*   **Safety:** Expose a `forEachPassenger(callback)` method in the bridge that wraps a standard loop but limits execution time to prevent infinite loops (Hacker Award safety).

### 3.2 Social Meta & Career Logic
*   **Target:** `ui-leaderboard.js` and `achievements.js`.
*   **Change:** Refactor `Achievements.evaluateRound()` from a linear check into a **Career Registry**. 
*   **Achievements Expansion:**
    *   **Hands Free Award:** Track `manualClickCount` in `Registry`. If 0 and round complete, trigger unique Achievement.
    *   **Inventor Award:** Track cumulative `served` stats specifically when `lift.automation` starts with `custom_`.

---

## 🎨 Phase 4: Creative & Polish
**Focus:** Moving visuals and audio to an **Observer Pattern** to keep the core engine "pure".

### 4.1 Audio Engine: The Event Hub
*   **Target:** `audio.js` and `engine-core.js`.
*   **Architecture Change:** Instead of calling `Audio.play()` inside the physics loop (which is messy), create a `window.Game.Events` hub using `EventTarget`. 
*   **Implementation:** The physics engine emits events like `floorReached`, `guestRaged`, `powerupUsed`. `audio.js` listens to these and plays sounds, keeping the engine and audio code in separate files and avoiding redundant edits.

### 4.2 Themes & Save Profiles
*   **Target:** `state.js`, `ui-core.js`, and `style.css`.
*   **Variables:** Refactor `style.css` to use CSS Variables (`--accent-color`, `--floor-bg`, etc.) for every element.
*   **Theme Switcher:** A simple `ui.setTheme(themeName)` that changes the `class` on the `<body>` element.
*   **Profile Storage:** Change the `localStorage` keys from `liftOp_v2_[key]` to `liftOp_v2_profile_[name]_[key]`. Update the briefing screen to allow profile selection/creation.

---

## 🏁 Development Sequence Principles
1.  **Never Edit a Core Loop Twice:** If a loop needs a new feature (like Room Service carts), first refactor the loop to support "modifiers" in Phase 1/2, then just add the modifier data in Phase 3.
2.  **Logic First, UI Last:** Functional logic is verified in the Headless Runner before any buttons are added to the DOM. This avoids "Visual Debugging" which is slow and error-prone.
3.  **Namespace Integrity:** All new functions must reside under `window.Game.[System]` to keep the global scope clean and the codebase modular.

