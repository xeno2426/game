# Development Checklist and Upgrade Backlog

## Phase 1: Core Controller, Starter Island and Water
- [x] Setup Vitest test runner and validation tests (no emojis, no inline hex colours)
- [x] Define 30 palette tokens and build runtime 256x256 palette atlas canvas
- [x] Procedural starter island with terrain vertex colours by height and slope
- [x] Collision system against island heightfield and static AABBs (no external physics engine)
- [x] Shared CPU/GPU vertex-wave water with depth-based foam via baked heightmap
- [x] Third-person over-the-shoulder controller with first-person toggle for building
- [x] Floating dynamic virtual joystick with outer-rim sprint on left screen half
- [x] Right-half camera drag, context-sensitive interact, jump/dodge and attack buttons
- [x] 5-slot quick bar anchored at bottom centre
- [x] Procedural low-poly survivor character model with procedural movement animations
- [x] Phase 1 verification: npm run build, npm test, commit and push

## Phase 2: Dynamic Tide and Weather System
- [x] Scripted 15-minute tide cycle (10 min low tide, 1 min warning, 5 min high tide)
- [x] Smooth water level lerp (recedes/rises 4-5 metres)
- [x] Transition warning: audio cue (thunder and rising wind) and flashing Signal Crimson tide gauge
- [x] Monsoon weather: storm fog pulling far-clip plane in, Coastal Mist to Storm Slate sky lerp
- [x] Procedural rain particle system pooled during high tide
- [x] Fast-forward debug support (?debug&timescale=N)
- [x] Phase 2 verification: npm run build, npm test, commit and push

## Phase 3: Scavenging, Inventory, Crafting and Persistence
- [x] Resource nodes: Trees (wood, fronds, coconuts), Scrap Piles (metal, bolts), Barrels (plastic, rope), Sunken Electronics (copper, circuits, batteries)
- [x] Instanced scavenging and harvesting with hit feedback
- [x] Droppable loot pickups with subtle Salvage Gold rim highlight
- [x] 12-slot mobile inventory UI synchronized with 5-slot quick bar
- [x] Crafting system for essential tools and survival items
- [x] Asynchronous autosave and restore system via IndexedDB
- [x] Phase 3 verification: npm run build, npm test, commit and push

## Phase 4: Vitals, Survival Stations and Snap-Grid Building
- [x] 4-stat vital simulation (Health, Hydration, Hunger, Exposure) with GDD critical penalties
- [x] Survival stations: Campfire (warmth, cooking, exposure drop) and Rain Collector (fresh water)
- [x] Radial build menu for mobile touch selection
- [x] Modular snap-grid building system (Foundation, Stilts, Wall, Doorframe, Roof, Raft Base)
- [x] Sockets with magnetic snapping, 90-degree rotate, and translucent green/red ghost preview
- [x] Elevated stilt bases to survive high tide
- [x] Phase 4 verification: npm run build, npm test, commit and push

## Phase 5: Combat, Enemies, Raft, Audio and Polish
- [x] Soft lock-on melee combat within 2 metres
- [x] Ranged slingshot with auto-aim assist (crosshair turns red on enemy hitbox)
- [x] Feral Hound (Muddy Ochre) with 1-second telegraph animation before lunge
- [x] Tide Lurker (Kelp Dark with Bio Cyan eyes/fins) patrolling water and sunken scrap
- [x] Modular raft with buoyant barrels sampled from wave function and sail steering
- [x] Player death drops non-equipped items into floating salvage crate
- [x] Procedural Web Audio sound pass (waves, wind, rain, thunder, tools, alerts)
- [x] Mobile budgets enforcement (under 100 draw calls, under 150k triangles, 1 directional light, 1024 shadow map within 40m)
- [x] ?debug overlay displaying FPS, draw calls, triangles, and tide phase via renderer.info
- [x] Phase 5 verification: npm run build, npm test, commit and push

---

## Bug Fixes — Verified Bug List

