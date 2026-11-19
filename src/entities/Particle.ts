import * as THREE from 'three';

export interface ParticleData {
  index: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
  active: boolean;
}

export class ParticlePool {
  public instancedMesh: THREE.InstancedMesh;
  public pool: ParticleData[] = [];
  public capacity: number;

  // Single pre-allocated transform dummy for zero GC
  private static readonly _dummy = new THREE.Object3D();
  private static readonly _color = new THREE.Color();
  private readonly baseScale = 0.22;

  constructor(scene: THREE.Scene, capacity = 150) {
    this.capacity = capacity;

    const geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    this.instancedMesh = new THREE.InstancedMesh(geo, mat, capacity);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    ParticlePool._dummy.scale.set(0, 0, 0);
    ParticlePool._dummy.updateMatrix();

    for (let i = 0; i < capacity; i++) {
      this.instancedMesh.setMatrixAt(i, ParticlePool._dummy.matrix);
      this.pool.push({
        index: i,
        position: new THREE.Vector3(0, -999, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        lifetime: 0,
        maxLifetime: 0.3,
        active: false,
      });
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    scene.add(this.instancedMesh);
  }

  public burst(x: number, y: number, z: number, colorHex: number, count = 6, speed = 8) {
    ParticlePool._color.setHex(colorHex);
    let spawned = 0;

    for (let i = 0; i < this.pool.length && spawned < count; i++) {
      const p = this.pool[i];
      if (!p.active) {
        p.position.set(x, y, z);
        const angle = Math.random() * Math.PI * 2;
        const upward = 0.8 + Math.random() * 2.5;
        const spd = speed * (0.6 + Math.random() * 0.8);
        p.velocity.set(Math.cos(angle) * spd, upward, Math.sin(angle) * spd);

        p.lifetime = 0;
        p.maxLifetime = 0.25 + Math.random() * 0.2;
        p.active = true;

        this.instancedMesh.setColorAt(p.index, ParticlePool._color);

        ParticlePool._dummy.position.copy(p.position);
        ParticlePool._dummy.scale.setScalar(this.baseScale);
        ParticlePool._dummy.updateMatrix();
        this.instancedMesh.setMatrixAt(p.index, ParticlePool._dummy.matrix);

        spawned++;
      }
    }

    if (spawned > 0) {
      this.instancedMesh.instanceMatrix.needsUpdate = true;
      if (this.instancedMesh.instanceColor) {
        this.instancedMesh.instanceColor.needsUpdate = true;
      }
    }
  }

  public update(dt: number) {
    let anyUpdated = false;

    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (!p.active) continue;

      p.position.x += p.velocity.x * dt;
      p.position.y += p.velocity.y * dt;
      p.position.z += p.velocity.z * dt;
      p.velocity.y -= 14 * dt; // gravity

      p.lifetime += dt;
      if (p.lifetime >= p.maxLifetime) {
        p.active = false;
        p.position.set(0, -999, 0);
        ParticlePool._dummy.position.set(0, -999, 0);
        ParticlePool._dummy.scale.set(0, 0, 0);
        ParticlePool._dummy.updateMatrix();
        this.instancedMesh.setMatrixAt(p.index, ParticlePool._dummy.matrix);
      } else {
        const progress = p.lifetime / p.maxLifetime;
        const scale = Math.max(0.01, this.baseScale * (1 - progress));
        ParticlePool._dummy.position.copy(p.position);
        ParticlePool._dummy.scale.setScalar(scale);
        ParticlePool._dummy.updateMatrix();
        this.instancedMesh.setMatrixAt(p.index, ParticlePool._dummy.matrix);
      }
      anyUpdated = true;
    }

    if (anyUpdated) {
      this.instancedMesh.instanceMatrix.needsUpdate = true;
    }
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
      const p = this.pool[i];
      p.active = false;
      p.position.set(0, -999, 0);
      ParticlePool._dummy.position.set(0, -999, 0);
      ParticlePool._dummy.scale.set(0, 0, 0);
      ParticlePool._dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(p.index, ParticlePool._dummy.matrix);
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }
}
