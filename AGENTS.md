# AGENTS.md — Developer and Agent Guide for Tidebound

## 1. Project Overview
Tidebound is a 3D stylized low-poly survival and base-building game set in a flooded, overgrown industrial archipelago, developed for mobile browsers and Android via Capacitor. The core loop revolves around a dynamic 15-minute tide and storm cycle: low tide exposes sunken ruins, shipping containers, and high-tier scrap, while high tide and monsoon storms submerge lower islands, requiring players to build elevated stilt bases or sail rafts.

The source of truth documents for this project are:
- docs/GDD.md (Tidebound Game Design Document)
- docs/PALETTE.md (Tidebound Colour Palette and Atlas Guide)

## 2. Tech Stack
- Runtime and Bundler: Vite (vanilla-ts)
- Language: TypeScript (strict mode)
- Rendering Engine: Three.js (low-poly 3D primitives, shared palette atlas material, GPU InstancedMesh, fixed camera perspective)
- Testing Framework: Vitest (unit tests for tide timeline, vitals, crafting, snap sockets, and static rule linters)
- Audio: Web Audio API (procedural synthesized sound effects, zero external audio files)
- Haptics: Web Vibration API (navigator.vibrate with feature detection)
- PWA: vite-plugin-pwa (offline caching, standalone display, landscape orientation, SVG icons)
- Native Packaging: Capacitor (@capacitor/core, @capacitor/cli, @capacitor/android) targeting Android with CI/CD build via GitHub Actions

## 3. Project Commands
- npm run dev: Start local development server (port 5173, bound to host)
- npm run build: Type-check (tsc) and compile production bundle to dist/
- npm test: Run test suite with Vitest
- npm run preview: Serve production bundle locally (port 4173)
- npx cap sync: Sync web assets to native Android project

## 4. Folder Structure
```
game/
├── .agent/skills/         # Agent skills and guidelines
├── .github/workflows/     # CI/CD workflows (Android APK build artifact)
├── android/               # Capacitor Android native project
├── docs/                  # Sources of truth (GDD.md, PALETTE.md)
├── public/                # Static assets, web manifest, PWA icons
├── src/
│   ├── audio/             # Synthesized WebAudio managers and sound generation
│   ├── core/              # Fixed-timestep loop, input abstraction, IndexedDB save
│   ├── data/              # Palette tokens, typed items, recipes, blueprints, constants
│   ├── entities/          # Player, Enemy, Pickup, Raft, Building definitions
│   ├── systems/           # Vitals, interaction, crafting, building, combat, AI
│   ├── ui/                # Touch controls, HUD, SVG icons, radial menus, debug overlay
│   ├── world/             # Seeded-noise terrain, water shader, tide cycle, weather
│   ├── main.ts            # Bootstrapper and lifecycle
│   └── style.css          # Mobile reset, safe areas, HUD styles using palette CSS vars
├── tasks/
│   ├── planning.md        # Architecture, phase plan, assumptions, deviations
│   ├── todo.md            # Phased checklist and upgrade backlog
│   └── lessons.md         # Date, mistake, and rule log
├── tests/                 # Unit tests and lint validation tests
├── AGENTS.md              # Project rules and workflow guide
├── capacitor.config.ts    # Capacitor configuration
├── index.html             # Entry HTML with viewport and PWA meta tags
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite and PWA configuration
```

## 5. Coding Rules and Performance Constraints
1. Zero Per-Frame Allocations: Never instantiate new THREE.Vector3(), new THREE.Matrix4(), new THREE.Quaternion(), closures, or arrays inside the update or render loops. Reuse pre-allocated scratch objects and object pools.
2. Object Pooling: Pre-allocate pools for bullets, enemy meshes, pickups, and visual hit/rain particles. Recycle inactive entities immediately.
3. Fixed Timestep Simulation: Run physics and game simulation at a fixed rate (60 Hz) with an accumulator clamped to max 0.2s to decouple rendering frame rate from game mechanics and eliminate catch-up spirals after tab suspension.
4. Mobile First and Touch Optimized:
   - Landscape orientation lock via CSS and manifest.
   - Pointer events (pointerdown, pointermove, pointerup, pointercancel) with proper pointerId tracking for multi-touch.
   - touch-action: none on canvas and UI layers.
   - Respect CSS safe-area insets (env(safe-area-inset-*)).
   - Prevent pinch-to-zoom, rubber-banding, double-tap zoom, and pull-to-refresh.
