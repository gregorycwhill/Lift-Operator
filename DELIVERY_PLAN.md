# Major Release Candidate Delivery Plan

**Document role:** Current implementation and release scope only
**Status:** Active release-candidate hardening — not promotable until the balance gate and human-device evidence are complete
**Release target:** `1.0` (no release tag has been created)
**Owner class:** Product and engineering
**Last reviewed:** 1 August 2026
**Implementation baseline:** Active remediation working tree based on `39c07b7` on `master`

## Outcome

Prepare the complete 25-round desktop campaign for broader external feedback. The campaign, Service Zoning, permanent
Automation Dock, Settings, audio system, R21–R23 counterweight trilogy, and R24–R25 capsule-dispatch arc are implemented.
This slice is release hardening and evidence collection, not another feature expansion.

Product intent and future sequencing belong in `ROADMAP.md`. Durable mechanics belong in the design documents. Test
commands, evidence, and playtest acceptance belong in `TEST_PLAN.md`. Completed delivery history belongs in
`docs/archive/RELEASE_HISTORY.md` and Git history.

## Included product surface

- Twenty-five authored campaign rounds, including Service Zoning from R14, counterweights/Open Plan in R21–R23, and
  capsule dispatch in R24–R25.
- Permanent two-step Automation Dock with pinned carousel and built-in/custom/shared Library.
- Workshop-authored policies, including scalable Low/High and custom Service Zones.
- Persistent Credits, Supply Closet loadouts, tiered power-ups, Settings, Leaderboard, and audio controls.
- Desktop browser delivery through GitHub Pages from `master`.

## Remediation programme

The following programme is the current delivery scope. It restores the design-to-data-to-evidence chain for the full
25-round campaign; it is not a new feature expansion.

### Accepted decisions

- Unattended all-Sweep must fail every fixed gate seed in every authored round from R2 through R25. R1 remains the
  onboarding exception. The further 25% R2 spawn-rate accessibility change (43.75% total from the original values) is
  implemented but currently violates this invariant
  (5/5 R2 all-Sweep seeds survive); resolving that conflict requires an explicit product decision rather than hidden
  counter-tuning.
- R12 expresses that rule as an endurance ceiling: all-Sweep loses its twentieth life before 240 seconds, while a
  competent strategy survives for 240–480 seconds.
- Intended-strategy profiles remain diagnostic comparators. Their failures require trace review, but do not block this
  release candidate; human playtest reports determine whether a round is too easy, too hard, or appropriately tuned.
- The current canonical power-up prices remain for the 1.0 release candidate. The scarcity-price redesign is deferred;
  current inflation is documented and measured rather than silently retuned.

### Balance, simulation, and economy recovery

1. **Full-campaign balance acceptance:** versioned non-runtime acceptance data, fixed seeds, all-Sweep requirements,
   intended/feasibility profiles, and R12 timing bounds are implemented. The enforceable gate is now the source of truth;
   its current result is recorded in `reports/campaign-balance-acceptance.md`; it passes the all-Sweep negative-control
   requirement while retaining intended-strategy outcomes for diagnosis.
2. **Production-faithful simulation:** profiles now cover zoning, counterweights/Open Plan, and capsules; all-Sweep assigns
   every lift; simulated commands use production targeting; reproducibility covers representative rounds. The hash-only
   replay and placeholder robustness commands are retired from the supported npm surface pending a real action-log replay.
3. **Economy evidence:** replace the fixed 13-round payout calculator with a 25-round current-price projection using
   canonical payouts, unlocks, consumable use, retries, and challenge-appropriate loadouts. It must report
   affordability, savings, and dominant purchases without changing prices. Achievements are deferred and contribute no
   runtime or modelled Credits in 1.0.
4. **Configuration authority:** move remaining active balance parameters into canonical data, remove or repair dead
   compatibility/debug controls, and extend validation for event exclusions, counterweight geometry, capsule rules,
   unlock availability, and required mechanic support.
5. **Content parity:** completed for the current authored campaign. Canonical round data, the Gameplay Map, and player
   briefings agree on R1–R25; the R15 VIP/Rooftop omission and R20's obsolete “final authored round” claim are
   resolved. Re-audit only when a round definition or briefing changes.

### Tooling and release hygiene

6. Repair, complete, relabel, or retire the stale simulation utilities: the broken completion audit, hash-only replay,
   placeholder robustness command, and misleading batch defaults.
