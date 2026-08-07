# Major Release Candidate Delivery Plan

**Document role:** Current implementation and release scope only
**Status:** Active Friends & Family readiness — automated release evidence complete; human/device evidence remains
**Release target:** `1.0` (no release tag has been created)
**Owner class:** Product and engineering
**Last reviewed:** 7 August 2026
**Implementation baseline:** Active Friends & Family working tree on `master`

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

- All-Sweep remains an internal negative-control diagnostic for RC1.0, not a Friends & Family distribution blocker.
  R1 remains the onboarding exception. A later balance release may reinstate a strict fixed-seed gate only with an
  explicitly approved threshold; do not silently counter-tune to its results.
- R12 expresses that rule as an endurance ceiling: all-Sweep loses its twentieth life before 240 seconds, while a
  competent strategy survives for 240–480 seconds.
- Intended-strategy profiles remain diagnostic comparators. Their failures require trace review, but do not block this
  release candidate; human playtest reports determine whether a round is too easy, too hard, or appropriately tuned.
- The current canonical power-up prices remain for the 1.0 release candidate. The scarcity-price redesign is deferred;
  current inflation is documented and measured rather than silently retuned.

### Balance, simulation, and economy recovery

1. **Full-campaign balance diagnostics:** versioned non-runtime acceptance data, fixed seeds, all-Sweep results,
   intended/feasibility profiles, and R12 timing bounds are implemented. The current result is recorded in
   `reports/campaign-balance-acceptance.md`; strict all-Sweep enforcement remains an explicit later-balance command,
   while intended-strategy outcomes remain diagnostic.
2. **Production-faithful simulation:** profiles now cover zoning, counterweights/Open Plan, and capsules; all-Sweep assigns
   every lift; simulated commands use production targeting; reproducibility covers representative rounds. The hash-only
   replay and placeholder robustness commands are retired from the supported npm surface pending a real action-log replay.
3. **Economy evidence:** replace the fixed 13-round payout calculator with a 25-round current-price projection using
   canonical payouts, unlocks, consumable use, retries, and challenge-appropriate loadouts. It must report
   affordability, savings, and dominant purchases without changing prices. Achievements are deferred and contribute no
   runtime or modelled Credits in 1.0.
4. **Configuration authority:** move remaining active balance parameters into canonical data, remove or repair dead
   compatibility/debug controls, and extend validation for explicit challenge matrices, counterweight geometry, capsule rules,
   unlock availability, and required mechanic support.
5. **Explicit event schedule and content parity:** the Game Play Map's explicit R1–R25 active-challenge matrix and
   canonical per-round briefing records drive runtime activation and briefing content; Checkout and Rooftop cannot be
   co-active. The renderer has no independent round-title/body switch, and the 25-round browser parity test guards the
   authored records.

6. **Round-based campaign presentation:** all 25 canonical briefing records carry the approved rank, title, narrative,
   learning focus, optional first-use rule card, and promotion boundary. The runtime renders those records directly;
   rank is based on round rather than lift count. Promotion acknowledgement is persisted at normal campaign boundaries,
   while restored and direct Debug entry go straight to the briefing. The wider briefing preserves a three-column Supply
   Closet grid.
7. **Current R11 playtest re-engagement:** R2's countdown instruction now names the basement Automation Dock and
   glowing controllers; R11's spawn curve is reduced by 25% and its Rooftop schedule reserves a 45-second evacuation
   window. Standard buildings use the accepted short/tall travel bands; counterweight and capsule movement remain
   unchanged. Infinite Capacity has an explicit compatible-guest boarding regression.
8. **Briefing and Supply Closet presentation:** the redundant Objective/loadout copy is removed; Endurance's operating
   rule carries its distinct objective. Campaign-introduction terms receive one bold/icon treatment only on their first
   authored introduction, active-challenge chips include icons, and Supply Closet uses a permanent right-hand cart rail
   beside a three-column left shop with one shared scroll region.
9. **Final briefing layout polish:** narrow the briefing modal to 594px, shorten the Supply Closet, hide modal-level
   overflow, anchor the primary start/purchase action in the footer, let three shop cards consume the fluid left pane,
   and align briefing icons with runtime power-up/effect symbols. Capsule uses the new elevator symbol; Rooftop uses
   the cocktail glass.
10. **R11/Rooftop clarity:** the first Gym Bros rule card now explains the three-Gym-Bro stink threshold
    alongside immunity, and publish one â€œLast drinks!â€ toast exactly five seconds before Rooftop release. Neither
    change alters event duration or boarding rules; the owner-tested 0.96→1.15 R11 curve is now canonical.

