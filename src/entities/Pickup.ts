import * as THREE from 'three';

export class Pickup {
  public mesh: THREE.Mesh;
  public position: THREE.Vector3;
  public active = false;
  public xpValue = 1;
  public speed = 0;
  private seed: number;

  // Scratch vector for zero GC
  private static readonly _toPlayer = new THREE.Vector3();

  constructor(material: THREE.Material, geometry: THREE.BufferGeometry) {
    this.seed = Math.random() * 10;
    this.mesh = new THREE.Mesh(geometry, material);
    this.position = this.mesh.position;
    this.mesh.visible = false;
  }

  public spawn(x: number, z: number, xpValue = 1) {
    this.position.set(x, 0.35, z);
    this.xpValue = xpValue;
    this.speed = 0;
    this.active = true;
    this.mesh.visible = true;
  }

  public update(dt: number, playerPos: THREE.Vector3, pickupRadius: number, time: number): boolean {
    if (!this.active) return false;

    // Bobbing & rotating idle animation
    this.position.y = 0.35 + Math.sin(time * 4 + this.seed) * 0.12;
    this.mesh.rotation.y += dt * 3;

    // Distance to player
    Pickup._toPlayer.subVectors(playerPos, this.position);
    Pickup._toPlayer.y = 0;
    const dist = Pickup._toPlayer.length();

    // Magnet attraction
    if (dist <= pickupRadius) {
      // Accelerate rapidly towards player
      this.speed += dt * 32;
      Pickup._toPlayer.normalize();
      this.position.x += Pickup._toPlayer.x * this.speed * dt;
      this.position.z += Pickup._toPlayer.z * this.speed * dt;

      // Collection trigger
      if (dist < 0.9) {
        this.deactivate();
        return true; // Collected!
      }
    } else {
      this.speed = 0;
    }

    return false;
  }

  public deactivate() {
    this.active = false;
    this.mesh.visible = false;
  }
}

export class PickupPool {
  public pool: Pickup[] = [];

  constructor(scene: THREE.Scene, capacity = 80) {
    const geo = new THREE.OctahedronGeometry(0.35, 0);
    const mat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    for (let i = 0; i < capacity; i++) {
      const pickup = new Pickup(mat, geo);
      scene.add(pickup.mesh);
      this.pool.push(pickup);
    }
  }

  public spawn(x: number, z: number, xpValue = 1): Pickup | null {
    for (let i = 0; i < this.pool.length; i++) {
      if (!this.pool[i].active) {
        this.pool[i].spawn(x, z, xpValue);
        return this.pool[i];
      }
    }
    return null;
  }

  public getActiveCount(): number {
    let count = 0;
    for (let i = 0; i < this.pool.length; i++) {
      if (this.pool[i].active) count++;
    }
    return count;
  }

  public deactivateAll() {
    for (let i = 0; i < this.pool.length; i++) {
      this.pool[i].deactivate();
    }
  }
}
