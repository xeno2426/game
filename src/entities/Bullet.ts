import * as THREE from 'three';

export class Bullet {
  public mesh: THREE.Mesh;
  public position: THREE.Vector3;
  public velocity = new THREE.Vector3();
  public damage = 25;
  public active = false;
  public lifetime = 0;
  public maxLifetime = 1.2;
  public radius = 0.35;

  constructor(material: THREE.Material, geometry: THREE.BufferGeometry) {
    this.mesh = new THREE.Mesh(geometry, material);
    this.position = this.mesh.position;
    this.mesh.visible = false;
  }

  public spawn(
    x: number,
    y: number,
    z: number,
    dirX: number,
    dirZ: number,
    speed: number,
    damage: number
  ) {
    this.position.set(x, y, z);
    this.velocity.set(dirX * speed, 0, dirZ * speed);
    this.damage = damage;
    this.lifetime = 0;
    this.active = true;
    this.mesh.visible = true;

    // Orient mesh along travel direction
    const angle = Math.atan2(dirX, dirZ);
    this.mesh.rotation.y = angle;
  }

  public update(dt: number) {
    if (!this.active) return;

    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;

    this.lifetime += dt;
    if (this.lifetime >= this.maxLifetime) {
      this.deactivate();
    }
  }

  public deactivate() {
    this.active = false;
    this.mesh.visible = false;
  }
}

export class BulletPool {
  public pool: Bullet[] = [];

  constructor(scene: THREE.Scene, capacity = 100) {
    const geo = new THREE.CylinderGeometry(0.12, 0.12, 0.7, 6);
    geo.rotateX(Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    for (let i = 0; i < capacity; i++) {
      const bullet = new Bullet(mat, geo);
      scene.add(bullet.mesh);
      this.pool.push(bullet);
    }
  }

  public spawn(
    x: number,
    y: number,
    z: number,
    dirX: number,
    dirZ: number,
    speed: number,
    damage: number
  ): Bullet | null {
    for (let i = 0; i < this.pool.length; i++) {
      if (!this.pool[i].active) {
        this.pool[i].spawn(x, y, z, dirX, dirZ, speed, damage);
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
