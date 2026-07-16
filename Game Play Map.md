# Lift Operator — Target Game Play Map

**Document role:** Canonical target progression and round-balance specification  
**Campaign scope:** 13 rounds  
**Status:** Design candidate for iterative playtesting; not a statement of current implementation  
**Companion documents:** `Lift-Operator_GDD.md`, `Game Economy.md`, `BALANCE_WORKFLOW.md`

## 1. How to use this document

This map defines what each round is trying to teach and the parameter direction required to create that experience.

Values are divided into:

- **Structural targets:** intended campaign shape and mechanic sequence.
- **Initial tuning candidates:** starting numbers to test, not final balance.
- **Success measures:** evidence used to decide whether tuning worked.

The approved structured version of this map should eventually generate the round section of `config.js`. Until generation exists, discrepancies must be recorded in `CURRENT_IMPLEMENTATION.md`.

## 2. Campaign rhythm

| Act | Rounds | Player experience | Failure expectation |
| --- | --- | --- | --- |
| Act I — Arcade Operator | 1–3 | Direct control, speed, novelty, immediate feedback | R1 rare; R2 low; R3 first credible failure |
| Act II — Automation Manager | 4–6 | Policy choice, triage, redundancy, tactical power-ups | One or two retries at major walls |
| Act III — Systems Director | 7–9 | Traffic topology, specialization, interacting hazards | Failure should reveal allocation/timing errors |
| Act IV — Automation Engineer | 10–11 | Customization, loadout planning, complex bottlenecks | Expected retries and strategy revision |
| Act V — Master Operator | 12–13 | Known systems recombined under resource constraints | Mastery walls; success should feel earned |

## 3. Progression rules

1. Introduce one primary problem per round.
2. Introduce a tool close to its problem, but do not make it the only answer.
3. Give every new concept a later pressure test.
4. Reduce new mechanics as interaction depth increases.
5. Ensure the player can describe why they failed.
6. Preserve the same seed on retry by default.
7. Do not require a purchase the player could not reasonably afford.
8. Avoid simultaneous random hazards that create unavoidable losses.
9. Every mastery wall must support multiple solution classes.
10. A new lift increases coordination complexity and should not coincide with too many other introductions.

## 4. Mechanic introduction sequence

“Introduced” means explained and intentionally relevant. “Recombined” means previously learned behaviour becomes important again.

| Mechanic | Introduce | First pressure test | Late mastery use |
| --- | ---: | ---: | ---: |
| Manual routing | 1 | 2 | Hybrid intervention throughout |
| Sweep | 2 | 3 | Directional/zoned roles |
| Room Service | 3 | 4 | 11 |
| Priority Sweep | 4 | 6 | 8, 11–13 |
| Voting | 5 | 7 | 9, 12 |
| Weighted Voting | 5 | 8 | 11–13 |
| Wrench | 6 | 6 | 9, 12–13 |
| Lift jams | 6 | 9 | 12–13 |
| Wide Doors | 3 | 4 | 9, 11–13 |
| Checkout funnel | 7 | 7 | 12 |
| Turbo | 7 | 8 | 9, 13 |
| VIP | 8 | 8 | 11–13 |
| Calming Musak | 8 | 8 | 9, 12–13 |
| Stink | 9 | 9 | 11–13 |
| Air Freshener | 9 | 9 | 11–13 |
| Rooftop event | 9 | 9 | 12 |
| Custom automation | 10 | 11 | 12–13 |
| TARDIS | 10 | 11 | 12–13 |
| Group Think | 10 | 12 | 12 |
| Gym Bros | 11 | 11 | 12–13 |
| Double-Decker | 11 | 13 | 13 |
| Endurance until death | 12 | 12 | — |
| Gravity | 13 | 13 | — |
| Open Plan | Experimental after campaign | — | Not required for campaign balance |

### Why Open Plan is outside the core 13-round balance

Open Plan is technically and cognitively complex, partially implemented, and not required to complete the intended arcade-to-automation arc. It should remain an experimental post-campaign or sandbox mechanic until lateral transfer is reliable, observable, and testable.

## 5. Round summary

Initial numerical candidates are deliberately conservative. Spawn values use the current interpretation of expected spawn attempts per one-second spawner tick.

