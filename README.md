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

Built-in automation is a force multiplier, never autoplay. From Round 2 onward, unattended all-Sweep play must fail; progression comes from supervision, timely intervention, specialized policies, power-up timing, and later custom logic. Player-authored custom automation is the advanced exception and can earn Hands-Free mastery.

The game should be frenetic and novel early, tactical in the middle, and increasingly strategic and puzzle-like late. It does not need more mechanics. It needs the existing mechanics to create clear problems, multiple viable solutions, meaningful scarcity, and satisfying mastery.

## Documentation

Start with [DOCUMENTATION.md](DOCUMENTATION.md). It defines document ownership, status vocabulary, and the update
rules that keep current plans separate from history.

| Need | Document |
| --- | --- |
| Product direction and sequencing | [ROADMAP.md](ROADMAP.md) |
| Current implementation scope | [DELIVERY_PLAN.md](DELIVERY_PLAN.md) |
| Current evidence and release gates | [TEST_PLAN.md](TEST_PLAN.md) |
| Product rules and round/economy intent | [GDD](Lift-Operator_GDD.md), [Game Play Map](Game%20Play%20Map.md), [Game Economy](Game%20Economy.md) |
| Long-lived engineering practices | [TESTING_STRATEGY.md](TESTING_STRATEGY.md), [BALANCE_WORKFLOW.md](BALANCE_WORKFLOW.md) |

Historical handoffs and completed plans remain in the repository for context, but are not current work authority.

## Current project phase

The game is a playable 20-round build with the first 13 rounds covered by the accelerated playtest campaign, canonical balance data, compact simulation reports, and a stabilized core loop.

The historical stabilization/balance programme remains in `IMPLEMENTATION_HANDOFF.md` for context. It is not the
current delivery plan.

The current delivery is Service Zoning playtest readiness: validate direct-service behavior, Workshop comprehension,
large-fleet layouts, reproducible diagnostics, and the first R14-R20 tuning evidence. Audio is cleared for desktop
Chromium/WebKit playtesting; real-device/mobile audio checks are follow-up acceptance work. See `DELIVERY_PLAN.md`.

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

Run the unattended all-Sweep balance matrix and regenerate its reports with:

```powershell
npm.cmd run balance:matrix
```

Balance violations are reported as tuning evidence; `npm.cmd test` verifies report integrity without pretending that currently unmet balance goals are correctness failures.

The suite verifies that the accelerated campaign reaches the Round 13 playtest boundary, the human-intervention kill switch, ordinary-death rollback, single-commit checkout/evaluation, pause clock preservation, and spawn-to-delivery timing. The current complete local gate passes 91/91 tests in approximately 9.6 minutes, including the 8.3-minute campaign test.

## Project security philosophy

Lift Operator is a hobby project for children learning to move from Scratch into purposeful programming. Its source is intentionally inspectable.

The project protects the experience from accidents, not the source from curious players:

- XOR manifests hide developer controls from accidental discovery.
- Debug and Monkey capabilities should require a visible opt-in.
- Malformed payloads and broken scripts should fail gracefully.
- Infinite loops should not freeze the whole game.
- Reverse-engineering the manifest, finding the XOR secret, or constructing a debug link is considered a successful learning outcome.

The obfuscation is therefore fit for the project’s purpose. Strong authentication, anti-cheat, and adversarial security are not goals.
# Stabilization status

The current implementation passes the full automated gate, including the Round 13 Monkey playtest-boundary campaign. Developer
simulation and balance tooling is available through `npm.cmd run sim:matrix`, `sim:repro`, `balance:search`,
`balance:search:late`, `economy:search`, and `audit:completion`.

Canonical balance promotion is not automatic. The current pointer in `reports/latest-balance.json` records the
exploratory baseline and the remaining blockers: Round 2 solution leverage and human playtest evidence.
