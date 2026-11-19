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

---

## 6. World Expansion and Streaming Architecture (Groups A through E)

### 6.1 World Generation and Data Architecture (Group A)
- **World Dimensions**: 3000m x 3000m continuous coordinates centred at (0, 0), spanning [-1500, 1500] along X and Z axes.
- **Data Grid**: 1024 x 1024 grid cells. Grid spacing = 3000 / 1024 = 2.9297 metres per cell.
- **Data Arrays**:
  - `Float32Array` heightmap (1024 x 1024 x 4 bytes = 4 MB).
  - `Uint8Array` biomeId map (1024 x 1024 x 1 byte = 1 MB).
- **Web Worker Generation**: Offloaded to `src/world/WorldWorker.ts` with a deterministic seed and version token. The UI shows an SVG loading bar during initial generation.
- **IndexedDB Caching**: Persisted under key `world_seed_${seed}_v${WORLD_GEN_VERSION}` so subsequent loads take <50ms without recomputing simplex noise.
- **Bilinear Sampling**: `getHeight(x, z)` and `getBiome(x, z)` in `src/logic/worldLogic.ts` perform O(1) bilinear interpolation over the four neighbouring grid points plus fine-scale deterministic micro-roughness.
- **Archipelago Topology**:
  - 14 to 20 procedural islands spanning 150m to 700m diameter, totaling 25% to 35% total land coverage.
  - **Starter Beach Island**: Located in south-west quadrant (approx (-850, 850)), featuring shallow beaches, dense jungle, and a dry hill rising to 12m (safely above the 4.5m high-tide line).
  - **Radio Tower Island**: Located near world origin (0, 0), featuring elevated rock terraces and the broadcast landmark.
  - **Industrial Harbour Island**: Located in north-east quadrant, featuring flat concrete aprons, docks, cranes, and rusted tanker hulls.
  - **Offshore Oil Rigs**: Stationed in deep ocean in northern sectors, elevated on steel lattice pylons.
  - **Shelf and Depth Profile**: Shallow underwater shelves (0m to -4m) surrounding islands; deep ocean floors (-10m to -22m). Lowlands (<4.5m) submerge during high tide; tidal flats emerge at low tide (water level 0m).
- **Biome Definitions (`src/data/biomes.ts`)**:
  - `Palm Beach Coast`: Sun-Bleached Sand, Wet Silt, gentle slopes, palm and driftwood nodes.
  - `Dense Jungle`: Palm Leaf Green, Deep Jungle, lush interior canopy, vines and fruit trees.
  - `Mangrove Swamp`: Wet Silt, Deep Jungle, shallow flooded channels, submerged roots.
  - `Rocky Highlands`: Weathered Slate, cliff faces with slope > 0.45, stone outcroppings.
  - `Industrial Harbour`: Weathered Slate / Gunmetal Grey flat concrete surfaces, metal scrap, shipping containers.
  - `Tidal Flats and Reef Shallows`: Wet Silt, Tropical Teal shallows, exposed shells and sunken debris.
  - `Offshore Oil Rigs`: Oxidised Rust, Warning Yellow railings, high-tier scrap and hazardous platforms.
- **Vertex Blending**: Continuous lerp of vertex colours across biome boundaries based on biome weights, slope, and elevation, eliminating visible seams.

### 6.2 Streaming Terrain System (Group B)
- **Chunk Partitioning**: 64m x 64m square chunks. Total world = 47 x 47 chunks.
- **LOD Strategy**:
  - `LOD0`: 32 x 32 quads (2048 triangles) for chunks within 160m of player.
  - `LOD1`: 16 x 16 quads (512 triangles) for chunks between 160m and 400m.
  - `LOD2`: 8 x 8 quads (128 triangles) for chunks between 400m and 900m.
  - Culled beyond 900m distance.
- **Skirts**: Outer boundary edges of chunk geometries are extruded downward by 3.5m to seamlessly bridge vertical gaps caused by differing LOD resolutions.
- **Chunk Mesh Pooling**: A pre-allocated pool of `THREE.Mesh` objects with reusable geometries prevents memory allocation during streaming.
- **Hitch-Free Streaming Budget**: At most 1 chunk geometry rebuild/upload per frame. Chunks outside radius are immediately recycled into the pool.
- **Dynamic Depth Water**:
  - Water plane follows the player, snapped to the vertex spacing grid.
  - The baked 1024 x 1024 heightmap is passed to the ocean shader as a `THREE.DataTexture` with linear filtering.
  - Shader samples depth once per fragment: `depth = waterY - sampledHeight`, calculating shallow-to-deep gradient, shoreline foam, and wave crest foam dynamically without hardcoded island formulas.