### Next playtest remediation slice — implemented; awaiting replay

1. **Low-cost zoning display:** replace green gradients and inset shadows with flat darker-grey no-service shaft cells;
   served cells retain the current light grey and floor striping remains visible. This addresses the confirmed Chromebook
   slowdown in R20/R23. Do not include elapsed-time movement in RC1.0; it is a post-RC1.0 engine backlog item.
2. **R2 instruction and notice placement:** provide a reserved non-board message rail. The R2 Automation tip persists
   for the ten-second teaching countdown and closes when that countdown is skipped or starts; ordinary notices retain
   their short-lived behaviour.
3. **Gym Bros clarity and alerting:** make the canonical R11 briefing source expose the full Gym Bro rule through the
   shared round-definition path. Issue one fart alert when a lift first reaches the three-Gym-Bro stink threshold; do
   not repeat it until the threshold condition clears.
4. **R12 Endurance baseline:** remove VIP and Rooftop from R12. Retain ordinary traffic, Room Service, Gym Bros, Jams,
   Stink, and the Endurance objective; revise authored content, canonical data, parity coverage, and acceptance criteria
   together.
5. **Briefing capacity:** retain the compact 594px desktop briefing geometry and its three-column shop. Keep the
   supply/cart areas internally scrollable and the primary action visible without an outer modal scrollbar.
6. **R25 zoning parity:** add the missing active zoning configuration so its actual mechanics and visual state match its
   challenge list and briefing; perform the Chromebook performance replay only after item 1.
7. **README release presentation:** apply the approved player-facing tagline, replace the current Supply Closet screenshot
   with the uploaded asset, and retain the approved elevator/elevator-management discovery wording without changing the
   game name or construction focus.
8. **Boarding-refusal audio:** keep the existing no-sound direction-refusal mapping without restoring elevator-door or distressed-
   guest sounds; retain only intentional event and power-up feedback.

### PTF-030 implementation status

The current remediation slice is implemented: R2's teaching rail stacks below the countdown; the briefing returns to
594px; four-lift fleets begin in Sweep; R13 uses the 0.15 round credit multiplier to target roughly 22–30 Credits into
R14; Sweep and boarding share effective direction, zoning, stink, VIP, capacity, and party-state eligibility; Rooftop
guests already at the roof are sent to Ground after the party; VIP arrival remains visible but never auto-dispatches a
lift; and counterweight policy commands remain pair-synchronised. Remaining evidence is human replay, especially R9/R11
rooftop evacuation and R21 Sweep under real browser timing.

### Routing, R13 balance, and seed remediation — implemented; awaiting replay

This is a correctness-and-tuning slice, not new RC1.0 product scope.

1. **Sweep reversal pickup:** when a built-in Sweep-family policy reverses at a stopped floor, re-evaluate the current
   floor before selecting a new remote target. If a waiting guest has become compatible under the new direction, reopen
   the doors and board normally. Preserve all existing capacity, stink, VIP, Room Service, party-state, zoning, and
   passenger-drop-off rules; do not create a repeated open/close loop when nobody is compatible.
2. **Counterweight pair-aware routing:** replace competing per-car built-in Sweep decisions with one combined decision
   for each physical pair. Score a proposed car target and its forced mirrored partner target using both cars' pending
   drop-offs and compatible pickups, then issue one paired command. A player click remains an immediate, symmetric
   manual override and is never replaced by the policy. Custom Workshop automations retain individual/advanced
   behaviour.
3. **R13 pressure candidate:** the canonical candidate is now `1.08 → 1.26`, a 20% increase from `0.90 → 1.05`.
   Derived balance artifacts and acceptance evidence are regenerated; human replay decides whether the candidate becomes
   final balance.
4. **Seed variation with reproducibility:** normal New Game creates and persists a random campaign seed; authored
   round seeds remain deterministically derived from it. Add a Debug seed control with numeric entry, Randomise, Copy,
   and Apply & Restart Round. A Debug seed is a transient override for the active replay: it must not overwrite the
   persisted campaign seed. Diagnostics expose both the campaign seed and any active override.

**Resolved routing rule:** when paired cars have different automations, the pair coordinator uses this deterministic
precedence: `custom` > `priority voting` > `priority sweep` > `zoned` > `voting` > `sweep`. The selected policy plans
for both cars as a coupled pair; manual player commands still override it immediately.

### Friends & Family readiness slice — implemented

This final internal slice removes distribution and playtest friction without changing campaign mechanics.

