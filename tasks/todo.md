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
