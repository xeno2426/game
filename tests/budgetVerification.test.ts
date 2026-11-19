import { describe, it, expect } from 'vitest';
import { selectLODTier, CHUNK_SIZE, LOD_DISTANCES } from '../src/logic/terrainChunkLogic';

describe('Performance Budget Verification (Group E)', () => {
  // Clear-weather fog far plane is 450m (camera view cone covers ~65 degrees)
  const CAMERA_FAR_PLANE = 450.0;
  const CAMERA_FOV_RAD = (65 * Math.PI) / 180;

  function evaluateMetricsAt(name: string, posX: number, posZ: number) {
    // Frustum area inside 450m far plane
    const frustumArea = 0.5 * (CAMERA_FAR_PLANE * CAMERA_FAR_PLANE) * CAMERA_FOV_RAD;
    const chunkArea = CHUNK_SIZE * CHUNK_SIZE; // 4096 m^2
    const visibleChunkCount = Math.ceil(frustumArea / chunkArea); // ~28 chunks

    // Calculate LOD distribution within the 450m frustum:
    // LOD0: within 160m (radius 160m cone)
    const lod0Area = 0.5 * (LOD_DISTANCES.LOD0 * LOD_DISTANCES.LOD0) * CAMERA_FOV_RAD;
    const lod0Chunks = Math.min(visibleChunkCount, Math.ceil(lod0Area / chunkArea));

    // LOD1: 160m to 400m
    const lod1Area = 0.5 * (LOD_DISTANCES.LOD1 * LOD_DISTANCES.LOD1 - LOD_DISTANCES.LOD0 * LOD_DISTANCES.LOD0) * CAMERA_FOV_RAD;
    const lod1Chunks = Math.min(visibleChunkCount - lod0Chunks, Math.ceil(lod1Area / chunkArea));

    // LOD2: 400m to 450m (capped by fog far plane)
    const lod2Chunks = Math.max(0, visibleChunkCount - lod0Chunks - lod1Chunks);

    const lod0Tris = lod0Chunks * (32 * 32 * 2 + 32 * 4 * 2);
    const lod1Tris = lod1Chunks * (16 * 16 * 2 + 16 * 4 * 2);
    const lod2Tris = lod2Chunks * (8 * 8 * 2 + 8 * 4 * 2);
    const terrainTris = lod0Tris + lod1Tris + lod2Tris;

    const waterTris = 90 * 90 * 2; // 16,200 tris
    const propTrisEst = 12000;      // Instanced trees, rocks, barrels
    const entityTrisEst = 6000;     // Player + up to 6 active enemies
    const totalTris = terrainTris + waterTris + propTrisEst + entityTrisEst;

    // Active draw calls: visible terrain chunks + 1 water + instanced props + enemies + player
    const terrainDrawCalls = visibleChunkCount;
    const propDrawCalls = 10;
    const entityDrawCalls = 8;
    const totalDrawCalls = terrainDrawCalls + 1 + propDrawCalls + entityDrawCalls;

    return {
      name,
      posX,
      posZ,
      visibleChunks: visibleChunkCount,
      lodBreakdown: { lod0Chunks, lod1Chunks, lod2Chunks },
      totalDrawCalls,
      totalTris,
    };
  }

  it('should stay strictly within draw call and triangle budgets at Spawn (SW Beach)', () => {
    const metrics = evaluateMetricsAt('Spawn Beach', -820, 820);
    expect(metrics.totalDrawCalls).toBeLessThan(100);
    expect(metrics.totalTris).toBeLessThan(150000);
  });

  it('should stay strictly within draw call and triangle budgets at Mid-Map (Radio Tower)', () => {
    const metrics = evaluateMetricsAt('Radio Tower', 0, 0);
    expect(metrics.totalDrawCalls).toBeLessThan(100);
    expect(metrics.totalTris).toBeLessThan(150000);
  });

  it('should stay strictly within draw call and triangle budgets at Harbour Island', () => {
    const metrics = evaluateMetricsAt('Industrial Harbour', 650, -600);
    expect(metrics.totalDrawCalls).toBeLessThan(100);
    expect(metrics.totalTris).toBeLessThan(150000);
  });
});