| R | Theme | Objective | Floors | Lifts | Spawn start→end | Primary introduction | Shop unlock |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | First Shift | Survive 90s | 8 | 1 | 0.20→0.35 | Manual routing | None |
| 2 | Let It Sweep | Survive 120s | 8 | 1 | 0.35→0.55 | Sweep | None |
| 3 | Rush Delivery | Survive 120s | 10 | 2 | 0.50→0.75 | Room Service, lift roles | Wide Doors |
| 4 | Triage Protocol | Survive 150s | 10 | 2 | 0.65→0.90 | Priority Sweep | Wide Doors T2 |
| 5 | Democracy | Survive 150s | 10 | 3 | 0.80→1.05 | Voting and Weighted Voting | None |
| 6 | Maintenance Crisis | Survive 150s | 12 | 3 | 0.85→1.10 | Lift jams, redundancy | Wrench |
| 7 | Checkout Rush | Survive 150s | 12 | 4 | 1.00→1.30 | Ground-floor funnel | Turbo |
| 8 | VIP Security | Survive 150s | 12 | 4 | 0.95→1.20 | VIP exclusivity | Musak |
| 9 | Happy Hour | Survive 180s | 15 | 5 | 1.10→1.40 | Stink and rooftop event | Freshener |
| 10 | Automation Workshop | Deliver 40 | 15 | 5 | 1.20→1.50 | Custom scripts | TARDIS, Group Think |
| 11 | Heavy Lifting | Survive 180s | 15 | 5 | 1.35→1.70 | Gym Bros and mixed weight | Double-Decker |
| 12 | Endurance Operations | Survive until 20 lives are lost | 15 | 5 | 1.45→2.10+ | Resource endurance and recombination | Higher tiers |
| 13 | Pedal Power | Deliver 50 | 15 | 5 | 1.20→1.55 | Gravity and load optimization | Full catalog |

These figures are a candidate baseline. The current implementation uses 180-second early rounds and substantially different values.

## 6. Detailed round designs

### Round 1 — First Shift

**Role in arc:** Arcade onboarding  
**New problem:** Guests have competing destinations and limited patience.  
**Likely failure:** The player waits for a full lift or overlooks a growing queue.  
**Evidence:** Queue color changes and the first loss of a life.  
**Insight:** Frequent service is safer than perfect loading.

**Solution space**

- Short manual trips.
- Prioritize visibly aging queues.
- Learn the relationship between car position, destination, and waiting floor.

**Mastery**

- Finish with no lost lives.
- Understand click-to-route without needing external instructions.

**Target feel**

- Fast doors and movement.
- Immediate first guest.
- No shop or economy distraction.
- A first-time completion rate of roughly 90–95%.

### Round 2 — Let It Sweep

**Role in arc:** Introduce automation as relief, not replacement.  
**New problem:** Traffic exceeds comfortable single-lift manual attention.  
**Likely failure:** Player continues clicking every destination and creates inefficient reversals.  
**Evidence:** Manual lift changes direction repeatedly while queues grow behind it.  
**Insight:** A simple policy can outperform reactive micromanagement.

**Solution space**

- Enable Sweep and observe it.
- Use Sweep with occasional manual correction.
- Stay manual with high-skill routing.

**Mastery**

- Complete with Sweep.
- Optional hands-free objective begins tracking.

**Target feel**

- Clearly harder manually than Round 1.
- Clearly manageable with Sweep.
- Completion rate roughly 75–90% on first attempt.

### Round 3 — Rush Delivery

**Role in arc:** First tactical wall  
**New problem:** A second lift and Room Service reveal boarding throughput and role assignment.  
**Likely failure:** Both lifts chase the same queues; bulky carts delay urgent passengers.  
**Evidence:** Lifts cluster together and remain boarding while other queues age.  
**Insight:** More lifts require coordination; capacity and boarding speed are different bottlenecks.

**Solution space**

- Split the building into zones.
- Put one lift on Sweep and manually manage the other.
- Buy Wide Doors.
- Keep bulky traffic separate from urgent queues.

**Mastery**

- Maintain distinct lift roles.
- Correctly identify when Wide Doors is more useful than capacity.

**Target feel**

- First round where a new player may fail once.
- Wide Doors Bronze should be affordable, but not mandatory.

### Round 4 — Triage Protocol

**Role in arc:** Urgency management  
**New problem:** Serving maximum volume is insufficient when a minority of guests are near rage.  
**Likely failure:** Both lifts optimize throughput and ignore critical outliers.  
**Evidence:** Healthy total service but repeated critical losses.  
**Insight:** One lift should protect urgent demand while another maintains flow.

**Solution space**

- Priority Sweep on one lift.
- Manual rescue lift plus Sweep.
- Wide Doors timed during a bulky queue.
- Musak is not yet available; routing must do most of the work.

**Mastery**

- Use heterogeneous automation roles.
- Reduce critical defenestrations without collapsing total throughput.

### Round 5 — Democracy

