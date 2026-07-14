# Game Play Map
This file is used to manage the introduction of various game mechanics. It drives documentation and code.
The intent is to ensure the game progression is challenging, without being overwhelming; that mechanics are introduced in a logical order; that game balance is achieved throughout.
The definitions of the mechanics exists in other documents. This document is to provide a holistic view of the sequencing and key parameters of the game to maximise playability.

Special note: This is the debug mode URI: index.html?manifest=JTNFbiUyNCUyMzUlM0NtaCU3RCUwMiUwMyUxQSUxNCUxMyUwNiUxRCUwRG13JTdEaSUwNyUxRSUxNyUwNCUxRWYlN0YlNjBpZWMlN0QtJTI0NyUyMC0lNUJUV0VndiUzRSUyQiUzQw%3D%3D

| Type | Name | Parameters | Round 1 | Round 2 | Round 3 | Round 4 | Round 5 | Round 6 | Round 7 | Round 8 | Round 9 | Round 10 | Round 11 | Round 12 | Round 13 | Round 14 | Round 15 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Content | Round Title | | Welcome | Automations Unlocked | Rush Hour | Triage | Democracy | The Wild Card | Check-out Rush | VIP Arrival | Happy Hour & Hazards | Sandbox Unlocked | The Gym Challenge | Endurance Mode | Pedal Power | Multi-Dimensional | The Grand Opening |
| Content | Round Objective | | Time Survival | Time Survival | Time Survival | Time Survival | Time Survival | Time Survival | Time Survival | Time Survival | Time Survival | Time Survival | Time Survival | Quota (50 Served) | Pedal Survival | Time Survival | Time Survival |
| Content | Round Description | | "Click on a lift shaft to send the car to that floor. Don't leave guests waiting too long!" | "Manual control is tough! Activate 'Sweep' to let the lift manage itself." | "Management approved a second lift! The spawn rate is climbing." | "New automation: 'Priority Sweep'. It ignores everyone else to save Critical (Red) guests." | "Three lifts! 'Voting' automations added. They act as express trains to the floor with the most votes." | "WARNING: Management added 5 more floors. Elevators now have a chance to randomly jam in the shaft." | "Check-out time! Half the hotel is trying to leave right now and head to the Ground Floor." | "A VIP demands an entirely empty lift. If they are left waiting, it will cost us 10 lives. Watch for the Star!" | "The Rooftop bar opens! Watch out for Farts. Stinky lifts force evacuations and block boarding. Adapt!" | "You can now write Custom Scripts in the Automation Workshop to handle the intense passenger loads!" | "A new Gym has opened! Gym Bros are double-wide and if 3 of them get in a lift, the smell will drive everyone else out. Watch out!" | "NO TIMER. The shift doesn't end until you run out of lives. Survive the increasing chaos as long as you can!" | "The power is out! Lift motors are running on backups. Gravity is DOUBLED. Every passenger makes the climb significantly slower." | "High-density traffic detected. Use every automation and script at your disposal!" | "Final Challenge" |
| Content | Player Rank | | Operator | Operator | Manager | Manager | Director | Director | Captain | Captain | Marshal | Marshal | Marshal | Marshal | Marshal | Marshal | Supremo |
| Structure | Number of Floors | | 10 | 10 | 10 | 10 | 10 | 15 | 15 | 15 | 15 | 15 | 15 | 15 | 15 | 20 | 25 |
| Structure | Number of Lifts | | 1 | 1 | 2 | 2 | 3 | 3 | 4 | 4 | 5 | 5 | 5 | 5 | 5 | 5 | 6 |
| Structure | Lift Capacity | | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 12 | 12 | 15 | 15 | 20 |
| Operations | Lift Travel Speed | | 1.0x | 1.0x | 1.0x | 1.0x | 1.0x | 1.2x | 1.2x | 1.2x | 1.4x | 1.4x | 1.4x | 1.5x | 1.5x | 2.0x | 2.0x |
| Operations | Boarding Speed | | 1s/unit | 1s | 1s | 1s | 1s | 0.8s | 0.8s | 0.8s | 0.7s | 0.7s | 0.6s | 0.6s | 0.5s | 0.4s | 0.3s |
| Operations | Spawn Rate | Start / End | 0.25 / 0.50 | 0.50 / 0.65 | 0.65 / 0.80 | 0.80 / 0.95 | 0.95 / 1.10 | 1.10 / 1.25 | 1.25 / 1.40 | 1.00 / 1.25 | 1.25 / 1.50 | 1.50 / 1.75 | 1.75 / 2.00 | 2.00 / 2.50 | 1.50 / 1.75 | 1.50 / 1.75 | 1.50 / 1.75 |
| Operations | Gravity Sensitivity | | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2.0 (Scalar) | 0 | 0 |
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

