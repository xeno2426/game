import * as THREE from 'three';

export type QualityPreset = 'low' | 'medium' | 'high';

const DB_NAME = 'tidebound_settings_db';
const DB_VERSION = 1;
const STORE_NAME = 'settings';
const SETTING_KEY = 'quality_preset';

export class QualityManager {
  private renderer: THREE.WebGLRenderer;
  private dirLight: THREE.DirectionalLight;
  public currentPreset: QualityPreset = 'medium';
  public targetPixelRatio = 1.0;
  public currentPixelRatio = 1.0;
  public shadowsEnabled = true;

  // 100-frame circular buffer for frame time smoothing
  private frameTimes = new Float32Array(100);
  private frameIndex = 0;
  private filledCount = 0;
  private lastResolutionStepTime = 0;
  private highLatencyAccumulator = 0;

  private db: IDBDatabase | null = null;
  private onSettingsChange?: () => void;

  constructor(
    renderer: THREE.WebGLRenderer,
    dirLight: THREE.DirectionalLight,
    onSettingsChange?: () => void
  ) {
    this.renderer = renderer;
    this.dirLight = dirLight;
    this.onSettingsChange = onSettingsChange;

    const baseDpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 1.5) : 1.0;
    this.targetPixelRatio = baseDpr;
    this.currentPixelRatio = baseDpr;

    this.renderer.setPixelRatio(this.currentPixelRatio);
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.initDB();
  }

  private async initDB(): Promise<void> {
    if (typeof indexedDB === 'undefined') return;

    try {
      this.db = await new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      const saved = await this.loadPreset();
      if (saved) {
        this.applyPreset(saved, false);
      }
    } catch {
      // IndexedDB unavailable or blocked
    }
  }

  private loadPreset(): Promise<QualityPreset | null> {
    return new Promise((resolve) => {
      if (!this.db) return resolve(null);
      try {
        const tx = this.db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(SETTING_KEY);
        req.onsuccess = () => {
          const val = req.result;
          if (val === 'low' || val === 'medium' || val === 'high') {
            resolve(val);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  private savePreset(preset: QualityPreset): void {
    if (!this.db) return;
    try {
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(preset, SETTING_KEY);
    } catch {
      // Ignore write failures in private browsing
    }
  }

  public applyPreset(preset: QualityPreset, save = true): void {
    this.currentPreset = preset;
    const baseDpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 1.5) : 1.0;

    if (preset === 'low') {
      this.shadowsEnabled = false;
      this.targetPixelRatio = Math.min(baseDpr, 0.85);
    } else if (preset === 'medium') {
      this.shadowsEnabled = true;
      this.targetPixelRatio = Math.min(baseDpr, 1.25);
    } else {
      this.shadowsEnabled = true;
      this.targetPixelRatio = baseDpr;
    }

    this.currentPixelRatio = this.targetPixelRatio;
    this.renderer.setPixelRatio(this.currentPixelRatio);
    this.dirLight.castShadow = this.shadowsEnabled;
    this.renderer.shadowMap.enabled = this.shadowsEnabled;

    if (save) {
      this.savePreset(preset);
    }

    this.onSettingsChange?.();
  }

  public recordFrame(frameDtMs: number, nowSec: number): void {
    this.frameTimes[this.frameIndex] = frameDtMs;
    this.frameIndex = (this.frameIndex + 1) % 100;
    if (this.filledCount < 100) this.filledCount++;

    const count = this.filledCount;
    let sum = 0;
    for (let i = 0; i < count; i++) {
      sum += this.frameTimes[i];
    }
    const avg = sum / (count || 1);

    // If frames stay above 24ms, turn shadows off to preserve framerate (B4)
    if (avg > 24.0) {
      this.highLatencyAccumulator += frameDtMs / 1000;
      if (this.highLatencyAccumulator >= 2.0 && this.shadowsEnabled) {
        this.shadowsEnabled = false;
        this.dirLight.castShadow = false;
        this.renderer.shadowMap.enabled = false;
      }
    } else {
      this.highLatencyAccumulator = Math.max(0, this.highLatencyAccumulator - frameDtMs / 1000);
    }

    // Dynamic resolution stepping between 0.75 and 1.5 based on 100-frame average (target 16.6ms)
    // Hysteresis: step down if > 18.5ms, step up if < 14.5ms; max 1 change per 2s
    if (nowSec - this.lastResolutionStepTime >= 2.0) {
      if (avg > 18.5 && this.currentPixelRatio > 0.75) {
        this.currentPixelRatio = Math.max(0.75, Math.round((this.currentPixelRatio - 0.1) * 100) / 100);
        this.renderer.setPixelRatio(this.currentPixelRatio);
        this.lastResolutionStepTime = nowSec;
      } else if (avg < 14.5 && this.currentPixelRatio < this.targetPixelRatio) {
        this.currentPixelRatio = Math.min(this.targetPixelRatio, Math.round((this.currentPixelRatio + 0.1) * 100) / 100);
        this.renderer.setPixelRatio(this.currentPixelRatio);
        this.lastResolutionStepTime = nowSec;
      }
    }
  }

  public getAverageFrameTime(): number {
    const count = this.filledCount || 1;
    let sum = 0;
    for (let i = 0; i < count; i++) {
      sum += this.frameTimes[i];
    }
    return sum / count;
  }
}