1. **RC1 balance-gate scope:** relaxed the all-Sweep requirement for RC1.0. The current acceptance report remains
   internal diagnostic evidence, but do not treat its unmet round results as a Friends & Family distribution blocker.
   A later balance release may reinstate a stricter all-Sweep gate with an explicitly approved threshold.
2. **Bundled-audio hygiene:** removed the unused, unprovenanced bundled files `gameplay-chiploop.mp3`,
   `gameplay-pressure-chip-bit-danger.mp3`, `powerup-special.wav`, and `powerup-turbo.wav` from the distributable
   tree; refresh the audio manifest, attribution, audit, and audio checks together.
3. **Vendored-library notices:** identified the exact Blockly and LZ-String sources/versions and added their required
   Apache-2.0 and MIT licence notices, and close the corresponding `THIRD_PARTY_NOTICES.md` audit gaps.
4. **Debug simplification:** removed Debug sliders that do not produce a documented active-round overlay. Retained only
   working Warp, seed replay, and inspection controls for reproducible support.
5. **Refusal-audio closure:** confirmed the direction-incompatible boarding refusal is silent in production and closed
   PTF-015 unless a new reproducible report contradicts that result.
6. **Normal-player onboarding:** removed the Round 1 `Game ID` field from the briefing; added a concise Welcome
   expectation that RC1.0 is best played in desktop Chrome or Edge; explain that campaign progress saves between
   rounds and a restarted shift begins from its round boundary; and expand How to Play with the minimum guest-status,
   Ground, and patience vocabulary needed by a first-time player.
7. **Safe navigation language:** renamed the destructive sidebar action from `Restart Game` to `New Campaign…` while
   retaining its confirmation. Keep Workshop visible before its Round 10 unlock, but provide an explicit unlock
   tooltip. Reduce developer-facing normal-play clutter, including the seed display, without reducing diagnostic
   capture.
8. **Staged tester access:** Friends & Family initially receive the ordinary public URI and normal campaign flow.
   After initial feedback, selected testers receive the existing UFI Manifest-backed Debug URI so they can access
   higher rounds. This remains Debug access rather than a new shared-operation pathway. The manifest consent screen is
   welcoming and explicit that Playtest Access unlocks round selection and seed replay for testing;
   normal campaign progress remains separate.

### Tooling and release hygiene

6. **Completed cleanup:** retire the broken completion audit, hash-only replay, placeholder robustness command, legacy
   browser test harnesses, and superseded balance-search commands. Preserve only the current acceptance, trace,
   performance, packaging, and documented test commands; historical reports live under `docs/archive/reports/`.
7. Separate correctness, balance, economy, and browser-performance gates. Add representative R24/R25 browser traces;
   the headless simulator cannot prove frame rate, layout stability, or touch/click usability.
8. Update enduring balance/testing guidance and archive superseded R2–R13-only reports as historical evidence.

### RC1.0 surface simplification

The incomplete achievement system is deferred: its Settings, Review, showcase, and Leaderboard surfaces and its Credit
rewards are absent from the production runtime, while legacy browser storage remains inert. Debug retains Warp and
supported inspection controls only; non-player-facing simulation, UNIT_01, Endless Alpha, and in-browser regression
controls are retired. Supported verification remains the documented npm/Playwright command set. Endless Operations is
a roadmap investigation, not an RC1.0 mode.

### Campaign shell and persistence

**Status: implemented; browser and human acceptance remains.**

RC1.0 includes a lightweight outer shell that makes the existing campaign approachable without interrupting round-to-
round flow. It adds a first-visit Welcome view, How to Play, Credits & Licences, a campaign-completion view, and
locally persisted campaign progress. The credit line is **Created by Gregory Hill** and **Lead playtester: Marie
Barnard**, followed by **Made with ♥ in Melbourne, Australia**.

Campaign persistence is a versioned, validated local checkpoint rather than a live-world save. It records only stable
campaign-boundary state: player name, campaign seed, current/resumable round, highest unlocked round, lives, Credits,
and owned inventory. It deliberately excludes guest/lift positions, event and power-up timers, pending shop-cart UI,
modal state, Debug state, automation-controller transient selection, and live audio state. Reloading therefore resumes
at the saved round's briefing with deterministic round setup, not halfway through a live shift.

- Welcome: first visit shows Play; a valid saved campaign shows Continue and New Game. Play uses the current Round 1
  player-name flow; Continue restores the checkpoint; New Game requires confirmation and clears only campaign progress.
- Checkpoints: write after a campaign is safely initialised for a round and after successful progression; retain the
  pre-round checkpoint through failures so retry/reload cannot serialize a damaged live world.
