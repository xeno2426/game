import * as THREE from 'three';
import type { Enemy } from '../entities/Enemy';
import type { Player } from '../entities/Player';
import { COMBAT_CONSTANTS } from '../data/constants';
import { SoundSynth } from '../audio/SoundSynth';

export class CombatSystem {
  public enemies: Enemy[] = [];
  public targetLockedEnemy: Enemy | null = null;

  public registerEnemy(enemy: Enemy): void {
    this.enemies.push(enemy);
  }

  public update(player: Player, cameraForward: THREE.Vector3): void {
    // Check auto-aim assist cone for slingshot
    this.targetLockedEnemy = null;
    let minAngle = (COMBAT_CONSTANTS.AIM_ASSIST_CONE_DEG * Math.PI) / 180;

    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;

      const toEnemy = new THREE.Vector3().subVectors(enemy.position, player.position);
      const dist = toEnemy.length();

      if (dist <= COMBAT_CONSTANTS.SLINGSHOT_RANGE) {
        toEnemy.normalize();
        const angle = cameraForward.angleTo(toEnemy);
        if (angle < minAngle) {
          minAngle = angle;
          this.targetLockedEnemy = enemy;
        }
      }
    }
  }

  public handlePlayerAttack(player: Player): void {
    if (player.currentEquippedItem === 'slingshot') {
      this.fireSlingshot(player);
    } else {
      this.performMelee(player);
    }
  }

  private performMelee(player: Player): void {
    SoundSynth.get().playChop();

    // Soft lock-on within 2 metres
    let nearest: Enemy | null = null;
    let minD: number = COMBAT_CONSTANTS.SOFT_LOCK_DISTANCE;

    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      const d = player.position.distanceTo(enemy.position);
      if (d < minD) {
        minD = d;
        nearest = enemy;
      }
    }

    if (nearest) {
      // Soft lock: magnetize player rotation towards target
      const toEnemy = new THREE.Vector3().subVectors(nearest.position, player.position);
      player.rotationY = Math.atan2(toEnemy.x, toEnemy.z);

      nearest.takeDamage(COMBAT_CONSTANTS.MELEE_DAMAGE);
      SoundSynth.get().playMetalHit();
    }
  }

  private fireSlingshot(player: Player): void {
    SoundSynth.get().playChop();

    // If locked target exists, deal damage to it
    if (this.targetLockedEnemy && !this.targetLockedEnemy.isDead) {
      this.targetLockedEnemy.takeDamage(COMBAT_CONSTANTS.SLINGSHOT_DAMAGE);
      SoundSynth.get().playMetalHit();
    } else {
      // Find closest enemy in forward direction
      const pForward = new THREE.Vector3(-Math.sin(player.rotationY), 0, -Math.cos(player.rotationY));
      for (const enemy of this.enemies) {
        if (enemy.isDead) continue;
        const toEnemy = new THREE.Vector3().subVectors(enemy.position, player.position);
        if (toEnemy.length() <= COMBAT_CONSTANTS.SLINGSHOT_RANGE) {
          toEnemy.normalize();
          if (pForward.angleTo(toEnemy) < 0.4) {
            enemy.takeDamage(COMBAT_CONSTANTS.SLINGSHOT_DAMAGE);
            SoundSynth.get().playMetalHit();
            break;
          }
        }
      }
    }
  }
}
