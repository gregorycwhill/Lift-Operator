# Game Play Map
This file is used to manage the introduction of various game mechanics. It drives documentation and code.
The intent is to ensure the game progression is challenging, without being overwhelming; that mechanics are introduced in a logical order; that game balance is achieved throughout.
The definitions of the mechanics exists in other documents. This document is to provide a holistic view of the sequencing and key parameters of the game to maximise playability.

| Type | Name | Parameters | Round 1 | Round 2 | Round 3 | Round 4 | Round 5 | Round 6 | Round 7 | Round 8 | Round 9 | Round 10 | Round 11 | Round 12 | Round 13 | Round 14 | Round 15 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Content | Round Title | | Welcome | Automations Unlocked | Rush Hour | Triage | Democracy | The Wild Card | Check-out Rush | VIP Arrival | Happy Hour & Hazards | Sandbox Unlocked | The Gym Challenge | Endurance Mode | Pedal Power | Multi-Dimensional | The Grand Opening |
| Content | Round Description | | Basic controls | Intro Sweep | Weight Intro | Urgency focus | Voting intro | Hazards begin | G-Floor funnel | Single-rider VIPs | Environmental | Scripting | Stink hazard | No Timer | Gravity active | Double-Decker intro | Final Challenge |
| Content | Player Rank | | Operator | Operator | Manager | Manager | Director | Director | Captain | Captain | Marshal | Marshal | Marshal | Marshal | Marshal | Marshal | Supremo |
| Structure | Number of Floors | | 10 | 10 | 10 | 10 | 10 | 15 | 15 | 15 | 15 | 15 | 15 | 15 | 15 | 20 | 25 |
| Structure | Number of Lifts | | 1 | 1 | 2 | 2 | 3 | 3 | 4 | 4 | 5 | 5 | 5 | 5 | 5 | 5 | 6 |
| Structure | Lift Capacity | | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 12 | 12 | 15 | 15 | 20 |
| Operations | Lift Travel Speed | | 1.0x | 1.0x | 1.0x | 1.0x | 1.0x | 1.2x | 1.2x | 1.2x | 1.4x | 1.4x | 1.4x | 1.5x | 1.5x | 2.0x | 2.0x |
| Operations | Boarding Speed | | 1s/unit | 1s | 1s | 1s | 1s | 0.8s | 0.8s | 0.8s | 0.7s | 0.7s | 0.6s | 0.6s | 0.5s | 0.4s | 0.3s |
| Operations | Spawn Rate | Start, End | 2.5s | 2.2s | 2.0s | 1.8s | 1.5s | 1.4s | 1.3s | 1.2s | 1.1s | 1.0s | 0.9s | 0.8s | 0.7s | 0.6s | 0.5s |
| Operations | Patience | Happy/Annoy/Crit/Rage | 20/40/60/70 | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| Power-Ups | Wrench | | - | - | - | - | - | Intro | - | - | - | - | - | - | - | - | - |
| Power-Ups | Air Freshner | | - | - | - | - | - | - | - | - | - | - | Intro | - | - | - | - |
| Power-Ups | Musak | | - | - | - | - | - | - | - | - | - | - | - | Intro | - | - | - |
| Power-Ups | Turbo | | - | - | - | - | - | - | - | - | - | - | - | Intro | - | - | - |
| Power-Ups | TARDIS | | - | - | - | - | - | - | - | - | - | - | - | - | Intro | - | - |
| Power-Ups | Wide Doors | | - | - | - | - | - | - | - | - | - | - | - | - | Intro | - | - |
| Power-Ups | Group Think | | - | - | - | - | - | - | - | - | - | - | - | - | - | Intro | - |
| Power-Ups | Double-Decker | | - | - | - | - | - | - | - | - | - | - | - | - | - | Intro | - |
| Power-Ups | Open Plan | | - | - | - | - | - | - | - | - | - | - | - | - | - | - | Intro |
| Hazards | Lift Jam | Rate, Duration | - | - | - | - | - | 0.5% | 0.5% | 0.5% | 0.5% | 0.5% | 0.8% | 0.8% | 1.0% | 1.5% | 2.0% |
| Hazards | Farts | Rate, Duration | - | - | - | - | - | - | - | - | 1.0% | 1.0% | 1.5% | 1.5% | 2.0% | 2.5% | 3.0% |
| Hazards | Check-out | % towards G | - | - | - | - | - | - | 50% | 50% | 30% | 30% | 30% | 30% | 40% | 50% | 60% |
| Hazards | Rooftop Party | % towards Max | - | - | - | - | - | - | - | - | 40% | 40% | 30% | 30% | 30% | 40% | 50% |
| Hazards | VIP Visit | Rate | - | - | - | - | - | - | - | 5% | 5% | 5% | 5% | 5% | 8% | 10% | 15% |
| Hazards | Gym Bros | Rate | - | - | - | - | - | - | - | - | - | - | 15% | 15% | 15% | 15% | 20% |
| Hazards | Room Service | Rate | - | - | 10% | 10% | 10% | 10% | 10% | 10% | 10% | 10% | 10% | 15% | 15% | 20% | 25% |
| Hazards | Gravity | Scalar | - | - | - | - | - | - | - | - | - | - | - | - | 1.0 | 1.2 | 1.5 |
| Automations | Manual | | Enabled | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| Automations | Sweep | | - | Intro | - | - | - | - | - | - | - | - | - | - | - | - | - |
| Automations | Priority Sweep | | - | - | - | Intro | - | - | - | - | - | - | - | - | - | - | - |
| Automations | Voting | | - | - | - | - | Intro | - | - | - | - | - | - | - | - | - | - |
| Automations | Weighted Voting | | - | - | - | - | Intro | - | - | - | - | - | - | - | - | - | - |
| Automations | Custom | | - | - | - | - | - | - | - | - | - | Intro | - | - | - | - | - |
| Workshop | Control | Logic blocks | - | - | - | - | - | - | - | - | - | Intro | - | - | - | - | - |
| Workshop | Sensors | Observability | - | - | - | - | - | - | - | - | - | Intro | - | - | - | - | - |
| Workshop | Connectivity | Memory/API | - | - | - | - | - | - | - | - | - | Intro | - | - | - | - | - |

