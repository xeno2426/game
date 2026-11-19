# Tidebound

Tidebound is a 3D stylized low-poly survival and base-building game set across a flooded, overgrown industrial archipelago. Designed for mobile browsers and Android via Capacitor, the core loop is governed by a dynamic 15-minute tide and monsoon storm cycle: low tide reveals sunken ruins, shipping containers, and high-tier scrap, while high tide and monsoons submerge lower islands, requiring players to construct elevated stilt bases or navigate modular rafts.

## 1. Overview and Core Systems

- **Dynamic Tide Simulation**: 15-minute cycle divided into Low Tide (6 min), Rising Warning (2 min), High Tide / Monsoon (5 min), and Ebb (2 min).
- **Survival Vitals**: Real-time simulation of Health, Hydration, Hunger, and Exposure with critical damage triggers and shelter mitigation.
- **Base Building**: Snap-grid modular construction system featuring foundations, stilts, walls, doorframes, and roofs with magnetic socket snapping.
- **Crafting and Stations**: 12-slot inventory with recipe station requirements (Campfire for cooking and exposure relief, Workbench for advanced crafting).
- **Combat and Enemies**: Soft-lock melee chopping and ranged slingshot with aim assist against Muddy Ochre Feral Hounds and Kelp Dark Tide Lurkers.
- **Modular Raft**: Water-buoyant vessel sampling multi-octave ocean wave displacement with steerable wind sailing.
- **Persistence**: IndexedDB auto-save and state restoration covering vitals, inventory, structures, tide progression, and salvage crates.

## 2. Controls

### Mobile Touch Controls
- **Virtual Joystick (Left Screen)**: Drag anywhere on the left half of the display to move. Deflect past 75% radius to sprint.
- **Camera Orbit (Right Screen)**: Drag on the right half of the display to rotate yaw and pitch.
- **Action Buttons**: Dedicated touch buttons on the right HUD for Attack/Chop, Jump, Interact/Harvest, Radial Build Menu, and Inventory.
- **Quick Bar**: Tap any of the 5 bottom quick slots to select tools, weapons, and consumables.

### Desktop Controls
- **Move**: W / A / S / D or Arrow Keys
- **Sprint**: Left Shift / Right Shift
- **Jump**: Space
- **Interact / Harvest / Board**: E
- **Attack / Chop / Place**: Left Mouse Click
- **Camera Look**: Right Mouse Drag or Pointer Lock
- **Rotate Building (90 deg)**: R
- **First Person View Toggle**: F
- **Radial Build Menu**: B
- **Inventory / Crafting Modal**: I or Tab
- **Cancel Placement / Close Menus**: Escape
- **Quick Slots**: Keys 1 to 5

## 3. Project Commands

- `npm run dev`: Start local Vite development server on port 5173 (`--host`).
- `npm run build`: Run TypeScript compiler (`tsc`) and compile production bundle to `dist/`.
- `npm test`: Run test suite with Vitest.
- `npm run preview`: Serve the production build locally on port 4173.
- `npx cap sync`: Synchronize web assets from `dist/` to the Capacitor native Android project.

## 4. Folder Structure

```
game/
├── .agent/skills/         # Agent skills and guidelines
├── .github/workflows/     # CI/CD workflows for Android APK release
├── android/               # Capacitor Android native project
│   └── app/src/main/res/  # Launcher mipmaps, splash screens, and strings.xml
├── docs/                  # Design documentation (GDD.md, PALETTE.md)
├── public/                # Static assets, SVG icons, and PWA manifest
├── scripts/               # Icon and asset generation scripts
├── src/
│   ├── audio/             # Synthesized Web Audio managers (procedural SFX)
│   ├── core/              # GameLoop, InputManager, CameraController, SaveSystem
│   ├── data/              # Palette tokens, recipes, blueprints, constants
│   ├── entities/          # Player, Enemy, Raft, ResourceNode, AssetRegistry
│   ├── logic/             # Pure tested game logic (tide, vitals, crafting, building)
│   ├── systems/           # BuildingSystem, CombatSystem, CraftingSystem, VitalsSystem
│   ├── ui/                # HUD, TouchControls, BuildMenuUI, InventoryUI, DebugOverlay
│   ├── world/             # Seeded terrain, procedural water shader, tide, weather
│   ├── main.ts            # Bootstrapper and lifecycle orchestration
│   └── style.css          # Mobile reset, safe areas, HUD styles
├── tasks/
│   ├── planning.md        # Architecture and phased implementation roadmap
│   ├── todo.md            # Task checklist and upgrade backlog
│   └── lessons.md         # Mistake and architectural rule log
├── tests/                 # Vitest regression suites and static linters
├── AGENTS.md              # Project rules, performance budgets, and guidelines
├── capacitor.config.ts    # Capacitor configuration
├── index.html             # Entry HTML with landscape lock and viewport meta
├── package.json           # Dependencies and build scripts
├── tsconfig.json          # TypeScript strict configuration
└── vite.config.ts         # Vite bundler and vite-plugin-pwa configuration
```

## 5. How to Build the Native Android APK

### Prerequisites
- Node.js 20+
- Java 21 JDK (Temurin 21 recommended)
- Android SDK (API 34 or 35) with Android Build Tools and CMake

### Local Build Steps
1. Install project dependencies:
   ```bash
   npm install
   ```
2. Build the web application bundle:
   ```bash
   npm run build
   ```
3. Sync web assets and plugins to the native Android directory:
   ```bash
   npx cap sync android
   ```
4. Build debug or release APK using Gradle:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
   The compiled APK will be located at:
   `android/app/build/outputs/apk/debug/app-debug.apk`

### CI/CD Workflow
The repository includes automated GitHub Actions workflow (`.github/workflows/build-android.yml`) that configures Java 21, sets up Android SDK 34, runs type checking, builds the production bundle, syncs Capacitor, and uploads the built APK artifact on every push to main.

## 6. Architecture and Performance Constraints

- **Zero Per-Frame Allocations**: No Vector3, Matrix4, closure, or array instantiations inside physics or render loops.
- **Strict Color Tokens**: All colors adhere to docs/PALETTE.md via `src/data/palette.ts` without raw hex literals in application code.
- **Lightweight Low-Poly Rendering**: Procedural primitives with runtime-generated palette atlas material, capped under 100 draw calls and 150k triangles on mobile devices.
- **Procedural Audio**: 100% synthesized Web Audio effects with zero external audio assets.
- **Clean Vector Icons**: Custom inline SVG graphics across HUD and controls with no decorative emojis anywhere.
