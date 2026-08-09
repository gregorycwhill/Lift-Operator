# Playtest Feedback Log

**Document role:** Authoritative intake and disposition record for playtest feedback  
**Status:** Active, append-only source record  
**Coverage:** Reconstructed from the available project chat through 8 August 2026
**Companion records:** `../CHAT_DECISION_LOG.md`, `../../DELIVERY_PLAN.md`, `../../TEST_PLAN.md`

## How to use this log

Append each new player observation before it is interpreted or implemented. Preserve the wording when available; mark
reconstructed summaries clearly when it is not. Record the affected round, environment, source, severity, disposition,
and the delivery/test reference once known. This is the feedback source, not the current implementation work queue.

The older `../archive/PLAYTEST_ARCHIVE.md` preserves imported verbatim excerpts. It is historical evidence; new
feedback belongs here.

## Current disposition index — 8 August 2026

The register below remains the source evidence. This index is the current-status view and takes precedence over an
older row where a later correction exists.

| IDs | Current disposition | Current evidence needed |
| --- | --- | --- |
| PTF-013, PTF-019, PTF-020, PTF-022, PTF-035, PTF-036 | Implemented — awaiting Friends & Family replay | Published-build visual/behaviour confirmation. |
| PTF-023 | Implemented canonical tuning | Human R11 difficulty observation against the canonical `0.96`–`1.15` curve. |
| PTF-024 | Implemented | Rooftop and R11 briefing observation only. |
| PTF-028 | Implemented — awaiting balance replay | Endurance evidence with VIP/Rooftop excluded and hazards retained. |
| PTF-030, PTF-033, PTF-034 | Implemented — awaiting replay | Published-build routing, R13 balance, and seed-reproduction observations. |
| Remaining historical entries | Closed, deferred, or regression-sensitive | Reopen only with a reproducible report. |

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
| PTF-015 | chat reconstruction — date unavailable | The direction-decline “bong” remained audible and should be removed. | Audio/boarding refusal | **Closed.** Production refusal is telemetry-only and has no sound asset or fallback; regression coverage verifies this path. Reopen only with a reproducible counterexample. |
| PTF-016 | chat reconstruction — date unavailable | Gym Bros should board stinky lifts regardless of whether stink came from a fart or another source; Room Service must never be Checkout. | Guest rules | Implemented historically; retain regression coverage/observation. |
| PTF-017 | chat reconstruction — date unavailable | Every power-up should have its intended wall-clock duration; fart sound should be capped at two seconds; R14+ needed 50% more credits. | Power-ups, economy | Implemented/tuned historically; duration telemetry and human replay remain relevant. |
| PTF-018 | chat reconstruction — date unavailable | Zoning needed visible shaft colour for serviceable floors. | R14+ Service Zoning | Implemented historically; H1 discovery/readability check. |
| PTF-019 | chat reconstruction — date unavailable | The native blue suitcase is illegible on a green Happy guest background. Replace Checkout guests' native `🧳` marker with the explicitly text-presented briefcase `💼︎` and render it black on supported Chrome/Edge desktop. | Checkout guest marker, R7/R17 and persistent Checkout | **Implemented—awaiting visual confirmation.** Uses `U+1F4BC U+FE0E` only for Checkout guests; guest-status backgrounds and Checkout routing semantics are unchanged. |
| PTF-020 | chat reconstruction — date unavailable | “Made with ♥ in Melbourne, Australia” should use a pink heart. Audio credits should scroll on a compact tracker instead of taking up a whole modal/page. | RC1.0 shell Credits & Licences, Settings/Leaderboard attribution | **Implemented—awaiting visual confirmation.** Complete accessible attribution text remains available through the compact scrolling tracker/disclosure treatment. |
| PTF-021 | code inspection — 2 August 2026 | VIP legs correctly begin Annoyed with about 40 seconds of active patience, but canonical `system.vipHeadstartSec` is unused; the runtime derives the same 20-second head start indirectly from general guest patience. | VIP configuration / R8+ | **Implemented.** Removed the dead parameter; VIP starts Happy on every leg, then follows normal patience thresholds, with the approved inter-leg pause and 10-life rage-quit penalty retained. |
| PTF-022 | chat reconstruction — 2 August 2026 | A round can appear to contain the wrong challenge because events inherit after introduction and the briefing is maintained separately. | R7+, especially Checkout/Rooftop interpretation | **Implemented—awaiting visual confirmation.** The approved Game Play Map R1–R25 matrix and canonical briefing records drive runtime activation and briefing content; focused parity coverage passes. |

| PTF-023 | owner playtest — 3 August 2026 | Primary report claimed R11 lifts departed before filling during Rooftop evacuation. Owner replay did not reproduce the behaviour, passed twice using four to five power-ups, and trialled a lower 0.96–1.15 guests/second curve. | R11 — Peak Performance | **Candidate tuning; behaviour unconfirmed.** Keep base capacity 10 and canonical 1.3125–1.5 curve pending independent replays of the lower candidate. |
| PTF-024 | playtest feedback — 3 August 2026 | Gym Bros are described as immune to Stink but not as the source of a group stink effect; Rooftop needs a five-second “Last drinks!” warning before Happy Hour ends. | R11 briefing; Rooftop events | **Planned.** Clarify the three-Gym-Bro threshold in the first-use rule card and add one pre-release toast without changing event duration. |