**Role in arc:** Policy comparison and recovery round  
**New problem:** With three lifts, directional sweep is not always the best response to concentrated demand.  
**Likely failure:** Assign the same automation to every lift.  
**Evidence:** Multiple lifts duplicate routes or ignore a dominant floor.  
**Insight:** Automation is a policy choice; different policies suit different traffic shapes.

**Solution space**

- Combine Sweep, Priority, and Voting.
- Use Weighted Voting for urgency.
- Reserve one manual lift.

**Mastery**

- Explain why each lift has its assigned policy.
- Complete without needing a new power-up.

### Round 6 — Maintenance Crisis

**Role in arc:** Availability and redundancy wall  
**New problem:** Lift jams make a perfectly optimized system brittle.  
**Likely failure:** Depend on one critical lift role with no backup.  
**Evidence:** One jam causes queues assigned to that lift to collapse.  
**Insight:** Robust systems tolerate component failure; Wrench restores availability but does not clear accumulated demand.

**Solution space**

- Buy and time a Wrench.
- Maintain overlapping coverage.
- Reassign lift roles after a jam.
- Accept one jam and preserve the Wrench for a worse moment.

**Mastery**

- Recover from a jam without cascading failure.
- Understand that repair and backlog recovery are separate problems.

### Round 7 — Checkout Rush

**Role in arc:** Traffic-topology puzzle  
**New problem:** Half of traffic flows toward Ground, producing a directional funnel.  
**Likely failure:** All lifts continue general-purpose routing.  
**Evidence:** Upper-floor queues move, but lobby-bound guests dominate losses.  
**Insight:** Traffic shape should determine specialized service.

**Solution space**

- Dedicate one or two lifts to downward checkout traffic.
- Use Voting to follow demand concentration.
- Use Turbo for rapid lobby cycling.
- Zone upper floors and Ground service separately.

**Mastery**

- Create a dedicated funnel strategy.
- Avoid sending every lift to Ground simultaneously.

### Round 8 — VIP Security

**Role in arc:** Constraint and reservation puzzle  
**New problem:** A VIP needs an empty lift and carries a severe life penalty.  
**Likely failure:** Automation repeatedly targets the VIP but normal guests occupy the arriving lift.  
**Evidence:** The VIP remains waiting while lifts visit the floor unsuccessfully.  
**Insight:** Some demand requires reserved capacity and explicit exclusion.

**Solution space**

- Reserve one lift near empty.
- Manually clear and dispatch a VIP car.
- Use Priority/Weighted automation with intervention.
- Use Musak to buy time for surrounding queues.

**Mastery**

- Serve the VIP without allowing the rest of the building to collapse.
- Treat empty capacity as a strategic resource.

### Round 9 — Happy Hour

**Role in arc:** Multi-stage event and timing wall  
**New problem:** Stink temporarily removes lift capacity while the rooftop event creates a synchronized destination spike and later release.  
**Likely failure:** Spend recovery items on the first minor incident or commit all lifts to the roof.  
**Evidence:** Quarantined cars, mass redirection, then a second congestion wave when the event ends.  
**Insight:** A round has phases; reserve resources for the dangerous transition.

**Solution space**

- Save Freshener for a high-value contaminated lift.
- Preserve one lift for ordinary traffic.
- Use Turbo for rooftop recovery.
- Use Wide Doors during the release wave.
- Reassign automations between event phases.

**Mastery**

- Anticipate the event release.
- Survive using a timed combination rather than one universal effect.

### Round 10 — Automation Workshop

**Role in arc:** Strategic expression and recovery  
**Objective:** Deliver a quota rather than merely survive a timer.  
**New problem:** Built-in automations have visible limitations under a known pattern.  
**Likely failure:** Create a script that changes target too frequently or ignores onboard passengers.  
**Evidence:** Script thought/telemetry shows unstable decisions; lift oscillates or strands riders.  
**Insight:** Good automation encodes priority and state, not just a nearest-floor rule.

**Solution space**

- Continue using built-ins.
- Clone and modify a built-in.
- Write a specialized custom policy.
- Use Group Think or TARDIS as temporary relief.

**Mastery**

- Complete with at least one custom lift.
- Observe a measurable advantage or learn why the script underperformed.

### Round 11 — Heavy Lifting

**Role in arc:** Capacity versus speed mastery wall  
**New problem:** Gym Bros and Room Service create mixed weight and boarding pressure; groups can trigger stink.  
**Likely failure:** Maximize nominal capacity and produce very slow, contaminated lifts.  
**Evidence:** Full cars travel/board poorly and cause secondary effects.  
**Insight:** The fullest possible lift is not always the highest-throughput lift.

**Solution space**

- Dedicated heavy-service lift.
- Wide Doors plus selective routing.
- Double-Decker with controlled loading.
- Custom script using effective load.
- Freshener reserved for density-triggered stink.

