import * as THREE from 'three';
import { AssetRegistry } from '../entities/AssetRegistry';
import { ResourceNode, type DropYield } from '../entities/ResourceNode';
import { SpatialHashGrid } from '../logic/spatialHashGrid';
import { getChunkBounds, CHUNK_SIZE } from '../logic/terrainChunkLogic';
import { RESOURCE_CONSTANTS } from '../data/constants';
import type { WorldGen } from './WorldGen';
import { BIOMES, BiomeType } from '../data/biomes';

export interface ChunkPropInstance {
  type: string;
  matrix: THREE.Matrix4;
  nodeId: string;
  yields: DropYield[];
  maxHits: number;
  position: THREE.Vector3;
}

export class ChunkPropsManager {
  public scene: THREE.Scene;
  public worldGen: WorldGen;
  public spatialGrid: SpatialHashGrid<ResourceNode>;
  public chunkMeshes = new Map<string, THREE.Group>();
  public harvestedNodes = new Map<string, number>(); // nodeId -> harvested timestamp (seconds)
  public nodeInstances = new Map<string, ResourceNode>();

  private assetReg: AssetRegistry;
  private dummyObj = new THREE.Object3D();

  constructor(scene: THREE.Scene, worldGen: WorldGen) {
    this.scene = scene;
    this.worldGen = worldGen;
    this.assetReg = AssetRegistry.get();
    this.spatialGrid = new SpatialHashGrid<ResourceNode>(16.0);
  }

  // Record node harvesting and calculate respawn after 3 tide cycles (2700s)
  public harvestNode(nodeId: string, currentSec: number): void {
    this.harvestedNodes.set(nodeId, currentSec);
    const node = this.nodeInstances.get(nodeId);
    if (node) {
      this.spatialGrid.remove(nodeId, node.position.x, node.position.z);
    }
  }

  public isNodeHarvested(nodeId: string, currentSec: number): boolean {
    const timestamp = this.harvestedNodes.get(nodeId);
    if (timestamp === undefined) return false;
    if (currentSec - timestamp >= RESOURCE_CONSTANTS.NODE_RESPAWN_TIME_SEC) {
      // Respawned!
      this.harvestedNodes.delete(nodeId);
      return false;
    }
    return true;
  }

  public onChunkLoaded(key: string, cx: number, cz: number, currentSec: number): void {
    if (this.chunkMeshes.has(key)) return;

    const group = new THREE.Group();
    this.chunkMeshes.set(key, group);
    this.scene.add(group);

    const instances = this.generatePropInstancesForChunk(key, cx, cz, currentSec);
    const byType = new Map<string, ChunkPropInstance[]>();

    for (let i = 0; i < instances.length; i++) {
      const inst = instances[i];
      let list = byType.get(inst.type);
      if (!list) {
        list = [];
        byType.set(inst.type, list);
      }
      list.push(inst);
    }

    // Build InstancedMesh per prop type for batch rendering
    for (const [type, list] of byType.entries()) {
      const geo = this.assetReg.getPropGeometry(type);
      const mat = this.assetReg.getPropMaterial(type);
      const instMesh = new THREE.InstancedMesh(geo, mat, list.length);
      instMesh.castShadow = true;
      instMesh.receiveShadow = true;

      for (let i = 0; i < list.length; i++) {
        instMesh.setMatrixAt(i, list[i].matrix);

        // Register interactive resource nodes if not harvested
        if (list[i].maxHits > 0) {
          const resType = (type.startsWith('shipping_container') ? 'shipping_container' : type) as any;
          const node = new ResourceNode(
            list[i].nodeId,
            resType,
            instMesh,
            list[i].position,
            list[i].maxHits,
            list[i].yields,
            type.startsWith('shipping_container')
          );
          this.nodeInstances.set(list[i].nodeId, node);
          this.spatialGrid.insert({
            id: list[i].nodeId,
            x: list[i].position.x,
            z: list[i].position.z,
            data: node,
          });
        }
      }

      instMesh.instanceMatrix.needsUpdate = true;
      group.add(instMesh);
    }
  }

  public onChunkUnloaded(key: string, cx: number, cz: number): void {
    const group = this.chunkMeshes.get(key);
    if (!group) return;

    // Remove from scene and dispose
    this.scene.remove(group);
    this.chunkMeshes.delete(key);

    // Remove nodes in chunk bounds from spatial grid and instance map
    const bounds = getChunkBounds(cx, cz);
    for (const [id, node] of this.nodeInstances.entries()) {
      if (
        node.position.x >= bounds.minX &&
        node.position.x <= bounds.maxX &&
        node.position.z >= bounds.minZ &&
        node.position.z <= bounds.maxZ
      ) {
        this.spatialGrid.remove(id, node.position.x, node.position.z);
        this.nodeInstances.delete(id);
      }
    }
  }

