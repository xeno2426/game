import * as THREE from 'three';
import { BLUEPRINTS } from '../data/blueprints';
import { BUILDING_CONSTANTS } from '../data/constants';
import { AssetRegistry } from '../entities/AssetRegistry';
import { PALETTE_COLORS } from '../data/palette';
import { findBestSnapSocket, computeStructureAABBs, computeGroundHeight, resolveHorizontalCollision, type PlacedStructure, type StructureAABB } from '../logic/buildingLogic';
import type { CraftingSystem } from './CraftingSystem';
import type { Terrain } from '../world/Terrain';

export class BuildingSystem {
  private scene: THREE.Scene;
  private craftingSystem: CraftingSystem;
  private terrain: Terrain;

  public placedStructures: PlacedStructure[] = [];
  public staticAABBs: StructureAABB[] = [];
  public currentBlueprintId: string | null = null;
  public currentRotationY = 0; // 0, PI/2, PI, 3*PI/2

  private ghostObject: THREE.Object3D | null = null;
  private ghostMaterialValid: THREE.MeshBasicMaterial;
  private ghostMaterialInvalid: THREE.MeshBasicMaterial;

  public ghostPosition = new THREE.Vector3();
  public isValidPlacement = false;
  private scratchAimPos: [number, number, number] = [0, 0, 0];

  constructor(scene: THREE.Scene, craftingSystem: CraftingSystem, terrain: Terrain) {
    this.scene = scene;
    this.craftingSystem = craftingSystem;
    this.terrain = terrain;

    this.ghostMaterialValid = new THREE.MeshBasicMaterial({
      color: PALETTE_COLORS.CircuitGreen,
      transparent: true,
      opacity: 0.55,
      wireframe: true,
    });

    this.ghostMaterialInvalid = new THREE.MeshBasicMaterial({
      color: PALETTE_COLORS.CoralRed,
      transparent: true,
      opacity: 0.55,
      wireframe: true,
    });
  }

  public selectBlueprint(blueprintId: string | null): void {
    if (this.currentBlueprintId === blueprintId) return;

    this.currentBlueprintId = blueprintId;
    if (this.ghostObject) {
      this.scene.remove(this.ghostObject);
      this.ghostObject = null;
    }

    if (!blueprintId || !BLUEPRINTS[blueprintId]) return;

    this.ghostObject = this.createStructureMesh(blueprintId);
    this.applyGhostMaterial(this.ghostObject, this.ghostMaterialValid);
    this.scene.add(this.ghostObject);
  }

  public rotate90(): void {
    this.currentRotationY = (this.currentRotationY + BUILDING_CONSTANTS.ROTATION_STEP_RAD) % (Math.PI * 2);
  }

  public update(playerPos: THREE.Vector3, forwardDir: THREE.Vector3): void {
    if (!this.currentBlueprintId || !this.ghostObject) return;

    const bp = BLUEPRINTS[this.currentBlueprintId];
    if (!bp) return;

    // Aim position ~4.5m ahead of player
    const aimX = playerPos.x + forwardDir.x * 4.5;
    const aimZ = playerPos.z + forwardDir.z * 4.5;
    const terrainY = this.terrain.getHeight(aimX, aimZ);

    this.scratchAimPos[0] = aimX;
    this.scratchAimPos[1] = terrainY;
    this.scratchAimPos[2] = aimZ;

    // Check snap to nearest placed structure socket
    const snap = findBestSnapSocket(this.placedStructures, this.scratchAimPos, this.currentBlueprintId);

    if (snap) {
      this.ghostPosition.set(snap.socketWorldPos[0], snap.socketWorldPos[1], snap.socketWorldPos[2]);
    } else {
      // Snap to grid on terrain
      const gx = Math.round(aimX / BUILDING_CONSTANTS.GRID_SIZE) * BUILDING_CONSTANTS.GRID_SIZE;
      const gz = Math.round(aimZ / BUILDING_CONSTANTS.GRID_SIZE) * BUILDING_CONSTANTS.GRID_SIZE;
      const gy = this.terrain.getHeight(gx, gz);
      this.ghostPosition.set(gx, gy, gz);
    }

    this.ghostObject.position.copy(this.ghostPosition);
    this.ghostObject.rotation.y = this.currentRotationY;

    // Check if player has required resources
    let hasResources = true;
    for (const cost of bp.cost) {
      let hasCount = 0;
      for (const s of this.craftingSystem.inventory) {
        if (s.itemId === cost.itemId) {
          hasCount += s.count;
        }
      }
      if (hasCount < cost.count) {
        hasResources = false;
        break;
      }
    }

    this.isValidPlacement = hasResources;
    this.applyGhostMaterial(
      this.ghostObject,
      this.isValidPlacement ? this.ghostMaterialValid : this.ghostMaterialInvalid
    );
  }

