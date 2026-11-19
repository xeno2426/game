import * as THREE from 'three';

export type ResourceType = 'tree' | 'scrap_pile' | 'plastic_barrel' | 'shipping_container' | 'sunken_electronics';

export interface DropYield {
  itemId: string;
  count: number;
}

export class ResourceNode {
  public id: string;
  public type: ResourceType;
  public object: THREE.Object3D;
  public position: THREE.Vector3;
  public health: number;
  public maxHealth: number;
  public yields: DropYield[];
  public isDepleted = false;
  public lowTideOnly = false;

  constructor(
    id: string,
    type: ResourceType,
    object: THREE.Object3D,
    position: THREE.Vector3,
    maxHealth: number,
    yields: DropYield[],
    lowTideOnly = false
  ) {
    this.id = id;
    this.type = type;
    this.object = object;
    this.position = position;
    this.health = maxHealth;
    this.maxHealth = maxHealth;
    this.yields = yields;
    this.lowTideOnly = lowTideOnly;

    this.object.position.copy(position);
  }

  public hit(damage = 1): DropYield[] | null {
    if (this.isDepleted) return null;

    this.health -= damage;
    // Shake effect
    this.object.position.x += (Math.random() - 0.5) * 0.1;
    this.object.position.z += (Math.random() - 0.5) * 0.1;

    if (this.health <= 0) {
      this.isDepleted = true;
      this.object.visible = false;
      return this.yields;
    }
    return null;
  }
}
