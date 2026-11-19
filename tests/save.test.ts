import { describe, it, expect, beforeEach } from 'vitest';
import { SaveSystem, validateAndMigrateSave, type SavedGameState } from '../src/core/SaveSystem';

describe('SaveSystem and State Persistence', () => {
  beforeEach(() => {
    // In-memory mock for indexedDB in test environment
    const store = new Map<string, any>();
    (globalThis as any).indexedDB = {
      open: () => {
        const req: any = {
          result: {
            objectStoreNames: { contains: () => true },
            createObjectStore: () => {},
            transaction: () => ({
              objectStore: () => ({
                put: (val: any, key: string) => {
                  store.set(key, JSON.parse(JSON.stringify(val)));
                  const r: any = {};
                  setTimeout(() => r.onsuccess?.({ target: r }), 0);
                  return r;
                },
                get: (key: string) => {
                  const val = store.get(key);
                  const r: any = { result: val ? JSON.parse(JSON.stringify(val)) : undefined };
                  setTimeout(() => r.onsuccess?.({ target: r }), 0);
                  return r;
                },
              }),
            }),
          },
        };
        setTimeout(() => {
          req.onupgradeneeded?.({ target: req });
          req.onsuccess?.({ target: req });
        }, 0);
        return req;
      },
    };
  });

  it('should validate and tolerate corrupt or older version saves', () => {
    expect(validateAndMigrateSave(null)).toBeNull();
    expect(validateAndMigrateSave(undefined)).toBeNull();
    expect(validateAndMigrateSave('invalid-string')).toBeNull();
    expect(validateAndMigrateSave({ version: 0 })).toBeNull(); // older version
    expect(validateAndMigrateSave({ version: 2 })).toBeNull(); // unsupported future version
    expect(validateAndMigrateSave({ version: 1, playerPos: [0, 0] })).toBeNull(); // corrupt pos
  });

  it('should successfully round-trip save and load valid game state', async () => {
    await SaveSystem.init();

    const mockState: SavedGameState = {
      version: 1,
      timestamp: Date.now(),
      playerPos: [10, 5, -12],
      vitals: {
        health: 85,
        hydration: 70,
        hunger: 65,
        exposure: 15,
        stamina: 90,
        isDead: false,
      },
      inventory: [
        { itemId: 'scrap_axe', count: 1 },
        { itemId: 'wood_log', count: 6 },
        { itemId: null, count: 0 },
      ],
      structures: [
        {
          id: 'struct_1',
          blueprintId: 'foundation',
          position: [0, 1, 0],
          rotationY: 0,
        },
      ],
      timeInTideCycle: 320,
    };

    const saved = await SaveSystem.save(mockState);
    expect(saved).toBe(true);

    const loaded = await SaveSystem.load();
    expect(loaded).not.toBeNull();
    expect(loaded?.version).toBe(1);
    expect(loaded?.playerPos).toEqual([10, 5, -12]);
    expect(loaded?.vitals.health).toBe(85);
    expect(loaded?.structures.length).toBe(1);
  });
});
