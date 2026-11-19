export class GameLoop {
  private isRunning = false;
  private isPaused = false;
  private lastTime = 0;
  private accumulator = 0;
  private readonly fixedTimestep = 1 / 60; // 60Hz fixed simulation rate
  private readonly maxFrameTime = 0.2; // Clamp against catch-up spirals

  private updateFn: (dt: number) => void;
  private renderFn: (alpha: number) => void;

  constructor(
    updateFn: (dt: number) => void,
    renderFn: (alpha: number) => void
  ) {
    this.updateFn = updateFn;
    this.renderFn = renderFn;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.isPaused = true;
      } else {
        this.isPaused = false;
        this.lastTime = performance.now();
      }
    });
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.tick.bind(this));
  }

  public stop(): void {
    this.isRunning = false;
  }

  private tick(now: number): void {
    if (!this.isRunning) return;

    if (this.isPaused) {
      this.lastTime = now;
      requestAnimationFrame(this.tick.bind(this));
      return;
    }

    let elapsed = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Clamp against lag spikes and tab suspension spirals
    if (elapsed > this.maxFrameTime) {
      elapsed = this.maxFrameTime;
    }

    this.accumulator += elapsed;

    while (this.accumulator >= this.fixedTimestep) {
      this.updateFn(this.fixedTimestep);
      this.accumulator -= this.fixedTimestep;
    }

    const alpha = this.accumulator / this.fixedTimestep;
    this.renderFn(alpha);

    requestAnimationFrame(this.tick.bind(this));
  }
}
