import * as THREE from 'three';
import {
  CHUNK_SIZE,
  LOD_SEGMENTS,
  getChunkBounds,
  getChunkDistance,
  getChunkGeometryCounts,
  getChunkKey,
  selectLODTier,
  type LODLevel,
} from '../logic/terrainChunkLogic';
import type { WorldGen } from './WorldGen';
import { computeVertexColor } from '../logic/worldLogic';

export interface ActiveChunk {
  key: string;
  cx: number;
  cz: number;
  lod: LODLevel;
  mesh: THREE.Mesh;
}

export interface ChunkBuildRequest {
  key: string;
  cx: number;
  cz: number;
  lod: LODLevel;
  distance: number;
}

export class TerrainChunks {
  public scene: THREE.Scene;
  public worldGen: WorldGen;
  public activeChunks = new Map<string, ActiveChunk>();
  public buildQueue: ChunkBuildRequest[] = [];

  private pools: Record<LODLevel, THREE.Mesh[]> = {
    0: [],
    1: [],
    2: [],
  };

  private sharedMaterial: THREE.MeshLambertMaterial;
  private scratchNormal = { x: 0, y: 1, z: 0 };
  private scratchColor = { r: 1, g: 1, b: 1 };

  constructor(scene: THREE.Scene, worldGen: WorldGen) {
    this.scene = scene;
    this.worldGen = worldGen;

    this.sharedMaterial = new THREE.MeshLambertMaterial({
      vertexColors: true,
      flatShading: true,
    });

    // Pre-populate object pools for LOD tiers to avoid allocation during streaming
    this.prepopulatePool(0, 24);
    this.prepopulatePool(1, 48);
    this.prepopulatePool(2, 64);
  }

  private prepopulatePool(lod: LODLevel, count: number): void {
    const segments = LOD_SEGMENTS[`LOD${lod}` as keyof typeof LOD_SEGMENTS];
    const { vertexCount, indexCount } = getChunkGeometryCounts(segments);

    for (let i = 0; i < count; i++) {
      const geometry = new THREE.BufferGeometry();
      const posArray = new Float32Array(vertexCount * 3);
      const normArray = new Float32Array(vertexCount * 3);
      const colArray = new Float32Array(vertexCount * 3);

      const IndexArrayType = vertexCount > 65535 ? Uint32Array : Uint16Array;
      const indexArray = new IndexArrayType(indexCount);

      // Pre-compute grid and skirt topology index buffer
      this.buildIndexTopology(indexArray, segments);

      geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      geometry.setAttribute('normal', new THREE.BufferAttribute(normArray, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colArray, 3));
      geometry.setIndex(new THREE.BufferAttribute(indexArray, 1));

      const mesh = new THREE.Mesh(geometry, this.sharedMaterial);
      mesh.receiveShadow = true;
      mesh.castShadow = false;
      mesh.frustumCulled = true;
      this.pools[lod].push(mesh);
    }
  }

  private buildIndexTopology(indexArray: Uint16Array | Uint32Array, segments: number): void {
    let ptr = 0;
    const S = segments;
    const stride = S + 1;

    // Surface quad indices
    for (let row = 0; row < S; row++) {
      for (let col = 0; col < S; col++) {
        const a = row * stride + col;
        const b = a + 1;
        const c = (row + 1) * stride + col;
        const d = c + 1;

        indexArray[ptr++] = a;
        indexArray[ptr++] = c;
        indexArray[ptr++] = b;

        indexArray[ptr++] = b;
        indexArray[ptr++] = c;
        indexArray[ptr++] = d;
      }
    }

    // Skirt quad indices for 4 edges
    const gridVerts = stride * stride;
    let skirtBase = gridVerts;

    // Helper for connecting edge
    const connectEdge = (getSurfaceIdx: (k: number) => number) => {
      for (let k = 0; k < S; k++) {
        const topA = getSurfaceIdx(k);
        const topB = getSurfaceIdx(k + 1);
        const botA = skirtBase + k;
        const botB = skirtBase + k + 1;

        indexArray[ptr++] = topA;
        indexArray[ptr++] = botA;
        indexArray[ptr++] = topB;

        indexArray[ptr++] = topB;
        indexArray[ptr++] = botA;
        indexArray[ptr++] = botB;
      }
      skirtBase += stride;
    };

    // Edge 0: Top edge (row = 0, col = 0..S)
    connectEdge((k) => k);

    // Edge 1: Right edge (col = S, row = 0..S)
    connectEdge((k) => k * stride + S);

    // Edge 2: Bottom edge (row = S, col = S..0 for outward face)
    connectEdge((k) => S * stride + (S - k));

    // Edge 3: Left edge (col = 0, row = S..0 for outward face)
    connectEdge((k) => (S - k) * stride);
  }

