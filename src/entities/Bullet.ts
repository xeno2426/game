import * as THREE from 'three';

export interface BulletData {
  index: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  damage: number;
  active: boolean;
  lifetime: number;
  maxLifetime: number;
  radius: number;
  angle: number;
}

export class BulletPool {
  public instancedMesh: THREE.InstancedMesh;
  public pool: BulletData[] = [];
  public capacity: number;

  // Single pre-allocated transform dummy for zero GC
  private static readonly _dummy = new THREE.Object3D();

  constructor(scene: THREE.Scene, capacity = 120) {
    this.capacity = capacity;

    const geo = new THREE.CylinderGeometry(0.12, 0.12, 0.7, 6);
    geo.rotateX(Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    this.instancedMesh = new THREE.InstancedMesh(geo, mat, capacity);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // Initialize all instances as collapsed/invisible
    BulletPool._dummy.scale.set(0, 0, 0);
    BulletPool._dummy.updateMatrix();

    for (let i = 0; i < capacity; i++) {
      this.instancedMesh.setMatrixAt(i, BulletPool._dummy.matrix);
      this.pool.push({
        index: i,
        position: new THREE.Vector3(0, -999, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        damage: 25,
        active: false,
        lifetime: 0,
        maxLifetime: 1.2,
        radius: 0.35,
        angle: 0,
      });
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    scene.add(this.instancedMesh);
  }

  public spawn(
    x: number,
    y: number,
    z: number,
    dirX: number,
    dirZ: number,
    speed: number,
    damage: number
  ): BulletData | null {
    for (let i = 0; i < this.pool.length; i++) {
      const bullet = this.pool[i];
      if (!bullet.active) {
        bullet.position.set(x, y, z);
        bullet.velocity.set(dirX * speed, 0, dirZ * speed);
        bullet.damage = damage;
        bullet.lifetime = 0;
        bullet.active = true;
        bullet.angle = Math.atan2(dirX, dirZ);

        this.updateInstanceMatrix(bullet);
        this.instancedMesh.instanceMatrix.needsUpdate = true;
        return bullet;
      }
    }
    return null;
  }

  public update(dt: number) {
    let anyUpdated = false;

    for (let i = 0; i < this.pool.length; i++) {
      const bullet = this.pool[i];
      if (!bullet.active) continue;

      bullet.position.x += bullet.velocity.x * dt;
      bullet.position.z += bullet.velocity.z * dt;
      bullet.lifetime += dt;

      if (bullet.lifetime >= bullet.maxLifetime) {
        this.deactivateBullet(bullet);
      } else {
        this.updateInstanceMatrix(bullet);
      }
      anyUpdated = true;
    }

    if (anyUpdated) {
      this.instancedMesh.instanceMatrix.needsUpdate = true;
    }
  }

  public deactivateBullet(bullet: BulletData) {
    if (!bullet.active) return;
    bullet.active = false;
    bullet.position.set(0, -999, 0);

    BulletPool._dummy.position.set(0, -999, 0);
    BulletPool._dummy.scale.set(0, 0, 0);
    BulletPool._dummy.updateMatrix();
    this.instancedMesh.setMatrixAt(bullet.index, BulletPool._dummy.matrix);
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  private updateInstanceMatrix(bullet: BulletData) {
    BulletPool._dummy.position.copy(bullet.position);
    BulletPool._dummy.rotation.set(0, bullet.angle, 0);
    BulletPool._dummy.scale.set(1, 1, 1);
    BulletPool._dummy.updateMatrix();
    this.instancedMesh.setMatrixAt(bullet.index, BulletPool._dummy.matrix);
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
      this.deactivateBullet(this.pool[i]);
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }
}
