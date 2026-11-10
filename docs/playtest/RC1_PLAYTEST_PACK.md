# Marie's Birthday Edition Playtest Pack

**Document role:** Tester-facing session guide and distribution checklist
**Status:** Active Birthday release guide  
**Build:** `Maries-Birthday-2026-11-08.4`; confirm the matching identifier in Settings or Round Review.

## First session: normal campaign

Play at <https://gregorycwhill.github.io/Lift-Operator/> in current desktop Chrome or Edge. Allow about 15 minutes and
play naturally from Round 1. Mobile and Firefox are outside this release's supported scope.

Please tell us whether instructions, the automation controls, challenge briefings, and the Supply Closet make sense
without project guidance. Rate each completed round: **1 = very easy, 3 = about right, 5 = very hard**.

Use **Give Feedback** from Settings or Round Review whenever something is confusing or unexpected. It opens a Google
Form with a compact diagnostic string already filled in and copies that string locally. Opening the feedback form sends
these technical details to Google to pre-fill the form: round, seed,
browser and viewport. No feedback response is submitted unless you press **Submit**.

## Later session: higher-round access

After initial feedback, selected testers may receive the existing Debug URI. Accept **Playtest Access** to open
Playtest Tools, Warp, and seed replay for support reproduction. This is the same game with temporary testing access;
normal campaign progress remains separate. Do not share or use this URI for a first impression.

Useful later checks include pets in R5, zoning in R10/R14, Checkout waves in R7/R10/R18/R20, one-transfer journeys in
R15-R23, **Best in Show** specifically in R22, and capsule responsiveness in R24-R25. Report what you expected, tried, and observed rather
than trying to optimise for an automated test.

## What to include in feedback

- Round and whether you passed, failed, or stopped.
- Difficulty rating (1-5), browser/device, and any purchases or automation used.
- What you expected, what happened, and short reproduction steps if it repeats.
- An optional screenshot or video link. Paste a shareable Google Drive, iCloud, Dropbox, OneDrive, YouTube, Loom, or
  similar link and set access to “Anyone with the link”. Leave this blank if sharing media is inconvenient.

## Distribution operator checklist

- [ ] Confirm the deployed Pages commit/build identifier and record it in the release note.
- [ ] In a signed-out Chrome profile, confirm Give Feedback opens the public form with its diagnostic pre-filled.
- [ ] Confirm the form's media field is optional and says “Screenshot or video upload link”.
- [ ] Share the ordinary URI first; send the existing Debug URI only after initial feedback to selected testers.
- [ ] Record browser/device coverage, unresolved feedback, and known limitations in `../../TEST_PLAN.md` and
  `PLAYTEST_FEEDBACK_LOG.md`.

## Known limitations

- The campaign is desktop-first. Mobile, Firefox, and Endless mode are not part of this release.
- R24/R25 have automated layout coverage; real-device responsiveness feedback remains valuable.
- Pets and transfers are new. Report any pet/owner separation, invisible route, second transfer, lost patience history,
  or control that changes Sweep unexpectedly.
