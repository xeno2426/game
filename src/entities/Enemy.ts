import * as THREE from 'three';

export type EnemyType = 'chaser' | 'fast' | 'tank';

export interface EnemyConfig {
  type: EnemyType;
  maxHp: number;
  speed: number;
  damage: number;
  scoreValue: number;
  xpValue: number;
  radius: number;
  color: number;
  knockbackResist: number;
}

export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  chaser: {
    type: 'chaser',
    maxHp: 40,
    speed: 5.8,
    damage: 15,
    scoreValue: 100,
    xpValue: 1,
    radius: 0.8,
    color: 0xff2244,
    knockbackResist: 0.2,
  },
  fast: {
    type: 'fast',
    maxHp: 20,
    speed: 9.2,
    damage: 10,
    scoreValue: 150,
    xpValue: 1,
    radius: 0.6,
    color: 0xffea00,
    knockbackResist: 0.05,
  },
  tank: {
    type: 'tank',
    maxHp: 160,
    speed: 3.2,
    damage: 30,
    scoreValue: 300,
    xpValue: 3,
    radius: 1.3,
    color: 0xaa22ff,
    knockbackResist: 0.7,
  },
};

export class Enemy {
  public mesh: THREE.Group;
  public position: THREE.Vector3;
  public active = false;
  public type: EnemyType = 'chaser';
  public hp = 40;
  public maxHp = 40;
  public speed = 5.8;
  public damage = 15;
  public scoreValue = 100;
  public xpValue = 1;
  public radius = 0.8;
  public knockbackResist = 0.2;

  // Flash on hit
  public flashTimer = 0;
  private currentMesh: THREE.Mesh | null = null;
  private chaserMesh: THREE.Mesh;
  private fastMesh: THREE.Mesh;
  private tankMesh: THREE.Mesh;

  // Materials
  private chaserMat: THREE.MeshStandardMaterial;
  private fastMat: THREE.MeshStandardMaterial;
  private tankMat: THREE.MeshStandardMaterial;
  private hitMat: THREE.MeshBasicMaterial;

  // Knockback velocity
  public knockback = new THREE.Vector3(0, 0, 0);

  // Behavior offset for erratic fast movement
  private seed: number;

  // Scratch vectors for zero GC
  private static readonly _toPlayer = new THREE.Vector3();
  private static readonly _steer = new THREE.Vector3();

  constructor() {
    this.seed = Math.random() * 100;
    this.mesh = new THREE.Group();
    this.position = this.mesh.position;
    this.mesh.visible = false;

    // Materials
    this.chaserMat = new THREE.MeshStandardMaterial({
      color: ENEMY_CONFIGS.chaser.color,
      roughness: 0.3,
      metalness: 0.6,
      flatShading: true,
    });
    this.fastMat = new THREE.MeshStandardMaterial({
      color: ENEMY_CONFIGS.fast.color,
      roughness: 0.2,
      metalness: 0.8,
      flatShading: true,
    });
    this.tankMat = new THREE.MeshStandardMaterial({
      color: ENEMY_CONFIGS.tank.color,
      roughness: 0.4,
      metalness: 0.7,
      flatShading: true,
    });
    this.hitMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // 1. Chaser Mesh: Low-poly Tetrahedron / Cone
    const chaserGeo = new THREE.ConeGeometry(0.7, 1.6, 4);
    chaserGeo.rotateX(Math.PI / 2);
    this.chaserMesh = new THREE.Mesh(chaserGeo, this.chaserMat);
    this.chaserMesh.position.y = 0.5;
    this.mesh.add(this.chaserMesh);

    // 2. Fast Mesh: Octahedron
    const fastGeo = new THREE.OctahedronGeometry(0.65, 0);
    this.fastMesh = new THREE.Mesh(fastGeo, this.fastMat);
    this.fastMesh.position.y = 0.5;
    this.mesh.add(this.fastMesh);

    // 3. Tank Mesh: Heavy Beveled Box
    const tankGeo = new THREE.BoxGeometry(1.6, 1.4, 1.6);
    this.tankMesh = new THREE.Mesh(tankGeo, this.tankMat);
    this.tankMesh.position.y = 0.7;
    this.mesh.add(this.tankMesh);
  }

