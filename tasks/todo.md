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
- [x] H1: SaveSystem.load() never called on startup (restore player pos, vitals, inventory, tide, structures; test round trip)
- [x] H2: Quick-bar slots cannot be tapped (pointerdown with stopPropagation)
- [x] H3: Build mode cannot be exited (radial cancel item, clear on quick-slot switch / Escape)
- [x] H4: Raft does not carry player (explicit board/disembark, apply delta displacement & deck height, skip walk/swim)
- [x] H5: Death: salvage crate holds items & interactive/persisted; respawn resets all vitals & stamina, clears velocity
- [x] H6: Deduct dodge staminaCost only; wire campfire/roof radii from constants into vitalsSystem.update
- [x] H7: Placed structures collision: static AABBs in BuildingSystem, resolve wall collision, groundHeight calculation in src/logic/buildingLogic.ts with tests
- [x] H8: InventoryUI: .hud-interactive and stopPropagation on modal overlay; pass nearest station to getAvailableRecipes/craft
- [x] Group B verification: npx tsc --noEmit, npm run build, npm test, lessons.md, commit and push

### Group C: Medium (Logic, Camera & Performance)
- [x] M1: CameraController: remove world-space X from thirdPersonOffset, rotate shoulder by yaw, first-person look outward along (-sinYaw*cosPitch, -sinPitch, -cosYaw*cosPitch)
- [x] M2: setActiveQuickSlot returns early if slot unchanged
- [x] M3: addItem respects maxStack in empty slots and spills into further empty slots, with tests
- [x] M4: InputManager: ignore e.repeat for toggle keys, desktop camera drag on right-click/pointer-lock, attack on left-click, ignore touch pointer mouse events
- [x] M5: Hound telegraph Y offset applied after position copy / animate child mesh
- [x] M6: HUD.updateTide uses classList.toggle('warning', ...) instead of overwriting className
- [x] M7: Eliminate per-frame allocations: bind GameLoop tick once, scratch Vector3 in Enemy & CombatSystem, preallocated Float32Array(4) in Raft, search update paths
- [x] Group C verification: npx tsc --noEmit, npm run build, npm test, lessons.md, commit and push

### Group D: Low Priority & Branding
- [x] L1: Android strings.xml app_name and title_activity_main set to Tidebound
- [x] L2: Regenerate PWA PNG icons from SVG using palette colours (no neon ship), update generate-icons.js, update Capacitor icons/splash
- [x] L3: Replace placeholder README.md with real Tidebound README (no emojis)
- [x] Group D verification: npx tsc --noEmit, npm run build, npm test, lessons.md, commit and push

### Group E: Verification & Final Report
- [x] Run full build and tests (tsc, vitest, vite build: 8/8 test files, 30/30 tests passed)
- [x] Start npm run dev -- --host and curl it (HTTP 200 OK)
- [x] Run npm run preview and verify PWA manifest and icons served (HTTP 200 OK for index, manifest.webmanifest, and PWA icons)
- [x] Regression checklist in tasks/todo.md
- [x] Summary report table with bug id, file changed, test added, and any unfixed items

---

