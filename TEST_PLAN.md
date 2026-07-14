# Lift Operator Regression Test Plan

**Executive Summary:** Regression suite achieved 100% (15/15) pass rate on 2026-07-13.

## 1. Core Gameplay Features

| Feature | Success Criteria | Test Method | Status |
| :--- | :--- | :--- | :--- |
| **Player Flow** | Player registers, round starts, guests spawn, round ends, round review, points update. | Simulator run of Round 1 (3m). | ✅ Implemented |
| **Manual Control** | Clicking a floor moves the lift to that target floor. | Simulator script triggers `Registry.lifts[0].targetFloor` manually. | ✅ Implemented |
| **Automations** | Sweep and Priority Sweep logic pick up guests in correct order. | Round 2 (Sweep) / Round 4 (Priority) verification. | ✅ Implemented |
| **Workshop** | Custom code generates a `AutomationVM` and executes ticks. | Load sample XML, check `Registry.customScriptTicks` increment. | ✅ Implemented |
| **Workshop: UI** | Canvas populates, selecting built-ins works, copying creates custom scripts. | Open Workshop, switch scripts, copy 'Sweep', verify new script creation. | ✅ Implemented |
| **Shop** | Purchasing a power-up deducts points and adds it to inventory. | Scripted purchase of 'Wrench', verify `PowerUps.inventory`. | ✅ Implemented |
| **Scoring** | Served guests are counted; ragers deduct lives. | Mock served/raged guests and verify `Registry.points` & `Registry.stats.lives`. | ✅ Implemented |
| **Social Sharing** | The navigator.share API is called (or fallback logged). | Attempt to trigger sharing after round summary. | ✅ Implemented |
| **Universal Links** | Game accepts Seeds, Challenges, Blueprints, and Leaderboards from URI. | Mock `Registry.pendingManifest` and verify `ui-manifest.js` processing. | ✅ Implemented |

---

## 2. Round Challenges

| Round / Challenge | Success Criteria | Test Scenario | Status |
| :--- | :--- | :--- | :--- |
| **Round 1 (Start)** | Lift boards guest 1 immediately. Round finishes without lockup. | Deterministic Round 1 run. | ✅ Implemented |
| **Check-out Rush** | 50% of spawns target Floor 0 (G). | Round 7 simulation; count destination spread in stats. | ✅ Implemented |
| **Lift Jams** | Lift state becomes `JAMMED`, 0.5% chance/sec, timer counts down, state returns to `IDLE`. | Force `isJammed: true` and verify recovery after `jamTimer` ticks. | ✅ Implemented |
| **VIP Arrival** | VIP icon appears, demands empty lift, costs 10 lives if raged. | Spawn a guest with `isVIP: true`, check rejection logic for other guests. | ✅ Implemented |
| **Endurance** | Timer is bypassed, shift only ends on served quota (50) or death. | Round 12 simulation; verify `timeLeft` <= 0 does not end round. | ✅ Implemented |
| **Pedal Power** | Gravity is activeed; lift speed depends on load weight. | Round 13 simulation; verify `liftGravity` calculation. | ✅ Implemented |
| **Farts** | Lift turns green, 0.5% chance/sec, onboard guests leave at next opportunity, guests avoid boarding, non-farting guests age 2x. | Force `stinkTimer > 0`, check `canPickUp` condition and aging multiplier. | ✅ Implemented |
| **Rooftop Sunset** | Guests redirect to top floor, timers pause for duration of party. | Trigger "Sunset" event, verify destination changes and `pausePatience`. | ✅ Implemented |
| **Gym Bros** | Occupy 2x weight (2.0). 3+ Gym Bros cause "Stink" effect. | Verify `getLiftWeight` and trigger `stinkTimer` via Gym Bro density. | ✅ Implemented |
| **Room Service** | Carts take 3x to board, occupy 3 capacity (3.0), and slow others. | Spawn `isRoomService`, verify `stateProgress` increments at 1/3 rate. | ✅ Implemented |

---

## 3. Power-Ups

| Power-Up | Success Criteria | Test Method | Status |
| :--- | :--- | :--- | :--- |
| **Air Freshener** | Instantly clears `stinkTimer` on a lift. | Apply to a stinky lift; verify `stinkTimer === 0`. | ✅ Implemented |
| **Turbo** | Increases `liftSpeed` for the duration. | Apply 'Turbo', measure floor-travel distance vs standard. | ✅ Implemented |
| **Wrench** | Instantly clears `isJammed` state. | Apply to a jammed lift; verify `isJammed === false`. | ✅ Implemented |
| **Musak** | Slows patience decay for all passengers inside that lift. | Apply 'Musak', verify `waitTimer` increments at 0.5x rate. | ✅ Implemented |
| **Wide Doors** | Increases `boardingSpeedMultiplier`. | Apply 'Wide Doors', verify `stateProgress` increments > 0.02 per tick. | ✅ Implemented |
| **Group Think** | Syncs destinations to majority. | Verify `p.dest` in a lift with 3 guests (Dest A, A, B) all become A after use. | ✅ Implemented |
| **Double-Decker** | Lift capacity doubles; safe-capping logic active. | Purchase and apply; check `maxCapacity` equals 20 and top-floor clamping. | ✅ Implemented |
| **Open Plan** | Lateral movement occurs when lifts align. | Trigger aligned state; verify guest displacement from Shaft A to B. | 🟡 In-Progress |