- Credits & Licences: reusable from Welcome, Settings, and campaign completion; present the attribution, build and
  balance identifiers, repository link, GPL-3.0-only summary, and links to `LICENSE`, `THIRD_PARTY_NOTICES.md`, and
  `assets/audio/ATTRIBUTION.md` without duplicating long legal text.
- Feedback: retain Settings access; Round Review becomes contextual and includes outcome/failure reason in its copied
  diagnostic. The published Google Form receives that diagnostic as a user-initiated pre-filled URL value, but no form
  response is submitted automatically. Campaign completion presents feedback prominently.
- Scope guard: milestone feedback prompts and animated shell backgrounds are P1 polish, not prerequisites for RC1.0.

### Distribution and feedback release slice

This slice makes the existing GitHub Pages build understandable and actionable for broader testers without changing
gameplay rules or transmitting player data automatically.

- Player-facing README: one-line hook, Play Now link, desktop status, six curated campaign captures, feature
  summary, feedback links, and concise contributor/documentation guidance.
- Live build metadata: Open Graph/Twitter fields and a 1200×630 first-party social-preview image.
- Opt-in feedback: Settings and Round Review open the published Google Form URL in `release-config.js` with a compact
  diagnostic pre-filled, then also copy it locally. The diagnostic travels only when the player activates Give
  Feedback; no response is submitted automatically.
- Intake: Google Forms collect player, technical, balance, and accessibility reports; the repository feedback log
  remains the authoritative internal record.
- Distribution: `package:itch` produces an HTML5 ZIP from the current commit, while GitHub Pages remains canonical.
- Licensing: first-party project code is GPL-3.0-only. `THIRD_PARTY_NOTICES.md` audits bundled material and retains
  the separate third-party provenance/attribution gaps.

Release acceptance for this slice: all feedback actions are opt-in, diagnostic contents are visible/copiable locally,
media paths resolve from the Pages build, an itch ZIP opens `index.html`, and the licence audit has no undisclosed
bundled-material gap.

### Fleet baseline and countdown correction

Every authored round with five or more lifts begins with each lift on Sweep, so large-fleet rounds start in a usable
operational state while remaining fully editable during the countdown. The countdown is canonical balance data: three
seconds per lift, bounded to five through thirty seconds, with the agreed ten-second Round 2 automation-teaching
override. Automation controller status text, tooltip, and accessible name must always describe the same current policy.

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
| RC-VIS-02 | Native blue Checkout suitcase is illegible on a Happy guest's green background. | P1 visual accessibility | Replace the Checkout guest marker with text-presented `💼︎` (`U+1F4BC U+FE0E`) and apply black text on supported Chrome/Edge desktop; retain status backgrounds and ordinary `G` markers. | Implemented; awaiting visual replay |
| RC-CONFIG-03 | Canonical `vipHeadstartSec` was unused after the VIP timing decision changed. | P1 configuration integrity | Remove the dead parameter; VIP starts Happy on each leg and uses the normal patience thresholds plus the approved 10-life penalty and 10–30 second inter-leg pause. | Implemented; focused lifecycle/audio coverage |
| RC-CONTENT-04 | Event inheritance makes a round's real challenge set indirect and can drift from its briefing. | P0 authored-content correctness | The approved Game Play Map R1–R25 active-challenge matrix defines activation; derive canonical runtime and briefings from it, and reject Checkout/Rooftop co-activation. | Implemented; focused config/lifecycle coverage |

Issue rule: P0 is a progression blocker, lost input/state, or broken authored rule; P1 is repeated clarity or
accessibility friction; P2 is polish or isolated balance feedback. Only P0/P1 fixes and low-risk P2 polish enter a
cycle. Larger redesigns and non-release-risk architecture debt move to `ROADMAP.md`.

## Remaining engineering work

These are genuine unresolved implementation or diagnosis items, not historical checklist residue.

