import * as THREE from 'three';
import type { ResourceNode, DropYield } from '../entities/ResourceNode';
import type { HUD } from '../ui/HUD';
import { SoundSynth } from '../audio/SoundSynth';
import type { SpatialHashGrid, SpatialNode } from '../logic/spatialHashGrid';
import { RESOURCE_CONSTANTS } from '../data/constants';

export class InteractionSystem {
  public nodes: ResourceNode[] = [];
  public nearestNode: ResourceNode | null = null;
  public spatialGrid: SpatialHashGrid<ResourceNode> | null = null;
  private readonly maxInteractDistance: number = RESOURCE_CONSTANTS.INTERACTION_QUERY_RADIUS;
  private queryResultScratch: SpatialNode<ResourceNode>[] = [];

  constructor(_hud?: HUD, spatialGrid?: SpatialHashGrid<ResourceNode>) {
    if (spatialGrid) {
      this.spatialGrid = spatialGrid;
    }
  }

  public setSpatialGrid(grid: SpatialHashGrid<ResourceNode>): void {
    this.spatialGrid = grid;
  }

  public registerNode(node: ResourceNode): void {
    this.nodes.push(node);
    if (this.spatialGrid) {
      this.spatialGrid.insert({
        id: node.id,
        x: node.position.x,
        z: node.position.z,
        data: node,
      });
    }
  }

  public update(playerPos: THREE.Vector3, isLowTide: boolean): void {
    let closest: ResourceNode | null = null;
    let minDist: number = this.maxInteractDistance;

    // 1. Query spatial hash grid within 4m radius if available
    if (this.spatialGrid) {
      this.spatialGrid.query(playerPos.x, playerPos.z, this.maxInteractDistance, this.queryResultScratch);
      for (let i = 0; i < this.queryResultScratch.length; i++) {
        const node = this.queryResultScratch[i].data;
        if (node.isDepleted) continue;
        if (node.lowTideOnly && !isLowTide) continue;

        const dist = playerPos.distanceTo(node.position);
        if (dist < minDist) {
          minDist = dist;
          closest = node;
        }
      }
    }

    // 2. Also check dynamic un-gridded nodes (e.g. dropped salvage crates)
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      if (node.isDepleted) continue;
      if (node.lowTideOnly && !isLowTide) continue;

      const dist = playerPos.distanceTo(node.position);
      if (dist < minDist) {
        minDist = dist;
        closest = node;
      }
    }

    this.nearestNode = closest;
  }

  public getNodeActionLabel(): string | null {
    if (!this.nearestNode) return null;
    if (this.nearestNode.type === 'tree' || this.nearestNode.type === 'palm_tree') return 'CHOP TREE';
    if (this.nearestNode.type === 'scrap_pile') return 'SCAVENGE METAL';
    if (this.nearestNode.type === 'plastic_barrel') return 'SALVAGE BARREL';
    if (this.nearestNode.type === 'shipping_container' || this.nearestNode.type.startsWith('shipping_container')) return 'LOOT CONTAINER';
    if (this.nearestNode.type === 'sunken_electronics') return 'RECOVER ELECTRONICS';
    if (this.nearestNode.type === 'salvage_crate') return 'LOOT CRATE';
    if (this.nearestNode.type === 'rock') return 'MINE ROCK';
    return 'INTERACT';
  }

  public triggerInteract(): DropYield[] | null {
    if (!this.nearestNode) return null;

    if (this.nearestNode.type === 'tree' || this.nearestNode.type === 'palm_tree') {
      SoundSynth.get().playChop();
    } else {
      SoundSynth.get().playMetalHit();
    }

    return this.nearestNode.hit(1);
  }
}

