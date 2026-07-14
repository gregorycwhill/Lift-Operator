# Game Design Document: Lift Operator
**Current Version:** Prototype Phase 2 (Refactored)

## 1. Core Overview
*Lift Operator* is an educational, time-management/automation game. The player manages a multi-floor elevator system to clear queues of waiting guests. As the game escalates in difficulty, human reaction time becomes insufficient, forcing the player to rely on built-in logic algorithms (and eventually, their own coded automations) to survive.

## 2. Core Mechanics
* **The Grid:** 15 Floors (G, 1-14). 
* **The Lift:** Capacity of 10. Travels at 1.0s per floor (optimized for speed). Uses a state-driven physics model (`TRANSIT`, `DOORS_OPENING`, `BOARDING`, `DOORS_CLOSING`, `IDLE`).
* **Progression Tracking:** Game runs on timed rounds. Standard rounds are 180 seconds, while Autopilot/Testing rounds are condensed to 30 seconds.
* **PRNG System:** Spawns are handled by a custom Park-Miller seeded random number generator. Players can input a "Game ID" (seed) to replay the exact same traffic patterns to test different algorithms.

### 2.1 Guest Lifecycle & Rage State
Guests spawn on random floors with random destinations. They have a strict patience timer:
* **Happy (Green):** 0–20 seconds.
* **Annoyed (Orange):** 20–40 seconds.
* **Critical (Red/Blinking):** 40–60 seconds.
* **Rage (Black/Skull):** 60+ seconds. The guest defenestrates (flies out the window) and the player loses 1 Life. The player starts with 20 Lives.

### 2.2 Advanced Guest Types
* **Gym Bros (💪):** Found primarily on the Gym Floor (spawns in Round 11). They occupy **2.0 capacity units**. If 3 or more are in a lift, they cause a permanent "Stink" hazard.
* **Room Service (🍽️):** Bulky carts introduced in Round 3. They occupy **3.0 capacity units** and take 3x longer to board/unboard ($3.0$s base). Rendering uses the plate indicator.

### 2.3 Physics Extension: The State Machine
Lifts use a discrete state machine for all cycle interactions: `IDLE`, `DOORS_OPENING`, `BOARDING`, `DOORS_CLOSING`, `TRANSIT`. Power-ups and cart types modify the speed of these state transitions.

### 2.4 Physics: Gravity & Weight (Round 13 Only)
Upward travel speed is penalized by lift load weight. Max load at default gravity slows the lift significantly. This mechanic is strictly gated to **Round 13: Pedal Power** to represent a power failure scenario.

### 2.5 Planned Power-up Expansions
* **Double-Decker (Lift Upgrade):** Splits the lift into two stacked compartments. Doubles capacity and doubles weight sensitivity in Round 13. *Footprint Constraint:* Occupies two shaft slots. `targetFloor` is engine-clamped to `Max - 1` to prevent overflow.
* **Open Plan (Lateral Transfer):** A temporary lift-based state that removes shaft barriers. Allows passengers to move horizontally to adjacent lifts (shafts $n-1$ or $n+1$) when they are vertically aligned (at the same floor or passing through).
    * **Bronze:** Applies to one lift. Short duration.
    * **Silver:** Applies to one lift. Long duration.
    * **Gold:** Applies to all lifts for a moderate duration.

## 3. The Progression Arc (Rounds 1–13)
* **Round 1 (Welcome):** 1 Lift. Manual click-to-route control.
* **Round 2 (Auto):** Introduces **Sweep** automation.
* **Round 3 (Rush Hour):** 2 Lifts. Higher spawn rate.
* **Round 4 (Triage):** Introduces **Priority Sweep** automation.
* **Round 5 (Democracy):** 3 Lifts. Introduces **Voting** & **Weighted Voting**.
* **Round 6 (Wild Card):** Introduces **Lift Jams**. Elevators have a 0.5% chance per second to jam for 5–15 seconds, trapping passengers and halting operations.
* **Round 7 (Check-out):** 4 Lifts. 50% of all spawns are forced to the Ground (G) floor, creating massive traffic funnels.
* **Round 8 (VIP):** Introduces **VIPs (⭐)**. VIPs demand a 100% empty lift, refuse to ride with others, and cost 10 Lives if they Rage. *Design Trap:* VIPs broadcast high priority to AI lifts, causing the AI to arrive empty, get "stolen" by normal queueing guests, and soft-lock while trying to pick up the VIP. Forces manual intervention.
* **Round 9 (Happy Hour):** 5 Lifts. Introduces **Farts** and **Rooftop Sunset**.
* **Round 10 (Sandbox):** Unlocks the **Automation Workshop**. Custom JavaScript/Blockly scripts can now be assigned to lifts.
* **Round 11 (Gym Challenge):** Introduces **Gym Bros (💪)**. Weight management becomes critical.
* **Round 12 (Endurance):** **NO TIMER.** The shift does not end until the player delivers 50 guests or loses all lives. Difficulty scales indefinitely via spawn pressure.
* **Round 13 (Pedal Power):** The Power Outage round. **Gravity is active** (and doubled). Lift speed is determined by weight. Heavier loads move slower upward.

