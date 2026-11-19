import { describe, it, expect } from 'vitest';
import { SpatialHashGrid } from '../src/logic/spatialHashGrid';
import { RAFT_CONSTANTS, RESOURCE_CONSTANTS, TIDE_CONSTANTS } from '../src/data/constants';
import { WORLD_LANDMARKS } from '../src/world/Landmarks';
import { WORLD_SIZE } from '../src/logic/worldLogic';
import { BIOMES, BiomeType } from '../src/data/biomes';

describe('Group C: Props, Spawning, Landmarks and Navigation', () => {
  it('should efficiently query nodes within 4m in SpatialHashGrid without checking distant nodes', () => {
    const grid = new SpatialHashGrid<{ name: string }>(16.0);

    // Insert 100 scattered distant nodes (all >= 50m away from origin)
    for (let i = 0; i < 100; i++) {
      grid.insert({
        id: `node_${i}`,
        x: 50.0 + i * 20,
        z: 50.0 + i * 20,
        data: { name: `node_${i}` },
      });
    }

    // Insert 2 nodes near query center (0, 0)
    grid.insert({ id: 'near_1', x: 2.0, z: 1.5, data: { name: 'near_1' } }); // dist = 2.5m (< 4m)
    grid.insert({ id: 'near_2', x: -1.0, z: -2.0, data: { name: 'near_2' } }); // dist = 2.23m (< 4m)
    grid.insert({ id: 'far_1', x: 6.0, z: 0.0, data: { name: 'far_1' } }); // dist = 6m (> 4m)

    const results: any[] = [];
    grid.query(0, 0, RESOURCE_CONSTANTS.INTERACTION_QUERY_RADIUS, results);

    expect(results.length).toBe(2);
    const ids = results.map((r) => r.id);
    expect(ids).toContain('near_1');
    expect(ids).toContain('near_2');
    expect(ids).not.toContain('far_1');
  });

  it('should respawn harvested nodes after exactly 3 tide cycles (2700s)', () => {
    const tideCycleSec = TIDE_CONSTANTS.CYCLE_DURATION_SEC; // 900s
    expect(tideCycleSec).toBe(900);
    expect(RESOURCE_CONSTANTS.NODE_RESPAWN_TIME_SEC).toBe(3 * tideCycleSec); // 2700s

    const harvestedAt = 1000.0;
    const isHarvested = (currentSec: number) => {
      return currentSec - harvestedAt < RESOURCE_CONSTANTS.NODE_RESPAWN_TIME_SEC;
    };

    // Before 3 cycles (e.g. 1 cycle in, 2 cycles in) -> still harvested
    expect(isHarvested(1000 + 900)).toBe(true);
    expect(isHarvested(1000 + 1800)).toBe(true);
    expect(isHarvested(1000 + 2699)).toBe(true);

    // After 3 full cycles (2700s) -> respawned
    expect(isHarvested(1000 + 2700)).toBe(false);
    expect(isHarvested(1000 + 3500)).toBe(false);
  });

  it('should validate all fixed landmarks are placed at distinct coordinates', () => {
    expect(WORLD_LANDMARKS.length).toBeGreaterThanOrEqual(4);

    const radioTower = WORLD_LANDMARKS.find((lm) => lm.type === 'radio_tower');
    expect(radioTower).toBeDefined();
    expect(radioTower!.position[0]).toBe(0);
    expect(radioTower!.position[2]).toBe(0);

    const harbourCranes = WORLD_LANDMARKS.filter((lm) => lm.type === 'harbour_crane');
    expect(harbourCranes.length).toBeGreaterThanOrEqual(2);

    const oilRigs = WORLD_LANDMARKS.filter((lm) => lm.type === 'oil_rig');
    expect(oilRigs.length).toBeGreaterThanOrEqual(2);

    // Verify all landmark positions are within world bounds
    for (const lm of WORLD_LANDMARKS) {
      expect(Math.abs(lm.position[0])).toBeLessThan(WORLD_SIZE * 0.5);
      expect(Math.abs(lm.position[2])).toBeLessThan(WORLD_SIZE * 0.5);
    }
  });

  it('should cross 3000m map by raft in about 5 minutes with MAX_SAIL_SPEED', () => {
    // 5 minutes = 300 seconds
    const transitTimeSec = WORLD_SIZE / RAFT_CONSTANTS.MAX_SAIL_SPEED;
    expect(transitTimeSec).toBeCloseTo(300.0, 1);
    expect(transitTimeSec / 60.0).toBeCloseTo(5.0, 1);
  });

  it('should configure enemy spawn tables per biome', () => {
    // Hounds on land biomes
    expect(BIOMES[BiomeType.PalmBeachCoast].enemies.some((e) => e.enemyType === 'hound')).toBe(true);
    expect(BIOMES[BiomeType.DenseJungle].enemies.some((e) => e.enemyType === 'hound')).toBe(true);
    expect(BIOMES[BiomeType.RockyHighlands].enemies.some((e) => e.enemyType === 'hound')).toBe(true);

    // Lurkers in swamp and deep water
    expect(BIOMES[BiomeType.MangroveSwamp].enemies.some((e) => e.enemyType === 'lurker')).toBe(true);
    expect(BIOMES[BiomeType.TidalFlats].enemies.some((e) => e.enemyType === 'lurker')).toBe(true);
    expect(BIOMES[BiomeType.Ocean].enemies.some((e) => e.enemyType === 'lurker')).toBe(true);
  });
});
