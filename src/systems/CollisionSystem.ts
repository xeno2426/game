import * as THREE from 'three';
import { Player } from '../entities/Player';
import { BulletPool } from '../entities/Bullet';
import { EnemyPool } from '../entities/Enemy';
import { PickupPool } from '../entities/Pickup';
import { ParticlePool } from '../entities/Particle';
import { sound } from '../audio/SoundSynth';
import { Haptics } from '../audio/Haptics';
import { CameraSystem } from './CameraSystem';

export class CollisionSystem {
  // Scratch vector for zero GC
  private static readonly _hitDir = new THREE.Vector3();

  public static checkCollisions(
    player: Player,
    bulletPool: BulletPool,
    enemyPool: EnemyPool,
    pickupPool: PickupPool,
    particlePool: ParticlePool,
    cameraSystem: CameraSystem,
    onScoreEarned: (score: number) => void,
    onXpEarned: (xp: number) => void,
    onPlayerDeath: () => void
  ) {
    const bullets = bulletPool.pool;
    const enemies = enemyPool.pool;
    const pickups = pickupPool.pool;

    // 1. Bullets vs Enemies
    for (let b = 0; b < bullets.length; b++) {
      const bullet = bullets[b];
      if (!bullet.active) continue;

      for (let e = 0; e < enemies.length; e++) {
        const enemy = enemies[e];
        if (!enemy.active) continue;

        const dx = bullet.position.x - enemy.position.x;
        const dz = bullet.position.z - enemy.position.z;
        const distSq = dx * dx + dz * dz;
        const radiusSum = bullet.radius + enemy.radius;

        if (distSq < radiusSum * radiusSum) {
          // Bullet Hit!
          bullet.deactivate();
          CollisionSystem._hitDir.copy(bullet.velocity).normalize();

          particlePool.burst(bullet.position.x, 0.4, bullet.position.z, 0x00f0ff, 4, 6);
          sound.playHit();
          Haptics.hit();
          cameraSystem.addTrauma(0.06);

          const killed = enemy.takeDamage(bullet.damage, CollisionSystem._hitDir);
          if (killed) {
            // Enemy Died!
            pickupPool.spawn(enemy.position.x, enemy.position.z, enemy.xpValue);
            particlePool.burst(enemy.position.x, 0.5, enemy.position.z, 0xff0055, 10, 9);
            sound.playExplosion();
            cameraSystem.addTrauma(0.22);
            onScoreEarned(enemy.scoreValue);
          }
          break; // Bullet hits one enemy
        }
      }
    }

    // 2. Enemies vs Player
    if (player.hp > 0 && player.invulnerableTimer <= 0) {
      for (let e = 0; e < enemies.length; e++) {
        const enemy = enemies[e];
        if (!enemy.active) continue;

        const dx = player.position.x - enemy.position.x;
        const dz = player.position.z - enemy.position.z;
        const distSq = dx * dx + dz * dz;
        const radiusSum = 0.9 + enemy.radius;

        if (distSq < radiusSum * radiusSum) {
          const tookDamage = player.takeDamage(enemy.damage);
          if (tookDamage) {
            particlePool.burst(player.position.x, 0.5, player.position.z, 0xff0055, 12, 10);
            sound.playHit();
            Haptics.damage();
            cameraSystem.addTrauma(0.4);

            if (player.hp <= 0) {
              sound.playGameOver();
              Haptics.gameOver();
              onPlayerDeath();
            }
          }
          break;
        }
      }
    }

    // 3. Player vs Pickups (collected when close)
    for (let p = 0; p < pickups.length; p++) {
      const pickup = pickups[p];
      if (!pickup.active) continue;

      const dx = player.position.x - pickup.position.x;
      const dz = player.position.z - pickup.position.z;
      const distSq = dx * dx + dz * dz;

      if (distSq < 1.0) {
        pickup.deactivate();
        particlePool.burst(pickup.position.x, 0.4, pickup.position.z, 0x00f0ff, 5, 5);
        sound.playPickup();
        onXpEarned(pickup.xpValue);
        onScoreEarned(pickup.xpValue * 20);
      }
    }
  }
}
