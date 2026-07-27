# Current Test Plan — Service Zoning and Playtest Evidence

**Status:** Active acceptance plan for the `0.3.0-network-campaign-preview` playtest release  
**Owner class:** Engineering and playtest  
**Last reviewed:** 26 July 2026
**Testing principles:** `TESTING_STRATEGY.md`
**Product scope:** `ROADMAP.md` and the product design documents

## Next-release gate — `0.3.0-network-campaign-preview`

The release is green only when the following evidence is complete:

- All existing validation and regression gates remain green.
- Service Zoning is tested through every production decision path and cannot be bypassed by manual or custom
  automation actions.
- R14–R20 initialize, reset, retry, simulate, render, and review deterministically at their target scales.
- Workshop, refusal explanations, large-fleet layouts, and responsive viewport checks pass.
- Zoning metrics and configuration are present in deterministic reports/replays.
- R9/R13 human playtest evidence is captured, with accepted issues explicitly recorded.
- The Endless Operations alpha produces only valid, reproducible, pre-checked operations and is clearly isolated from
  the normal campaign.
- A pushed release commit, generated artifacts, documentation snapshot, seed pack, and test report are available.

## Latest playtest remediation acceptance

- [ ] R19 and R20 fit the supported desktop viewport with eight lifts visible and readable.
- [ ] The countdown skip control is icon-only, keyboard/touch accessible, and starts only from the countdown control.
- [ ] Rounds 1 and 2 hide the Supply Closet and do not prompt about spending credits, including in Debug mode; eligible later rounds retain the prompt.
- [ ] Workshop pauses both active gameplay and pre-round countdowns, including scheduled events and power-up timing.
- [ ] Rooftop start/end toasts appear, disco lighting is visible, and reset/retry cannot leave rooftop music playing.
- [ ] VIP arrival begins from G after a seeded delay, visits a seeded random non-G floor after her room, and exits via G.
- [ ] A VIP rage-quit on any of the three legs costs exactly 10 lives and ends the event.

## Latest playtest remediation acceptance — 15-item traceability

- [ ] **1 — Top-floor icons:** active icons remain above every top-floor car and do not change car dimensions, target
  position, hit testing, or scroll geometry.
- [ ] **2 — Duplicate effects:** every timed effect rejects a duplicate on the same lift/global scope without consuming
  inventory, resetting timers, or playing activation audio.
- [x] **3 — Room Service teaching:** Round 3 already explains that carts carry heavier deliveries and need extra lift
  capacity; no implementation change is required.
- [ ] **4 — Suitcase contrast:** checkout guests heading to G display an accessible, legible suitcase treatment.
- [ ] **5 — Countdown:** only clicking the small top-right `×` skips countdown; keyboard/touch activation remains available.
- [x] **6 — Rooftop audio:** reset, retry, and round initialization leave no rooftop source playing from the previous round.
- [ ] **7 — Rooftop beams:** party mode shows subtle board-wide rainbow beams and honours reduced-motion preferences.
- [x] **8 — VIP timing:** a seeded VIP has three legs and each inter-leg delay is between 10 and 30 seconds; pause/resume
  preserves the delay.
- [x] **9 — Guest classification:** no spawned guest has both `isCheckout` and `isGymBro`; Gym Bro stink immunity remains.
- [ ] **10 — Fart cap:** stink playback stops at two seconds while gameplay stink duration is unchanged.
- [ ] **11 — Zoning briefing:** Round 14 introduces zoning, names the Dock/Workshop path, and remains accurate as floors
  scale.
- [ ] **12 — Cable alignment:** compact R19/R20 cables are centred over their cars.
- [ ] **13 — Capacity labels:** compact fleets use readable non-overlapping `Cap N` labels with correct accessible text.
- [ ] **14 — VIP queueing:** VIP does not jump the queue; when first, she prevents preemption for an empty suitable lift,
  but ordinary guests may use an occupied unsuitable lift while she remains at the front.
- [ ] **15 — Board stability:** rooftop effects do not create/remove scrollbars or cause vertical/horizontal board jitter.

## Permanent Automation Dock acceptance

### Shared catalog and assignment contract

- [ ] Under identical progression/player/share state, the shared catalog returns the legal policy set and labels for
  Manual, built-ins, custom scripts, shared scripts, and resolved zone bands.
- [ ] Locked policies, another player's private scripts, deleted scripts, malformed identifiers, and stale selections
  cannot be assigned through either variant.
