import {
  generateWorldData,
  getHeight,
  getNormal,
  sampleBilinearHeight,
  sampleBiomeId,
  WORLD_GEN_VERSION,
  type WorldData,
} from '../logic/worldLogic';
import type { BiomeType } from '../data/biomes';

const DB_NAME = 'tidebound_world_db';
const DB_VERSION = 1;
const STORE_NAME = 'world_cache';

export class WorldGen {
  private static instance: WorldGen | null = null;
  public heightmap!: Float32Array;
  public biomeMap!: Uint8Array;
  public seed: number;
  private scratchNormal = { x: 0, y: 1, z: 0 };

  constructor(seed = 42) {
    this.seed = seed;
  }

  public static get(): WorldGen {
    if (!WorldGen.instance) {
      WorldGen.instance = new WorldGen();
    }
    return WorldGen.instance;
  }

  public static setInstance(inst: WorldGen): void {
    WorldGen.instance = inst;
  }

  // Load from IndexedDB cache or generate in Worker / synchronously
  public async init(onProgress?: (pct: number) => void): Promise<void> {
    const cacheKey = `world_${this.seed}_v${WORLD_GEN_VERSION}`;

    // Try loading from IndexedDB cache first
    const cached = await this.loadFromCache(cacheKey);
    if (cached) {
      this.heightmap = cached.heightmap;
      this.biomeMap = cached.biomeMap;
      if (onProgress) onProgress(100);
      return;
    }

    // Not in cache: generate using Web Worker if available, or synchronous fallback
    const loadingElem = this.createLoadingUI();
    if (loadingElem) {
      document.body.appendChild(loadingElem);
    }

    try {
      let data: WorldData;
      if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
        data = await this.generateWithWorker(this.seed, (pct) => {
          this.updateLoadingProgress(loadingElem, pct);
          if (onProgress) onProgress(pct);
        });
      } else {
        data = generateWorldData(this.seed);
      }

      this.heightmap = data.heightmap;
      this.biomeMap = data.biomeMap;

      // Save to IndexedDB cache for subsequent instant boots
      await this.saveToCache(cacheKey, {
        heightmap: this.heightmap,
        biomeMap: this.biomeMap,
        seed: this.seed,
      });

      if (onProgress) onProgress(100);
    } finally {
      if (loadingElem && loadingElem.parentElement) {
        loadingElem.parentElement.removeChild(loadingElem);
      }
    }
  }

  public getHeight(x: number, z: number): number {
    return getHeight(this.heightmap, x, z);
  }

  public sampleBilinearHeight(x: number, z: number): number {
    return sampleBilinearHeight(this.heightmap, x, z);
  }

  public getBiome(x: number, z: number): BiomeType {
    return sampleBiomeId(this.biomeMap, x, z);
  }

  public getNormal(x: number, z: number, out = this.scratchNormal): { x: number; y: number; z: number } {
    return getNormal(this.heightmap, x, z, out);
  }

  private generateWithWorker(seed: number, onProgress?: (pct: number) => void): Promise<WorldData> {
    return new Promise((resolve) => {
      let worker: Worker | null = null;
      let progressTimer: number | null = null;

      try {
        worker = new Worker(new URL('./WorldWorker.ts', import.meta.url), { type: 'module' });

        let currentProgress = 10;
        progressTimer = window.setInterval(() => {
          if (currentProgress < 90) {
            currentProgress += 15;
            if (onProgress) onProgress(currentProgress);
          }
        }, 120);

        worker.onmessage = (e: MessageEvent<WorldData>) => {
          if (progressTimer) clearInterval(progressTimer);
          if (onProgress) onProgress(100);
          worker?.terminate();
          resolve(e.data);
        };

        worker.onerror = () => {
          if (progressTimer) clearInterval(progressTimer);
          worker?.terminate();
          // Fallback to synchronous generation on worker error
          resolve(generateWorldData(seed));
        };

        worker.postMessage({ seed });
      } catch {
        if (progressTimer) clearInterval(progressTimer);
        worker?.terminate();
        resolve(generateWorldData(seed));
      }
    });
  }

  private async loadFromCache(key: string): Promise<WorldData | null> {
    if (typeof indexedDB === 'undefined') return null;

    return new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };

        req.onsuccess = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          try {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const getReq = store.get(key);

            getReq.onsuccess = () => {
              const res = getReq.result;
              if (res && res.heightmap && res.biomeMap) {
                resolve({
                  heightmap: res.heightmap instanceof Float32Array ? res.heightmap : new Float32Array(res.heightmap),
                  biomeMap: res.biomeMap instanceof Uint8Array ? res.biomeMap : new Uint8Array(res.biomeMap),
                  seed: res.seed ?? this.seed,
                });
              } else {
                resolve(null);
              }
            };
            getReq.onerror = () => resolve(null);
          } catch {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  private async saveToCache(key: string, data: WorldData): Promise<void> {
    if (typeof indexedDB === 'undefined') return;

    return new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onsuccess = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          try {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.put(
              {
                heightmap: data.heightmap,
                biomeMap: data.biomeMap,
                seed: data.seed,
              },
              key
            );
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
          } catch {
            resolve();
          }
        };
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  private createLoadingUI(): HTMLElement | null {
    if (typeof document === 'undefined') return null;

    const overlay = document.createElement('div');
    overlay.id = 'world-loading-overlay';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '99999';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.background = 'var(--color-VoidBlack)';
    overlay.style.color = 'var(--color-SeafoamWhite)';
    overlay.style.fontFamily = 'system-ui, sans-serif';

    overlay.innerHTML = `
      <div style="font-size: 18px; font-weight: 700; letter-spacing: 2px; margin-bottom: 16px; text-transform: uppercase;">
        Surveying Archipelago...
      </div>
      <div style="width: 260px; height: 8px; border: 1px solid var(--color-GunmetalGrey); background: var(--color-StormSlate); border-radius: 4px; overflow: hidden;">
        <div id="world-loading-bar" style="width: 10%; height: 100%; background: var(--color-TropicalTeal); transition: width 0.15s ease;"></div>
      </div>
      <div id="world-loading-status" style="margin-top: 10px; font-size: 12px; color: var(--color-CoastalMist);">
        Generating heightfield & biomes
      </div>
    `;

    return overlay;
  }

  private updateLoadingProgress(overlay: HTMLElement | null, pct: number): void {
    if (!overlay) return;
    const bar = overlay.querySelector('#world-loading-bar') as HTMLElement | null;
    if (bar) {
      bar.style.width = `${Math.min(100, Math.max(5, pct))}%`;
    }
  }
}