**Mastery**

- Balance weight, boarding time, and urgency.
- Avoid treating all guests as identical units.

### Round 12 — Endurance Operations

**Role in arc:** Resource-management capstone and high-earning score round  
**Objective:** Start with 20 lives and continue until the 20th life is lost. There is no timer and no delivery quota.  
**Completion:** Death is expected and automatically advances the campaign to Round 13.  
**Score question:** How many minutes can the player last, and how many guests can they serve, before the final defenestration?  
**New problem:** The player must extend an inevitably losing operation for as long as possible without exhausting a finite loadout.  
**Likely failure:** Use expensive/global power-ups too early.  
**Evidence:** Strong opening followed by no recovery options as traffic pressure continues to rise.  
**Insight:** Resource timing and automation efficiency determine endurance.

**Solution space**

- Conservative, specialized automations.
- Bronze/silver tactical items rather than one early gold effect.
- Group Think to reduce route fragmentation.
- Custom scripts to reduce emergency demand.
- Accept that lives will be lost and spend resources where they buy the most additional survival time.

**Mastery**

- Survive materially longer on a replay or with a better strategy.
- Convert scarce power-ups into additional minutes rather than a short-lived opening advantage.
- Demonstrate that better automation reduces consumable dependence.

**Economy role**

- Round 12 is allowed to award substantially more points than an ordinary round.
- Payout scales with survival time, guests served, and service quality.
- Purchases and item consumption commit when the player dies because death completes the round.
- No retry is offered; the player automatically proceeds to Round 13.
- The large payout gives the player resources to prepare for the final gravity challenge.

**Testing note**

The 30-second Workflow Monkey must use a test-only Endurance pressure multiplier or life-loss accelerator so it can exercise the death → payout → automatic Round 13 transition without waiting for a full human endurance run.

### Round 13 — Pedal Power

**Role in arc:** Final optimization puzzle  
**New problem:** Upward travel slows with load, reversing the normal assumption that full lifts are always efficient.  
**Likely failure:** Use TARDIS or Double-Decker to maximize load and create extremely slow climbs.  
**Evidence:** Heavy cars visibly stall upward while lighter cars cycle faster.  
**Insight:** Throughput is a product of load and cycle time; optimal loads are below maximum.

**Solution space**

- Smaller upward batches.
- Separate up and down service.
- Turbo for critical heavy climbs.
- Custom load-aware routing.
- Double-Decker used selectively rather than continuously.

**Mastery**

- Complete by optimizing flow rather than maximizing capacity.
- Apply lessons from every earlier bottleneck.

## 7. Hazard tuning principles

### Random hazards

- Random hazards must use deterministic seeded schedules.
- A single unavoidable event should not decide the round.
- Minimum spacing should prevent overlapping jams/stinks from exceeding designed pressure.
- Hazard probability must be expressed consistently per second or as scheduled events, never mixed silently with frame ticks.

### Scheduled events

VIP and rooftop events should have predictable windows communicated in the briefing or through in-game warning. Exact timing can remain seed-dependent.

### Escalation

Later difficulty should primarily increase:

- Interaction between known mechanics.
- Traffic concentration.
- Resource scarcity.
- Consequence of poor automation.
- Duration of sustained pressure.

It should not primarily increase raw hazard frequency.

## 8. Target success bands

These are initial design targets for human playtesting, not automated pass criteria.

| Round band | First-attempt completion | Completion after two retries |
| --- | ---: | ---: |
| 1–2 | 80–95% | 95%+ |
| 3–5 | 55–80% | 80–95% |
| 6–9 | 35–65% | 65–85% |
| 10–11 | 25–55% | 55–80% |
| 12 | Not applicable: death completes the round | Compare survival-time improvement |
| 13 | 15–40% | 45–70% |

Different player cohorts—manual-first, automation-first, and experienced—should be measured separately.

Round 12 is evaluated by survival distribution rather than completion rate:

- Median survival time on first attempt.
- Improvement over the player’s prior Endurance result.
- Guests served per minute.
- Points earned.
- Time at which each power-up is consumed.
- Whether the player understands why the operation eventually collapsed.

## 9. Round validation checklist

Before accepting a round:

- Is its main failure diagnosable?
- Does the briefing describe the problem without prescribing one answer?
- Can at least three strategic approaches plausibly work?
- Is every required tool affordable or avoidable?
- Does the same seed produce the same environment?
- Does a correct strategy materially outperform an incorrect one?
- Is the difficulty caused by the intended bottleneck?
- Does the review screen expose the evidence needed to improve?
- Does the round retest an earlier lesson?
- Is there a clear mastery behaviour?