- **Fog Configuration**:
  - Clear weather: `CoastalMist` with near 80m, far 450m (comfortably encompassing LOD0 and LOD1).
  - High-tide monsoon storm: `StormSlate` with near 10m, far 55m.

### 6.3 Props, Spawning, Landmarks and Navigation (Group C)
- **Chunk Prop Scatter**: Deterministic jittered Poisson/grid scatter seeded by `hash(chunkX, chunkZ, worldSeed)`.
- **InstancedMesh Grouping**: Static props (palms, rocks, barrels, scrap piles) within a chunk are batched into `THREE.InstancedMesh` instances per model type.
- **Spatial Hash Grid Interaction**: Resource nodes register into a 2D spatial hash grid (cell size 16m). `InteractionSystem` only inspects nodes within the player's 4m radius, avoiding O(N) distance checks.
- **Node Persistence and Respawn**: Harvested nodes record timestamp and deterministic ID. Nodes respawn after 3 complete tide cycles (3 x 900s = 2700s).
- **Enemy Population**:
  - Feral hounds spawn in land biomes; Tide lurkers spawn in mangrove swamps and deep ocean shelves.
  - Enemy lifecycle: active and awake within 120m, sleep/despawn beyond 200m. Max active enemies capped at 6.
- **Landmarks**:
  - Harbour Cranes and Rusted Tanker on Industrial Harbour Island.
  - Radio Tower atop the central peak.
  - Oil Rigs on deep sea pylons.
- **Navigation & UI**:
  - World Map modal with pre-rendered 512x512 biome overview canvas, player position marker, and cardinal compass.
  - HUD compass strip along top bar with cardinal headings (N, NE, E, SE, S, SW, W, NW) and landmark markers.
  - Teleport shortcuts in `?debug` overlay for rapid travel to each island and landmark.
  - Raft tuning: `MAX_SAIL_SPEED` set to 10.0 m/s so crossing the 3000m map takes approximately 5 minutes (3000m / 10m/s = 300s = 5.0 minutes).

### 6.4 GLB Asset Integration and Fallback Pipeline (Group D)
- **Loader**: `GLTFLoader` with `SkeletonUtils.clone` for animated character models.
- **Manifest (`src/data/assetManifest.ts`)**: Keyed by `AssetRegistry` ID with source path, scale, rotation offset, ground offset, shadow flags, and animation clip definitions.
- **Palette Recolor on Load**: Materials are converted to `MeshLambertMaterial` with diffuse colors remapped to the closest palette token, preventing neon artifacts and off-palette colors. Textures are discarded in favor of palette vertex/material shading where appropriate.
- **Asset Budgets**:
  - Trees: < 800 triangles.
  - Rocks: < 300 triangles.
  - Characters: < 3000 triangles.
  - Individual files: < 250 KB.
  - Total model bundle: < 15 MB.
- **Procedural Fallback**: If a GLB file fails to load or is not yet downloaded, `AssetRegistry` seamlessly generates the corresponding procedural low-poly geometry.
- **License Documentation**: Every downloaded CC0 model is cataloged in `docs/ASSETS.md` with source URL, author, license type (CC0 / Public Domain), and date.
- **PWA & Native Offline**: Add `.glb` files to Workbox service worker caching configuration and ensure Capacitor Android build bundles the assets into the APK.

### 6.5 Deviations from GDD Log
1. **World Extent**:
   - *GDD Baseline*: Starter island + adjacent islands unspecified in dimension.
   - *Implementation*: 3000m x 3000m continuous archipelago with 14-20 islands, seeded heightmap in IndexedDB, and LOD streaming up to 900m to preserve 60 FPS mobile performance.
2. **Water Depth Detection**:
   - *GDD Baseline*: Analytical formula or depth buffer.
   - *Implementation*: Sampled 1024x1024 heightmap DataTexture with linear filtering, decoupling water shading from island geometry while maintaining zero GPU depth-buffer overhead.
3. **Save System Migration**:
   - *GDD Baseline*: Save version 1.
   - *Implementation*: Upgraded to Save Version 2 with automated migration. Legacy version 1 saves are safely transformed and player coordinates clamped to the starter beach if out-of-bounds.
4. **Raft Crossing Velocity**:
   - *GDD Baseline*: Raft speed 6.0 m/s.
   - *Implementation*: Raft max sail speed increased to 10.0 m/s to achieve the 5-minute archipelago transit target across the expanded 3000m ocean.
