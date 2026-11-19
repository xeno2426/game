import * as THREE from 'three';

export interface AimAssistTarget {
  position: THREE.Vector3;
  active: boolean;
}

export class InputSystem {
  // Movement input (-1 to 1)
  public moveVector = new THREE.Vector2(0, 0);
  // Aiming direction (-1 to 1)
  public aimVector = new THREE.Vector2(0, 0);
  public isAiming = false;
  public isFiring = false;

  // Dash trigger
  public dashRequested = false;

  // Pause trigger
  public pauseRequested = false;

  // Pointer IDs tracking
  private movePointerId: number | null = null;
  private aimPointerId: number | null = null;

  // Dynamic joystick positions (screen space px)
  public moveBasePos = new THREE.Vector2(0, 0);
  public moveKnobPos = new THREE.Vector2(0, 0);
  public isMoveActive = false;

  public aimBasePos = new THREE.Vector2(0, 0);
  public aimKnobPos = new THREE.Vector2(0, 0);
  public isAimActive = false;

  private readonly maxRadius = 50; // px joystick radius

  // Desktop keyboard state
  private keys: Record<string, boolean> = {};

  // Scratch vectors for zero GC
  private static readonly _v1 = new THREE.Vector3();
  private static readonly _v2 = new THREE.Vector3();

  constructor() {
    this.setupKeyboardListeners();
  }