5. Procedural Low-Poly Visuals: No external 3D model files (.gltf or .glb). Use procedural low-poly geometries (BoxGeometry, ConeGeometry, CylinderGeometry, IcosahedronGeometry) with procedural animation, behind an asset registry keyed by id so CC0 .glb models can replace them later.
6. Translation of Unity Terms to Three.js:
   - SRP Batcher and static batching become shared materials, the runtime 256x256 palette atlas, and InstancedMesh.
   - Occlusion culling becomes frustum culling plus per-island visibility.
   - LOD tiers use THREE.LOD.
7. Mobile Budget Guardrails:
   - Active draw calls under 100 per frame.
   - Visible on-screen triangles under 150k.
   - Single real-time Directional Light (Sun/Moon).
   - Shadow map capped at 1024x1024 within 30-40 metres.
   - Dynamic storm fog pulling the camera far plane in during high tide.
   - Show draw calls, triangles, FPS, and tide phase in ?debug overlay using renderer.info.
8. Web Audio Compliance: Defer AudioContext creation or call ctx.resume() on first user pointerdown. Provide fallback for muted tabs and handle visibilitychange to pause audio and game simulation.
9. Haptics: Trigger haptic pulses for firing, taking damage, and tide alerts using safe navigator.vibrate guarded by feature detection.
10. Data Independence: Keep every GDD number (tide timings, drain rates, damage, ranges) in src/data or constants, never hardcoded inline.

## 6. Visual and UI Rules
1. Zero Emojis: Never use emojis anywhere in UI, code, comments, docs, logs, or commit messages. All representations must use clean text, symbols, or SVG icons.
2. Icons: Every icon is a custom inline SVG with one consistent stroke style in a single src/ui/icons module. PWA icons are drawn as clean SVG.
3. Palette as Typed Tokens: Every hex code is defined once as a typed token in src/data/palette.ts that feeds 3D materials, the runtime atlas, and generated CSS variables for the HUD.
4. Strict Palette Usage: Colour every prop, terrain type, enemy, and item according to the usage notes in docs/PALETTE.md.
5. Saturated Accent Limits: The saturated entries (Buoyancy Blue, Circuit Green, Ember Orange, Bio Cyan, Salvage Gold, Signal Crimson) appear only on small functional elements (barrels, loot, fire, enemy eyes and fins, the tide alert), never as large surfaces, panel backgrounds, or glows.
6. No Bloom or Glow: No bloom or post-processing glow effects. The Salvage Gold pickup rim stays subtle. Campfires and floodlights are emissive Ember Orange meshes with no extra real-time lights.
7. No Decorative Gradients or Glassmorphism: No decorative gradients and no glassmorphism in the UI. The atlas swatch gradient is the only gradient in the game.
8. HUD Styling: Flat Storm Slate and Gunmetal Grey panels with thin borders, Seafoam White text, system font stack, consistent spacing, four stat bars in their palette HUD colours, and Signal Crimson reserved exclusively for the flashing tide alert.
9. Runtime Palette Atlas: Generate the 256x256 atlas at runtime on a canvas from the tokens (8x8 grid of 32px swatches, sRGB, mipmaps, bilinear). Paint each swatch with the 3-tone vertical gradient from docs/PALETTE.md (bottom 20% 15% darker, middle 60% base, top 20% 10% lighter). Keep UVs 2 to 3 px inside each swatch. UV-map procedural meshes by swatch index so object height spans the swatch vertically.

## 7. Mandatory Agent Workflow
1. Plan First: Always review tasks/planning.md before implementing or refactoring features.
2. Track Tasks: Tick tasks/todo.md checkboxes as work progresses. Never declare a phase complete with unfulfilled criteria.
3. Log Lessons: Log every mistake, bug, or correction in tasks/lessons.md with date, mistake, and rule learned. Re-read tasks/lessons.md at the start of each session.
4. Verification: Never mark anything done until npm run build and npm test pass cleanly with zero errors.
5. Small Commits and Pushes: Commit changes with clear messages and push (git push) after completing each phase.
6. Security and Credentials: Never change git credentials, tokens, or commit private secrets.
