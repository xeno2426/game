import { getSvgIcon } from './icons';
import type { InputManager } from '../core/InputManager';

export class TouchControls {
  private joystickEl: HTMLElement;
  private joystickKnob: HTMLElement;
  private inputManager: InputManager;
  private interactBtn: HTMLElement | null = null;
  private attackBtn: HTMLElement | null = null;
  private isBuildMode = false;

  // Joystick DOM diff caching (B7)
  private prevJoyActive = false;
  private prevJoyOriginX = -999;
  private prevJoyOriginY = -999;
  private prevKnobDx = -999;
  private prevKnobDy = -999;
  private prevSprinting = false;

  constructor(inputManager: InputManager) {
    this.inputManager = inputManager;

    // Joystick DOM overlay
    const joy = document.createElement('div');
    joy.className = 'virtual-joystick';
    joy.innerHTML = '<div class="joystick-knob"></div>';
    document.getElementById('app')?.appendChild(joy);

    this.joystickEl = joy;
    this.joystickKnob = joy.querySelector('.joystick-knob') as HTMLElement;

    // Action Cluster
    const cluster = document.createElement('div');
    cluster.className = 'action-cluster hud-interactive';
    cluster.innerHTML = `
      <div class="action-row">
        <button id="btn-inventory" class="action-btn" title="Open Inventory">
          ${getSvgIcon('inventory', 24)}
        </button>
        <button id="btn-camera" class="action-btn" title="Toggle First/Third Person">
          ${getSvgIcon('cameraView', 24)}
        </button>
        <button id="btn-rotate" class="action-btn" title="Rotate Structure 90 Degrees">
          ${getSvgIcon('rotate', 24)}
        </button>
      </div>
      <div class="action-row">
        <button id="btn-build" class="action-btn" title="Radial Build Menu">
          ${getSvgIcon('build', 24)}
        </button>
        <button id="btn-interact" class="action-btn interact-btn disabled" title="Context Interact" disabled>
          ${getSvgIcon('interact', 26)}
        </button>
      </div>
      <div class="action-row">
        <button id="btn-dodge" class="action-btn" title="Dodge Roll">
          ${getSvgIcon('dodge', 26)}
        </button>
        <button id="btn-jump" class="action-btn" title="Jump">
          ${getSvgIcon('jump', 26)}
        </button>
        <button id="btn-attack" class="action-btn attack-btn" title="Attack / Chop">
          ${getSvgIcon('attack', 28)}
        </button>
      </div>
    `;

    document.getElementById('app')?.appendChild(cluster);

    this.interactBtn = cluster.querySelector('#btn-interact');
    this.attackBtn = cluster.querySelector('#btn-attack');

    this.bindButtons(cluster);
  }

  private bindButtons(cluster: HTMLElement): void {
    const bindButton = (id: string, onDown: () => void, onUp?: () => void) => {
      const btn = cluster.querySelector(id) as HTMLElement;
      if (!btn) return;

      btn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        try {
          btn.setPointerCapture(e.pointerId);
        } catch {
          // Ignore capture failures in tests or unsupported environments
        }
        btn.classList.add('pressed');
        onDown();
      });

      const releaseHandler = (e: PointerEvent) => {
        e.stopPropagation();
        try {
          if (btn.hasPointerCapture(e.pointerId)) {
            btn.releasePointerCapture(e.pointerId);
          }
        } catch {
          // Ignore release failures
        }
        btn.classList.remove('pressed');
        if (onUp) {
          onUp();
        }
      };

      btn.addEventListener('pointerup', releaseHandler);
      btn.addEventListener('pointercancel', releaseHandler);
      btn.addEventListener('lostpointercapture', releaseHandler);
    };

    // Level-based action: attack
    bindButton(
      '#btn-attack',
      () => { this.inputManager.state.isAttackPressed = true; },
      () => { this.inputManager.state.isAttackPressed = false; }
    );

    // One-shot actions latched on pointerdown, cleared only when game loop consumes them
    bindButton('#btn-jump', () => { this.inputManager.state.isJumpPressed = true; });
    bindButton('#btn-dodge', () => { this.inputManager.state.isDodgePressed = true; });
    bindButton('#btn-interact', () => { this.inputManager.state.isInteractPressed = true; });
    bindButton('#btn-rotate', () => { this.inputManager.state.isRotatePressed = true; });
    bindButton('#btn-inventory', () => { this.inputManager.state.isInventoryTogglePressed = true; });
    bindButton('#btn-camera', () => { this.inputManager.state.isFirstPersonTogglePressed = true; });
    bindButton('#btn-build', () => { this.inputManager.state.isBuildMenuTogglePressed = true; });

    // Clear held states on window blur and visibilitychange
    const clearHeld = () => {
      this.inputManager.clearHeldInputs();
      cluster.querySelectorAll('.action-btn').forEach((btn) => {
        btn.classList.remove('pressed');
      });
    };

    window.addEventListener('blur', clearHeld);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearHeld();
      }
    });
  }

  public setInteractState(enabled: boolean, actionName?: string | null): void {
    if (!this.interactBtn) return;
    if (enabled) {
      this.interactBtn.classList.remove('disabled');
      this.interactBtn.removeAttribute('disabled');
      this.interactBtn.title = actionName ? `Interact: ${actionName}` : 'Context Interact';
    } else {
      this.interactBtn.classList.add('disabled');
      this.interactBtn.setAttribute('disabled', 'true');
      this.interactBtn.title = 'No context action';
    }
  }

  public setBuildMode(active: boolean): void {
    if (this.isBuildMode === active || !this.attackBtn) return;
    this.isBuildMode = active;

    if (active) {
      this.attackBtn.classList.add('place-mode');
      this.attackBtn.title = 'Place Structure';
      this.attackBtn.innerHTML = getSvgIcon('checkmark', 28);
    } else {
      this.attackBtn.classList.remove('place-mode');
      this.attackBtn.title = 'Attack / Chop';
      this.attackBtn.innerHTML = getSvgIcon('attack', 28);
    }
  }

  public update(): void {
    const isActive = this.inputManager.isJoystickActive;
    if (isActive) {
      if (!this.prevJoyActive) {
        this.joystickEl.style.display = 'block';
        this.prevJoyActive = true;
      }

      const ox = this.inputManager.joystickOrigin.x;
      const oy = this.inputManager.joystickOrigin.y;
      if (ox !== this.prevJoyOriginX || oy !== this.prevJoyOriginY) {
        this.joystickEl.style.left = `${ox}px`;
        this.joystickEl.style.top = `${oy}px`;
        this.prevJoyOriginX = ox;
        this.prevJoyOriginY = oy;
      }

      const dx = Math.round(this.inputManager.joystickThumb.x - ox);
      const dy = Math.round(this.inputManager.joystickThumb.y - oy);
      if (dx !== this.prevKnobDx || dy !== this.prevKnobDy) {
        this.joystickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        this.prevKnobDx = dx;
        this.prevKnobDy = dy;
      }

      const isSprinting = this.inputManager.state.isSprinting;
      if (isSprinting !== this.prevSprinting) {
        this.joystickEl.classList.toggle('sprinting', isSprinting);
        this.prevSprinting = isSprinting;
      }
    } else if (this.prevJoyActive) {
      this.joystickEl.style.display = 'none';
      this.prevJoyActive = false;
    }
  }
}
