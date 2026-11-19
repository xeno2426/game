import type { VitalsState } from '../logic/vitalsLogic';
import type { InventorySlot } from '../logic/craftingLogic';
import type { PlacedStructure } from '../logic/buildingLogic';

export interface SavedGameState {
  version: number;
  timestamp: number;
  playerPos: [number, number, number];
  vitals: VitalsState;
  inventory: InventorySlot[];
  structures: PlacedStructure[];
  timeInTideCycle: number;
}

const DB_NAME = 'tidebound_db';
const DB_VERSION = 1;
const STORE_NAME = 'save_state';
const SAVE_KEY = 'current_game';

export class SaveSystem {
  private static db: IDBDatabase | null = null;

  public static async init(): Promise<void> {
    if (typeof indexedDB === 'undefined') return;

    return new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = (e) => {
        SaveSystem.db = (e.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = () => {
        resolve();
      };
    });
  }

  public static async save(state: SavedGameState): Promise<boolean> {
    if (!SaveSystem.db) return false;

    return new Promise((resolve) => {
      try {
        const tx = SaveSystem.db!.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(state, SAVE_KEY);

        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }

  public static async load(): Promise<SavedGameState | null> {
    if (!SaveSystem.db) return null;

    return new Promise((resolve) => {
      try {
        const tx = SaveSystem.db!.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(SAVE_KEY);

        req.onsuccess = () => {
          resolve(req.result || null);
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }
}