  public acquireMesh(lod: LODLevel): THREE.Mesh {
    const pool = this.pools[lod];
    if (pool.length > 0) {
      return pool.pop()!;
    }
    // Pool exhausted, allocate one extra
    this.prepopulatePool(lod, 1);
    return this.pools[lod].pop()!;
  }

  public releaseMesh(mesh: THREE.Mesh, lod: LODLevel): void {
    if (mesh.parent) {
      mesh.parent.remove(mesh);
    }
    this.pools[lod].push(mesh);
  }

  public update(playerPos: THREE.Vector3): void {
    const px = playerPos.x;
    const pz = playerPos.z;

    const currentRadiusChunks = Math.ceil(900.0 / CHUNK_SIZE);
    const centerCx = Math.floor(px / CHUNK_SIZE);
    const centerCz = Math.floor(pz / CHUNK_SIZE);

    const neededKeys = new Set<string>();

    for (let dx = -currentRadiusChunks; dx <= currentRadiusChunks; dx++) {
      for (let dz = -currentRadiusChunks; dz <= currentRadiusChunks; dz++) {
        const cx = centerCx + dx;
        const cz = centerCz + dz;

        const dist = getChunkDistance(cx, cz, px, pz);
        const lod = selectLODTier(dist);

        if (lod === -1) continue;

        const key = getChunkKey(cx, cz);
        neededKeys.add(key);

        const existing = this.activeChunks.get(key);
        if (existing) {
          if (existing.lod !== lod) {
            // LOD changed, re-queue
            this.enqueueBuild(key, cx, cz, lod, dist);
          }
        } else {
          // Not loaded, queue for creation
          this.enqueueBuild(key, cx, cz, lod, dist);
        }
      }
    }

    // Free chunks outside visible radius
    for (const [key, chunk] of this.activeChunks.entries()) {
      if (!neededKeys.has(key)) {
        this.releaseMesh(chunk.mesh, chunk.lod);
        this.activeChunks.delete(key);
      }
    }

    // Process AT MOST ONE chunk geometry build per frame to eliminate streaming hitching
    if (this.buildQueue.length > 0) {
      // Sort build queue by distance (closest to player first)
      this.buildQueue.sort((a, b) => a.distance - b.distance);
      const req = this.buildQueue.shift()!;

      // Verify still needed
      const currentDist = getChunkDistance(req.cx, req.cz, px, pz);
      const currentLod = selectLODTier(currentDist);
      if (currentLod === req.lod) {
        this.buildAndMountChunk(req.key, req.cx, req.cz, req.lod);
      }
    }
  }

  private enqueueBuild(key: string, cx: number, cz: number, lod: LODLevel, dist: number): void {
    for (let i = 0; i < this.buildQueue.length; i++) {
      if (this.buildQueue[i].key === key) {
        this.buildQueue[i].lod = lod;
        this.buildQueue[i].distance = dist;
        return;
      }
    }
    this.buildQueue.push({ key, cx, cz, lod, distance: dist });
  }

