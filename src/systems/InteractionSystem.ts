import * as THREE from 'three';
import type { ResourceNode, DropYield } from '../entities/ResourceNode';
import type { HUD } from '../ui/HUD';
import { SoundSynth } from '../audio/SoundSynth';

export class InteractionSystem {
  public nodes: ResourceNode[] = [];
  public nearestNode: ResourceNode | null = null;
  private readonly maxInteractDistance = 3.2;

  constructor(_hud?: HUD) {
    // Retained for backward compatibility
  }

  public registerNode(node: ResourceNode): void {
    this.nodes.push(node);
  }

  public update(playerPos: THREE.Vector3, isLowTide: boolean): void {
    let closest: ResourceNode | null = null;
    let minDist = this.maxInteractDistance;

    for (const node of this.nodes) {
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
    if (this.nearestNode.type === 'tree') return 'CHOP TREE';
    if (this.nearestNode.type === 'scrap_pile') return 'SCAVENGE METAL';
    if (this.nearestNode.type === 'plastic_barrel') return 'SALVAGE BARREL';
    if (this.nearestNode.type === 'shipping_container') return 'LOOT CONTAINER';
    if (this.nearestNode.type === 'sunken_electronics') return 'RECOVER ELECTRONICS';
    if (this.nearestNode.type === 'salvage_crate') return 'LOOT CRATE';
    return 'INTERACT';
  }

  public triggerInteract(): DropYield[] | null {
    if (!this.nearestNode) return null;

    if (this.nearestNode.type === 'tree') {
      SoundSynth.get().playChop();
    } else {
      SoundSynth.get().playMetalHit();
    }

    return this.nearestNode.hit(1);
  }
}
