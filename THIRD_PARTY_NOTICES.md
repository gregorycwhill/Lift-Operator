# Third-Party Notices and Licence Audit

**Status:** Distribution audit in remediation — first-party project code is GPL-3.0-only
**Last audited:** 8 August 2026
**Scope:** Files bundled by the GitHub Pages/itch.io static distribution, excluding development-only `node_modules/`

## Outcome

Lift Operator's first-party code is licensed under GPL-3.0-only; the full licence text is in `LICENSE`. The project
must not represent all bundled material as GPL-licensed: third-party audio keeps its own terms, and CC-BY attribution
requirements must travel with every distribution. This audit records the required provenance and distribution notices.

## Bundled code

| Component | Bundled location | Claimed/upstream licence | Audit result |
| --- | --- | --- | --- |
| Blockly | `lib/blockly_compressed.js`, `blocks_compressed.js`, `en.js`, `javascript_compressed.js` | Apache-2.0 | Blockly 13.1.1, from [google/blockly tag `blockly-13.1.1`](https://github.com/google/blockly/tree/blockly-13.1.1). The bundled build reports `Blockly.VERSION = "13.1.1"`. Required Apache-2.0 text is in `THIRD_PARTY_LICENSES.md`. |
| LZ-String | `lib/lz-string.min.js` | MIT | LZ-String 1.5.0, from [pieroxy/lz-string tag `1.5.0`](https://github.com/pieroxy/lz-string/tree/1.5.0); version is pinned in `package-lock.json`. Required MIT notice is in `THIRD_PARTY_LICENSES.md`. |
| First-party game code/CSS | Root JavaScript, `style.css`, generated balance data | GPL-3.0-only | Ship `LICENSE`, corresponding source, this notice, and third-party notices with every distribution. |

## Audio

The authoritative per-asset source, author, modification, and licence record is `assets/audio/manifest.json`, with
human-readable credit text in `assets/audio/ATTRIBUTION.md` and intake history in `assets/audio/audio-review.csv`.

| Licence family | Bundled use | Distribution requirement |
| --- | --- | --- |
| CC0 | Several music and SFX assets | May be distributed without attribution; retain provenance record. |
| CC-BY 3.0 / 4.0 | Menu music, gameplay music, Rocket, Wrench metal, Double-Decker, VIP fanfare, urgency, UI error, and other listed assets | Preserve author/title/source/licence notice and state any modification. A project licence cannot remove this obligation. |
| Pixabay Content License | Freshener, Group Think, and Toot Effect | Preserve source/provenance. Do not distribute the sound as a stand-alone asset or imply ownership; check current Pixabay terms before a commercial/public launch. |

### Audio provenance gaps and blockers

- The former GPL-3.0 `assets/audio/sfx/powerup-wrench.wav` predecessor was removed during this audit. Production maps
  only to the documented CC-BY `powerup-wrench-metal.wav`; keep a regression check that the predecessor is absent.
- Unused and unprovenanced former audio files (`gameplay-chiploop.mp3`, `gameplay-pressure-chip-bit-danger.mp3`,
  `powerup-special.wav`, and `powerup-turbo.wav`) were removed from the Pages and itch distribution tree.
- Settings and campaign-completion Audio Credits & Licences render the CC-BY entries from the manifest, including
  title, author, licence, modification note, and source link. Keep this surface synchronized with the manifest whenever
  an audio asset changes.
- The production manifest/CSV/attribution records require a final consistency pass before broad distribution. The
  deliberate `NO SOUND` elevator-door decision conflicts with a retained `elevator-door.wav` record. It remains
  temporarily because removing it without retiring its procedural fallback would reintroduce a player-facing tone.
  Do not claim this audit is complete until that one runtime/asset reconciliation is checked against package contents.

## Fonts and visual assets

| Category | Audit result |
| --- | --- |
| Fonts | No font files or web-font downloads are bundled. CSS uses system/browser font stacks (`Segoe UI`, Tahoma, Geneva, Verdana, sans-serif, and monospace). |
| Visual assets | No third-party image, sprite, or icon files are bundled. Game visuals are first-party HTML/CSS/emoji/system glyphs. Generated screenshots and the social-preview PNG are first-party captures of the game. |

## Licence-selection constraints

Bundled-code licensing is complete. Audio provenance reconciliation remains a release gate described above.
GPL-3.0-only applies to first-party project code only; ship this notice, `THIRD_PARTY_LICENSES.md`, and the audio
attribution record in the itch.io ZIP without claiming rights over third-party audio.