## Regression Verification Checklist
- [x] R1. No Test/Vitest Imports in Production: Static lint check passes and production dist contains 0 references to vitest.
- [x] R2. Ocean Surface Math: Water mesh Y transform fixed at 0; shader and CPU wave formula agree at runtime.
- [x] R3. Virtual Joystick Lifecycle: TouchControls.update() invoked every animation frame; joystick thumb tracking operational.
- [x] R4. Weapon Mesh Pooling: Player.equipItem verifies itemId and mesh existence before altering scene graph.
- [x] R5. Hound Lunge Multi-Damage Guard: hasHitThisLunge boolean prevents damage infliction beyond first hit per lunge.
- [x] R6. Directional Raycast Alignment: Shared getForwardFromYaw computes forward vectors identically for Player and CombatSystem.
- [x] R7. State Persistence & Migration: validateAndMigrateSave successfully recovers valid saves and recovers from invalid/corrupted payloads.
- [x] R8. Quick-Slot Touch Handling: pointerdown listeners with stopPropagation prevent camera movement when selecting tools.
- [x] R9. Build Mode Cancellation: Radial build menu includes central cancel action; Escape and slot changes dismiss active blueprint.
- [x] R10. Raft Passenger Transform: Boarded state tracks raft delta displacement and deck height; disables ground/water gravity.
- [x] R11. Death & Salvage Crates: Dropped items encapsulated in interactable salvage crates; respawn restores all vitals to full.
- [x] R12. Stamina & Warmth Calculations: Dodge stamina deducted once; campfire and roof shelter conditions mitigate freeze and exposure.
- [x] R13. Building Structural Collision: Static AABBs for walls/doors resolve pushback; ground height clamps player above floor structures.
- [x] R14. Inventory Modal & Station Crafting: Modal blocks touch pass-through; campfire and workbench requirements dynamically fulfilled.
- [x] R15. Camera Shoulder & Head Orientation: Over-the-shoulder offset rotates with yaw; first-person looks outward along spherical angles.
- [x] R16. Quick-Bar DOM Guard: setActiveQuickSlot early-returns if slot unchanged, preventing layout thrashing.
- [x] R17. Item Stacking & Spillover: addItemToInventory fills partial stacks, caps empty slots to maxStack, and spills remainder.
- [x] R18. Desktop Input Separation: Left click triggers attack; right click / pointer lock controls camera; e.repeat ignored for toggle keys.
- [x] R19. Telegraph Visual Offset: Procedural anticipation offset reapplied after position copy.
- [x] R20. DOM Class Preservation: HUD tide alert updates via classList.toggle('warning', ...) preserving hud-interactive.
- [x] R21. Zero Per-Frame Allocations: GameLoop boundTick, reusable scratch vectors, preallocated TypedArrays, and zero runtime closures in update paths.
- [x] R22. Native Android Identity: App name and activity title defined as Tidebound in strings.xml.
- [x] R23. Palette Themed Assets: PWA and Capacitor launcher/splash icons generated using palette tokens without neon graphics.
- [x] R24. Comprehensive README: Detailed repository guide covering gameplay, controls, scripts, and APK compilation with zero emojis.
- [x] R25. HUD Layer Touch Traversal (A1): Wrapper elements are pointer-events none and action cluster has z-index 25, preventing occlusion of buttons.
- [x] R26. Touch Target Ergonomics (A1, A2): Touch targets maintain >= 56px size with >= 12px gaps across mobile landscape 915x412 and 844x390 viewports.
- [x] R27. Input Latching Between Ticks (A3): One-shot actions latch on pointerdown and clear only when consumed by fixed simulation ticks, preventing dropped taps.
- [x] R28. Touch Capture & Window Blur Safety (A4): Action buttons invoke setPointerCapture and release on pointerup/cancel/lostpointercapture; blur and visibilitychange clear held inputs.
- [x] R29. Jump & Dodge Separation (A5): Jump uses JUMP_VELOCITY with 0.1s coyote time and 0.12s input buffer; separate Dodge button dodges along movement vector and expends stamina only upon activation.
- [x] R30. Context Interact Prompt Ownership (A6): Single centralized evaluator computes priority among raft, salvage crate, resource node, and build placement.
- [x] R31. Comprehensive Crafting & Modal Pause (A7): Inventory displays all recipes with uncraftable recipes disabled; opening inventory/build menus pauses simulation.
- [x] R32. Build Mode Single Placement (A8): Attack button switches to Place in build mode, placing once per tap without auto-repeat when held.
- [x] R33. Transform Interpolation & Frame-Rate Decoupling (B1, B2): Loop alpha interpolates positions and rotations for player, enemies, and raft; camera smoothing uses 1 - exp(-k * frameDt); fixed steps capped at 3 with maxFrameTime 0.1.
- [x] R34. Shadow Texel Grid Snapping & PCFShadowMap (B3): Directional sun uses constant offset from target, texel grid snapping, and PCFShadowMap with Low preset shadow toggle.
- [x] R35. Quality Presets & Dynamic Resolution (B4): QualityManager adjusts DPR (0.75-1.5) based on 100-frame average and cuts off shadows if frame time exceeds 24ms.
- [x] R36. Material Sharing, Merged Geometries, and GPU Rain (B5, B6, B7, B8, B9): MeshLambertMaterial with cached geometries and merged props reduces draw calls; water snaps to grid; rain runs on GPU shader; debug overlay updates at 2Hz via textContent.

---

