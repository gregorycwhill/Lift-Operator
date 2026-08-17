# Friends & Family Release Candidate Delivery Plan

**Document role:** Current delivery scope and release decision only
**Status:** Active release-evidence slice
**Release target:** `1.0` (no release tag has been created)
**Owner class:** Product and engineering
**Last reviewed:** 17 August 2026
**Implementation baseline:** `master` at `bc59758` — Friends & Family playtest build

## Outcome

Place the complete 25-round desktop campaign in the hands of Friends & Family testers and gather feedback that is
actionable, attributable to a build, and safe to interpret. This is an evidence and packaging slice, not a feature
expansion. Product sequencing belongs in `ROADMAP.md`; durable rules belong in the design documents; test evidence and
human acceptance belong in `TEST_PLAN.md`.

## In scope

- Publish and verify the public GitHub Pages build from the baseline commit.
- Verify the unsigned Google Form feedback path, prefilled diagnostic string, copied diagnostic string, and optional
  shareable media-link field.
- Run the limited internal desktop/device confirmation defined in `TEST_PLAN.md`.
- Build, open, and inspect the itch.io-compatible ZIP from the same commit.
- Collect normal-campaign feedback first, then give selected testers the existing Debug manifest URI for higher-round
  access.
- Triage each report as a release blocker, a balance/polish candidate, or later-roadmap work.

## Explicit release gates

| Gate | Acceptance evidence | Owner/state |
| --- | --- | --- |
| Build identity | Settings, Round Review, diagnostics, tester pack, and packaged `BUILD.txt` identify the same immutable commit/build. | Engineering — verify on deployed build |
| Feedback access | A signed-out Chrome/Edge user can open the Form, see a prefilled diagnostic string, and submit without mandatory sign-in. | Product — human check |
| Player surface | A new player can start, resume, find Settings/feedback, understand the first automation instruction, and distinguish normal from Debug access. | Internal 15-minute check |
| Campaign arcs | Representative R9, R14+, R21–R23, and R24–R25 sessions are understandable and usable on supported desktop hardware. | Friends & Family evidence |
| Distribution package | The itch-compatible ZIP contains the expected static build, licences/notices, and opens locally. | Engineering — human check |
| Asset provenance | Every shipped audio file has an intentional manifest record and licence/provenance; retired files are not bundled. | Documentation/collateral blocker |

## Known, accepted boundaries

- Chrome and Edge on desktop/laptop are the supported RC1 browsers; Firefox and mobile are outside this window.
- The all-Sweep report is a negative-control diagnostic, not a Friends & Family release gate; the strict validator is
  retained for later balance work.
- Normal New Campaign uses a persisted random campaign seed; the supplied Debug URI provides controlled higher-round
  and seed reproduction without changing the normal first-impression path.
- Elapsed-time movement integration is deferred until after RC1.0. The current release may still address targeted
  overlay/rendering issues.
- Ordinary in-round background music is disabled for RC1.0. Menu and Rooftop music (controlled by the Music slider),
  VIP fanfare, Musak, and SFX remain available.
- Feedback is opt-in: opening the linked Google Form sends round, seed, browser, and viewport to Google as prefill URL
  parameters; no feedback response is submitted unless the player presses Submit. The form does not collect email
  addresses.
- Settings provides a confirmed local-data deletion action for the browser's campaign, leaderboard, custom automations,
  automation pins/teaching state, and audio settings.
- Current polish slice: stabilise countdown/message layout, clear final-life warning state between rounds, refine audio
  lifecycle and controls, group repeated power-up quantities, make Bronze Wide Doors lift-targeted, tighten promotion
  presentation, increase R8 traffic by 20%, and update R11/R25 briefing titles.
- Achievements, endless operations, Mobile, teleportation, polar lifts, Lift Bouncer, and player-authored rounds are
  roadmap work, not release candidates.
