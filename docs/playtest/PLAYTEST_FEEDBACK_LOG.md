# Playtest Feedback Log

**Document role:** Authoritative intake and disposition record for playtest feedback  
**Status:** Active, append-only source record  
**Coverage:** Reconstructed from the available project chat through 1 August 2026  
**Companion records:** `../CHAT_DECISION_LOG.md`, `../../DELIVERY_PLAN.md`, `../../TEST_PLAN.md`

## How to use this log

Append each new player observation before it is interpreted or implemented. Preserve the wording when available; mark
reconstructed summaries clearly when it is not. Record the affected round, environment, source, severity, disposition,
and the delivery/test reference once known. This is the feedback source, not the current implementation work queue.

The older `../archive/PLAYTEST_ARCHIVE.md` preserves imported verbatim excerpts. It is historical evidence; new
feedback belongs here.

## Intake fields

| Field | Meaning |
| --- | --- |
| ID | Stable identifier, never reused. |
| Source/date | Playtester and timestamp when supplied; otherwise `chat reconstruction — date unavailable`. |
| Observation | Verbatim wording or clearly labelled reconstruction. |
| Scope | Round, feature, device/browser, and reproduction details. |
| Disposition | Open, planned, implemented—awaiting replay, accepted, deferred, or closed. |

## Reconstructed feedback register

| ID | Source/date | Observation | Scope | Disposition |
| --- | --- | --- | --- | --- |
| PTF-001 | Marie, 4:18–4:40 PM; date unavailable | Rockets appeared to last three or four seconds rather than ten; Rooftop ended too quickly; R13 credit/loadout pressure was infeasible. | R7, Rooftop, R13 | Historical; durations, Rooftop pressure, and R13 tuning were subsequently redesigned. Recheck only if replay reports regression. |
| PTF-002 | chat reconstruction — date unavailable | Warp stopped at 13; ground-floor checkout guests needed suitcase icons; Room Service icons were too wide. | Debug, Checkout Challenge, Room Service | Implemented historically. |
| PTF-003 | chat reconstruction — date unavailable | Menu/background music, SFX mapping and durations, modal music, missing served/defenestration/shop/boarding sounds, and unwanted door/distress sounds required correction. | Audio | Implemented historically; targeted audio tests remain the regression evidence. |
| PTF-004 | chat reconstruction — date unavailable | Rooftop, Gravity, and R13/R14 economy/spawn pressure were impractical; stink was an intentional evacuation tactic. | R13–R14 and event rounds | Implemented/tuned historically; later human difficulty reports remain the authority. |
| PTF-005 | chat reconstruction — date unavailable | Automation menus/modals required predictable toggling; the original dock was clumsy, fluid, and visually weak. | Automation Dock, Library, modals | Implemented historically; current Dock is the permanent two-step design. |
| PTF-006 | chat reconstruction — date unavailable | Power-ups could be applied twice; rocket roof icons could obstruct top-floor alignment; jam/capacity states needed clearer visuals. | Power-ups, lift geometry | Implemented historically; icon geometry remains a regression-sensitive area. |
| PTF-007 | chat reconstruction — date unavailable | Briefings needed to describe Room Service, named challenges, zoning, credits, countdown skipping, and campaign-end wording accurately. | Briefings, Supply Closet | Implemented in stages; validate during H1 replay. |
| PTF-008 | chat reconstruction — date unavailable | VIP needed a three-leg visit, timed pauses, realistic/refined queue treatment, and then priority boarding so ordinary guests cannot pre-empt her. | VIP rounds | Implemented historically; retain as a targeted behaviour check. |
| PTF-009 | chat reconstruction — date unavailable | Rooftop needed start/stop toast, music cleanup after restart, colourful top-floor-only party effects, and no board jitter/whole-building stripes. | Rooftop rounds | Implemented historically; validate R9 in H0 replay. |
| PTF-010 | chat reconstruction — date unavailable | Large fleets on R19/R20 clipped or shifted off-screen; cables/capacity labels required visual correction. | R19–R20 | Implemented historically; H2 replay acceptance item. |
| PTF-011 | chat reconstruction — date unavailable | Counterweight lifts required aligned transfer floors, puzzle clarity, stable manual/Sweep pickup behaviour, and corrected pulley/tube visual treatment. | R21–R23 | Implemented in stages; H3 replay acceptance item. |
| PTF-012 | chat reconstruction — date unavailable | Capsule lifts were too griddy/cabled, were not centred in tubes, could miss manual targets or Sweep pickups, needed controller tooltips, and R24 could lag. | R24–R25 | Implemented in stages; target-device performance and input responsiveness remain open H3 evidence. |
| PTF-013 | chat reconstruction — date unavailable | Guests appeared to be only Checkout, Rooftop, or VIP traffic; R7 said half Checkout but appeared all Checkout; R9 read as Checkout rather than Rooftop. | R7, R9 | **Implemented—awaiting R9 replay.** RC-TRAF-01 consolidated standard spawning and enforces probabilistic Checkout plus Rooftop share routing. |
| PTF-014 | chat reconstruction — date unavailable | R2 remained too hard for playtesting after its first reduction. | R2 | Implemented: arrival rate was reduced further. Balance gate conflict is explicitly deferred pending product decision. |
| PTF-015 | chat reconstruction — date unavailable | The direction-decline “bong” remained audible and should be removed. | Audio/boarding refusal | Open unless superseded by a verified audio change; add reproduction context on next report. |
| PTF-016 | chat reconstruction — date unavailable | Gym Bros should board stinky lifts regardless of whether stink came from a fart or another source; Room Service must never be Checkout. | Guest rules | Implemented historically; retain regression coverage/observation. |
| PTF-017 | chat reconstruction — date unavailable | Every power-up should have its intended wall-clock duration; fart sound should be capped at two seconds; R14+ needed 50% more credits. | Power-ups, economy | Implemented/tuned historically; duration telemetry and human replay remain relevant. |
| PTF-018 | chat reconstruction — date unavailable | Zoning needed visible shaft colour for serviceable floors. | R14+ Service Zoning | Implemented historically; H1 discovery/readability check. |
| PTF-019 | chat reconstruction — date unavailable | The native blue suitcase is illegible on a green Happy guest background. Replace Checkout guests' native `🧳` marker with the explicitly text-presented briefcase `💼︎` and render it black on supported Chrome/Edge desktop. | Checkout guest marker, R7/R17 and persistent Checkout | **Planned for the next release.** Use `U+1F4BC U+FE0E` only for Checkout guests; do not change the guest-status background or Checkout routing semantics. |
| PTF-020 | chat reconstruction — date unavailable | “Made with ♥ in Melbourne, Australia” should use a pink heart. Audio credits should scroll on a compact tracker instead of taking up a whole modal/page. | RC1.0 shell Credits & Licences, Settings/Leaderboard attribution | **Planned for next-release design and implementation.** Keep the complete, accessible attribution text available; replace the space-heavy visible presentation with a compact scrolling tracker/disclosure treatment. |
| PTF-021 | code inspection — 2 August 2026 | VIP legs correctly begin Annoyed with about 40 seconds of active patience, but canonical `system.vipHeadstartSec` is unused; the runtime derives the same 20-second head start indirectly from general guest patience. | VIP configuration / R8+ | **Implemented.** Removed the dead parameter; VIP starts Happy on every leg, then follows normal patience thresholds, with the approved inter-leg pause and 10-life rage-quit penalty retained. |
| PTF-022 | chat reconstruction — 2 August 2026 | A round can appear to contain the wrong challenge because events inherit after introduction and the briefing is maintained separately. | R7+, especially Checkout/Rooftop interpretation | **Design complete; implementation planned.** The approved Game Play Map R1–R25 matrix replaces inherited eligibility; runtime activation and briefing content must derive from it. |