## Group A: Buttons and Input
- [x] A1: Wrapper pointer-events none (.bottom-bar, .top-hud-bar), interactive elements auto, .action-cluster z-index 25, calc(env(safe-area-inset-*, 0px) + 16px) offsets, touch targets >= 56px with >= 12px gaps
- [x] A2: Playwright UI test script (Playwright cannot be installed due to offline sandbox restrictions; verified via CSS rules, layout math, and tests/uiButtons.test.ts via npm run test:ui)
- [x] A3: One-shot actions latched on pointerdown and cleared only when consumed by game loop, attack and sprint remain level-based, with unit tests in tests/inputLatching.test.ts
- [x] A4: Action buttons use setPointerCapture and release on pointerup/pointercancel/lostpointercapture, held states cleared on window blur and visibilitychange
- [x] A5: Jump uses MOVEMENT_CONSTANTS.JUMP_VELOCITY with 0.1s coyote time and 0.12s input buffer; separate Dodge button with custom SVG icon dodging along movement direction (backwards when standing still), spending stamina only when started
- [x] A6: Single owner for interact prompt computing highest-priority context action (loot crate, resource node, board/disembark raft, confirm build); Interact button displays enabled/disabled state with action name
- [x] A7: Inventory UI lists all recipes with required items/counts and disabled CRAFT button when unaffordable; tapping slot opens Use, Equip to quick slot, and Drop; simulation pauses while open; outside tap closes modal
- [x] A8: In build mode Attack button becomes Place with checkmark icon, places once per press and does not repeat while held
- [x] A9: Every button gets visible pressed feedback (:active and .pressed classes with scale and color highlights)
- [x] Group A verification: npx tsc --noEmit, npm run build, npm test, npm run test:ui, lessons.md, commit and push

## Group B: Smoothness
- [x] B1: Render with transform interpolation at loop alpha for player, enemies, raft; frame-rate independent camera smoothing with 1 - exp(-k * frameDt)
- [x] B2: Cap fixed steps at 3 per frame and drop remainder, maxFrameTime 0.1
- [x] B3: Directional sun shadow: fixed offset from target, texel grid snapping, tight far plane, PCFShadowMap, toggleable shadows on Low preset
- [x] B4: QualityManager with Low, Medium, High presets saved to IndexedDB, Settings panel in pause menu, default pixel ratio min(devicePixelRatio, 1.5), touch antialias off, dynamic resolution scaling (0.75-1.5) and shadow throttle
- [x] B5: Replace MeshStandardMaterial with MeshLambertMaterial on terrain, props, characters; share material and cached geometries in AssetRegistry; merge static geometries per prop
- [x] B6: Water mesh follows player snapped to vertex grid
- [x] B7: DOM thrash prevention: vitals, tide label, prompt, quick bar update only on change at max 10Hz; joystick styles only on change; debug overlay at 2Hz via textContent
- [x] B8: GPU shader rain with time uniform (zero CPU loops or per-tick buffer uploads)
- [x] B9: Extend ?debug overlay with average/p95 frame time, frames over 25ms in last 10s, quality preset and pixel ratio
- [x] Group B verification: npx tsc --noEmit, npm run build, npm test, npm run test:ui, lessons.md, commit and push

## Group C: Verification & Final Report
- [x] Build, tests, test:ui verification
- [x] Before and after performance metrics
- [x] Regression verification checklist
- [x] Final summary table (problem, file changed, test added, unfixed items)

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

---

## World Expansion and Streaming Pass (Groups A through E)

### Group A: World Data and Biome Generation
- [x] A1. Bump save version to 2 in src/core/SaveSystem.ts and ensure version 1 saves migrate safely or reset cleanly
- [x] A2. Create src/data/biomes.ts with typed biomes, palette colors, height/slope limits, and spawn tables
- [x] A3. Implement pure world generation logic in src/logic/worldLogic.ts (3000x3000m, 1024x1024 heightmap & biome map, 14-20 islands, 25-35% land, starter island SW, radio tower centre, industrial harbour NE, oil rigs deep north, shallow shelves & deep ocean, dry hills >4.5m)
- [x] A4. Create Web Worker in src/world/WorldWorker.ts and IndexedDB caching in src/world/WorldGen.ts behind an SVG loading bar
- [x] A5. Implement O(1) bilinear lookups for getHeight(x, z) and getBiome(x, z) with subtle detail noise
- [x] A6. Soft vertex blending across biomes without hard seams
- [x] A7. Unit tests in tests/worldGen.test.ts (deterministic seed, >=4% land per biome, starter island composition, bilinear vs direct height validation)
- [x] A8. Group A verification: npx tsc --noEmit, npm run build, npm test, lessons.md, git commit and push

