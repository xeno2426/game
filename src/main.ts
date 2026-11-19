import * as THREE from 'three';
import { injectPaletteCSSVariables, PALETTE_COLORS } from './data/palette';
import { GameLoop } from './core/GameLoop';
import { InputManager } from './core/InputManager';
import { CameraController } from './core/CameraController';
import { SaveSystem } from './core/SaveSystem';
import { Terrain } from './world/Terrain';
import { Water } from './world/Water';
import { TideSystem } from './world/TideSystem';
import { Weather } from './world/Weather';
import { Player } from './entities/Player';
import { Raft } from './entities/Raft';
import { Enemy } from './entities/Enemy';
import { ResourceNode } from './entities/ResourceNode';
import { AssetRegistry } from './entities/AssetRegistry';
import { VitalsSystem } from './systems/VitalsSystem';
import { InteractionSystem } from './systems/InteractionSystem';
import { CraftingSystem } from './systems/CraftingSystem';
import { BuildingSystem } from './systems/BuildingSystem';
import { CombatSystem } from './systems/CombatSystem';
import { HUD } from './ui/HUD';
import { TouchControls } from './ui/TouchControls';
import { InventoryUI } from './ui/InventoryUI';
import { BuildMenuUI } from './ui/BuildMenuUI';
import { DebugOverlay } from './ui/DebugOverlay';
import { SoundSynth } from './audio/SoundSynth';
import { BUDGET_CONSTANTS } from './data/constants';

