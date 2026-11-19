# Tidebound — Full Codebase Bug & Error Audit Report

**Repository:** `game-main` (`com.xeno2426.game`)  
**Tech Stack:** TypeScript, Three.js, Vite, Vitest, Capacitor (Android)  
**Audit Scope:** `src/`, `tests/`, `android/`, `public/`, and root configuration files  

---

## Executive Summary

| Severity | Count | Summary |
| :--- | :---: | :--- |
| **Critical (Showstoppers)** | 6 | Production bundle crashes (`vitest` imports), doubled ocean height, invisible mobile joystick, 60Hz mesh recreation, instant-kill hound lunge, backwards slingshot aim. |
| **High (Broken Features & Mobile UX)** | 8 | Save files never loaded, untappable quick-bar on Android, trapped in build mode, player slides off raft, un-lootable death crate & broken respawn vitals, discarded stamina/shelter flags, no building collision, modal touch leaks & uncraftable station recipes. |
| **Medium (Logic, Camera & Performance)** | 7 | First-person camera looks backwards, 60Hz quick-bar DOM thrashing, stack limit overflow, mouse-drag triggers attack, hound telegraph overwritten, tide panel loses touch-blocking class, per-frame GC allocations. |
| **Low (Android / Branding Leftovers)** | 3 | Android `strings.xml` still named `Cyber Siege`, leftover neon ship PNG icons, placeholder `README.md`. |

---

## 1. Critical Bugs (Showstoppers / Broken Core Gameplay)

### 1.1 Production Code Imports Directly from `tests/*.test.ts`
* **Files:**
  * `src/systems/VitalsSystem.ts:1`
  * `src/systems/CraftingSystem.ts:2`
  * `src/systems/BuildingSystem.ts:6`
  * `src/world/TideSystem.ts:4`
  * `src/core/SaveSystem.ts:1–3`
* **Root Cause:** Core simulation functions (`computeTideState`, `createInitialVitals`, `updateVitals`, `canCraft`, `craftItem`, `findBestSnapSocket`) are exported directly from `tests/*.test.ts`. Each test file executes `import { describe, it, expect } from 'vitest'` and registers `describe(...)` suites at module top level. Importing these in `src/` pulls `vitest` into the production Vite bundle and throws runtime errors in the browser and Android WebView.
* **Fix:** Extract all pure logic functions and TypeScript interfaces into dedicated modules under `src/logic/` (e.g., `src/logic/tideLogic.ts`, `src/logic/vitalsLogic.ts`, `src/logic/craftingLogic.ts`, `src/logic/buildingLogic.ts`) and import them from both `src/` and `tests/`.

### 1.2 Ocean Visual Height is Doubled (`2 × waterLevel`)
* **File:** `src/world/Water.ts:52, 103, 110`
* **Root Cause:** `Water.update()` sets `this.mesh.position.y = waterLevel` (translating the mesh via `modelMatrix`), **and** the vertex shader simultaneously sets `pos.y = uWaterLevel` in local space. At High Tide (`4.5m`), the ocean visually renders at **`9.0m`** while `Player`, `Raft`, and `Enemy` physics still evaluate against `4.5m`.
* **Fix:** Keep `this.mesh.position.y = 0` permanently and let the vertex shader apply `uWaterLevel` (or remove `pos.y = uWaterLevel` from the vertex shader so `modelMatrix` handles vertical translation alone).

### 1.3 Virtual Joystick Never Renders on Android
* **Files:** `src/main.ts:91`, `src/ui/TouchControls.ts:118`
* **Root Cause:** `main.ts` instantiates `new TouchControls(inputManager);` without storing a reference and never calls `touchControls.update()` in the game loop. Because `.virtual-joystick` defaults to `display: none`, the joystick knob never appears on screen when touching the left half.
* **Fix:** Store `const touchControls = new TouchControls(inputManager);` and call `touchControls.update()` inside the render callback in `main.ts`.

### 1.4 Player Weapon Mesh Destroyed & Recreated 60 Times per Second
* **Files:** `src/main.ts:267`, `src/entities/Player.ts:38–52`
* **Root Cause:** `main.ts` calls `player.equipItem(craftingSystem.getActiveItem())` every fixed tick (60Hz). `Player.equipItem()` does not check if the requested item is already equipped, so it detaches and re-instantiates a brand-new Three.js geometry/mesh group 60 times every second, causing severe memory churn and GC pauses on Android.
* **Fix:** Add an early return at the top of `Player.equipItem()`:
  ```ts
  if (itemId === this.currentEquippedItem && this.equippedMesh) return;
  ```

