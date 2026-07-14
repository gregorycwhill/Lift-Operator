# Technical Specification: Refactoring & Automation Workshop (Phase 2)

## 1. Project Refactoring (Decoupling)
To support offline Blockly integration, the single-file `index.html` will be separated into a standard web project structure. This bypasses local `file:///` CORS restrictions by using traditional `<script src>` tags instead of ES6 modules or fetch requests.

### 1.1 Directory Structure
* `/index.html` (DOM structure, Modals, Lib imports)
* `/style.css` (Game board styling, animations, hazard visuals)
* `/game.js` (Config, Registry, Game Tick, Animation Tick, UI Render)
* `/lib/blockly/` (Offline Google Blockly library)
    * `blockly_compressed.js`
    * `blocks_compressed.js`
    * `javascript_compressed.js`
    * `en.js`

## 2. Automation Workshop (UI/UX)
* **Trigger:** Clicking "Terminal" / "Automation Workshop" pauses the `gameTick` and `animationTick`.
* **Display:** A large, 90vw x 90vh floating CSS modal appears, overlaying the paused game board (providing visual context).
* **Features:**
    * Left Sidebar: "My Scripts" (Save, Load, Delete, Clone built-in).
    * Center: Blockly drag-and-drop workspace.
    * Right Sidebar: Scratch-style primitive toolbox.
* **Storage:** Scripts are serialized via `Blockly.serialization.workspaces.save(workspace)` and stored in browser `localStorage` as JSON arrays, allowing persistence across sessions.

## 3. The Programming Interface (Blockly Primitives)
The interface is strictly constrained to **Routing**. Players cannot control doors, force VIPs to ride with peasants, or override Fart quarantines. 

### 3.1 The Event Hat
* `[ ON ROUTE RECALCULATION ]`: The un-deletable root block. Fired in `animationTick` when a lift is idle or has completed a boarding/drop-off action.

### 3.2 Action Primitives
* `[ SET TARGET FLOOR TO (Number) ]` -> Translates to `lift.targetFloor = X;`
* `[ SET SWEEP DIRECTION (Up/Down) ]` -> Translates to `lift.sweepDirection = 1 / -1;`

### 3.3 State Sensors (Smart Blocks)
To abstract complex array filtering for younger players, custom Blockly definitions will expose "Smart Sensors".
* `[ MY CURRENT FLOOR ]` (Int)
* `[ MY PASSENGER COUNT ]` (Int)
* `[ IS LIFT EMPTY? ]` (Bool)
* `[ GUESTS WAITING ON FLOOR (N) ]` (Int)
* `[ PASSENGERS GOING TO FLOOR (N) ]` (Int)
* `[ NEAREST FLOOR WITH A (Happy/Annoyed/Critical) GUEST ]` (Int)
* `[ HIGHEST FLOOR REQUESTED BY PASSENGERS ]` (Int)

### 3.4 Logic & Control
Standard Blockly math, variables, and `IF/ELSE` loops will be provided.

## 4. Visual Debugging
Because traditional stepping debuggers are too complex, debugging will be entirely visual on the live board.
* **The Think Block:** `[ THINK (Variable/String) ]` 
    * Translates to updating a `lift.thoughtBubble` string.
    * The render loop will draw a small CSS speech bubble above the lift displaying this text, allowing players to visually `console.log()` their mathematical calculations in real-time.

## 5. Execution Engine Integration
1.  When the player saves a script, Blockly generates a native JS string (e.g., `let target = 0; if (myFloor > 5)...`).
2.  The script is wrapped in a `new Function('lift', 'registry', generatedString)` to securely scope it.
3.  During `animationTick`, if a lift's automation is set to a custom script, the function is called.
4.  **Resilient Blueprint Sharing:** Blueprints are shared via an XOR-encrypted URI scheme (Codec v2.0.1). This version includes regex-based character sanitization and manual padding repair to ensure compatibility across local `file:///` environments and different browser clipboard behaviors.
5.  **Fallback Safety:** If the generated script throws an error, loops infinitely (timeout catch), or fails to assign a valid `targetFloor`, the engine will catch it and default the lift to `targetFloor = 0` (Ground), preventing the main game thread from crashing.