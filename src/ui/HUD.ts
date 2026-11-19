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
  private onOpenSettings?: () => void;

  // DOM thrash reduction state caches (B7)
  private prevHealth = -1;
  private prevHydration = -1;
  private prevHunger = -1;
  private prevExposure = -1;
  private lastVitalsUpdate = 0;

  private prevTideFormatted = '';
  private prevTideWarning = false;
  private lastTideUpdate = 0;

  private prevPromptText: string | null = null;
  private prevSlotsHash = '';

  constructor(
    onSelectQuickSlot?: (index: number) => void,
    onOpenSettings?: () => void
  ) {
    this.onSelectQuickSlot = onSelectQuickSlot;
    this.onOpenSettings = onOpenSettings;
    this.container = document.createElement('div');
    this.container.className = 'hud-layer';
    this.container.innerHTML = `
      <!-- Top Bar: Vitals, Tide & Settings -->
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

        <div style="display: flex; gap: 8px; align-items: center; pointer-events: none;">
          <div id="tide-panel" class="ui-panel tide-panel hud-interactive">
            <div class="tide-indicator"></div>
            <span id="tide-time-text">LOW TIDE (10:00)</span>
          </div>
          <button id="btn-hud-settings" class="ui-panel hud-interactive" title="Graphics Settings" style="width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 4px; padding: 0;">
            ${getSvgIcon('settings', 20)}
          </button>
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

    const settingsBtn = this.container.querySelector('#btn-hud-settings');
    settingsBtn?.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.onOpenSettings?.();
    });

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
    const now = performance.now();
    // At most 10 times a second (10 Hz throttle) (B7)
    if (now - this.lastVitalsUpdate < 100) return;
    this.lastVitalsUpdate = now;

    const rHealth = Math.round(Math.max(0, Math.min(100, health)) * 10) / 10;
    const rHydration = Math.round(Math.max(0, Math.min(100, hydration)) * 10) / 10;
    const rHunger = Math.round(Math.max(0, Math.min(100, hunger)) * 10) / 10;
    const rExposure = Math.round(Math.max(0, Math.min(100, exposure)) * 10) / 10;

    if (rHealth !== this.prevHealth) {
      this.healthFill.style.width = `${rHealth}%`;
      this.prevHealth = rHealth;
    }
    if (rHydration !== this.prevHydration) {
      this.hydrationFill.style.width = `${rHydration}%`;
      this.prevHydration = rHydration;
    }
    if (rHunger !== this.prevHunger) {
      this.hungerFill.style.width = `${rHunger}%`;
      this.prevHunger = rHunger;
    }
    if (rExposure !== this.prevExposure) {
      this.exposureFill.style.width = `${rExposure}%`;
      this.prevExposure = rExposure;
    }
  }

  public updateTide(phase: 'low' | 'warning' | 'high', timeRemainingSec: number): void {
    const now = performance.now();
    if (now - this.lastTideUpdate < 100) return;
    this.lastTideUpdate = now;

    const mins = Math.floor(timeRemainingSec / 60);
    const secs = Math.floor(timeRemainingSec % 60);
    const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    const isWarning = phase === 'warning';
    if (isWarning !== this.prevTideWarning) {
      this.tidePanel.classList.toggle('warning', isWarning);
      this.prevTideWarning = isWarning;
    }

    let text = '';
    if (phase === 'warning') {
      text = `TIDE WARNING (${formatted})`;
    } else if (phase === 'high') {
      text = `HIGH TIDE (${formatted})`;
    } else {
      text = `LOW TIDE (${formatted})`;
    }

    if (text !== this.prevTideFormatted) {
      this.tideTimeText.textContent = text;
      this.prevTideFormatted = text;
    }
  }

  public updateQuickSlots(
    slots: { itemId: string | null; count: number }[],
    activeIndex: number
  ): void {
    // Generate fast key hash to skip DOM updates if unchanged
    let hash = `${activeIndex}`;
    for (let i = 0; i < 5; i++) {
      const s = slots[i];
      hash += `|${s ? s.itemId : ''}:${s ? s.count : 0}`;
    }

    if (hash === this.prevSlotsHash) return;
    this.prevSlotsHash = hash;

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
    if (text === this.prevPromptText) return;
    this.prevPromptText = text;

    if (text) {
      this.interactPrompt.style.display = 'block';
      const t = this.interactPrompt.querySelector('#interact-text');
      if (t) t.textContent = text;
    } else {
      this.interactPrompt.style.display = 'none';
    }
  }
}
