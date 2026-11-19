import * as THREE from 'three';

export class Particle {
  public mesh: THREE.Mesh;
  public position: THREE.Vector3;
  public velocity = new THREE.Vector3();
  public lifetime = 0;
  public maxLifetime = 0.35;
  public active = false;
  private baseScale = 0.2;

  constructor(material: THREE.Material, geometry: THREE.BufferGeometry) {
    this.mesh = new THREE.Mesh(geometry, material);
    this.position = this.mesh.position;
    this.mesh.visible = false;
  }

  public spawn(x: number, y: number, z: number, colorHex: number, speed = 8) {
    this.position.set(x, y, z);
    const angle = Math.random() * Math.PI * 2;
    const upward = 0.5 + Math.random() * 2;
    const spd = speed * (0.6 + Math.random() * 0.8);
    this.velocity.set(Math.cos(angle) * spd, upward, Math.sin(angle) * spd);

    this.lifetime = 0;
    this.maxLifetime = 0.25 + Math.random() * 0.2;
    this.active = true;
    this.mesh.visible = true;
    (this.mesh.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
    this.mesh.scale.setScalar(this.baseScale);
  }

  public update(dt: number) {
    if (!this.active) return;

    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;
    this.velocity.y -= 12 * dt; // gravity

    this.lifetime += dt;
    const progress = this.lifetime / this.maxLifetime;
    const scale = Math.max(0.01, this.baseScale * (1 - progress));
    this.mesh.scale.setScalar(scale);

    if (this.lifetime >= this.maxLifetime) {
      this.deactivate();
    }
  }

  public deactivate() {
    this.active = false;
    this.mesh.visible = false;
  }
}

export class ParticlePool {
  public pool: Particle[] = [];

  constructor(scene: THREE.Scene, capacity = 100) {
    const geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    for (let i = 0; i < capacity; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
      const p = new Particle(mat, geo);
      scene.add(p.mesh);
      this.pool.push(p);
    }
  }

  public burst(x: number, y: number, z: number, colorHex: number, count = 6, speed = 8) {
    let spawned = 0;
    for (let i = 0; i < this.pool.length && spawned < count; i++) {
      if (!this.pool[i].active) {
        this.pool[i].spawn(x, y, z, colorHex, speed);
        spawned++;
      }
    }
  }

  public update(dt: number) {
    for (let i = 0; i < this.pool.length; i++) {
      if (this.pool[i].active) {
        this.pool[i].update(dt);
      }
    }
  }

  public deactivateAll() {
    for (let i = 0; i < this.pool.length; i++) {
      this.pool[i].deactivate();
    }
  }
}
