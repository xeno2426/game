/**
 * Procedural Web Audio Sound Synthesizer
 * Zero external audio files; pure oscillator and noise generation.
 * Follows game-audio priority hierarchy and auto-resumes on first user gesture.
 */
export class SoundSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted = false;
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
    const initAudio = () => {
      this.ensureContext();
      window.removeEventListener('pointerdown', initAudio);
      window.removeEventListener('keydown', initAudio);
    };
    window.addEventListener('pointerdown', initAudio, { once: true });
    window.addEventListener('keydown', initAudio, { once: true });

    // Handle tab visibility
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.ctx && this.ctx.state === 'running') {
          this.ctx.suspend();
        }
      } else {
        if (this.ctx && this.ctx.state === 'suspended' && !this.isMuted) {
          this.ctx.resume();
        }
      }
    });
  }

  private ensureContext(): AudioContext | null {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return null;

      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Create pre-rendered 1-second white noise buffer
      const bufferSize = this.ctx.sampleRate;
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.7, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Laser Shoot: snappy pitch drop with slight random variation
   */
  public playShoot() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    // Base frequency with pitch jitter to avoid monotony
    const baseFreq = 860 + (Math.random() - 0.5) * 60;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.08);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  /**
   * Hit Impact: quick punchy low frequency + noise transient
   */
  public playHit() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.07);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  /**
   * Enemy Explosion: deep sub boom + filtered noise wash
   */
  public playExplosion() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted || !this.noiseBuffer) return;

    const t = ctx.currentTime;

    // Sub-bass thump
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(160, t);
    subOsc.frequency.exponentialRampToValueAtTime(30, t + 0.35);

    subGain.gain.setValueAtTime(0.5, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain!);
    subOsc.start(t);
    subOsc.stop(t + 0.35);

    // Noise blast with low-pass filter
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(100, t + 0.3);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain!);

    noiseSource.start(t);
    noiseSource.stop(t + 0.3);
  }

  /**
   * XP Gem Pickup: crisp two-tone rising chime
   */
  public playPickup() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, t);
    osc.frequency.setValueAtTime(990, t + 0.04);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  /**
   * Dash whoosh sound
   */
  public playDash() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted || !this.noiseBuffer) return;

    const t = ctx.currentTime;
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, t);
    filter.frequency.exponentialRampToValueAtTime(1800, t + 0.08);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.18);
    filter.Q.value = 3.0;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    noiseSource.start(t);
    noiseSource.stop(t + 0.18);
  }

  /**
   * Level Up / Wave Clear: celebratory rising arpeggio
   */
  public playLevelUp() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted) return;

    const t = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.07);

      gain.gain.setValueAtTime(0.25, t + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.07 + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(t + idx * 0.07);
      osc.stop(t + idx * 0.07 + 0.22);
    });
  }

  /**
   * Game Over: dramatic descending minor chord
   */
  public playGameOver() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted) return;

    const t = ctx.currentTime;
    const notes = [440, 392, 349.23, 220];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + idx * 0.12);

      gain.gain.setValueAtTime(0.28, t + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.12 + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(t + idx * 0.12);
      osc.stop(t + idx * 0.12 + 0.4);
    });
  }
}

export const sound = new SoundSynth();