---

## 4. Phase 2 Enhancements (Physics & Logic)

| Requirement | Success Criteria | Test Scenario | Status |
| :--- | :--- | :--- | :--- |
| **State Machine: Transitions** | Lift cycles `IDLE -> DOORS_OPENING -> BOARDING -> DOORS_CLOSING -> TRANSIT`. | Log state changes during a single pickup/delivery cycle. | ✅ Implemented |
| **Gravity: Upward Penalty** | Upward travel speed is slower when lift weight > 0. | Time a 5-floor ascent at 0 weight vs 10 weight; verify > 0.5s difference. | ✅ Implemented |
| **Gravity: Downward Parity** | Downward travel speed is unaffected by weight. | Time a 5-floor descent at 0 weight vs 10 weight; verify identical timing. | ✅ Implemented |
| **State: Effects Array** | Effects appear and expire on schedule. | Apply '✨', verify `lift.effects` length is 1, wait 1.5s, verify length 0. | ✅ Implemented |
| **Room Service: Weight** | Room Service cart occupies 3.0 weight units. | `getLiftWeight` returns 3.0 for a single 🛒 passenger. | ✅ Implemented |
| **Gym Bro: Swol Effect** | 3 Gym Bros trigger stink. | Add 3 💪 guests to a lift; verify `stinkTimer > 0` immediately. | ✅ Implemented |

---

## 5. Automation & VM Robustness

| Scenario | Success Criteria | Test Method | Status |
| :--- | :--- | :--- | :--- |
| **Boundary Guard** | Scripts cannot target floor -1 or floors >= Config.numFloors. | `setTarget(-1)` rejected by bridge; `randomFloor` clamped to [0, N-1]. | ✅ Implemented |
| **Seed Stability** | Negative or float seeds do not cause PRNG to return negative values. | Simulation with seed `0.0001` proves floor counts stay >= 0. | ✅ Implemented |
| **Blueprint: ID Sanitization** | Script IDs are sanitized to prevent `custom_` prefix duplication. | Import script with `custom_` prefix, verify mapping in `AutomationVM`. | ✅ Implemented |

---

## 6. Phase 3: Centralization & Debug Verification

| Requirement | Success Criteria | Test Scenario | Status |
| :--- | :--- | :--- | :--- |
| **Config: Solo Object** | `achievements.js` and `powerups.js` reference `Config.GAME_DATA` instead of local variables. | Delete local arrays in modules; verify no "undefined" errors on game start. | ⚪ Planned |
| **Config: Override** | Values in `config_test.js` successfully overwrite defaults in `Config.GAME_DATA`. | Create `config_test.js` with 1-second round time; check `Registry.stats.timeLeft` equals 1. | ⚪ Planned |
| **Debug: URI Lock** | Loading the game *without* a data param results in `debugMode === false`. | Refresh `index.html`; verify "Debug Menu" button is hidden. | ⚪ Planned |
| **Debug: Secure Auth** | Passing valid encoded "system:debug" data unlocks all rounds. | Generate XOR-encoded debug link; verify "Warp" menu shows Rounds 1-15 unlocked. | ⚪ Planned |
| **Debug: Modal Consent** | User is prompted before entering Sandbox Mode. | Click "Accept" on manifest modal; verify `Registry.points === 99999`. | ⚪ Planned |

---

## 8. Autonomous Regression (E2E Monkey Testing)

| Logic | Success Criteria | Deployment | Status |
| :--- | :--- | :--- | :--- |
| **Seeded Pilot** | Decisions are deterministic based on `AgentSeed`. | `tests/auto-pilot.spec.js` | ⚪ Planned |
| **Modal Stress** | "Ghost clicks" fail to reach game layer through overlays. | Validation of Z-index layering. | ⚪ Planned |
| **Profile Isolation** | Agent clears profile `UNIT_01` before start. | verify `localStorage` wipe. | ⚪ Planned |
| **Kill Switch** | Human `mousedown` immediately halts autonomous loop. | Manual intervention test. | ⚪ Planned |
| **Round Loop** | Completion of 10+ rounds in < 10 mins via 30s timers. | End-to-end flow speedrun. | ⚪ Planned |

## 9. Execution Strategy

1. **Deterministic Runner:** The `engine-simulator.js` will be used to run rounds at high speed (60fps simulation, headless).
2. **Autonomous Pilot:** Non-headless Playwright runs for UI/Interaction validation.
3. **State Assertions:** After each simulated round, a `TestReport` object will be generated comparing actual `Registry` state against expected values.
4. **UI Dashboard:** A simple overlay in `index.html` (triggered by the "Run Regression Suite" button) will display a checklist of these tests with Pass/Fail status.
