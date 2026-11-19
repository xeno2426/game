# Game Planning & Architecture Document

## 1. Game Design Document (GDD)

### 1.1 Pitch
A mobile-first, adrenaline-fueled 3D top-down wave-survival shooter in neon low-poly style where players pilot an agile cyber-vessel, dodging relentlessly spawning alien swarms, collecting energy gems, and drafting procedural upgrades to survive escalating waves.

### 1.2 Core 30-Second Loop
1. **Action**: Player maneuvers with the dynamic left virtual joystick, using right joystick to aim with light assist and unleash rapid-fire plasma salvos while timing tactical dashes.
2. **Feedback**: Bullets impact enemies with particle bursts, screen shake, synthesized retro audio hits, and haptic rumble pulses. Enemies flash on damage and disintegrate into glowing XP gems.
3. **Reward**: Collecting XP levels up the player, triggering an upgrade selection modal between waves (+Fire Rate, +Damage, +Move Speed, +Max Health, +Dash Recovery, +Multi-Shot).
4. **Repeat**: Waves scale in intensity with new enemy archetypes demanding tighter evasion and build synergy.

### 1.3 Player Mechanics
- **Movement**: Left virtual thumbstick (dynamic: activates wherever left screen is touched, tracks offset, normalized speed up to max speed).
- **Aim & Auto-Fire**: Right virtual thumbstick (aim direction with soft aim-assist angle snapping toward nearby threats). Auto-fires when deflected beyond a threshold.
- **Dash / Evade**: Dedicated dash button with visual cooldown radial/bar, granting a burst of speed and brief invulnerability frames.
- **Health & Survival**: Fixed HP bar with damage flash, temporary invulnerability frames on hit, and game over state when HP drops to 0.
- **Progression**: Waves escalate enemy count, spawn rate, and introduce elite varieties. Between waves, player selects one of three random upgrades.
- **Pause & Audio Toggle**: Top-bar HUD buttons for pausing game state and muting audio.

### 1.4 Enemy Archetypes
1. **Chaser (Scout)**: Red agile pyramid/cone, standard speed, moderate health, direct pursuit pathfinding.
2. **Fast (Swarm)**: Yellow nimble octahedron, high speed, lower health, maneuvers erratically to surround the player.
3. **Tank (Brute)**: Purple heavy dodecahedron/box, slow movement, high health, resistant to knockback, heavy impact damage.

---

## 2. System Architecture

### 2.1 Engine & Loop
- **Renderer**: Three.js WebGLRenderer with `antialias: true`, `powerPreference: 'high-performance'`, `pixelRatio: Math.min(window.devicePixelRatio, 2)`.
- **Camera**: Top-down perspective camera (`PerspectiveCamera(50, aspect, 0.1, 1000)`) positioned at `(0, 24, 16)` looking at player target with smooth damping interpolation.
- **Fixed Timestep**: Main game loop decouples rendering from physics/logic using a fixed 60Hz delta (`dt = 1/60`) and accumulator capped at `0.2s` to eliminate physics explosion after tab backgrounding.
- **Zero Allocations in Loop**: Pre-allocated math scratch variables (`_v1`, `_v2`, `_quat`, `_mat`) for vector math, collision detection, and matrix updates.

### 2.2 Subsystem Breakdown
```
src/
├── main.ts              # Game bootstrapper, RAF loop, state machine (Menu, Playing, WaveComplete, GameOver)
├── entities/
│   ├── Player.ts        # Player mesh, transforms, dash cooldown, stats, health
│   ├── Enemy.ts         # Enemy definitions, pooling, archetypes (Chaser, Fast, Tank)
│   ├── Bullet.ts        # Bullet pool, velocity, lifetime, instancing or pooled meshes
│   ├── Pickup.ts        # XP gems pool, magnetic attraction, collection trigger
│   └── Particle.ts      # Visual impact sparks and explosion particle pool
├── systems/
│   ├── InputSystem.ts   # Touch pointer events, multi-touch tracking, dynamic joysticks, keyboard fallback
│   ├── CombatSystem.ts  # Firing rate timer, aim assist, bullet-enemy collisions, damage resolution
│   ├── WaveSystem.ts    # Wave progression, enemy spawn quotas, wave victory triggers
│   ├── CollisionSystem.ts # Fast spatial/circle collision checks between player, enemies, bullets, gems
│   └── CameraSystem.ts  # Smooth look-at and camera follow, trauma-based screen shake
├── ui/
│   ├── TouchUI.ts       # Dynamic virtual joystick DOM overlays, dash button, pause button
│   ├── HUD.ts           # Health bar, wave indicator, score, XP progress bar, high score
│   ├── UpgradeModal.ts  # Card selection overlay between waves
│   ├── GameOverModal.ts # Score display, high score check, restart button
│   └── DebugOverlay.ts  # Active only when ?debug is present (FPS, draw calls, active entity counts)
└── audio/
    ├── SoundSynth.ts    # Web Audio API procedural sound synthesizer (shoot, hit, explosion, dash, level-up)
    └── Haptics.ts       # Safe wrapper for navigator.vibrate with pattern fallbacks
```

