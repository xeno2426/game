export interface InputState {
  // Movement vector [-1, 1]
  moveX: number;
  moveZ: number;
  isSprinting: boolean;

  // Camera delta
  cameraDeltaX: number;
  cameraDeltaY: number;

  // Actions
  isAttackPressed: boolean;
  isJumpPressed: boolean;
  isDodgePressed: boolean;
  isInteractPressed: boolean;
  isRotatePressed: boolean;
  isFirstPersonTogglePressed: boolean;
  isBuildMenuTogglePressed: boolean;
  isInventoryTogglePressed: boolean;
  isEscapePressed: boolean;

  // Active quickslot (0 to 4)
  activeQuickSlot: number;
}

export class InputManager {
  public state: InputState = {
    moveX: 0,
    moveZ: 0,
    isSprinting: false,
    cameraDeltaX: 0,
    cameraDeltaY: 0,
    isAttackPressed: false,
    isJumpPressed: false,
    isDodgePressed: false,
    isInteractPressed: false,
    isRotatePressed: false,
    isFirstPersonTogglePressed: false,
    isBuildMenuTogglePressed: false,
    isInventoryTogglePressed: false,
    isEscapePressed: false,
    activeQuickSlot: 0,
  };

  // Joystick state
  private joystickPointerId: number | null = null;
  private joystickStartX = 0;
  private joystickStartY = 0;
  private joystickCurrentX = 0;
  private joystickCurrentY = 0;
  private joystickMaxRadius = 50.0;
  public isJoystickActive = false;
  public joystickOrigin = { x: 0, y: 0 };
  public joystickThumb = { x: 0, y: 0 };

  // Camera drag state
  private cameraPointerId: number | null = null;
  private cameraLastX = 0;
  private cameraLastY = 0;
  private cameraDeltaResult = { dx: 0, dy: 0 };

