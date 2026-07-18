# Round Orientation and Interface Clarity Plan

**Status:** Implemented at baseline commit `f10f135`; retained as an observable-behavior contract. Remaining work is governed by `IMPLEMENTATION_HANDOFF.md`.

## Objective

Give novice players the information needed to begin and review a round without turning the live playfield into an operational dashboard.

## Experience contract

1. Closing the briefing starts a visible five-second countdown.
2. The round clock and guest spawning remain frozen during the countdown.
3. Automation selectors remain usable so lifts can be assigned roles.
4. Capacity appears temporarily above each lift during orientation.
5. New automation capabilities receive a friendly first-use pulse on their existing controls.
6. Capacity reappears temporarily when a modifier activates or expires.
7. Player-facing economy language uses Credits.
8. Average wait measures the complete spawn-to-destination journey.

## Implementation slices

### A — Timing correctness

- Use epoch time in live animation telemetry and virtual epoch time in simulation.
- Keep countdown state separate from pause state.
- Spawn the first guest and start the timer only when the countdown completes.
- Cancel stale countdown timers during round initialization, retry, or reset.

### B — Transient orientation UI

- Render a compact non-blocking countdown above the playfield.
- Reuse floating lift effects for capacity rather than adding permanent labels.
- Keep selectors interactive during countdown and prevent other gameplay actions through inactive engine state.

### C — Extensible teaching cues

- Attach cues to the existing automation selector.
- Support distinct acknowledgement keys for built-in, custom, and shared automation.
- Preserve the option groups: Built-in, My Automations, and Shared with Me.

### D — Review and economy language

- Label review columns Credits Earned and Total Credits.
- Use Credits in the Supply Closet, achievement rewards, and retry messages.
- Display `No deliveries` instead of a numeric zero average when appropriate.

## Acceptance gates

- Countdown lasts five seconds in production and does not consume round time or spawn guests.
- Automation can be changed during countdown.
- Capacity effects disappear and do not become permanent HUD elements.
- Capacity activation and expiry are both announced.
- Live wait telemetry records a non-zero journey for a guest delivered after a known delay.
- Custom and shared automation use the same cue architecture.
- Full Monkey campaign and lifecycle suite pass.
