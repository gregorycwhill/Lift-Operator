# Lift Operator

Lift Operator is a browser-based elevator management and automation game. It begins as a fast arcade game about routing lifts under time pressure, then develops into a strategy puzzle about traffic analysis, scarce power-ups, automation selection, and custom routing logic.

Live build: https://gregorycwhill.github.io/Lift-Operator/

## Design north star

Each major round presents a diagnosable operational problem:

1. The player encounters a new bottleneck.
2. Familiar tactics become insufficient.
3. Failure reveals the nature of the bottleneck.
4. The player changes lift roles, automation, purchases, or power-up timing.
5. The player retries the same seeded traffic pattern.
6. The round is overcome through understanding and execution.

Automation is a force multiplier, never autoplay. From Round 2 onward, unattended all-Sweep play must fail; progression comes from supervision, timely intervention, specialized policies, power-up timing, and later custom logic.

The game should be frenetic and novel early, tactical in the middle, and increasingly strategic and puzzle-like late. It does not need more mechanics. It needs the existing mechanics to create clear problems, multiple viable solutions, meaningful scarcity, and satisfying mastery.

## Documentation map

The documents have distinct responsibilities:

| Document | Purpose | Authority |
| --- | --- | --- |
| [Lift-Operator_GDD.md](Lift-Operator_GDD.md) | Product vision, player experience, rules, and design principles | Design intent |
| [CURRENT_IMPLEMENTATION.md](CURRENT_IMPLEMENTATION.md) | What the current code actually does, including known inconsistencies | Implemented baseline |
| [Game Play Map.md](Game%20Play%20Map.md) | Target round sequence, learning arc, problems, solution spaces, and tuning parameters | Target progression |
| [Game Economy.md](Game%20Economy.md) | Target earning, spending, affordability, retry, and progression model | Target economy |
| [BALANCE_WORKFLOW.md](BALANCE_WORKFLOW.md) | Docs-to-config-to-playtest iteration and telemetry | Balance process |
| [Automation_Workshop_Spec.md](Automation_Workshop_Spec.md) | Current and target automation experience and execution-containment model | Automation specification |
| [STABILIZATION_PLAN.md](STABILIZATION_PLAN.md) | Prioritized work needed before systematic balance iteration | Delivery plan |
| [TESTING_STRATEGY.md](TESTING_STRATEGY.md) | Required evidence and testing layers | Quality strategy |
| [ROADMAP.md](ROADMAP.md) | High-level product stages and gates | Product sequencing |

`IMPLEMENTATION_PLAN.md`, `REFACTOR_PLAN.md`, and `TEST_PLAN.md` are retained as historical records. Where they conflict with the documents above, the documents above take precedence.

## Status vocabulary

All specifications use the following terms:

- **Implemented:** present and reachable in the current build.
- **Partial:** present, but incomplete, inconsistent, or not sufficiently verified.
- **Disabled:** implemented but not exposed in normal play.
- **Target:** approved design direction that is not yet guaranteed by the engine.
- **Planned:** a possible future addition that is not part of the current stabilization scope.
- **Retired:** retained only for historical context.

## Current project phase

The game is an entirely playable advanced prototype completing stabilization infrastructure and entering data-driven balance work.

The immediate priorities are:

1. Complete golden-seed and campaign-economy baselines.
2. Expand canonical data to unlock and payout rules.
3. Tune Rounds 1–3 around problem, solution, and mastery.
4. Record human playtest evidence against deterministic seeds.
5. Continue balance tuning act by act.

New power-ups, hazards, themes, profiles, and online services are outside the current focus.

## Local development and tests

Requirements:

- Node.js 24 or a current supported LTS release.
- npm.
- Playwright Chromium, installed once with `npx.cmd playwright install chromium`.

From PowerShell:

```powershell
npm.cmd install
npm.cmd run serve
```

Open `http://127.0.0.1:5500/` for local play.

Run the manifest-gated Monkey lifecycle suite with:

```powershell
npm.cmd run test:e2e
```

Run the complete validation command with:

```powershell
npm.cmd test
```

This performs JavaScript syntax checking, canonical balance/config validation, generated-artifact verification, and the Playwright suites. The same command runs in GitHub Actions.

It also runs deterministic struggling, typical, and expert economy scenarios. These enforce transaction and affordability invariants while reporting bank accumulation as balance evidence.

After changing `design/game-balance.v1.json`, regenerate the browser artifact:

```powershell
npm.cmd run balance:generate
```

The suite verifies the complete accelerated 13-round campaign, the human-intervention kill switch, ordinary-death rollback, single-commit checkout/evaluation, pause clock preservation, and spawn-to-delivery timing. Its first complete local campaign run passed in approximately 6.6 minutes.

## Project security philosophy

Lift Operator is a hobby project for children learning to move from Scratch into purposeful programming. Its source is intentionally inspectable.

The project protects the experience from accidents, not the source from curious players:

- XOR manifests hide developer controls from accidental discovery.
- Debug and Monkey capabilities should require a visible opt-in.
- Malformed payloads and broken scripts should fail gracefully.
- Infinite loops should not freeze the whole game.
- Reverse-engineering the manifest, finding the XOR secret, or constructing a debug link is considered a successful learning outcome.

The obfuscation is therefore fit for the project’s purpose. Strong authentication, anti-cheat, and adversarial security are not goals.
