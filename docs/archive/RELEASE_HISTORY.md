# Lift Operator Release and Delivery History

**Status:** Historical release record; not a current plan
**Owner class:** Product and engineering
**Last reviewed:** 8 August 2026
**Use instead for current work:** `ROADMAP.md`, `DELIVERY_PLAN.md`, and `TEST_PLAN.md`

This file preserves concise outcomes from completed delivery slices. Git history remains the detailed implementation
record; obsolete checklists are not copied here.

## Friends & Family playtest build — 8 August 2026

- Commit `bc59758` established the Friends & Family candidate baseline on `master`, the GitHub Pages deployment branch.
- The completed hardening work includes the campaign shell, local round-boundary resume, Settings/Credits & Licences,
  Google Form feedback diagnostics, public-first/Debug-follow-up distribution guidance, counterweight routing
  remediation, explicit challenge scheduling, and 25-round campaign polish.
- Focused checks passed before commit. A fresh full release command, signed-out feedback-form check, package smoke,
  and Friends & Family human evidence remain release gates; this is not yet a public `1.0` tag.
- Documentation governance was reset so the active Delivery and Test plans contain only current release evidence;
  completed detail remains here, in `docs/archive/`, and in Git history.
- Seven unused bundled audio binaries were removed and non-canonical screenshot captures were moved to the media
  archive. The remaining elevator-door/fallback mismatch is explicitly retained as a post-RC runtime reconciliation
  rather than misrepresented as a completed audio audit.

## Network campaign and permanent Automation Dock — July 2026

- Service Zoning became a saved Workshop policy capability and Ground became shared across zones.
- The in-world two-step Automation Dock replaced legacy per-lift selectors and the Debug variant.
- Settings replaced the ordinary Leaderboard entry point while campaign completion retained Leaderboard access.
- Credits became persistent between successful rounds and the Supply Closet/no-spend flow was corrected.
- R14–R20 received large-fleet, briefing, event, audio, and responsive-layout remediation.

Representative completion commits include `59dce72` and subsequent July hardening commits. Human balance and device
acceptance carried forward into the major release candidate.

## Counterweight/Open Plan trilogy — July 2026

- R21–R23 added fixed adjacent counterweight pairs at 11/15/29 floors.
- R22 introduced timed tiered Open Plan transfers; R23 combined pairs, zoning, and fleet-scale operation.
- Pair movement, jam interaction, Turbo behavior, odd-floor alignment, briefings, and pulley/cable presentation were
  implemented and covered by focused browser tests.

Human comprehension, balance, and the reported R22 manual-stop case carried forward into release acceptance.

## Capsule dispatch arc — 28–31 July 2026

- Commit `ea42d5b` implemented R24–R25 with 10/20 single-passenger capsules over 15/30 floors, deterministic demand
  currents, short jams, exclusions, and existing automation support.
- Commit `164d0ef` added VIP boarding priority, stale automation-command protection, countdown cue cleanup, corrected
  briefings, rooftop visual scoping, and removal of the boarding-refusal sound.
- Commit `0822d81` removed capsule cables and strengthened tube separators.

Focused syntax, mechanics, audio, integration, and capsule-rendering tests passed. R24/R25 performance and broad human
playability remain current release-candidate acceptance, not completed historical evidence.