- [ ] Assignment service validates every requested lift index and makes no change for an empty/invalid request.
- [ ] Batch assignment invokes the existing engine API in stable lift-index order and produces the canonical lift state
  for each selected lift.
- [ ] Manual, unzoned, and zoned policies preserve their current service-policy reset/application semantics.

### Dock interaction

- [ ] Disarmed lift clicks select/deselect a batch without changing lift automation.
- [ ] Carousel arrows change only the preview; they never arm, assign, or start lift flashing.
- [ ] Clicking a preview card arms it; clicking the already armed card disarms it.
- [ ] Armed policy-first assignment applies immediately to each clicked lift and keeps the policy armed.
- [ ] The armed-lift hint flashes for five seconds, then stops without disarming the policy.
- [ ] Lift-first batch selection persists while browsing; clicking a policy assigns it to every selected lift, clears the
  batch, and leaves the policy armed.
- [ ] Disarming preserves a pending batch selection.
- [ ] No Apply control remains, and no legacy Apply/Clear-specific state or guidance is exposed.
- [x] The compact carousel removes the native policy scrollbar, preserves the automation-row height, and flashes lift
  targets after a policy is armed.
- [ ] Invalid or unavailable armed assignments leave lift automation unchanged and give accessible feedback.
- [ ] Lift status accurately updates after Dock assignment, manual assignment, reset, retry, round
  initialization, and imported/deleted-script recovery.
- [ ] The carousel shows persistent player pins, with Manual and currently unlocked built-ins pinned by default, and
  changes correctly as progression unlocks new built-ins.

### Library and discovery

- [x] The Library toggles from its Dock button, uses Built-in, Custom, and Shared with Me accordion groups, persists
  pin checkbox changes, and closes when another modal opens.
- [x] Dock carousel arrows use clean, wide click targets; the automation label is compact and does not expose the word
  “Armed”. The Library dock button toggles the panel, and the panel uses an icon-only close control.
- [ ] The Library supports search across the complete currently legal catalog and remains keyboard/touch operable.
- [ ] Selecting an entry closes the overlay, arms the policy, and assigns any pending batch immediately.
- [ ] Long custom/shared names, authors, zone labels, empty groups, and a collection larger than the pinned strip remain
  readable and operable.
- [ ] First-use teaching cues work through the Dock, acknowledge on user interaction, and do not leak to removed
  selector controls.

### Controller lifecycle and regression

- [x] The production controller is the Automation Dock; no Debug controller selector or legacy selector is exposed.
- [ ] Mounting, reset/retry, countdown, and mid-round refresh preserve round state, lift policies, timers, audio, and
  Dock selections without duplicate listeners or stale overlays.
- [ ] Floor targeting, power-up targeting, Workshop pause, modal toggles, and lift status rendering remain independent of
  the active controller.
- [ ] Render checks cover one, two, five, and eight lifts at supported desktop widths; the compact R19/R20 layout must
  remain fully visible.

### Human comparison protocol

- [ ] On the same seed/loadout/round, a playtester can arm a policy, assign it to one lift, and assign it to multiple
  lifts confidently without looking for an Apply step.
- [ ] Record accidental assignments, missed armed/disarmed cues, library-discovery failures, policy-label confusion, and
  stale-UI issues in `docs/archive/PLAYTEST_ARCHIVE.md`.
- [ ] Confirm the permanent Dock remains comprehensible for both early rounds and R19/R20 fleets.

## Current evidence state

The Automation Dock is the permanent production controller. Automated acceptance is green; human usability, responsive
visual inspection, and full-device playtesting remain open.

## Latest remediation test evidence

- `npm run test:syntax`: passed, 61 JavaScript files.
- `npm run docs:check`: passed, 22 Markdown files.
- Lifecycle suite: passed, 84/84.
- Browser suite excluding the known long Protocol Alpha case: passed, 112/112.
- Aggregate `npm test`: all pre-browser gates, Protocol Alpha, mechanics, integration, and the browser cases reached
  before the wrapper limit passed; the command timed out at 10 minutes because Protocol Alpha alone takes about eight
  minutes and the aggregate suite continued beyond the wrapper limit. This is an execution-time limitation, not an
  observed test failure.
- Remaining evidence is human: visual confirmation of top-floor icons/cables/capacity labels, rooftop beam subtlety and
  board stability, countdown affordance, suitcase contrast, audio duration feel, and VIP queueing under live traffic.