- Current lift-state remediation: Infinite Capacity expiry normalises an over-capacity car once at its next stop;
  Weighted Voting prioritises onboard delivery over incompatible pickup demand; parked cars re-evaluate after direction
  reversal; counterweight manual dispatch interrupts stale door/policy state; and R23 uses the reduced candidate spawn
  curve `0.7125`–`0.90`. These changes require focused regression tests and fresh R11/R15/R23 playtest evidence.

## Current post-playtest remediation

- Counterweight manual stops are pair commands: the selected car owns its requested service cycle, so its partner
  cannot release the command first and a competing parked car cannot claim its eligible pickup.
- VIP, Rooftop, and Round 2 notices render as fixed non-lobby overlays, never as layout content that moves the board
  or conceals the lobby. The R2 teaching rail is capped at 360px, may span beyond the lift shafts, and retains a clear
  right gutter for readable instruction text.
- Promotion interstitials and briefings without a Supply Closet use explicit content-sized modal geometry. Only the
  shop briefing mode reserves the full-height internal shop layout.
- Campaign checkpoints explicitly restore committed Credits and purchased inventory; an unpurchased cart is not saved.
- The Supply Closet cart uses compact tier-coloured icon/count tokens with accessible tooltips.
- Leaderboard is results-only. From Campaign Complete its close action returns to the completion modal without resuming
  a terminal round. Every completed campaign seed is retained as one local score record, using total Credits earned
  before spending so the active player's score is always visible at conclusion.

## Next remediation slice — service, guidance, and economy

**Status:** Implemented — targeted automated checks passed; human replay remains required.

This slice is a correctness and comprehension fix, not new gameplay content. It consolidates PTF-040 and the related
earlier reports that reopening has shown to be incomplete. Gold Wide Doors now uses the bounded `0.20×`/20-second
all-lift candidate; per-round Credit changes remain evidence-led.

| Workstream | Implementation outcome | Feedback covered |
| --- | --- | --- |
| Shared-floor service | Replace per-guest “most-loaded car first” arbitration with a floor-level service session. Under genuine shared-queue pressure, compatible parked cars receive concurrent/rotating boarding allocations rather than one car monopolising demand. Preserve consolidated loading for ordinary low-pressure queues. | Rooftop/Infinite Capacity single-car loading; R11 capacity reports. |
| Service-cycle correctness | Re-evaluate a stopped floor after direction, target, load, Group Think, or capacity changes. Bound a service cycle; prevent a guest who just alighted from immediately reboarding the same lift at that floor; commit a departure for an onboard VIP after its current service transaction. | Reversal non-pickup; VIP stranded under Weighted Voting; Group Think/TARDIS/Wide Doors loops; Gym Bro/ordinary loops. |
| Manual-stop integrity | A manual target reserves a complete selected-car service stop, including VIP boarding, before normal policy can retarget it. | R23 manual VIP and ordinary pickup reports. |
| Counterweight Sweep | Implement a deterministic pair itinerary that considers compatible demand for both cars, completes the current paired direction, then reverses. Keep manual pair commands highest priority. | R21 Sweep failure; R23 counterweight confusion and excessive manual burden. |
| Guided tutorial framework | Add a durable, opportunity-led, numbered/glowing tutorial framework. R2 teaches display Sweep, arm it, and deploy it to its single controller; R3 repeats the sequence and deploys to both controllers. The reusable context API is ready for later first-use flows for power-ups, VIP, Jam, Stink, Counterweights, Zoning, and Open Plan. Dismissal is round-local; correct completion persists. | R3/Sweep failures and general first-use confusion. |
| Player information | Explain guest destination numbers in initial instructions without changing guest appearance. Show fleet size in the briefing/closet and standardise power-up scope labels (`1 lift`, `All lifts`, `Building`, `Target floor`) in cards, tooltips, and cart. | Guest-number confusion; Silver scope; Wide Doors purchasing context. |
| Message rail | Move informational event notices such as Last Drinks to a non-interactive toast treatment that cannot consume pointer input or block shaft controls. | Last Drinks blocking rooftop commands. |
| Economy diagnosis and tuning | Produce compact per-round credit ledgers (opening, earned, spent, closing) and set target bands for R17, R18, and R23. Rebalance Gold Wide Doors from near-instant building-wide service toward a bounded high-throughput effect only after that evidence. | Gold Doors strength; R17 surplus; R18 hands-off inventory; R23 scarcity. |
| Audio | Apply the accepted VIP fanfare gain multiplier of `0.75`. | VIP music volume. |

