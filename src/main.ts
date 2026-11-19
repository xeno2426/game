import * as THREE from 'three';
import { InputSystem } from './systems/InputSystem';
import { Player } from './entities/Player';
import { CameraSystem } from './systems/CameraSystem';
import { TouchUI } from './ui/TouchUI';
import { HUD } from './ui/HUD';
import { BulletPool } from './entities/Bullet';
import { EnemyPool } from './entities/Enemy';
import { PickupPool } from './entities/Pickup';
import { ParticlePool } from './entities/Particle';
import { WaveSystem } from './systems/WaveSystem';
import { CombatSystem } from './systems/CombatSystem';
import { CollisionSystem } from './systems/CollisionSystem';
import { sound } from './audio/SoundSynth';
import { Haptics } from './audio/Haptics';

// Initialize Three.js scene & renderer
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const uiLayer = document.getElementById('ui-layer') as HTMLElement;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x060812);
scene.fog = new THREE.FogExp2(0x060812, 0.015);

// Camera System
const cameraSystem = new CameraSystem(window.innerWidth / window.innerHeight);

// Lighting
const hemiLight = new THREE.HemisphereLight(0x77aaff, 0x112233, 1.2);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0x00f0ff, 1.8);
dirLight.position.set(20, 40, 20);
scene.add(dirLight);

// Arena: Grid Floor & Boundary Lines
const arenaSize = 54;
const gridHelper = new THREE.GridHelper(arenaSize, 36, 0x00f0ff, 0x152238);
gridHelper.position.y = 0.01;
scene.add(gridHelper);

const groundGeo = new THREE.PlaneGeometry(arenaSize, arenaSize);
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x070b16,
  roughness: 0.8,
  metalness: 0.2,
});
const groundMesh = new THREE.Mesh(groundGeo, groundMat);
groundMesh.rotation.x = -Math.PI / 2;
scene.add(groundMesh);

const boundaryLineGeo = new THREE.BufferGeometry();
const half = arenaSize / 2;
const boundaryPts = [
  new THREE.Vector3(-half, 0.1, -half),
  new THREE.Vector3(half, 0.1, -half),
  new THREE.Vector3(half, 0.1, half),
  new THREE.Vector3(-half, 0.1, half),
  new THREE.Vector3(-half, 0.1, -half),
];
boundaryLineGeo.setFromPoints(boundaryPts);
const boundaryLineMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, linewidth: 2 });
const boundaryLines = new THREE.Line(boundaryLineGeo, boundaryLineMat);
scene.add(boundaryLines);

// Entities & Object Pools
const player = new Player();
scene.add(player.mesh);

const bulletPool = new BulletPool(scene, 100);
const enemyPool = new EnemyPool(scene, 60);
const pickupPool = new PickupPool(scene, 80);
const particlePool = new ParticlePool(scene, 120);

// Systems & UI
const inputSystem = new InputSystem();
const touchUI = new TouchUI(uiLayer, inputSystem);
const hud = new HUD(uiLayer);
const waveSystem = new WaveSystem(enemyPool);
const combatSystem = new CombatSystem();

let isPaused = false;
let isGameOver = false;
let isChoosingUpgrade = false;

// Callbacks
touchUI.onResumeCallback = () => {
  isPaused = false;
};
touchUI.onRestartCallback = () => {
  restartGame();
};

hud.onRestartCallback = () => {
  restartGame();
};

waveSystem.onWaveCompleteCallback = (completedWave: number) => {
  isChoosingUpgrade = true;
  hud.showUpgradeModal(player, () => {
    isChoosingUpgrade = false;
    waveSystem.startWave(completedWave + 1);
  });
};

function restartGame() {
  player.reset();
  bulletPool.deactivateAll();
  enemyPool.deactivateAll();
  pickupPool.deactivateAll();
  particlePool.deactivateAll();
  combatSystem.reset();
  waveSystem.reset();
  hud.reset();
  isPaused = false;
  isGameOver = false;
  isChoosingUpgrade = false;
  waveSystem.startWave(1);
}

// Start first wave
waveSystem.startWave(1);

// Window resize handling
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  cameraSystem.resize(w, h);
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Fixed Timestep Loop
const fixedDelta = 1 / 60;
let lastTime = performance.now();
let accumulator = 0;
let totalGameTime = 0;

function gameLoop(currentTime: number) {
  requestAnimationFrame(gameLoop);

  const frameTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  accumulator += Math.min(frameTime, 0.2);

  // Pause toggle handling
  if (inputSystem.consumePause() && !isGameOver && !isChoosingUpgrade) {
    isPaused = touchUI.togglePause();
  }

  while (accumulator >= fixedDelta) {
    if (!isPaused && !isGameOver && !isChoosingUpgrade) {
      totalGameTime += fixedDelta;

      // Update Desktop fallback
      inputSystem.updateDesktopFallback();

      // Dash check
      if (inputSystem.consumeDash()) {
        const dashed = player.triggerDash();
        if (dashed) {
          particlePool.burst(player.position.x, 0.4, player.position.z, 0xffea00, 8, 5);
          sound.playDash();
          Haptics.dash();
          cameraSystem.addTrauma(0.2);
        }
      }

      // Update Player
      player.update(
        fixedDelta,
        inputSystem.moveVector,
        inputSystem.aimVector,
        inputSystem.isAiming
      );

      // Update Wave System
      waveSystem.update(fixedDelta);

      // Update Combat System (auto-fire, aim assist)
      combatSystem.update(fixedDelta, player, inputSystem, bulletPool, enemyPool);

      // Update Active Bullets
      const bullets = bulletPool.pool;
      for (let i = 0; i < bullets.length; i++) {
        if (bullets[i].active) {
          bullets[i].update(fixedDelta);
        }
      }

      // Update Active Enemies
      const enemies = enemyPool.pool;
      for (let i = 0; i < enemies.length; i++) {
        if (enemies[i].active) {
          enemies[i].update(fixedDelta, player.position, totalGameTime);
        }
      }

      // Update Active XP Pickups
      const pickups = pickupPool.pool;
      for (let i = 0; i < pickups.length; i++) {
        if (pickups[i].active) {
          pickups[i].update(fixedDelta, player.position, player.stats.pickupRadius, totalGameTime);
        }
      }

      // Update Particles
      particlePool.update(fixedDelta);

      // Run Collisions
      CollisionSystem.checkCollisions(
        player,
        bulletPool,
        enemyPool,
        pickupPool,
        particlePool,
        cameraSystem,
        (scoreGain) => hud.addScore(scoreGain),
        (xpGain) => hud.addXp(xpGain),
        () => {
          isGameOver = true;
          hud.showGameOver(hud.score, waveSystem.currentWave);
        }
      );

      // Update Camera & Shake
      cameraSystem.update(fixedDelta, player.position);

      // Update HUD
      hud.update(player, waveSystem.currentWave);
    }
    accumulator -= fixedDelta;
  }

  // Update Touch UI joysticks & cooldowns
  const dashCooldownRatio = player.dashCooldownTimer / player.stats.dashCooldown;
  touchUI.update(inputSystem, dashCooldownRatio);

  // Render Scene
  renderer.render(scene, cameraSystem.camera);
}

requestAnimationFrame(gameLoop);
