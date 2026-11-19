import * as THREE from 'three';
import { AssetRegistry, type PlayerRig } from './AssetRegistry';
import { MOVEMENT_CONSTANTS, VITALS_CONSTANTS } from '../data/constants';
import { getForwardFromYaw } from '../logic/combatLogic';
import type { InputState } from '../core/InputManager';
import type { Terrain } from '../world/Terrain';

export class Player {
  public rig: PlayerRig;
  public position: THREE.Vector3 = new THREE.Vector3(0, 8, 12);
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public rotationY = 0;

  public isGrounded = true;
  public isSwimming = false;
  public isDodging = false;
  public dodgeTimer = 0;
  public attackTimer = 0;

  public currentEquippedItem: string | null = 'scrap_axe';
  private equippedMesh: THREE.Object3D | null = null;

  // Animation cycle accumulator
  private animTime = 0;
  private updateResult = { staminaCost: 0, dodgeCost: 0, hasAttacked: false };

  // Scratch vectors for zero allocation
  private _moveDir = new THREE.Vector3();
  private _forward = new THREE.Vector3();
  private _right = new THREE.Vector3();

  constructor(scene: THREE.Scene) {
    this.rig = AssetRegistry.get().createPlayerMesh();
    this.rig.root.position.copy(this.position);
    scene.add(this.rig.root);

    this.equipItem('scrap_axe');
  }

  public equipItem(itemId: string | null): void {
    if (itemId === this.currentEquippedItem && (this.equippedMesh !== null || itemId === null)) {
      return;
    }
    this.currentEquippedItem = itemId;
    if (this.equippedMesh) {
      this.rig.weaponSocket.remove(this.equippedMesh);
      this.equippedMesh = null;
    }

    if (itemId === 'scrap_axe') {
      this.equippedMesh = AssetRegistry.get().createScrapAxe();
      this.rig.weaponSocket.add(this.equippedMesh);
    } else if (itemId === 'slingshot') {
      this.equippedMesh = AssetRegistry.get().createSlingshot();
      this.rig.weaponSocket.add(this.equippedMesh);
    }
  }

  public getForwardVector(target?: THREE.Vector3): THREE.Vector3 {
    const out = target || new THREE.Vector3();
    getForwardFromYaw(this.rotationY, out);
    return out;
  }

