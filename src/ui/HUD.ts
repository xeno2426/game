import { getSvgIcon } from './icons';
import { ITEMS } from '../data/items';

export class HUD {
  private container: HTMLElement;
  private healthFill: HTMLElement;
  private hydrationFill: HTMLElement;
  private hungerFill: HTMLElement;
  private exposureFill: HTMLElement;

  private tidePanel: HTMLElement;
  private tideTimeText: HTMLElement;
  private quickSlots: HTMLElement[] = [];
  private interactPrompt: HTMLElement;
  private onSelectQuickSlot?: (index: number) => void;

  constructor(onSelectQuickSlot?: (index: number) => void) {
    this.onSelectQuickSlot = onSelectQuickSlot;
    this.container = document.createElement('div');
    this.container.className = 'hud-layer';
    this.container.innerHTML = `
      <!-- Top Bar: Vitals and Tide -->
      <div class="top-hud-bar">
        <div class="ui-panel vitals-cluster hud-interactive">
          <div class="vital-row">
            <div class="vital-icon">${getSvgIcon('health', 16)}</div>
            <div class="vital-bar-track">
              <div id="fill-health" class="vital-bar-fill fill-health"></div>
            </div>
          </div>
          <div class="vital-row">
            <div class="vital-icon">${getSvgIcon('hydration', 16)}</div>
            <div class="vital-bar-track">
              <div id="fill-hydration" class="vital-bar-fill fill-hydration"></div>
            </div>
          </div>
          <div class="vital-row">
            <div class="vital-icon">${getSvgIcon('hunger', 16)}</div>
            <div class="vital-bar-track">
              <div id="fill-hunger" class="vital-bar-fill fill-hunger"></div>
            </div>
          </div>
          <div class="vital-row">
            <div class="vital-icon">${getSvgIcon('exposure', 16)}</div>
            <div class="vital-bar-track">
              <div id="fill-exposure" class="vital-bar-fill fill-exposure"></div>
            </div>
          </div>
        </div>

        <div id="tide-panel" class="ui-panel tide-panel hud-interactive">
          <div class="tide-indicator"></div>
          <span id="tide-time-text">LOW TIDE (10:00)</span>
        </div>
      </div>

      <!-- Center Context Interact Prompt -->
      <div id="interact-prompt" class="ui-panel hud-interactive" style="display: none; align-self: center; padding: 6px 14px; font-weight: 600; font-size: 13px; margin-bottom: 20px;">
        <span id="interact-text">INTERACT</span>
      </div>

      <!-- Bottom Quick Bar -->
      <div class="bottom-bar">
        <div class="ui-panel quick-bar hud-interactive" id="quick-bar-container"></div>
      </div>
    `;

    document.getElementById('app')?.appendChild(this.container);

    this.healthFill = this.container.querySelector('#fill-health') as HTMLElement;
    this.hydrationFill = this.container.querySelector('#fill-hydration') as HTMLElement;
    this.hungerFill = this.container.querySelector('#fill-hunger') as HTMLElement;
    this.exposureFill = this.container.querySelector('#fill-exposure') as HTMLElement;
    this.tidePanel = this.container.querySelector('#tide-panel') as HTMLElement;
    this.tideTimeText = this.container.querySelector('#tide-time-text') as HTMLElement;
    this.interactPrompt = this.container.querySelector('#interact-prompt') as HTMLElement;

    this.initQuickBar();
  }

  private initQuickBar(): void {
    const qb = this.container.querySelector('#quick-bar-container') as HTMLElement;
    qb.innerHTML = '';
    this.quickSlots = [];

    for (let i = 0; i < 5; i++) {
      const slot = document.createElement('div');
      slot.className = `quick-slot ${i === 0 ? 'active' : ''}`;
      slot.dataset.slotIndex = i.toString();
      slot.innerHTML = `
        <div class="slot-icon-container"></div>
        <div class="slot-count"></div>
      `;
      slot.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        this.onSelectQuickSlot?.(i);
      });
      qb.appendChild(slot);
      this.quickSlots.push(slot);
    }
  }

  public updateVitals(health: number, hydration: number, hunger: number, exposure: number): void {
    this.healthFill.style.width = `${Math.max(0, Math.min(100, health))}%`;
    this.hydrationFill.style.width = `${Math.max(0, Math.min(100, hydration))}%`;
    this.hungerFill.style.width = `${Math.max(0, Math.min(100, hunger))}%`;
    this.exposureFill.style.width = `${Math.max(0, Math.min(100, exposure))}%`;
  }

  public updateTide(phase: 'low' | 'warning' | 'high', timeRemainingSec: number): void {
    const mins = Math.floor(timeRemainingSec / 60);
    const secs = Math.floor(timeRemainingSec % 60);
    const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    if (phase === 'warning') {
      this.tidePanel.className = 'ui-panel tide-panel warning';
      this.tideTimeText.textContent = `TIDE WARNING (${formatted})`;
    } else if (phase === 'high') {
      this.tidePanel.className = 'ui-panel tide-panel';
      this.tideTimeText.textContent = `HIGH TIDE (${formatted})`;
    } else {
      this.tidePanel.className = 'ui-panel tide-panel';
      this.tideTimeText.textContent = `LOW TIDE (${formatted})`;
    }
  }

  public updateQuickSlots(
    slots: { itemId: string | null; count: number }[],
    activeIndex: number
  ): void {
    for (let i = 0; i < 5; i++) {
      const el = this.quickSlots[i];
      if (!el) continue;

      if (i === activeIndex) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }

      const item = slots[i];
      const iconEl = el.querySelector('.slot-icon-container') as HTMLElement;
      const countEl = el.querySelector('.slot-count') as HTMLElement;

      if (item && item.itemId && ITEMS[item.itemId]) {
        const def = ITEMS[item.itemId];
        iconEl.innerHTML = getSvgIcon(def.icon, 24);
        countEl.textContent = item.count > 1 ? item.count.toString() : '';
      } else {
        iconEl.innerHTML = '';
        countEl.textContent = '';
      }
    }
  }

  public showInteractPrompt(text: string | null): void {
    if (text) {
      this.interactPrompt.style.display = 'block';
      const t = this.interactPrompt.querySelector('#interact-text');
      if (t) t.textContent = text;
    } else {
      this.interactPrompt.style.display = 'none';
    }
  }
}