**Status update — 3 August 2026:** PTF-023 is resolved as a promoted R11 balance change: the owner-tested
`0.96`–`1.15` guests/second curve is now canonical, with capacity 10 retained. PTF-024 is implemented: the R11
Gym Bros rule explains the three-Gym-Bro stink threshold and the Rooftop event emits one five-second “Last drinks!”
warning before release. Focused automated validation covers both changes; human replay remains evidence, not a blocker.

| PTF-025 | Chromebook replay — 4 August 2026 | Conventional zoned rounds slowed dramatically: R20 took about 30 seconds for a nominal 12-second uninterrupted traversal; R23 varied between normal and quarter speed. Removing the green zoning tint mid-round restored R23 to about 13 seconds. | Chromebook Chrome; R20/R23 Service Zoning | **Implemented—awaiting Chromebook replay.** Zone cells now use flat light/darker greys with floor striping preserved; elapsed-time movement remains deferred to post-RC1.0; R25 now has the active zoning flag. |
| PTF-026 | playtest feedback — 4 August 2026 | The Round 2 Automation tip is useful but disappears before it can be read. Messages should not obscure the game board. | R2 countdown; global notices | **Implemented—awaiting visual replay.** A reserved non-board message rail holds the approved tip for the ten-second teaching countdown and closes on dismissal or countdown start; ordinary 3.5-second toasts are unchanged. |
| PTF-027 | playtest feedback — 4 August 2026 | R11 says Gym Bros are immune to Stink but does not explain that three Gym Bros cause Stink. A group-stink transition needs the fart alert so the player knows to use Air Freshener. | R11 Gym Bros; lift hazards | **Implemented—awaiting replay.** The canonical round definition exposes the threshold rule through the briefing source path, and a threshold crossing publishes one stink/fart alert until the condition clears. |
| PTF-028 | playtest feedback — 4 August 2026 | Endurance with VIP and Rooftop pressure is incompatible with the carry-forward economy; a 2:49 result can be shorter than a normal round. | R12 Endurance | **Implemented—awaiting balance replay.** R12 disables VIP and Rooftop only; ordinary traffic, Room Service, Gym Bros, Jams, Stink, and Endurance remain active, with matching briefing copy. |
| PTF-029 | playtest feedback — 4 August 2026 | The briefing/Supply Closet needs more horizontal space so purchased power-ups remain readable. | Briefing modal and cart | **Implemented—awaiting visual replay.** The desktop briefing modal is approximately 50% wider with a responsive cap; the three-column shop remains intact. |

**Source note — 4 August 2026:** the supplied feedback numbered item 6 contained no observation. No action has been
created for it pending clarification.

| PTF-030 | playtest feedback — 5 August 2026 | R2 countdown overlaps its Automation tip; briefing is too wide; R9/Ground boarding can leave compatible-looking queues; Rooftop `R` guests can board/alight at the same floor; R17 VIP visibility/priority is unreliable; R21 Sweep appears incoherent; R14 opens with too few Credits. | R2, R9–R10, R14, R17, R21 | **Analysed—implementation pending.** Shared dispatch/boarding predicates and fill-first allocation are the primary remediation. Decisions: no automatic VIP dispatch; natural Rooftop arrivals leave for Ground after the party; R13 should target roughly 22–30 Credits into R14. |

## PTF-030 status correction

PTF-030 is implemented and awaiting replay. The remediation stacks the R2 teaching rail below the countdown, restores
594px briefing geometry, starts four-lift fleets in Sweep, applies the R13 0.15 round credit multiplier, shares
direction/zoning/stink/VIP/capacity/party eligibility between Sweep and boarding, returns Rooftop guests already at the
roof to Ground after release, keeps VIP arrival visible without auto-dispatch, and preserves pair-synchronised
counterweight policy. This note supersedes the pending status in the historical intake row above.

