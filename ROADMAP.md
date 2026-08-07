# Lift Operator Product Roadmap

**Document role:** Product outcomes and sequence; not an implementation checklist
**Status:** Active product roadmap
**Owner class:** Product
**Last reviewed:** 8 August 2026
**Current delivery:** Friends & Family release evidence in `DELIVERY_PLAN.md`

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
- the permanent Automation Dock, Settings, audio controls, Leaderboard, and local campaign-resume shell.

The implementation is feature-complete for this release candidate. Current work is limited to release evidence:

- verify the ordinary public URI and unsigned feedback flow;
- run the scoped internal desktop/device confirmation;
- package and open the itch.io-compatible ZIP from the release commit;
- gather structured Friends & Family evidence across the campaign arcs; and
- classify findings as release blocker, tuning candidate, or later work before deciding promotion.

Implementation scope and release gates are owned by `DELIVERY_PLAN.md` and `TEST_PLAN.md`. Mobile discovery does not
begin until the current release decision closes.

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

## Later — Teleportation topology

**Outcome:** Introduce a deliberately strange late-game routing rule: a lift leaving the top floor immediately appears at
Ground, and a lift leaving Ground immediately appears at the top floor. The building behaves as a vertical loop, in the
style of Pac-Man wraparound movement.

This is a puzzle/topology concept, not an RC1.0 change. It could become either a timed Power-up that changes one or
more lifts temporarily, or a specialised lift type/round rule. The player value is the ability to turn a long vertical
route into a cyclic route, creating new automation, zoning, and capacity trade-offs rather than simply making lifts
faster.

Decisions required before delivery planning:

- Power-up, permanent lift type, or authored round-only rule;
- targeted versus whole-fleet scope, duration, and unlock position;
- how Sweep, Voting, custom Workshop policies, and distance calculations reason about a cyclic building;
- interaction with Service Zoning, Counterweights, Capsule lifts, Rooftop, VIP journeys, boarding, and visual/audio
  communication of the instant transition;
- whether a top-to-Ground transition counts as servicing either endpoint or is travel-only.

**Gate:** A player can predict the wraparound route, automation uses it intelligibly, and it creates a meaningful
decision rather than an unqualified speed boost.

## Later — Polar lift topology

**Outcome:** Reimagine a late-game building as concentric orbital tracks rather than parallel vertical shafts. Lift
cars travel around circular paths, creating a spatial-routing puzzle in which the player manages orbital position,
direction, timing, and transfers instead of only vertical floor service.

This is a deliberately speculative topology concept, not an RC1.0 or currently planned feature. Its design must first
define how floors/stops map onto rings, whether cars can transfer between rings, what constitutes a reachable guest,
how automation primitives describe an orbital route, and how the board remains readable on desktop screens.

**Gate:** Players can predict where a car will go, understand which stops it can serve, and use the topology to make
new automation and routing decisions rather than encountering an opaque visual reskin.

The working product name for this concept is **Ferris Wheel**: concentric circular tracks using polar-coordinate or
orbital movement rather than vertical shafts.

## Later — Persistent player creations and discovery

**Outcome:** Let players retain, discover, and voluntarily share their own automations and authored rounds beyond a
single browser, without turning the first online step into a full social platform.

The existing versioned UFI Manifest/URI format remains the portable content package. A deliberately lightweight first
step is a Google Form that accepts a manifest URI and concise metadata (title, creator name or alias, content type,
and description). A reviewed public response sheet or curated catalogue can make submissions discoverable, while
recipients still inspect and explicitly accept a manifest before importing it. This is an interim publishing workflow,
not a backend for game state or automatic content execution.

Later backend persistence may add authenticated profiles, saved automations/rounds, search, tags, version history,
ratings or curation, and durable share links. It must preserve the current validation, size limits, schema versions,
and consent model rather than treating shared content as trusted code.

Decisions required before delivery planning:

- whether the Google Form catalogue is moderated before publication and who owns moderation/takedown decisions;
- what creator identity, attribution, licence, privacy, and age-appropriate contribution rules apply;
- the minimum metadata and validation preview required before a manifest URI is published;
- when a form/sheet workflow stops scaling and what backend, account, retention, and abuse-reporting model replaces it;
- whether discovery covers automations, rounds, or both, and how custom content remains separate from campaign balance.

**Gate:** A player can safely publish and discover a valid automation or round, understand that import is optional,
and recover a creation on another device without weakening content containment or privacy.

## Later — Meta-progression and achievements

**Outcome:** Add a meaningful, status-first mastery layer only after the desktop campaign, Mobile constraints, and
economy are proven in play.

Achievements are deliberately absent from the 1.0 player surface. A future design must be per-player, based on clear
player actions rather than raw implementation telemetry, and primarily communicate mastery. Any one-time Credit reward
must be small, explicitly modelled in the campaign economy, and never become a required source of purchasing power.

## Later — Lift Bouncer

**Outcome:** Add a targeted operational Power-up that lets the player control who may occupy a lift, turning one car
into a deliberately selective service rather than merely a larger or faster one.

Potential uses include clearing a cabin for a VIP, preventing a third Gym Bro from creating group Stink, and refusing
Room Service where ordinary passengers should retain the remaining capacity. The feature is intentionally a future
design item: it changes queue fairness, passenger removal, targeting, power duration, and the value of several
existing mechanics.

Decisions required before delivery planning:

- whether it expels existing passengers, only blocks future boarding, or has separate tiers for each;
- which guest categories/rules can be selected and how the player communicates the policy;
- VIP, Gym Bro/Stink, Room Service, Checkout, zoning, Counterweight, and capsule interactions;
- duration, targeting, price, and whether its advantage is bounded by any guest-protection rule.

**Gate:** The player can predict who will board, why someone was refused or expelled, and when the Power-up creates a
genuine operational choice rather than a universal answer.

## Later — Player-authored rounds

**Outcome:** Let players create, save, replay, share, and Warp to their own deterministic operations after the authored
campaign is stable.

The Round Designer would set timer, lives, floors, lift composition (regular, counterweight, capsule), hazards,
events, power-ups, title, and briefing notes. Saved rounds appear in the player's operation list and Warp menu. A
versioned, validated round package can use the existing manifest/URI mechanism for voluntary sharing.

Decisions required before delivery planning:

- which field combinations are legal and how feasibility, lift-pairing, zoning, capsule exclusions, and event conflicts
  are validated before a round can be saved or shared;
- whether custom rounds are sandbox-only or contribute to any future progression, records, or sharing catalogue;
- the schema/version/migration contract, seed handling, package size limit, and manifest consent flow;
- Round Designer UX: presets, advanced controls, briefing authoring, validation feedback, and custom-round management.

**Gate:** A player can make a valid operation without knowing the codebase; recipients can inspect and opt into a
shared package safely; invalid combinations are explained before launch.

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
- Elapsed-time movement integration. It remains a post-RC technical resilience investigation; the zoning-overlay
  performance remediation is separate and does not commit the project to replacing the current movement model.

These are directions, not commitments. A future item enters `DELIVERY_PLAN.md` only after Product chooses it as the
current delivery outcome.

## Product design references

- `Lift-Operator_GDD.md` — durable product vision and gameplay rules.
- `Game Play Map.md` — authored round progression and intended learning arc.
- `Game Economy.md` — earning, spending, retry, and progression intent.
- `Automation_Workshop_Spec.md` — Workshop and Automation Dock experience/containment contract.
- `docs/playtest/PLAYTEST_FEEDBACK_LOG.md` — active playtest feedback intake and dispositions.
- `docs/CHAT_DECISION_LOG.md` — durable material instructions and decisions from project chat.