### 1.5 Feral Hound Lunge Deals Damage Every Frame (Instant-Kill)
* **File:** `src/entities/Enemy.ts:124–138`
* **Root Cause:** Inside `case 'lunge':`, `if (distToPlayer < 1.4) { onPlayerHit(ENEMY_CONSTANTS.HOUND_DAMAGE); }` has no per-lunge hit guard. During a 0.5s lunge at 60Hz, overlapping the player for even 0.2s deals `12 × 20 = 240` damage, killing the player instantly.
* **Fix:** Add `private hasHitThisLunge = false;`, reset it to `false` when transitioning into `'lunge'`, and set it to `true` immediately after `onPlayerHit()` triggers once.

### 1.6 Slingshot Free-Aim Fires 180° Backwards
* **Files:** `src/systems/CombatSystem.ts:80`, `src/entities/Player.ts:125`
* **Root Cause:** `Player.ts` computes character yaw using `Math.atan2(dx, dz)`, which means forward is `(+sin(rotationY), 0, +cos(rotationY))`. However, `CombatSystem.ts:80` constructs `pForward` as `(-Math.sin(player.rotationY), 0, -Math.cos(player.rotationY))`, firing directly behind the player when no auto-aim target is locked.
* **Fix:** Change `CombatSystem.ts:80` to:
  ```ts
  this._pForward.set(Math.sin(player.rotationY), 0, Math.cos(player.rotationY));
  ```

---

## 2. High-Priority Bugs (Broken Features & Mobile UX)

### 2.1 Saved Games Are Never Loaded on Startup
* **File:** `src/main.ts:31, 389–400`
* **Root Cause:** `SaveSystem.init()` is awaited and `SaveSystem.save()` runs every 20 seconds, but `SaveSystem.load()` is never called in `bootstrap()`. Player position, vitals, inventory, tide progress, and placed structures reset on every reload.
* **Fix:** Call `const saved = await SaveSystem.load();` after `SaveSystem.init()`, and pass the restored values into `Player`, `VitalsSystem`, `CraftingSystem`, `TideSystem`, and `BuildingSystem` (re-spawning meshes for `saved.structures`).

### 2.2 Quick-Bar Slots Cannot Be Tapped on Android
* **File:** `src/ui/HUD.ts:84–94`
* **Root Cause:** The 5 `.quick-slot` DOM elements have no `pointerdown` event listeners. Switching quick-slots only works via desktop keyboard `Digit1`–`Digit5` in `InputManager.ts`.
* **Fix:** Pass an `onSelectSlot: (index: number) => void` callback into `HUD` (or bind to `InputManager.state.activeQuickSlot`) and attach a `pointerdown` listener (with `e.stopPropagation()`) to each quick-slot element.

### 2.3 No Way to Exit Build Mode Once Entered
* **Files:** `src/ui/BuildMenuUI.ts:32–36`, `src/main.ts:346–353`
* **Root Cause:** Selecting any blueprint sets `buildingSystem.currentBlueprintId`, which hijacks the Attack button to call `buildingSystem.placeCurrent()`. Neither `BuildMenuUI` nor `TouchControls` provides a way to reset `currentBlueprintId = null`, locking the player out of combat permanently.
* **Fix:** Add a central "Cancel / Exit Build Mode" button inside the radial build menu (and/or clear `currentBlueprintId` when switching quick-slots or pressing `Escape`).

### 2.4 Boarding the Raft Does Not Carry the Player
* **Files:** `src/main.ts:311–316`, `src/entities/Raft.ts`
* **Root Cause:** `raft.isPlayerBoarded = distToRaft < 2.0` enables sail steering, but `player.position` is never moved by the raft's delta displacement or locked to the deck. As soon as the raft accelerates, it sails out from under the player, dropping them into the ocean.
* **Fix:** When `raft.isPlayerBoarded` is true (or toggled via an explicit "Board / Disembark" interact prompt), apply the raft's frame displacement `(dx, dz)` and deck surface height to `player.position`, and prevent normal walking/swimming physics from overriding it.

### 2.5 Death Drops an Un-Lootable Crate & Fails to Reset Vitals
* **File:** `src/main.ts:367–386`
* **Root Cause:**
  1. The spawned `salvage_crate` mesh is added to `scene`, but never registered with `InteractionSystem` and stores none of the dropped items.
  2. Respawning only resets `health = 100` and `isDead = false`. `hydration`, `hunger`, and `exposure` remain at critical levels (e.g., `0` or `100`), causing immediate health drain upon respawn.
