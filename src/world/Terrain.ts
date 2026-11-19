import * as THREE from 'three';
import { SimplexNoise } from './Noise';
import { PALETTE_COLORS } from '../data/palette';
import { TIDE_CONSTANTS } from '../data/constants';

export class Terrain {
  public mesh: THREE.Mesh;
  public geometry: THREE.PlaneGeometry;
  private noise: SimplexNoise;
  private islandRadius = 75.0; // Island spans ~150m diameter
  private size = 200.0;
  private segments = 120; // 120x120 grid = ~14.4k quads / 28.8k tris (well under 150k budget)

  constructor(scene: THREE.Scene, seed = 42) {
    this.noise = new SimplexNoise(seed);

    this.geometry = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
    this.geometry.rotateX(-Math.PI / 2);

    this.generateTerrainGeometry();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.05,
      flatShading: true, // Stylized low-poly aesthetic
    });

    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = false;
    scene.add(this.mesh);
  }

  // Pure analytical function for exact height at any (x, z)
  public getHeight(x: number, z: number): number {
    const dist = Math.sqrt(x * x + z * z);
    const normDist = dist / this.islandRadius;

    // Outer ocean floor
    if (normDist >= 1.3) {
      return -8.0;
    }

    // Radial island base profile
    // Center elevation peak ~14m, high-tide line at 4.5m, ocean shelf at -5m
    const baseHeight = (1.0 - Math.pow(Math.min(normDist, 1.2), 1.6)) * 18.0 - 5.5;

    // Multi-scale procedural detail
    const detail1 = this.noise.fbm2D(x * 0.02, z * 0.02, 3, 2.0, 0.5) * 5.0;
    const detail2 = this.noise.noise2D(x * 0.08, z * 0.08) * 1.5;

    // Rock outcrops around perimeter
    const rockNoise = Math.max(0, this.noise.noise2D(x * 0.05 + 10, z * 0.05 + 10)) * 3.5;

    return baseHeight + detail1 + detail2 + rockNoise;
  }

  public getNormal(x: number, z: number, out = new THREE.Vector3()): THREE.Vector3 {
    const eps = 0.5;
    const hL = this.getHeight(x - eps, z);
    const hR = this.getHeight(x + eps, z);
    const hD = this.getHeight(x, z - eps);
    const hU = this.getHeight(x, z + eps);

    out.set(hL - hR, 2.0 * eps, hD - hU).normalize();
    return out;
  }

  private generateTerrainGeometry(): void {
    const posAttr = this.geometry.attributes.position;
    const count = posAttr.count;

    const colors = new Float32Array(count * 3);
    const normal = new THREE.Vector3();

    const cWetSilt = PALETTE_COLORS.WetSilt;
    const cSand = PALETTE_COLORS.SunBleachedSand;
    const cRock = PALETTE_COLORS.WeatheredSlate;
    const cPalm = PALETTE_COLORS.PalmLeafGreen;
    const cJungle = PALETTE_COLORS.DeepJungle;

    const highTideLine = TIDE_CONSTANTS.WATER_LEVEL_HIGH; // 4.5m

    for (let i = 0; i < count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);

      const y = this.getHeight(x, z);
      posAttr.setY(i, y);

      this.getNormal(x, z, normal);
      const slope = 1.0 - normal.y; // 0 is flat horizontal, 1 is vertical cliff

      // Color selection per docs/PALETTE.md:
      // Wet Silt: below high-tide line (exposed seabed)
      // Sun-Bleached Sand: above high-tide line dry beach
      // Weathered Slate: steep cliffs and boulders
      // Palm Leaf Green & Deep Jungle: lush foliage on flat interior
      let r = cSand.r;
      let g = cSand.g;
      let b = cSand.b;

      if (y < highTideLine + 0.3) {
        // Wet silt zone below or near water mark
        const t = Math.max(0, Math.min(1, (highTideLine + 0.3 - y) / 2.0));
        r = THREE.MathUtils.lerp(cSand.r, cWetSilt.r, t);
        g = THREE.MathUtils.lerp(cSand.g, cWetSilt.g, t);
        b = THREE.MathUtils.lerp(cSand.b, cWetSilt.b, t);
      } else if (slope > 0.42) {
        // Steep slope = Weathered Slate rock
        r = cRock.r;
        g = cRock.g;
        b = cRock.b;
      } else if (y > 9.5) {
        // High interior = Deep Jungle
        r = cJungle.r;
        g = cJungle.g;
        b = cJungle.b;
      } else if (y > 6.0) {
        // Plateau = Palm Leaf Green
        r = cPalm.r;
        g = cPalm.g;
        b = cPalm.b;
      }

      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.computeVertexNormals();
    posAttr.needsUpdate = true;
  }
}
