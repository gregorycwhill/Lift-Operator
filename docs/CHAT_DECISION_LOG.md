# Chat Decision Log

**Document role:** Curated durable record of material product, design, release, and documentation instructions from chat  
**Status:** Active, append-only decision record  
**Coverage:** Reconstructed from the available project chat through 1 August 2026  
**Not a substitute for:** The service-hosted chat transcript, Git history, or active delivery/test plans

## Recording rule

Record a decision here when it changes enduring product intent, a release constraint, documentation governance, or a
test/acceptance rule. Do not copy routine implementation discussion. Link the authoritative design, delivery, or test
document after the decision is applied there.

## Reconstructed decisions

| ID | Date | Decision | Durable effect / authority |
| --- | --- | --- | --- |
| DEC-001 | Date unavailable | `master` is the only working and deployment branch; GitHub Pages playtesting comes from it. The project will not use a branch/merge workflow. | Release practice; `DELIVERY_PLAN.md`. |
| DEC-002 | Date unavailable | Documentation has distinct roles: roadmap for product sequence, delivery plan for current scope, test plan for evidence, and archives for history. | `DOCUMENTATION.md`. |
| DEC-003 | Date unavailable | Playtest wording should be preserved as evidence; interpretation and implementation decisions belong in active plans. | `docs/playtest/PLAYTEST_FEEDBACK_LOG.md`, `TEST_PLAN.md`, `DELIVERY_PLAN.md`. |
| DEC-004 | Date unavailable | Credits carry forward across successful rounds. | `Game Economy.md`. |
| DEC-005 | Date unavailable | Historical rule, superseded by DEC-023: persistent named events were eligible after introduction unless explicitly excluded. Checkout remained a probabilistic traffic share, not a replacement for ordinary traffic. | Historical implementation context only. |
| DEC-006 | Date unavailable | Gym Bros board stinky lifts regardless of stink source; Gym Bros and Checkout are mutually exclusive; Room Service is never Checkout. | Guest-rule implementation and focused tests. |
| DEC-007 | Date unavailable | VIP makes three legs, pauses 10–30 seconds between legs, and has priority boarding once next in queue; an unsuitable occupied lift may be declined. | VIP lifecycle and test coverage. |
| DEC-008 | Date unavailable | Power-up durations use canonical wall-clock values; SFX are capped at five seconds unless explicitly shorter/longer; icons persist for the effect lifetime. | Canonical config and audio rules. |
| DEC-009 | Date unavailable | Automation Dock is the permanent controller: carousel selection is explicitly armed by clicking its text, armed policy applies directly to clicked lifts, Library selection arms the dock, and legacy Debug controller is removed. | `Automation_Workshop_Spec.md` and Dock implementation. |
| DEC-010 | Date unavailable | Service Zoning unlocks at R14, is implemented as Workshop automation, has scalable overlapping Low/High built-ins, and all lifts can reach G. | Automation/round design. |
| DEC-011 | Date unavailable | Counterweight puzzle sequence is R21–R23: adjacent pairs move oppositely, share no passenger load, permit normal effects unless stated, and use Open Plan as a later problem-solving tool. | Roadmap and authored rounds. |
| DEC-012 | Date unavailable | Capsule dispatch is R24–R25: narrow pneumatic-tube capsules, high speed, and demand waves. Room Service and Gym Bros are excluded; VIP remains active, and R25 adds Rooftop. Freshener, Double-Decker, and TARDIS are disabled as designed. | Game Play Map active-challenge matrix, authored rounds, canonical data. |
| DEC-013 | Date unavailable | RC1.0 defers the incomplete Achievements system and Endless mode; non-functional Debug actions are removed, while Warp/inspection remains supported. | `ROADMAP.md`, `DELIVERY_PLAN.md`. |
| DEC-014 | 1 August 2026 | The balance simulator is a negative-control tool, not a model of competent human play. All-Sweep must fail R2–R25; intended-strategy results are diagnostic. R2 is currently deferred after accessibility tuning. | `DELIVERY_PLAN.md`, `TEST_PLAN.md`, `BALANCE_WORKFLOW.md`. |
| DEC-015 | 1 August 2026 | Major RC hardening proceeds in playtest boundaries: stabilise R9, then gather feedback through R15, R20, and R25; each cycle is expected to be mostly polish. | `DELIVERY_PLAN.md` H0–H4. |
| DEC-016 | 1 August 2026 | Specific feedback must have its own source document; broader material chat instructions/decisions must be curated in a separate decision log. | This file and `docs/playtest/PLAYTEST_FEEDBACK_LOG.md`. |
| DEC-017 | 2 August 2026 | Add a Distribution and Feedback release slice: player-facing README/media, opt-in diagnostics and form launch, GitHub Issue Forms, licence audit, build identifiers, and itch.io packaging. Keep Pages canonical and defer the final project licence pending compatibility/provenance review. | `DELIVERY_PLAN.md`, `TEST_PLAN.md`, `THIRD_PARTY_NOTICES.md`. |
| DEC-018 | 2 August 2026 | RC1.0 first-party code is GPL-3.0-only. Use one configurable Google Form for player and technical feedback; feedback diagnostics remain local/copiable and the published URL must be supplied before launch. Firefox is not supported for this release. Curated supplied screenshots replace the README gallery. | `LICENSE`, `release-config.js`, `README.md`, `THIRD_PARTY_NOTICES.md`, `DELIVERY_PLAN.md`, `TEST_PLAN.md`. |
| DEC-019 | 2 August 2026 | RC1.0 includes local campaign persistence and an outer campaign shell. Resume uses a validated round-boundary checkpoint, not a live-world save. Credits & Licences will credit Gregory Hill and Marie Barnard. | `ROADMAP.md`, `DELIVERY_PLAN.md`, `TEST_PLAN.md`. |
| DEC-020 | 2 August 2026 | Give Feedback uses the production Google Form's long URL and pre-fills its diagnostic field on user action; it also copies the diagnostic and never submits a response automatically. Five-or-more-lift rounds begin in Sweep. Countdown is three seconds per lift, bounded 5–30 seconds, except for Round 2's ten-second teaching window. | `release-config.js`, `DELIVERY_PLAN.md`, `TEST_PLAN.md`. |
| DEC-021 | 2 August 2026 | RC1.0 retains only supported release, acceptance, trace, performance, media, packaging, and human-protocol tooling. Deferred runtime prototypes and retired browser/CLI harnesses are removed; superseded balance evidence is archived separately from current reports. | `package.json`, `DOCUMENTATION.md`, `docs/archive/reports/`. |
| DEC-022 | 2 August 2026 | RC1.0 implements the lightweight local campaign shell: first-visit Welcome, How to Play, Credits & Licences, verified pre-round resume, confirmed New Game, and Campaign Complete. The checkpoint is balance-version validated and excludes live-world state. | `campaign.js`, `index.html`, `DELIVERY_PLAN.md`, `TEST_PLAN.md`. |
| DEC-023 | 2 August 2026 | The Game Play Map must explicitly enumerate the active challenges for every authored round. Canonical event activation, runtime behaviour, and player briefings are derived from that schedule; challenges do not inherit automatically from their introduction. | `Game Play Map.md` is the source; implementation and acceptance work are tracked in `DELIVERY_PLAN.md` and `TEST_PLAN.md`. |
| DEC-024 | 2 August 2026 | The approved R1–R25 active-challenge matrix restores a lighter Counterweight puzzle arc (R21–R23) and retains VIP, but excludes Room Service and Gym Bros, in the capsule arc (R24–R25). | `Game Play Map.md` Active-challenge matrix. |

## Chat persistence limitation

The complete source conversation is retained by the chat service, outside this repository. This file is a curated
repository-controlled record, not a claim to reproduce every message or timestamp. Reconstructed entries explicitly
use `Date unavailable` when the original metadata is unavailable.
