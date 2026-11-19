import * as THREE from 'three';
import { Enemy, type EnemyType } from './Enemy';
import type { CombatSystem } from '../systems/CombatSystem';
import type { WorldGen } from '../world/WorldGen';
import type { Terrain } from '../world/Terrain';
import { BiomeType } from '../data/biomes';

export const MAX_ACTIVE_ENEMIES = 6;
export const ENEMY_WAKE_DISTANCE = 120.0;
export const ENEMY_DESPAWN_DISTANCE = 200.0;

export class EnemyManager {
  public scene: THREE.Scene;
  public worldGen: WorldGen;
  public combatSystem: CombatSystem;

  public activeEnemies: Enemy[] = [];
  private poolHounds: Enemy[] = [];
  private poolLurkers: Enemy[] = [];
  private spawnCooldown = 2.0;

  constructor(scene: THREE.Scene, worldGen: WorldGen, combatSystem: CombatSystem) {
    this.scene = scene;
    this.worldGen = worldGen;
    this.combatSystem = combatSystem;

    // Pre-allocate enemy pool
    for (let i = 0; i < 4; i++) {
      const hound = new Enemy(`hound_pool_${i}`, 'hound', new THREE.Vector3(0, -999, 0), scene);
      hound.object.visible = false;
      this.poolHounds.push(hound);
    }
    for (let i = 0; i < 4; i++) {
      const lurker = new Enemy(`lurker_pool_${i}`, 'lurker', new THREE.Vector3(0, -999, 0), scene);
      lurker.object.visible = false;
      this.poolLurkers.push(lurker);
    }
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    terrain: Terrain,
    waterLevel: number,
    onPlayerDamage: (damage: number) => void
  ): void {
    // 1. Update and cull active enemies
    for (let i = this.activeEnemies.length - 1; i >= 0; i--) {
      const enemy = this.activeEnemies[i];
      const dist = playerPos.distanceTo(enemy.position);

      if (enemy.isDead || dist > ENEMY_DESPAWN_DISTANCE) {
        this.despawnEnemy(enemy, i);
        continue;
      }

      // Wake/tick if within wake distance
      if (dist <= ENEMY_WAKE_DISTANCE) {
        enemy.update(dt, playerPos, terrain, waterLevel, onPlayerDamage);
      }
    }

    // 2. Spawn new enemies if below cap
    this.spawnCooldown -= dt;
    if (this.spawnCooldown <= 0 && this.activeEnemies.length < MAX_ACTIVE_ENEMIES) {
      this.spawnCooldown = 3.0;
      this.trySpawnCandidateNearPlayer(playerPos);
    }
  }

  public render(alpha: number): void {
    for (let i = 0; i < this.activeEnemies.length; i++) {
      this.activeEnemies[i].render(alpha);
    }
  }

  private trySpawnCandidateNearPlayer(playerPos: THREE.Vector3): void {
    // Pick a candidate angle between 50m and 100m from player
    const angle = Math.random() * Math.PI * 2;
    const dist = 55.0 + Math.random() * 45.0;
    const sx = playerPos.x + Math.cos(angle) * dist;
    const sz = playerPos.z + Math.sin(angle) * dist;

    const y = this.worldGen.getHeight(sx, sz);
    const biome = this.worldGen.getBiome(sx, sz);

    // Determine candidate type based on biome table
    let candidateType: EnemyType = 'hound';
    if (
      biome === BiomeType.MangroveSwamp ||
      biome === BiomeType.TidalFlats ||
      biome === BiomeType.Ocean ||
      biome === BiomeType.OffshoreOilRigs ||
      y < 1.0
    ) {
      candidateType = 'lurker';
    } else {
      candidateType = 'hound';
    }

    this.spawnEnemy(candidateType, sx, y, sz);
  }

  private spawnEnemy(type: EnemyType, x: number, y: number, z: number): void {
    const pool = type === 'hound' ? this.poolHounds : this.poolLurkers;
    if (pool.length === 0) return;

    const enemy = pool.pop()!;
    enemy.position.set(x, y, z);
    enemy.prevPosition.set(x, y, z);
    enemy.object.position.set(x, y, z);
    enemy.object.visible = true;
    enemy.isDead = false;
    enemy.health = type === 'hound' ? 60 : 100;
    enemy.state = 'idle';

    this.activeEnemies.push(enemy);
    this.combatSystem.registerEnemy(enemy);
  }

  private despawnEnemy(enemy: Enemy, index: number): void {
    this.activeEnemies.splice(index, 1);
    this.combatSystem.unregisterEnemy(enemy.id);
    enemy.object.visible = false;
    enemy.position.set(0, -999, 0);

    if (enemy.type === 'hound') {
      this.poolHounds.push(enemy);
    } else {
      this.poolLurkers.push(enemy);
    }
  }
}
