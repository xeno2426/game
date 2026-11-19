# Tidebound — 3D Survival Android Game Design Document (GDD)

**Genre:** 3D Stylized Low-Poly Survival / Crafting / Base Building  
**Platform:** Android (Mobile-First, 60 FPS target on mid-range hardware)  
**Camera:** Third-Person Over-the-Shoulder (with optional First-Person toggle for building)  
**Art Style:** Stylized Low-Poly with Colour Palette Texture Atlases  

---

## 1. High-Level Concept

**Tidebound** is a 3D survival game set in a flooded, overgrown industrial archipelago. Unlike standard forest survival games, the entire world revolves around a **dynamic tide cycle**: low tide exposes sunken shipping containers, rusted tankers, and high-tier scrap, while high tide and monsoon storms submerge the lower islands, forcing players to retreat to elevated bases or floating rafts.

The archipelago structure is purposefully designed for Android—islands naturally divide the map for clean frustum/occlusion culling, and the stylized low-poly art direction keeps frame rates smooth even on budget and mid-range GPUs.

---

## 2. Core Game Mechanics

### 2.1 Survival Vitals (4-Stat System)
Designed for a clean, uncluttered mobile HUD:

| Stat | Drain / Trigger | Recovery Method | Critical Penalty (at 0% / 100%) |
| :--- | :--- | :--- | :--- |
| **Health** | Enemy attacks, drowning, starvation, dehydration, falls | Bandages, Medkits, Cooked Food | Player dies; drops non-equipped inventory in a floating salvage crate |
| **Hydration** | Drains fastest during daytime & sprinting; seawater causes sickness | Rainwater Collector, Boiled Water, Electric Purifier | Stamina cap halved; gradual health drain |
| **Hunger** | Steady drain over time; faster during combat/chopping | Fishing, Canned Food, Cooked Meat, Coconuts | No passive health regen; gradual health drain |
| **Exposure (Wetness/Cold)** | Rises rapidly during monsoon storms or while swimming | Standing near Campfire, standing under a Roof, dry clothing | At 100%, stamina regen drops by 50% and health drains slowly |

### 2.2 The Unique Hook: Dynamic Tide & Storm Cycle
A full cycle lasts **15 real-time minutes** and drives the core risk-reward loop:

* **Low Tide & Clear Weather (10 Minutes):**
  * Ocean water level recedes by **4–5 metres**.
  * Exposes sunken ruins, half-buried shipping containers, rusted tankers, and high-tier electronics (copper wire, circuit boards, batteries).
  * Safe window for island-hopping, diving, and heavy resource gathering.
* **Transition Warning (Final 1 Minute of Low Tide):**
  * Audio cue (distant thunder + rising wind) and HUD tide gauge flashing.
  * Gives players time to haul loot back to higher ground or moor their raft.
* **High Tide & Monsoon Storm (5 Minutes):**
  * Water rises back to peak level, submerging beaches and low-lying scrap zones.
  * Heavy rain increases **Exposure** rapidly; fog reduces draw distance (also helps mask distant culling).
  * Strong wind gusts push unanchored rafts; aggressive amphibious enemies spawn closer to shore.

### 2.3 Scavenging, Crafting & Modular Base Building
* **Resource Nodes:**
  * *Palm & Dead Trees:* Wood logs, palm fronds, coconuts.
  * *Rusted Cars & Shipping Containers:* Scrap metal, bolts, cloth.
  * *Floating Debris & Barrels:* Plastic barrels (required for raft buoyancy), rope.
  * *Sunken Electronics (Low Tide Only):* Copper wire, circuit boards, lithium batteries.
* **Magnetic Snap-Grid Base Building:**
  * Free-placement building is frustrating on touchscreens. Instead, use a **snap-grid system**:
    1. Open the radial Build Menu and tap a blueprint (*Wood Foundation, Stilts, Wall, Doorframe, Ramp, Roof, Raft Base*).
    2. Aim at an existing structure or valid terrain; a translucent green/red ghost preview snaps automatically to sockets.
    3. Tap **Place** to build (or **Rotate** in 90° increments).
  * **Stilt Mechanics:** Players must build elevated stilt bases on beaches to stay dry during High Tide.