**Implementation baseline:** `dc1d6e9` — `Promote Automation Dock to production` (26 July 2026).
**Latest component automated gate:** lifecycle 79/79, audio 23/23, mechanics 11/11, integration 3/3, unit, syntax,
documentation, config, balance, economy, report, and UTF-8 checks all passed. The browser remainder passed 107/107;
the long Protocol Alpha browser test also passed during the aggregate run before the environment's 10-minute wrapper
limit interrupted the already-running aggregate command.
**Release state:** Playtest-ready, not promoted. The remaining gate is human/device acceptance and evidence-led tuning,
not a claim that every release criterion below has passed.

Automated implementation evidence exists for the zoning foundation, diagnostics, Endless debug entry, economy/audio
follow-up, and regression coverage. The unchecked items below are the remaining release-acceptance evidence or areas
that need an explicit evidence record before promotion.

## Implemented coverage — automation-native Service Zoning

The following matrix records the production coverage expected of the implemented zoning slice. Remaining unchecked
items are release-acceptance evidence rather than a statement that the feature is still unplanned.

### Policy and Blockly

- [ ] Service Zone block supports Low, High, and Custom modes and serializes with the saved Blockly policy.
- [ ] Low and High resolve to the correct midpoint-overlap bands on 20-, 25-, and 30-floor buildings.
- [ ] Custom ranges reject blank, reversed, fractional, negative, and out-of-bounds values.
- [ ] Save, copy, import, and blueprint sharing preserve zone metadata; older scripts migrate as unzoned.

### Assignment and runtime behaviour

- [ ] Assigning a Zoned policy applies its resolved band to the selected lift; assigning Manual or an unzoned policy
  restores full-building service.
- [ ] Manual override can move outside the band temporarily, refuses incompatible boarding, and returns to the Zoned
  routine after the override completes.
- [ ] Existing passengers complete their current destinations when a new zone is assigned.
- [ ] The existing direct-service rule remains authoritative across live boarding, built-in/custom automation,
  simulation, manual targeting, refusal messaging, and Review diagnostics.

### Product flow and observability

- [ ] Round 14 unlocks the Zoned Low and Zoned High built-ins while leaving all existing built-ins available.
- [ ] The Workshop has no lift-selector zoning workflow; the parameter panel edits only the selected Service Zone block.
- [ ] In-game automation menus display policy name and resolved zone clearly.
- [ ] Welcome copy explains zoning as optional, warns that transfers are unavailable, and encourages Workshop adaptation.
- [ ] Telemetry and replay identity include policy ID/revision, resolved zone, and resulting coverage.

Run before merging a material change:

```powershell
npm.cmd test
```

Use focused checks while developing:

```powershell
npm.cmd run test:syntax
npm.cmd run test:config
npm.cmd run test:smoke
npx.cmd playwright test tests/lifecycle-correctness.spec.js
npx.cmd playwright test tests/audio.spec.js
```

## Current evidence matrix

### A. Direct-service zoning correctness still requiring explicit acceptance evidence

- [ ] Unit-test range normalization, inclusive endpoints, G inclusion, invalid input, and overlap detection.
- [ ] Test the same `canLiftDirectlyServe` result through live boarding, simulation, built-in automation, custom
  automation, and manual targeting.
- [ ] Test that an uncovered direct route remains visible, is refused with a plain reason, and never creates a transfer.
- [ ] Test zoning alongside capacity, direction, VIP, Rooftop, Gym Bro, jam, stink, patience, Turbo, and Double-Decker.
- [ ] Test reset/retry/warp/import persistence and prevention of manual or automation bypass.

### B. Workshop and responsive UI still requiring acceptance evidence

- [ ] Browser-test Workshop edits, coverage preview, invalid-range feedback, overlap warnings, and saved configuration.
- [ ] Render 20/25/30 floors with 5–10 lifts at desktop, tablet, mobile, and large-fleet horizontal-scroll layouts.
- [ ] Verify zone labels, selected shafts, sticky floor references, and refusal text remain readable without unbounded DOM
  growth.

### C. Simulation, telemetry, and tuning safeguards still requiring acceptance evidence

- [ ] Record deterministic zone-refusal, uncovered-route, overlap-utilization, empty-travel, and restrictive-idle
  metrics in compact reports/replays.
