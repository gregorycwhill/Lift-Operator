# Automation Workshop Specification

**Purpose:** Define the educational experience, current implementation boundary, target execution model, and reliability requirements for player automation.

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
- Generated JavaScript execution using `new Function`.

### Partial or inconsistent

- Capacity sensors use passenger count/base capacity instead of effective weight.
- Imported script origin is not clearly communicated.
- Custom script errors are logged but not fully explained in the game UI.
- Open Plan observations are not part of a stable bridge.
- Script identifiers use inconsistent prefixes.

### Not implemented despite earlier claims

- Reliable infinite-loop timeout.
- Isolation from browser globals that can accidentally disrupt the game.
- Bounded loop execution.
- Event callbacks such as `onFloorReached`.
- Persistent script memory.
- A mandatory event-hat/root block.
- A visual Think block in the current block set.

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

### Required target

Execute custom automation in a Web Worker or constrained interpreter.

The worker receives:

- Script identifier and version.
- Immutable sensor snapshot.
- Bounded memory state.
- Declared capability version.

The worker returns a small action object.

The engine:

- Terminates execution after a strict deadline.
- Rejects malformed responses.
- Clamps target floors.
- Limits memory size.
- Records errors without crashing gameplay.

### Current interim limitation

The current `new Function` implementation does not contain accidental infinite loops or direct browser access. For this hobby project, the primary concern is session reliability, not adversarial security.

Until isolation exists:

- Shared scripts identify their external origin and require explicit import consent.
- Unrestricted loop blocks should be disabled.
- Imported code should be reviewed or regenerated from validated Blockly data.

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
