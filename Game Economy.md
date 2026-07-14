# Lift Operator: Game Economy & Mechanics (Tiered)

This document serves as the comprehensive reference for all tiered achievements, power-ups, gameplay hazards, and physics constants in Lift Operator.

---

## 🏆 Career Achievements
Achievements are permanent feats tracked across all rounds. Unlocking a tier grants a one-time point bonus to the operational wallet.

| Badge | Achievement | Tier | Requirement | Reward |
| :--- | :--- | :--- | :--- | :--- |
| 🟫🐟 | **Service Award** | Bronze | 10 Delivered | 2 Pts |
| ⬜🐟 | **Service Award** | Silver | 30 Delivered | 5 Pts |
| 🟨🐟 | **Service Award** | Gold | 50 Delivered | 10 Pts |
| 🟫🤖 | **Hands-Free Inventor** | Bronze | 2 Rounds (No clicks) | 2 Pts |
| ⬜🤖 | **Hands-Free Inventor** | Silver | 6 Rounds (No clicks) | 5 Pts |
| 🟨🤖 | **Hands-Free Inventor** | Gold | 9 Rounds (No clicks) | 10 Pts |
| 🟫📦 | **Sardine Packer** | Bronze | 1 Perfect Load | 2 Pts |
| ⬜📦 | **Sardine Packer** | Silver | 3 Perfect Loads | 5 Pts |
| 🟨📦 | **Sardine Packer** | Gold | 5 Perfect Loads | 10 Pts |
| 🟫⌨️ | **Hacker Award** | Bronze | 500 Script Ticks | 2 Pts |
| ⬜⌨️ | **Hacker Award** | Silver | 5,000 Script Ticks | 5 Pts |
| 🟨⌨️ | **Hacker Award** | Gold | 20,000 Script Ticks | 10 Pts |
| 🟫↔️ | **Parallel Universe** | Bronze | 1 Lateral Transfer | 2 Pts |
| ⬜↔️ | **Parallel Universe** | Silver | 10 Lateral Transfers | 5 Pts |
| 🟨↔️ | **Parallel Universe** | Gold | 25 Lateral Transfers | 10 Pts |
| 🟫🚡 | **Double Trouble** | Bronze | 5 Served (Double-D) | 2 Pts |
| ⬜🚡 | **Double Trouble** | Silver | 15 Served (Double-D) | 5 Pts |
| 🟨🚡 | **Double Trouble** | Gold | 40 Served (Double-D) | 10 Pts |

---

## ⚡ Power-Up Catalog
Purchased from the Shop using Points.

| Power-Up | Tier | Cost | Effect / Logic |
| :--- | :--- | :--- | :--- |
| **🔧 The Wrench** | Bronze | 1 | Fix 1 jammed lift instantly. |
| | Silver | 3 | Fix ALL jammed lifts instantly. |
| | Gold | 5 | Fix ALL + 30s Global Jam Immunity. |
| **🌲 Air Freshener** | Bronze | 1 | Clear stink + 15s Immunity (1 lift). |
| | Silver | 3 | Clear stink + 15s Immunity (ALL lifts). |
| | Gold | 5 | Clear ALL + 30s Global Stink Immunity. |
| **🎵 Calming Musak** | Bronze | 1 | Pause anger timers for 15s (1 lift). |
| | Silver | 3 | Pause anger timers for 15s (ALL). |
| | Gold | 5 | Global 15s Pause + Soothe Anger Level (Rage -1). |
| **🚀 Turbo Module** | Bronze | 1 | Travel at 0.1s/floor for 10s (1 lift). |
| | Silver | 3 | Travel at 0.05s/floor for 15s (1 lift). |
| | Gold | 5 | ALL lifts travel at 0.05s/floor for 20s. |
| **🌌 TARDIS Mode** | Bronze | 1 | Infinite capacity for 15s (1 lift). |
| | Silver | 3 | Infinite capacity for 15s (ALL). |
| | Gold | 5 | Infinite capacity for 30s (ALL). |
| **🚪 Wide Doors** | Bronze | 1 | 2x Boarding Speed for 20s (Global). |
| | Silver | 3 | 3x Boarding Speed for 30s (Global). |
| | Gold | 5 | Instant Boarding for 30s (Global). |
| **✨ Group Think** | Bronze | 2 | Target Floor: Waiting guests sync to majority dest. |
| | Silver | 4 | Target Lift: Passengers sync to majority dest. |
| | Gold | 6 | Global Consensus: ALL guests sync to majorities. |
| **🚡 Double-Decker** | Bronze | 3 | Enable Double-Decker (2x Cap) for 30s (1 lift). |
| | Silver | 5 | Enable Double-Decker (2x Cap) for 60s (1 lift). |
| | Gold | 8 | Enable Double-Decker (2x Cap) for 45s (ALL). |
| **↔️ Open Plan** | Bronze | 4 | Enable Lateral Transfer for 20s (1 lift). |
| | Silver | 6 | Enable Lateral Transfer for 45s (1 lift). |
| | Gold | 10 | Enable Lateral Transfer for 30s (ALL). |

---

## 🚀 Game Events & Hazards Logic

### 🔘 Special Spawn Events & NPCs
| Event | Requirement | Trigger / Frequency | Precise Impact |
| :--- | :--- | :--- | :--- |
| **Check-out Rush** | Round 7 | 50% spawn chance | 50% of new guests target Floor 0 (Lobby). |
| **Rooftop Party** | Round 9+ | 30s mid-round event | 50% of non-VIPs target Top Floor simultaneously. |
| **VIP Visit** | Round 8+ | 1 per round | Spawns in **Annoyed** state; Defenestration = -10 Lives. |
| **Gym Bro** | Any | Weight 2.0 | 2x Boarding Time; Stink Hazard if 3+ are in one lift. |
| **Room Service** | Round 3+ | 5% spawn chance | Weight 3.0; 3x Boarding Time; Occupies 3x capacity. |

### 🌌 Physics & Gravity Calculations
*   **Gravity Phase:** Only active in **Round 13 (Pedal Power)**.
*   **Sensitivity:** Base `gravityConstant` is 0.4.
*   **Standard Lift Penalty:** `1 - (currentWeight / maxCapacity) * 0.8` multiplier to speed.
*   **Double-Decker Penalty:** Sensitivity is doubled. `1 - (currentWeight / maxCap) * 1.6` multiplier.
*   **Speed Floor:** Penalty never slows a lift below **10%** of its base speed.
*   **Lateral Transfer (Open Plan):** Lifts must be aligned within **20%** of floor height. Guests move if target lift is closer to their destination. Both lifts must have the effect active.

---

## ⏱️ Patience & Decay Ranges
*   **Status: Happy** | 0s - 20s | No penalty.
*   **Status: Annoyed** | 20s - 40s | Spawns with yellow icon.
*   **Status: Critical** | 40s - 60s | Red flashing icon; speed-boarding encouraged.
*   **Status: Rage** | 60s+ | Guest leaves (Defenestration). Loss of 1 Life (Standard) or 10 Lives (VIP).

