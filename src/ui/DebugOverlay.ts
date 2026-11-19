import * as THREE from 'three';

export interface DebugMetrics {
  fps: number;
  frameTimeMs: number;
  drawCalls: number;
  triangles: number;
  activeEnemies: number;
  activeBullets: number;
  activePickups: number;
  activeParticles: number;
}

export class DebugOverlay {
  private el: HTMLElement;
  public enabled = false;

  private frameCount = 0;
  private lastFpsUpdateTime = performance.now();
  private currentFps = 60;
  private currentFrameTime = 16.6;

  constructor(container: HTMLElement) {
    this.el = document.createElement('div');
    this.el.id = 'debug-overlay';

    // Check ?debug query param or #debug hash
    const searchParams = new URLSearchParams(window.location.search);
    const hasDebug = searchParams.has('debug') || window.location.hash.includes('debug');

    if (hasDebug) {
      this.enabled = true;
      this.el.style.display = 'block';
    } else {
      this.enabled = false;
      this.el.style.display = 'none';
    }

    container.appendChild(this.el);
  }

  public tick(
    renderer: THREE.WebGLRenderer,
    activeEnemies: number,
    activeBullets: number,
    activePickups: number,
    activeParticles: number
  ) {
    if (!this.enabled) return;

    this.frameCount++;
    const now = performance.now();
    const elapsed = now - this.lastFpsUpdateTime;

    if (elapsed >= 250) {
      this.currentFps = Math.round((this.frameCount * 1000) / elapsed);
      this.currentFrameTime = Number((elapsed / this.frameCount).toFixed(1));
      this.frameCount = 0;
      this.lastFpsUpdateTime = now;

      const info = renderer.info;
      this.el.innerHTML = `
        <span style="color:#00f0ff; font-weight:bold;">[DEBUG MODE]</span><br>
        FPS: <strong>${this.currentFps}</strong> (${this.currentFrameTime}ms)<br>
        Draw Calls: <strong>${info.render.calls}</strong> &bull; Triangles: <strong>${info.render.triangles}</strong><br>
        Enemies: <strong>${activeEnemies}</strong> &bull; Bullets: <strong>${activeBullets}</strong><br>
        XP Gems: <strong>${activePickups}</strong> &bull; Particles: <strong>${activeParticles}</strong>
      `;
    }
  }
}