  public placeCurrent(): boolean {
    if (!this.currentBlueprintId || !this.isValidPlacement) return false;

    const bp = BLUEPRINTS[this.currentBlueprintId];
    if (!bp) return false;

    // Deduct cost
    for (const cost of bp.cost) {
      let remaining = cost.count;
      for (const slot of this.craftingSystem.inventory) {
        if (slot.itemId === cost.itemId) {
          const take = Math.min(slot.count, remaining);
          slot.count -= take;
          remaining -= take;
          if (slot.count === 0) slot.itemId = null;
          if (remaining <= 0) break;
        }
      }
    }
    this.craftingSystem.updateHUD();

    // Spawn permanent structure mesh
    const structMesh = this.createStructureMesh(this.currentBlueprintId);
    structMesh.position.copy(this.ghostPosition);
    structMesh.rotation.y = this.currentRotationY;
    this.scene.add(structMesh);

    const placed: PlacedStructure = {
      id: `struct_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      blueprintId: this.currentBlueprintId,
      position: [this.ghostPosition.x, this.ghostPosition.y, this.ghostPosition.z],
      rotationY: this.currentRotationY,
    };
    this.placedStructures.push(placed);
    const aabbs = computeStructureAABBs(placed);
    this.staticAABBs.push(...aabbs);

    return true;
  }

  public restoreStructure(struct: PlacedStructure): void {
    const structMesh = this.createStructureMesh(struct.blueprintId);
    structMesh.position.set(struct.position[0], struct.position[1], struct.position[2]);
    structMesh.rotation.y = struct.rotationY;
    this.scene.add(structMesh);
    this.placedStructures.push(struct);
    const aabbs = computeStructureAABBs(struct);
    this.staticAABBs.push(...aabbs);
  }

  public resolveHorizontalCollision(pos: { x: number; y: number; z: number }, radius: number): boolean {
    return resolveHorizontalCollision(pos, radius, this.staticAABBs);
  }

  public getGroundHeight(terrainH: number, x: number, y: number, z: number): number {
    return computeGroundHeight(terrainH, this.placedStructures, x, y, z);
  }

  public isNearCampfire(pos: { x: number; y: number; z: number }): boolean {
    const rSq = BUILDING_CONSTANTS.CAMPFIRE_WARMTH_RADIUS * BUILDING_CONSTANTS.CAMPFIRE_WARMTH_RADIUS;
    for (const s of this.placedStructures) {
      if (s.blueprintId === 'campfire') {
        const dx = s.position[0] - pos.x;
        const dy = s.position[1] - pos.y;
        const dz = s.position[2] - pos.z;
        if (dx * dx + dy * dy + dz * dz <= rSq) return true;
      }
    }
    return false;
  }

  public isUnderRoof(pos: { x: number; y: number; z: number }): boolean {
    const rSq = BUILDING_CONSTANTS.ROOF_SHELTER_RADIUS * BUILDING_CONSTANTS.ROOF_SHELTER_RADIUS;
    for (const s of this.placedStructures) {
      if (s.blueprintId === 'roof') {
        const dx = s.position[0] - pos.x;
        const dz = s.position[2] - pos.z;
        if (dx * dx + dz * dz <= rSq) {
          if (pos.y <= s.position[1] + 1.0 && pos.y >= s.position[1] - 4.0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  public isNearWorkbench(pos: { x: number; y: number; z: number }): boolean {
    const rSq = 3.5 * 3.5;
    for (const s of this.placedStructures) {
      if (s.blueprintId === 'workbench') {
        const dx = s.position[0] - pos.x;
        const dy = s.position[1] - pos.y;
        const dz = s.position[2] - pos.z;
        if (dx * dx + dy * dy + dz * dz <= rSq) return true;
      }
    }
    return false;
  }

  public getNearestCampfireOrShelter(pos: { x: number; y: number; z: number }): THREE.Vector3 | null {
    let bestDist = 25.0 * 25.0; // within 25m
    let bestPos: THREE.Vector3 | null = null;
    for (const s of this.placedStructures) {
      if (s.blueprintId === 'campfire' || s.blueprintId === 'roof') {
        const dx = s.position[0] - pos.x;
        const dy = s.position[1] - pos.y;
        const dz = s.position[2] - pos.z;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < bestDist) {
          bestDist = d2;
          bestPos = new THREE.Vector3(s.position[0], s.position[1] + 0.5, s.position[2]);
        }
      }
    }
    return bestPos;
  }

  private createStructureMesh(blueprintId: string): THREE.Object3D {
    const registry = AssetRegistry.get();
    switch (blueprintId) {
      case 'foundation': return registry.createFoundationMesh();
      case 'stilts': return registry.createStiltsMesh();
      case 'wall': return registry.createWallMesh();
      case 'doorframe': return registry.createDoorframeMesh();
      case 'roof': return registry.createRoofMesh();
      case 'campfire': return registry.createCampfire();
      case 'rain_collector': return registry.createRainCollector();
      case 'raft_base': return registry.createRaft();
      default: return registry.createFoundationMesh();
    }
  }

  private applyGhostMaterial(obj: THREE.Object3D, mat: THREE.Material): void {
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = mat;
      }
    });
  }
}