| PTF-031 | playtest feedback — 7 August 2026 | A built-in Sweep lift may refuse up-bound guests while travelling down, reverse at that same stopped floor, then depart upward without reconsidering those now-compatible guests. | Conventional boarding; reported during active play | **Implemented—awaiting replay.** Reversal rechecks the current floor for compatible guests while preserving all other boarding exclusions. |
| PTF-032 | playtest feedback — 7 August 2026 | Counterweight lifts remain ineffective in Sweep. | R21–R23 Counterweights | **Superseded by planned PTF-036 remediation.** The earlier pair-routing correction retained a hidden-driver edge case; the final scope makes built-ins explicitly pair-owned and symmetric. |
| PTF-033 | playtest feedback — 7 August 2026 | Round 13 spawn rate is too low; increase it by 20%. | R13 — Uphill Battle | **Implemented as balance candidate—awaiting replay.** Canonical candidate curve is `1.08 → 1.26`, up from `0.90 → 1.05`. |
| PTF-034 | implementation decision — 7 August 2026 | Normal campaigns should vary while test reports remain reproducible. | Campaign seed and Debug menu | **Implemented—awaiting replay.** New campaigns persist random campaign seeds; round seeds derive deterministically; Debug offers transient seed replay controls. |
| PTF-035 | late playtest feedback — 7 August 2026 | In Round 8, the VIP arrival notice rendered over the VIP at Ground, obscuring her location at the moment player intervention is needed. | VIP notice rail / board visibility | **Implemented—awaiting replay.** Queued critical notices now render in layout flow outside the board; each VIP leg gets one visible/audio arrival cue without obscuring the queue. |
| PTF-036 | late playtest feedback — 7 August 2026 | In counterweight rounds, Sweep appeared to permit an effective manual override only from the left car. | R21–R23 Counterweights | **Implemented—awaiting replay.** Built-in policies are pair-owned; either car may issue the immediate paired manual command, held until both cars complete service. Custom policies remain an advanced disclosed exception. |
| PTF-037 | playtest feedback — 8 August 2026 | R15 VIP stranded alone after Rooftop release under Weighted Voting; Infinite Capacity combined with Group Think/Wide Doors/rockets caused boarding and alighting loops; R11 cars appeared not to fill at the rooftop and ordinary guests cycled around Gym Bros; R23 manual VIP pickup did not stop reliably; R23 was reported too difficult. | R11, R15, R23; VIP, Rooftop, capacity, counterweights | **Implemented—awaiting replay.** Capacity expiry is now one-shot and normalises only overflow; onboard VIP delivery outranks incompatible waiting demand; counterweight manual dispatch resets stale door/policy state; R23 candidate spawn curve is `0.7125`–`0.90`. Direction-reversal and rooftop fill behaviour remain explicit replay checks. |

| PTF-038 | final playtest consolidation â€” 9 August 2026 | Counterweight Sweep can immediately reverse after a manual stop; VIP/Rooftop notices shift or obscure the board; restored campaigns may lose Credits; cart text overflows; Leaderboard can resume a finished campaign. | R21â€“R23, shared message rail, campaign shell, Supply Closet, Campaign Complete | **Implementedâ€”targeted regression pending.** Pair-level manual service ownership prevents partner-order release; notices are shaft-only overlays; committed Credits/inventory are explicit restore inputs; cart entries are icon/count tokens; and Campaign Complete returns from Leaderboard without resuming the engine. VIP notices say “Floor”, and Leaderboard no longer duplicates audio controls or attribution. |

PTF-038 supersedes the placement wording in PTF-035 and the completion wording in PTF-036: notices now occupy the
shaft-only in-world overlay, and a manual counterweight command completes after the selected car's service cycle rather
than after both cars merely reach their targets.

## Current intake boundary

The current evidence window begins with the Friends & Family build at `bc59758`. Share the ordinary public URI for a
natural first session first; after initial feedback, selected testers may receive the existing manifest Debug URI for
higher-round evidence. New feedback must receive a new `PTF-` identifier here, then be classified in `DELIVERY_PLAN.md`
and converted into acceptance evidence in `TEST_PLAN.md` where applicable.

## Audit — 2 August 2026

Every reconstructed entry has a disposition. The only open or human-evidence-dependent items are:

| IDs | State | Next evidence |
| --- | --- | --- |
| PTF-013 | Implemented—awaiting replay | R7/R9 traffic-mix replay on the published H0 build. |
| PTF-007, PTF-018 | Implemented—awaiting H1 evidence | R9–R15 briefing, loadout, and zoning-discovery observations. |
| PTF-010–PTF-012 | Implemented—awaiting later evidence | H2/H3 desktop layout, counterweight, and capsule-device checks. |
| PTF-019 | Implemented—awaiting visual evidence | Chrome/Edge visual check: Checkout briefcase is black and legible on Happy, Annoyed, and Critical guests; ordinary G-bound guests remain `G`. |
| PTF-020 | Implemented—awaiting visual evidence | Credits show a clearly pink heart; CC-BY credit text remains accessible while the normal in-game presentation is compact and does not dominate the modal. |
| PTF-021 | Implemented | Focused lifecycle/audio checks confirm the VIP starts Happy, repeat legs retain the 10–30 second pause, and the 10-life rage-quit penalty remains configured. |

Implementation update: PTF-019 (black briefcase), PTF-020 (pink heart and compact audio credits), and PTF-022
(explicit challenge matrix feeding runtime and briefings) are implemented and awaiting visual/playtest confirmation.

**Status correction:** PTF-019 and PTF-020 are implemented and await visual/playtest confirmation, not future-release
work. PTF-022 is implemented in code and canonical data; visual/playtest confirmation remains the only follow-up.

All other entries are implemented historically, explicitly deferred, or retained as regression-sensitive observations.
