import * as THREE from 'three';
import type { Enemy } from '../entities/Enemy';
import type { Player } from '../entities/Player';
import { COMBAT_CONSTANTS } from '../data/constants';
import { SoundSynth } from '../audio/SoundSynth';
import { getForwardFromYaw } from '../logic/combatLogic';

export class CombatSystem {
  public enemies: Enemy[] = [];
  public targetLockedEnemy: Enemy | null = null;
  private _toEnemy = new THREE.Vector3();
  private _pForward = new THREE.Vector3();

  public registerEnemy(enemy: Enemy): void {
    this.enemies.push(enemy);
  }

  public unregisterEnemy(id: string): void {
    const idx = this.enemies.findIndex((e) => e.id === id);
    if (idx !== -1) {
      this.enemies.splice(idx, 1);
    }
  }

  public update(player: Player, cameraForward: THREE.Vector3): void {
    // Check auto-aim assist cone for slingshot
    this.targetLockedEnemy = null;
    let minAngle = (COMBAT_CONSTANTS.AIM_ASSIST_CONE_DEG * Math.PI) / 180;

    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;

      this._toEnemy.subVectors(enemy.position, player.position);
      const dist = this._toEnemy.length();

      if (dist <= COMBAT_CONSTANTS.SLINGSHOT_RANGE) {
        this._toEnemy.normalize();
        const angle = cameraForward.angleTo(this._toEnemy);
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
      this._toEnemy.subVectors(nearest.position, player.position);
      player.rotationY = Math.atan2(this._toEnemy.x, this._toEnemy.z);

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
      getForwardFromYaw(player.rotationY, this._pForward);
      for (const enemy of this.enemies) {
        if (enemy.isDead) continue;
        this._toEnemy.subVectors(enemy.position, player.position);
        if (this._toEnemy.length() <= COMBAT_CONSTANTS.SLINGSHOT_RANGE) {
          this._toEnemy.normalize();
          if (this._pForward.angleTo(this._toEnemy) < 0.4) {
            enemy.takeDamage(COMBAT_CONSTANTS.SLINGSHOT_DAMAGE);
            SoundSynth.get().playMetalHit();
            break;
          }
        }
      }
    }
  }
}
