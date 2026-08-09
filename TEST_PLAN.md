# Friends & Family Release Candidate Test Plan

**Document role:** Current release evidence, human acceptance, and playtest protocol only
**Status:** Active acceptance plan
**Owner class:** Engineering and playtest
**Last reviewed:** 8 August 2026
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
   copied, and the optional media-link field is understandable.
4. Warp only through the supplied Debug manifest URI: spot-check R9 event clarity, R14 zoning/briefing, R21 pair
   routing/manual override, and R24 capsule readability/performance.
5. Build and open the itch-compatible ZIP locally; confirm it contains `LICENSE`, third-party notices, attribution,
   and a matching `BUILD.txt`.
6. In R2/R3, confirm countdown and teaching/VIP/Rooftop notices remain fixed over the lift shafts only: the board does
   not shift, lobby queues remain visible, cables stay visible, and no transient scrollbar appears. Confirm the
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
    the release-candidate prices are Wide Doors `1/2/3` and Calming Musak `2/4/8` Credits.

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
| H1 | Public feedback form | Works while signed out; diagnostics are prefilled and no data is sent automatically. |
| H2 | Build identity | Settings, Round Review, diagnostic, tester pack, and ZIP identify the same baseline. |
| H3 | Audio/licence surface | Credits are readable and every bundled file has a verified provenance/status record. |
| H4 | Package smoke | ZIP opens locally with expected assets/notices and no missing start path. |
| H5 | Supported-browser play | Chrome/Edge desktop spot-check passes; Firefox/mobile remain explicitly unsupported. |
| H6 | Campaign feedback | Enough structured observations exist to assess the five campaign arcs and any P0/P1 reports are dispositioned. |

## Test-data and report governance

- Every active fixture must name its consuming command and purpose. Retire or archive fixtures with no current owner.
- Store concise campaign-balance summaries in Git. The full trace needs an explicit retention decision before it is
  regenerated and recommitted.
- Historical test reports and completed checklists belong in `docs/archive/`; do not revive them as current acceptance
  criteria.