### 3.1 Environmental Hazards (Round 9+)
* **The Fart:** 0.5% chance per second for a passenger to fart. The lift turns green/stinky for 10 seconds.
    * *Quarantine:* No new guests will board a stinky lift.
    * *Damage:* Non-farting passengers age 2x as fast while trapped in the gas.
    * *Exodus:* At the next stop, groups will abandon the lift out of disgust (and re-queue). Single occupants (including VIPs) will stay on board.
* **Rooftop Sunset:** Guaranteed once per round (between 30-90s). The top floor turns into a disco.
    * *Infection:* 50% of active non-VIP guests change their destination to the Top Floor (rendered as 'R').
    * *Party Mode:* Once they arrive, they bounce and their patience timer *pauses* for 30 seconds. Once Happy Hour ends, they revert to their original destinations and their patience timers resume, creating a massive top-floor bottleneck.

## 4. Built-In Automations
* **Sweep (SCAN):** Lift travels continuously in one direction until no requests remain ahead, then reverses. Boarding is strictly limited to guests traveling in the sweep direction.
* **Priority Sweep:** Targets floors with Critical > Annoyed > Happy guests. Abandons the strict sweep direction to hunt high-priority targets.
* **Voting:** Calculates the floor with the highest volume of requests (inside lift + waiting on floor). Distance breaks ties.
* **Weighted Voting:** Happy = 1 vote, Annoyed = 2 votes, Critical = 4 votes. Calculates destination based on maximum urgency mass.

## 5. Development & Testing
* **Secure Debug Mode:** Accessible via encrypted URI manifest.
* **Unlock URI:** `index.html?manifest=JTNFbiUyNCUyMzUlM0NtaCU3RCUwMiUwMyUxQSUxNCUxMyUwNiUxRCUwRG13JTdEaSUwNyUxRSUxNyUwNCUxRWYlN0YlNjBpZWMlN0QtJTI0NyUyMC0lNUJUV0VndiUzRSUyQiUzQw%3D%3D`
* **XOR Secret:** `ELEVATOR_GO_BRRR_2026`
* **Codec Version:** 2.0.1 (Resilient Base64 & URI handling)

## 6. Diagnostics & Quality Assurance
The platform includes high-fidelity regression tools to ensure physics stability across new environmental hazards.

### 6.1 Autonomous Regression Pilot
A dedicated Playwright-driven E2E agent (**"UNIT_01"**) facilitates autonomous testing:
* **Seeded Logic:** The agent uses an independent `AgentSeed` (default: 9999) for deterministic decision-making, ensuring test runs are 100% reproducible.
* **Action Pacing:** The agent's decision interval is throttled to 2250ms (50% slower than base human latency) to prevent physics desyncs during high-traffic rounds.
* **Hybrid Operations:** Operates one lift via randomized floor clicks while managing others through automation toggles.
* **Flow Validation:** Speed-runs 30-second rounds, performs "greed-based" power-up purchasing, and validates UI layering (Z-index) to prevent interaction bleed-through.
* **Fail-Safe Compliance:** Implements a physical "Kill Switch" constrained to world/sidebar interactions that yields control back to a human user upon any unauthorized mouse interaction. Keyboard events (such as Alt-Tab or F12) are ignored to prevent accidental interruptions during multitasking.
* **Persistence Testing:** Validates that game cycles (Death -> Reset) correctly clear cached state while retaining historical telemetry.
