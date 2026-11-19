import { SimplexNoise } from '../world/Noise';
import { BiomeType } from '../data/biomes';
import { PALETTE_COLORS } from '../data/palette';
import { TIDE_CONSTANTS } from '../data/constants';

export const WORLD_SIZE = 3000.0;
export const HALF_WORLD = WORLD_SIZE / 2.0; // 1500m
export const MAP_RES = 1024;
export const WORLD_GEN_VERSION = 2;
export const CELL_SIZE = WORLD_SIZE / (MAP_RES - 1); // ~2.9325m

export interface IslandDef {
  id: string;
  cx: number;
  cz: number;
  radius: number;
  peakH: number;
  type: 'starter' | 'radio' | 'harbour' | 'mangrove' | 'tidal' | 'rocky' | 'oilrig' | 'natural';
}

// 18 islands carefully placed across 3000x3000m map
export const WORLD_ISLANDS: IslandDef[] = [
  // 1. Starter Island (South-West)
  { id: 'starter_island', cx: -850, cz: 850, radius: 310, peakH: 14.0, type: 'starter' },
  // 2. Radio Tower Island (Centre)
  { id: 'radio_tower_island', cx: 0, cz: 0, radius: 290, peakH: 18.0, type: 'radio' },
  // 3. Industrial Harbour Island (North-East)
  { id: 'harbour_island', cx: 650, cz: -600, radius: 350, peakH: 7.5, type: 'harbour' },
  // 4. Mangrove Swamp Islands (Shallow channels, mud and silt)
  { id: 'mangrove_swamp_1', cx: -450, cz: 350, radius: 260, peakH: 5.5, type: 'mangrove' },
  { id: 'mangrove_swamp_2', cx: -250, cz: 700, radius: 250, peakH: 5.0, type: 'mangrove' },
  // 5. Tidal Flats and Reef Shallows (Exposed at low tide)
  { id: 'tidal_flats_1', cx: -600, cz: 600, radius: 240, peakH: 4.0, type: 'tidal' },
  { id: 'tidal_flats_2', cx: 250, cz: 150, radius: 260, peakH: 4.2, type: 'tidal' },
  { id: 'tidal_flats_3', cx: 100, cz: -350, radius: 230, peakH: 3.8, type: 'tidal' },
  // 6. Rocky Highlands Islands (Steep cliffs and high peaks)
  { id: 'rocky_highlands_1', cx: 800, cz: 350, radius: 300, peakH: 22.0, type: 'rocky' },
  { id: 'rocky_highlands_2', cx: -750, cz: -400, radius: 280, peakH: 20.0, type: 'rocky' },
  { id: 'rocky_highlands_3', cx: -300, cz: -750, radius: 260, peakH: 19.0, type: 'rocky' },
  // 7. Offshore Oil Rig Platforms (Deep ocean in northern sector)
  { id: 'oil_rig_alpha', cx: -900, cz: -1000, radius: 180, peakH: 8.0, type: 'oilrig' },
  { id: 'oil_rig_beta', cx: 450, cz: -1150, radius: 180, peakH: 8.0, type: 'oilrig' },
  // 8. Natural Archipelago Islands (Lush jungle and palm beaches)
  { id: 'natural_island_1', cx: 500, cz: 800, radius: 270, peakH: 13.0, type: 'natural' },
  { id: 'natural_island_2', cx: -1000, cz: 100, radius: 260, peakH: 12.0, type: 'natural' },
  { id: 'natural_island_3', cx: 950, cz: -150, radius: 280, peakH: 15.0, type: 'natural' },
  { id: 'natural_island_4', cx: -100, cz: 1100, radius: 230, peakH: 11.0, type: 'natural' },
  { id: 'natural_island_5', cx: 850, cz: -1100, radius: 230, peakH: 12.0, type: 'natural' },
];

// Precomputed island bounds for fast AABB spatial rejection
interface IslandBounding {
  isl: IslandDef;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  maxReach: number;
}

const ISLAND_BOUNDS: IslandBounding[] = WORLD_ISLANDS.map((isl) => {
  const maxReach = isl.radius * 1.35;
  return {
    isl,
    minX: isl.cx - maxReach,
    maxX: isl.cx + maxReach,
    minZ: isl.cz - maxReach,
    maxZ: isl.cz + maxReach,
    maxReach,
  };
});

export interface WorldData {
  heightmap: Float32Array;
  biomeMap: Uint8Array;
  seed: number;
}

