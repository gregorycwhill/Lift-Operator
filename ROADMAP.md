# Lift Operator Product Roadmap

**Purpose:** Product outcomes and sequence. This is not an implementation checklist.
**Status:** Active product roadmap  
**Owner class:** Product  
**Last reviewed:** 26 July 2026
**Current delivery:** `DELIVERY_PLAN.md` — `0.3.0-network-campaign-preview` playtest release

## Product north star

Lift Operator begins as a fast arcade lift game and develops into an operational strategy puzzle. Each important round
creates a diagnosable bottleneck: players learn why a familiar tactic failed, adapt lift roles/automation/loadout, and
master the same seeded traffic through understanding rather than grinding.

## Now — Prove the network campaign

**Outcome:** The existing R14–R20 Service Zoning foundation becomes understandable and reliable enough for human
playtesting.

- Direct single-lift service bands are consistent across play, simulation, and automation.
- Players can see coverage, understand refusals, and recover from a bad zoning decision.
- Large fleets and tall buildings remain usable.
- Telemetry and replay reports identify the real failure mode before traffic tuning begins.
- R9 rooftop and R13 affordability evidence closes the known late-campaign playtest questions.
- R19–R20 fit the supported viewport, modal/countdown timing is trustworthy, and late-event audio/visual state resets
  cleanly.
- The VIP round becomes a three-leg service challenge, and the Rooftop Party communicates its lifecycle clearly.

**Gate:** A player can explain a zoning failure, reproduce it with a seed/configuration, and choose a credible next
strategy. See `DELIVERY_PLAN.md` and `TEST_PLAN.md`.

**Accepted product direction:** Service Zoning is authored through saved Workshop policies. Round 14 introduces the
scalable `Zoned Low` and `Zoned High` built-ins, while all existing built-ins remain available. Players can copy a
policy, adjust its Service Zone block, save a custom variant, and deploy it through the normal in-game automation menu.
The Workshop does not select individual lifts for zoning.

**Accepted product direction:** Automation assignment will move from per-lift HTML select menus to an in-world
Automation Dock in the basement/lobby space. The player selects one policy, selects one or more target lifts, and
explicitly applies it as a batch. The dock provides pinned shortcuts; a separate library overlay holds the growing
custom and shared collection. This is a desktop campaign interface and remains outside the later phone-first edition.
The Automation Dock is now the permanent production controller; the former per-lift selector and Debug controller
variant have been removed. Pin choices persist per player; Manual and unlocked built-ins are pinned by default, while
Custom and Shared with Me automations are curated through a scrollable accordion Library.

## Next — Tune the extended campaign

**Outcome:** R14–R20 form a coherent second arc about fleet architecture, resilience, and Workshop advantage.

- Tune traffic only after direct-service correctness, responsive UI, and telemetry gates pass.
- Validate viable manual/hybrid, built-in-plus-loadout, and custom Workshop solution classes where practical.
- Use the intended progression: local zones, VIP/Rooftop coverage, recovery redundancy, Checkout concentration,
multi-exception fleets, then 30-floor network mastery.

**Gate:** Human failure diagnoses match round intent, and balance changes are reproducible through canonical data,
fixed seeds, compact reports, and recorded playtests.

## Later — Counterweight Pairs and Open Plan puzzle arc

**Outcome:** Introduce a deliberately puzzle-themed round in which familiar lift controls operate a mechanically
coupled system. The challenge comes from anticipating consequences across a pair, not from learning a new control
interface.

### Product concept

Two adjacent lifts form a counterweight pair with a continuous visual loop around pulleys at the top and bottom of the
shaft. When one lift moves up, its paired lift moves down. The pair maintains a complementary position: for floors
indexed from zero, `currentFloorA + currentFloorB = maxFloor`; for displayed floors one through N, the equivalent is
`floorA + floorB = N + 1`.

The player controls either lift through the normal interface. There is no master/slave relationship, paired command
mode, warning, target restriction, or consequence preview. A command sent to one lift necessarily affects the other,
and the player learns the relationship through play. Passenger loads remain independent, so each cabin may carry a
different group with different destinations and urgency.

### Decisions made for the round

- The counterweight rule is always active for the paired lifts.
- Both cabins continue to use the ordinary player controls.
- The player is allowed to make strategically bad commands; the game does not protect them from the consequence.
- Passenger loads, boarding, alighting, and guest statuses remain independent per cabin.
- A jam is devastating at pair level and represents a major loss of infrastructure, not an ordinary isolated lift delay.
- Stink uses its existing rules. It may still create an unexpected recovery opportunity by forcing a cabin to unload and
  reducing a problematic load.
- Turbo applies to the pair but provides only half its normal speed benefit because it is driving two lifts.
- Gravity is always relevant because every pair movement includes one upward-moving cabin. The pair’s effective movement
  burden should reflect the upward leg rather than allowing the player to avoid gravity by choosing a direction.
- Arrival rates are deliberately slower than ordinary high-pressure rounds. Difficulty comes from planning, passenger
  distribution, and recovery decisions rather than raw spawn volume.
- The round should not initially combine the paired system with every major event. Rooftop, VIP, Checkout, heavy
  Room Service, and repeated jams are candidates for later variants once the base puzzle is understood.

### Player comprehension

