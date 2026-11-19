import { describe, it, expect } from 'vitest';
import {
  generateWorldData,
  sampleBilinearHeight,
  evaluateDirectHeight,
  sampleBiomeId,
  getHeight,
  getNormal,
  MAP_RES,
  WORLD_ISLANDS,
} from '../src/logic/worldLogic';
import { BiomeType } from '../src/data/biomes';
import { SimplexNoise } from '../src/world/Noise';

describe('Group A: World Data and Biome Generation', () => {
  it('should generate identical world data for identical seed (deterministic)', () => {
    const worldA = generateWorldData(1337);
    const worldB = generateWorldData(1337);

    expect(worldA.heightmap.length).toBe(MAP_RES * MAP_RES);
    expect(worldB.heightmap.length).toBe(MAP_RES * MAP_RES);

    // Verify first 100 samples and arbitrary samples across the grid
    for (let i = 0; i < 100; i++) {
      expect(worldA.heightmap[i]).toBe(worldB.heightmap[i]);
      expect(worldA.biomeMap[i]).toBe(worldB.biomeMap[i]);
    }
    const midIdx = Math.floor((MAP_RES * MAP_RES) / 2);
    expect(worldA.heightmap[midIdx]).toBe(worldB.heightmap[midIdx]);
    expect(worldA.biomeMap[midIdx]).toBe(worldB.biomeMap[midIdx]);
  });

  it('should cover 25 to 35 percent land and at least 4 percent of land for every biome', () => {
    const world = generateWorldData(42);
    const totalCells = MAP_RES * MAP_RES;
    let landCells = 0;

    const landBiomeCounts: Record<number, number> = {
      [BiomeType.PalmBeachCoast]: 0,
      [BiomeType.DenseJungle]: 0,
      [BiomeType.MangroveSwamp]: 0,
      [BiomeType.RockyHighlands]: 0,
      [BiomeType.IndustrialHarbour]: 0,
      [BiomeType.TidalFlats]: 0,
      [BiomeType.OffshoreOilRigs]: 0,
    };

    for (let i = 0; i < totalCells; i++) {
      const h = world.heightmap[i];
      if (h >= 0.0) {
        landCells++;
        const b = world.biomeMap[i];
        if (b in landBiomeCounts) {
          landBiomeCounts[b]++;
        }
      }
    }

    const landPercentage = (landCells / totalCells) * 100;
    expect(landPercentage).toBeGreaterThanOrEqual(24.5);
    expect(landPercentage).toBeLessThanOrEqual(35.5);

    // Verify every land biome covers at least 4.0% of land
    for (const bId of Object.keys(landBiomeCounts)) {
      const idNum = Number(bId);
      const count = landBiomeCounts[idNum];
      const biomePctOfLand = (count / landCells) * 100;
      expect(
        biomePctOfLand,
        `Biome ${idNum} has ${biomePctOfLand.toFixed(2)}% of land (expected >= 4%)`
      ).toBeGreaterThanOrEqual(4.0);
    }
  });

  it('should contain beach, jungle, and a dry hill above 4.5m on starter island', () => {
    const world = generateWorldData(42);
    const starter = WORLD_ISLANDS.find((isl) => isl.type === 'starter');
    expect(starter).toBeDefined();

    const cx = starter!.cx;
    const cz = starter!.cz;
    const r = starter!.radius;

    let hasBeach = false;
    let hasJungle = false;
    let maxHillHeight = -999;

    // Sample radial points across the starter island
    for (let dx = -r; dx <= r; dx += 10) {
      for (let dz = -r; dz <= r; dz += 10) {
        if (Math.hypot(dx, dz) <= r) {
          const sampleX = cx + dx;
          const sampleZ = cz + dz;
          const h = getHeight(world.heightmap, sampleX, sampleZ);
          const biome = sampleBiomeId(world.biomeMap, sampleX, sampleZ);

          if (h >= 0.5 && h <= 4.5 && biome === BiomeType.PalmBeachCoast) {
            hasBeach = true;
          }
          if (h > 4.5 && biome === BiomeType.DenseJungle) {
            hasJungle = true;
          }
          if (h > maxHillHeight) {
            maxHillHeight = h;
          }
        }
      }
    }

    expect(hasBeach, 'Starter island should have beach coast below high tide').toBe(true);
    expect(hasJungle, 'Starter island should have lush jungle').toBe(true);
    expect(maxHillHeight, 'Starter island should have a dry hill well above 4.5m high tide line').toBeGreaterThan(8.0);
  });

  it('should have bilinear lookups match direct mathematical evaluation within tolerance', () => {
    const world = generateWorldData(42);
    const noise = new SimplexNoise(42);

    // Test a suite of coordinates across the 3000x3000m world
    const testPoints = [
      [0, 0],
      [-850, 850], // starter island center
      [-750, 750], // starter island slope
      [650, -600], // harbour island
      [-450, 350], // mangrove
      [300, 300],  // ocean
      [-1200, -1200], // ocean edge
      [125.5, -432.8], // arbitrary fractional coords
    ];

    for (const [x, z] of testPoints) {
      const bilinearH = sampleBilinearHeight(world.heightmap, x, z);
      const directH = evaluateDirectHeight(x, z, noise);
      // At or near grid cells, bilinear interpolation tracks direct continuous function closely
      expect(Math.abs(bilinearH - directH)).toBeLessThan(0.45);
    }
  });

  it('should compute valid surface normals without NaN', () => {
    const world = generateWorldData(42);
    const normal = getNormal(world.heightmap, -850, 850);
    expect(Number.isFinite(normal.x)).toBe(true);
    expect(Number.isFinite(normal.y)).toBe(true);
    expect(Number.isFinite(normal.z)).toBe(true);
    const len = Math.hypot(normal.x, normal.y, normal.z);
    expect(Math.abs(len - 1.0)).toBeLessThan(0.01);
  });
});