### Delivery order

1. Add focused service-cycle state/telemetry fixtures first; use them to reproduce the shared-rooftop, reversal,
   Group Think, Infinite Capacity, VIP, and manual-target scenarios before changing arbitration.
2. Implement shared-floor allocation and bounded service-cycle rules; then land manual-stop and counterweight Sweep
   changes behind the same service invariants.
3. Implement the tutorial framework, contextual information, non-blocking Last Drinks toast, and VIP gain adjustment.
4. Generate compact credit-ledger evidence, select candidate Gold Wide Doors and round-credit values, and run the
   focused balance/human replay protocol.
5. Update feedback dispositions only after targeted automated checks and the named human replays pass.

### Explicit non-goals

- Do not alter guest-token appearance; destination-number clarity belongs in onboarding.
- Do not introduce auto-dispatch for waiting VIPs.
- Do not change carry-forward Credits; diagnose their source before tuning payouts or power-up potency.
- Do not implement elapsed-time movement integration in this slice; it remains post-RC1.0 work.

## Current collateral remediation before broad distribution

1. Verify `assets/audio/manifest.json`, `assets/audio/ATTRIBUTION.md`, and `assets/audio/audio-review.csv` remain
   synchronized after any asset change. The deliberate `NO SOUND` elevator-door and urgency assets are retired.
2. Create a canonical media manifest, then move or retire superseded screenshot variants from the active media folder.
3. Record a concise August release-history entry and keep completed implementation detail out of this plan.
4. Decide a retention policy for the 48 MB balance trace: concise summary/digest in Git, bulky trace as an artifact or
   otherwise explicitly justified.

## Current polish slice

- Compact the Supply Closet cart from its first item onward, with a single-line Credits total and tooltip-backed
  icon/count items.
- Keep the authored campaign rank visible in the live game sidebar, use the gold-star VIP icon consistently in
  briefings, and return from Settings → Leaderboard to Settings without resuming play.
- Apply the approved RC1.0 prices: Wide Doors `1/2/3`, Calming Musak `2/4/8`, Double-Decker `1/2/3`, Open Plan `2/3/5`,
  and TARDIS `2/3/5` Credits.
- Keep the Double-Decker and Open Plan tier headers, but remove redundant tier prefixes from their descriptions; use
  the canonical `🪜` Double-Decker icon everywhere, including active lift overlays and activation feedback.
- Keep only compact balance summaries in Git. Raw frame traces are opt-in local outputs and are excluded from release
  commits.
- Replace the first-dispatch, zoning, and capsule README captures with the supplied product screenshots and record
  their provenance in `assets/media/README.md`.

## Release sequence

1. Complete the collateral remediation and baseline verification.
2. Share the ordinary public URI and collect initial feedback.
3. Share the existing Debug manifest URI only with selected follow-up testers.
4. Triage evidence, update the feedback disposition index, and decide whether any finding blocks RC1.0 promotion.
5. If accepted, tag/package the exact commit; if not, open a narrowly scoped follow-up delivery slice.

## Exit criteria

- No unresolved P0 correctness, distribution, or licence/provenance issue.
- The current build, feedback endpoint, and packaged artifact are human-verified.
- The test plan records the release-commit evidence distinctly from older runs.
- The playtest log has a current disposition for each Friends & Family report.
- The roadmap and release history accurately show whether RC1.0 is promoted, extended, or superseded.

## Historical context

Completed implementation slices, prior hardening checklists, and detailed remediation narratives are retained in
`docs/archive/RELEASE_HISTORY.md`, `docs/archive/`, and Git history. They are not active delivery authority.