* **Fix:** Store the dropped non-equipped items in a `ResourceNode` (or `DropPickup`) registered with `InteractionSystem`, and reset `hydration = 100`, `hunger = 100`, `exposure = 0`, and `stamina = 100` on respawn.

### 2.6 Discarded Stamina Cost & Missing Campfire/Roof Shelter Checks
* **File:** `src/main.ts:294, 304–308`
* **Root Cause:**
  1. `const { hasAttacked } = player.update(...)` ignores the returned `staminaCost`, so dodging never deducts stamina.
  2. `vitalsSystem.update(...)` never calculates or passes `isNearCampfire` or `isUnderRoof` from `buildingSystem.placedStructures`, so campfires and roofs never reduce Exposure.
* **Fix:** Deduct `staminaCost` (specifically dodge cost, avoiding double-deducting sprint drain which `updateVitals` already computes) and check proximity to placed `campfire` and `roof` structures each tick.

### 2.7 Placed Structures Have Zero Collision
* **Files:** `src/systems/BuildingSystem.ts`, `src/entities/Player.ts:146`
* **Root Cause:** `Player.update()` only clamps `position.y` against `terrain.getHeight(x, z)`. Players fall straight through elevated foundations/stilts and walk through walls.
* **Fix:** Maintain lightweight static AABBs for each `PlacedStructure` in `BuildingSystem`. Resolve player horizontal collision against wall/doorframe AABBs and compute `groundHeight = Math.max(terrainH, highestSupportingFloorY)` for foundations and stilts.

### 2.8 Inventory Modal Leaks Touch Input & Cannot Craft Station Recipes
* **File:** `src/ui/InventoryUI.ts:17, 106`
* **Root Cause:**
  1. `.modal-overlay` does not have the `.hud-interactive` class, so tapping the modal backdrop passes through `InputManager`'s `pointerdown` check and triggers joystick/camera movement behind the UI.
  2. `getAvailableRecipes('none')` is hardcoded, meaning `campfire` recipes (like `Cook Meat`) and future `workbench` recipes can never be crafted.
* **Fix:** Add `hud-interactive` to `.modal-overlay` (and stop propagation on overlay `pointerdown`), and pass the nearest active station (`'campfire' | 'workbench' | 'none'`) when opening `InventoryUI`.

---

## 3. Medium Bugs & Performance Issues

### 3.1 First-Person Camera Looks Backwards & Third-Person Offset is World-Space
* **File:** `src/core/CameraController.ts:47, 50, 76`
* **Details:** `thirdPersonOffset` (`0.7, 1.6, 0`) is added in world-space X rather than rotated by `yaw` (and then `shoulderRightX/Z` adds a second right-shoulder offset). In first-person (`dist = 0.05`), placing the camera at `currentTarget + sphericalOffset` and calling `lookAt(currentTarget)` points the camera backward through the player's head.
* **Fix:** Remove the X component from `thirdPersonOffset` (keep `(0, 1.6, 0)`), and in first-person mode position the camera at `currentTarget` and look *outward* along `(-sinYaw * cosPitch, -sinPitch, -cosYaw * cosPitch)`.

### 3.2 Quick-Bar DOM Thrashing at 60Hz
* **Files:** `src/main.ts:266`, `src/systems/CraftingSystem.ts:86–91`
* **Details:** `main.ts` calls `craftingSystem.setActiveQuickSlot(inputManager.state.activeQuickSlot)` every tick, which unconditionally calls `this.updateHUD()` and rewrites `innerHTML` for all 5 quick-bar slots 60 times/sec.
* **Fix:** Add `if (this.activeQuickSlot === index) return;` at the start of `setActiveQuickSlot()`.

### 3.3 `CraftingSystem.addItem()` Ignores `maxStack` on Empty Slots
* **File:** `src/systems/CraftingSystem.ts:57–64`
* **Details:** When placing remaining items into an empty slot, `slot.count = count` is assigned directly without clamping to `maxStack` or spilling overflow into additional empty slots.
* **Fix:** Loop through empty slots while `count > 0`, assigning `Math.min(maxStack, count)` per slot.

### 3.4 Desktop Mouse Drag Triggers Attack & Held Keys Rapid-Toggle Menus
* **File:** `src/core/InputManager.ts:151–169, 182–189`
* **Details:**
  * Left-clicking anywhere on the canvas to drag the camera or test the joystick fires `mousedown` and sets `isAttackPressed = true`.
  * `keydown` does not check `if (e.repeat) return;`, so holding `B`, `I`, `F`, or `R` toggles menus/camera repeatedly on key repeat.
