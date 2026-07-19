# Lift Operator — Game Design Document

**Document role:** Product vision and design intent  
**Current phase:** Playable advanced prototype entering stabilization  
**Campaign scope:** 13 rounds  

**Implementation addendum (19 July 2026):** The playable structural campaign now includes Rounds 14-20. Their
direct single-lift Service Zoning foundation is implemented; traffic tuning and late-round playtesting remain open.

## 1. High concept

Lift Operator is an arcade management game that gradually becomes an automation and resource-planning puzzle.

The player operates a hotel lift system under escalating traffic pressure. Early play is direct and physical: click floors, react quickly, rescue angry guests, and enjoy the increasing chaos. As the building grows and exceptions accumulate, manual reactions become insufficient. The player must assign lift roles, select automations, buy a constrained loadout, time emergency power-ups, and eventually create custom routing logic.

The game teaches systems thinking through play:

- Identify the real bottleneck.
- Distinguish travel, capacity, boarding, routing, and patience problems.
- Allocate specialized lifts.
- Compare algorithms using repeatable seeded traffic.
- Improve a strategy after a visible failure.
- Trade immediate consumable power against long-term automation quality.

## 2. Design north star

> Lift Operator begins as a frenetic arcade management game and becomes an operational strategy puzzle. Each round introduces or recombines a diagnosable bottleneck. Players are expected to fail difficult rounds, learn their traffic and hazard patterns, revise their automation and power-up loadout, and overcome them through planning, timing, and system mastery—not grinding or one mandatory solution.

The game already has enough mechanics. Development should deepen interaction between existing mechanics rather than adding more.

### Automation engagement invariant

Automation reduces repetitive workload but never replaces the operator. From Round 2 onward, setting every lift to Sweep and then making no manual decisions, policy changes, or power-up interventions must not complete a campaign round.

The player supervises automated flow, identifies exceptions, and intervenes with high-leverage decisions. Round 2 teaches this hybrid relationship with minimal intervention; later rounds require specialization, policy selection, resource timing, and customization. A built-in automation that completes a round unattended has become an autoplay solution and violates the arcade-to-strategy design.

Player-authored custom automation is the deliberate exception. A custom policy may earn a Hands-Free achievement when it completes an eligible advanced round without manual intervention. This rewards the player for translating operational insight into working logic; built-in automations never qualify for Hands-Free.

## 3. Player experience arc

### 3.1 Early game: arcade operations

The early game should feel lively, readable, and forgiving.

The player:

- Learns direct lift control.
- Receives frequent visual feedback.
- Encounters one major idea at a time.
- Can recover from small mistakes.
- Feels increasing speed and competence.
- Learns that automation and power-ups are tactical tools.

Failure should be uncommon in the first two rounds and plausible from round three onward.

### 3.2 Middle game: tactical coordination

The middle game asks the player to diagnose traffic and assign roles.

The player:

- Chooses between built-in automations.
- Creates dedicated lift roles.
- Responds to jams, traffic funnels, and VIP exclusivity.
- Buys one strong answer or several narrower answers.
- Learns that power-up timing matters as much as purchase choice.
- Uses manual control as intervention rather than the default strategy.
- Remains actively engaged while automation handles routine movement.

### 3.3 Late game: operational puzzle

The late game emphasizes planning, scarcity, automation, and mastery.

The player:

- Studies the round briefing and prior failure.
- Selects a loadout with meaningful opportunity cost.
- Uses custom automation to reduce reliance on consumables.
- Accepts that not every threat can be neutralized.
- Chooses which queues, lifts, or guests deserve priority.
- Replays seeded rounds to refine strategy.

Late-game novelty should come from combinations, topology, objectives, timing, and resource constraints—not additional systems.

## 4. The problem–solution–mastery loop

Every major round must define:

1. **Problem:** The operational bottleneck introduced or emphasized.
2. **Likely first failure:** The understandable mistake a player may make.
3. **Evidence:** What the player can observe that explains the failure.
4. **Insight:** The strategic conclusion the round is teaching.
5. **Solution space:** At least three viable approaches where practical.
6. **Mastery:** The behaviour proving that the lesson has been learned.
7. **Recombination:** How a later round tests the lesson again.

Example:

