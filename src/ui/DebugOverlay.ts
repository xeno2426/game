import type * as THREE from 'three';

export class DebugOverlay {
  private el: HTMLElement | null = null;
  public isEnabled = false;
  public timescale = 1.0;

  private frameCount = 0;
  private lastUpdate = 0;
  private currentFps = 60;

  // 10-second history buffer (~1200 frames at 120Hz; allocate 2000)
  private historyTimes = new Float64Array(2000);
  private historyDts = new Float32Array(2000);
  private scratchDts = new Float32Array(2000);
  private historyHead = 0;
  private historyCount = 0;

  public onTeleport?: (x: number, y: number, z: number) => void;
  private teleportEl: HTMLElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('debug')) {
        this.isEnabled = true;
        if (params.has('timescale')) {
          const ts = parseFloat(params.get('timescale') || '1');
          if (!isNaN(ts) && ts > 0) {
            this.timescale = ts;
          }
        }

        this.el = document.createElement('div');
        this.el.className = 'debug-overlay';
        document.getElementById('app')?.appendChild(this.el);

        this.createTeleportMenu();
      }
    }
  }

  private createTeleportMenu(): void {
    const locations: { name: string; pos: [number, number, number] }[] = [
      { name: 'Starter Beach', pos: [-820, 6.0, 820] },
      { name: 'Dense Jungle', pos: [-800, 10.0, 780] },
      { name: 'Mangrove Swamp', pos: [-450, 5.0, 350] },
      { name: 'Rocky Highlands', pos: [800, 22.0, 350] },
      { name: 'Industrial Harbour', pos: [650, 8.0, -600] },
      { name: 'Tidal Flats', pos: [-600, 4.0, 600] },
      { name: 'Offshore Oil Rig Alpha', pos: [-900, 9.0, -1000] },
      { name: 'Offshore Oil Rig Beta', pos: [450, 9.0, -1150] },
      { name: 'Radio Tower Peak', pos: [0, 19.0, 0] },
      { name: 'Harbour Crane', pos: [620, 8.0, -580] },
      { name: 'Wrecked Tanker Reef', pos: [780, 5.0, -500] },
    ];

    this.teleportEl = document.createElement('div');
    this.teleportEl.className = 'debug-teleport-menu hud-interactive';
    this.teleportEl.style.position = 'fixed';
    this.teleportEl.style.bottom = '80px';
    this.teleportEl.style.left = '10px';
    this.teleportEl.style.zIndex = '999';
    this.teleportEl.style.background = 'rgba(8, 12, 16, 0.85)';
    this.teleportEl.style.border = '1px solid var(--color-GunmetalGrey)';
    this.teleportEl.style.borderRadius = '4px';
    this.teleportEl.style.padding = '6px';
    this.teleportEl.style.fontFamily = 'monospace';
    this.teleportEl.style.fontSize = '12px';

    const select = document.createElement('select');
    select.className = 'hud-interactive';
    select.style.background = 'var(--color-StormSlate)';
    select.style.color = 'var(--color-SeafoamWhite)';
    select.style.border = '1px solid var(--color-GunmetalGrey)';
    select.style.padding = '4px';
    select.style.borderRadius = '3px';

    const defaultOpt = document.createElement('option');
    defaultOpt.text = 'Teleport to...';
    defaultOpt.value = '';
    select.appendChild(defaultOpt);

    for (const loc of locations) {
      const opt = document.createElement('option');
      opt.text = loc.name;
      opt.value = loc.pos.join(',');
      select.appendChild(opt);
    }

    select.addEventListener('change', () => {
      if (select.value) {
        const [x, y, z] = select.value.split(',').map(Number);
        this.onTeleport?.(x, y, z);
        select.value = '';
      }
    });

    this.teleportEl.appendChild(select);
    document.getElementById('app')?.appendChild(this.teleportEl);
  }

  public recordFrame(dtMs: number): void {
    if (!this.isEnabled) return;
    const now = performance.now();
    this.historyTimes[this.historyHead] = now;
    this.historyDts[this.historyHead] = dtMs;
    this.historyHead = (this.historyHead + 1) % 2000;
    if (this.historyCount < 2000) this.historyCount++;
    this.frameCount++;
  }

  public update(
    renderer: THREE.WebGLRenderer,
    tidePhase: string,
    tideTime: number,
    waterLevel: number,
    playerPos: THREE.Vector3,
    qualityPreset = 'medium',
    pixelRatio = 1.0
  ): void {
    if (!this.isEnabled || !this.el) return;

    const now = performance.now();
    // Update at 2 Hz (every 500ms) to avoid DOM thrash (B7)
    if (now - this.lastUpdate < 500) return;

    const elapsed = now - this.lastUpdate;
    this.currentFps = Math.round((this.frameCount * 1000) / elapsed);
    this.frameCount = 0;
    this.lastUpdate = now;

    // Analyze frames in the last 10 seconds (B9)
    const cutoff = now - 10000;
    let windowCount = 0;
    let spikeCount = 0;
    let sumDt = 0;

    for (let i = 0; i < this.historyCount; i++) {
      const idx = (this.historyHead - 1 - i + 2000) % 2000;
      const t = this.historyTimes[idx];
      if (t < cutoff) break;
      const dt = this.historyDts[idx];
      this.scratchDts[windowCount] = dt;
      windowCount++;
      sumDt += dt;
      if (dt > 25.0) {
        spikeCount++;
      }
    }

    const avgDt = windowCount > 0 ? sumDt / windowCount : 16.6;

    // Calculate P95 frame time
    let p95Dt = avgDt;
    if (windowCount > 0) {
      // Insertion sort scratch subarray (at most ~600 elements, runs twice a second)
      const arr = this.scratchDts.subarray(0, windowCount);
      arr.sort();
      const p95Idx = Math.min(windowCount - 1, Math.floor(windowCount * 0.95));
      p95Dt = arr[p95Idx];
    }

    const info = renderer.info;
    const calls = info.render.calls;
    const triangles = info.render.triangles;

    // Update using textContent (zero HTML parse overhead) (B7, B9)
    this.el.textContent = [
      `TIDEBOUND DEBUG (x${this.timescale})`,
      `FPS: ${this.currentFps} | Avg: ${avgDt.toFixed(1)}ms | P95: ${p95Dt.toFixed(1)}ms`,
      `Frames > 25ms (last 10s): ${spikeCount}`,
      `Quality: ${qualityPreset.toUpperCase()} | Pixel Ratio: ${pixelRatio.toFixed(2)}`,
      `Draw Calls: ${calls} / 100 budget`,
      `Triangles: ${triangles.toLocaleString()} / 150k budget`,
      `Tide: ${tidePhase.toUpperCase()} (${Math.floor(tideTime)}s)`,
      `Water Y: ${waterLevel.toFixed(2)}m`,
      `Player: ${playerPos.x.toFixed(1)}, ${playerPos.y.toFixed(1)}, ${playerPos.z.toFixed(1)}`,
    ].join('\n');
  }
}
