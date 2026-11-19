# Development Checklist & Upgrade Backlog

## Phase 1: Mobile-First Foundation & Controls
- [x] Viewport setup: landscape lock, `touch-action: none`, prevent pull-to-refresh & pinch-zoom, safe-area insets
- [x] Three.js 3D scene: arena bounds, grid ground, lighting, low-poly player cyber-ship
- [x] Multi-touch pointer tracking system with distinct `pointerId` management
- [x] Left dynamic virtual joystick (appears on touch down, smooth directional vector)
- [x] Right virtual joystick (aim vector with light aim-assist lock onto nearest target, auto-fire trigger)
- [x] Dash button with cooldown animation/radial indicator
- [x] Pause button with safe-area padding and overlay
- [x] Desktop fallback controls (WASD movement, mouse aim/fire, Space dash)
- [x] Phase 1 verification: `npm run build`, test controls, git commit & push

## Phase 2: Gameplay Loop & Audio-Visual Polish
- [x] Escalating wave director: wave timer, spawn intervals, wave clear detection
- [x] 3 distinct enemy archetypes:
  - [x] Chaser (Scout): medium speed, direct pursuit
  - [x] Fast (Swarm): high speed, flanking/encircling
  - [x] Tank (Brute): slow, high HP, heavy impact
- [x] Bullet shooting system with collision detection and enemy damage flashing
- [x] XP gem drops from defeated enemies, magnetic attraction toward player, level progression
- [x] Inter-wave upgrade selection modal (choose 1 of 3 randomized perks)
- [x] Procedural Web Audio synthesizer (laser shot, impact, explosion, dash whoosh, level-up chime)
- [x] Trauma-based screen shake on hit/explosion
- [x] Vibration haptics (`navigator.vibrate`) on firing, damage, and level-up
- [x] HUD: health bar, wave counter, score, XP progress bar, persistent high score in `localStorage`
- [x] Game-over screen with final score, new high score banner, and restart button
- [x] Phase 2 verification: `npm run build`, git commit & push

## Phase 3: Performance, Zero-Allocations & Architecture
- [ ] Strict fixed-timestep loop (60 Hz) with delta accumulator and lag clamp
- [ ] Object pooling for Bullets, Enemies, XP gems, and Particle effects (zero dynamic allocations during gameplay)
- [ ] Low-poly primitives only with optimized materials (no external 3D model files)
- [ ] Capped device pixel ratio (`Math.min(window.devicePixelRatio, 2)`)
- [ ] FPS, draw-call, and entity count overlay enabled via `?debug` URL query parameter
- [ ] Clean modular code architecture (`src/systems/`, `src/entities/`, `src/ui/`, `src/audio/`)
- [ ] Tab visibility change handler (`visibilitychange`) to pause simulation and mute/suspend audio
- [ ] Phase 3 verification: `npm run build`, profile memory/FPS, git commit & push

## Phase 4: Installable Progressive Web App (PWA)
- [ ] Integrate `vite-plugin-pwa`
- [ ] Configure web manifest (name, short_name, standalone display, landscape orientation, theme colors)
- [ ] Generate high-resolution icons and maskable icons (192x192, 512x512)
- [ ] Configure service worker caching strategy for complete offline play
- [ ] Test production build (`npm run build`) and serve via `npm run preview -- --host`
- [ ] Phase 4 verification: `npm run build`, verify PWA manifest in build, git commit & push

## Phase 5: Capacitor Android & GitHub Actions CI/CD
- [ ] Install Capacitor dependencies (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`)
- [ ] Configure `capacitor.config.ts` (appId `com.xeno2426.game`, app name, `webDir: 'dist'`, base `./`)
- [ ] Initialize Android native platform (`npx cap add android` and `npx cap sync`)
- [ ] Create GitHub Actions workflow `.github/workflows/build-android.yml`
  - [ ] Set up modern Node LTS
  - [ ] Set up JDK (Java 21 required by modern Gradle/Capacitor)
  - [ ] Run `npm ci` and `npm run build`
  - [ ] Run `npx cap sync`
  - [ ] Build Android debug APK (`./gradlew assembleDebug` in `android/`)
  - [ ] Upload APK as downloadable artifact (`actions/upload-artifact`)
- [ ] Phase 5 verification: `npm run build`, verify CI workflow syntax, git commit & push

---

## Upgrade Backlog (Top Enhancements)
1. [ ] **More Enemy Types**: Add Exploder (kamikaze bomb with blast radius on death), Sniper (long-range telegraph laser), and Summoner (spawns mini-drones).
2. [ ] **Weapon Upgrades & Synergies**: Add weapon evolution choices: Triple Spread Shot, Continuous Laser Beam, Ricochet Plasma Orbs, and Homing Missiles.
3. [ ] **Special In-Game Pickups**: Spawn temporary combat power-ups: Nuke Smart-Bomb (clears screen), Invulnerability Shield Bubble, Super Magnet (absorbs all gems on map), and Slow-Mo Overdrive.
4. [ ] **Boss Waves**: Every 5th wave spawns a gargantuan Boss Mech featuring multiple attack patterns (bullet hell spirals, charge rush, summon minions) and health phase changes.
5. [ ] **Settings Menu & Audio Sliders**: Add pause menu configuration for Master/SFX/Music volume sliders, Haptic Feedback toggle, Graphics Quality selector (low-poly shadows vs flat), and Joystick Sensitivity.
6. [ ] **Vessel Skins & Customization**: Unlockable player hull skins (Neon Cyber, Void Stealth, Golden Apex) and customizable projectile visual color trails.