| Element | Room Service example |
| --- | --- |
| Problem | Boarding throughput collapses when bulky carts enter mixed queues |
| Likely failure | Player buys extra capacity and still loses guests |
| Evidence | Lift has spare space but remains at the floor boarding |
| Insight | The bottleneck is service time, not capacity |
| Solutions | Wide Doors; isolate carts; route urgent guests elsewhere |
| Mastery | Player keeps bulky service from blocking critical traffic |

## 5. Failure and retry

Failure is part of the intended learning loop, particularly from the middle campaign onward.

A good failure must be:

- **Short enough to retry.**
- **Diagnosable.**
- **Repeatable through the same seed.**
- **Actionable through a different plan.**
- **Free from irreversible grind.**

Default retry should preserve the round seed. The player may later be offered a deliberate “new traffic pattern” option, but retrying the learned pattern is the primary puzzle experience.

Ordinary failure performs a complete attempt rollback:

- Return to the shop for the same round.
- Restore the point balance earned at the end of the previous round.
- Clear the inventory and shopping cart.
- Remove every runtime consequence of the failed attempt.
- Preserve the round and seed so the player can apply what they learned.

Purchases are therefore provisional until the round is completed. The only carryover from a failed attempt is player knowledge.

Round 12 is the deliberate exception: death is its completion condition. The attempt, spending, score, and payout commit when the last of the normal 20 lives is lost, and the campaign automatically advances.

## 6. Core rules

### 6.1 Building and lifts

- Floors are indexed from Ground (`G`, floor 0) upward.
- Lifts have limited weight capacity.
- Players can route manually or assign automation.
- Lifts transition through explicit movement and door states.
- Different guest types change weight and boarding time.
- Later hazards temporarily disrupt availability or throughput.

### 6.2 Guest patience

Guests progress through readable urgency states:

- Happy
- Annoyed
- Critical
- Rage

Rage removes the guest and costs lives. Exact thresholds are balance parameters governed by the target configuration, not repeated throughout narrative documentation.

### 6.3 Seeded traffic

Each round uses a seeded random sequence. A Game ID should reproduce:

- Guest origins and destinations.
- Guest types.
- Hazard timing.
- Scheduled events.

Automation decisions should not consume the same random stream as environment generation. Separate streams are required for deterministic comparison.

### 6.4 Round completion

Rounds may use:

- Timed survival.
- Delivery quota.
- Endurance until all 20 lives are lost.
- A special operating constraint such as gravity.

Every round must state its win condition and failure reason clearly before play.

### 6.5 Endurance completion

Round 12 has no conventional victory state. It asks:

> How many minutes can you operate before the 20th guest defenestrates?

The player:

- Starts with the normal 20 lives.
- Continues until lives reach zero.
- Earns score and Credits from survival duration, guests served, and service quality.
- Does not retry the round after death.
- Automatically progresses to Round 13.

This is an earned-loss round: eventual death is expected, but better planning produces a longer run and a larger economic reward for the final challenge.

## 7. Automation

Built-in automations are not simple upgrades. They represent different operational policies:

- **Sweep:** Efficient directional throughput.
- **Priority Sweep:** Emergency triage.
- **Voting:** Concentrated demand response.
- **Weighted Voting:** Urgency-aware demand response.
- **Custom:** Player-designed routing for a known traffic problem.
- **Service Zoning:** Workshop-configured direct service bands assigning each lift an inclusive floor range.

No built-in automation should complete a campaign round unattended. A round should reward active supervision, selecting or combining policies, and intervening according to traffic structure. Player-authored custom automation may eventually achieve unattended mastery and qualify for Hands-Free recognition.

Custom automation is the long-term strategic progression. A better script should reduce emergency spending and manual intervention rather than merely increase a score counter.

Service Zoning is a later scale-oriented Workshop progression. A zoned lift accepts a guest only when both the current
floor and destination are within its configured range. G is included as an ordinary serviced floor, not as a transfer
hub; this mirrors real lift behavior and supports Room Service and Checkout journeys that use the lobby. Transfers,
G-hub routing, and arbitrary multi-lift passenger journeys remain deferred.

## 8. Power-ups

Power-ups are consumable operational interventions. They should:

