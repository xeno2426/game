import * as THREE from 'three';

export interface PlayerStats {
  maxHp: number;
  moveSpeed: number;
  fireRate: number;      // shots per second
  bulletDamage: number;
  bulletSpeed: number;
  dashCooldown: number;  // seconds
  pickupRadius: number;
}

export class Player {
  public mesh: THREE.Group;
  public position: THREE.Vector3;
  public hp: number;
  public stats: PlayerStats;

  // Dash state
  public isDashing = false;
  public dashTimer = 0;
  public dashDuration = 0.16; // seconds of dash burst
  public dashCooldownTimer = 0;
  public dashDirection = new THREE.Vector3(0, 0, -1);

  // Invulnerability & damage flash
  public invulnerableTimer = 0;
  public flashTimer = 0;
  private hullMaterial: THREE.MeshStandardMaterial;
  private glowMaterial: THREE.MeshBasicMaterial;

  // Arena bounds
  public arenaHalfWidth = 26;
  public arenaHalfDepth = 26;

  // Scratch vectors for zero GC
  private static readonly _moveDir = new THREE.Vector3();

  constructor() {
    this.stats = {
      maxHp: 100,
      moveSpeed: 10.5,
      fireRate: 4.5,
      bulletDamage: 25,
      bulletSpeed: 28,
      dashCooldown: 1.25,
      pickupRadius: 4.5,
    };
    this.hp = this.stats.maxHp;

    this.mesh = new THREE.Group();
    this.position = this.mesh.position;
    this.position.set(0, 0.4, 0);

    // Build low-poly cyber-ship
    this.hullMaterial = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      roughness: 0.3,
      metalness: 0.8,
      flatShading: true,
    });

    this.glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
    });

    // Central sleek fuselage
    const bodyGeo = new THREE.ConeGeometry(0.7, 2.0, 5);
    bodyGeo.rotateX(Math.PI / 2); // point forward along -Z
    const body = new THREE.Mesh(bodyGeo, this.hullMaterial);
    body.scale.set(0.9, 0.4, 1.0);
    this.mesh.add(body);

    // Cockpit canopy
    const canopyGeo = new THREE.BoxGeometry(0.4, 0.35, 0.7);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x051025,
      roughness: 0.1,
      metalness: 0.9,
    });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(0, 0.22, -0.1);
    this.mesh.add(canopy);

    // Wings
    const wingGeo = new THREE.BoxGeometry(2.4, 0.08, 0.9);
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x0f2038,
      roughness: 0.4,
      metalness: 0.7,
      flatShading: true,
    });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.position.set(0, 0.05, 0.2);
    this.mesh.add(wings);

    // Left and right blaster cannons
    const cannonGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.8, 6);
    cannonGeo.rotateX(Math.PI / 2);
    const cannonMat = new THREE.MeshStandardMaterial({
      color: 0x445566,
      metalness: 0.9,
    });
    const leftCannon = new THREE.Mesh(cannonGeo, cannonMat);
    leftCannon.position.set(-0.85, 0.05, -0.3);
    const rightCannon = new THREE.Mesh(cannonGeo, cannonMat);
    rightCannon.position.set(0.85, 0.05, -0.3);
    this.mesh.add(leftCannon);
    this.mesh.add(rightCannon);

    // Engine thruster glow
    const thrusterGeo = new THREE.CylinderGeometry(0.2, 0.3, 0.3, 6);
    thrusterGeo.rotateX(Math.PI / 2);
    const thruster = new THREE.Mesh(thrusterGeo, this.glowMaterial);
    thruster.position.set(0, 0.05, 0.95);
    this.mesh.add(thruster);
  }

  public update(
    dt: number,
    moveInput: THREE.Vector2,
    aimInput: THREE.Vector2,
    isAiming: boolean
  ) {
    // Update cooldowns
    if (this.dashCooldownTimer > 0) {
      this.dashCooldownTimer = Math.max(0, this.dashCooldownTimer - dt);
    }
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
    }
    if (this.flashTimer > 0) {
      this.flashTimer = Math.max(0, this.flashTimer - dt);
      if (this.flashTimer <= 0) {
        this.hullMaterial.color.setHex(0x00f0ff);
      }
    }

    // Dash update
    if (this.isDashing) {
      this.dashTimer -= dt;
      const dashSpeed = this.stats.moveSpeed * 3.2;
      this.position.x += this.dashDirection.x * dashSpeed * dt;
      this.position.z += this.dashDirection.z * dashSpeed * dt;

      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    } else {
      // Normal movement
      if (moveInput.lengthSq() > 0.01) {
        // moveInput.x -> X, moveInput.y -> Z
        Player._moveDir.set(moveInput.x, 0, moveInput.y).normalize();
        const speed = this.stats.moveSpeed;
        this.position.x += Player._moveDir.x * speed * dt;
        this.position.z += Player._moveDir.z * speed * dt;
      }
    }

    // Clamp within arena bounds
    this.position.x = Math.max(-this.arenaHalfWidth, Math.min(this.arenaHalfWidth, this.position.x));
    this.position.z = Math.max(-this.arenaHalfDepth, Math.min(this.arenaHalfDepth, this.position.z));

    // Ship Rotation
    if (isAiming && aimInput.lengthSq() > 0.05) {
      // Aim takes precedence
      const targetAngle = Math.atan2(aimInput.x, aimInput.y);
      this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetAngle + Math.PI, 0.35);
    } else if (moveInput.lengthSq() > 0.05) {
      // Face movement direction
      const targetAngle = Math.atan2(moveInput.x, moveInput.y);
      this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetAngle + Math.PI, 0.25);
    }

    // Bank / roll slightly into turns
    const rollTarget = -moveInput.x * 0.25;
    this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, rollTarget, 0.2);
  }

  public triggerDash(): boolean {
    if (this.dashCooldownTimer > 0 || this.isDashing) return false;

    this.isDashing = true;
    this.dashTimer = this.dashDuration;
    this.dashCooldownTimer = this.stats.dashCooldown;
    this.invulnerableTimer = this.dashDuration + 0.1; // invulnerable during dash

    // Dash towards current ship facing
    const facingAngle = this.mesh.rotation.y;
    this.dashDirection.set(-Math.sin(facingAngle), 0, -Math.cos(facingAngle)).normalize();
    return true;
  }

  public takeDamage(amount: number): boolean {
    if (this.invulnerableTimer > 0 || this.hp <= 0) return false;

    this.hp = Math.max(0, this.hp - amount);
    this.invulnerableTimer = 0.5; // half second i-frames
    this.flashTimer = 0.15;
    this.hullMaterial.color.setHex(0xff0055);
    return true;
  }

  public heal(amount: number) {
    this.hp = Math.min(this.stats.maxHp, this.hp + amount);
  }

  public reset(stats?: Partial<PlayerStats>) {
    if (stats) {
      Object.assign(this.stats, stats);
    }
    this.hp = this.stats.maxHp;
    this.position.set(0, 0.4, 0);
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashCooldownTimer = 0;
    this.invulnerableTimer = 0;
    this.flashTimer = 0;
    this.hullMaterial.color.setHex(0x00f0ff);
  }
}