The pre-round Welcome/Briefing screen must explain the physical rule before the first attempt. It should communicate,
in plain language, that the lifts are paired as counterweights: when one rises, the other descends. It should show a
simple example using displayed floor numbers and explain that the player still controls either lift normally. The
briefing should make the consequence clear without presenting the mechanic as a warning or restriction:

> These lifts share a counterweight loop. Move one up and its partner moves down. Both cabins carry their own guests.
> Plan for the pair.

The in-game visual language should make causality legible without adding an advisory interface: matching pair colours,
continuous pulley/loop animation, clearly connected shafts, and simultaneous opposite movement. Players should be able
to understand what happened after a command even though the game never prevented the command.

### Intended learning arc

The first puzzle round teaches that lift position and passenger distribution are coupled strategic resources. Players
learn to consider the partner’s load and future destination before commanding either cabin. The round should reward
observation, anticipation, and manual intervention rather than fast clicking or automation alone.

The following round or progression beat introduces the **Open Plan** power-up. Open Plan allows guests to swap cabins at
the midpoint of a journey. Its role is intentionally linked to the counterweight lesson: the puzzle round first creates
the problem of passengers being in the less useful cabin, then Open Plan becomes a meaningful problem-solving tool for
repairing that distribution mid-journey.

Open Plan should therefore not be available during the introductory Counterweight Pairs round. Its later introduction
turns a frustrating consequence into a learned strategic opportunity without weakening the initial puzzle’s identity.

**Gate:** Players can explain the paired counterweight rule, recognise that a command to either cabin affects its
partner, and describe why Open Plan is useful after experiencing the coupled-load problem. The round is not ready for
implementation planning until its teaching beat, failure recovery expectations, and traffic envelope are playtested.

Open Plan is deliberately introduced after the introductory Counterweight Pairs round. This keeps the first puzzle
focused on learning the coupled-lift consequence, then gives players a later tool that solves the passenger-distribution
problem they have already experienced.

## Later — Mobile edition

**Outcome:** A stripped-back, phone-first version makes the core lift-routing game readable and enjoyable on a modern
mobile screen without carrying over desktop-only complexity.

The mobile edition is a distinct product slice, not merely responsive styling:

- No Workshop or player-authored automation.
- No wide 4+ lift presentation.
- No buildings taller than 15 stories.
- Floor and lift layouts fit within a phone viewport without requiring desktop-scale horizontal fleet management.
- Core manual routing, loadouts, power-ups, guest rules, and authored-round learning remain legible and coherent.

The mobile scope must decide whether the full authored campaign is adapted or a curated mobile campaign is selected.
It must also define whether mobile shares progression and saves with the desktop build. Those decisions belong in the
future mobile delivery plan, not in the current implementation plan.

**Gate:** A representative phone playtest shows that players can understand and complete the mobile campaign slice
without Workshop, wide fleets, or buildings above 15 stories, with acceptable touch targeting and no essential round
depending on removed desktop systems.

## Later — Endless operations

**Outcome:** Players who complete or outgrow the authored campaign can continue into fresh, fair operational challenges
without losing the game’s diagnosable-problem design.

Two approaches remain open:

1. **Curated expansion:** ship a large catalogue of pre-checked rounds and seeds. This gives the strongest authored
   pacing and simplest balance evidence, but finite variety.
2. **Procedural operations:** generate round layouts, traffic, events, and constraints in-game from a seed. This offers
   greater replayability, but requires much stronger feasibility, fairness, and reproducibility controls.

The preferred investigation path is a hybrid: deterministic generation from constrained templates, followed by offline
simulation and acceptance checks before a generated operation is offered to a player. Each operation must expose its
seed, balance version, objective, and difficulty envelope; it must be replayable, diagnosable, and reject invalid or
unwinnable configurations. Runtime generation must not bypass canonical balance validation or introduce opaque random
difficulty spikes.

**Gate:** A generated or catalogue operation has a recorded intent, reproducible seed/configuration, supported strategy
profile, unattended baseline, and clear player-facing objective before it is promoted into endless play.

Endless Operations is intentionally sequenced after the mobile edition. The endless format should build on a validated
authored campaign and a settled understanding of the game’s mobile and desktop presentation constraints, rather than
becoming the next source of unbounded content before the core product shape is stable.

## Cross-cutting polish and accessibility

These are supporting activities across the roadmap rather than a separate release gate:

- Improve briefing, Review, automation visualization, and accessibility from observed playtest failures.
- Complete mobile/Safari audio acceptance and responsive layout polish as each supported product slice is prepared.
- Resolve remaining campaign balance questions, including Round 2 leverage, late-round strategy separation, and economy
  inflation, using evidence rather than broad retuning.

## Deferred

- Guest transfers, multi-lift journeys, and G-hub routing.
- New mechanics, power-ups, hazards, guest types, themes, online services, and player-facing telemetry.
- Round 20+ advanced sensors or player-constructed survival forecasting.
- Endless operations implementation until the network campaign, puzzle arc, and mobile edition are stable.

These are not commitments. Reconsider them only after the network campaign is validated and balanced.

## Product design references

- `Lift-Operator_GDD.md` — product vision and rules.
- `Game Play Map.md` — round learning arc and intended structural problems.
- `Game Economy.md` — earning, spending, retry, and progression intent.
- `Automation_Workshop_Spec.md` — Workshop player experience and containment boundary.
- `docs/archive/PLAYTEST_ARCHIVE.md` — timestamped/verbatim playtest evidence, including reconstructed chat feedback.