7. Separate correctness, balance, economy, and browser-performance gates. Add representative R24/R25 browser traces;
   the headless simulator cannot prove frame rate, layout stability, or touch/click usability.
8. Update enduring balance/testing guidance and archive superseded R2–R13-only reports as historical evidence.

### RC1.0 surface simplification

The incomplete achievement system is deferred: its Settings, Review, showcase, and Leaderboard surfaces and its Credit
rewards are absent from the production runtime, while legacy browser storage remains inert. Debug retains Warp and
supported inspection controls only; non-player-facing simulation, UNIT_01, Endless Alpha, and in-browser regression
controls are retired. Supported verification remains the documented npm/Playwright command set. Endless Operations is
a roadmap investigation, not an RC1.0 mode.

### RC hardening control plan

This is a release-assurance programme, not a general refactor. Each playtest cycle accepts four to twelve reported
items, classifies them, and releases the verified fixes to `master` before the next playtest boundary.

| Milestone | Scope | Release gate | Status |
| --- | --- | --- | --- |
| H0 — R9 stabilisation | Canonical event-to-traffic resolution; remove duplicated standard-spawn decisions; protect ordinary journeys during Checkout and Rooftop. | R7/R9 retain their authored traffic mix under both normal and fallback spawning. | Automated complete; awaiting R9 replay |
| H1 — R9 to R15 | Briefings, economy/loadout clarity, event readability, and zoning discovery. | Tester reaches R15 without a progression blocker. | Pending playtest |
| H2 — R15 to R20 | Large-fleet layout, event/briefing parity, automation interaction, reset cleanup, and credit presentation. | Tester reaches R20 without viewport or event-traffic regression. | Pending playtest |
| H3 — R20 to R25 | Counterweights, Open Plan, capsules, input routing, and target-browser performance. | Tester reaches R25; capsules remain legible and responsive. | Pending playtest |
| H4 — candidate decision | Freeze feature additions; classify the remaining issues and run the full release gate once. | No unresolved P0; release materials and human evidence complete. | Pending |

| ID | Source | Classification | Required evidence | Status |
| --- | --- | --- | --- | --- |
| RC-TRAF-01 | R7/R9 standard guests became all Checkout traffic; R9 ceased to read as a Rooftop round. | P0 correctness | Both normal and max-delay spawn paths retain ordinary journeys; Checkout and Rooftop shares are bounded. | Implemented; focused browser coverage |

Issue rule: P0 is a progression blocker, lost input/state, or broken authored rule; P1 is repeated clarity or
accessibility friction; P2 is polish or isolated balance feedback. Only P0/P1 fixes and low-risk P2 polish enter a
cycle. Larger redesigns and non-release-risk architecture debt move to `ROADMAP.md`.

## Remaining engineering work

These are genuine unresolved implementation or diagnosis items, not historical checklist residue.

1. **Balance acceptance remediation:** all-Sweep now fails all fixed seeds in R2–R25, but the positive comparator is
   not yet a credible model of intended play. Execute the following phase without weakening the gate or silently
   regenerating its seed set:
   - Define versioned, round-family intended profiles: R2–R3 hybrid rescue; R4–R6 triage/redundancy; R7–R9 event
     handling; R10–R13 advanced control; R14–R20 zoned fleet; R21–R23 counterweight/Open Plan; and R24–R25 capsule
     dispatch. Each declares automation, bounded manual intervention, permitted loadout, timing rules, and win metric.
   - Add compact failed-run traces: automation changes, accepted/rejected manual targets and reasons, boarding/refusal
     reasons, power-up lifecycle, event lifecycle, life-loss cause, and zoning/counterweight state.
   - Recover acceptance in sequence: R2 is deferred for the current phase; begin with R3–R6, then progress through each
     later family only after the preceding family reaches its threshold. Preserve before/after reports and traces for
     every canonical tuning change.
   - Treat the all-Sweep setup, fixed seeds, and R12 bounds as immutable policy. The simulator gate passes only when
     all-Sweep fails every seed. Intended profiles require trace/disposition review and browser/playtest evidence, but
     their survival rate is diagnostic rather than a release threshold.
   Current evidence: profile and trace infrastructure is implemented. After the further 25% R2 spawn-rate reduction,
   all-Sweep survives every fixed R2 seed (5/5), while the remaining rounds retain the negative-control result. The
   current report is authoritative for individual seeds. Virtual runs are now
   synchronous, realm-unique, and wall-clock pinned, with regression coverage for subset/full run-order invariance. R2 is explicitly
   deferred for this phase. R3–R6 remain the next staged recovery slice; later-family
   failures are currently classified as profile-model gaps where event-specific criteria are required before balance
   parameters are altered. The intended-strategy percentage is diagnostic only; the release gate is all-Sweep failure
   in every required round. The complete round-by-round criteria are in `TEST_PLAN.md`.
   First-pass event-aware (R10–R13), zoned (R14–R20), and pair-aware (R21–R23) controllers are implemented and their
   traces now classify guest versus VIP life loss. They have not improved late-family acceptance yet: VIP penalties and
   Rooftop release pressure remain the dominant evidence, so the next remediation is controller policy and human
   validation, not spawn-rate or capacity changes.