// Convert world coordinates (-1500 to 1500) to grid coordinates (0 to 1023)
export function worldToGridCoords(x: number, z: number): { u: number; v: number } {
  const normX = Math.max(0.0, Math.min(1.0, (x + HALF_WORLD) / WORLD_SIZE));
  const normZ = Math.max(0.0, Math.min(1.0, (z + HALF_WORLD) / WORLD_SIZE));
  return {
    u: normX * (MAP_RES - 1),
    v: normZ * (MAP_RES - 1),
  };
}

// Direct mathematical height evaluation for any continuous (x, z)
export function evaluateDirectHeight(x: number, z: number, noise: SimplexNoise): number {
  let maxH = -14.0;

  for (let i = 0; i < ISLAND_BOUNDS.length; i++) {
    const b = ISLAND_BOUNDS[i];
    // Fast AABB rejection
    if (x < b.minX || x > b.maxX || z < b.minZ || z > b.maxZ) {
      continue;
    }

    const isl = b.isl;
    const dx = x - isl.cx;
    const dz = z - isl.cz;
    const d = Math.hypot(dx, dz);

    // Island shape modulation with noise for natural organic coves
    const radNoise = noise.noise2D((dx + isl.cx * 0.1) * 0.006, (dz + isl.cz * 0.1) * 0.006) * 0.16;
    const effectiveRadius = isl.radius * (1.0 + radNoise);
    const nd = d / effectiveRadius;

    if (nd < 1.3) {
      let h = -14.0;
      if (nd <= 1.0) {
        if (isl.type === 'harbour') {
          // Flat concrete apron plateau at 5.5m - 7.5m
          h = (1.0 - Math.pow(nd, 4)) * isl.peakH;
        } else if (isl.type === 'oilrig') {
          // Elevated steel platform
          h = nd < 0.85 ? isl.peakH : (1.0 - (nd - 0.85) / 0.15) * isl.peakH;
        } else {
          // Natural island dome profile
          const baseDome = (1.0 - Math.pow(nd, 1.8)) * (isl.peakH + 5.5) - 5.5;
          const ridgeNoise = noise.noise2D(x * 0.015, z * 0.015) * 1.5;
          h = baseDome + ridgeNoise;
        }
      } else {
        // Shallow underwater shelf: nd between 1.0 and 1.3, dropping smoothly to ocean floor
        const t = (nd - 1.0) / 0.3;
        h = (1.0 - t) * -0.5 + t * -14.0;
      }
      if (h > maxH) maxH = h;
    }
  }

  // Deep ocean undulations
  if (maxH <= -13.5) {
    const oceanDepthNoise = noise.noise2D(x * 0.003, z * 0.003) * 3.0;
    maxH = -15.0 + oceanDepthNoise;
  }

  return maxH;
}

// Direct biome evaluation based on location, island type, elevation and slope
export function evaluateDirectBiome(
  x: number,
  z: number,
  height: number,
  slope: number,
  _noise: SimplexNoise
): BiomeType {
  if (height < 0.0) {
    if (height > -4.0) {
      return BiomeType.TidalFlats;
    }
    return BiomeType.Ocean;
  }

  // Find nearest island
  let closestIsland = WORLD_ISLANDS[0];
  let closestNormDist = 999.0;

  for (let i = 0; i < WORLD_ISLANDS.length; i++) {
    const isl = WORLD_ISLANDS[i];
    const dx = x - isl.cx;
    const dz = z - isl.cz;
    const nd = Math.hypot(dx, dz) / isl.radius;
    if (nd < closestNormDist) {
      closestNormDist = nd;
      closestIsland = isl;
    }
  }

  if (closestIsland.type === 'harbour') {
    return BiomeType.IndustrialHarbour;
  }
  if (closestIsland.type === 'oilrig') {
    return BiomeType.OffshoreOilRigs;
  }
  if (closestIsland.type === 'mangrove') {
    return height < 4.5 ? BiomeType.MangroveSwamp : BiomeType.DenseJungle;
  }
  if (closestIsland.type === 'tidal') {
    return BiomeType.TidalFlats;
  }
  if (closestIsland.type === 'rocky') {
    return height > 5.0 ? BiomeType.RockyHighlands : BiomeType.PalmBeachCoast;
  }

  // Starter island and other natural islands
  if (height < 4.5) {
    return BiomeType.PalmBeachCoast;
  }
  if (height > 9.5 || slope > 0.42) {
    return BiomeType.RockyHighlands;
  }
  return BiomeType.DenseJungle;
}

