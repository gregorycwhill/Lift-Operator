# Lift Operator Documentation Guide

**Status:** Active documentation governance reference
**Owner class:** Product and engineering
**Last reviewed:** 31 July 2026

## Purpose

This guide prevents planning drift. A document has one job, one status, and one owner class. Do not use a historical
plan as current work authority just because it contains useful detail.

## Active documents

| Question | Authoritative document | Update when |
| --- | --- | --- |
| What durable experience and rules are we building? | `Lift-Operator_GDD.md` | Product vision or cross-system rules change |
| What does each authored round teach? | `Game Play Map.md` | Round progression or learning intent changes |
| How do Credits, purchases, and progression work? | `Game Economy.md` | Economy rules change |
| How do Workshop and Automation Dock work? | `Automation_Workshop_Spec.md` | Automation authoring/deployment rules change |
| What outcome comes next and why? | `ROADMAP.md` | A product phase starts, finishes, or is reprioritized |
| What are we implementing now? | `DELIVERY_PLAN.md` | A delivery slice changes scope, risk, or acceptance criteria |
| What proves the current slice works? | `TEST_PLAN.md` | Tests, playtest protocol, or release gate changes |
| What did playtesters actually say? | `docs/archive/PLAYTEST_ARCHIVE.md` | A playtester message or its disposition is recorded |
| What shipped in completed delivery slices? | `docs/archive/RELEASE_HISTORY.md` | A release candidate or material delivery slice completes |
| What audio assets may ship and how are they credited? | `assets/audio/ATTRIBUTION.md` | An audio source, licence, or local asset changes |
| What does the code currently expose? | Code, `package.json`, generated balance data, and focused tests | Code is always primary; write a short baseline note only for material behavior |
| How do balance and quality practices work? | `BALANCE_WORKFLOW.md`, `TESTING_STRATEGY.md` | Enduring process changes |

Canonical numerical values live in `design/game-balance.v1.json`; run `npm.cmd run balance:generate` after an approved
change. Markdown describes intent and evidence, never a competing numeric source.

## Historical documents

`docs/archive/` preserves prior decisions, implementation context, and retrospective playtest evidence. Completed plans
are not active work queues. Git history is the detailed change log; do not keep completed checklists alive indefinitely.

The playtest archive is an active evidence record, not a work queue. New entries should include the transcript timestamp
when available and explicitly mark unrecoverable timestamps.

| Archived document | Retained for | Superseded by |
| --- | --- | --- |
| `CURRENT_IMPLEMENTATION.md` | 18 July technical snapshot and later appended history | Code, focused tests, `DELIVERY_PLAN.md`, `TEST_PLAN.md` |
| `E2E_BALANCE_PLAN.md` | Historic satisficing-balance rationale | `BALANCE_WORKFLOW.md`, `DELIVERY_PLAN.md`, `TEST_PLAN.md` |
| `IMPLEMENTATION_HANDOFF.md` | Historic implementation decisions and handoff record | This guide, roadmap, delivery plan, test plan |
| `IMPLEMENTATION_PLAN.md`, `REFACTOR_PLAN.md`, `STABILIZATION_PLAN.md`, `ORIENTATION_IMPLEMENTATION_PLAN.md` | Completed phase plans | Current delivery/test plans and code |
| `PLAYTEST_ARCHIVE.md` | Verbatim and retrospective playtest evidence | No replacement; append new evidence here |
| `RELEASE_HISTORY.md` | Concise completed-slice and release evidence | No replacement; append only when a slice closes |

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
7. Keep release notes/history out of `ROADMAP.md`, implementation design out of `TEST_PLAN.md`, and future product
   concepts out of `DELIVERY_PLAN.md` until they are selected for delivery.

`npm.cmd run docs:check` verifies local Markdown links, the required live-plan files, and obsolete authority claims.

## Change review checklist

- Is the work in the current delivery plan, or has the plan been updated first?
- Is there a production-path test or explicit human-playtest observation for each acceptance claim?
- Are balance values changed only in canonical JSON and regenerated artifacts?
- Did the change leave a single current source for scope, status, and tests?
