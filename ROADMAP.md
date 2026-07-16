# Lift Operator Product Roadmap

The roadmap is organized by gates, not by feature quantity. The game already has sufficient mechanics for a complete campaign.

## Stage 1 — Documentation true-up

**Status:** Completed initial rewrite

- Separate implemented baseline from target design.
- Establish one 13-round campaign scope.
- Define arcade-to-strategy progression.
- Define problem–solution–mastery round design.
- Define target economy and retry principles.
- Document lightweight obfuscation and execution-containment intent honestly.

**Gate:** Every major document has one responsibility and uses shared status language.

## Stage 2 — Stabilization

**Status:** Substantially complete

- Fix review, shop, pause, resume, retry, and reset defects.
- Correct average-wait and payout accounting.
- Introduce explicit lifecycle states.
- Create one round-state factory.
- Make rounds 1–13 initialize consistently.

**Gate:** Critical campaign flow completes deterministically without duplicate state transitions or currency mutations.

The critical gate is passing. Remaining work is secondary overlay hardening and an explicit lifecycle-state model.

## Stage 3 — Data-driven balance foundation

**Status:** In progress

- Create versioned machine-readable design data.
- Validate and generate executable configuration.
- Remove legacy duplicate parameters.
- Add balance version to telemetry.
- Isolate simulator state and random streams.

**Gate:** Round and economy tuning requires data changes only, not engine edits.

Canonical JSON, validation, generation, runtime loading, payout/unlock data, and stale-artifact CI checks are implemented. Remaining compatibility consumers can be removed incrementally without competing numerical sources.

## Stage 4 — Testing, access gating, and containment

**Status:** In progress

- Replace self-confirming regression checks.
- Add reproducible unit, state-machine, simulation, economy, and E2E suites.
- Move custom automation off the main thread or into a constrained interpreter.
- Version and validate blueprint imports.
- Separate production and development entry points.

**Gate:** Tests provide independent evidence; malformed inputs and accidental automation errors cannot freeze or corrupt the game; curious source inspection remains possible.

Production behaviour, deterministic simulation, lifecycle, Monkey, manifest validation, pure mechanic rules, an onboarding golden comparison, and campaign economy scenarios are covered. Worker isolation, broader golden strategy comparisons, and richer economy telemetry remain open.

## Stage 5 — Campaign balance

Tune by act:

1. Rounds 1–3: arcade pace and first tactical wall.
2. Rounds 4–6: automation roles and jam recovery.
3. Rounds 7–9: traffic topology and timed combinations.
4. Rounds 10–11: customization and mixed-weight mastery.
5. Rounds 12–13: resource and optimization capstones.

Each act is frozen before tuning the next.

**Gate:** Human failure diagnosis matches round intent and economy targets remain viable across player profiles.

Every accepted campaign balance must also preserve the engagement floor: unattended all-Sweep fails from Round 2 onward, while the intended active strategy materially improves survival and pressure metrics.

## Stage 6 — Experience polish

Only after balance:

- Improve briefing and review diagnostics.
- Improve automation visualization.
- Refine audio and visual feedback.
- Accessibility and responsive layout.
- Tutorial clarity.

**Gate:** Players can understand the operational state and explain their failures without developer telemetry.

## Deferred opportunities

These are not commitments:

- Open Plan as post-campaign experimental content.
- Additional buildings or rounds.
- Profiles and themes.
- Online leaderboards.
- Modding/plugin systems.
- New power-ups, hazards, or guest types.
- Round 20+ advanced automation sensors and player-constructed survival forecasting.

They should be reconsidered only after the 13-round campaign is stable and balanced.