async function bootstrap() {
  injectPaletteCSSVariables();
  await SaveSystem.init();

  // Create WebGL Renderer
  const canvas = document.createElement('canvas');
  canvas.id = 'game-canvas';
  document.getElementById('app')?.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();

  // Directional Light (Sun/Moon - single real-time light)
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(45, 60, 35);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = BUDGET_CONSTANTS.SHADOW_MAP_SIZE;
  dirLight.shadow.mapSize.height = BUDGET_CONSTANTS.SHADOW_MAP_SIZE;
  dirLight.shadow.camera.near = 10;
  dirLight.shadow.camera.far = 120;
  const d = BUDGET_CONSTANTS.SHADOW_MAX_DISTANCE;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  scene.add(dirLight);

  // Hemisphere Light (Sky Coastal Mist, Ground Sun-Bleached Sand)
  const hemiLight = new THREE.HemisphereLight(
    PALETTE_COLORS.CoastalMist,
    PALETTE_COLORS.SunBleachedSand,
    0.8
  );
  scene.add(hemiLight);

  // Core Subsystems
  const debugOverlay = new DebugOverlay();
  const tideSystem = new TideSystem(scene, dirLight, hemiLight, debugOverlay.timescale);
  const weather = new Weather(scene);
  const terrain = new Terrain(scene);
  const water = new Water(scene);
  const player = new Player(scene);

  const cameraController = new CameraController(window.innerWidth / window.innerHeight);
  const inputManager = new InputManager();

  const hud = new HUD();
  const vitalsSystem = new VitalsSystem(hud);
  const interactionSystem = new InteractionSystem(hud);
  const craftingSystem = new CraftingSystem(hud);
  const buildingSystem = new BuildingSystem(scene, craftingSystem, terrain);
  const combatSystem = new CombatSystem();

  new TouchControls(inputManager);
  const inventoryUI = new InventoryUI(craftingSystem, vitalsSystem);
  const buildMenuUI = new BuildMenuUI(buildingSystem);

  // Crosshair element for aiming
  const crosshair = document.createElement('div');
  crosshair.className = 'crosshair';
  document.getElementById('app')?.appendChild(crosshair);

  // Spawning Initial World Entities
  const assetReg = AssetRegistry.get();

  // 1. Palm Trees
  const treeCoords = [
    [10, 8], [-12, 14], [18, -6], [-8, -12], [22, 10], [-18, 5]
  ];
  treeCoords.forEach(([x, z], i) => {
    const y = terrain.getHeight(x, z);
    const treeMesh = assetReg.createPalmTree();
    scene.add(treeMesh);
    interactionSystem.registerNode(
      new ResourceNode(
        `tree_${i}`,
        'tree',
        treeMesh,
        new THREE.Vector3(x, y, z),
        3,
        [
          { itemId: 'wood_log', count: 3 },
          { itemId: 'palm_frond', count: 2 },
          { itemId: 'coconut', count: 1 },
        ]
      )
    );
  });

  // 2. Scrap Piles
  const scrapCoords = [
    [15, -15], [-16, -18], [25, 2], [-22, -8]
  ];
  scrapCoords.forEach(([x, z], i) => {
    const y = terrain.getHeight(x, z);
    const scrapMesh = assetReg.createScrapPile();
    scene.add(scrapMesh);
    interactionSystem.registerNode(
      new ResourceNode(
        `scrap_${i}`,
        'scrap_pile',
        scrapMesh,
        new THREE.Vector3(x, y, z),
        2,
        [
          { itemId: 'scrap_metal', count: 3 },
          { itemId: 'bolts', count: 4 },
        ]
      )
    );
  });

  // 3. Plastic Blue Barrels
  const barrelCoords = [
    [28, -20], [-25, 18], [8, -28]
  ];
  barrelCoords.forEach(([x, z], i) => {
    const y = terrain.getHeight(x, z);
    const barrelMesh = assetReg.createPlasticBarrel();
    scene.add(barrelMesh);
    interactionSystem.registerNode(
      new ResourceNode(
        `barrel_${i}`,
        'plastic_barrel',
        barrelMesh,
        new THREE.Vector3(x, y, z),
        1,
        [
          { itemId: 'plastic_barrel', count: 1 },
          { itemId: 'rope', count: 1 },
        ]
      )
    );
  });

  // 4. Sunken Shipping Containers (Low Tide Exposed)
  const containerMeshRed = assetReg.createShippingContainer(false);
  scene.add(containerMeshRed);
  interactionSystem.registerNode(
    new ResourceNode(
      'container_red',
      'shipping_container',
      containerMeshRed,
      new THREE.Vector3(38, 1.2, 10),
      4,
      [
        { itemId: 'scrap_metal', count: 5 },
        { itemId: 'cloth', count: 4 },
      ],
      true
    )
  );

  const containerMeshBlue = assetReg.createShippingContainer(true);
  scene.add(containerMeshBlue);
  interactionSystem.registerNode(
    new ResourceNode(
      'container_blue',
      'sunken_electronics',
      containerMeshBlue,
      new THREE.Vector3(-35, 1.0, -25),
      4,
      [
        { itemId: 'copper_wire', count: 4 },
        { itemId: 'circuit_board', count: 2 },
        { itemId: 'battery', count: 1 },
      ],
      true
    )
  );

  // 5. Enemies: Feral Hound and Tide Lurker
  const hound = new Enemy('hound_1', 'hound', new THREE.Vector3(18, 0, 16), scene);
  combatSystem.registerEnemy(hound);

  const lurker = new Enemy('lurker_1', 'lurker', new THREE.Vector3(32, 0, -32), scene);
  combatSystem.registerEnemy(lurker);

  // 6. Modular Raft
  const raft = new Raft(new THREE.Vector3(25, 0, -18), scene);

  // Unlock Audio on first pointerdown
  window.addEventListener(
    'pointerdown',
    () => {
      SoundSynth.get().unlock();
    },
    { once: true }
  );

  // Resize handling
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    cameraController.camera.aspect = window.innerWidth / window.innerHeight;
    cameraController.camera.updateProjectionMatrix();
  });

  // Main Fixed Timestep Loop
  let accumulatedTime = 0;
  let saveTimer = 0;
  let wasWarning = false;

  const gameLoop = new GameLoop(
    (dt: number) => {
      accumulatedTime += dt;
      saveTimer += dt;

      inputManager.update();

      // Camera view toggle
      if (inputManager.state.isFirstPersonTogglePressed) {
        cameraController.toggleFirstPerson();
        inputManager.state.isFirstPersonTogglePressed = false;
      }

      // Build menu toggle
      if (inputManager.state.isBuildMenuTogglePressed) {
        buildMenuUI.toggle();
        inputManager.state.isBuildMenuTogglePressed = false;
      }

      // Inventory toggle
      if (inputManager.state.isInventoryTogglePressed) {
        inventoryUI.toggle();
        inputManager.state.isInventoryTogglePressed = false;
      }

      // Quick slot selection
      craftingSystem.setActiveQuickSlot(inputManager.state.activeQuickSlot);
      player.equipItem(craftingSystem.getActiveItem());

      // Rotate building
      if (inputManager.state.isRotatePressed) {
        buildingSystem.rotate90();
        inputManager.state.isRotatePressed = false;
      }

      // Tide simulation
      const tideState = tideSystem.update(dt);
      hud.updateTide(tideState.phase, tideSystem.getTimeRemainingInPhase());

      // Audio cue on warning phase enter
      if (tideState.isWarning && !wasWarning) {
        wasWarning = true;
        SoundSynth.get().playThunder();
        SoundSynth.get().playTideAlert();
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      } else if (!tideState.isWarning) {
        wasWarning = false;
      }

      // Water update
      water.update(accumulatedTime, tideState.waterLevel);

      // Player update
      const camYaw = cameraController.getYaw();
      const { hasAttacked } = player.update(
        dt,
        inputManager.state,
        camYaw,
        terrain,
        tideState.waterLevel,
        vitalsSystem.vitals.stamina
      );

      // Vitals update
      vitalsSystem.update(dt, {
        isSprinting: inputManager.state.isSprinting,
        isSwimming: player.isSwimming,
        isInStorm: tideState.isHighTide,
      });

      // Raft update
      const distToRaft = player.position.distanceTo(raft.position);
      raft.isPlayerBoarded = distToRaft < 2.0;
      raft.update(dt, accumulatedTime, tideState.waterLevel, {
        moveX: inputManager.state.moveX,
        moveZ: inputManager.state.moveZ,
      });

      // Weather update
      weather.update(dt, tideState.stormIntensity, player.position);

      // Interaction check
      interactionSystem.update(player.position, tideState.phase === 'low' || tideState.phase === 'warning');

      if (inputManager.state.isInteractPressed) {
        const yields = interactionSystem.triggerInteract();
        if (yields) {
          for (const y of yields) {
            craftingSystem.addItem(y.itemId, y.count);
          }
        }
        inputManager.state.isInteractPressed = false;
      }

      // Building ghost update
      const forward = cameraController.getForwardVector();
      buildingSystem.update(player.position, forward);

      // Combat update
      combatSystem.update(player, forward);
      if (combatSystem.targetLockedEnemy) {
        crosshair.classList.add('target-locked');
      } else {
        crosshair.classList.remove('target-locked');
      }

      if (hasAttacked) {
        if (buildingSystem.currentBlueprintId) {
          buildingSystem.placeCurrent();
        } else {
          combatSystem.handlePlayerAttack(player);
          if (navigator.vibrate) navigator.vibrate(40);
        }
      }

      // Enemies update
      hound.update(dt, player.position, terrain, tideState.waterLevel, (dmg) => {
        vitalsSystem.takeDamage(dmg);
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      });

      lurker.update(dt, player.position, terrain, tideState.waterLevel, (dmg) => {
        vitalsSystem.takeDamage(dmg);
        if (navigator.vibrate) navigator.vibrate(80);
      });

      // Death check: drop non-equipped inventory in floating salvage crate
      if (vitalsSystem.vitals.isDead) {
        const crateMesh = assetReg.createLootPickup('salvage_crate');
        crateMesh.position.set(player.position.x, Math.max(player.position.y, tideState.waterLevel + 0.2), player.position.z);
        scene.add(crateMesh);

        // Clear non-equipped items
        craftingSystem.inventory.forEach((slot, idx) => {
          if (idx !== craftingSystem.activeQuickSlot) {
            slot.itemId = null;
            slot.count = 0;
          }
        });
        craftingSystem.updateHUD();

        // Respawn at starter island camp
        player.position.set(0, 8, 12);
        vitalsSystem.vitals.health = 100;
        vitalsSystem.vitals.isDead = false;
        vitalsSystem.updateHUD();
      }

      // Autosave every 20s
      if (saveTimer >= 20.0) {
        saveTimer = 0;
        SaveSystem.save({
          version: 1,
          timestamp: Date.now(),
          playerPos: [player.position.x, player.position.y, player.position.z],
          vitals: vitalsSystem.vitals,
          inventory: craftingSystem.inventory,
          structures: buildingSystem.placedStructures,
          timeInTideCycle: tideSystem.timeInCycle,
        });
      }
    },
    (_alpha: number) => {
      // Camera drag & look-at
      const { dx, dy } = inputManager.consumeCameraDelta();
      cameraController.handleDrag(dx, dy);
      cameraController.update(player.position, 1 / 60);

      // Light target follows player for shadow fidelity within 40m
      dirLight.target.position.set(player.position.x, player.position.y, player.position.z);
      dirLight.target.updateMatrixWorld();

      // Render Three.js Scene
      renderer.render(scene, cameraController.camera);

      // Debug overlay update
      debugOverlay.update(
        renderer,
        tideSystem.state.phase,
        tideSystem.timeInCycle,
        tideSystem.state.waterLevel,
        player.position
      );
    }
  );

  gameLoop.start();
}

window.addEventListener('DOMContentLoaded', bootstrap);
