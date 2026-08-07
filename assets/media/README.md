# Release Media Manifest

**Status:** Active collateral inventory
**Owner class:** Product and release
**Last reviewed:** 8 August 2026

This folder contains player-facing media for the README and live social preview. The names below are the canonical
current assets; a file not listed here is a capture candidate or superseded variant and must not be added to release
collateral without an editorial decision. `assets/media/archive/` is a deliberately ignored local archive; Git history
is the repository-retained record of superseded captures.

| File | Role | README caption / use | Source status |
| --- | --- | --- | --- |
| `campaign-basic-dispatch.png` | README gallery | First dispatch | Curated capture |
| `campaign-supply-closet.png` | README gallery | Supply Closet | Curated capture |
| `campaign-workshop.png` | README gallery | Automation Workshop | Curated capture supplied by product |
| `campaign-zoning-fleet.png` | README gallery | Zoned fleet | Curated replacement |
| `campaign-counterweights-live.png` | README gallery | Counterweight puzzle | Curated live capture |
| `campaign-capsule-operations.png` | README gallery | Capsule dispatch at scale | Curated capture |
| `social-preview.png` | Open Graph/social preview | 1200×630 project preview | Canonical generated/curated preview |

## Superseded or candidate captures

- The local `archive/` copies of the previous zoning, capsule, counterweight, onboarding, rooftop, and Supply Closet
  screenshots are historical/candidate captures, not current README gallery assets. They are intentionally excluded
  from GitHub Pages and the release package.

## Maintenance rule

`npm.cmd run capture:media` creates diagnostic capture outputs. It does not automatically replace the curated README
gallery. When a capture becomes canonical, update this manifest, the README caption/reference, and the social-preview
record together. Prefer a deliberate editorial crop over treating raw diagnostic captures as public collateral.