  // Bind pointer events on touch zones
  public bindTouchZones(
    leftZone: HTMLElement,
    rightZone: HTMLElement,
    dashBtn: HTMLElement,
    pauseBtn: HTMLElement
  ) {
    // Left Zone (Movement)
    leftZone.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (this.movePointerId !== null) return;
      this.movePointerId = e.pointerId;
      leftZone.setPointerCapture(e.pointerId);

      this.moveBasePos.set(e.clientX, e.clientY);
      this.moveKnobPos.set(e.clientX, e.clientY);
      this.isMoveActive = true;
      this.moveVector.set(0, 0);
    }, { passive: false });

    leftZone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.movePointerId) return;
      e.preventDefault();

      const dx = e.clientX - this.moveBasePos.x;
      const dy = e.clientY - this.moveBasePos.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 0.001) {
        const clampedDist = Math.min(dist, this.maxRadius);
        const norm = clampedDist / this.maxRadius;
        const dirX = dx / dist;
        const dirY = dy / dist;

        this.moveKnobPos.set(
          this.moveBasePos.x + dirX * clampedDist,
          this.moveBasePos.y + dirY * clampedDist
        );
        // In 3D: X is right, -Y is forward (Z negative)
        this.moveVector.set(dirX * norm, dirY * norm);
      } else {
        this.moveKnobPos.copy(this.moveBasePos);
        this.moveVector.set(0, 0);
      }
    }, { passive: false });

    const endMove = (e: PointerEvent) => {
      if (e.pointerId !== this.movePointerId) return;
      if (leftZone.hasPointerCapture(e.pointerId)) {
        leftZone.releasePointerCapture(e.pointerId);
      }
      this.movePointerId = null;
      this.isMoveActive = false;
      this.moveVector.set(0, 0);
    };

    leftZone.addEventListener('pointerup', endMove);
    leftZone.addEventListener('pointercancel', endMove);

    // Right Zone (Aiming & Auto-fire)
    rightZone.addEventListener('pointerdown', (e) => {
      // If clicking dash or pause button directly, don't initiate aim joystick
      if (dashBtn.contains(e.target as Node) || pauseBtn.contains(e.target as Node)) {
        return;
      }
      e.preventDefault();
      if (this.aimPointerId !== null) return;
      this.aimPointerId = e.pointerId;
      rightZone.setPointerCapture(e.pointerId);

      this.aimBasePos.set(e.clientX, e.clientY);
      this.aimKnobPos.set(e.clientX, e.clientY);
      this.isAimActive = true;
      this.aimVector.set(0, 0);
      this.isAiming = false;
      this.isFiring = false;
    }, { passive: false });

    rightZone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.aimPointerId) return;
      e.preventDefault();

      const dx = e.clientX - this.aimBasePos.x;
      const dy = e.clientY - this.aimBasePos.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 0.001) {
        const clampedDist = Math.min(dist, this.maxRadius);
        const norm = clampedDist / this.maxRadius;
        const dirX = dx / dist;
        const dirY = dy / dist;

        this.aimKnobPos.set(
          this.aimBasePos.x + dirX * clampedDist,
          this.aimBasePos.y + dirY * clampedDist
        );

        this.aimVector.set(dirX * norm, dirY * norm);
        // Auto-fire triggers when stick is deflected past deadzone (0.2)
        if (norm > 0.2) {
          this.isAiming = true;
          this.isFiring = true;
        } else {
          this.isAiming = false;
          this.isFiring = false;
        }
      } else {
        this.aimKnobPos.copy(this.aimBasePos);
        this.aimVector.set(0, 0);
        this.isAiming = false;
        this.isFiring = false;
      }
    }, { passive: false });

    const endAim = (e: PointerEvent) => {
      if (e.pointerId !== this.aimPointerId) return;
      if (rightZone.hasPointerCapture(e.pointerId)) {
        rightZone.releasePointerCapture(e.pointerId);
      }
      this.aimPointerId = null;
      this.isAimActive = false;
      this.isAiming = false;
      this.isFiring = false;
      this.aimVector.set(0, 0);
    };

    rightZone.addEventListener('pointerup', endAim);
    rightZone.addEventListener('pointercancel', endAim);

    // Dash button pointer listener
    dashBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.dashRequested = true;
    }, { passive: false });

    // Pause button pointer listener
    pauseBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.pauseRequested = true;
    }, { passive: false });
  }

  // Keyboard and mouse fallback for desktop testing
  private setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Space') {
        this.dashRequested = true;
      }
      if (e.code === 'KeyP' || e.code === 'Escape') {
        this.pauseRequested = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Mouse aiming & firing when touch is not active
    window.addEventListener('mousedown', (e) => {
      if (this.movePointerId !== null || this.aimPointerId !== null) return;
      if (e.button === 0) {
        this.isFiring = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (this.movePointerId !== null || this.aimPointerId !== null) return;
      if (e.button === 0) {
        this.isFiring = false;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.aimPointerId !== null) return;
      // Calculate aim direction relative to screen center
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.hypot(dx, dy);
      if (dist > 10) {
        this.aimVector.set(dx / dist, dy / dist);
        this.isAiming = true;
      }
    });
  }

  // Called each fixed tick to update keyboard input if touch is inactive
  public updateDesktopFallback() {
    if (this.movePointerId === null) {
      let kx = 0;
      let ky = 0;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) kx -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) kx += 1;
      if (this.keys['KeyW'] || this.keys['ArrowUp']) ky -= 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) ky += 1;

      if (kx !== 0 || ky !== 0) {
        const len = Math.hypot(kx, ky);
        this.moveVector.set(kx / len, ky / len);
      } else {
        this.moveVector.set(0, 0);
      }
    }
  }

  /**
   * Light Aim Assist:
   * Given player position and a list of active enemy positions,
   * gently bends aimVector towards closest enemy within a forward cone angle.
   */
  public applyAimAssist(
    playerPos: THREE.Vector3,
    targets: AimAssistTarget[],
    maxAssistAngleRad = 0.45, // ~25 degrees
    maxAssistRange = 22
  ) {
    if (!this.isAiming || this.aimVector.lengthSq() < 0.05) return;

    // Current aim direction in 3D (X, Z)
    const currentAimDir = InputSystem._v1.set(this.aimVector.x, 0, this.aimVector.y).normalize();

    let bestTarget: THREE.Vector3 | null = null;
    let bestScore = -1; // higher dot product = closer to center of aim

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      if (!target.active) continue;

      const toTarget = InputSystem._v2.subVectors(target.position, playerPos);
      toTarget.y = 0;
      const dist = toTarget.length();

      if (dist > 0.1 && dist <= maxAssistRange) {
        toTarget.normalize();
        const dot = currentAimDir.dot(toTarget);
        const angle = Math.acos(Math.max(-1, Math.min(1, dot)));

        if (angle < maxAssistAngleRad) {
          // Weight score by alignment and proximity
          const score = dot / (1 + dist * 0.05);
          if (score > bestScore) {
            bestScore = score;
            bestTarget = target.position;
          }
        }
      }
    }

    if (bestTarget) {
      const targetDir = InputSystem._v2.subVectors(bestTarget, playerPos);
      targetDir.y = 0;
      targetDir.normalize();

      // Softly lerp towards target direction (light aim assist)
      const assistFactor = 0.35; // subtle snap without feeling forced
      const assistedX = THREE.MathUtils.lerp(this.aimVector.x, targetDir.x, assistFactor);
      const assistedZ = THREE.MathUtils.lerp(this.aimVector.y, targetDir.z, assistFactor);

      const len = this.aimVector.length();
      this.aimVector.set(assistedX, assistedZ).normalize().multiplyScalar(len);
    }
  }

  // Consume dash flag
  public consumeDash(): boolean {
    if (this.dashRequested) {
      this.dashRequested = false;
      return true;
    }
    return false;
  }

  // Consume pause flag
  public consumePause(): boolean {
    if (this.pauseRequested) {
      this.pauseRequested = false;
      return true;
    }
    return false;
  }
}
