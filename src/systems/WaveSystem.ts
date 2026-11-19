import { EnemyPool, type EnemyType } from '../entities/Enemy';

export interface WaveConfig {
  waveNumber: number;
  totalEnemies: number;
  spawnInterval: number;
  chaserWeight: number;
  fastWeight: number;
  tankWeight: number;
  difficultyMultiplier: number;
}

export class WaveSystem {
  public currentWave = 1;
  public totalSpawnedInWave = 0;
  public totalEnemiesInWave = 8;
  public spawnTimer = 0;
  public spawnInterval = 1.2;
  public isWaveActive = false;
  public isWaveClearing = false;

  private enemyPool: EnemyPool;
  private arenaHalfSize = 25;

  public onWaveCompleteCallback?: (wave: number) => void;

  constructor(enemyPool: EnemyPool) {
    this.enemyPool = enemyPool;
  }

  public startWave(wave = 1) {
    this.currentWave = wave;
    this.totalSpawnedInWave = 0;
    this.totalEnemiesInWave = 6 + wave * 5;
    this.spawnInterval = Math.max(0.4, 1.4 - wave * 0.08);
    this.spawnTimer = 0.5; // short grace period before first spawn
    this.isWaveActive = true;
    this.isWaveClearing = false;
  }

  public update(dt: number) {
    if (!this.isWaveActive) return;

    // Check if we need to spawn more enemies
    if (this.totalSpawnedInWave < this.totalEnemiesInWave) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = this.spawnInterval;
        this.spawnNextEnemy();
      }
    } else {
      // All spawned, check if all active enemies are defeated
      if (this.enemyPool.getActiveCount() === 0 && !this.isWaveClearing) {
        this.isWaveClearing = true;
        this.isWaveActive = false;
        if (this.onWaveCompleteCallback) {
          this.onWaveCompleteCallback(this.currentWave);
        }
      }
    }
  }

  private spawnNextEnemy() {
    const wave = this.currentWave;
    // Determine enemy type based on weights
    const roll = Math.random();
    let type: EnemyType = 'chaser';

    if (wave >= 3) {
      if (roll < 0.45) type = 'chaser';
      else if (roll < 0.8) type = 'fast';
      else type = 'tank';
    } else if (wave >= 2) {
      if (roll < 0.6) type = 'chaser';
      else type = 'fast';
    } else {
      type = 'chaser';
    }

    // Spawn at perimeter outside player vision
    const side = Math.floor(Math.random() * 4);
    let x = 0;
    let z = 0;
    const offset = this.arenaHalfSize + 2;

    switch (side) {
      case 0: // North
        x = (Math.random() - 0.5) * 2 * this.arenaHalfSize;
        z = -offset;
        break;
      case 1: // South
        x = (Math.random() - 0.5) * 2 * this.arenaHalfSize;
        z = offset;
        break;
      case 2: // West
        x = -offset;
        z = (Math.random() - 0.5) * 2 * this.arenaHalfSize;
        break;
      case 3: // East
        x = offset;
        z = (Math.random() - 0.5) * 2 * this.arenaHalfSize;
        break;
    }

    const difficultyMultiplier = 1.0 + (wave - 1) * 0.15;
    this.enemyPool.spawn(type, x, z, difficultyMultiplier);
    this.totalSpawnedInWave++;
  }

  public reset() {
    this.currentWave = 1;
    this.totalSpawnedInWave = 0;
    this.isWaveActive = false;
    this.isWaveClearing = false;
  }
}
