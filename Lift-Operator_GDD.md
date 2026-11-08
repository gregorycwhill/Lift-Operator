# Lift Operator — Game Design Document

**Edition:** Marie's Birthday Edition  
**Canonical parameters:** `design/game-balance.v1.json`  
**Detailed sequence:** `Game Play Map.md`

## Premise

The player operates lifts in an increasingly strange hotel. Guests lose patience from spawn until final delivery; the
twentieth lost life ends an ordinary attempt. The game begins as a quick dispatch arcade game and becomes a strategic
network puzzle involving limited resources, lift specialisation, zoning, and one-transfer journeys.

The project is also a teaching game for children moving from Scratch toward purposeful JavaScript and automation.
Readable browser code and light security-by-obscurity are intentional. Discovering how the game works—even exploiting
the XOR-gated Debug tools—is a successful learning outcome, not a security incident.

## Core loop

1. Read the round briefing and optional Supply Closet.
2. Use the five-second orientation countdown to inspect lift capacity and operating controls.
3. Let Sweep handle routine service from R2 onward.
4. Notice an emerging bottleneck, intervene manually, adjust zones/pet admission, or spend a power-up.
5. Survive the round, review performance, buy for the next problem, and apply learned mastery.

The intended emotional loop is problem → struggle/failure → hypothesis → purchase/strategy → survival → mastery.
Early rounds are frenetic and novel. Later rounds reduce dependence on novel hazards and deepen resource allocation.

## Input and service rules

- Round 1 begins Manual. All eligible lifts from R2 onward begin in Sweep.
- Clicking a lift and floor is an explicit service instruction. On that stop, previous Sweep direction does not reject
  otherwise-compatible waiting guests. Sweep resumes afterward.
- Capacity, VIP exclusivity, rage, zones, pet admission, and active hazards remain binding.
- Guest wait time is spawn-to-final-destination delivery, including boarding, travel, and transfer waiting.
- The player sees guests, queues, lives, time, inventory, Credits, capacity cues, and operating controls. Internal
  telemetry and Survival Index are never player-facing.

## Failure, success, and Endurance

Ordinary rounds last 180 seconds. On success, Round Review is explicitly congratulatory. On failure, Round Review still
appears, then the player retries the same round from its shop with pre-attempt Credits restored and empty inventory.

R12 Endurance begins with 20 lives, has no quota, and continues until the twentieth guest is lost. Death advances to
the next round. The competent-survival target is 4–8 minutes.

## Automation philosophy

Automation removes repetitive movement but does not solve the game unattended. Sweep is the default baseline and
Marie's primary automation. Other built-ins and the Workshop remain optional enrichment, not campaign prerequisites.
Hands-Free achievements are reserved for custom automation, never built-ins.

Unattended all-Sweep is a balance negative control. It should expose a diagnosable bottleneck, while a small number of
good manual decisions or operating changes materially improves the result. Simulation evidence guides tuning but does
not replace novice and target-player playtests.

## Zoning and lift operating controls

Zoning begins in R10. Every lift can cycle All, Low, or High service independently of its automation. Ground remains
shared so the network cannot be accidentally severed at reception. A lift may be Sweep + Low, Manual + High, or any
other valid combination.

Pet admission appears from R5 with All, Cats, Dogs, and No Pets. It is also independent of automation and zoning. These
compact controls are the primary late-game strategy surface for a Sweep-focused player.

## Pets

Cats and dogs accompany ordinary guests. Their owner consumes normal capacity; the pet consumes no additional space or
weight. Pet owners cannot simultaneously be VIP, Checkout, Room Service, or Gym Bro traffic.

- Mixed cat/dog cabins start a five-second conflict warning.
- Pet Snacks prevent or resolve conflict but do not suppress Stink.
- An unresolved conflict clears the entire cabin at the next stop. All passengers requeue; pet owners become Critical;
  spawn time and final destination remain unchanged.
- Five or more pets create Stink. Pet owners tolerate it; ordinary guests do not.
- Air Freshener suppresses Stink but does not resolve cat/dog conflict.

Pets start in R5 **Pet-Friendly Hotel**, recur through the campaign, and peak in R22 **Best in Show**. They are a
persistent traffic class like Gym Bros or VIPs, not a two-round novelty or replacement for a retired mechanic.

## Transfers

R21–R23 are conventional independent-lift networks. A guest prefers direct service. If zones prevent it and transfers
are enabled, the engine chooses a deterministic interchange served by a compatible first and second leg. The same
guest may change lifts once, with original patience retained. Pet admission must be compatible on both legs.

Transfer behavior must be legible, loop-free, and conservative: no teleportation, no hidden patience allowance, no
second transfer, and no silent deletion when coverage changes. An uncovered guest remains visible and waits.

## Traffic and hazards

- **Room Service:** bulky/slow traffic from R3.
- **Pets:** persistent admission/conflict/congregation decisions from R5.
- **Jams:** lift outage recoverable by Wrench from R6.
- **Checkout:** strong temporary waves only in R7, R10, R18, and R20.
- **VIP:** exclusive staged journey with higher life penalty from R8.
- **Rooftop Party:** temporary destination shock from R9; dedicated party music is disabled.
- **Stink:** random or congregation-based cabin rejection; Freshener handles it.
- **Gym Bros:** heavy guests and threshold Stink from R11.
- **Gravity:** weight-sensitive speed in R13.
- **Capsules:** independent single-passenger fleet in R24–R25.

## Economy

Credits are spendable campaign currency; campaign score records earned Credits and is not reduced by spending. Prices
and unlocks live in canonical balance data. Power-ups should provide a tactical answer, not an automatic round win.
Pet Snacks costs `1/3/5` Credits for short targeted, long targeted, and shorter all-lift protection.

Removed saved inventory from the previous balance version receives a narrow cost refund. This is a one-release
migration, not a general migration framework.

## Telemetry and balance

Design-only telemetry includes arrivals, delivery rate, queues, critical guests, losses, projected Survival Index,
Little's Law residual, utilisation, manual decisions, pets spawned/served, conflict outcomes, pet Stink episodes,
filters, direct deliveries, transfers, transfer waits, uncovered passengers, and route recalculations.

Simulations use fixed seeds and report aggregates plus anomalous cases. They do not expose metrics to players or ask an
LLM to reason over every replay. See `BALANCE_WORKFLOW.md` and `TEST_PLAN.md` for thresholds and stopping rules.

## Non-goals for this edition

- More than one transfer or general group/party architecture.
- Mandatory Workshop/custom automation.
- Pet boosts, extra capacity cost, species beyond cats/dogs, or pet achievements.
- Generic topology, event-authoring, or save-migration frameworks.
- Player-facing Survival Index or design telemetry.
