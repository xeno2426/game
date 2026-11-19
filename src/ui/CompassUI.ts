import { WORLD_LANDMARKS } from '../world/Landmarks';

export class CompassUI {
  private element: HTMLElement | null = null;
  private tapeElem: HTMLElement | null = null;
  private landmarkElem: HTMLElement | null = null;

  constructor() {
    if (typeof document !== 'undefined') {
      this.initUI();
    }
  }

  private initUI(): void {
    this.element = document.createElement('div');
    this.element.id = 'hud-compass';
    this.element.style.position = 'fixed';
    this.element.style.top = 'calc(env(safe-area-inset-top, 0px) + 8px)';
    this.element.style.left = '50%';
    this.element.style.transform = 'translateX(-50%)';
    this.element.style.width = '240px';
    this.element.style.height = '28px';
    this.element.style.overflow = 'hidden';
    this.element.style.background = 'rgba(8, 12, 16, 0.65)';
    this.element.style.border = '1px solid var(--color-GunmetalGrey)';
    this.element.style.borderRadius = '4px';
    this.element.style.pointerEvents = 'none';
    this.element.style.zIndex = '15';
    this.element.style.display = 'flex';
    this.element.style.alignItems = 'center';
    this.element.style.justifyContent = 'center';

    // Center indicator tick
    const tick = document.createElement('div');
    tick.style.position = 'absolute';
    tick.style.top = '0';
    tick.style.bottom = '0';
    tick.style.width = '2px';
    tick.style.background = 'var(--color-EmberOrange)';
    tick.style.zIndex = '2';
    this.element.appendChild(tick);

    // Scrolling tape
    this.tapeElem = document.createElement('div');
    this.tapeElem.style.position = 'absolute';
    this.tapeElem.style.display = 'flex';
    this.tapeElem.style.alignItems = 'center';
    this.tapeElem.style.whiteSpace = 'nowrap';
    this.tapeElem.style.fontFamily = 'system-ui, monospace';
    this.tapeElem.style.fontSize = '11px';
    this.tapeElem.style.fontWeight = '700';
    this.tapeElem.style.color = 'var(--color-SeafoamWhite)';
    this.tapeElem.style.letterSpacing = '1px';
    this.element.appendChild(this.tapeElem);

    // Landmark indicator text
    this.landmarkElem = document.createElement('div');
    this.landmarkElem.style.position = 'absolute';
    this.landmarkElem.style.bottom = '1px';
    this.landmarkElem.style.fontSize = '9px';
    this.landmarkElem.style.color = 'var(--color-WarningYellow)';
    this.landmarkElem.style.letterSpacing = '0.5px';
    this.element.appendChild(this.landmarkElem);

    // Build repeating heading markers (repeating twice for 0-360 wrap)
    const headings = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    let tapeHTML = '';
    for (let loop = 0; loop < 3; loop++) {
      for (let i = 0; i < headings.length; i++) {
        const h = headings[i];
        const isCardinal = h.length === 1;
        const color = h === 'N' ? 'var(--color-SignalCrimson)' : isCardinal ? 'var(--color-SeafoamWhite)' : 'var(--color-CoastalMist)';
        tapeHTML += `<span style="display:inline-block; width:45px; text-align:center; color:${color}; font-weight:${isCardinal ? '900' : '500'};">${h}</span>`;
      }
    }
    this.tapeElem.innerHTML = tapeHTML;

    document.body.appendChild(this.element);
  }

  public update(playerYawRad: number, playerX: number, playerZ: number): void {
    if (!this.tapeElem) return;

    // Convert yaw to degrees (0 to 360)
    // Three.js forward is -Z (North = 0)
    let deg = (playerYawRad * 180) / Math.PI;
    deg = ((deg % 360) + 360) % 360;

    // 45px per 45 deg = 1px per deg
    // Base offset centered on the middle loop (360 deg)
    const tapeOffset = -360 - deg + 120;
    this.tapeElem.style.transform = `translateX(${tapeOffset}px)`;

    // Find closest landmark
    if (this.landmarkElem) {
      let closestName = '';
      let minDist = 350.0; // Show if within 350m

      for (let i = 0; i < WORLD_LANDMARKS.length; i++) {
        const lm = WORLD_LANDMARKS[i];
        const dx = lm.position[0] - playerX;
        const dz = lm.position[2] - playerZ;
        const d = Math.hypot(dx, dz);
        if (d < minDist) {
          minDist = d;
          closestName = `${lm.name} (${Math.round(d)}m)`;
        }
      }

      this.landmarkElem.textContent = closestName;
    }
  }
}