### Group A: Critical (Showstoppers)
- [x] C1: Production code imports from tests/*.test.ts (move pure logic to src/logic/..., add lint test, verify grep -ri vitest dist)
- [x] C2: Ocean renders at double height (mesh.position.y = 0, shader applies uWaterLevel, verify getSurfaceHeight)
- [x] C3: Virtual joystick never renders (store touchControls and call update() every frame)
- [x] C4: Player.equipItem rebuilds weapon mesh every tick (early return if itemId === currentEquippedItem && equippedMesh)
- [x] C5: Feral hound lunge damages every tick (add per-lunge hasHitThisLunge flag)
- [x] C6: Slingshot free-aim fires backwards (shared forward-from-yaw helper for Player & CombatSystem, add test)
- [x] Group A verification: npx tsc --noEmit, npm run build, npm test, lessons.md, commit and push

### Group B: High Priority (Broken Features & Mobile UX)
- [ ] H1: SaveSystem.load() never called on startup (restore player pos, vitals, inventory, tide, structures; test round trip)
- [ ] H2: Quick-bar slots cannot be tapped (pointerdown with stopPropagation)
- [ ] H3: Build mode cannot be exited (radial cancel item, clear on quick-slot switch / Escape)
- [ ] H4: Raft does not carry player (explicit board/disembark, apply delta displacement & deck height, skip walk/swim)
- [ ] H5: Death: salvage crate holds items & interactive/persisted; respawn resets all vitals & stamina, clears velocity
- [ ] H6: Deduct dodge staminaCost only; wire campfire/roof radii from constants into vitalsSystem.update
- [ ] H7: Placed structures collision: static AABBs in BuildingSystem, resolve wall collision, groundHeight calculation in src/logic/buildingLogic.ts with tests
- [ ] H8: InventoryUI: .hud-interactive and stopPropagation on modal overlay; pass nearest station to getAvailableRecipes/craft
- [ ] Group B verification: npx tsc --noEmit, npm run build, npm test, lessons.md, commit and push

### Group C: Medium (Logic, Camera & Performance)
- [ ] M1: CameraController: remove world-space X from thirdPersonOffset, rotate shoulder by yaw, first-person look outward along (-sinYaw*cosPitch, -sinPitch, -cosYaw*cosPitch)
- [ ] M2: setActiveQuickSlot returns early if slot unchanged
- [ ] M3: addItem respects maxStack in empty slots and spills into further empty slots, with tests
- [ ] M4: InputManager: ignore e.repeat for toggle keys, desktop camera drag on right-click/pointer-lock, attack on left-click, ignore touch pointer mouse events
- [ ] M5: Hound telegraph Y offset applied after position copy / animate child mesh
- [ ] M6: HUD.updateTide uses classList.toggle('warning', ...) instead of overwriting className
- [ ] M7: Eliminate per-frame allocations: bind GameLoop tick once, scratch Vector3 in Enemy & CombatSystem, preallocated Float32Array(4) in Raft, search update paths
- [ ] Group C verification: npx tsc --noEmit, npm run build, npm test, lessons.md, commit and push

### Group D: Low Priority & Branding
- [ ] L1: Android strings.xml app_name and title_activity_main set to Tidebound
- [ ] L2: Regenerate PWA PNG icons from SVG using palette colours (no neon ship), update generate-icons.js, update Capacitor icons/splash
- [ ] L3: Replace placeholder README.md with real Tidebound README (no emojis)
- [ ] Group D verification: npx tsc --noEmit, npm run build, npm test, lessons.md, commit and push

### Group E: Verification & Final Report
- [ ] Run full build and tests
- [ ] Start npm run dev -- --host and curl it
- [ ] Run npm run preview and verify PWA manifest and icons served
- [ ] Regression checklist in tasks/todo.md
- [ ] Summary report table with bug id, file changed, test added, and any unfixed items

---

## Upgrade Backlog (GDD Mid-to-Late Game Features)
- [ ] 1. Workbench Tier 2: Advanced crafting bench enabling metal tools, high-tier armor, and electrical components
- [ ] 2. Machete: Fast high-damage melee weapon crafted with Gunmetal Grey steel and Aged Timber handle
- [ ] 3. Recurve Bow: Silent medium-range weapon utilizing crafted arrows with feathered palm fronds
- [ ] 4. Harpoon Gun: Heavy projectile launcher functional underwater for deep sea harvesting and hunting
- [ ] 5. Diving Gear: Oxygen tank and flippers extending underwater dive duration during low tide
- [ ] 6. Oil Rigs: Distant offshore industrial platforms housing elite electronics and hazardous exploration
- [ ] 7. Power and Turrets: Solar panels, wind turbines, proximity power radius, floodlights, and automated base defense turrets
- [ ] 8. Radio Tower Ending: Central archipelago broadcast tower restoration quest line for rescue boat escape
- [ ] 9. Endless Survival Mode: Post-ending continuous escalating storm and lurker survival mode
