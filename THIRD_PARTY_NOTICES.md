# Third-Party Notices and Licence Audit

**Status:** Distribution audit — final project licence intentionally not selected  
**Last audited:** 2 August 2026  
**Scope:** Files bundled by the GitHub Pages/itch.io static distribution, excluding development-only `node_modules/`

## Outcome

No final licence is selected for Lift Operator yet. The project must not represent all bundled material as available
under a future project licence: third-party audio keeps its own terms, and CC-BY attribution requirements must travel
with every distribution. This audit identifies the information required before a project licence is chosen.

## Bundled code

| Component | Bundled location | Claimed/upstream licence | Audit result |
| --- | --- | --- | --- |
| Blockly | `lib/blockly_compressed.js`, `blocks_compressed.js`, `en.js`, `javascript_compressed.js` | Apache-2.0 (upstream Blockly) | Compatibility is generally permissive, but the vendored files lack version/provenance headers. **Gap:** record exact upstream version, source URL, and included licence text before public release. |
| LZ-String | `lib/lz-string.min.js` | MIT (upstream LZ-String) | **Gap:** vendored minified file has no version/licence header; record exact source/version and include the MIT notice. |
| First-party game code/CSS | Root JavaScript, `style.css`, generated balance data | No final project licence selected | Copyright/licensing decision remains with the project owner. Do not add a licence file until the third-party audit is accepted. |

## Audio

The authoritative per-asset source, author, modification, and licence record is `assets/audio/manifest.json`, with
human-readable credit text in `assets/audio/ATTRIBUTION.md` and intake history in `assets/audio/audio-review.csv`.

| Licence family | Bundled use | Distribution requirement |
| --- | --- | --- |
| CC0 | Several music and SFX assets | May be distributed without attribution; retain provenance record. |
| CC-BY 3.0 / 4.0 | Menu music, gameplay music, Rocket, Synthetic Farts, Wrench metal, Double-Decker, VIP fanfare, urgency, UI error, and other listed assets | Preserve author/title/source/licence notice and state any modification. A project licence cannot remove this obligation. |
| Pixabay Content License | Freshener and Group Think | Preserve source/provenance. Do not distribute the sound as a stand-alone asset or imply ownership; check current Pixabay terms before a commercial/public launch. |

### Audio provenance gaps and blockers

- The former GPL-3.0 `assets/audio/sfx/powerup-wrench.wav` predecessor was removed during this audit. Production maps
  only to the documented CC-BY `powerup-wrench-metal.wav`; keep a regression check that the predecessor is absent.
- `gameplay-chiploop.mp3`, `gameplay-pressure-chip-bit-danger.mp3`, `powerup-special.wav`, and `powerup-turbo.wav` are
  bundled but are not individually described in the manifest. **Gap:** either remove unused files from release
  artifacts or add individual provenance/licence entries.
- Confirm every CC-BY attribution in the visible Settings attribution surface matches the manifest before release.

## Fonts and visual assets

| Category | Audit result |
| --- | --- |
| Fonts | No font files or web-font downloads are bundled. CSS uses system/browser font stacks (`Segoe UI`, Tahoma, Geneva, Verdana, sans-serif, and monospace). |
| Visual assets | No third-party image, sprite, or icon files are bundled. Game visuals are first-party HTML/CSS/emoji/system glyphs. Generated screenshots and the social-preview PNG are first-party captures of the game. |

## Licence-selection constraints

Before selecting a project licence, close the Blockly/LZ-String provenance gaps and the unlisted/GPL audio gap above.
Then choose a licence for first-party code that does not claim rights over third-party audio; ship this notice, the
audio attribution record, and any required upstream licence texts in the itch.io ZIP.
