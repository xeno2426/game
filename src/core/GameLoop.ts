export class GameLoop {
  private isRunning = false;
  private isPaused = false;
  private lastTime = 0;
  private accumulator = 0;
  private readonly fixedTimestep = 1 / 60; // 60Hz fixed simulation rate
  private readonly maxFrameTime = 0.1; // Max 100ms clamp against spirals

  private updateFn: (dt: number) => void;
  private renderFn: (alpha: number, frameDt: number) => void;
  private boundTick: (now: number) => void;

  constructor(
    updateFn: (dt: number) => void,
    renderFn: (alpha: number, frameDt: number) => void
  ) {
    this.updateFn = updateFn;
    this.renderFn = renderFn;
    this.boundTick = this.tick.bind(this);

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.isPaused = true;
        } else {
          this.isPaused = false;
          this.lastTime = performance.now();
        }
      });
    }
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(this.boundTick);
    }
  }

  public stop(): void {
    this.isRunning = false;
  }

  private tick(now: number): void {
    if (!this.isRunning) return;

    if (this.isPaused) {
      this.lastTime = now;
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(this.boundTick);
      }
      return;
    }

    let elapsed = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Clamp against lag spikes and tab suspension spirals (B2)
    if (elapsed > this.maxFrameTime) {
      elapsed = this.maxFrameTime;
    }

    this.accumulator += elapsed;

    // Cap fixed steps at 3 per frame and drop remainder (B2)
    let steps = 0;
    while (this.accumulator >= this.fixedTimestep && steps < 3) {
      this.updateFn(this.fixedTimestep);
      this.accumulator -= this.fixedTimestep;
      steps++;
    }

    if (this.accumulator >= this.fixedTimestep) {
      this.accumulator = 0;
    }

    const alpha = this.accumulator / this.fixedTimestep;
    this.renderFn(alpha, elapsed);

    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(this.boundTick);
    }
  }
}
