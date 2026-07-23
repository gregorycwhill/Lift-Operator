# Lift Operator Documentation Guide

## Purpose

This guide prevents planning drift. A document has one job, one status, and one owner class. Do not use a historical
plan as current work authority just because it contains useful detail.

## Active documents

| Question | Authoritative document | Update when |
| --- | --- | --- |
| What experience are we building? | `Lift-Operator_GDD.md`, `Game Play Map.md`, `Game Economy.md`, `Automation_Workshop_Spec.md` | Product intent or rules change |
| What outcome comes next and why? | `ROADMAP.md` | A product phase starts, finishes, or is reprioritized |
| What are we implementing now? | `DELIVERY_PLAN.md` | A delivery slice changes scope, risk, or acceptance criteria |
| What proves the current slice works? | `TEST_PLAN.md` | Tests, playtest protocol, or release gate changes |
| What does the code currently expose? | Code, `package.json`, generated balance data, and focused tests | Code is always primary; write a short baseline note only for material behavior |
| How do balance and quality practices work? | `BALANCE_WORKFLOW.md`, `TESTING_STRATEGY.md` | Enduring process changes |

Canonical numerical values live in `design/game-balance.v1.json`; run `npm.cmd run balance:generate` after an approved
change. Markdown describes intent and evidence, never a competing numeric source.

## Historical documents

`IMPLEMENTATION_HANDOFF.md`, `CURRENT_IMPLEMENTATION.md`, `STABILIZATION_PLAN.md`,
`IMPLEMENTATION_PLAN.md`, `REFACTOR_PLAN.md`, and `ORIENTATION_IMPLEMENTATION_PLAN.md` preserve prior decisions and
implementation context. They are not active work queues. Git history is the detailed change log; do not keep completed
checklists alive indefinitely.

## Status vocabulary

- **Now:** committed delivery scope.
- **Next:** approved after the current delivery gate.
- **Later:** product direction without implementation commitment.
- **Deferred:** intentionally outside current scope.
- **Historical:** retained for context only.

Avoid ambiguous labels such as “partially implemented” without naming the missing behavior or evidence.

## Maintenance rules

1. Start a material feature by updating `DELIVERY_PLAN.md` and its matching section in `TEST_PLAN.md`.
2. Keep product intent in design documents; do not add implementation checklists there.
3. Remove completed items from the active delivery/test plans at the end of a slice. Record the outcome, commit, and
   remaining follow-up in a short completion note instead of retaining stale checkboxes.
4. Update `ROADMAP.md` only when the product sequencing or outcome changes.
5. Update links and document status in the same change as any authority change.
6. Before release, run the documented gate and ensure no historical document is described as the current authority.

`npm.cmd run docs:check` verifies local Markdown links, the required live-plan files, and obsolete authority claims.

## Change review checklist

- Is the work in the current delivery plan, or has the plan been updated first?
- Is there a production-path test or explicit human-playtest observation for each acceptance claim?
- Are balance values changed only in canonical JSON and regenerated artifacts?
- Did the change leave a single current source for scope, status, and tests?
