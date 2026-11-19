import { describe, it, expect } from 'vitest';
import {
  CHUNK_SIZE,
  LOD_DISTANCES,
  getChunkBounds,
  getChunkCenter,
  getChunkCoords,
  getChunkDistance,
  getChunkGeometryCounts,
  getChunkKey,
  parseChunkKey,
  selectLODTier,
} from '../src/logic/terrainChunkLogic';
import { TerrainChunks } from '../src/world/TerrainChunks';
import { WorldGen } from '../src/world/WorldGen';
import * as THREE from 'three';

describe('Group B: Streaming Terrain and Dynamic Depth Water', () => {
  it('should correctly calculate chunk coordinates and bounding boxes', () => {
    // Origin
    const c0 = getChunkCoords(0, 0);
    expect(c0.cx).toBe(0);
    expect(c0.cz).toBe(0);

    const b0 = getChunkBounds(0, 0);
    expect(b0.minX).toBe(0);
    expect(b0.maxX).toBe(CHUNK_SIZE);
    expect(b0.minZ).toBe(0);
    expect(b0.maxZ).toBe(CHUNK_SIZE);

    const center0 = getChunkCenter(0, 0);
    expect(center0.x).toBe(32);
    expect(center0.z).toBe(32);

    // Negative coordinates (South-West starter quadrant)
    const cSW = getChunkCoords(-850, 850);
    expect(cSW.cx).toBe(-14); // -850 / 64 = -13.28 -> floor = -14
    expect(cSW.cz).toBe(13);  // 850 / 64 = 13.28 -> floor = 13

    const key = getChunkKey(cSW.cx, cSW.cz);
    expect(key).toBe('-14_13');
    const parsed = parseChunkKey(key);
    expect(parsed.cx).toBe(-14);
    expect(parsed.cz).toBe(13);
  });

  it('should correctly select LOD tiers based on player distance', () => {
    // Within 160m -> LOD0
    expect(selectLODTier(0)).toBe(0);
    expect(selectLODTier(50)).toBe(0);
    expect(selectLODTier(159.9)).toBe(0);

    // 160m to 400m -> LOD1
    expect(selectLODTier(160.0)).toBe(1);
    expect(selectLODTier(250)).toBe(1);
    expect(selectLODTier(399.9)).toBe(1);

    // 400m to 900m -> LOD2
    expect(selectLODTier(400.0)).toBe(2);
    expect(selectLODTier(600)).toBe(2);
    expect(selectLODTier(900.0)).toBe(2);

    // Beyond 900m -> culled (-1)
    expect(selectLODTier(900.1)).toBe(-1);
    expect(selectLODTier(1500)).toBe(-1);
  });

  it('should compute distance from player to chunk bounds correctly', () => {
    // Inside chunk [0..64, 0..64]
    expect(getChunkDistance(0, 0, 32, 32)).toBe(0);
    expect(getChunkDistance(0, 0, 10, 50)).toBe(0);

    // 50m west of chunk (x = -50, minX = 0)
    expect(getChunkDistance(0, 0, -50, 32)).toBe(50);

    // Diagonal distance (dx = 30, dz = 40 -> hypot = 50)
    expect(getChunkDistance(0, 0, -30, -40)).toBe(50);
  });

  it('should calculate geometry counts with skirts for each LOD tier', () => {
    // LOD0: 32 segments
    const lod0 = getChunkGeometryCounts(32);
    expect(lod0.vertexCount).toBe(33 * 33 + 33 * 4); // 1089 grid + 132 skirt = 1221
    expect(lod0.indexCount).toBe(32 * 32 * 6 + 32 * 4 * 6); // 6144 grid + 768 skirt = 6912

    // LOD1: 16 segments
    const lod1 = getChunkGeometryCounts(16);
    expect(lod1.vertexCount).toBe(17 * 17 + 17 * 4); // 289 + 68 = 357
    expect(lod1.indexCount).toBe(16 * 16 * 6 + 16 * 4 * 6); // 1536 + 384 = 1920

    // LOD2: 8 segments
    const lod2 = getChunkGeometryCounts(8);
    expect(lod2.vertexCount).toBe(9 * 9 + 9 * 4); // 81 + 36 = 117
    expect(lod2.indexCount).toBe(8 * 8 * 6 + 8 * 4 * 6); // 384 + 192 = 576
  });

  it('should manage and reuse chunk mesh pools without leaks', () => {
    const scene = new THREE.Scene();
    const worldGen = WorldGen.get();
    const chunks = new TerrainChunks(scene, worldGen);

    // Acquire mesh from pool
    const meshLOD0 = chunks.acquireMesh(0);
    expect(meshLOD0).toBeDefined();
    expect(meshLOD0.geometry).toBeDefined();

    // Release back into pool
    chunks.releaseMesh(meshLOD0, 0);

    // Re-acquire and verify it reuses the same mesh instance
    const reacquired = chunks.acquireMesh(0);
    expect(reacquired).toBe(meshLOD0);

    // Verify all 3 tiers acquire and release cleanly
    const meshLOD1 = chunks.acquireMesh(1);
    chunks.releaseMesh(meshLOD1, 1);
    const reacquired1 = chunks.acquireMesh(1);
    expect(reacquired1).toBe(meshLOD1);

    const meshLOD2 = chunks.acquireMesh(2);
    chunks.releaseMesh(meshLOD2, 2);
    const reacquired2 = chunks.acquireMesh(2);
    expect(reacquired2).toBe(meshLOD2);
  });
});
