# Automation Workshop Specification

**Document role:** Durable Workshop and Automation Dock product/containment contract
**Document status:** Active feature specification; implementation status is tracked below.
**Owner class:** Product and engineering
**Last reviewed:** 31 July 2026

## 1. Player purpose

The Workshop allows players to convert operational insight into a reusable routing policy.

It should help the player answer:

- What information does a lift need?
- Which demand should be prioritized?
- How should a policy respond to urgency, direction, load, and distance?
- Why did the lift choose its current target?
- Can a better policy reduce manual clicks and power-up spending?

Custom automation is the strategic culmination of the game, not an unrestricted JavaScript editor.

## 2. Status

### Implemented

- Blockly workspace.
- Built-in scripts: Sweep, Priority Sweep, Voting, Weighted Voting.
- Copy/edit/save/delete workflow.
- Local storage per player name.
- Blueprint sharing through encoded URLs.
- A routing bridge exposing selected building queries.
- Generated JavaScript execution inside a dedicated Worker for non-system scripts.
- Source validation rejects browser globals, dynamic-code access, imports, and loop constructs.
- Worker execution has a 250ms deadline and is terminated on timeout.
- Capacity sensors use effective capacity and passenger weight.
- Service Zone metadata and the permanent two-step Automation Dock described below.

### Known implementation gaps

- Imported script origin is not clearly communicated.
- Custom script errors are logged but not fully explained in the game UI.
- Open Plan observations are not part of a stable bridge.
- Script identifiers use inconsistent prefixes.

### Deliberately undeveloped capabilities

- Event callbacks such as `onFloorReached`.
- Persistent script memory.
- A mandatory event-hat/root block.
- A visual Think block in the current block set.

These are future feature candidates, not current release commitments. Loop blocks are currently rejected rather than
instrumented with a bounded iteration model.

## 2.1 Service Zoning policy extension

Service Zoning is a saved policy capability, not a separate lift configuration workflow. The player creates or copies
an automation, adds a Service Zone block, saves it, and assigns the resulting automation to one or more lifts through
the normal in-game automation controller.

### Built-in policies

Round 14 unlocks two scalable read-only examples:

- **Zoned Low:** serves from G through the calculated midpoint floor.
- **Zoned High:** serves Ground plus the calculated midpoint floor through the highest floor.

The midpoint is shared by both policies, giving one floor of overlap. For a building with floors 0 through `maxFloor`,
the pivot is `ceil(maxFloor / 2)`, so Low is `0..pivot` and High is `0` plus `pivot..maxFloor`. Ground is a shared
direct-service exception for every zoned policy, including valid custom zones; it does not turn Ground into a
passenger-transfer hub. Existing unzoned built-ins remain available; zoning is optional and is initiated by assigning
a Zoned policy to a lift.

### Blockly and policy metadata

The Service Zone block is declarative and saved as policy metadata. It supports three modes:

- **Low** — scalable lower-band preset.
- **High** — scalable upper-band preset.
- **Custom** — explicit lower and upper floors controlled by the contextual Workshop parameter panel.

The contextual panel edits the selected block’s parameters. It does not select a lift or mutate a live lift directly.
The saved Blockly representation remains the editable source; generated code is only an execution cache.

When a policy is assigned to a lift, its resolved service zone applies for as long as that policy is active. Changing
to Manual or an unzoned policy restores full-building service. A manual target may temporarily move the lift outside
its zone, but incompatible new guests still cannot board and the Zoned routine resumes after the manual override.
Passengers already onboard are allowed to complete their destinations before the new zone governs future service.

Zoning metadata must survive save, copy, import, and blueprint sharing. Existing scripts without zone metadata migrate
as unzoned policies.

## 2.2 In-game Automation Dock

The in-game controller is the deployment surface for saved policies, not a second Workshop. It must make a growing
library of built-in, player-authored, and shared automations usable across large fleets without altering policy content.

- The player chooses one automation in a horizontal basement/lobby dock, or selects one or more lift targets first.
- Policy and target selection are independent while the Dock is disarmed, so either order is valid. Once a policy is
  armed, clicking a lift assigns it immediately.
- Carousel navigation previews an automation only; clicking its text arms it, or disarms it when the same policy is
  already armed. Library entries arm the selected policy through the same pathway.