  // Keyboard state
  private keysDown: Set<string> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupTouchListeners();
      this.setupKeyboardListeners();
    }
  }

  private setupTouchListeners(): void {
    window.addEventListener('contextmenu', (e) => {
      const target = e.target as HTMLElement | null;
      if (!target || !target.closest('input, textarea')) {
        e.preventDefault();
      }
    });

    window.addEventListener(
      'pointerdown',
      (e) => {
        // Ignore interactive UI clicks handled by DOM
        const target = e.target as HTMLElement | null;
        if (target && target.closest('.hud-interactive, button, .interactive')) {
          return;
        }

        if (e.pointerType === 'mouse') {
          if (e.button === 0) {
            // Desktop left-click = attack
            this.state.isAttackPressed = true;
          } else if (e.button === 2) {
            // Desktop right-click = camera drag
            this.cameraPointerId = e.pointerId;
            this.cameraLastX = e.clientX;
            this.cameraLastY = e.clientY;
          }
          return;
        }

        // Touch pointers
        const isLeftHalf = e.clientX < window.innerWidth / 2;

        if (isLeftHalf && this.joystickPointerId === null) {
          this.joystickPointerId = e.pointerId;
          this.joystickStartX = e.clientX;
          this.joystickStartY = e.clientY;
          this.joystickCurrentX = e.clientX;
          this.joystickCurrentY = e.clientY;
          this.isJoystickActive = true;
          this.joystickOrigin = { x: e.clientX, y: e.clientY };
          this.joystickThumb = { x: e.clientX, y: e.clientY };
        } else if (!isLeftHalf && this.cameraPointerId === null) {
          this.cameraPointerId = e.pointerId;
          this.cameraLastX = e.clientX;
          this.cameraLastY = e.clientY;
        }
      },
      { passive: false }
    );

    window.addEventListener(
      'pointermove',
      (e) => {
        if (document.pointerLockElement) {
          this.state.cameraDeltaX += e.movementX;
          this.state.cameraDeltaY += e.movementY;
          return;
        }

        if (e.pointerId === this.joystickPointerId) {
          this.joystickCurrentX = e.clientX;
          this.joystickCurrentY = e.clientY;

          const dx = this.joystickCurrentX - this.joystickStartX;
          const dy = this.joystickCurrentY - this.joystickStartY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const clampedDist = Math.min(dist, this.joystickMaxRadius);
          const angle = Math.atan2(dy, dx);

          this.joystickThumb.x = this.joystickStartX + Math.cos(angle) * clampedDist;
          this.joystickThumb.y = this.joystickStartY + Math.sin(angle) * clampedDist;

          const norm = clampedDist / this.joystickMaxRadius;
          this.state.moveX = (dx / (dist || 1)) * norm;
          this.state.moveZ = (dy / (dist || 1)) * norm;

          // Outer rim deflection (> 75%) automatically triggers sprint
          this.state.isSprinting = norm > 0.75;
        } else if (e.pointerId === this.cameraPointerId) {
          const dx = e.clientX - this.cameraLastX;
          const dy = e.clientY - this.cameraLastY;
          this.state.cameraDeltaX += dx;
          this.state.cameraDeltaY += dy;
          this.cameraLastLast(e.clientX, e.clientY);
        }
      },
      { passive: true }
    );

    const onPointerEnd = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button === 0) {
        this.state.isAttackPressed = false;
      }
      if (e.pointerId === this.joystickPointerId) {
        this.joystickPointerId = null;
        this.isJoystickActive = false;
        this.state.moveX = 0;
        this.state.moveZ = 0;
        this.state.isSprinting = false;
      } else if (e.pointerId === this.cameraPointerId) {
        this.cameraPointerId = null;
      }
    };

    window.addEventListener('pointerup', onPointerEnd, { passive: true });
    window.addEventListener('pointercancel', onPointerEnd, { passive: true });
  }

  private cameraLastLast(x: number, y: number): void {
    this.cameraLastX = x;
    this.cameraLastY = y;
  }

  private setupKeyboardListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.keysDown.add(e.code);

      if (e.repeat) {
        if (
          e.code === 'KeyF' ||
          e.code === 'KeyR' ||
          e.code === 'KeyB' ||
          e.code === 'KeyI' ||
          e.code === 'Tab' ||
          e.code === 'Escape'
        ) {
          return;
        }
      }

      if (e.code === 'KeyE') this.state.isInteractPressed = true;
      if (e.code === 'Space') this.state.isJumpPressed = true;
      if (e.code === 'KeyC') this.state.isDodgePressed = true;
      if (e.code === 'KeyF') this.state.isFirstPersonTogglePressed = true;
      if (e.code === 'KeyR') this.state.isRotatePressed = true;
      if (e.code === 'KeyB') this.state.isBuildMenuTogglePressed = true;
      if (e.code === 'KeyI' || e.code === 'Tab') {
        e.preventDefault();
        this.state.isInventoryTogglePressed = true;
      }
      if (e.code === 'Escape') {
        this.state.isEscapePressed = true;
      }

      if (e.code === 'Digit1') this.state.activeQuickSlot = 0;
      if (e.code === 'Digit2') this.state.activeQuickSlot = 1;
      if (e.code === 'Digit3') this.state.activeQuickSlot = 2;
      if (e.code === 'Digit4') this.state.activeQuickSlot = 3;
      if (e.code === 'Digit5') this.state.activeQuickSlot = 4;
    });

    window.addEventListener('keyup', (e) => {
      this.keysDown.delete(e.code);
      // One-shot actions are latched on press and cleared only when consumed by game loop, never on keyup/pointerup.
    });

    window.addEventListener('blur', () => this.clearHeldInputs());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.clearHeldInputs();
      }
    });
  }

  public clearHeldInputs(): void {
    this.state.isAttackPressed = false;
    this.state.isSprinting = false;
    this.state.moveX = 0;
    this.state.moveZ = 0;
    this.joystickPointerId = null;
    this.isJoystickActive = false;
    this.cameraPointerId = null;
    this.keysDown.clear();
  }

  public consumeJump(): boolean {
    const val = this.state.isJumpPressed;
    this.state.isJumpPressed = false;
    return val;
  }

  public consumeDodge(): boolean {
    const val = this.state.isDodgePressed;
    this.state.isDodgePressed = false;
    return val;
  }

  public consumeInteract(): boolean {
    const val = this.state.isInteractPressed;
    this.state.isInteractPressed = false;
    return val;
  }

  public consumeRotate(): boolean {
    const val = this.state.isRotatePressed;
    this.state.isRotatePressed = false;
    return val;
  }

  public consumeFirstPersonToggle(): boolean {
    const val = this.state.isFirstPersonTogglePressed;
    this.state.isFirstPersonTogglePressed = false;
    return val;
  }

  public consumeBuildMenuToggle(): boolean {
    const val = this.state.isBuildMenuTogglePressed;
    this.state.isBuildMenuTogglePressed = false;
    return val;
  }

  public consumeInventoryToggle(): boolean {
    const val = this.state.isInventoryTogglePressed;
    this.state.isInventoryTogglePressed = false;
    return val;
  }

  public consumeEscape(): boolean {
    const val = this.state.isEscapePressed;
    this.state.isEscapePressed = false;
    return val;
  }

  public update(): void {
    // Process keyboard movement fallback if no touch joystick
    if (this.joystickPointerId === null) {
      let kx = 0;
      let kz = 0;
      if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) kx -= 1;
      if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) kx += 1;
      if (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp')) kz -= 1;
      if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) kz += 1;

      const len = Math.sqrt(kx * kx + kz * kz);
      if (len > 0) {
        this.state.moveX = kx / len;
        this.state.moveZ = kz / len;
      } else {
        this.state.moveX = 0;
        this.state.moveZ = 0;
      }

      this.state.isSprinting = this.keysDown.has('ShiftLeft') || this.keysDown.has('ShiftRight');
    }
  }

  // Consume per-frame camera deltas
  public consumeCameraDelta(): { dx: number; dy: number } {
    this.cameraDeltaResult.dx = this.state.cameraDeltaX;
    this.cameraDeltaResult.dy = this.state.cameraDeltaY;
    this.state.cameraDeltaX = 0;
    this.state.cameraDeltaY = 0;
    return this.cameraDeltaResult;
  }
}