- Solve a particular class of bottleneck.
- Be dramatic and legible.
- Have meaningful timing.
- Carry opportunity cost.
- Avoid completely invalidating a hazard.
- Support multiple solution combinations.

The current catalog is sufficient:

| Power-up | Primary bottleneck |
| --- | --- |
| Wrench | Lift availability after jams |
| Air Freshener | Stink quarantine and evacuation |
| Calming Musak | Patience pressure |
| Turbo Module | Travel time and recovery distance |
| TARDIS Mode | Capacity |
| Wide Doors | Boarding and unloading throughput |
| Group Think | Destination fragmentation |
| Double-Decker | Sustained high-capacity movement |
| Open Plan | Multi-lift coordination and lateral transfer |

## 9. Hazards and special traffic

Hazards exist to change decisions, not just subtract performance.

| Mechanic | Decision it should create |
| --- | --- |
| Room Service | Separate bulky traffic or accelerate boarding |
| Lift jam | Preserve redundancy, repair, or tolerate local failure |
| Checkout rush | Dedicate capacity to a directional funnel |
| VIP | Reserve exclusivity without starving normal traffic |
| Stink | Quarantine, cleanse, or reroute |
| Rooftop event | Prepare for a synchronized destination spike and release |
| Gym Bros | Manage weight and crowd composition |
| Gravity | Trade fuller loads against upward speed |

Randomness must remain bounded. A hazard should create pressure without producing an unavoidable loss before the player can respond.

## 10. Economy principles

The economy exists to create loadout decisions.

For most shop visits:

- A typical player can buy one meaningful item or save.
- A strong player can buy one premium item or several small items.
- A struggling player retains access to a recovery option.
- The player cannot buy every relevant answer.
- Gold tiers require saving, excellent performance, or achievement milestones.

Credits should reward the behaviour a round teaches. Remaining-time bonuses should only be used where time remaining is a meaningful performance measure.

Career achievements should primarily represent mastery and long-term status. They should not overwhelm repeatable operational income.

Detailed targets are defined in `Game Economy.md`.

## 11. Difficulty and fairness

The target campaign is not a smooth linear ramp. It alternates:

- Introduction
- Practice
- Pressure test
- Combination
- Mastery wall
- Recovery or expression round

Difficulty walls are desirable when failure is instructive. Difficulty spikes caused only by higher spawn rates are not.

A difficult round should support at least three solution classes where practical:

- Power-up/loadout solution
- Automation/routing solution
- High-skill manual or hybrid solution

## 12. Feedback requirements

The game must help the player diagnose:

- Queue growth by floor.
- Guest urgency.
- Lift utilization and load.
- Boarding versus travel delay.
- Hazard state and remaining duration.
- Why a guest refused to board.
- Why the round ended.
- What consumed lives.

Round review should report actionable information, not just totals.

Planned audio reinforces operational state without becoming a hidden rule system: effects make power-ups and hazards recognizable, gameplay music signals pressure, menus/modals remain neutral and quiet, and victory has a distinct fanfare. Pressure-derived audio must not expose developer telemetry or influence simulation decisions.

## 13. Scope boundaries

Current stabilization excludes:

- New power-ups or hazards.
- Additional campaign rounds.
- Global online leaderboards.
- Multiple save profiles.
- Theme systems.
- Mod/plugin APIs.
- Major visual redesign.

The approved audio workstream is a post-stabilization feedback improvement, not a theme system or new mechanic. Its implementation boundary, attribution requirements, and acceptance tests are maintained in `IMPLEMENTATION_HANDOFF.md` Section 15.

These may return after the core progression, economy, configuration, testing, and execution-containment model are stable.

## 14. Security and curiosity

Lift Operator is designed for children and friends learning programming. It is not intended to resist a determined attacker.

The design rule is:

> Protect the experience from accidents, not the source from curious players.

XOR-obfuscated debug manifests are appropriate because they prevent accidental access while remaining discoverable to anyone motivated to inspect and understand the code. A player who finds the secret and constructs a debug payload has achieved a valuable learning outcome.

Containment work should focus on:

- Preventing accidental script lockups.
- Recovering cleanly from malformed data.
- Making Debug and Monkey sessions visible.
- Avoiding accidental corruption of ordinary saves.

Anti-cheat, strong authentication, and hiding implementation details are not product goals.