- The remembered carousel position is a presentation preference, not an active selection. A Dock mount starts disarmed
  with no guidance, even if it previews the previously browsed automation.
- When a policy is armed, lift controllers flash for five seconds as a one-shot hint. The policy remains armed after the
  hint ends and every subsequently clicked controller receives it until the policy is disarmed.
- When disarmed, selected lift controllers retain a separate batch-selection treatment. Clicking a policy while lifts
  are selected assigns it to the whole batch immediately, clears that batch, and leaves the policy armed.
- The controller row occupies a fixed-width basement level beneath Ground and is marked by a non-interactive `⚙⇅`
  badge. Armed-lift guidance expires after five seconds without disarming the policy.
- Lift controls show their current assignment as status, including Manual and resolved Service Zone labels. They do not
  expose independent policy pickers.
- The carousel shows the player's pinned policies. Manual and currently unlocked built-ins are pinned by default;
  pin choices persist per player and can be changed from the Library.
- The Library is a vertically scrolling accordion with Built-in, Custom, and Shared with Me groups. Pinning changes
  carousel membership only; it never arms or applies an automation.
- Clicking Library toggles the panel closed, and opening any other modal closes it.
- The Dock carousel gives the previous/next controls the larger clickable share of the available space, keeps the policy
  label compact, and communicates armed state through colour/state semantics rather than a visible “Armed” suffix. The
  Dock Library button is a visibility toggle; the open Library panel is closed with an icon-only `×` control.
- Manual is a first-class assignable policy and clears automation/policy constraints exactly as it does today.
- Unlock, ownership, shared-script, policy-version, and Service Zone rules remain authoritative regardless of how the
  Dock renders them.

### Permanent controller policy

The Automation Dock is the sole in-game deployment surface. It owns presentation and interaction only; policy discovery,
unlock logic, assignment rules, and persistent state remain canonical in the shared automation services. There is no
Debug-only controller switch or alternate in-game selector.

## 2.3 Future counterweight compatibility

The post-R20 Counterweight trilogy does not introduce a second automation controller or special paired-lift authoring
surface. Existing built-ins, saved Blockly policies, custom policies, and the Automation Dock continue to assign one
policy per lift. The movement engine owns the fixed adjacent-pair consequence of a command.

For R21–R23, a manual or automation target selected for either car applies through the ordinary assignment/target path;
the engine moves its counterweight partner in the opposite direction. Zoned policy manual overrides retain their normal
temporary-out-of-zone behaviour. Open Plan is an operational timed power-up, not a Workshop block: it enables legal,
destination-aware transfers between adjacent cars sharing a floor while preserving capacity, stink, Gym Bro, VIP, and
other boarding checks.

Before custom policies are asked to solve the eight-lift Counterweight Network, the automation bridge must expose only
canonical, deterministic pair state required for safe observation—paired-lift identity, current floor/target, movement
availability, and whether an Open Plan transfer window is active. It must not expose a way to rewire pairs, bypass the
complementary-floor rule, transfer guests directly, or mutate another lift's protected state.

## 3. Workshop unlock

Target campaign unlock: Round 10.

Before Round 10, players learn the limitations and strengths of built-in policies. The Workshop becomes meaningful only after the player has real routing problems to encode.

Built-in scripts may be visible earlier as read-only examples.

## 4. Allowed control scope

Automation controls routing policy only.

Allowed actions:

- Set a lift target floor.
- Set logical sweep direction.
- Emit a bounded diagnostic thought/message.

Not allowed:

- Force doors.
- Override VIP exclusivity.
- Ignore capacity.
- Ignore quarantine.
- Directly change guest destinations.
- Change lives, points, timers, or configuration.
- Access the DOM, storage, network, or application globals.

The physics engine remains the final authority and clamps or rejects invalid actions.

## 5. Sensor model

Sensors should be truthful, bounded, and consistent with game rules.

### Lift sensors

- Current floor
- Current physical direction
- Current sweep direction
- Effective load in weight units
- Effective capacity
- Free capacity
- Passenger count
- Is empty
- Is full by weight
- Is jammed
- Is stinky/quarantined

### Passenger sensors

