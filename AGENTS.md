# AGENTS.md — Developer & Agent Guide

## 1. Project Overview
A high-performance, mobile-first 3D top-down wave-survival shooter built for the web, installable as a Progressive Web App (PWA) and deployable as a native Android APK via Capacitor. The game runs smoothly in mobile landscape mode featuring dynamic dual virtual joysticks, dash mechanics, auto-fire with light aim assist, escalating enemy waves, XP upgrades, procedural WebAudio sound synthesis, vibration haptics, and zero per-frame garbage collection.

## 2. Tech Stack
- **Runtime & Bundler**: Vite (vanilla-ts)
- **Language**: TypeScript (strict mode)
- **Rendering Engine**: Three.js (low-poly 3D primitives, custom materials, instancing, fixed camera perspective)
- **Audio**: Web Audio API (procedurally synthesized sound effects and adaptive retro audio; zero external audio files)
- **Haptics**: Web Vibration API (`navigator.vibrate`)
- **PWA**: `vite-plugin-pwa` (service worker, offline caching, web manifest, maskable icons)
- **Native Packaging**: Capacitor (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`) targeting Android with CI/CD build via GitHub Actions

## 3. Project Commands
- `npm run dev`: Start local development server (port 5173, bound to 0.0.0.0 / host)
- `npm run build`: Type-check (`tsc`) and compile production bundle to `dist/`
- `npm run preview`: Serve production bundle locally (port 4173)
- `npx cap sync`: Copy web assets (`dist/`) into native platform project (`android/`)
- `npx cap open android`: Open Android Studio project (when running locally)

## 4. Folder Structure
```
game/
├── .agent/skills/         # Agent skills and guidelines
├── .github/workflows/     # CI/CD workflows (Android APK build artifact)
├── android/               # Capacitor Android native project
├── public/                # Static assets, web manifest, PWA icons
├── src/
│   ├── audio/             # Sound synthesizer, music & sound effect managers
│   ├── entities/          # Player, Enemy, Bullet, Pickup, Particle definitions
│   ├── systems/           # Input, Combat, Spawner, Collision, Physics, Wave systems
│   ├── ui/                # Touch controls, HUD, Joystick, Modals, FPS counter
│   ├── main.ts            # Main game loop, scene initialization, lifecycle
│   └── style.css          # Mobile reset, safe-area insets, HUD styling
├── tasks/
│   ├── planning.md        # GDD, system architecture, phase roadmap
│   ├── todo.md            # Phased checklist and upgrade backlog
│   └── lessons.md         # Mistake and correction log
├── AGENTS.md              # Project rules and workflow guide
├── capacitor.config.ts    # Capacitor configuration
├── index.html             # Entry HTML with viewport & PWA meta tags
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite & PWA configuration
```

## 5. Coding Rules & Constraints
1. **Zero Per-Frame Allocations**: Never instantiate `new THREE.Vector3()`, `new THREE.Matrix4()`, closures, or arrays inside the update or render loops. Reuse pre-allocated scratch objects and pool instances.
2. **Object Pooling**: Pre-allocate fixed pools for bullets, enemy meshes, XP gems, and visual hit particles. Recycle inactive entities immediately.
3. **Fixed Timestep Simulation**: Run physics and game simulation at a fixed rate (e.g., 60 Hz) with an accumulator to decouple rendering frame rate from game mechanics and avoid catch-up spirals.
4. **Mobile First & Touch Optimized**:
   - Landscape orientation lock via CSS and manifest.
   - Pointer events (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`) with proper `pointerId` tracking for multi-touch.
   - `touch-action: none` on canvas and UI layers.
   - Respect CSS safe-area insets (`env(safe-area-inset-*)`).
   - Prevent pinch-to-zoom, rubber-banding, double-tap zoom, and pull-to-refresh.
5. **Procedural Low-Poly Visuals**: No external 3D model files (`.gltf`/`.glb`). Use procedural low-poly geometries (`BoxGeometry`, `ConeGeometry`, `CylinderGeometry`, `IcosahedronGeometry`) with vibrant stylized materials.
6. **Web Audio Compliance**: Defer `AudioContext` creation or call `ctx.resume()` upon user interaction (first touch or start button). Provide fallback for muted tabs and handle `visibilitychange` to pause audio and game simulation.
7. **Haptics**: Trigger haptic pulses for firing, taking damage, and level-up events using safe `navigator.vibrate` calls guarded by feature detection.
8. **Debug Mode**: Expose debug overlays (FPS counter, draw call count, entity count) only when `?debug` query parameter is present.

## 6. Mandatory Agent Workflow
1. **Plan First**: Always review `tasks/planning.md` before implementing or refactoring features.
2. **Track Tasks**: Check off items in `tasks/todo.md` as work progresses; never declare a phase complete with unfulfilled criteria.
3. **Log Lessons**: Log every mistake, bug, or correction in `tasks/lessons.md` with date, mistake, and rule learned. Re-read `tasks/lessons.md` at the start of each session.
4. **Build Verification**: Run `npm run build` and ensure zero TypeScript errors or bundling failures before marking anything done.
5. **Small Commits & Pushes**: Commit changes with clear messages and push (`git push`) after completing each phase.
6. **Security & Credentials**: Never modify git credentials, tokens, or commit private secrets or keys.
