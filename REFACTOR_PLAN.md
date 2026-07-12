# Lift Operator Refactoring Roadmap

This document outlines the transition of the Lift Operator codebase from a legacy global-state architecture to a modular, UI-agnostic engine.

## ✅ Completed Phases

### Phase 1-3: Core Decoupling
- Separated `Config` from `Registry`.
- Namespaced core systems under `window.Game` (`Engine`, `UI`, `Storage`, `Seed`).
- Moved modal triggering logic out of `engine.js` into the `UI` layer.

### Phase 4: Reduce Dynamic DOM/CSS Generation
- Removed massive `innerHTML` strings in favor of `createElement` and `replaceChildren`.
- Implemented CSS variables (`--lift-pos`) to reduce reflows during the physics loop.

### Phase 5: Extract Helpers and Cleanup Logic
- Created `utils.js` for shared logic.
- Consolidated random number generation into `window.getRandomInt` and `window.getRandomFloor`.

### Phase 6: Standardize Names, Constants, and Storage
- Unified `localStorage` keys with the `window.Game.Keys` registry (v2 prefixes).
- Introduced `window.Game.Constants.GuestStatus` for reliable state tracking.
- Successfully audited and migrated persistence in `ui-overlay.js`, `workshop.js`, and `achievements.js`.

### Phase 7: UI Componentization
- Split the massive `ui-overlay.js` into functional modules: `ui-core`, `ui-shop`, `ui-briefing`, `ui-leaderboard`, `ui-manifest`, `ui-debug`, and `ui-workshop`.
- Refactored `ui-overlay.js` into a thin "Interface Registry" and Event Hub.
- Updated load order in `index.html`.

### Phase 8: Automation Engine Decoupling
- Created `automation-vm.js` to handle script execution and sandboxing.
- Implemented `Building` bridge API to restrict Registry access.
- Standardize script metadata and caching in the VM.
- Updated `workshop.js` to interface with `AutomationVM`.
- Updated `engine-physics.js` to delegate execution to the VM.

### Phase 9: Validation, Performance, and Polish
- **Memory Audit:** Implemented event delegation for lift shafts to prevent leaks.
- **Loop Optimization:** Moved rendering updates to `requestAnimationFrame` for 60fps smoothing.
- **Error Boundaries:** Added `try/catch` wrappers for game loops and automation scripts.
- **Telemetry System:** Introduced a real-time `System Console` in the debug menu for script debugging.

## 🚀 Future Roadmap

## Phase 10: Immersion & UX Polish
- **Audio System:** Implement `engine-audio.js` for spatial sound effects (lift hum, door dings, anger alerts).
- **Visual Feedback:** Add CSS transitions for floor switches and modal fades.
- **Advanced Automation:** Expand Blockly bridge with `memory` storage and `loop` blocks.
- **Save Profiles:** Support multiple local pilot profiles with distinct career progress.