- [ ] Verify zoning configuration is included in replay identity and does not break seeded reproducibility.
- [ ] Compare declared manual/hybrid, built-in-plus-loadout, and custom Workshop profiles before any R14–R20 traffic
  tuning.
- [ ] Change one canonical balance parameter family at a time; regenerate and validate generated balance artifacts.

### D. Human playtest acceptance

- [ ] R9 rooftop release: readable buildup, substantial but manageable return wave, no deadlock or invalid destination.
- [ ] R13: intended mechanics, deodoriser, and rockets are affordable; pressure is manageable; stink remains optional
  emergency discretion.
- [ ] Confirm Round 13’s revised 25% spawn-pressure reduction remains challenging but practical.
- [ ] R14: players can configure a workable first zoning scheme and explain a direct-service refusal.
- [ ] R15–R20: record at least one reproducible failure diagnosis per structural combination before tuning spawn rates.
- [ ] Record browser/device, seed, balance version, loadout, zone configuration, outcome, and player explanation.

### E. Audio follow-up on real devices

- [ ] Test first-gesture unlock, suspended/resumed context, and no-console-error fallback on an audio-capable Chromium
  device and Safari/iOS device.
- [ ] Verify authoritative menu, Dream Raid, Orbital Colossus, Jazz Chromatic, power-up, guest-served, defenestration,
  and shop-selection mappings; confirm elevator-door and guest-distress sounds remain silent.
- [ ] Verify independent music/SFX controls, menu track resume-from-position, modal exclusivity/toggle behaviour, and no
  audible source overlap through victory, retry, teardown, and mobile modal flows.
- [ ] Time every canonical power-up in gameplay; confirm one-shot SFX stop at five seconds while Musak lasts for its full
  effect duration and active icons remain attached to the lift.

### Economy and interaction follow-up

- [ ] Confirm Credits earned in one successful round are visible and spendable in the next.
- [ ] Confirm the no-purchase confirmation appears only when Credits remain and can be cancelled without starting play.
- [ ] Confirm the countdown `Start now` control works only from the timer area and starts the round exactly once.
- [ ] Verify Gym Bros board compatible stinky lifts and remain unaffected by stink acceleration/evacuation.
- [ ] Verify “Finish Campaign” appears only after the final configured authored round.

### F. Endless Operations alpha

- [ ] Generator output is deterministic for seed, template, and balance version.
- [ ] Invalid, infeasible, or out-of-envelope operations are rejected before presentation.
- [ ] Generated operations retain an objective, intended bottleneck, difficulty envelope, and supported strategy
  profile.
- [ ] Generated operations replay identically and include their generation inputs in the report identity.
- [ ] At least one pre-checked generated challenge is playable through the debug/test entry point without affecting
  normal campaign progression.

## Completion record

### Automated implementation checkpoint — 23 July 2026

- Full `npm.cmd test` passed: 93 Playwright tests, including Service Zoning diagnostics and Endless alpha entry.
- Syntax, documentation, config, balance freshness, economy, balance-report, UTF-8, unit, mechanics, and integration
  gates passed.
- The new automated coverage proves deterministic zone reports, overlap/direct-route gaps, and a pre-checked seeded
  Endless operation can enter a playable round in Debug mode.
- Human/device items below remain open; this is a playtest handoff, not a release-promotion sign-off.

When a delivery slice completes, replace its checklist with a short dated completion note: commit, command results,
playtest evidence, accepted decisions, and remaining follow-up. Detailed historical checklists belong in Git history and
historical handoff documents, not this active plan.

### Automated implementation checkpoint — 25 July 2026

- Syntax, config, documentation, and focused mechanics gates passed after the audio/playtest remediation.
- Deterministic balance matrix, early comparator evidence, and campaign envelope were regenerated for balance version
  `0.2.7-audio-playtest-remediation`.
- Remaining items are intentionally human/device checks: audible asset identity and durations, modal audio restart,
  top-floor rocket icon duplication, Round 9/13 balance feel, R19/R20 viewport framing, and targeted TARDIS/rooftop
  state observations.

### Automated implementation checkpoint — 25 July 2026 — economy/audio continuity follow-up

- Focused regression coverage passed for Credit carry-forward/confirmation, countdown skip, modal toggling, and menu
  music position state.
- Canonical balance artifacts are regenerated after the Round 13 25% spawn-pressure adjustment.
- Human/device checks remain open for perceived audio timing, Gym Bro boarding in live play, pressure-track continuity,
  and rocket placement at multiple floors.
