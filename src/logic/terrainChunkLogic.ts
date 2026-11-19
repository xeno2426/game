export const CHUNK_SIZE = 64.0;
export const LOD_DISTANCES = {
  LOD0: 160.0,
  LOD1: 400.0,
  LOD2: 900.0,
} as const;

export const LOD_SEGMENTS = {
  LOD0: 32,
  LOD1: 16,
  LOD2: 8,
} as const;

export type LODLevel = 0 | 1 | 2;

export interface ChunkCoords {
  cx: number;
  cz: number;
}

export interface ChunkBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export function getChunkCoords(x: number, z: number, chunkSize = CHUNK_SIZE): ChunkCoords {
  return {
    cx: Math.floor(x / chunkSize),
    cz: Math.floor(z / chunkSize),
  };
}

export function getChunkKey(cx: number, cz: number): string {
  return `${cx}_${cz}`;
}

export function parseChunkKey(key: string): ChunkCoords {
  const parts = key.split('_');
  return {
    cx: parseInt(parts[0], 10),
    cz: parseInt(parts[1], 10),
  };
}

export function getChunkCenter(cx: number, cz: number, chunkSize = CHUNK_SIZE): { x: number; z: number } {
  return {
    x: cx * chunkSize + chunkSize * 0.5,
    z: cz * chunkSize + chunkSize * 0.5,
  };
}

export function getChunkBounds(cx: number, cz: number, chunkSize = CHUNK_SIZE): ChunkBounds {
  const minX = cx * chunkSize;
  const minZ = cz * chunkSize;
  return {
    minX,
    maxX: minX + chunkSize,
    minZ,
    maxZ: minZ + chunkSize,
  };
}

// Distance from player to the closest point of chunk bounds
export function getChunkDistance(
  cx: number,
  cz: number,
  playerX: number,
  playerZ: number,
  chunkSize = CHUNK_SIZE
): number {
  const minX = cx * chunkSize;
  const maxX = minX + chunkSize;
  const minZ = cz * chunkSize;
  const maxZ = minZ + chunkSize;

  const clampedX = Math.max(minX, Math.min(maxX, playerX));
  const clampedZ = Math.max(minZ, Math.min(maxZ, playerZ));

  const dx = playerX - clampedX;
  const dz = playerZ - clampedZ;
  return Math.hypot(dx, dz);
}

// Return 0, 1, 2 or -1 if culled
export function selectLODTier(distance: number): LODLevel | -1 {
  if (distance < LOD_DISTANCES.LOD0) return 0;
  if (distance < LOD_DISTANCES.LOD1) return 1;
  if (distance <= LOD_DISTANCES.LOD2) return 2;
  return -1;
}

// Calculate vertex and index counts including skirts for a segment resolution
export function getChunkGeometryCounts(segments: number): { vertexCount: number; indexCount: number } {
  const gridVerts = (segments + 1) * (segments + 1);
  const skirtVerts = (segments + 1) * 4; // 4 perimeter edges
  const totalVerts = gridVerts + skirtVerts;

  const gridIndices = segments * segments * 6;
  const skirtIndices = segments * 4 * 6;
  const totalIndices = gridIndices + skirtIndices;

  return { vertexCount: totalVerts, indexCount: totalIndices };
}
