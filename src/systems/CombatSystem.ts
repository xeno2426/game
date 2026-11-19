import * as THREE from 'three';
import { Player } from '../entities/Player';
import { BulletPool } from '../entities/Bullet';
import { EnemyPool } from '../entities/Enemy';
import { InputSystem } from './InputSystem';
import { sound } from '../audio/SoundSynth';
import { Haptics } from '../audio/Haptics';

export class CombatSystem {
  private fireTimer = 0;
  private alternateCannon = false;

  // Scratch vector for zero GC
  private static readonly _aimDir = new THREE.Vector3();

  public update(
    dt: number,
    player: Player,
    input: InputSystem,
    bulletPool: BulletPool,
    enemyPool: EnemyPool
  ) {
    if (this.fireTimer > 0) {
      this.fireTimer -= dt;
    }

    if (player.hp <= 0) return;

    // Apply light aim assist towards nearest active enemy within aim cone
    if (input.isAiming) {
      input.applyAimAssist(player.position, enemyPool.pool, 0.45, 22);
    }

    // Auto-fire when aim stick is deflected or mouse is pressed
    if (input.isFiring && this.fireTimer <= 0) {
      this.fireTimer = 1 / player.stats.fireRate;

      // Determine firing direction (use aim vector if available, otherwise player facing)
      let dirX = 0;
      let dirZ = -1;

      if (input.isAiming && input.aimVector.lengthSq() > 0.05) {
        dirX = input.aimVector.x;
        dirZ = input.aimVector.y;
      } else {
        const facing = player.mesh.rotation.y;
        dirX = -Math.sin(facing);
        dirZ = -Math.cos(facing);
      }

      CombatSystem._aimDir.set(dirX, 0, dirZ).normalize();

      // Alternate twin blasters
      const cannonOffset = this.alternateCannon ? 0.75 : -0.75;
      this.alternateCannon = !this.alternateCannon;

      // Calculate right vector relative to aim direction
      const rightX = -CombatSystem._aimDir.z;
      const rightZ = CombatSystem._aimDir.x;

      const spawnX = player.position.x + rightX * cannonOffset + CombatSystem._aimDir.x * 0.8;
      const spawnZ = player.position.z + rightZ * cannonOffset + CombatSystem._aimDir.z * 0.8;

      bulletPool.spawn(
        spawnX,
        0.4,
        spawnZ,
        CombatSystem._aimDir.x,
        CombatSystem._aimDir.z,
        player.stats.bulletSpeed,
        player.stats.bulletDamage
      );

      sound.playShoot();
      Haptics.shoot();
    }
  }

  public reset() {
    this.fireTimer = 0;
    this.alternateCannon = false;
  }
}
