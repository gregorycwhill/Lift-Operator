# Lift Operator Regression Test Plan

This document outlines the features, success criteria, and test scenarios for the "Lift Operator" regression suite.

## 1. Core Gameplay Features

| Feature | Success Criteria | Test Method | Status |
| :--- | :--- | :--- | :--- |
| **Player Flow** | Player registers, round starts, guests spawn, round ends, round review, points update. | Simulator run of Round 1 (3m). | 🟡 In-Progress |
| **Manual Control** | Clicking a floor moves the lift to that target floor. | Simulator script triggers `Registry.lifts[0].targetFloor` manually. | 🟡 In-Progress |
| **Automations** | Sweep and Priority Sweep logic pick up guests in correct order. | Round 2 (Sweep) / Round 4 (Priority) verification. | 🟡 In-Progress |
| **Workshop** | Custom code generates a `AutomationVM` and executes ticks. | Load sample XML, check `Registry.customScriptTicks` increment. | ✅ Implemented |
| **Workshop: UI** | Canvas populates, selecting built-ins works, copying creates custom scripts. | Open Workshop, switch scripts, copy 'Sweep', verify new script creation. | 🟡 In-Progress |
| **Shop** | Purchasing a power-up deducts points and adds it to inventory. | Scripted purchase of 'Wrench', verify `PowerUps.inventory`. | 🟡 In-Progress |
| **Scoring** | Served guests are counted; ragers deduct lives. | Mock served/raged guests and verify `Registry.points` & `Registry.stats.lives`. | 🟡 In-Progress |
| **Social Sharing** | The navigator.share API is called (or fallback logged). | Attempt to trigger sharing after round summary. | 🟡 In-Progress |
| **Universal Links** | Game accepts Seeds, Challenges, Blueprints, and Leaderboards from URI. | Mock `Registry.pendingManifest` and verify `ui-manifest.js` processing. | ✅ Implemented |

---

## 2. Round Challenges

| Round / Challenge | Success Criteria | Test Scenario | Status |
| :--- | :--- | :--- | :--- |
| **Round 1 (Start)** | Lift boards guest 1 immediately. Round finishes without lockup. | Deterministic Round 1 run. | ✅ Implemented |
| **Check-out Rush** | 50% of spawns target Floor 0 (G). | Round 7 simulation; count destination spread in stats. | ✅ Implemented |
| **Lift Jams** | Lift state becomes `JAMMED`, timer counts down, state returns to `IDLE`. | Force `isJammed: true` and verify recovery after `jamTimer` ticks. | 🟡 In-Progress |
| **VIP Arrival** | VIP icon appears, demands empty lift, costs 10 lives if raged. | Spawn a guest with `isVIP: true`, check rejection logic for other guests. | ✅ Implemented |
| **Farts** | Lift turns green, onboard guests leave at next opportunity, guests avoid boarding, non-farting guests age 2x. | Force `stinkTimer > 0`, check `canPickUp` condition and aging multiplier. | ✅ Implemented |
| **Rooftop Sunset** | Guests redirect to top floor, timers pause for duration of party. | Trigger "Sunset" event, verify destination changes and `pausePatience`. | ✅ Implemented |
| **Gym Bros** | Occupy 2x weight (2.0). 3+ Gym Bros cause "Stink" effect. | Verify `getLiftWeight` and trigger `stinkTimer` via Gym Bro density. | ✅ Implemented |
| **Room Service** | Carts take 3x to board, occupy 3 capacity, and slow others. | Spawn `isRoomService`, verify `stateProgress` increments at 1/3 rate. | ✅ Implemented |

---

## 3. Power-Ups

| Power-Up | Success Criteria | Test Method | Status |
| :--- | :--- | :--- | :--- |
| **Air Freshener** | Instantly clears `stinkTimer` on a lift. | Apply to a stinky lift; verify `stinkTimer === 0`. | ✅ Implemented |
| **Turbo** | Increases `liftSpeed` for the duration. | Apply 'Turbo', measure floor-travel distance vs standard. | 🟡 In-Progress |
| **Wrench** | Instantly clears `isJammed` state. | Apply to a jammed lift; verify `isJammed === false`. | ✅ Implemented |
| **Musak** | Slows patience decay for all passengers inside that lift. | Apply 'Musak', verify `waitTimer` increments at 0.5x rate. | 🟡 In-Progress |
| **Wide Doors** | Increases `boardingSpeedMultiplier`. | Apply 'Wide Doors', verify `stateProgress` increments > 0.02 per tick. | 🟡 In-Progress |

---

## 4. Achievements

| Achievement | Success Criteria | Test Method |
| :--- | :--- | :--- |
| **Sardine Packer** | Serve a lift at 100% weight capacity. | Manual load of 10 guests, deliver to floor, check `stats.fullyLoadedLifts`. |
| **Hands-Free Inventor** | Complete a round without manual clicks using automation. | Run Round 2, keep `manualClicks: 0`, verify badge unlock. |
| **Service Award** | Deliver X guests in one round. | Run high-intensity round, check `servedThisRound` vs badge reqs. |
| **Hacker Award** | Accumulate custom script ticks. | Use Workshop, verify tick accumulation in `Registry.customScriptTicks`. |

---

## 5. Execution Strategy

1. **Deterministic Runner:** The `engine-simulator.js` will be used to run rounds at high speed (60fps simulation, headless).
2. **State Assertions:** After each simulated round, a `TestReport` object will be generated comparing actual `Registry` state against expected values.
3. **UI Dashboard:** A simple overlay in `index.html` (triggered by the "Run Regression Suite" button) will display a checklist of these tests with Pass/Fail status.
