# Major Release Candidate Test Plan

**Document role:** Current release evidence, acceptance gates, and playtest protocol only
**Status:** Active acceptance plan for the 25-round major release candidate
**Owner class:** Engineering and playtest
**Last reviewed:** 31 July 2026
**Testing principles:** `TESTING_STRATEGY.md`
**Delivery scope:** `DELIVERY_PLAN.md`

## Current evidence

The implementation baseline is `0822d81` on `master`.

Recent focused evidence:

- JavaScript syntax: 61 files passed.
- Documentation: 23 Markdown files passed after the documentation refactor.
- UTF-8: 102 first-party text files passed; unit gate passed.
- Mechanics suite: 17/17 passed, including VIP priority boarding.
- Audio suite: 23/23 passed; `guest_refused` is telemetry-only and has no sound asset or fallback.
- Integration suite: 3/3 passed.
- Capsule rendering regression passed: capsule cars have no cable pseudo-element and tube separators use the intended
  dark 3px treatment.
- The long Auto-Pilot suite did not complete within a 120-second local wrapper because Protocol Alpha is intentionally
  allowed up to nine minutes. This is not a recorded product pass or failure; it remains a release-gate execution item.

Completed historical gates and implementation checkpoints are summarized in `docs/archive/RELEASE_HISTORY.md`. Detailed
test evolution remains in Git history rather than this active plan.

## Automated release gate

Run from PowerShell on the release-candidate commit:

```powershell
npm.cmd run test:syntax
npm.cmd run docs:check
npm.cmd run test:config
npm.cmd run balance:check
npm.cmd run test:economy
npm.cmd run balance:report:check
npm.cmd run test:utf8
npm.cmd run test:unit
npm.cmd run test:mechanics
npm.cmd run test:integration
npx.cmd playwright test tests/audio.spec.js --workers=1
npx.cmd playwright test tests/lifecycle-correctness.spec.js --workers=1
npm.cmd run test:e2e
```

Record the commit, Node/browser versions, operating system, pass counts, duration, and any failure artifact. The
aggregate `npm.cmd test` may also be used when the runner allows more than ten minutes.

## Open engineering acceptance

### R22 manual-stop boarding

- [ ] Reproduce the report with a fixed seed and explicit lift/automation/floor state.
- [ ] Record the exact refusal cause: stale automation, direction, parking arbitration, capacity, zone, stink, VIP, or
  passenger state.
- [ ] If no documented rule prevents boarding, prove that a manual target reaches the floor and boards the compatible
  guest before automation resumes.

### Canonical event gating

- [x] Product rule confirmed: after introduction, VIP, Rooftop, Stink, Gym, jam, and Checkout remain eligible in
  subsequent conventional rounds unless a round explicitly excludes them.
- [ ] Canonical data records explicit exclusions and runtime event activation uses one shared persistence resolver.
- [ ] R17 retains Checkout as its primary authored challenge while inherited events continue unless explicitly excluded.
- [ ] Fixed-seed tests cover every event introduction, absence, and intended combination.

### Capsule performance

- [ ] Capture an R24 and R25 trace with representative queues, automations, jams, and active effects.
- [ ] Record frame intervals, long tasks, DOM count, and layout/paint hotspots.
- [ ] R25 targets 60fps, remains at or above 45fps under representative pressure, and avoids sustained tasks above 50ms.
- [ ] Twenty capsules and thirty floors remain fully operable without horizontal scrolling or Dock overlap on the
  reference desktop viewport.

### Long-running release automation

- [ ] Protocols Alpha, Beta, and Gamma pass on the release-candidate commit.
- [ ] CI gives Protocol Alpha enough time, or runs it as an isolated/scheduled job with a shorter blocking smoke gate.
- [ ] Documentation reports timeouts as environmental limitations, not successful test results.

## Structured broad-feedback playtest

For every session record: commit, balance version, browser/device, round, seed, starting Credits, purchases, automation
layout, result, observed failure cause, and the tester's own explanation.

| Arc | Minimum sample | Questions |
| --- | --- | --- |
| Onboarding | R1–R3 | Are controls, Room Service, Credits, countdown, and first automation legible? |
| Core events | R7, R9, R11, R13 | Are Checkout, Rooftop, Gym Bros, stink, gravity, and resource pressure understandable and fair? |
| Zoning network | R14, R17, R19, R20 | Can players choose a loadout, deploy zones, diagnose refusals, and keep the fleet visible? |
| Counterweights | R21–R23 | Can players explain paired movement, recover with Open Plan, and scale to the network round? |
| Capsule dispatch | R24–R25 | Does automation outperform frantic manual play; are demand currents, jams, tubes, and controllers readable? |

Cross-cutting observations:

- [ ] Automation Dock: policy-first, lift-first batch, disarm, Library toggle, pin persistence, keyboard, and touch.
- [ ] Audio: first gesture, menu resume, pressure fade, Rooftop lifecycle, Musak duration, one-shot SFX caps, mute, and
  independent volume controls.
- [ ] Visual stability: top-floor icons, tube/cable treatment, capacity labels, suitcase contrast, rooftop decoration,
  board jitter, and supported viewport fit.
- [ ] Economy: carried Credits are understood; no-spend confirmation appears only when a shop is available; loadouts
  create choices rather than mandatory purchases.
- [ ] Progression: briefing text matches actual events and “Finish Campaign” appears only after R25.

## Promotion rule

Promote only when:

- automated engineering gates are green or explicitly dispositioned;
- no reproducible progression, save, routing, or inventory corruption remains;
- broad feedback covers all five arcs above;
- balance changes are made through canonical data, one parameter family at a time, with generated artifacts refreshed;
- unresolved feedback is classified as blocker, accepted limitation, tuning candidate, or later-roadmap work.

Unchecked human items do not mean the feature is unimplemented. They mean release acceptance evidence has not yet been
recorded.