* **Power & Automation (Mid-to-Late Game):**
  * Craft **Solar Panels** and **Wind Turbines** connected via simple proximity power radii (avoids tedious wire-dragging on mobile).
  * Powers **Electric Water Purifiers**, **Floodlights** (repels night/storm enemies), and **Automated Turrets** or **Beacon Transmitters**.

### 2.4 Combat & AI
* **Soft Lock-On Melee:**
  * Single attack button that slightly magnetizes the player toward the nearest hostile target within **2 metres**.
  * **Melee Weapons:** Scrap Pipe (early), Stone/Scrap Axe, Machete, Metal Spear (longer reach).
* **Ranged Combat:**
  * **Ranged Weapons:** Slingshot (early), Recurve Bow, Harpoon Gun (late game, works underwater).
  * Includes subtle auto-aim assist when the crosshair turns red over an enemy hitbox.
* **Enemy Roster:**
  * **Feral Hound / Scavenger Boar (Land):** Territorial island wildlife. Uses a clear **1-second telegraph animation** before lunging so players can dodge-roll or sidestep on touch controls.
  * **Tide Lurker (Amphibious):** Patrols deep water and sunken ruins during High Tide or late Low Tide. Ambushes players who get greedy looting sunken containers.

### 2.5 Mobile-First Controls & UX
* **Left Thumb:** Floating dynamic virtual joystick. Pushing to the outer rim automatically triggers **Sprint** (no separate sprint button needed).
* **Right Thumb:** Smooth camera drag anywhere on the right half of the screen.
* **Context-Sensitive Interact Button:** Only appears when looking at a lootable crate, harvestable tree, campfire, or door—reduces screen clutter.
* **Action Cluster:** Jump / Dodge button + Primary Attack / Use Tool button.
* **Quick-Slot Bar:** 4–5 large, thumb-friendly slots anchored at the bottom centre for instant weapon/tool switching.

---

## 3. Progression Loop

1. **Early Game (Survive First Storm):** Wake up on a starter island → gather wood & scrap → craft Axe, Campfire, and Rain Collector → build a 2x2 raised stilt shelter before the first High Tide hits.
2. **Mid Game (Archipelago Exploration):** Scavenge plastic barrels → build a modular Raft with a sail → travel to neighbouring industrial islands during Low Tide → harvest electronics to unlock the Workbench Tier 2, Machete, and Bow.
3. **Late Game (Automation & Escape/Endgame):** Set up Solar/Wind power → craft Harpoon Gun & Diving Gear to loot deep-sea oil rigs → repair the central Radio Tower / Rescue Boat to complete the story objective (or continue in Endless Survival mode).

---

## 4. 3D Models & Asset Breakdown

### Art & Material Pipeline (Performance-First)
* **Style:** Stylized Low-Poly with clean silhouettes and flat/faceted or soft-shaded normals.
* **Texture Atlas Strategy:** Map 80% of static props, modular base pieces, and tools onto **one or two 256×256 Colour Palette Texture Atlases**. This enables **SRP Batcher / Static Batching**, letting the engine render hundreds of objects in just a handful of draw calls.
* **Shader Highlights:** Add a lightweight Fresnel rim-light/outline shader on pickup items so small loot stands out clearly on 6-inch mobile screens.

### Complete 3D Asset List

