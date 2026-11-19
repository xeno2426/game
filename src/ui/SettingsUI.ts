import { getSvgIcon } from './icons';
import type { QualityManager, QualityPreset } from '../core/QualityManager';

export class SettingsUI {
  private overlay: HTMLElement;
  private qualityManager: QualityManager;
  public isOpen = false;

  constructor(qualityManager: QualityManager) {
    this.qualityManager = qualityManager;

    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay hud-interactive';
    this.overlay.style.display = 'none';

    this.overlay.addEventListener('pointerdown', (e) => {
      if (e.target === this.overlay) {
        e.stopPropagation();
        this.close();
      }
    });

    this.overlay.innerHTML = `
      <div class="ui-panel modal-card" style="max-width: 440px;">
        <div class="modal-header">
          <span class="modal-title">SETTINGS & GRAPHICS</span>
          <button id="btn-settings-close" class="modal-close-btn" title="Close Settings">
            ${getSvgIcon('close', 24)}
          </button>
        </div>

        <div style="font-size: 13px; font-weight: 600; color: var(--color-seafoam-white); margin-top: 6px;">
          QUALITY PRESET
        </div>

        <div id="preset-buttons" style="display: flex; gap: 12px; margin-top: 6px;">
          <button data-preset="low" class="slot-action-btn">LOW</button>
          <button data-preset="medium" class="slot-action-btn">MEDIUM</button>
          <button data-preset="high" class="slot-action-btn">HIGH</button>
        </div>

        <div id="settings-info" style="font-size: 11px; color: var(--color-weathered-slate); margin-top: 10px; line-height: 1.5;"></div>
      </div>
    `;

    document.getElementById('app')?.appendChild(this.overlay);

    const closeBtn = this.overlay.querySelector('#btn-settings-close');
    closeBtn?.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.close();
    });

    const presetButtons = this.overlay.querySelectorAll<HTMLButtonElement>('#preset-buttons button');
    presetButtons.forEach((btn) => {
      btn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        const p = btn.dataset.preset as QualityPreset;
        if (p) {
          this.qualityManager.applyPreset(p, true);
          this.render();
        }
      });
    });
  }

  public toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  public open(): void {
    this.isOpen = true;
    this.render();
    this.overlay.style.display = 'flex';
  }

  public close(): void {
    this.isOpen = false;
    this.overlay.style.display = 'none';
  }

  public render(): void {
    const current = this.qualityManager.currentPreset;
    const btns = this.overlay.querySelectorAll<HTMLButtonElement>('#preset-buttons button');
    btns.forEach((btn) => {
      if (btn.dataset.preset === current) {
        btn.classList.add('selected');
        btn.style.borderColor = 'var(--color-seafoam-white)';
      } else {
        btn.classList.remove('selected');
        btn.style.borderColor = 'var(--color-gunmetal-grey)';
      }
    });

    const info = this.overlay.querySelector('#settings-info');
    if (info) {
      const shadows = this.qualityManager.shadowsEnabled ? 'ON (PCF Shadow Map)' : 'OFF (Optimized)';
      const dpr = this.qualityManager.currentPixelRatio.toFixed(2);
      info.textContent = `Active Preset: ${current.toUpperCase()} | Pixel Ratio: ${dpr} | Shadows: ${shadows}`;
    }
  }
}
