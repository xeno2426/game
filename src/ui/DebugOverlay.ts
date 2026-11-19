import type * as THREE from 'three';

export class DebugOverlay {
  private el: HTMLElement | null = null;
  public isEnabled = false;
  public timescale = 1.0;

  private frameCount = 0;
  private lastFpsUpdate = 0;
  private currentFps = 60;

  constructor() {
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

  public update(
    renderer: THREE.WebGLRenderer,
    tidePhase: string,
    tideTime: number,
    waterLevel: number,
    playerPos: THREE.Vector3
  ): void {
    if (!this.isEnabled || !this.el) return;

    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsUpdate >= 500) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    const info = renderer.info;
    const calls = info.render.calls;
    const triangles = info.render.triangles;

    this.el.innerHTML = `
      <div><strong>TIDEBOUND DEBUG</strong> (x${this.timescale})</div>
      <div>FPS: ${this.currentFps}</div>
      <div>Draw Calls: ${calls} / 100 budget</div>
      <div>Triangles: ${triangles.toLocaleString()} / 150k budget</div>
      <div>Tide: ${tidePhase.toUpperCase()} (${Math.floor(tideTime)}s)</div>
      <div>Water Y: ${waterLevel.toFixed(2)}m</div>
      <div>Player: ${playerPos.x.toFixed(1)}, ${playerPos.y.toFixed(1)}, ${playerPos.z.toFixed(1)}</div>
    `;
  }
}
