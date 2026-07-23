# Lift Operator Product Roadmap

**Purpose:** Product outcomes and sequence. This is not an implementation checklist.
**Current delivery:** `DELIVERY_PLAN.md` — proposed `0.3.0-network-campaign-preview`

## Product north star

Lift Operator begins as a fast arcade lift game and develops into an operational strategy puzzle. Each important round
creates a diagnosable bottleneck: players learn why a familiar tactic failed, adapt lift roles/automation/loadout, and
master the same seeded traffic through understanding rather than grinding.

## Now — Prove the network campaign

**Outcome:** The existing R14–R20 Service Zoning foundation becomes understandable and reliable enough for human
playtesting.

- Direct single-lift service bands are consistent across play, simulation, and automation.
- Players can see coverage, understand refusals, and recover from a bad zoning decision.
- Large fleets and tall buildings remain usable.
- Telemetry and replay reports identify the real failure mode before traffic tuning begins.
- R9 rooftop and R13 affordability evidence closes the known late-campaign playtest questions.

**Gate:** A player can explain a zoning failure, reproduce it with a seed/configuration, and choose a credible next
strategy. See `DELIVERY_PLAN.md` and `TEST_PLAN.md`.

## Next — Tune the extended campaign

**Outcome:** R14–R20 form a coherent second arc about fleet architecture, resilience, and Workshop advantage.

- Tune traffic only after direct-service correctness, responsive UI, and telemetry gates pass.
- Validate viable manual/hybrid, built-in-plus-loadout, and custom Workshop solution classes where practical.
- Use the intended progression: local zones, VIP/Rooftop coverage, recovery redundancy, Checkout concentration,
multi-exception fleets, then 30-floor network mastery.

**Gate:** Human failure diagnoses match round intent, and balance changes are reproducible through canonical data,
fixed seeds, compact reports, and recorded playtests.

## Later — Campaign polish and accessibility

**Outcome:** The complete campaign is clear, satisfying, and robust across supported devices.

- Improve briefing, Review, automation visualization, and accessibility from observed playtest failures.
- Complete mobile/Safari audio acceptance and responsive layout polish.
- Resolve remaining campaign balance questions, including Round 2 leverage, late-round strategy separation, and economy
  inflation, using evidence rather than broad retuning.

## Later — Endless operations

**Outcome:** Players who complete or outgrow the authored campaign can continue into fresh, fair operational challenges
without losing the game’s diagnosable-problem design.

Two approaches remain open:

1. **Curated expansion:** ship a large catalogue of pre-checked rounds and seeds. This gives the strongest authored
   pacing and simplest balance evidence, but finite variety.
2. **Procedural operations:** generate round layouts, traffic, events, and constraints in-game from a seed. This offers
   greater replayability, but requires much stronger feasibility, fairness, and reproducibility controls.

The preferred investigation path is a hybrid: deterministic generation from constrained templates, followed by offline
simulation and acceptance checks before a generated operation is offered to a player. Each operation must expose its
seed, balance version, objective, and difficulty envelope; it must be replayable, diagnosable, and reject invalid or
unwinnable configurations. Runtime generation must not bypass canonical balance validation or introduce opaque random
difficulty spikes.

**Gate:** A generated or catalogue operation has a recorded intent, reproducible seed/configuration, supported strategy
profile, unattended baseline, and clear player-facing objective before it is promoted into endless play.

## Deferred

- Guest transfers, multi-lift journeys, and G-hub routing.
- New mechanics, power-ups, hazards, guest types, themes, online services, and player-facing telemetry.
- Round 20+ advanced sensors or player-constructed survival forecasting.
- Endless operations implementation until the network campaign and its balance evidence are stable.

These are not commitments. Reconsider them only after the network campaign is validated and balanced.

## Product design references

- `Lift-Operator_GDD.md` — product vision and rules.
- `Game Play Map.md` — round learning arc and intended structural problems.
- `Game Economy.md` — earning, spending, retry, and progression intent.
- `Automation_Workshop_Spec.md` — Workshop player experience and containment boundary.
