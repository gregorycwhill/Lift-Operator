# Lift Operator: Product Roadmap

This document outlines the strategic expansion of *Lift Operator* following the successful architectural refactor. It combines technical infrastructure needs, gameplay depth, and quality assurance goals.

---

## 🏗️ Phase 1: Technical Foundation & QA (Restoration & Stability)

### 1.1 Automated Testing Suite
- **Headless Runner:** Implement a scriptable version of `engine-physics.js` that can run full rounds at high speed to verify balance and determinism.
- **Integration Tests:** Validate the **Manifest Gateway** (encoded URL sharing) and cross-shift data persistence.
- **E2E Smoke Tests:** Automated Playwright flows for the Workshop (Create -> Save -> Share) and the Power-up Shop.
- **Performance Benchmarking:** Track "Ticks-Per-Second" (TPS) to ensure new features don't degrade the 60fps target.

---

## 🚀 Phase 2: Gameplay Depth (Power-ups & Hazards)

### 2.1 Advanced Power-ups
- **Wide Doors (Implemented):** Refine UI feedback for the time-limited boarding speed boost.
- **Tardis Module:** Add internal visual indicator for lifts with active infinite capacity.
- **Group Think:** Everyone in the lift votes and agrees to change their destination floor to majority (random on a tie).
- **Double Decker:** The lift now spans two levels. Guests can more freely within the lift. They can board and disembark on either of the lift's decks.
- **Open Plan:** Guests can move between adjacent lifts in the shaft as they pass each other. They make a decision based on whether they'll reach their destination faster on the other lift.

### 2.2 New Challenges & Hazards
- **Pedal Lifts:** This round, all lifts are pedal-powered. While down speed is unchanged, up is considerably harder - and decreases the more guests are in the lift.
- **Room Service:** Periodically, Room Service carts will spawn (either going to or coming from Ground Floor, where the kitchen is). Room Service carts have a capacity of three and take 3x as long to transition on/off the lift. They also make other guests take 2x as long.
- **Vandalism:** Annoyed guests occasionally jam buttons on their target floors, requiring a "Wrench" power-up to fix.

### 2.3 New Achievements & Awards
- **Promoter Award:** Got x guests to the rooftop in time for the party
- **Hands Free Award:** Completed a round with Automation only - no manual intervention.
- **Flawless Floors:** Completed a round without losing a life.
- **Inventor Award:** Services x guests with a Custom Automation

---

## 🤖 Phase 3: Automation Mastery (The Logic Expansion)

### 3.1 Advanced Blockly Bridge
- **Memory API:** Introduce `Building.writeMemory(key, val)` and `Building.readMemory(key)` to allow scripts to pass state between ticks.
- **Looping Constructs:** Safely expose bounded for-each loops for scanning passengers or waiting queues.
- **Telemetry Improvements:** Enhancements to the `System Console` to log custom messages from user scripts.

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
