# Tidebound — Planning and Architecture Document

## 1. System Architecture

### 1.1 Architectural Modules
The game architecture is split into decoupled, modular systems matching mobile-first performance principles and Three.js best practices:

```
src/
├── core/
│   ├── GameLoop.ts          # Fixed-timestep simulation (60Hz) with delta accumulator and lag clamp
│   ├── InputManager.ts      # Multi-touch pointer tracking (pointerId), virtual joystick, camera drag, action buttons
│   ├── SaveSystem.ts        # IndexedDB autosave and state restoration (inventory, vitals, structures)
│   └── CameraController.ts  # Third-person over-the-shoulder controller with first-person building toggle
├── world/
│   ├── Noise.ts             # Deterministic seeded simplex/perlin noise for island heightfield
│   ├── Terrain.ts           # Island mesh generation with slope and height vertex colours and collision heightfield
│   ├── Water.ts             # Shared CPU/GPU vertex-wave water plane, depth-based foam via baked heightmap
│   ├── TideSystem.ts        # 15-minute tide and storm cycle, water lerp (4-5m), fog and hemisphere lighting
│   └── Weather.ts           # Rain particle system pooled for high-tide monsoon
├── data/
│   ├── palette.ts           # 30 typed color tokens, CSS variable generator, runtime canvas atlas builder
│   ├── constants.ts         # GDD numbers (15m tide, 10m low, 1m warning, 5m high, drain rates, speeds)
│   ├── items.ts             # Typed item definitions, categories, stack limits, atlas swatch indices
│   ├── recipes.ts           # Crafting recipes, required stations (hand vs workbench), ingredients
│   ├── blueprints.ts        # Modular building pieces (foundation, stilts, wall, roof, sockets)
│   └── enemies.ts           # Feral hound and tide lurker stats, attack radiuses, telegraph times
├── entities/
│   ├── AssetRegistry.ts     # Procedural low-poly primitives generator with swatch UV mapping
│   ├── Player.ts            # Player entity, transform, animation state, equipped item socket
│   ├── ResourceNode.ts      # Trees, scrap piles, barrels with harvestable hit states
│   ├── DropPickup.ts        # Floating or grounded item pickups with subtle Salvage Gold rim
│   ├── Enemy.ts             # Base enemy class, FSM, telegraph animations, hitbox
│   └── Raft.ts              # Modular raft entity, wave function buoyancy sampling, sail steering
├── systems/
│   ├── VitalsSystem.ts      # Health, hydration, hunger, exposure simulation and critical penalties
│   ├── InteractionSystem.ts # Raycast/trigger detection, context-sensitive interact prompt
│   ├── CraftingSystem.ts    # Inventory recipe verification and item manufacturing
│   ├── BuildingSystem.ts    # Snap-grid socket calculation, ghost preview (green/red), 90-degree rotation
│   ├── CombatSystem.ts      # Soft lock-on melee (within 2m), slingshot auto-aim assist, damage resolution
│   └── AISystem.ts          # Feral hound telegraph lunge, tide lurker water ambush behavior
├── ui/
│   ├── icons.ts             # Custom inline SVG icons with unified stroke style
│   ├── HUD.ts               # Flat panels (Storm Slate, Gunmetal Grey), 4 stat bars, flashing tide alert
│   ├── TouchControls.ts     # Left dynamic joystick, right camera drag area, action buttons, quick bar
│   ├── InventoryUI.ts       # 12-slot mobile inventory grid, drag/tap transfer, drop action
│   ├── BuildMenuUI.ts       # Radial/grid build piece selector
│   └── DebugOverlay.ts      # ?debug overlay (FPS, draw calls, triangles, tide state, timescale)
└── audio/
    └── SoundSynth.ts        # Web Audio procedural synthesis (ambient waves, rain, thunder, chop, hit, alert)
```

