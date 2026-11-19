import { getSvgIcon } from './icons';
import type { InputManager } from '../core/InputManager';

export class TouchControls {
  private joystickEl: HTMLElement;
  private joystickKnob: HTMLElement;
  private inputManager: InputManager;

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
          ${getSvgIcon('inventory', 22)}
        </button>
        <button id="btn-camera" class="action-btn" title="Toggle First/Third Person">
          ${getSvgIcon('cameraView', 22)}
        </button>
        <button id="btn-build" class="action-btn" title="Radial Build Menu">
          ${getSvgIcon('build', 22)}
        </button>
        <button id="btn-rotate" class="action-btn" title="Rotate Structure 90 Degrees">
          ${getSvgIcon('rotate', 22)}
        </button>
      </div>
      <div class="action-row">
        <button id="btn-interact" class="action-btn interact-btn" title="Context Interact">
          ${getSvgIcon('interact', 26)}
        </button>
        <button id="btn-jump" class="action-btn" title="Jump / Dodge">
          ${getSvgIcon('jump', 26)}
        </button>
        <button id="btn-attack" class="action-btn attack-btn" title="Attack / Chop">
          ${getSvgIcon('attack', 28)}
        </button>
      </div>
    `;

    document.getElementById('app')?.appendChild(cluster);

    this.bindButtons(cluster);
  }

  private bindButtons(cluster: HTMLElement): void {
    const bindTouch = (id: string, onDown: () => void, onUp: () => void) => {
      const btn = cluster.querySelector(id) as HTMLElement;
      if (!btn) return;
      btn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        onDown();
      });
      btn.addEventListener('pointerup', (e) => {
        e.stopPropagation();
        onUp();
      });
      btn.addEventListener('pointercancel', (e) => {
        e.stopPropagation();
        onUp();
      });
    };

    bindTouch(
      '#btn-attack',
      () => { this.inputManager.state.isAttackPressed = true; },
      () => { this.inputManager.state.isAttackPressed = false; }
    );

    bindTouch(
      '#btn-jump',
      () => { this.inputManager.state.isJumpPressed = true; },
      () => { this.inputManager.state.isJumpPressed = false; }
    );

    bindTouch(
      '#btn-interact',
      () => { this.inputManager.state.isInteractPressed = true; },
      () => { this.inputManager.state.isInteractPressed = false; }
    );

    bindTouch(
      '#btn-rotate',
      () => { this.inputManager.state.isRotatePressed = true; },
      () => { this.inputManager.state.isRotatePressed = false; }
    );

    bindTouch(
      '#btn-inventory',
      () => { this.inputManager.state.isInventoryTogglePressed = true; },
      () => { this.inputManager.state.isInventoryTogglePressed = false; }
    );

    bindTouch(
      '#btn-camera',
      () => { this.inputManager.state.isFirstPersonTogglePressed = true; },
      () => { this.inputManager.state.isFirstPersonTogglePressed = false; }
    );

    bindTouch(
      '#btn-build',
      () => { this.inputManager.state.isBuildMenuTogglePressed = true; },
      () => { this.inputManager.state.isBuildMenuTogglePressed = false; }
    );
  }

  public update(): void {
    if (this.inputManager.isJoystickActive) {
      this.joystickEl.style.display = 'block';
      this.joystickEl.style.left = `${this.inputManager.joystickOrigin.x}px`;
      this.joystickEl.style.top = `${this.inputManager.joystickOrigin.y}px`;

      const dx = this.inputManager.joystickThumb.x - this.inputManager.joystickOrigin.x;
      const dy = this.inputManager.joystickThumb.y - this.inputManager.joystickOrigin.y;
      this.joystickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

      if (this.inputManager.state.isSprinting) {
        this.joystickEl.classList.add('sprinting');
      } else {
        this.joystickEl.classList.remove('sprinting');
      }
    } else {
      this.joystickEl.style.display = 'none';
    }
  }
}
