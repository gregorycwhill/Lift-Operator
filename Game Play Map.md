# Lift Operator — Marie's Birthday Edition Game Play Map

**Status:** Canonical campaign intent  
**Runtime authority:** `design/game-balance.v1.json`  
**Release:** `0.3.2-maries-birthday` / `Maries-Birthday-2026-11-08.4`

## Progression contract

Lift Operator follows a problem → attempted solution → mastery loop. A new pressure should be legible, may take a
couple of attempts to understand, and then becomes part of later mixed rounds. Early play is arcade-like; later play
shifts toward resource management, zoning, and network design.

Round 1 is manual. Every lift from Round 2 onward starts in Sweep. A clicked floor is an explicit intervention: every
otherwise-compatible guest at that floor may board regardless of the car's previous Sweep direction, then Sweep
resumes. The Workshop and other algorithms are optional; Marie's intended path is Sweep plus manual intervention.

Round 2 is the onboarding exception: unattended Sweep may win while the player watches how it behaves and learns that
manual intervention is available. From Round 3 onward, unattended all-Sweep remains a diagnostic baseline rather than
the intended solution. Balance work compares it with competent intervention and human play rather than distorting an
introductory round merely to defeat automation.

Round 2 uses one instruction only: “Sweep is already on; click a floor to intervene.” Priority Sweep unlocks in Round 3
but has no mandatory tutorial; it remains an optional, discoverable alternative for players who explore the Automation
Dock.

## Mechanic introductions

| Round | Introduction | Player decision |
|---:|---|---|
| 1 | Manual dispatch | Learn pickup, destination, patience, capacity |
| 2 | Sweep default | Let routine traffic flow; intervene where Sweep misses pressure |
| 3 | Room Service | Allocate capacity around slow, bulky traffic |
| 5 | Pets; Pet Snacks | Set pet admission and manage conflict/congregation |
| 6 | Jams; Wrench | Preserve redundancy and repair at the right time |
| 7 | Checkout wave | Respond to a strong temporary flow toward Ground |
| 8 | VIP; Musak | Protect an exclusive multi-stage journey |
| 9 | Rooftop Party; random Stink; Air Freshener | Respond to a temporary destination shock; no Rooftop music plays |
| 10 | Independent zoning | Give each lift All/Low/High coverage without changing Sweep |
| 11 | Gym Bros; threshold Stink | Manage heavy traffic and cabin congregation |
| 12 | Endurance | Last until the twentieth life is lost; target 4–8 minutes |
| 13 | Gravity | Manage weight-sensitive travel |
| 14 | Large direct-service zoning | Scale zones and overlap before introducing connections |
| 15 | One-transfer journeys | Design zone overlap so guests can change lifts once |
| 16–21 | Transfer networks | Combine connections with hazards, events, recovery, and scale |
| 22 | **Best in Show** | Solve a pet-heavy zoned interchange |
| 23 | Advanced interchange | Operate a large conventional transfer network |
| 24–25 | Capsule dispatch | Coordinate many independent single-capacity cars |

## Campaign schedule

