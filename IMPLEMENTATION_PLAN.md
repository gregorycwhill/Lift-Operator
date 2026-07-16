# Implementation Plan Archive

This file previously contained a phase plan that mixed completed work, proposed work, and optimistic status claims.

It is retained at this path to avoid breaking links, but it is no longer the active implementation plan.

Use:

- `STABILIZATION_PLAN.md` for prioritized engineering work.
- `ROADMAP.md` for product stages.
- `CURRENT_IMPLEMENTATION.md` for implemented reality.
- `BALANCE_WORKFLOW.md` for the docs-to-config iteration model.
- `TESTING_STRATEGY.md` for evidence requirements.

## Historical work completed in substance

The earlier plan drove useful architectural changes:

- Split the original monolithic interface into engine and UI files.
- Introduced the `window.Game` namespace.
- Added seeded traffic.
- Added a lift state machine.
- Added the Automation Workshop and bridge concept.
- Added power-ups, hazards, achievements, and a browser simulator.
- Added a developer regression scorecard.

These outcomes remain valuable, but “implemented” does not necessarily mean balanced, resilient to accidental lockups, isolated, or independently verified.

## Superseding delivery principle

The current priority is not feature expansion.

```text
Lifecycle correctness
→ one round factory
→ one balance schema
→ trustworthy testing
→ automation containment
→ campaign balance
→ experience polish
```

See `STABILIZATION_PLAN.md` for detailed gates and definitions of done.
