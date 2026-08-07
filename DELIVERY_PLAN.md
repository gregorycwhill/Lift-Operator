# Friends & Family Release Candidate Delivery Plan

**Document role:** Current delivery scope and release decision only
**Status:** Active release-evidence slice
**Release target:** `1.0` (no release tag has been created)
**Owner class:** Product and engineering
**Last reviewed:** 8 August 2026
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
- The strict all-Sweep report is an internal diagnostic, not a Friends & Family release gate.
- Normal New Campaign uses a persisted random campaign seed; the supplied Debug URI provides controlled higher-round
  and seed reproduction without changing the normal first-impression path.
- Elapsed-time movement integration is deferred until after RC1.0. The current release may still address targeted
  overlay/rendering issues.
- Achievements, endless operations, Mobile, teleportation, polar lifts, Lift Bouncer, and player-authored rounds are
  roadmap work, not release candidates.

## Current collateral remediation before broad distribution

1. Reconcile `assets/audio/manifest.json`, `assets/audio/ATTRIBUTION.md`, and `assets/audio/audio-review.csv`.
   In particular, resolve the deliberate `NO SOUND` elevator-door decision and account for every bundled binary.
2. Create a canonical media manifest, then move or retire superseded screenshot variants from the active media folder.
3. Record a concise August release-history entry and keep completed implementation detail out of this plan.
4. Decide a retention policy for the 48 MB balance trace: concise summary/digest in Git, bulky trace as an artifact or
   otherwise explicitly justified.

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