// Generate the full 1024x1024 heightmap and biome map
export function generateWorldData(seed = 42): WorldData {
  const noise = new SimplexNoise(seed);
  const heightmap = new Float32Array(MAP_RES * MAP_RES);
  const biomeMap = new Uint8Array(MAP_RES * MAP_RES);

  // Pass 1: Heightmap generation
  for (let j = 0; j < MAP_RES; j++) {
    const z = -HALF_WORLD + (j / (MAP_RES - 1)) * WORLD_SIZE;
    const rowOffset = j * MAP_RES;
    for (let i = 0; i < MAP_RES; i++) {
      const x = -HALF_WORLD + (i / (MAP_RES - 1)) * WORLD_SIZE;
      heightmap[rowOffset + i] = evaluateDirectHeight(x, z, noise);
    }
  }

  // Pass 2: Slope and Biome assignment directly from array
  for (let j = 0; j < MAP_RES; j++) {
    const z = -HALF_WORLD + (j / (MAP_RES - 1)) * WORLD_SIZE;
    const rowOffset = j * MAP_RES;
    const jPrev = Math.max(0, j - 1) * MAP_RES;
    const jNext = Math.min(MAP_RES - 1, j + 1) * MAP_RES;

    for (let i = 0; i < MAP_RES; i++) {
      const x = -HALF_WORLD + (i / (MAP_RES - 1)) * WORLD_SIZE;
      const idx = rowOffset + i;
      const h = heightmap[idx];

      const iPrev = Math.max(0, i - 1);
      const iNext = Math.min(MAP_RES - 1, i + 1);

      const dx = (heightmap[rowOffset + iNext] - heightmap[rowOffset + iPrev]) / (2 * CELL_SIZE);
      const dz = (heightmap[jNext + i] - heightmap[jPrev + i]) / (2 * CELL_SIZE);
      const slope = Math.min(1.0, Math.sqrt(dx * dx + dz * dz));

      biomeMap[idx] = evaluateDirectBiome(x, z, h, slope, noise);
    }
  }

  return { heightmap, biomeMap, seed };
}

// O(1) Bilinear height sampling
export function sampleBilinearHeight(heightmap: Float32Array, x: number, z: number): number {
  const normX = Math.max(0.0, Math.min(1.0, (x + HALF_WORLD) / WORLD_SIZE));
  const normZ = Math.max(0.0, Math.min(1.0, (z + HALF_WORLD) / WORLD_SIZE));

  const u = normX * (MAP_RES - 1);
  const v = normZ * (MAP_RES - 1);

  const i0 = Math.floor(u);
  const j0 = Math.floor(v);
  const i1 = Math.min(MAP_RES - 1, i0 + 1);
  const j1 = Math.min(MAP_RES - 1, j0 + 1);

  const tx = u - i0;
  const tz = v - j0;

  const h00 = heightmap[j0 * MAP_RES + i0];
  const h10 = heightmap[j0 * MAP_RES + i1];
  const h01 = heightmap[j1 * MAP_RES + i0];
  const h11 = heightmap[j1 * MAP_RES + i1];

  const h0 = h00 * (1.0 - tx) + h10 * tx;
  const h1 = h01 * (1.0 - tx) + h11 * tx;

  return h0 * (1.0 - tz) + h1 * tz;
}

// O(1) Biome sampling (nearest neighbor or dominant cell)
export function sampleBiomeId(biomeMap: Uint8Array, x: number, z: number): BiomeType {
  const normX = Math.max(0.0, Math.min(1.0, (x + HALF_WORLD) / WORLD_SIZE));
  const normZ = Math.max(0.0, Math.min(1.0, (z + HALF_WORLD) / WORLD_SIZE));

  const i = Math.min(MAP_RES - 1, Math.round(normX * (MAP_RES - 1)));
  const j = Math.min(MAP_RES - 1, Math.round(normZ * (MAP_RES - 1)));

  return (biomeMap[j * MAP_RES + i] ?? BiomeType.Ocean) as BiomeType;
}

// Fine-scale deterministic detail noise added to bilinear height
export function getDetailNoise(x: number, z: number): number {
  // Analytical high-frequency sine combination (zero allocations, deterministic)
  const n1 = Math.sin(x * 0.35 + 1.2) * Math.cos(z * 0.35 + 0.8) * 0.12;
  const n2 = Math.sin((x + z) * 0.7 + 2.4) * 0.06;
  return n1 + n2;
}

// Combined height with bilinear lookup + detail noise
export function getHeight(heightmap: Float32Array, x: number, z: number): number {
  return sampleBilinearHeight(heightmap, x, z) + getDetailNoise(x, z);
}