1. **Post-RC balance investigation:** the all-Sweep report and intended comparator are valuable diagnostics, but not
   Friends & Family release gates. Any later balancing phase must preserve the fixed seeds and retain before/after
   evidence rather than silently regenerating a passing result:
   - Define versioned, round-family intended profiles: R2–R3 hybrid rescue; R4–R6 triage/redundancy; R7–R9 event
     handling; R10–R13 advanced control; R14–R20 zoned fleet; R21–R23 counterweight/Open Plan; and R24–R25 capsule
     dispatch. Each declares automation, bounded manual intervention, permitted loadout, timing rules, and win metric.
   - Add compact failed-run traces: automation changes, accepted/rejected manual targets and reasons, boarding/refusal
     reasons, power-up lifecycle, event lifecycle, life-loss cause, and zoning/counterweight state.
   - Recover acceptance in sequence: R2 is deferred for the current phase; begin with R3–R6, then progress through each
     later family only after the preceding family reaches its threshold. Preserve before/after reports and traces for
     every canonical tuning change.
   - Treat the all-Sweep setup, fixed seeds, and R12 bounds as immutable diagnostic policy. A later strict command may
     require all-Sweep failure every seed, but intended profiles still require trace/disposition review and browser or
     playtest evidence.
   Current evidence: profile and trace infrastructure is implemented. After the further 25% R2 spawn-rate reduction,
   all-Sweep survives every fixed R2 seed (5/5), while the remaining rounds retain the negative-control result. The
   current report is authoritative for individual seeds. Virtual runs are now
   synchronous, realm-unique, and wall-clock pinned, with regression coverage for subset/full run-order invariance. R2 is explicitly
   deferred for this phase. R3–R6 remain the next staged recovery slice; later-family
   failures are currently classified as profile-model gaps where event-specific criteria are required before balance
   parameters are altered. The intended-strategy percentage and all-Sweep result are both diagnostic for RC1.0. The
   complete round-by-round criteria are in `TEST_PLAN.md`.
   First-pass event-aware (R10–R13), zoned (R14–R20), and pair-aware (R21–R23) controllers are implemented and their
   traces now classify guest versus VIP life loss. They have not improved late-family acceptance yet: VIP penalties and
   Rooftop release pressure remain the dominant evidence, so the next remediation is controller policy and human
   validation, not spawn-rate or capacity changes.
2. **R24/R25 performance evidence:** profile a representative R25 run. Target 60fps on the reference desktop, accept no
   sustained rate below 45fps, and investigate repeated long tasks above 50ms. Optimize only measured hotspots.
3. **Release automation:** the UNIT_01 Auto-Pilot suite was not a valid release gate: it depended on retired Debug
   behavior and stalled without a bounded result. It and its dedicated commands are retired. `test:smoke` is now the
   fast supported gate and `test:full` the supported comprehensive gate; any future browser E2E journey must be
   designed against a supported player workflow.

## Current release-candidate decision

| Gate | Current evidence | Decision |
| --- | --- | --- |
| Engineering correctness | `npm.cmd run test:release` passed on 7 August 2026: syntax, docs, config, balance freshness/integrity, economy, UTF-8, unit, mechanics (24/24), integration (3/3), audio (25/25), and Playwright (157/157). | Pass |
| Evidence provenance | The full R2–R25 / five-seed acceptance report is current and passes integrity validation. | Pass |
| Balance diagnostics | All-Sweep currently produces a loss in 15/24 authored rounds; intended profiles are diagnostic (10/24 currently positive). The strict command preserves the historical threshold for later balancing. | Pass for Friends & Family; diagnostic follow-up |
| Capsule device performance | Deterministic headless smoke passes; reference-device frame and long-task evidence is not captured. | Human evidence required |
| Broad playtest | Session protocol is ready; broader external feedback has not yet been recorded against this working tree. | Human evidence required |

The implementation is a tested Friends & Family release candidate. Promotion to public 1.0 remains subject to the
human/device evidence below and the release-owner decision.

## Release acceptance requiring human evidence

- R9 Rooftop Party buildup/release is legible and manageable.
- R13 remains challenging but practical after its spawn-rate adjustment and available loadouts.
- R14–R20 communicate their challenge clearly and support credible zoning/loadout strategies.
- R21–R23 teach counterweights, make Open Plan useful, and remain recoverable at scale.
- R24–R25 make automation materially useful, remain readable, and perform acceptably on target hardware.
- R19–R25 fit supported desktop viewports without board jitter, clipped controls, or unusable targets.
- Audio identity, duration, continuity, and first-gesture behavior are acceptable on supported desktop Chrome/Edge.
- The Automation Dock is understandable without instruction for both single-lift and batch assignment.

The exact playtest matrix and evidence format are in `TEST_PLAN.md`.

## Explicitly outside this release

- Mobile edition implementation.
- Endless Operations implementation or procedural round generation.
- New guest types, hazards, power-ups, themes, online services, or player-facing telemetry.
- General multi-lift journeys or transfer hubs outside the implemented timed Open Plan behavior.
- Workshop event callbacks, persistent script memory, mandatory event-root blocks, or a visual Think block.

## Release sequence

1. Confirm the human/device evidence below and record any material playtest finding.
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
