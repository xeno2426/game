import type { VitalsState } from '../logic/vitalsLogic';
import type { InventorySlot } from '../logic/craftingLogic';
import type { PlacedStructure } from '../logic/buildingLogic';

export const CURRENT_SAVE_VERSION = 2;

export interface SavedCrate {
  id: string;
  position: [number, number, number];
  yields: { itemId: string; count: number }[];
}

export interface SavedGameState {
  version: number;
  timestamp: number;
  playerPos: [number, number, number];
  vitals: VitalsState;
  inventory: InventorySlot[];
  structures: PlacedStructure[];
  timeInTideCycle: number;
  crates?: SavedCrate[];
}

export function validateAndMigrateSave(data: unknown): SavedGameState | null {
  if (!data || typeof data !== 'object') return null;

  const candidate = data as Partial<SavedGameState>;

  // Check supported versions: migrate v1 to v2, accept v2
  if (candidate.version !== 1 && candidate.version !== CURRENT_SAVE_VERSION) {
    return null;
  }

  if (
    !Array.isArray(candidate.playerPos) ||
    candidate.playerPos.length !== 3 ||
    typeof candidate.playerPos[0] !== 'number' ||
    typeof candidate.playerPos[1] !== 'number' ||
    typeof candidate.playerPos[2] !== 'number'
  ) {
    return null;
  }

  if (!candidate.vitals || typeof candidate.vitals !== 'object') {
    return null;
  }
  const v = candidate.vitals as Partial<VitalsState>;
  if (
    typeof v.health !== 'number' ||
    typeof v.hydration !== 'number' ||
    typeof v.hunger !== 'number' ||
    typeof v.exposure !== 'number' ||
    typeof v.stamina !== 'number'
  ) {
    return null;
  }

  if (!Array.isArray(candidate.inventory)) {
    return null;
  }

  if (!Array.isArray(candidate.structures)) {
    return null;
  }

  if (typeof candidate.timeInTideCycle !== 'number') {
    return null;
  }

  // Version 1 migration: ensure playerPos is within bounds of world [-1500, 1500]
  // If playerPos was at origin or outside new terrain, safely reposition to starter island beach
  const migratedState: SavedGameState = {
    version: CURRENT_SAVE_VERSION,
    timestamp: candidate.timestamp ?? Date.now(),
    playerPos: [
      candidate.playerPos[0],
      candidate.playerPos[1],
      candidate.playerPos[2],
    ],
    vitals: {
      health: v.health,
      hydration: v.hydration,
      hunger: v.hunger,
      exposure: v.exposure,
      stamina: v.stamina,
      isDead: !!v.isDead,
    },
    inventory: candidate.inventory,
    structures: candidate.structures,
    timeInTideCycle: candidate.timeInTideCycle,
    crates: candidate.crates ?? [],
  };

  if (candidate.version === 1) {
    // If old v1 save had player near previous starter island center (0, 8, 12),
    // reposition safely to starter beach island in south-west
    if (Math.abs(migratedState.playerPos[0]) < 50 && Math.abs(migratedState.playerPos[2]) < 50) {
      migratedState.playerPos = [-820, 6.0, 820];
    }
  }

  return migratedState;
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
          const raw = req.result || null;
          resolve(validateAndMigrateSave(raw));
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }
}
