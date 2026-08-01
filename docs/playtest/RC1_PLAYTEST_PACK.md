# RC1 Broad Playtest Pack

**Document role:** Tester-facing session guide and release-readiness checklist  
**Status:** Active for the RC1.0 hardening cycle  
**Build:** GitHub Pages `master` deployment; record the tested commit in every report

## Start here

Play at <https://gregorycwhill.github.io/Lift-Operator/> in a current desktop Chrome or Edge browser. The desktop
campaign is the test target; mobile is a later product phase. Use normal play rather than Debug unless a reproduction
specifically needs it.

The current priority is to replay **R9**, then continue naturally through **R15**. Do not deliberately retune your
strategy to satisfy automated tests: report what you expected, tried, and observed.

## What to test

| Window | Rounds | Look for |
| --- | --- | --- |
| H0 replay | R7, R9 | Checkout is a share of guests, ordinary hotel trips remain visible, and Rooftop traffic is legible. |
| H1 | R9–R15 | Briefings describe actual challenges; Credits/loadouts are understandable; VIP, Rooftop, Checkout, Gym, and zoning are readable. |
| Later evidence | R16–R25 | Continue only after H1 feedback is triaged; note fleet layout, counterweight/Open Plan behaviour, and capsule responsiveness. |

## Report template

Copy this into a message or append it to the feedback log:

```text
Round:
Result: passed / failed / stopped
Difficulty: 1 very easy — 3 about right — 5 very hard
Browser and device:
Commit/build (if known):
Starting Credits and purchases:
Automation/loadout used:
What I expected:
What happened:
Reproduction steps (if repeatable):
Screenshot/video (if available):
```

Add the report to `PLAYTEST_FEEDBACK_LOG.md` with a new `PTF-` ID before planning or fixing it.

## Capsule-device performance procedure

For R24/R25 on a desktop machine, record browser/device, viewport, and whether movement, input, or visuals lag. If it
does, capture a Chromium Performance trace for 20–30 seconds while the issue occurs and note the largest long task or
layout/paint hotspot. The acceptance target is 60fps, no sustained rate below 45fps, and no repeated task above 50ms.

The committed headless pressure smoke currently confirms expected capsule counts and no horizontal overflow at
1440×900, but it cannot certify a physical device’s frame rate.

## Known RC limitations

- R2 has deliberately reduced arrivals for accessibility; its all-Sweep balance-gate conflict is recorded separately
  and should not be interpreted as a normal-player failure.
- R24/R25 have deterministic headless performance evidence, but target-device frame and long-task evidence is pending.
- `PTF-015` remains open: report any direction-decline “bong” with the exact round and guest/lift state.
- The campaign is desktop-first. Mobile layout and the Endless mode are not part of RC1.0.

## Distribution and attribution checklist

Before sharing a candidate outside the project group:

- [ ] Confirm the deployed GitHub Pages commit and update the tester-facing release note below.
- [ ] Run `npm.cmd run test:smoke` and the relevant focused tests.
- [ ] Check every enabled audio asset against `../../assets/audio/manifest.json`, `../../assets/audio/audio-review.csv`,
  and `../../assets/audio/ATTRIBUTION.md`.
- [ ] Retain required CC-BY attribution in the shipped attribution surface and repository record.
- [ ] Record browser/device coverage and any known limitations in `../../TEST_PLAN.md`.

## Draft tester release note

> This RC build fixes the R7/R9 traffic issue: Checkout guests now coexist with ordinary hotel journeys, while active
> Rooftop events redirect only their intended share of guests. We have also improved the project’s feedback tracking.
> Please replay R9, then continue toward R15 and report difficulty, clarity, or anything that does not behave as you
> expect.