### Group B: Streaming Terrain and Dynamic Depth Water
- [x] B1. Create chunked terrain system in src/world/TerrainChunks.ts with 64m chunks and distance-based LOD (LOD0 32x32 <160m, LOD1 16x16 <400m, LOD2 8x8 <900m, culled >900m)
- [x] B2. Chunk skirts (3.5m drop on perimeter edges) to eliminate seams between differing LODs
- [x] B3. Pre-allocated chunk mesh and geometry pool to ensure zero runtime allocations during streaming
- [x] B4. Throttle chunk geometry updates to at most 1 per frame to eliminate frame-time spikes
- [x] B5. Create 1024x1024 DataTexture from baked heightmap and update Water.ts shader to sample dynamic depth, shore foam, and crest foam
- [x] B6. Adjust clear-weather fog far plane to 450m while retaining storm fog (near 10, far 55)
- [x] B7. Unit tests in tests/streamingTerrain.test.ts (chunk coordinate maths, LOD distance thresholds, pool reuse)
- [x] B8. Group B verification: npx tsc --noEmit, npm run build, npm test, lessons.md, git commit and push

### Group C: Props, Spawning, Landmarks and Navigation
- [ ] C1. Delete hard-coded prop coordinates in main.ts and implement seeded jittered grid prop scattering per chunk
- [ ] C2. Batch repeated props into InstancedMesh per chunk (palms, rocks, barrels, scrap piles)
- [ ] C3. 2D spatial hash grid for resource nodes allowing O(1) proximity queries within 4m in InteractionSystem
- [ ] C4. Deterministic node harvesting tracking with respawn after 3 tide cycles (2700s)
- [ ] C5. Biome-based enemy spawning (hounds on land, lurkers in swamps/deep water, wake <120m, sleep/despawn >200m, max 6 active)
- [ ] C6. Fixed landmark placement (harbour cranes, wrecked tanker, radio tower, oil rigs)
- [ ] C7. Player spawn on south-west beach, respawn at nearest campfire/shelter or starter camp
- [ ] C8. World map modal (SVG button in HUD, 512x512 pre-rendered biome canvas, player heading arrow)
- [ ] C9. HUD compass strip with cardinal directions and landmark icons
- [ ] C10. Teleport shortcuts in ?debug overlay for all biomes and landmarks
- [ ] C11. Tune RAFT_CONSTANTS MAX_SAIL_SPEED to 10.0 m/s for 5-minute map crossing and record in tasks/planning.md
- [ ] C12. Unit tests in tests/propsAndSpawning.test.ts (spatial hash grid, respawn timing, landmark coords, raft speed)
- [ ] C13. Group C verification: npx tsc --noEmit, npm run build, npm test, lessons.md, git commit and push

### Group D: GLB Asset Pipeline and CC0 Models
- [ ] D1. Add GLTFLoader and SkeletonUtils imports in src/entities/AssetRegistry.ts
- [ ] D2. Create public/models directory and src/data/assetManifest.ts
- [ ] D3. Download CC0 low-poly model packs (Kenney / Quaternius) covering trees, rocks, containers, barrels, tools, hound, survivor, lurker
- [ ] D4. Document every asset in docs/ASSETS.md with file, source URL, author, CC0 license, and date
- [ ] D5. Recolor GLB materials at load time to nearest palette tokens with MeshLambertMaterial and no neon colors
- [ ] D6. Implement automatic fallback to procedural models if GLB is missing or fails to load
- [ ] D7. Enforce triangle budgets (<800 tree, <300 rock, <3000 character) and file sizes (<250KB per file, <15MB total)
- [ ] D8. Add .glb to Vite PWA workbox globPatterns and verify Capacitor compatibility
- [ ] D9. Unit tests in tests/assetManifest.test.ts (manifest file existence, polycount budgets, ASSETS.md completeness, linter tests pass)
- [ ] D10. Group D verification: npx tsc --noEmit, npm run build, npm test, lessons.md, git commit and push

### Group E: Verification, Performance Profiling and Final Report
- [ ] E1. Run npx tsc --noEmit, npm run build, and npm test
- [ ] E2. Start npm run dev -- --host and curl test
- [ ] E3. Profile draw calls and triangle counts at spawn, mid-map, and harbour island (<100 draw calls, <150k tris)
- [ ] E4. Update tasks/todo.md with complete regression checklist
- [ ] E5. Output final summary table of changes, files, and tests
