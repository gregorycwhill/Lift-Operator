# Friends & Family Release Candidate Test Plan

**Document role:** Current release evidence, human acceptance, and playtest protocol only
**Status:** Active acceptance plan
**Owner class:** Engineering and playtest
**Last reviewed:** 17 August 2026
**Delivery scope:** `DELIVERY_PLAN.md`
**Test principles:** `TESTING_STRATEGY.md`
**Baseline:** `master` at `bc59758` — Friends & Family playtest build

## Evidence already available

- `npm.cmd run test:release` passed on 7 August 2026 before the final Friends & Family slice: syntax, documentation,
  config, balance, economy, UTF-8, unit, mechanics, integration, audio, supported Playwright, and the balance report.
- The final slice was subsequently covered by focused lifecycle, smoke, integration, configuration, documentation,
  UTF-8, and syntax checks before commit `bc59758`.
- These results are evidence for the baseline tree, but the final release command remains a required commit-bound gate
  before a public 1.0 tag or distribution package.

## Automated release gate

Run from PowerShell on the exact release commit:

```powershell
npm.cmd run test:release
```

Record the commit, command result, elapsed time, and report hash in `docs/archive/RELEASE_HISTORY.md`. The all-Sweep
portion is a negative-control diagnostic: it demonstrates unattended Sweep behavior, but it is not by itself a
Friends & Family promotion blocker. The strict validator remains available for later balance work.

## Limited internal confirmation — 15 minutes

Use current Chrome or Edge on desktop/laptop. Record the build identifier shown in Settings or Round Review.

1. Start a normal New Campaign; confirm the onboarding, R1 controls, and R2 automation explanation are readable.
2. Confirm pause/resume at a round boundary, Settings, Credits & Licences, and Give Feedback are reachable without
   Debug.
3. Open Give Feedback in a signed-out/private window: confirm the Google Form opens, diagnostic text is prefilled and
   copied, and the optional media-link field is understandable. Confirm the privacy wording explains that opening the
   form sends round, seed, browser, and viewport to Google, while Submit is still required for a response.
4. Warp only through the supplied Debug manifest URI: spot-check R9 event clarity, R14 zoning/briefing, R21 pair
   routing/manual override, and R24 capsule readability/performance.
5. Build and open the itch-compatible ZIP locally; confirm it contains `LICENSE`, third-party notices, attribution,
   and a matching `BUILD.txt`.

6. In R2/R3, confirm countdown and teaching/VIP/Rooftop notices remain fixed over the non-lobby board area: the R2
   teaching rail may extend beyond the lift shafts, but the board does not shift, lobby queues remain visible, cables
   stay visible, and no transient scrollbar appears. Confirm the
   final-life warning clears at the next round.
7. Confirm Settings starts unmuted with clean storage, persists deliberate audio changes, and stops Musak before menu
   music after a round. Confirm Bronze Wide Doors targets one lift, repeated cart/tray items use quantity badges, and
   tooltips use Bronze/Silver/Gold.
8. Confirm the four-column Supply Closet remains readable at the supported desktop viewport; spot-check R8 traffic and
   the R11/R25 titles.
9. Confirm the cart total is a compact single-line Credits value even with one item, cart quantities remain icon/count
   tokens, the live sidebar retains the authored rank after starting a round, and VIP uses the gold star in both
   briefing chips and first-introduction text.
10. From Settings, open Leaderboard and close it; confirm Settings reappears and gameplay does not resume. Confirm
    the release-candidate prices are Wide Doors `1/2/3`, Calming Musak `2/4/8`, Double-Decker `1/2/3`, Open Plan `2/3/5`,
    and TARDIS `2/3/5` Credits. Confirm Double-Decker and Open Plan descriptions do not repeat their tier names, and
    Double-Decker uses `🪜` in shop and active-effect displays.

11. Regenerate balance acceptance evidence and confirm the committed JSON/Markdown contains hashes, per-round/per-seed
    outcomes, compact diagnostics, and aggregate metrics but no frame-by-frame trace. Generate raw traces only with the
    explicit diagnostic option when investigating a balance anomaly.

