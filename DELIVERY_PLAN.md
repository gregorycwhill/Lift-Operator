# Marie's Birthday Edition Delivery Plan

**Document role:** Current implementation scope and release decision  
**Status:** Automated implementation complete; focused human acceptance pending  
**Release target:** Marie's Birthday Edition  
**Owner class:** Product and engineering  
**Last reviewed:** 8 November 2026  
**Implementation baseline:** `master` at `2e082dd`

## Outcome

Deliver a playable birthday release on time. Routine service begins in Sweep, while the player's interesting decisions
come from manual intervention, lift zones, pet admission, power-ups, and one-transfer passenger networks. Remove the
unreliable Counterweight/Open Plan experiment rather than repairing it again.

Delivery takes precedence over future extensibility. Do not build general party, topology, event-authoring, Lift
Bouncer, or migration frameworks for this release.

## Locked product decisions

1. Every eligible lift begins in Sweep from Round 2, including Round 2 itself.
2. Alternative automation and the Workshop remain available but optional; no campaign round requires their use.
3. Service Zone is independent of routing automation. Each lift may remain in Sweep while using All, Low, High, or
   Custom service coverage. Zoning is introduced in Round 10.
4. Rooftop music is disabled. Rooftop notices, visuals, and ordinary effects remain.
5. Counterweights and Open Plan are removed completely from campaign, runtime, shop, tests, simulations, and current
   documentation.
6. Checkout occurs in fewer, stronger authored waves: introductory R7, recombination R10, and late network pressure in
   R18 and R20. It is not a permanent every-second-round traffic mix.
7. Zoned guests may complete a deterministic direct journey or one automatic transfer. Direct service is preferred;
   original patience continues through the entire journey with no transfer allowance.
8. Pets begin in R5 **Pet-Friendly Hotel**, recur from R5 onward, and receive a second focus in R22 **Best in Show**.
9. Cats and dogs accompany otherwise ordinary guests. The owner consumes normal capacity; the pet consumes no extra
   space or weight. Pet owners are never VIP, Checkout, Room Service, or Gym Bro guests in this release.
10. Every lift has a compact pet-admission setting: All, Cats, Dogs, or No Pets.
11. A cat and dog sharing a lift starts a five-second conflict warning. Pet Snacks may resolve or prevent it. If it is
    unresolved, the lift clears at its next stop and both pet owners become Critical; original patience is retained.
12. Five or more pets create threshold-based Stink. Pet owners are Stink-immune. Air Freshener suppresses Stink but not
    conflict; Pet Snacks suppresses conflict but not Stink.
13. R21-R23 use conventional independent lifts: transfer introduction, Best in Show, and advanced interchange mastery.

## Delivery slices

### A. Remove obsolete mechanics and friction

- Default R2+ fleets to Sweep and replace the deployment tutorial with concise manual-override guidance.
- Disable Rooftop music and remove it from the production audio manifest/package.
- Remove Counterweight state, routing, presentation, authored data, screenshots, tests, and simulation profiles.
- Remove Open Plan timers, transfers, shop entries, inventory, briefing terms, and tests.
- Safely refund saved Open Plan inventory and restart incompatible in-progress late rounds at a round boundary.

### B. Independent zoning and Checkout waves

- Add per-lift All/Low/High/Custom zone state independent of automation selection.
- Preserve manual out-of-zone overrides; Sweep resumes inside the configured zone afterwards.
- Unlock and teach zoning in R10; retain visual coverage feedback without adding a permanent panel.
- Replace whole-round Checkout probability with configured wave windows in R7, R10, R18, and R20.

### C. Functional pets

- Spawn deterministic cat/dog owners from R5 onward using per-round pet rates.
- Render legible pet identity in queues and cars.
- Add compact per-lift pet filter controls and boarding enforcement.
- Add conflict warning, Pet Snacks, next-stop clearing, Critical consequence, and conflict-safe expiry behavior.
- Reuse established threshold-Stink behavior for five-pet congregation and pet-owner immunity.

