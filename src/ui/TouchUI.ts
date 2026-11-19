import { InputSystem } from '../systems/InputSystem';

export class TouchUI {
  private container: HTMLElement;
  private leftZone: HTMLElement;
  private rightZone: HTMLElement;
  private moveJoystick: HTMLElement;
  private moveKnob: HTMLElement;
  private aimJoystick: HTMLElement;
  private aimKnob: HTMLElement;
  private dashBtn: HTMLElement;
  private dashCooldownOverlay: HTMLElement;
  private pauseBtn: HTMLElement;
  private pauseModal: HTMLElement;

  private isPaused = false;
  public onResumeCallback?: () => void;
  public onRestartCallback?: () => void;

  constructor(container: HTMLElement, inputSystem: InputSystem) {
    this.container = container;

    // Create left touch zone
    this.leftZone = document.createElement('div');
    this.leftZone.id = 'left-touch-zone';
    this.leftZone.className = 'touch-zone';

    // Move joystick
    this.moveJoystick = document.createElement('div');
    this.moveJoystick.className = 'virtual-joystick';
    this.moveKnob = document.createElement('div');
    this.moveKnob.className = 'joystick-knob';
    this.moveJoystick.appendChild(this.moveKnob);

    // Create right touch zone
    this.rightZone = document.createElement('div');
    this.rightZone.id = 'right-touch-zone';
    this.rightZone.className = 'touch-zone';

    // Aim joystick
    this.aimJoystick = document.createElement('div');
    this.aimJoystick.className = 'virtual-joystick aim-joystick';
    this.aimKnob = document.createElement('div');
    this.aimKnob.className = 'joystick-knob';
    this.aimJoystick.appendChild(this.aimKnob);

    // Dash button
    this.dashBtn = document.createElement('button');
    this.dashBtn.id = 'dash-button';
    this.dashBtn.setAttribute('aria-label', 'Dash');
    this.dashBtn.innerHTML = `<span>DASH</span><div id="dash-cooldown-overlay"></div>`;
    this.dashCooldownOverlay = this.dashBtn.querySelector('#dash-cooldown-overlay')!;

    // Pause button
    this.pauseBtn = document.createElement('button');
    this.pauseBtn.id = 'pause-btn';
    this.pauseBtn.setAttribute('aria-label', 'Pause Game');
    this.pauseBtn.innerHTML = '❚❚';

    // Pause modal
    this.pauseModal = document.createElement('div');
    this.pauseModal.id = 'pause-modal';
    this.pauseModal.className = 'modal-overlay';
    this.pauseModal.innerHTML = `
      <div class="modal-card">
        <h2 class="modal-title">GAME PAUSED</h2>
        <p class="modal-body">Controls:<br>Left: Move &bull; Right: Aim &amp; Auto-fire &bull; Dash Button</p>
        <button id="resume-btn" class="modal-btn">RESUME</button>
        <button id="restart-btn" class="modal-btn" style="background: linear-gradient(135deg, #ff0077 0%, #aa0055 100%); color: #fff;">RESTART</button>
      </div>
    `;

    // Append to container
    this.container.appendChild(this.leftZone);
    this.container.appendChild(this.rightZone);
    this.container.appendChild(this.moveJoystick);
    this.container.appendChild(this.aimJoystick);
    this.container.appendChild(this.dashBtn);
    this.container.appendChild(this.pauseBtn);
    this.container.appendChild(this.pauseModal);

    // Bind input system
    inputSystem.bindTouchZones(this.leftZone, this.rightZone, this.dashBtn, this.pauseBtn);

    // Pause modal events
    const resumeBtn = this.pauseModal.querySelector('#resume-btn') as HTMLElement;
    const restartBtn = this.pauseModal.querySelector('#restart-btn') as HTMLElement;

    resumeBtn.addEventListener('click', () => {
      this.hidePause();
      if (this.onResumeCallback) this.onResumeCallback();
    });

    restartBtn.addEventListener('click', () => {
      this.hidePause();
      if (this.onRestartCallback) this.onRestartCallback();
    });
  }

  public update(input: InputSystem, dashCooldownRatio: number) {
    // Update left movement joystick UI
    if (input.isMoveActive) {
      this.moveJoystick.style.display = 'block';
      this.moveJoystick.style.left = `${input.moveBasePos.x}px`;
      this.moveJoystick.style.top = `${input.moveBasePos.y}px`;

      const relX = input.moveKnobPos.x - input.moveBasePos.x;
      const relY = input.moveKnobPos.y - input.moveBasePos.y;
      this.moveKnob.style.transform = `translate(calc(-50% + ${relX}px), calc(-50% + ${relY}px))`;
    } else {
      this.moveJoystick.style.display = 'none';
    }

    // Update right aim joystick UI
    if (input.isAimActive) {
      this.aimJoystick.style.display = 'block';
      this.aimJoystick.style.left = `${input.aimBasePos.x}px`;
      this.aimJoystick.style.top = `${input.aimBasePos.y}px`;

      const relX = input.aimKnobPos.x - input.aimBasePos.x;
      const relY = input.aimKnobPos.y - input.aimBasePos.y;
      this.aimKnob.style.transform = `translate(calc(-50% + ${relX}px), calc(-50% + ${relY}px))`;
    } else {
      this.aimJoystick.style.display = 'none';
    }

    // Update dash cooldown overlay
    // cooldownRatio: 0 = ready, 1 = full cooldown
    if (dashCooldownRatio > 0.01) {
      this.dashCooldownOverlay.style.transform = `scaleY(${dashCooldownRatio})`;
      this.dashBtn.style.filter = 'grayscale(0.6) opacity(0.7)';
    } else {
      this.dashCooldownOverlay.style.transform = 'scaleY(0)';
      this.dashBtn.style.filter = 'none';
    }
  }

  public showPause() {
    this.isPaused = true;
    this.pauseModal.classList.add('active');
  }

  public hidePause() {
    this.isPaused = false;
    this.pauseModal.classList.remove('active');
  }

  public togglePause(): boolean {
    if (this.isPaused) {
      this.hidePause();
      return false;
    } else {
      this.showPause();
      return true;
    }
  }
}