## Focused UI acceptance checks

- The R2 teaching rail is capped at 360px, may extend beyond the lift shafts, and never covers the lobby, reaches the
  right margin, or changes board layout. Critical VIP/Rooftop notices retain the same non-lobby anchoring.
- Promotion interstitials and no-shop briefings are content-sized around their rendered copy and button; neither uses
  the full briefing height or introduces a needless vertical scroll area. Shop briefings retain their fixed layout.
- Trigger Double-Decker and confirm `🪜` appears on the active lift for the effect duration. Complete two campaigns
  with different seeds and reopen one: each completed run appears once on the local Leaderboard, including the current
  player's score, while reopening a completed campaign does not duplicate it.

## Lift-state remediation checks

The latest remediation must pass these focused checks before the next Friends & Family replay:

- Infinite Capacity expiry sheds only enough load to return a car to ordinary capacity, including a car containing Gym
  Bros; the expiry marker clears and compatible passengers do not board/alight repeatedly.
- Weighted Voting delivers an onboard VIP before selecting waiting demand that cannot board that car. A waiting VIP still
  requires player-observed intervention and is not silently dispatched by policy.
- A Sweep car that reverses direction while parked re-evaluates the current floor and boards newly compatible guests;
  rooftop evacuation continues until the car is full or no compatible guest remains.
- A manual command from either counterweight controller interrupts stale door/policy state, dispatches the selected car
  and its complementary partner, and remains authoritative until the selected car completes its service stop. The
  partner arriving first must not release it; a competing parked car must not take the selected car's eligible guests.
- R23 uses the candidate `0.7125`–`0.90` spawn curve. Treat difficulty as a playtest observation, not an automated
  simulator proof of human solvability.

- Restore a campaign after purchasing power-ups and starting a round: remaining Credits and committed inventory must
  return, while an unpurchased cart is intentionally absent. At Campaign Complete, close Leaderboard and confirm the
  completion modal returns without lift movement, spawns, timers, or active power-ups resuming.

## PTF-040 remediation acceptance

Targeted implementation checks passed on 17 August 2026. These checks remain required for the next Friends & Family
replay and supersede the earlier “implemented—awaiting replay” claims where the same behaviour was reported again.

### Automated service invariants

1. **Shared rooftop queue:** with two or more compatible parked cars and a queue above the shared-pressure threshold,
   each eligible car receives boarding work. With all-lift Infinite Capacity active, no single car may monopolise the
   queue while another eligible parked car departs empty.
2. **Ordinary queue preservation:** at low queue pressure, allocation remains consolidated enough to avoid needless
   partial loads; it must not indiscriminately spread one or two guests across every car.
3. **Reversal:** a Sweep lift stopped at a floor with newly compatible guests after reversal opens/services that floor
   before moving away.
4. **Bounded service cycle:** Group Think, Wide Doors, TARDIS activation/expiry, and changing passenger destinations
   cannot cause an endless same-floor board/alight loop. A just-alighted guest cannot immediately reboard the same
   car at the same floor/service cycle.
5. **VIP departure:** an otherwise suitable car containing only a VIP leaves for the VIP destination under Weighted
   Voting after its current service transaction; a waiting VIP still receives no automatic dispatch.
6. **Manual stop:** a manually targeted car—including a counterweight car in R23—opens and performs a full service
   cycle for an eligible VIP or ordinary guest before automation may retarget it.

### Counterweight Sweep checks

1. R21 two-car Sweep visits compatible demand for either car through a deterministic paired direction, then reverses;
   it must not oscillate without service.
2. R23 multi-pair Sweep honours the same pair itinerary and accepts a manual command from either car immediately.
3. The selected car’s manual stop takes precedence over its partner, while the forced complement remains geometrically
   correct. Ordinary service must work without mandatory manual floor-by-floor intervention.

### Guidance and presentation checks

1. Clean-storage R2 teaches display Sweep, arm Sweep, and deploy to its one controller; R3 repeats the sequence and
   adds deployment to its second controller. Each numbered glow advances only on the correct action.