---

## 3. Phase Plan

### Phase 1: Mobile-First Foundation & Controls
- Set up landscape viewport, `touch-action: none`, prevent pull-to-refresh and pinch zoom.
- Construct Three.js low-poly arena, grid floor, lighting, and player cyber-ship.
- Implement multi-touch `InputSystem`:
  - Left screen half: dynamic virtual joystick for movement.
  - Right screen half: virtual joystick for aiming and auto-fire with light aim assist.
  - Dash button with cooldown indicator.
  - Pause button and safe-area insets padding.
- Desktop keyboard (WASD + mouse click/aim + Space) fallback for debugging.

### Phase 2: Gameplay Loop & Audio-Visual Polish
- Implement escalating wave director with 3 enemy types (Chaser, Fast, Tank).
- Implement bullet shooting, circle collision, enemy damage flash, and despawn.
- XP gem drops, magnetic pull toward player, and level progression.
- Inter-wave upgrade modal offering 3 random upgrades (+Damage, +Fire Rate, +Speed, +Max HP, etc.).
- Procedural WebAudio sound synthesizer: laser fire, hit thud, explosion, dash whoosh, powerup chime.
- Trauma-based 3D screen shake and `navigator.vibrate` haptic pulses.
- HUD with HP bar, score counter, wave counter, and persistent high score in `localStorage`.
- Game-over state and restart flow.

### Phase 3: Performance, Zero-Allocations & Modular Architecture
- Strict fixed timestep accumulator with lag spike clamp.
- Entity object pooling (zero dynamic `new` in tick loop) for Bullets, Enemies, XP gems, and Particles.
- InstancedMesh or pooled low-poly meshes for high performance on mobile GPUs.
- Capped pixel ratio (`Math.min(window.devicePixelRatio, 2)`).
- `?debug` FPS, draw-call, and entity count overlay.
- Complete modular code split across `src/systems`, `src/entities`, `src/ui`, and `src/audio`.

### Phase 4: Installable PWA
- Configure `vite-plugin-pwa` with service worker and offline runtime caching.
- Create web app manifest with standalone display, landscape orientation, theme colors.
- Generate high-res and maskable PWA app icons (192x192, 512x512).
- Verify build with `npm run build` and test HTTPS preview with `npm run preview -- --host`.

### Phase 5: Native Capacitor & GitHub Actions CI/CD
- Install and configure `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`.
- Configure `capacitor.config.ts` (appId `com.xeno2426.game`, webDir `dist`).
- Add Android platform: `npx cap add android` and `npx cap sync`.
- Create GitHub Actions workflow (`.github/workflows/build-android.yml`) with Node LTS, required JDK (Java 21 for modern Gradle/Capacitor), `npm ci`, `npm run build`, `npx cap sync`, `./gradlew assembleDebug`, and upload APK artifact.
- Verify end-to-end build and commit/push.

---

## 4. Assumptions & Edge Cases
1. **Device Orientation**: Mobile devices run primarily in landscape orientation. CSS orientation queries and locked manifest configuration ensure optimal aspect ratio.
2. **Audio Autoplay Restrictions**: AudioContext initializes in suspended state and resumes seamlessly upon first user touch or start interaction.
3. **No External Asset Dependencies**: All visual assets (models, textures) are procedurally generated using Three.js low-poly primitives, canvas textures, and WebAudio oscillators, ensuring 100% offline capability and zero network latency.
4. **Multi-Touch Conflicts**: Pointer events track unique `pointerId`s so simultaneous moving, aiming, and dashing never interfere with each other.

---

## 5. Skills Utilized
- **`game-development`**: Core game loop (input -> update -> render), fixed timestep architecture, pattern selection (state machine + object pooling), performance budgeting.
- **`web-games`**: Browser constraints handling, visibility change pausing, Web Audio API unlocking, PWA offline caching, hybrid DOM UI with WebGL canvas.
- **`3d-games`**: Low-poly rendering pipeline, camera look-at smoothing, collision geometries (circles/spheres/AABB), ambient & directional lighting without heavy real-time dynamic shadows.
- **`game-design`**: 30-second core loop, escalating difficulty curves, meaningful between-wave upgrade choices, risk/reward XP collection.
- **`game-audio`**: Sound synthesis with oscillator layers, audio priority hierarchy, frequency ducking, volume normalization, and sensory feedback pairing with vibration.