## Current intake boundary

The next requested evidence window is H0/H1: replay R9 after RC-TRAF-01, then continue through R15. New feedback from
that session must receive a new `PTF-` identifier here, then be classified in `DELIVERY_PLAN.md` and converted into
acceptance evidence in `TEST_PLAN.md` where applicable.

## Audit — 2 August 2026

Every reconstructed entry has a disposition. The only open or human-evidence-dependent items are:

| IDs | State | Next evidence |
| --- | --- | --- |
| PTF-013 | Implemented—awaiting replay | R7/R9 traffic-mix replay on the published H0 build. |
| PTF-015 | Open | Exact reproduction context for any remaining refusal “bong”. |
| PTF-007, PTF-018 | Implemented—awaiting H1 evidence | R9–R15 briefing, loadout, and zoning-discovery observations. |
| PTF-010–PTF-012 | Implemented—awaiting later evidence | H2/H3 desktop layout, counterweight, and capsule-device checks. |
| PTF-019 | Planned | Chrome/Edge visual check: Checkout briefcase is black and legible on Happy, Annoyed, and Critical guests; ordinary G-bound guests remain `G`. |
| PTF-020 | Planned | Credits show a clearly pink heart; CC-BY credit text remains accessible while the normal in-game presentation is compact and does not dominate the modal. |
| PTF-021 | Implemented | Focused lifecycle/audio checks confirm the VIP starts Happy, repeat legs retain the 10–30 second pause, and the 10-life rage-quit penalty remains configured. |

Implementation update: PTF-019 (black briefcase), PTF-020 (pink heart and compact audio credits), and PTF-022
(explicit challenge matrix feeding runtime and briefings) are implemented and awaiting visual/playtest confirmation.

All other entries are implemented historically, explicitly deferred, or retained as regression-sensitive observations.