2. Dismiss suppresses the prompt for that attempt only. Completing the final action prevents it in future campaigns.
3. First-use prompts for a power-up, VIP, Jam, Stink, Counterweights, Zoning, and Open Plan highlight only relevant
   targets, do not block unrelated controls, and never obscure the lobby.
4. Initial instructions state that a guest’s number is its destination floor; normal guest token rendering is unchanged.
5. Every power-up tier exposes a standard scope statement in the shop, tooltip, and cart. The pre-shop briefing/closet
   identifies the round fleet as `X lifts · Y floors`.
6. Last Drinks is visible for its intended duration but does not capture pointer input; lifts remain targetable through
   the notice.
7. VIP fanfare output is `0.75×` the previous dedicated gain and still obeys Mute/SFX settings.

### Economy evidence

1. The balance command records a compact credit ledger per round/seed: opening Credits, earned Credits, spent Credits,
   and closing Credits. Raw frame traces remain opt-in and uncommitted.
2. Targeted ledger scenarios cover R17, R18, and R23, including a carry-forward inventory case. The report must make
   a 72-Credit R17 and 13-Credit R23 outcome diagnosable rather than merely observable.
3. Before canonical tuning, test candidate Gold Wide Doors against a bounded all-lift boarding rate; it must improve
   recovery materially without creating an unattended/visually unreadable R18 run.

### Human replay matrix

| Round | Required observation |
| --- | --- |
| R2–R3 | A new player can complete the Sweep tutorial and understands guest destination numbers. |
| R11 | Multiple lifts participate in rooftop evacuation, including during Infinite Capacity; no board/alight loops. |
| R15 | Weighted Voting carries a lone onboard VIP away after Rooftop release; power-up combinations remain stable. |
| R21 | Sweep is understandable and useful without mandatory manual routing. |
| R23 | Manual VIP pickup stops reliably; Sweep is usable across three-plus pairs; credit availability is recorded. |
| R17–R18 | Record the credit ledger and whether Gold Wide Doors or accumulated inventory removes meaningful decisions. |

## Friends & Family evidence window

Use `docs/playtest/RC1_PLAYTEST_PACK.md` and append observations to
`docs/playtest/PLAYTEST_FEEDBACK_LOG.md` before interpretation.

Required qualitative evidence:

- First-session player understands ordinary campaign controls, Supply Closet, automation selection, and feedback path.
- R9 Rooftop, R14+ zoning, R21–R23 counterweights/Open Plan, and R24–R25 capsules are legible and usable.
- Checkout marker, VIP notices, briefings, and critical message rail do not conceal required board information.
- One Chromebook/low-power Chrome observation if a tester is available, especially in zoned or capsule rounds.

Use 1–5 round difficulty ratings: **1 very easy**, **3 about right**, **5 very hard**. Balance reports are evidence to
triage, not automatic retuning instructions.

## Human gates still open

| ID | Check | Pass condition |
| --- | --- | --- |
| H1 | Public feedback form | Works while signed out; opening sends only the stated prefill diagnostics, and no response is submitted automatically. |
| H2 | Build identity | Settings, Round Review, diagnostic, tester pack, and ZIP identify the same baseline. |
| H3 | Audio/licence surface | Credits are readable and every bundled file has a verified provenance/status record. |
| H4 | Package smoke | ZIP opens locally with expected assets/notices and no missing start path. |
| H5 | Supported-browser play | Chrome/Edge desktop has no notice; Firefox, Safari, mobile, and tablet show a non-blocking warning with Continue anyway. |
| H6 | Campaign feedback | Enough structured observations exist to assess the five campaign arcs and any P0/P1 reports are dispositioned. |

## Test-data and report governance

- Every active fixture must name its consuming command and purpose. Retire or archive fixtures with no current owner.
- Store concise campaign-balance summaries in Git. The full trace needs an explicit retention decision before it is
  regenerated and recommitted.
- Historical test reports and completed checklists belong in `docs/archive/`; do not revive them as current acceptance
  criteria.
