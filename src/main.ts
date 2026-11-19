import * as THREE from 'three';
import { InputSystem } from './systems/InputSystem';
import { Player } from './entities/Player';
import { CameraSystem } from './systems/CameraSystem';
import { TouchUI } from './ui/TouchUI';

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

// Arena: Grid Floor & Neon Perimeter
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

// Boundary wall markers / neon perimeter
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

// Player Entity
const player = new Player();
scene.add(player.mesh);

// Input & UI
const inputSystem = new InputSystem();
const touchUI = new TouchUI(uiLayer, inputSystem);

let isPaused = false;
touchUI.onResumeCallback = () => {
  isPaused = false;
};
touchUI.onRestartCallback = () => {
  player.reset();
  isPaused = false;
};

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

function gameLoop(currentTime: number) {
  requestAnimationFrame(gameLoop);

  const frameTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  // Clamp lag spikes to prevent spiral
  accumulator += Math.min(frameTime, 0.2);

  // Handle pause input
  if (inputSystem.consumePause()) {
    isPaused = touchUI.togglePause();
  }

  while (accumulator >= fixedDelta) {
    if (!isPaused) {
      // Desktop keyboard fallback update
      inputSystem.updateDesktopFallback();

      // Dash check
      if (inputSystem.consumeDash()) {
        const dashed = player.triggerDash();
        if (dashed) {
          cameraSystem.addTrauma(0.25);
        }
      }

      // Update player
      player.update(
        fixedDelta,
        inputSystem.moveVector,
        inputSystem.aimVector,
        inputSystem.isAiming
      );

      // Camera follow
      cameraSystem.update(fixedDelta, player.position);
    }
    accumulator -= fixedDelta;
  }

  // Update Touch UI
  const dashCooldownRatio = player.dashCooldownTimer / player.stats.dashCooldown;
  touchUI.update(inputSystem, dashCooldownRatio);

  // Render scene
  renderer.render(scene, cameraSystem.camera);
}

requestAnimationFrame(gameLoop);
