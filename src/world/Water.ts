import * as THREE from 'three';
import { PALETTE_COLORS } from '../data/palette';
import { TIDE_CONSTANTS } from '../data/constants';

// Shared mathematical wave formula used by both CPU and GLSL vertex shader
export function getWaveHeight(x: number, z: number, time: number): number {
  const w1 = Math.sin(x * 0.18 + time * 1.5) * Math.cos(z * 0.18 + time * 1.1) * 0.35;
  const w2 = Math.sin((x + z) * 0.28 + time * 1.8) * 0.15;
  return w1 + w2;
}

export class Water {
  public mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private size = 260.0;
  private segments = 90; // ~8.1k quads = 16.2k tris

  constructor(scene: THREE.Scene) {
    const geometry = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
    geometry.rotateX(-Math.PI / 2);

    const cShallow = PALETTE_COLORS.TropicalTeal;
    const cDeep = PALETTE_COLORS.AbyssalNavy;
    const cFoam = PALETTE_COLORS.SeafoamWhite;

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uWaterLevel: { value: TIDE_CONSTANTS.WATER_LEVEL_LOW },
        uColorShallow: { value: new THREE.Color(cShallow) },
        uColorDeep: { value: new THREE.Color(cDeep) },
        uColorFoam: { value: new THREE.Color(cFoam) },
        uIslandRadius: { value: 75.0 },
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
        uniform float uIslandRadius;

        varying vec3 vWorldPos;
        varying float vWave;

        void main() {
          // Analytical terrain height from baked island formula
          float dist = length(vWorldPos.xz);
          float normDist = dist / uIslandRadius;
          float terrainH = -8.0;
          if (normDist < 1.3) {
            terrainH = (1.0 - pow(min(normDist, 1.2), 1.6)) * 18.0 - 5.5;
          }

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