  public update(
    dt: number,
    input: InputState,
    cameraYaw: number,
    terrain: Terrain,
    waterLevel: number,
    stamina: number,
    isBoarded = false,
    boardedDeckHeight?: number,
    buildingSystem?: {
      getGroundHeight: (terrainH: number, x: number, y: number, z: number) => number;
      resolveHorizontalCollision: (pos: { x: number; y: number; z: number }, radius: number) => boolean;
    }
  ): { staminaCost: number; dodgeCost: number; hasAttacked: boolean } {
    let staminaCost = 0;
    let dodgeCost = 0;
    let hasAttacked = false;

    // Attack cooldown
    if (this.attackTimer > 0) {
      this.attackTimer = Math.max(0, this.attackTimer - dt);
    }

    if (input.isAttackPressed && this.attackTimer === 0) {
      this.attackTimer = 0.45;
      hasAttacked = true;
    }

    if (isBoarded) {
      this.isSwimming = false;
      this.isGrounded = true;
      this.velocity.set(0, 0, 0);
      if (boardedDeckHeight !== undefined) {
        this.position.y = boardedDeckHeight;
      }
      this.rig.root.position.copy(this.position);
      this.rig.root.rotation.y = this.rotationY;
      this.updateAnimation(dt, 0);
      return { staminaCost: 0, dodgeCost: 0, hasAttacked };
    }

    // Dodge action
    if (input.isJumpPressed && !this.isDodging && this.isGrounded && stamina >= VITALS_CONSTANTS.STAMINA_DODGE_COST) {
      this.isDodging = true;
      this.dodgeTimer = MOVEMENT_CONSTANTS.DODGE_DURATION;
      dodgeCost = VITALS_CONSTANTS.STAMINA_DODGE_COST;
      staminaCost += VITALS_CONSTANTS.STAMINA_DODGE_COST;
    }

    if (this.isDodging) {
      this.dodgeTimer -= dt;
      if (this.dodgeTimer <= 0) {
        this.isDodging = false;
      }
    }

    // Camera relative movement
    this._forward.set(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw)).normalize();
    this._right.set(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw)).normalize();

    this._moveDir.set(0, 0, 0);
    this._moveDir.addScaledVector(this._right, input.moveX);
    this._moveDir.addScaledVector(this._forward, -input.moveZ);

    const inputLen = this._moveDir.length();
    if (inputLen > 1.0) {
      this._moveDir.normalize();
    }

    // Swimming check
    const terrainH = terrain.getHeight(this.position.x, this.position.z);
    this.isSwimming = this.position.y < waterLevel - 0.4;

    // Movement speed resolution
    let targetSpeed = 0;
    if (this.isDodging) {
      targetSpeed = MOVEMENT_CONSTANTS.DODGE_SPEED;
    } else if (this.isSwimming) {
      targetSpeed = MOVEMENT_CONSTANTS.SWIM_SPEED * inputLen;
    } else if (input.isSprinting && stamina > 0) {
      targetSpeed = MOVEMENT_CONSTANTS.SPRINT_SPEED * inputLen;
      staminaCost += VITALS_CONSTANTS.STAMINA_SPRINT_DRAIN_PER_SEC * dt;
    } else {
      targetSpeed = MOVEMENT_CONSTANTS.WALK_SPEED * inputLen;
    }

    // Update horizontal position
    if (inputLen > 0.05 || this.isDodging) {
      this.position.x += this._moveDir.x * targetSpeed * dt;
      this.position.z += this._moveDir.z * targetSpeed * dt;

      // Face movement direction
      const targetAngle = Math.atan2(this._moveDir.x, this._moveDir.z);
      // Angular slerp
      let diff = targetAngle - this.rotationY;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.rotationY += diff * Math.min(1.0, dt * 12.0);
    }

    if (buildingSystem) {
      buildingSystem.resolveHorizontalCollision(this.position, MOVEMENT_CONSTANTS.PLAYER_RADIUS);
    }

    // Vertical physics & heightfield/structure collision
    const groundH = buildingSystem
      ? buildingSystem.getGroundHeight(terrainH, this.position.x, this.position.y, this.position.z)
      : terrainH;

    this.isSwimming = this.position.y < waterLevel - 0.4 && groundH < waterLevel;

    if (this.isSwimming) {
      // Bobbing on water surface
      const targetY = waterLevel - 0.8;
      this.position.y += (targetY - this.position.y) * Math.min(1.0, dt * 8.0);
      this.velocity.y = 0;
      this.isGrounded = false;
    } else {
      // Normal gravity
      this.velocity.y -= MOVEMENT_CONSTANTS.GRAVITY * dt;
      this.position.y += this.velocity.y * dt;

      // Ground clamping
      if (this.position.y <= groundH) {
        this.position.y = groundH;
        this.velocity.y = 0;
        this.isGrounded = true;
      } else {
        this.isGrounded = false;
      }
    }

    this.rig.root.position.copy(this.position);
    this.rig.root.rotation.y = this.rotationY;

    // Procedural animation update
    this.updateAnimation(dt, targetSpeed);

    this.updateResult.staminaCost = staminaCost;
    this.updateResult.dodgeCost = dodgeCost;
    this.updateResult.hasAttacked = hasAttacked;
    return this.updateResult;
  }

  private updateAnimation(dt: number, speed: number): void {
    this.animTime += dt * Math.max(1.5, speed * 2.2);

    const isMoving = speed > 0.2;
    const swingFactor = isMoving ? Math.sin(this.animTime) : 0;

    // Limb swing
    this.rig.leftLeg.rotation.x = swingFactor * 0.65;
    this.rig.rightLeg.rotation.x = -swingFactor * 0.65;
    this.rig.leftArm.rotation.x = -swingFactor * 0.5;

    // If attacking, play rapid chop with right arm
    if (this.attackTimer > 0) {
      const chopProgress = 1.0 - this.attackTimer / 0.45;
      const chopAngle = Math.sin(chopProgress * Math.PI) * 1.4;
      this.rig.rightArm.rotation.x = -chopAngle;
    } else {
      this.rig.rightArm.rotation.x = swingFactor * 0.5;
    }

    // Torso idle breathing / bounce
    const bounce = isMoving ? Math.abs(Math.cos(this.animTime)) * 0.08 : Math.sin(this.animTime * 1.5) * 0.02;
    this.rig.torso.position.y = 1.05 + bounce;
  }
}
