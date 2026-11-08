# Lift Operator Roadmap

**Status:** Marie's Birthday Edition delivery roadmap  
**Priority rule:** A playable, tested birthday build outranks unused future-state architecture.

## Now — birthday release

The current delivery plan is `DELIVERY_PLAN.md`; acceptance authority is `TEST_PLAN.md`.

1. Default every eligible R2+ lift to Sweep and keep manual override simple.
2. Remove dedicated Rooftop music while retaining the event.
3. Remove the retired paired-lift mechanic and its transfer power-up from runtime, data, shop, saves, media, tests, and
   current documentation. Narrowly refund old saved purchases.
4. Make zoning independent of automation and introduce it in R10.
5. Replace repetitive Checkout traffic with strong waves in R7, R10, R18, and R20.
6. Ship functional pets from R5 onward: filters, conflict warning, Pet Snacks, five-pet Stink, immunity, clear visuals,
   telemetry, and focused rounds R5 **Pet-Friendly Hotel** and R22 **Best in Show**.
7. Ship deterministic direct-or-one-transfer journeys for conventional zoned fleets in R21–R23.
8. Preserve R24–R25 capsule play and all established retry, Credits, Endurance, performance, and containment behavior.
9. Complete automated gates, supported-browser playtest, package smoke, provenance update, commit, and deployment.

### Release blockers

- Any crash, save loss, route loop, passenger disappearance, more-than-one transfer, or pet-owner separation.
- Rooftop music or a retired mechanic appearing in the production package.
- R2+ beginning in Manual, or zoning/filter controls changing automation unexpectedly.
- Failed syntax, config parity, UTF-8, deterministic replay, integration, lifecycle, audio, or packaging gates.
- An authored round that cannot initialise or a campaign checkpoint that cannot recover safely.

## Next — post-gift hardening

Only begin after the birthday build is delivered and Marie has played it.

- Tune R5, R10, and R21–R23 from human observations and fixed-seed aggregates.
- Improve pet/filter and transfer legibility where playtest evidence shows confusion.
- Review pet frequency by band without making pets vanish outside their focus rounds.
- Improve the intended-strategy simulator so it understands pet filters, transfer coverage, and temporary Checkout waves.
- Add compact anomaly sampling for stuck transfers, repeated conflict ejections, and uncovered routes.
- Refresh release screenshots, store copy, and Friends & Family playtest pack.

## Later — design after evidence

These are deliberately non-blocking ideas, not latent requirements for the birthday build.

- More pet personalities, species, owner behaviors, or pet-related achievements.
- Workshop pet sensors/blocks or advanced automation access to design-only pressure metrics after Round 20.
- Shareable custom automations and improved Workshop teaching.
- A general round designer or event scheduler.
- More than one transfer, express/interchange signage, or general passenger groups.
- Additional campaigns, endless modes, or online/community features.

Any later feature must first state the player problem it solves, its teaching round, its effect on Sweep/manual play, and
the deterministic test/simulation evidence required. New infrastructure is not valuable merely because it anticipates a
hypothetical extension.

## Explicitly retired

The former paired-car experiment and its lateral-transfer power-up are not backlog items. They were removed because
they were unreliable, visually expensive, and poorly aligned with Marie's preferred Sweep-plus-intervention play. A
future coupled-lift concept would require a new design proposal and must not silently revive legacy code or terminology.