  public spawn(type: EnemyType, x: number, z: number, waveMultiplier = 1.0) {
    this.type = type;
    const config = ENEMY_CONFIGS[type];
    this.maxHp = Math.round(config.maxHp * waveMultiplier);
    this.hp = this.maxHp;
    this.speed = config.speed * Math.min(1.4, 0.9 + waveMultiplier * 0.1);
    this.damage = Math.round(config.damage * waveMultiplier);
    this.scoreValue = config.scoreValue;
    this.xpValue = config.xpValue;
    this.radius = config.radius;
    this.knockbackResist = config.knockbackResist;
    this.knockback.set(0, 0, 0);
    this.flashTimer = 0;

    this.position.set(x, 0, z);
    this.active = true;
    this.mesh.visible = true;

    // Toggle active visual mesh
    this.chaserMesh.visible = type === 'chaser';
    this.fastMesh.visible = type === 'fast';
    this.tankMesh.visible = type === 'tank';

    if (type === 'chaser') this.currentMesh = this.chaserMesh;
    else if (type === 'fast') this.currentMesh = this.fastMesh;
    else this.currentMesh = this.tankMesh;

    this.restoreMaterial();
  }

  private restoreMaterial() {
    if (!this.currentMesh) return;
    if (this.type === 'chaser') this.currentMesh.material = this.chaserMat;
    else if (this.type === 'fast') this.currentMesh.material = this.fastMat;
    else this.currentMesh.material = this.tankMat;
  }

  public update(dt: number, playerPos: THREE.Vector3, time: number) {
    if (!this.active) return;

    // Damage flash timer
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) {
        this.restoreMaterial();
      }
    }

    // Direction to player
    Enemy._toPlayer.subVectors(playerPos, this.position);
    Enemy._toPlayer.y = 0;
    const distToPlayer = Enemy._toPlayer.length();

    if (distToPlayer > 0.05) {
      Enemy._toPlayer.normalize();

      if (this.type === 'fast') {
        // Erratic swarming motion: weave perpendicular to direct approach
        const wave = Math.sin(time * 6 + this.seed) * 0.7;
        Enemy._steer.set(-Enemy._toPlayer.z * wave, 0, Enemy._toPlayer.x * wave);
        Enemy._toPlayer.add(Enemy._steer).normalize();
      }

      // Move toward player
      this.position.x += Enemy._toPlayer.x * this.speed * dt;
      this.position.z += Enemy._toPlayer.z * this.speed * dt;

      // Face direction of movement
      const angle = Math.atan2(Enemy._toPlayer.x, Enemy._toPlayer.z);
      this.mesh.rotation.y = angle;

      // Type-specific mesh animation (rolling / pulsing)
      if (this.type === 'fast') {
        this.fastMesh.rotation.x += dt * 5;
        this.fastMesh.rotation.y += dt * 7;
      } else if (this.type === 'tank') {
        this.tankMesh.rotation.y += dt * 1.5;
      }
    }

    // Apply knockback decay
    if (this.knockback.lengthSq() > 0.01) {
      this.position.x += this.knockback.x * dt;
      this.position.z += this.knockback.z * dt;
      this.knockback.multiplyScalar(Math.max(0, 1 - dt * 8));
    }
  }

  public takeDamage(amount: number, hitDir?: THREE.Vector3): boolean {
    if (!this.active) return false;

    this.hp -= amount;
    this.flashTimer = 0.08;
    if (this.currentMesh) {
      this.currentMesh.material = this.hitMat;
    }

    if (hitDir) {
      const force = (1 - this.knockbackResist) * 12;
      this.knockback.set(hitDir.x * force, 0, hitDir.z * force);
    }

    if (this.hp <= 0) {
      this.deactivate();
      return true; // Enemy died
    }
    return false;
  }

  public deactivate() {
    this.active = false;
    this.mesh.visible = false;
    this.restoreMaterial();
  }
}

export class EnemyPool {
  public pool: Enemy[] = [];

  constructor(scene: THREE.Scene, capacity = 60) {
    for (let i = 0; i < capacity; i++) {
      const enemy = new Enemy();
      scene.add(enemy.mesh);
      this.pool.push(enemy);
    }
  }

  public spawn(type: EnemyType, x: number, z: number, waveMultiplier = 1.0): Enemy | null {
    for (let i = 0; i < this.pool.length; i++) {
      if (!this.pool[i].active) {
        this.pool[i].spawn(type, x, z, waveMultiplier);
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