| Category | Specific 3D Models Needed | Target Polycount (Tris) | Technical & Rigging Notes |
| :--- | :--- | :--- | :--- |
| **Player Character** | 1× Survivor (with modular backpack & hat slots) | 2,500 – 4,000 | Standard humanoid rig (Mixamo-compatible). Dedicated bone socket on right hand for swapping tools/weapons. |
| **Tools & Weapons** | Axe, Pickaxe, Scrap Pipe, Machete, Spear, Slingshot, Bow, Harpoon Gun, Flashlight, Water Bottle | 300 – 800 each | Share a single palette atlas. Use a simple emissive material for the flashlight lens. |
| **Modular Base Pieces** | Foundation, Stilts, Wall, Window Wall, Doorframe, Door, Roof, Stairs, Ramp, Raft Base, Sail | 100 – 400 each | **Strict pivot placement** (bottom-centre or corner) required for seamless grid snapping. |
| **Interactive Stations** | Campfire, Rain Collector, Workbench, Storage Crate, Solar Panel, Wind Turbine, Electric Purifier, Bedroll | 400 – 1,000 each | Use lightweight particle systems for fire/rain and simple UV scrolling or rotation scripts for wind turbines. |
| **Environment & Terrain** | 3× Rock variations, 3× Palm/Dead Trees, Grass tufts, Sunken Shipping Container, Rusted Car, Oil Rig Props | 150 – 1,200 each | Use **GPU Instancing** for trees, rocks, and grass. Avoid heavy alpha-cutout layers on foliage to prevent GPU overdraw. |
| **Loot & Pickups** | Scrap Pile, Wood Log, Plastic Barrel, Tin Can, Bandage/Medkit, Circuit Board, Battery | 100 – 300 each | Low-poly silhouettes + subtle Fresnel highlight shader for mobile readability. |
| **Enemies** | Feral Hound (land), Tide Lurker (amphibious) | 1,500 – 2,500 each | Keep skeleton bone count **under 30 bones** per rig to minimize CPU skinning overhead. |

---

## 5. Android Optimization Essentials

Targeting **60 FPS on mid-range Android devices (Adreno 618+ / Mali-G57+)** requires strict budgets from day one:

* **Draw Call Budget:** Keep active scene draw calls **under 80–100** per frame using GPU Instancing and shared material atlases.
* **Triangle Budget:** Keep visible on-screen triangles **under 100k–150k** at any time.
* **Water Shader:**
  * Avoid real-time planar reflections or heavy screen-space reflections (SSR).
  * Use a custom **vertex-displacement wave shader** with **depth-based foam** (white foam edge where water intersects terrain/stilts) and a cheap skybox cubemap reflection.
* **Lighting & Shadows:**
  * Limit to **1 real-time Directional Light** (Sun/Moon).
  * Cap real-time shadow distance to **30–40 metres** with low-to-medium shadow map resolution (1024×1024).
  * Bake ambient occlusion or paint vertex colours into static meshes for depth without lighting cost.
* **LODs (Level of Detail) & Culling:**
  * Create 2 LOD tiers for islands, ruins, and trees (`LOD0` close, `LOD1` medium, ultra-low silhouette `LOD2` at >100m).
  * Enable **Occlusion Culling** and **Frustum Culling**; use dynamic storm fog during High Tide to aggressively pull in the camera far-clip plane.
* **Audio:** Compress long ambient loops (ocean waves, monsoon rain) as **Vorbis / Streaming**, and keep short SFX (chopping, footsteps, UI clicks) as lightweight decompressed **ADPCM / PCM** clips.

---

## 6. Suggested MVP Development Roadmap

1. **Phase 1 — Core Movement & World:** Third-person character controller, touch joystick/camera, single starter island, and basic vertex-wave water plane.
2. **Phase 2 — Tide System:** Scripted 15-minute cycle smoothly lerping water Y-height, fog density, lighting colour, and storm rain particles.
3. **Phase 3 — Gathering & Inventory:** Raycast/trigger interaction, choppable trees, lootable scrap piles, and a 12-slot mobile inventory UI.
4. **Phase 4 — Snap-Grid Building & Vitals:** 4-stat vital bars, Campfire, Rain Collector, and snap-grid placement for Foundation, Stilts, Walls, and Roof.
5. **Phase 5 — Combat, Raft & Polish:** Add 1 land enemy + 1 water enemy, raft buoyancy/steering, audio pass, and Android APK profiling (GPU/CPU frame-time check).