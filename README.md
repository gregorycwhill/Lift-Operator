# Lift Operator

**Document role:** Project entry point
**Status:** Active
**Owner class:** Product and engineering
**Last reviewed:** 31 July 2026

Lift Operator is a browser-based elevator-management and automation game. It begins as a fast arcade game about routing
lifts under pressure, then develops into a strategy puzzle about traffic analysis, scarce power-ups, automation
selection, Service Zoning, custom policies, counterweights, and capsule dispatch.

Live build: https://gregorycwhill.github.io/Lift-Operator/

## Current project phase

The game is a playable 25-round desktop campaign entering major release-candidate hardening and broad playtesting.
Rounds 14–20 develop Service Zoning and fleet architecture, R21–R23 form the counterweight/Open Plan puzzle trilogy,
and R24–R25 introduce fast single-passenger capsule dispatch.

The current work is correctness, performance, balance, usability, and device acceptance—not another feature expansion.
See `DELIVERY_PLAN.md` for current release scope and `TEST_PLAN.md` for evidence and the broad-feedback protocol.

## Documentation

Start with [DOCUMENTATION.md](DOCUMENTATION.md). It defines document roles and prevents active plans from being mixed
with historical implementation material.

| Need | Document |
| --- | --- |
| Product direction and sequence | [ROADMAP.md](ROADMAP.md) |
| Current implementation/release scope | [DELIVERY_PLAN.md](DELIVERY_PLAN.md) |
| Current evidence and release gates | [TEST_PLAN.md](TEST_PLAN.md) |
| Durable product rules | [GDD](Lift-Operator_GDD.md), [Game Play Map](Game%20Play%20Map.md), [Game Economy](Game%20Economy.md) |
| Workshop and Automation Dock contract | [Automation Workshop specification](Automation_Workshop_Spec.md) |
| Enduring quality/balance practices | [TESTING_STRATEGY.md](TESTING_STRATEGY.md), [BALANCE_WORKFLOW.md](BALANCE_WORKFLOW.md) |
| Current playtest intake and reporting | [RC1 Playtest Pack](docs/playtest/RC1_PLAYTEST_PACK.md), [feedback log](docs/playtest/PLAYTEST_FEEDBACK_LOG.md) |
| Material chat decisions | [Chat decision log](docs/CHAT_DECISION_LOG.md) |
| Historical playtester verbatims | [Playtest archive](docs/archive/PLAYTEST_ARCHIVE.md) |
| Completed release slices | [Release history](docs/archive/RELEASE_HISTORY.md) |

Historical handoffs and completed plans remain under `docs/archive/` and in Git history. They are not current delivery
authority.

## Design north star

Each major round presents a diagnosable operational problem. The player encounters a bottleneck, understands why a
familiar tactic failed, changes lift roles, automation, purchases, or timing, and masters the same seeded traffic
through understanding rather than grinding.

Built-in automation is a force multiplier, not autoplay. Player-authored automation is the advanced expression of
operational insight.

## Local development

Requirements:

- Node.js 24 or a current supported LTS release;
- npm;
- Playwright Chromium, installed once with `npx.cmd playwright install chromium`.

From PowerShell:

```powershell
npm.cmd install
npm.cmd run serve
```

Open `http://127.0.0.1:5500/` for local play.

Run the complete validation command with:

```powershell
npm.cmd test
```

The retired UNIT_01 Auto-Pilot protocol is not a supported release check. Use the maintained smoke suite for a fast
local gate; the full suite contains only supported verification:

```powershell
npm.cmd run test:smoke
npm.cmd run test:full
```

After changing `design/game-balance.v1.json`, regenerate and validate the browser artifact:

```powershell
npm.cmd run balance:generate
npm.cmd run balance:check
```

## Project security philosophy

Lift Operator is a hobby project for children learning to move from Scratch into purposeful programming. Its source is
intentionally inspectable. The project protects the experience from accidents, not the source from curious players:

- Debug and Monkey capabilities require visible opt-in.
- Malformed payloads and broken scripts fail safely.
- Custom scripts run through bounded containment so they cannot freeze ordinary play.
- Reverse-engineering the manifest or constructing a debug link is a successful learning outcome.

Strong authentication, anti-cheat, and adversarial source protection are not product goals.