2. **R24/R25 performance evidence:** profile a representative R25 run. Target 60fps on the reference desktop, accept no
   sustained rate below 45fps, and investigate repeated long tasks above 50ms. Optimize only measured hotspots.
3. **Release automation duration:** the long Auto-Pilot Alpha protocol takes approximately eight minutes and can make the
   aggregate local command exceed a ten-minute wrapper. Decide whether CI should retain the long gate, split it into a
   separate job, or use a shorter release smoke while keeping the long protocol scheduled.

## Current release-candidate decision

| Gate | Current evidence | Decision |
| --- | --- | --- |
| Engineering correctness | Syntax, docs, config, balance freshness, economy, mechanics, integration, audio, and 103 lifecycle Playwright tests pass. The long Auto-Pilot E2E protocol exceeded its 10-minute command timeout without emitting a test result. | Conditional |
| Evidence provenance | The full R2–R25 / five-seed acceptance report is current and passes integrity validation. | Pass |
| Balance acceptance | All-Sweep is rejected in 23/24 required rounds; R2 survives 5/5 seeds after the requested accessibility reduction. Intended profiles are diagnostic (10/24 currently positive). | **Block — decision required** |
| Capsule device performance | Deterministic headless smoke passes; reference-device frame and long-task evidence is not captured. | **Block** |
| Broad playtest | Session protocol is ready; broader external feedback has not yet been recorded against this working tree. | **Block** |

The implementation is therefore a tested release candidate *candidate*, not a promotable 1.0 release candidate. The
balance threshold is intentionally not waived.

## Release acceptance requiring human evidence

- R9 Rooftop Party buildup/release is legible and manageable.
- R13 remains challenging but practical after its spawn-rate adjustment and available loadouts.
- R14–R20 communicate their challenge clearly and support credible zoning/loadout strategies.
- R21–R23 teach counterweights, make Open Plan useful, and remain recoverable at scale.
- R24–R25 make automation materially useful, remain readable, and perform acceptably on target hardware.
- R19–R25 fit supported desktop viewports without board jitter, clipped controls, or unusable targets.
- Audio identity, duration, continuity, and first-gesture behavior are acceptable on desktop Chromium/WebKit and at
  least one Safari/iOS device.
- The Automation Dock is understandable without instruction for both single-lift and batch assignment.

The exact playtest matrix and evidence format are in `TEST_PLAN.md`.

## Explicitly outside this release

- Mobile edition implementation.
- Endless Operations implementation or procedural round generation.
- New guest types, hazards, power-ups, themes, online services, or player-facing telemetry.
- General multi-lift journeys or transfer hubs outside the implemented timed Open Plan behavior.
- Workshop event callbacks, persistent script memory, mandatory event-root blocks, or a visual Think block.

## Release sequence

1. Resolve or explicitly defer the four engineering items above with evidence.
2. Run the automated release gate and record commit, environment, and results in `TEST_PLAN.md`.
3. Run the structured broad-feedback playtest pack across early, zoning, counterweight, and capsule arcs.
4. Triage findings into release blockers, tuning candidates, and later-roadmap ideas.
5. Update player-facing release notes and documentation status.
6. Create the `1.0` release tag only after the release owner confirms the acceptance evidence.

## Exit criteria

- No open reproducible correctness defect can corrupt progression, routing, inventory, or saved automation.
- Remaining balance or usability concerns are documented with a seed, round, loadout, device, and disposition.
- Required automated gates pass, or any environmental limitation is isolated and recorded without being described as a
  product pass.
- `README.md`, `ROADMAP.md`, `DELIVERY_PLAN.md`, `TEST_PLAN.md`, and the design documents agree that R1–R25 are
  implemented and that Mobile/Endless remain future work.
- Broader feedback can be gathered without requiring testers to understand repository branches, debug variants, or
  obsolete interfaces.