### 1.2 Core Data Flow
1. **Input**: `InputManager` processes pointer events. Left half drives movement and sprint; right half drives orbital camera rotation or building placement; dedicated action buttons trigger jump/dodge, attack, and interact.
2. **Fixed Timestep**: `GameLoop` accumulates RAF delta, clamped to 0.2s. It ticks physics, AI, vitals, tide, and building at a fixed 60Hz.
3. **World and Water Integration**: The CPU and GPU share an identical mathematical wave function `getWaveHeight(x, z, time)`. The water mesh vertex shader uses this function for undulating waves, while the CPU samples the same function for floating crates, raft barrels, and swimming detection.
4. **Render Interpolation**: Three.js renders interpolated positions. Shared atlas material and `THREE.InstancedMesh` guarantee low draw calls.
5. **HUD and Audio Updates**: Reactive updates to DOM HUD elements and Web Audio synthesizer parameters based on vital changes and tide phase transitions.

---

## 2. Phase Implementation Plan

### Phase 1: Core Controller, Starter Island and Water
- Setup Vitest testing infrastructure and validation tests.
- Palette tokens in `src/data/palette.ts` and runtime 256x256 texture atlas generator.
- Procedural starter island with terrain vertex colours:
  - Wet Silt below high-tide line (y < 4.5m).
  - Sun-Bleached Sand above high-tide line.
  - Weathered Slate for steep cliff faces.
  - Palm Leaf Green and Deep Jungle for flat interior foliage.
- Procedural low-poly player character mesh with idle, walk, run, and attack procedural animations.
- Third-person over-the-shoulder camera controller with first-person building toggle.
- Dual mobile touch inputs: floating dynamic joystick on left half with outer-rim sprint; right-half camera drag.
- Context-sensitive interact button, jump/dodge button, attack button, and 5-slot quick bar.
- Collision against terrain heightfield and static AABBs (no heavy external physics library).
- Shared CPU/GPU vertex-wave water plane blending Tropical Teal to Abyssal Navy with depth-based Seafoam White foam using a baked island heightmap.

### Phase 2: Dynamic Tide and Weather System
- 15-minute scripted tide cycle in `src/world/TideSystem.ts`:
  - 10 minutes Low Tide (recedes 4-5 metres, exposes sunken ruins and containers).
  - Final 1 minute of Low Tide: warning state with rising wind, thunder audio cue, and flashing Signal Crimson tide gauge.
  - 5 minutes High Tide (submerges beaches and scrap zones, heavy monsoon rain).
- Smooth lerping of water level, fog density, Coastal Mist to Storm Slate sky/fog colours, and hemisphere light tint.
- Procedural rain particle system with instanced velocity.
- Support `?debug&timescale=N` to accelerate time for testing.

### Phase 3: Scavenging, Inventory, Crafting and Persistence
- Resource nodes: Palm/Dead Trees (wood, fronds, coconuts), Scrap Piles/Cars (metal, bolts), Floating Debris/Barrels (plastic barrels, rope), Sunken Electronics (copper wire, circuits, batteries).
- Instanced harvesting with hit feedback.
- Droppable loot pickups with subtle Salvage Gold rim effect.
- 12-slot mobile inventory UI with 5-slot quick-slot bar synchronization.
- Crafting system: recipe checking, crafting queue, station prerequisites (hand crafting vs Workbench).
- Autosave system using IndexedDB for player position, vitals, inventory, and built structures.

### Phase 4: Vitals, Survival Stations and Snap-Grid Building
- 4-stat vital simulation in `src/systems/VitalsSystem.ts`:
  - Health, Hydration, Hunger, Exposure.
  - GDD penalties: dehydration halves stamina and drains health; starvation prevents regen and drains health; 100% exposure drops stamina regen by 50% and drains health; 0% health drops salvage crate.
- Survival stations: Campfire (heats player, reduces exposure, cooks food), Rain Collector (gathers potable water during storms).
- Modular snap-grid base building:
  - Foundation, Stilts (elevated bases for high tide), Wall, Doorframe, Roof, Raft Base.
  - Sockets with magnetic snapping.
  - Translucent green (valid) / red (invalid) ghost preview.
  - 90-degree rotation button.
  - Radial build menu for touch convenience.

