import * as THREE from 'three';

export interface PickupData {
  index: number;
  position: THREE.Vector3;
  active: boolean;
  xpValue: number;
  speed: number;
  seed: number;
}

export class PickupPool {
  public instancedMesh: THREE.InstancedMesh;
  public pool: PickupData[] = [];
  public capacity: number;

  // Static scratch transform & math objects for zero GC
  private static readonly _dummy = new THREE.Object3D();
  private static readonly _toPlayer = new THREE.Vector3();

  constructor(scene: THREE.Scene, capacity = 100) {
    this.capacity = capacity;

    const geo = new THREE.OctahedronGeometry(0.32, 0);
    const mat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    this.instancedMesh = new THREE.InstancedMesh(geo, mat, capacity);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    PickupPool._dummy.scale.set(0, 0, 0);
    PickupPool._dummy.updateMatrix();

    for (let i = 0; i < capacity; i++) {
      this.instancedMesh.setMatrixAt(i, PickupPool._dummy.matrix);
      this.pool.push({
        index: i,
        position: new THREE.Vector3(0, -999, 0),
        active: false,
        xpValue: 1,
        speed: 0,
        seed: Math.random() * 10,
      });
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    scene.add(this.instancedMesh);
  }

  public spawn(x: number, z: number, xpValue = 1): PickupData | null {
    for (let i = 0; i < this.pool.length; i++) {
      const gem = this.pool[i];
      if (!gem.active) {
        gem.position.set(x, 0.35, z);
        gem.xpValue = xpValue;
        gem.speed = 0;
        gem.active = true;

        this.updateInstanceMatrix(gem, 0);
        this.instancedMesh.instanceMatrix.needsUpdate = true;
        return gem;
      }
    }
    return null;
  }

  public update(dt: number, playerPos: THREE.Vector3, pickupRadius: number, time: number) {
    let anyUpdated = false;

    for (let i = 0; i < this.pool.length; i++) {
      const gem = this.pool[i];
      if (!gem.active) continue;

      // Bobbing floating animation
      gem.position.y = 0.35 + Math.sin(time * 4 + gem.seed) * 0.12;

      // Check magnet pull
      PickupPool._toPlayer.subVectors(playerPos, gem.position);
      PickupPool._toPlayer.y = 0;
      const dist = PickupPool._toPlayer.length();

      if (dist <= pickupRadius) {
        gem.speed += dt * 32;
        PickupPool._toPlayer.normalize();
        gem.position.x += PickupPool._toPlayer.x * gem.speed * dt;
        gem.position.z += PickupPool._toPlayer.z * gem.speed * dt;
      } else {
        gem.speed = 0;
      }

      this.updateInstanceMatrix(gem, time);
      anyUpdated = true;
    }

    if (anyUpdated) {
      this.instancedMesh.instanceMatrix.needsUpdate = true;
    }
  }

  public deactivateGem(gem: PickupData) {
    if (!gem.active) return;
    gem.active = false;
    gem.position.set(0, -999, 0);

    PickupPool._dummy.position.set(0, -999, 0);
    PickupPool._dummy.scale.set(0, 0, 0);
    PickupPool._dummy.updateMatrix();
    this.instancedMesh.setMatrixAt(gem.index, PickupPool._dummy.matrix);
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  private updateInstanceMatrix(gem: PickupData, time: number) {
    PickupPool._dummy.position.copy(gem.position);
    PickupPool._dummy.rotation.set(0, time * 3 + gem.seed, 0);
    PickupPool._dummy.scale.set(1, 1, 1);
    PickupPool._dummy.updateMatrix();
    this.instancedMesh.setMatrixAt(gem.index, PickupPool._dummy.matrix);
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
      this.deactivateGem(this.pool[i]);
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }
}