### D. One-transfer journeys

- Prefer direct service; otherwise select a deterministic interchange covered by both legs.
- Track final destination, current leg destination, transfer floor/count, and original spawn time on the same guest.
- Requeue at the interchange without resetting patience and prohibit more than one transfer or any loop.
- Recalculate a waiting connection when zones or pet filters change; visibly report uncovered traffic without silently
  teleporting or deleting a guest.

### E. Campaign, balance, and release

- R5 becomes Pet-Friendly Hotel. Voting remains optional.
- R10 introduces basic zoning; Workshop remains optional.
- R14-R20 deepen zoning, pets, failures, and the reduced Checkout cadence.
- R21 introduces transfers, R22 is Best in Show, and R23 is advanced interchange mastery.
- R24-R25 retain light pet-owner presence; single-passenger capsules naturally prevent cabin conflict/congregation.
- Update deterministic simulations, economy, briefings, media references, and balance reports.
- Run the test gate, focused human protocol, and package smoke before release.

## Explicit non-goals

- General passenger-party or family-group architecture.
- General Lift Bouncer or passenger expulsion controls.
- More than one transfer.
- Workshop pet blocks/sensors or mandatory custom automation.
- Generic event scheduler or topology engine.
- Endless Operations, Mobile, evacuation, achievements, or player-authored-round support.
- Optimising every round before the birthday deadline.

## Checkpoints

1. **Plan lock:** active docs contain the decisions above and no current gate requires Counterweights/Open Plan.
2. **Removal/defaults:** R2+ starts in Sweep; Rooftop track never starts; no production Counterweight/Open Plan surface.
3. **Zoning/Checkout:** zones can change without changing Sweep; authored Checkout waves start and stop deterministically.
4. **Pets:** filters, conflicts, Pet Snacks, congregation Stink, immunity, and rendering pass focused tests.
5. **Transfers:** direct/one-transfer routing, patience, filter compatibility, and loop prevention pass focused tests.
6. **Campaign:** canonical/generated data, briefings, economy, simulations, and Debug Warp match the new 25-round arc.
7. **Release:** `npm.cmd run test:release` passes; supported-browser manual checks and package smoke pass.

## Current delivery status — 8 November 2026

- Checkpoints 1–6 are complete in the working tree.
- The automated portion of checkpoint 7 passes: `npm.cmd run test:release` completed with 183/183 browser tests,
  27/27 focused mechanics tests, and 3/3 containment integration tests.
- The deterministic balance run and integrity check pass as evidence-generation commands. R2 is an explicit accessible
  onboarding exception where unattended Sweep may succeed. The new R21–R23 arc retains its birthday-release threshold:
  all-Sweep fails on 5/5 seeds and intended play succeeds on at least 4/5.
- The wider campaign report remains deliberately diagnostic: 18/24 rounds meet the all-Sweep negative control and
  13/24 meet the current intended-profile threshold. These pre-existing gaps are recorded for a later balance release,
  not hidden or expanded into this time-bound delivery.
- The itch candidate package builds successfully. Final release identity, supported-browser package smoke, and the
  focused human checks in `TEST_PLAN.md` remain before publication.

## Completion criteria

- No Counterweight/Open Plan code path or player-facing reference remains in active production.
- All P0 behavior in `TEST_PLAN.md` is automated where deterministic and explicitly assigned to human playtest where
  visual/experiential.
- A clean campaign can reach and play every authored round; an older campaign cannot resume incompatible live state.
- No pet owner separates from its pet, loses original patience, exceeds one transfer, or enters a route loop.
- R2 may complete unattended as a Sweep orientation round. From R3 onward all-Sweep remains a workload baseline rather
  than guaranteed unattended completion.
- Release build, balance version, docs, ZIP, and feedback diagnostics identify the same commit.