// Surface normal computation with scratch object
export function getNormal(
  heightmap: Float32Array,
  x: number,
  z: number,
  out = { x: 0, y: 1, z: 0 }
): { x: number; y: number; z: number } {
  const eps = 0.8;
  const hL = getHeight(heightmap, x - eps, z);
  const hR = getHeight(heightmap, x + eps, z);
  const hD = getHeight(heightmap, x, z - eps);
  const hU = getHeight(heightmap, x, z + eps);

  const nx = hL - hR;
  const ny = 2.0 * eps;
  const nz = hD - hU;
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1.0;

  out.x = nx / len;
  out.y = ny / len;
  out.z = nz / len;
  return out;
}

// Soft vertex color calculation from biome, height, and slope
export function computeVertexColor(
  _x: number,
  _z: number,
  height: number,
  slope: number,
  biomeId: BiomeType,
  outColor: { r: number; g: number; b: number }
): void {
  const cWetSilt = PALETTE_COLORS.WetSilt;
  const cSand = PALETTE_COLORS.SunBleachedSand;
  const cSlate = PALETTE_COLORS.WeatheredSlate;
  const cGunmetal = PALETTE_COLORS.GunmetalGrey;
  const cPalm = PALETTE_COLORS.PalmLeafGreen;
  const cJungle = PALETTE_COLORS.DeepJungle;
  const cRust = PALETTE_COLORS.OxidisedRust;

  const highTideLine = TIDE_CONSTANTS.WATER_LEVEL_HIGH; // 4.5m

  // Base biome color assignment
  let r = cSand.r;
  let g = cSand.g;
  let b = cSand.b;

  switch (biomeId) {
    case BiomeType.PalmBeachCoast:
      r = cSand.r;
      g = cSand.g;
      b = cSand.b;
      break;
    case BiomeType.DenseJungle:
      r = cJungle.r;
      g = cJungle.g;
      b = cJungle.b;
      break;
    case BiomeType.MangroveSwamp:
      r = (cWetSilt.r * 0.6 + cJungle.r * 0.4);
      g = (cWetSilt.g * 0.6 + cJungle.g * 0.4);
      b = (cWetSilt.b * 0.6 + cJungle.b * 0.4);
      break;
    case BiomeType.RockyHighlands:
      r = cSlate.r;
      g = cSlate.g;
      b = cSlate.b;
      break;
    case BiomeType.IndustrialHarbour:
      r = (cSlate.r * 0.5 + cGunmetal.r * 0.5);
      g = (cSlate.g * 0.5 + cGunmetal.g * 0.5);
      b = (cSlate.b * 0.5 + cGunmetal.b * 0.5);
      break;
    case BiomeType.TidalFlats:
      r = cWetSilt.r;
      g = cWetSilt.g;
      b = cWetSilt.b;
      break;
    case BiomeType.OffshoreOilRigs:
      r = (cRust.r * 0.6 + cGunmetal.r * 0.4);
      g = (cRust.g * 0.6 + cGunmetal.g * 0.4);
      b = (cRust.b * 0.6 + cGunmetal.b * 0.4);
      break;
    case BiomeType.Ocean:
    default:
      r = cWetSilt.r;
      g = cWetSilt.g;
      b = cWetSilt.b;
      break;
  }

  // Soft blending: Wet silt blend near and below water mark
  if (height < highTideLine + 0.4) {
    const t = Math.max(0, Math.min(1, (highTideLine + 0.4 - height) / 2.5));
    r = r * (1 - t) + cWetSilt.r * t;
    g = g * (1 - t) + cWetSilt.g * t;
    b = b * (1 - t) + cWetSilt.b * t;
  }

  // Soft blending: Steep slopes blend towards Weathered Slate
  if (slope > 0.38) {
    const t = Math.min(1.0, (slope - 0.38) / 0.28);
    r = r * (1 - t) + cSlate.r * t;
    g = g * (1 - t) + cSlate.g * t;
    b = b * (1 - t) + cSlate.b * t;
  }

  // Soft blending: Plateau foliage blend
  if (biomeId === BiomeType.DenseJungle && height < 7.0) {
    const t = Math.max(0, Math.min(1, (7.0 - height) / 2.2));
    r = r * (1 - t) + cPalm.r * t;
    g = g * (1 - t) + cPalm.g * t;
    b = b * (1 - t) + cPalm.b * t;
  }

  outColor.r = r;
  outColor.g = g;
  outColor.b = b;
}
