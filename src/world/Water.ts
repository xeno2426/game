import * as THREE from 'three';
import { PALETTE_COLORS } from '../data/palette';
import { TIDE_CONSTANTS } from '../data/constants';
import { HALF_WORLD, MAP_RES, WORLD_SIZE } from '../logic/worldLogic';
import type { WorldGen } from './WorldGen';

// Shared mathematical wave formula used by both CPU and GLSL vertex shader
export function getWaveHeight(x: number, z: number, time: number): number {
  const w1 = Math.sin(x * 0.18 + time * 1.5) * Math.cos(z * 0.18 + time * 1.1) * 0.35;
  const w2 = Math.sin((x + z) * 0.28 + time * 1.8) * 0.15;
  return w1 + w2;
}

export function createHeightDataTexture(heightmap: Float32Array): THREE.DataTexture {
  const width = MAP_RES;
  const height = MAP_RES;
  const data = new Uint8Array(width * height * 4);

  // Height range: -35.0 to 35.0 (span 70.0)
  for (let i = 0; i < width * height; i++) {
    const h = heightmap[i];
    const norm = Math.max(0.0, Math.min(1.0, (h + 35.0) / 70.0));
    const val16 = Math.floor(norm * 65535.0);
    const r = Math.floor(val16 / 256.0);
    const g = val16 % 256;

    const idx4 = i * 4;
    data[idx4] = r;
    data[idx4 + 1] = g;
    data[idx4 + 2] = 0;
    data[idx4 + 3] = 255;
  }

  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

export class Water {
  public mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private size = 260.0;
  private segments = 90; // ~8.1k quads = 16.2k tris

  constructor(scene: THREE.Scene, worldGen?: WorldGen) {
    const geometry = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
    geometry.rotateX(-Math.PI / 2);

    const cShallow = PALETTE_COLORS.TropicalTeal;
    const cDeep = PALETTE_COLORS.AbyssalNavy;
    const cFoam = PALETTE_COLORS.SeafoamWhite;

    let heightTexture: THREE.DataTexture;
    if (worldGen && worldGen.heightmap) {
      heightTexture = createHeightDataTexture(worldGen.heightmap);
    } else {
      // Dummy 2x2 texture fallback for test environment
      const dummy = new Uint8Array(2 * 2 * 4);
      heightTexture = new THREE.DataTexture(dummy, 2, 2, THREE.RGBAFormat);
      heightTexture.needsUpdate = true;
    }

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uWaterLevel: { value: TIDE_CONSTANTS.WATER_LEVEL_LOW },
        uColorShallow: { value: new THREE.Color(cShallow) },
        uColorDeep: { value: new THREE.Color(cDeep) },
        uColorFoam: { value: new THREE.Color(cFoam) },
        uHeightTexture: { value: heightTexture },
        uWorldBounds: { value: new THREE.Vector2(WORLD_SIZE, HALF_WORLD) },
        uHeightRange: { value: new THREE.Vector2(-35.0, 70.0) },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uWaterLevel;

        varying vec3 vWorldPos;
        varying float vWave;

        float computeWave(float x, float z, float t) {
          float w1 = sin(x * 0.18 + t * 1.5) * cos(z * 0.18 + t * 1.1) * 0.35;
          float w2 = sin((x + z) * 0.28 + t * 1.8) * 0.15;
          return w1 + w2;
        }

        void main() {
          // Compute world position before displacement
          vec4 worldPos = modelMatrix * vec4(position.x, uWaterLevel, position.z, 1.0);

          // Waves depend on invariant world coordinates, eliminating sliding during grid snapping (B6)
          float wave = computeWave(worldPos.x, worldPos.z, uTime);
          worldPos.y += wave;
          vWave = wave;
          vWorldPos = worldPos.xyz;

          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColorShallow;
        uniform vec3 uColorDeep;
        uniform vec3 uColorFoam;
        uniform float uWaterLevel;
        uniform sampler2D uHeightTexture;
        uniform vec2 uWorldBounds;
        uniform vec2 uHeightRange;

        varying vec3 vWorldPos;
        varying float vWave;

        void main() {
          // Sample depth dynamically from baked heightmap texture
          vec2 uv = (vWorldPos.xz + uWorldBounds.y) / uWorldBounds.x;
          vec4 samp = texture2D(uHeightTexture, uv);
          float normH = samp.r + (samp.g / 255.0);
          float terrainH = normH * uHeightRange.y + uHeightRange.x;

          float depth = max(0.0, vWorldPos.y - terrainH);

          // Deep/shallow gradient: Tropical Teal in shallows -> Abyssal Navy in deep ocean
          float depthFactor = clamp(depth / 3.5, 0.0, 1.0);
          vec3 waterCol = mix(uColorShallow, uColorDeep, depthFactor);

          // Seafoam White foam near shoreline (depth < 0.45) or wave crests (vWave > 0.3)
          float foamShore = 1.0 - smoothstep(0.0, 0.45, depth);
          float foamCrest = smoothstep(0.28, 0.45, vWave);
          float foamAmount = clamp(foamShore + foamCrest * 0.6, 0.0, 1.0);

          vec3 finalColor = mix(waterCol, uColorFoam, foamAmount);
          float alpha = clamp(0.78 + depthFactor * 0.18 + foamAmount * 0.2, 0.7, 0.96);

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.y = 0;
    scene.add(this.mesh);
  }

  public setHeightmap(heightmap: Float32Array): void {
    const tex = createHeightDataTexture(heightmap);
    this.material.uniforms.uHeightTexture.value = tex;
  }

  public update(timeSec: number, waterLevel: number, playerPos?: THREE.Vector3): void {
    this.material.uniforms.uTime.value = timeSec;
    this.material.uniforms.uWaterLevel.value = waterLevel;
    if (playerPos) {
      // Snap water mesh to its grid so vertices align and edges never appear (B6)
      const gridSize = this.size / this.segments;
      this.mesh.position.x = Math.floor(playerPos.x / gridSize) * gridSize;
      this.mesh.position.z = Math.floor(playerPos.z / gridSize) * gridSize;
    }
    this.mesh.position.y = 0;
  }

  // Sample water surface height (waterLevel + wave displacement) at world (x, z)
  public getSurfaceHeight(x: number, z: number, timeSec: number, waterLevel: number): number {
    return waterLevel + getWaveHeight(x, z, timeSec);
  }
}
