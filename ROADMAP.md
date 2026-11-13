# Lift Operator Roadmap

**Status:** Marie's Birthday Edition live playtest roadmap
**Last reviewed:** 13 November 2026
**Priority rule:** Improve the shipped campaign from player evidence before expanding its mechanics.

## Now — live validation and post-gift hardening

The current release is `v0.3.2-maries-birthday`; implementation scope is recorded in `DELIVERY_PLAN.md` and acceptance
authority in `TEST_PLAN.md`.

1. Gather novice and target-player evidence for the gentler R1 curve, concise R2 guidance, and optional R3 Priority
   Sweep discovery.
2. Tune R5, R10, and the R15–R23 transfer arc from human observations and fixed-seed aggregates.
3. Improve pet/filter and transfer legibility where playtest evidence shows confusion.
4. Review pet frequency by campaign band without making pets disappear outside their focus rounds.
5. Improve the intended-strategy simulator's pet filters, transfer coverage, and temporary Checkout-wave behaviour.
6. Add compact anomaly sampling for stuck transfers, repeated conflict ejections, and uncovered routes.
7. Refresh release screenshots, store copy, and the Friends & Family playtest pack when the current visuals stabilise.

### Current release blockers

- Any crash, save loss, route loop, passenger disappearance, second transfer, or pet-owner separation.
- Rooftop music or a suspended mechanic appearing in the production campaign.
- R2+ beginning in Manual, or zoning/filter controls changing automation unexpectedly.
- Failed syntax, configuration parity, UTF-8, deterministic replay, integration, lifecycle, audio, or packaging gates.
- An authored round that cannot initialise or a campaign checkpoint that cannot recover safely.

## Temporarily suspended mechanics

Counterweight Lifts and the Open Plan power-up are unavailable in Marie's Birthday Edition. Their legacy runtime,
campaign, shop, media, and test implementation was removed because it was unreliable and difficult to understand, but
the product concepts are **suspended, not retired**.

No return is scheduled. Reintroduction requires a fresh design proposal rather than restoration of legacy code. That
proposal must define the player problem, paired movement and manual-override rules, Sweep behaviour, visual explanation,
Open Plan's role, save compatibility, deterministic simulation coverage, performance limits, and novice playtest gates.

## Later — design after evidence

These are non-blocking ideas, not commitments for the current release:

- Reconsider redesigned Counterweight Lifts and Open Plan under the suspended-mechanic gate above.
- More pet personalities, species, owner behaviours, or pet-related achievements.
- Workshop pet sensors/blocks or advanced Round-20+ access to design-only pressure metrics.
- Shareable custom automations and improved Workshop teaching.
- A general round designer or event scheduler.
- More than one transfer, express/interchange signage, or general passenger groups.
- Additional campaigns, endless modes, or online/community features.

Any later feature must state the player problem it solves, its teaching round, its effect on Sweep/manual play, and the
deterministic test/simulation evidence required. New infrastructure is not valuable merely because it anticipates a
hypothetical extension.