  private buildAndMountChunk(key: string, cx: number, cz: number, lod: LODLevel): void {
    // If chunk was already active with older LOD, return old mesh
    const old = this.activeChunks.get(key);
    if (old) {
      this.releaseMesh(old.mesh, old.lod);
      this.activeChunks.delete(key);
    }

    const mesh = this.acquireMesh(lod);
    this.populateChunkGeometry(mesh, cx, cz, lod);

    this.scene.add(mesh);
    this.activeChunks.set(key, { key, cx, cz, lod, mesh });
  }

  private populateChunkGeometry(mesh: THREE.Mesh, cx: number, cz: number, lod: LODLevel): void {
    const bounds = getChunkBounds(cx, cz);
    const S = LOD_SEGMENTS[`LOD${lod}` as keyof typeof LOD_SEGMENTS];
    const stride = S + 1;

    const geo = mesh.geometry;
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
    const normAttr = geo.getAttribute('normal') as THREE.BufferAttribute;
    const colAttr = geo.getAttribute('color') as THREE.BufferAttribute;

    const pos = posAttr.array as Float32Array;
    const norm = normAttr.array as Float32Array;
    const col = colAttr.array as Float32Array;

    let vPtr = 0;

    // 1. Fill surface vertices
    for (let row = 0; row <= S; row++) {
      const z = bounds.minZ + (row / S) * CHUNK_SIZE;
      for (let colIdx = 0; colIdx <= S; colIdx++) {
        const x = bounds.minX + (colIdx / S) * CHUNK_SIZE;
        const y = this.worldGen.getHeight(x, z);

        this.worldGen.getNormal(x, z, this.scratchNormal);
        const slope = 1.0 - this.scratchNormal.y;
        const biome = this.worldGen.getBiome(x, z);
        computeVertexColor(x, z, y, slope, biome, this.scratchColor);

        const idx3 = vPtr * 3;
        pos[idx3] = x;
        pos[idx3 + 1] = y;
        pos[idx3 + 2] = z;

        norm[idx3] = this.scratchNormal.x;
        norm[idx3 + 1] = this.scratchNormal.y;
        norm[idx3 + 2] = this.scratchNormal.z;

        col[idx3] = this.scratchColor.r;
        col[idx3 + 1] = this.scratchColor.g;
        col[idx3 + 2] = this.scratchColor.b;

        vPtr++;
      }
    }

    // 2. Fill skirt vertices (extruded 3.5m down)
    const skirtDrop = 3.5;

    const addSkirtVertex = (srcIdx: number, nx: number, nz: number) => {
      const src3 = srcIdx * 3;
      const dst3 = vPtr * 3;

      pos[dst3] = pos[src3];
      pos[dst3 + 1] = pos[src3 + 1] - skirtDrop;
      pos[dst3 + 2] = pos[src3 + 2];

      norm[dst3] = nx;
      norm[dst3 + 1] = 0.0;
      norm[dst3 + 2] = nz;

      col[dst3] = col[src3];
      col[dst3 + 1] = col[src3 + 1];
      col[dst3 + 2] = col[src3 + 2];

      vPtr++;
    };

    // Edge 0: Top edge (row = 0, col = 0..S, normal -Z)
    for (let k = 0; k <= S; k++) {
      addSkirtVertex(k, 0, -1);
    }

    // Edge 1: Right edge (col = S, row = 0..S, normal +X)
    for (let k = 0; k <= S; k++) {
      addSkirtVertex(k * stride + S, 1, 0);
    }

    // Edge 2: Bottom edge (row = S, col = S..0, normal +Z)
    for (let k = 0; k <= S; k++) {
      addSkirtVertex(S * stride + (S - k), 0, 1);
    }

    // Edge 3: Left edge (col = 0, row = S..0, normal -X)
    for (let k = 0; k <= S; k++) {
      addSkirtVertex((S - k) * stride, -1, 0);
    }

    posAttr.needsUpdate = true;
    normAttr.needsUpdate = true;
    colAttr.needsUpdate = true;

    geo.computeBoundingBox();
    geo.computeBoundingSphere();
  }
}