- Count by destination
- Highest and lowest destination
- Count by urgency
- Whether a VIP is onboard
- Heavy/bulky passenger count

### Building sensors

- Waiting count on floor
- Waiting weight on floor
- Urgent count on floor
- Nearest floor matching a condition
- Whether another lift claims a floor
- Current queue peak

Sensors must return snapshots, not mutable game objects.

## 6. Block set

### Core release set

- Conditions
- Boolean logic
- Numeric comparison
- Bounded variables
- Set target floor
- Set sweep direction
- Sensors listed above
- Think/diagnostic block

### Bounded iteration

General JavaScript loops should not be exposed.

If iteration is required, provide domain blocks such as:

- For each floor, maximum `numFloors` iterations.
- Find best floor by score.
- Count floors matching a condition.

Generated execution must have a known upper bound.

## 7. Decision cycle

Automation should run on explicit route-recalculation events, not every animation frame.

Candidate events:

- Lift becomes idle.
- Boarding/unloading completes.
- Current target becomes invalid.
- A critical condition appears.
- A bounded periodic fallback occurs.

Each decision returns:

```json
{
  "targetFloor": 7,
  "sweepDirection": 1,
  "thought": "Critical queue on 7"
}
```

The engine validates and applies the response.

## 8. Execution containment

### Current implementation

Non-system custom automation executes in a dedicated Web Worker. The worker receives an immutable sensor snapshot and
returns only target-floor and sweep-direction actions. Source validation rejects loop constructs, browser globals,
dynamic-code access, storage/network APIs, and imports. The engine terminates the worker after 250ms, validates returned
actions, applies service-zone/passenger constraints, and reports failures without blocking the game.

### Remaining containment limits

- There is no script-memory API, so bounded persistent memory is a future capability rather than an active risk.
- Loop constructs are rejected rather than transformed into a bounded iteration model.
- The capability/snapshot contract is internal and not yet an explicit versioned public API.
- Imported/shared origin and runtime errors need clearer player-facing explanation.

For this hobby project, containment protects session reliability rather than providing an adversarial security boundary.

## 9. Script memory

Target memory API:

- Key/value data scoped to one script and one lift.
- JSON-compatible primitives only.
- Strict total size limit.
- Reset at campaign reset.
- Clearly defined persistence across attempts and rounds.

Recommended initial rule:

- Persist during a round.
- Restore with the attempt snapshot on retry.
- Clear between rounds unless the block explicitly uses career memory in a later feature.

## 10. Debugging experience

The Workshop should teach through visible consequences.

Required feedback:

- Current thought above the lift.
- Last decision and reason.
- Sensor values used.
- Invalid-target warning.
- Compile/runtime/timeout error.
- Target-change rate.
- Oscillation or stall warning.

The player should be able to compare a built-in and custom policy on the same seed.

## 11. Blueprint format

Blueprints require:

- Format version.
- Script ID separate from display name.
- Author label.
- Blockly serialization.
- Capability version.
- Optional generated code only as a cache; Blockly data remains the editable source.
- Optional checksum for detecting accidental corruption.
- Clear import consent.

On import:

1. Validate payload size and schema.
2. Sanitize metadata.
3. Deduplicate ID.
4. Regenerate executable form from allowed blocks where possible.
5. Mark as imported/external until saved by the player.

XOR URL encoding is intentional lightweight obfuscation. A player who discovers the codec and constructs a blueprint or Debug manifest has achieved a valid programming-learning outcome.

## 12. Educational progression

Suggested Workshop challenges:

1. Clone Sweep and display its chosen target.
2. Rescue critical guests without starving onboard passengers.
3. Dedicate a lift to a zone.
4. Avoid floors claimed by another lift.
5. Build a load-aware policy for Gym Bros.
6. Build a gravity-aware policy for Round 13.

Success should be measured by outcomes such as service quality, stability, and reduced spending—not raw execution tick count.

## 13. Acceptance criteria

- A player can create a useful policy without writing text code.
- Sensors reflect effective game rules.
- No block can mutate protected state directly.
- Execution cannot freeze the main UI.
- Errors are understandable and recoverable.
- Same script + same state yields the same decision.
- Shared blueprints are versioned and clearly identify their origin.
- Custom automation provides economic value by reducing manual intervention or consumable use.