| R | Title | Floors / lifts | Spawn curve | Active pressure |
|---:|---|---:|---:|---|
| 1 | First Shift | 10 / 1 | 0.08→0.18 | Gentle manual basics |
| 2 | Probation by Automation | 10 / 1 | 0.27→0.3375 | Sweep orientation; unattended win acceptable |
| 3 | Room Service, Going Up | 10 / 2 | 1.00→1.30 | Room Service |
| 4 | Code Red | 10 / 2 | 0.99→1.17 | Triage |
| 5 | Pet-Friendly Hotel | 10 / 3 | 1.47→1.80 | First pets (15%) |
| 6 | Out of Service | 15 / 3 | 1.20→1.50 | Pets, jams |
| 7 | Everybody Out | 15 / 4 | 1.25→1.40 | Strong Checkout wave |
| 8 | The Important Guest | 15 / 4 | 1.20→1.50 | VIP |
| 9 | Party at the Top | 15 / 5 | 1.00→1.70 | Rooftop, Stink, pets |
| 10 | Divide the Work | 15 / 5 | 1.50→1.75 | First zoning; Checkout; VIP |
| 11 | Do you even lift, bro? | 15 / 5 | 0.96→1.15 | Gym Bros, Rooftop, pets |
| 12 | The Longest Shift | 15 / 4 | 0.50→2.60 | Endurance |
| 13 | Uphill Battle | 15 / 4 | 1.08→1.26 | Gravity |
| 14 | Divide and Conquer | 20 / 5 | 1.50→1.90 | Zoned scale |
| 15 | The Sky Lounge Gala | 20 / 6 | 1.55→2.00 | First transfer network; Rooftop/VIP |
| 16 | No Zone Is an Island | 20 / 6 | 1.60→2.10 | Transfer overlap and recovery |
| 17 | Rooftop Express | 25 / 6 | 1.65→2.20 | Tall transfer network; Rooftop |
| 18 | Festival Weekend | 25 / 7 | 1.70→2.30 | Transfer network; strong Checkout wave |
| 19 | The Vertical City | 30 / 8 | 1.75→2.40 | Large mixed transfer network |
| 20 | The Grand Network | 30 / 10 | 1.80→2.50 | Transfer network; Checkout finale |
| 21 | Changing Lifts | 20 / 6 | 1.35→1.75 | Focused interchange challenge |
| 22 | **Best in Show** | 25 / 7 | 1.30→1.65 | Pet-heavy interchange (30%) |
| 23 | The Grand Interchange | 30 / 8 | 1.25→1.60 | Advanced transfer network |
| 24 | Welcome to the Future | 15 / 10 | 2.80→3.60 | Capsules; light pets |
| 25 | A series of tubes | 30 / 20 | 4.00→5.00 | Zoned capsule finale |

## Pets

Pets accompany normal guests and consume no capacity beyond their owner. Pet owners are mutually exclusive with VIP,
Checkout, Room Service, and Gym Bro roles. Each lift exposes All, Cats, Dogs, or No Pets; this filter is independent of
automation and zoning.

Pet identity uses an overlaid `🐱` or `🐶` face badge. The destination number or `G` remains centred and unobstructed;
the badge never consumes queue or cabin layout width.

A cat and dog together start one five-second warning. Pet Snacks prevent or resolve conflict but do not prevent Stink.
If unresolved, the cabin clears at its next stop; every passenger is requeued, pet owners become Critical, and original
spawn time/final destination remain intact. Five or more pets create Stink. Pet owners tolerate Stink; ordinary guests
do not. Air Freshener suppresses Stink but does not settle conflict.

Pets are introduced in R5 and recur thereafter. R5 teaches the mechanic; R22 **Best in Show** recombines it with zoning
and transfers. Capsule capacity naturally prevents mixed-pet conflict while retaining pet identity.

## Zoning and transfers

Zoning begins in R10. All/Low/High is an operating property of a lift, not an automation policy. Ground remains shared.
Changing a zone must never silently change Sweep or another selected automation.

Transfers begin in R15 and remain enabled through R23. A guest always prefers a direct lift. If no direct route exists, the engine deterministically
selects one valid interchange covered by both legs and compatible with the owner's pet. The same guest object is
requeued at the interchange; patience and final destination are preserved. A guest may transfer at most once and may
never loop. If filters/zones remove its route, it waits visibly until coverage returns.

## Checkout cadence

Checkout is a strong authored wave, not background traffic every second round. It appears only in R7, R10, R18, and
R20. Each wave has a start/end window and at least 80% Checkout conversion during the window. Outside the window,
ordinary traffic resumes.

## Endurance

R12 starts with the usual 20 lives and has no quota or countdown. Play continues until the twentieth guest
defenestrates; death completes the round and advances the campaign. Target competent survival is 4–8 minutes: shorter
does not feel distinct from a standard round, while longer risks boredom.

## Retry and economy contract

Failure in an ordinary round always shows Round Review, then returns to that same round's shop with the pre-attempt
Credits restored and an empty attempt inventory. No purchase or gameplay result carries through a failed attempt.
Experience is the intended carry-over.

## Validation authority

Correctness gates and commands are in `TEST_PLAN.md`; balance methodology is in `BALANCE_WORKFLOW.md`. Canonical data
is edited in `design/game-balance.v1.json`, regenerated with `npm.cmd run balance:generate`, and never hand-edited in
`generated/game-balance.js`.