  private generatePropInstancesForChunk(
    key: string,
    cx: number,
    cz: number,
    currentSec: number
  ): ChunkPropInstance[] {
    const bounds = getChunkBounds(cx, cz);
    const results: ChunkPropInstance[] = [];

    // Deterministic pseudo-random seed per chunk
    let seed = Math.abs(Math.sin(cx * 12.9898 + cz * 78.233 + this.worldGen.seed) * 43758.5453) % 1;
    const rng = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // 4x4 jittered grid (16 potential spots per 64m chunk)
    const gridSize = 4;
    const cellSize = CHUNK_SIZE / gridSize; // 16m

    let nodeIdx = 0;

    for (let gx = 0; gx < gridSize; gx++) {
      for (let gz = 0; gz < gridSize; gz++) {
        // Chance to spawn in cell
        if (rng() > 0.65) continue;

        const jx = (rng() - 0.5) * (cellSize * 0.7);
        const jz = (rng() - 0.5) * (cellSize * 0.7);

        const wx = bounds.minX + gx * cellSize + cellSize * 0.5 + jx;
        const wz = bounds.minZ + gz * cellSize + cellSize * 0.5 + jz;

        const y = this.worldGen.getHeight(wx, wz);
        const biome = this.worldGen.getBiome(wx, wz);

        // Water check: ocean chunks or deeply submerged props skipped
        if (biome === BiomeType.Ocean || (y < 0.2 && biome !== BiomeType.TidalFlats)) {
          continue;
        }

        const nodeId = `prop_${key}_${nodeIdx++}`;
        if (this.isNodeHarvested(nodeId, currentSec)) {
          continue;
        }

        const propDef = this.selectPropTypeForBiome(biome, rng);
        if (!propDef) continue;

        const scale = propDef.scaleMin + rng() * (propDef.scaleMax - propDef.scaleMin);
        const rotY = rng() * Math.PI * 2;

        this.dummyObj.position.set(wx, y, wz);
        this.dummyObj.rotation.set(0, rotY, 0);
        this.dummyObj.scale.set(scale, scale, scale);
        this.dummyObj.updateMatrix();

        const yields = this.getYieldsForProp(propDef.propType);
        const maxHits = this.getMaxHitsForProp(propDef.propType);

        results.push({
          type: propDef.propType,
          matrix: this.dummyObj.matrix.clone(),
          nodeId,
          yields,
          maxHits,
          position: new THREE.Vector3(wx, y, wz),
        });
      }
    }

    return results;
  }

  private selectPropTypeForBiome(
    biome: BiomeType,
    rng: () => number
  ): { propType: string; scaleMin: number; scaleMax: number } | null {
    const biomeDef = BIOMES[biome];
    if (!biomeDef || biomeDef.props.length === 0) return null;

    let totalWeight = 0;
    for (let i = 0; i < biomeDef.props.length; i++) {
      totalWeight += biomeDef.props[i].weight;
    }

    let roll = rng() * totalWeight;
    for (let i = 0; i < biomeDef.props.length; i++) {
      roll -= biomeDef.props[i].weight;
      if (roll <= 0) {
        return biomeDef.props[i];
      }
    }

    return biomeDef.props[0];
  }

  private getYieldsForProp(type: string): DropYield[] {
    switch (type) {
      case 'palm_tree':
        return [
          { itemId: 'wood_log', count: 3 },
          { itemId: 'palm_frond', count: 2 },
          { itemId: 'coconut', count: 1 },
        ];
      case 'scrap_pile':
        return [
          { itemId: 'scrap_metal', count: 3 },
          { itemId: 'bolts', count: 4 },
        ];
      case 'plastic_barrel':
        return [
          { itemId: 'plastic_barrel', count: 1 },
          { itemId: 'rope', count: 1 },
        ];
      case 'shipping_container_red':
        return [
          { itemId: 'scrap_metal', count: 5 },
          { itemId: 'cloth', count: 4 },
        ];
      case 'shipping_container_blue':
      case 'sunken_electronics':
        return [
          { itemId: 'copper_wire', count: 4 },
          { itemId: 'circuit_board', count: 2 },
          { itemId: 'battery', count: 1 },
        ];
      case 'rock':
        return [{ itemId: 'scrap_metal', count: 1 }];
      default:
        return [{ itemId: 'palm_frond', count: 1 }];
    }
  }

  private getMaxHitsForProp(type: string): number {
    switch (type) {
      case 'palm_tree':
        return 3;
      case 'scrap_pile':
        return 2;
      case 'plastic_barrel':
        return 1;
      case 'shipping_container_red':
      case 'shipping_container_blue':
      case 'sunken_electronics':
        return 4;
      case 'rock':
        return 2;
      case 'grass':
        return 0; // decorative, not interactive
      default:
        return 1;
    }
  }
}
