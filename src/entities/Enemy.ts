import * as THREE from 'three';
import { AssetRegistry } from './AssetRegistry';
import { ENEMY_CONSTANTS } from '../data/constants';
import { SoundSynth } from '../audio/SoundSynth';
import type { Terrain } from '../world/Terrain';

export type EnemyType = 'hound' | 'lurker';
export type EnemyState = 'idle' | 'chase' | 'telegraph' | 'lunge' | 'cooldown' | 'dead';

export class Enemy {
  public id: string;
  public type: EnemyType;
  public object: THREE.Group;
  public position: THREE.Vector3;
  public prevPosition: THREE.Vector3;
  public rotationY = 0;
  public prevRotationY = 0;
  public health: number;
  public maxHealth: number;
  public state: EnemyState = 'idle';

  private stateTimer = 0;
  private lungeDir = new THREE.Vector3();
  private hasHitThisLunge = false;
  private _toPlayer = new THREE.Vector3();
  public isDead = false;

  constructor(id: string, type: EnemyType, startPos: THREE.Vector3, scene: THREE.Scene) {
    this.id = id;
    this.type = type;
    this.position = startPos.clone();
    this.prevPosition = startPos.clone();

    if (type === 'hound') {
      this.object = AssetRegistry.get().createHound();
      this.health = ENEMY_CONSTANTS.HOUND_HP;
      this.maxHealth = ENEMY_CONSTANTS.HOUND_HP;
    } else {
      this.object = AssetRegistry.get().createLurker();
      this.health = ENEMY_CONSTANTS.LURKER_HP;
      this.maxHealth = ENEMY_CONSTANTS.LURKER_HP;
    }

    this.object.position.copy(this.position);
    scene.add(this.object);
  }

  public takeDamage(damage: number): boolean {
    if (this.isDead) return false;
    this.health -= damage;
    if (this.health <= 0) {
      this.isDead = true;
      this.state = 'dead';
      this.object.visible = false;
      return true;
    }
    return false;
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    terrain: Terrain,
    waterLevel: number,
    onPlayerHit: (damage: number) => void
  ): void {
    if (this.isDead) return;

    this.prevPosition.copy(this.position);
    this.prevRotationY = this.rotationY;

    const distToPlayer = this.position.distanceTo(playerPos);

    if (this.type === 'hound') {
      this.updateHound(dt, playerPos, distToPlayer, terrain, onPlayerHit);
    } else {
      this.updateLurker(dt, playerPos, distToPlayer, waterLevel, onPlayerHit);
    }

    this.object.position.copy(this.position);
    this.object.rotation.y = this.rotationY;

    if (this.type === 'hound' && this.state === 'telegraph') {
      this.object.position.y = this.position.y + 0.15;
    }

    if (this.object.userData.mixer) {
      this.object.userData.mixer.update(dt);
    }
  }

  private updateHound(
    dt: number,
    playerPos: THREE.Vector3,
    distToPlayer: number,
    terrain: Terrain,
    onPlayerHit: (damage: number) => void
  ): void {
    this._toPlayer.subVectors(playerPos, this.position);
    this._toPlayer.y = 0;

    switch (this.state) {
      case 'idle':
        if (distToPlayer < 12.0) {
          this.state = 'chase';
        }
        break;

      case 'chase':
        if (distToPlayer > 18.0) {
          this.state = 'idle';
        } else if (distToPlayer <= ENEMY_CONSTANTS.HOUND_ATTACK_RANGE) {
          // Enter 1-second telegraph
          this.state = 'telegraph';
          this.stateTimer = ENEMY_CONSTANTS.HOUND_TELEGRAPH_SEC;
          this.lungeDir.copy(this._toPlayer).normalize();
          SoundSynth.get().playHoundRoar();
        } else {
          // Run toward player
          this._toPlayer.normalize();
          this.position.x += this._toPlayer.x * ENEMY_CONSTANTS.HOUND_SPEED * dt;
          this.position.z += this._toPlayer.z * ENEMY_CONSTANTS.HOUND_SPEED * dt;
          this.rotationY = Math.atan2(this._toPlayer.x, this._toPlayer.z);
        }
        break;

      case 'telegraph':
        this.stateTimer -= dt;
        // Visual telegraph: trembles in anticipation
        this.object.rotation.z = Math.sin(this.stateTimer * 25.0) * 0.1;
        this.object.position.y = this.position.y + 0.15;

        if (this.stateTimer <= 0) {
          this.state = 'lunge';
          this.stateTimer = ENEMY_CONSTANTS.HOUND_LUNGE_DURATION;
          this.hasHitThisLunge = false;
          this.object.rotation.z = 0;
        }
        break;

      case 'lunge':
        this.stateTimer -= dt;
        this.position.x += this.lungeDir.x * ENEMY_CONSTANTS.HOUND_LUNGE_SPEED * dt;
        this.position.z += this.lungeDir.z * ENEMY_CONSTANTS.HOUND_LUNGE_SPEED * dt;

        // Check if hit player during lunge
        if (!this.hasHitThisLunge && distToPlayer < 1.4) {
          this.hasHitThisLunge = true;
          onPlayerHit(ENEMY_CONSTANTS.HOUND_DAMAGE);
        }

        if (this.stateTimer <= 0) {
          this.state = 'cooldown';
          this.stateTimer = 0.8;
        }
        break;

      case 'cooldown':
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.state = 'chase';
        }
        break;
    }

    // Clamp hound height to terrain
    this.position.y = terrain.getHeight(this.position.x, this.position.z);
  }

  private updateLurker(
    dt: number,
    playerPos: THREE.Vector3,
    distToPlayer: number,
    waterLevel: number,
    onPlayerHit: (damage: number) => void
  ): void {
    this._toPlayer.subVectors(playerPos, this.position);
    this._toPlayer.y = 0;

    if (distToPlayer < ENEMY_CONSTANTS.LURKER_AGGRO_RANGE) {
      this._toPlayer.normalize();
      this.position.x += this._toPlayer.x * ENEMY_CONSTANTS.LURKER_SWIM_SPEED * dt;
      this.position.z += this._toPlayer.z * ENEMY_CONSTANTS.LURKER_SWIM_SPEED * dt;
      this.rotationY = Math.atan2(this._toPlayer.x, this._toPlayer.z);

      if (distToPlayer < ENEMY_CONSTANTS.LURKER_ATTACK_RANGE) {
        onPlayerHit(ENEMY_CONSTANTS.LURKER_DAMAGE * dt);
      }
    }

    // Lurker floats on water surface
    this.position.y = waterLevel - 0.4;
  }

  public render(alpha: number): void {
    if (this.isDead) return;
    this.object.position.lerpVectors(this.prevPosition, this.position, alpha);
    let diff = this.rotationY - this.prevRotationY;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.object.rotation.y = this.prevRotationY + diff * alpha;
  }
}
