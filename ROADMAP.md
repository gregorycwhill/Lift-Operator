# Lift Operator: Product Roadmap

This document outlines the strategic expansion of *Lift Operator* following the successful architectural refactor. It combines technical infrastructure needs, gameplay depth, and quality assurance goals.

---

## 🏗️ Phase 1: Technical Foundation & QA (Restoration & Stability) [ESTABLISHED]

### 1.1 Automated Testing Suite [COMPLETED]
- **Headless Runner:** Implement a scriptable version of `engine-physics.js` that can run full rounds at high speed to verify balance and determinism.
- **Integration Tests:** Validate the **Manifest Gateway** (encoded URL sharing) and cross-shift data persistence.
- **Regression Suite:** Implemented a 15-test E2E runner in `tests/regression-suite.js` covering core mechanics, hazards, and VM safety. Achieved 100% pass rate.

---

## 🚀 Phase 2: Gameplay Depth (Power-ups & Hazards) [COMPLETED]

### 2.1 Advanced Power-ups [COMPLETED]
- **Wide Doors:** Refine UI feedback for the time-limited boarding speed boost.
- **Tardis Module:** Add internal visual indicator for lifts with active infinite capacity.
- **Double-Decker:** Implemented dual-deck lift upgrade for 2x capacity with shaft-capping safety logic.
- **Group Think:** Everyone in the lift votes and agrees to change their destination floor to majority.
- **Effects Pipeline:** Implemented an extensible `effects` array for real-time visual feedback on lift status icons.

### 2.2 New Challenges & Hazards [COMPLETED]
- **Pedal Power (Gravity):** Upward travel speed is penalized by load weight. Gated to Round 13.
- **Room Service:** Bulky carts (🛎️🍽️) that occupy 3x capacity and take 3x time to board.
- **Gym Bros:** Swol passengers (Round 11) that occupy 2x weight and trigger "Stink" hazard when grouped. Restored "double-wide" visual style.
- **Endurance Mode:** Round 12 survival challenge (No timer).

### 2.3 Expansion Power-ups [PLANNED]
- **Open Plan:** Lateral transfer mechanics for guest hand-offs between aligned lifts. (Initial logic present in `engine-physics.js`).

### 2.4 New Achievements & Awards [COMPLETED]
- **Hands Free Award:** Completed a round with Automation only - no manual intervention.
- **Sardine Packer:** Deliver a lift at 100% capacity/weight.
- **Flawless Floors:** Completed a round without losing a life.
- **Inventor Award:** Services x guests with a Custom Automation.

---

## 🤖 Phase 3: Automation Mastery (The Logic Expansion)

### 3.1 Advanced Blockly Bridge
- **Memory API:** Introduce `Building.writeMemory(key, val)` and `Building.readMemory(key)` to allow scripts to pass state between ticks.
- **Looping Constructs:** Safely expose bounded for-each loops for scanning passengers or waiting queues.
- **Telemetry Improvements:** Enhancements to the `System Console` to log custom messages from user scripts.
- **IO Streams:** (Proposed) Allow scripts to react to specific events (e.g., `onFloorReached`).

### 3.2 Hacker Awards & Social Meta
- **Hacker Achievements (Implemented):** Track and reward logic efficiency and cycle counts.
- **Global Leaderboards:** Transition from local-storage records to a central API for global pilot rankings.
---

## 🎨 Phase 4: Creative & Polish (Future Concepts)

### 4.1 Audio & Visual Immersion
- **Spatial Audio Engine:** Fully implement `audio.js` with lift hums, mechanical door sounds, and urgency-based guest alerts.
- **Visual Synthesis:** Add CSS-driven transitions for floor shifts, guest spawn fades, and power-up activation overlays.
- **Save Profiles:** Implement a profile manager to support multiple "Pilots" on a single device with isolated career progress.

### 4.2 Modding & Customization
- **Theme Support:** Allow players to switch between "Cyberpunk Neon", "Art Deco Classic", and "Brutalist Concrete" visual styles.
- **Custom Blocks:** A potential plugin system for developers to add new Blockly blocks to the game.

### 4.3 Expansion Content
- **The Megaplex:** A second building type with 30+ floors and express elevators.
- **Service Lifts:** Dedicated freight elevators that only handle specific guest types.
