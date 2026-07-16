# Refactor Plan Archive

The original structural refactor is complete enough to support stabilization, but the architecture is not yet fully modular or data-driven.

This file is retained as a historical pointer. Active architectural work is defined in `STABILIZATION_PLAN.md`.

## Achievements of the original refactor

- Separated configuration, state, engine, automation, and interface files.
- Introduced namespaced access through `window.Game`.
- Split UI responsibilities across feature-oriented files.
- Added a lift state machine.
- Added a routing bridge for player automation.
- Moved frequent visual updates toward `requestAnimationFrame`.
- Centralized storage key names.

## Remaining structural debt

- Modules still depend heavily on ambient globals and load order.
- Reset, warp, retry, and simulation do not share one state factory.
- Legacy top-level configuration competes with `GAME_DATA`.
- Simulation mutates global live state.
- Automation executes arbitrary JavaScript on the main thread.
- Production and test assets share one entry point.

These are stabilization concerns, not a reason for another broad refactor. Changes should be made only where they improve lifecycle correctness, balance configurability, testing isolation, access gating, or execution containment.