### Phase 5: Combat, Enemies, Raft, Audio and Polish
- Melee combat with soft lock-on within 2 metres.
- Ranged slingshot with aim-assist crosshair turning red on enemy hitbox.
- Feral Hound (Muddy Ochre) with 1-second telegraph animation before lunging.
- Tide Lurker (Kelp Dark with Bio Cyan eyes/fins) patrolling water zones.
- Modular raft with buoyant barrels sampled from wave function and sail steering.
- Floating salvage crate on player death.
- Web Audio procedural sound design: ocean ambient, monsoon rain, thunder claps, footsteps, weapon swings, enemy roars, tide alert siren.
- Mobile budgets enforcement (under 100 draw calls, under 150k triangles, 1 directional light, 1024 shadow map within 40m, storm fog far-plane culling).
- `?debug` overlay displaying FPS, draw calls, triangle count, and tide state via `renderer.info`.

---

## 3. Assumptions and Resolutions

1. **Unity to Three.js Mapping**:
   - Unity's SRP Batcher / Static Batching is achieved by grouping static geometry onto a single shared palette atlas material and using `THREE.InstancedMesh` for repeated props (trees, barrels, rocks).
   - Occlusion culling is achieved via Three.js frustum culling plus per-island distance visibility checks.
   - LOD tiers are implemented using `THREE.LOD` or distance-based mesh swaps.
2. **Water Depth Foam without Depth Buffer**:
   - WebGL depth texture passes can be expensive and inconsistent on low-end mobile devices. As specified in the prompt and GDD, the island heightmap is baked into an analytical function or small data texture, allowing the water shader to determine water depth at any `(x, z)` coordinate directly without an expensive depth prepass.
3. **Procedural Geometry**:
   - No external `.glb` or `.gltf` model files are loaded. All models (survivor, weapons, hounds, lurkers, trees, containers, rafts) are synthesized at startup from low-poly Three.js geometries with custom UV mapping into the palette atlas.
4. **Touch Input Tracking**:
   - Multi-touch inputs use `pointerdown`, `pointermove`, `pointerup`, `pointercancel` with tracked `pointerId`s. Left half screen touches instantiate the virtual joystick; right half screen touches rotate the camera or interact with building previews.
5. **Autosave Reliability**:
   - IndexedDB is used via an asynchronous lightweight key-value store, preventing main thread lag spikes common with synchronous `localStorage`.

---

## 4. Deviations from Docs with Reasons

1. **Depth Foam Implementation**:
   - *Doc suggestion:* Depth-based foam.
   - *Resolution:* Baked heightfield function rather than WebGL depth-buffer reading. Reading depth buffers on mobile browsers often causes driver pipeline stalls and breaks WebGL1 fallbacks. An analytical terrain height comparison in the water shader runs at full frame rate with zero memory bandwidth penalty.
2. **Procedural Rigging vs SkinnedMesh**:
   - *Doc note:* Humanoid rig (Mixamo-compatible) under 30 bones.
   - *Resolution:* To avoid external model downloads and ensure instant startup with zero network requests, the survivor, hound, and lurker are built as procedural articulated hierarchical meshes (parent-child pivot hierarchies) with procedural limb oscillation. This mimics skeletal animation with zero CPU skinning matrix calculation overhead.
3. **Radial Building Menu on Mobile**:
   - *Doc note:* Radial build menu.
   - *Resolution:* Implemented as a touch-friendly circular/ring layout overlay with large hit targets (minimum 48px) and icons, automatically dismissed upon selection.

---

## 5. Skills Utilized
- **game-development**: Fixed-timestep loop, state machine architecture, object pooling, mobile performance budgets.
- **web-games**: Web Audio user gesture unlock, `visibilitychange` background pause, PWA offline service worker, responsive touch canvas.
- **3d-games**: Low-poly procedural geometry, vertex-wave water shader, heightfield terrain generation, camera smoothing, frustum culling.
- **mobile-games**: Multi-touch pointer tracking, dynamic floating virtual joystick, safe area insets, vibration haptics.
- **game-design**: 15-minute tide loop risk/reward, 4-stat survival balancing, telegraph-based combat windows.
- **game-art**: 30-token palette atlas with 3-tone vertical gradient, low-poly silhouettes, zero emoji visual styling.
- **game-audio**: Web Audio procedural synthesis (white noise rain/ocean filters, dual-oscillator thunder, resonant pings, alert sweeps).
