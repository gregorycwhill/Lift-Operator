# Lift Operator Product Roadmap

**Document role:** Product outcomes and sequence; not an implementation checklist
**Status:** Active product roadmap
**Owner class:** Product
**Last reviewed:** 31 July 2026
**Current delivery:** Major release-candidate hardening in `DELIVERY_PLAN.md`

## Product north star

Lift Operator begins as a fast arcade lift game and develops into an operational strategy puzzle. Each important round
creates a diagnosable bottleneck: players learn why a familiar tactic failed, adapt lift roles, automation, loadout, or
timing, and master the same seeded traffic through understanding rather than grinding.

## Now — Promote the 25-round desktop campaign

**Outcome:** Package the implemented desktop campaign for broader feedback and decide whether it is ready for a major
public release.

The campaign currently includes:

- R1–R13 core operation, events, economy, power-ups, and Workshop progression;
- R14–R20 Service Zoning and increasingly large fleet-architecture challenges;
- R21–R23 counterweight/Open Plan puzzle rounds;
- R24–R25 fast single-passenger capsule dispatch;
- the permanent Automation Dock, Settings, audio controls, and Leaderboard.

The current product work is validation and tuning: resolve reproducible correctness gaps, confirm the legacy event
matrix, profile the capsule fleet, and gather structured human evidence across all five campaign arcs. Implementation
scope and release gates are owned by `DELIVERY_PLAN.md` and `TEST_PLAN.md`.

**Gate:** Broad feedback shows that players can understand the campaign's progression, diagnose failures, operate the
Automation Dock, and complete representative zoning, counterweight, and capsule rounds on supported desktop hardware.

## Next — Mobile edition

**Outcome:** Create a distinct phone-first edition that preserves the core routing game without desktop-only complexity.

Accepted constraints:

- no Workshop or player-authored automation;
- no presentation requiring four or more lifts across the screen;
- no buildings taller than 15 stories;
- touch targets, floor/lift layout, briefings, loadouts, and guest rules fit a modern phone viewport.

Decisions required before delivery planning:

- adapt the full campaign or author a curated mobile campaign;
- share progression/saves with desktop or keep a separate profile;
- choose the minimum supported viewport/device and browser set;
- identify which desktop rounds depend on removed systems and need replacement.

**Gate:** Representative phone testers can understand and complete the selected campaign without horizontal fleet
management, Workshop dependence, or buildings above 15 stories.

## Later — Endless Operations

**Outcome:** Let players continue into fresh, fair operational challenges after the authored campaign.

Two product approaches remain open:

1. **Curated expansion:** a large catalogue of pre-checked rounds and seeds.
2. **Procedural operations:** deterministic generation from constrained templates, with feasibility checks before play.

The preferred investigation is hybrid: generate deterministic candidates offline, simulate and reject invalid or
unwinnable operations, then publish only accepted seeds/templates. Every operation must retain its seed, balance
version, objective, intended bottleneck, difficulty envelope, and supported strategy profile.

Endless Operations remains after Mobile so it builds on a stable campaign and settled presentation constraints.

## Later — Meta-progression and achievements

**Outcome:** Add a meaningful, status-first mastery layer only after the desktop campaign, Mobile constraints, and
economy are proven in play.

Achievements are deliberately absent from the 1.0 player surface. A future design must be per-player, based on clear
player actions rather than raw implementation telemetry, and primarily communicate mastery. Any one-time Credit reward
must be small, explicitly modelled in the campaign economy, and never become a required source of purchasing power.

## Cross-cutting product work

- Improve briefing, Review, automation visualization, accessibility, and audio from observed playtest failures.
- Tune campaign balance from fixed-seed and human evidence; avoid broad retuning from isolated anecdotes.
- Keep canonical numbers in `design/game-balance.v1.json` and regenerate derived artifacts after approved changes.
- Preserve the educational arc from built-in automation to Workshop-authored policies.

## Deferred

- General guest transfers, multi-lift journeys, and permanent G-hub routing beyond timed Open Plan.
- New power-up families, hazards, guest types, themes, online services, or player-facing telemetry.
- Workshop callbacks, persistent script memory, mandatory event-root blocks, and a visual Think block.
- Runtime procedural generation before the authored campaign and Mobile edition are stable.
- Player-facing achievements before their status, reward, persistence, and economy model are designed and validated.

These are directions, not commitments. A future item enters `DELIVERY_PLAN.md` only after Product chooses it as the
current delivery outcome.

## Product design references

- `Lift-Operator_GDD.md` — durable product vision and gameplay rules.
- `Game Play Map.md` — authored round progression and intended learning arc.
- `Game Economy.md` — earning, spending, retry, and progression intent.
- `Automation_Workshop_Spec.md` — Workshop and Automation Dock experience/containment contract.
- `docs/playtest/PLAYTEST_FEEDBACK_LOG.md` — active playtest feedback intake and dispositions.
- `docs/CHAT_DECISION_LOG.md` — durable material instructions and decisions from project chat.
