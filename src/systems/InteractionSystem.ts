import * as THREE from 'three';
import type { ResourceNode, DropYield } from '../entities/ResourceNode';
import type { HUD } from '../ui/HUD';
import { SoundSynth } from '../audio/SoundSynth';

export class InteractionSystem {
  public nodes: ResourceNode[] = [];
  private hud: HUD;
  public nearestNode: ResourceNode | null = null;
  private readonly maxInteractDistance = 3.2;

  constructor(hud: HUD) {
    this.hud = hud;
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

    if (closest) {
      let prompt = 'INTERACT';
      if (closest.type === 'tree') prompt = 'CHOP TREE';
      else if (closest.type === 'scrap_pile') prompt = 'SCAVENGE METAL';
      else if (closest.type === 'plastic_barrel') prompt = 'SALVAGE BARREL';
      else if (closest.type === 'shipping_container') prompt = 'LOOT CONTAINER';
      else if (closest.type === 'sunken_electronics') prompt = 'RECOVER ELECTRONICS';
      else if (closest.type === 'salvage_crate') prompt = 'LOOT CRATE';

      this.hud.showInteractPrompt(prompt);
    } else {
      this.hud.showInteractPrompt(null);
    }
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
