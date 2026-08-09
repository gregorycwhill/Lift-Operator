# Lift Operator

**Keep the hotel moving: route a growing elevator fleet, automate the pressure and solve each chaotic shift.**

Lift Operator is an elevator management game about dispatching a growing hotel fleet, learning automation and solving increasingly chaotic shifts.

## [▶ Play Now — GitHub Pages](https://gregorycwhill.github.io/Lift-Operator/)

**Status:** RC1.0 desktop playtest · 25-round campaign · supported on current Chrome or Edge on a desktop/laptop.
Firefox is not currently a supported browser.

| First dispatch | Supply Closet |
| --- | --- |
| ![First dispatch: guests and a manually controlled lift](assets/media/campaign-basic-dispatch.png) | ![Supply Closet: round briefing and power-up choices](assets/media/campaign-supply-closet.png) |
| Read the building, dispatch the first car, and keep guests calm. | Choose a loadout that matches the next round’s challenge. |

| Automation Workshop | Zoned fleet |
| --- | --- |
| ![Automation Workshop: Blockly policy editor](assets/media/campaign-workshop.png) | ![Zoned fleet: wide building with visible service zones](assets/media/campaign-zoning-fleet.png) |
| Turn operational ideas into lift policies with Blockly. | Assign a growing fleet to overlapping service zones. |

| Counterweight puzzle | Capsule dispatch at scale |
| --- | --- |
| ![Counterweight round: paired lift cars and pulley loops](assets/media/campaign-counterweights-live.png) | ![Capsule dispatch: wide dashboard and high-speed tubes](assets/media/campaign-capsule-operations.png) |
| Paired cars move in opposition; Open Plan becomes a lifeline. | Twenty single-passenger capsules reward smart automation over frantic clicking. |

## What’s in the campaign

- Fast, readable lift dispatch that grows into fleet-management puzzles.
- Built-in and Workshop-authored automations, including Service Zoning.
- Power-ups, VIP journeys, Checkout demand, Rooftop Parties, counterweights, and capsule tubes.
- Persistent Credits, deterministic seeds, and local pre-round campaign resume for repeatable problem-solving.
- Welcome, How to Play, Credits & Licences, menu/Rooftop music and SFX controls, and an in-game feedback action that pre-fills the form with game details and copies them locally.

## Help improve it

- Use **Give Feedback** in Settings or Round Review. It opens the feedback form with a compact diagnostic pre-filled
  and also copies that string to your clipboard. Opening the feedback form sends these technical details to Google to
  pre-fill the form: round, seed, browser and viewport. No feedback response is submitted unless you press **Submit**.
- Feedback is collected through the configured Google Form for player, technical, balance, and accessibility reports.
  The form is shared by link and does not collect email addresses.
  The form is opened only by your action and the game never submits a response automatically.
- **Settings → Clear local data…** removes this browser's campaign, local leaderboard, custom automations, and audio
  settings after a confirmation. It does not send or affect anyone else's data.
- See the concise [RC1 Playtest Pack](docs/playtest/RC1_PLAYTEST_PACK.md) for current priorities and a report template.

## Contributors and project documentation

Lift Operator is a hobby project designed to help children move from Scratch into purposeful programming. The current
release work is correctness, performance, balance, usability, and device acceptance—not feature expansion. Start with
[DOCUMENTATION.md](DOCUMENTATION.md) for document roles, then see [LICENSE](LICENSE) and
[NOTICE.md](NOTICE.md), and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) before redistributing a build.

| Need | Document |
| --- | --- |
| Product direction and sequence | [ROADMAP.md](ROADMAP.md) |
| Current implementation/release scope | [DELIVERY_PLAN.md](DELIVERY_PLAN.md) |
| Current evidence and release gates | [TEST_PLAN.md](TEST_PLAN.md) |
| Durable product rules | [GDD](Lift-Operator_GDD.md), [Game Play Map](Game%20Play%20Map.md), [Game Economy](Game%20Economy.md) |
| Workshop and Automation Dock contract | [Automation Workshop specification](Automation_Workshop_Spec.md) |
| Current playtest intake | [Feedback log](docs/playtest/PLAYTEST_FEEDBACK_LOG.md) |
| Material chat decisions | [Chat decision log](docs/CHAT_DECISION_LOG.md) |
| Audio source and credit record | [Audio attribution](assets/audio/ATTRIBUTION.md) |
| Canonical release screenshots | [Release media manifest](assets/media/README.md) |

## Local development

Requirements: Node.js 24 or a current supported LTS release, npm, and Playwright Chromium (install once with
`npx.cmd playwright install chromium`).

```powershell
npm.cmd install
npm.cmd run serve
```

Open `http://127.0.0.1:5500/` for local play. Use `npm.cmd run test:smoke` for a fast gate and
`npm.cmd run test:full` for the supported comprehensive suite.

After changing `design/game-balance.v1.json`, run:

```powershell
npm.cmd run balance:generate
npm.cmd run balance:check
```

Create diagnostic screenshots and a social-preview image with `npm.cmd run capture:media`; curated README screenshots
are governed by the [release media manifest](assets/media/README.md). Create a local itch.io-compatible ZIP from the
current commit with `npm.cmd run package:itch`.

## Security philosophy

The source is intentionally inspectable. Lift Operator protects the experience from accidents, not from curious
players: malformed payloads and broken scripts fail safely, while Workshop scripts run through bounded containment.
Strong authentication, anti-cheat, and adversarial source protection are not product goals.
