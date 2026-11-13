# Automation and Workshop Specification

**Status:** Optional-system contract for Marie's Birthday Edition

## Player contract

Round 1 is Manual. Every eligible lift from Round 2 onward begins in Sweep, so campaign progress never depends on
understanding the Automation Dock deployment gesture. A manual floor selection temporarily overrides Sweep for that
service stop, boards every otherwise-compatible guest regardless of prior travel direction, then returns control to
Sweep.

Built-ins and custom Workshop programs remain optional experimentation. The Birthday campaign must be winnable through
Sweep, manual intervention, lift zones, pet admission, and power-ups. No briefing may require Marie to use the Workshop.

## Built-in policies

- **Manual:** no automatic destination selection.
- **Sweep:** directional circuit and default from R2.
- **Priority Sweep:** gives urgent queues stronger selection priority.
- **Voting / Weighted Voting:** scores visible demand.

The Automation Dock assigns a policy to one or more lifts. It must not own zoning or pet admission.

## Independent operating properties

From R10 each lift has a Zone setting: All, Low, or High. From R5 each lift has a pet-admission setting: All, Cats,
Dogs, or No Pets. Changing either setting must preserve the current automation. The controls are compact and colocated
with the lift status so a Sweep-focused player need not enter the Workshop.

Custom automation may still define service ranges through the validated bridge, but the ordinary Zone button is the
campaign teaching surface. Direct service is preferred. From R15, runtime routing may give a waiting guest one
deterministic transfer when two compatible zones overlap.

## Custom program lifecycle

1. The player creates or edits a named program in the Workshop.
2. The program is parsed and validated before storage or execution.
3. A dedicated worker evaluates a bounded snapshot; it cannot access the DOM, storage, network, or main-thread game
   objects.
4. The bridge validates returned actions and clamps targets to legal floors.
5. Timeout, malformed output, or forbidden source terminates the program without blocking the game.
6. The Automation Dock can assign a valid saved program like another policy.

Hands-Free achievements apply only to custom automations, not built-ins. This rewards experimentation without making it
mandatory for Marie's campaign.

## Stable bridge

Read-only inputs may include:

- current floor, target, direction, state, capacity/load, passengers, and jam/Stink state;
- waiting counts, urgency, destinations, floor count, and current service range;
- deterministic automation PRNG and bounded memory owned by the program.

Allowed output is a target-floor action or no action. Output cannot change lives, Credits, time, inventory, passenger
state, pet filters, zones, hazards, or power-up timers. Design-only telemetry and projected Survival Index are not
available to programs in this release.

## Validation and containment

- Reject browser/global APIs, dynamic evaluation, imports, unbounded constructs, oversized source, invalid actions,
  and unsupported schema versions.
- Run in a worker with a hard deadline and terminate it when overdue.
- Keep automation randomness independent of the environment/spawn PRNG.
- Preserve same-seed reproducibility for built-ins, custom programs, simulation, and replay.
- A bad program can make poor lift decisions but cannot freeze the page or mutate campaign state directly.

## Deferred ideas

Workshop pet sensors/blocks, shared automation import, and advanced Round-20+ access to pressure metrics are future
design candidates. They are not Birthday release dependencies and must not add dormant framework work now.