* **Fix:** Guard toggle keys with `if (e.repeat) return;` and separate camera drag (e.g. right-click or pointer lock on desktop) from left-click attack, or ignore `mousedown` when touch pointer events are active.

### 3.5 Feral Hound Telegraph Jump Overwritten on Same Frame
* **File:** `src/entities/Enemy.ts:72, 115`
* **Details:** Inside `updateHound()`, `this.object.position.y = this.position.y + 0.15` is set during `'telegraph'`, but line 72 immediately executes `this.object.position.copy(this.position)`, wiping out the vertical offset before rendering.
* **Fix:** Apply the telegraph visual Y offset *after* `this.object.position.copy(this.position)` (or animate a child body mesh instead of the root group).

### 3.6 `HUD.updateTide()` Strips `.hud-interactive` Class
* **File:** `src/ui/HUD.ts:110–116`
* **Details:** `this.tidePanel.className = 'ui-panel tide-panel'` overwrites the initial `hud-interactive` class, allowing taps on the tide panel to fall through to camera drag.
* **Fix:** Use `this.tidePanel.classList.toggle('warning', phase === 'warning');` instead of overwriting `className`.

### 3.7 Per-Frame Garbage Collection Allocations (Violates `AGENTS.md` Rule 1)
* **Files:**
  * `src/core/GameLoop.ts:33, 45, 67` — `requestAnimationFrame(this.tick.bind(this))` creates a new bound function closure every frame.
  * `src/entities/Enemy.ts:83, 159` — allocates `new THREE.Vector3()` every tick.
  * `src/systems/CombatSystem.ts:23, 63, 80, 83` — allocates multiple `new THREE.Vector3()` instances per frame/attack.
  * `src/entities/Raft.ts:30` — allocates a new `const h: number[] = []` array every tick.
* **Fix:** Bind `this.boundTick = this.tick.bind(this)` once in `GameLoop`'s constructor, and reuse pre-allocated scratch `THREE.Vector3` and `Float32Array(4)` fields on `Enemy`, `CombatSystem`, and `Raft`.

---

## 4. Low-Priority / Android Packaging & Branding Leftovers

1. **Android App Name Mismatch (`android/app/src/main/res/values/strings.xml:3–4`):** `app_name` and `title_activity_main` are still set to `Cyber Siege` instead of `Tidebound`.
2. **Mismatched PNG PWA Icons (`public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/maskable-icon-512x512.png`, `public/apple-touch-icon.png`, `scripts/generate-icons.js`):** These files still depict a neon cyan/magenta sci-fi ship from a previous project, while `public/pwa-icon.svg` and `public/maskable-icon.svg` show the Tidebound island icon. Also `android/app/src/main/res/mipmap-*/` and `splash.png` still use default Capacitor assets.
3. **Placeholder README (`README.md`):** Currently only contains `# strawberry`.

---

## 5. Recommended Fix Checklist

- [ ] Move pure simulation functions out of `tests/*.test.ts` into `src/logic/`
- [ ] Fix double `waterLevel` offset in `src/world/Water.ts`
- [ ] Wire `touchControls.update()` into `src/main.ts` render loop
- [ ] Add early-exit guards to `Player.equipItem()` and `CraftingSystem.setActiveQuickSlot()`
- [ ] Add `hasHitThisLunge` guard and fix telegraph Y-offset in `src/entities/Enemy.ts`
- [ ] Fix inverted `pForward` vector in `src/systems/CombatSystem.ts`
- [ ] Restore saved state via `SaveSystem.load()` on startup in `src/main.ts`
- [ ] Add tap listeners to quick-bar slots in `src/ui/HUD.ts`
- [ ] Add "Exit Build Mode" control to `src/ui/BuildMenuUI.ts`
- [ ] Sync player transform with `Raft` when boarded
- [ ] Make death salvage crate lootable and reset all vitals on respawn
- [ ] Deduct dodge stamina and wire campfire/roof proximity into `VitalsSystem`
- [ ] Add AABB collision & elevated floor clamping for placed structures
- [ ] Add `.hud-interactive` to `InventoryUI` overlay and detect nearby crafting stations
- [ ] Fix first-person camera look direction & third-person offset in `CameraController.ts`
- [ ] Eliminate per-frame allocations (`bind`, `new Vector3`, `[]`) in hot loops
- [ ] Update `android/app/src/main/res/values/strings.xml` from `Cyber Siege` to `Tidebound`