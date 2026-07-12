# Game Design Document: Lift Operator
**Current Version:** Prototype Phase 1 (Pre-Refactor)

## 1. Core Overview
*Lift Operator* is an educational, time-management/automation game. The player manages a multi-floor elevator system to clear queues of waiting guests. As the game escalates in difficulty, human reaction time becomes insufficient, forcing the player to rely on built-in logic algorithms (and eventually, their own coded automations) to survive.

## 2. Core Mechanics
* **The Grid:** 15 Floors (G, 1-14). 
* **The Lift:** Capacity of 10. Travels at 0.5s per floor. Takes 1.0s to board/drop off.
* **Progression Tracking:** Game runs on timed 3-minute rounds. Difficulty scales via an increasing "Spawn Rate" percentage.
* **PRNG System:** Spawns are handled by a custom Park-Miller seeded random number generator. Players can input a "Game ID" (seed) to replay the exact same traffic patterns to test different algorithms.

### 2.1 Guest Lifecycle & Rage State
Guests spawn on random floors with random destinations. They have a strict patience timer:
* **Happy (Green):** 0–10 seconds.
* **Annoyed (Orange):** 10–20 seconds.
* **Critical (Red/Blinking):** 20–30 seconds.
* **Rage (Black/Skull):** 30+ seconds. The guest defenestrates (flies out the window) and the player loses 1 Life. The player starts with 20 Lives.

## 3. The Progression Arc (Rounds 1–9)
* **Round 1 (Welcome):** 1 Lift. Manual click-to-route control.
* **Round 2 (Auto):** Introduces **Sweep** automation.
* **Round 3 (Rush Hour):** 2 Lifts. Higher spawn rate.
* **Round 4 (Triage):** Introduces **Priority Sweep** automation.
* **Round 5 (Democracy):** 3 Lifts. Introduces **Voting** & **Weighted Voting**.
* **Round 6 (Wild Card):** Introduces **Lift Jams**. Elevators have a 0.5% chance per second to jam for 5–15 seconds, trapping passengers and halting operations.
* **Round 7 (Check-out):** 4 Lifts. 50% of all spawns are forced to the Ground (G) floor, creating massive traffic funnels.
* **Round 8 (VIP):** Introduces **VIPs (⭐)**. VIPs demand a 100% empty lift, refuse to ride with others, and cost 10 Lives if they Rage. *Design Trap:* VIPs broadcast high priority to AI lifts, causing the AI to arrive empty, get "stolen" by normal queueing guests, and soft-lock while trying to pick up the VIP. Forces manual intervention.
* **Round 9 (Happy Hour):** 5 Lifts. Introduces **Farts** and **Rooftop Sunset**.

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