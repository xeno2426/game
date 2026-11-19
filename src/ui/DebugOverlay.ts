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
      }
    }
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
