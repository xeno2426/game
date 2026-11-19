import * as THREE from 'three';
import { PALETTE_COLORS } from '../data/palette';

export class Weather {
  private particles: THREE.Points;
  private count = 1200; // Lightweight pool for mobile budget
  private positions: Float32Array;
  private velocities: Float32Array;
  private boxSize = 40.0;

  constructor(scene: THREE.Scene) {
    const geo = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.count * 3);
    this.velocities = new Float32Array(this.count);

    for (let i = 0; i < this.count; i++) {
      this.positions[i * 3] = (Math.random() - 0.5) * this.boxSize;
      this.positions[i * 3 + 1] = Math.random() * 25.0;
      this.positions[i * 3 + 2] = (Math.random() - 0.5) * this.boxSize;
      this.velocities[i] = 16.0 + Math.random() * 8.0;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    const mat = new THREE.PointsMaterial({
      color: PALETTE_COLORS.SeafoamWhite,
      size: 0.15,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });

    this.particles = new THREE.Points(geo, mat);
    scene.add(this.particles);
  }

  public update(dt: number, stormIntensity: number, playerPos: THREE.Vector3): void {
    const mat = this.particles.material as THREE.PointsMaterial;
    mat.opacity = THREE.MathUtils.lerp(0.0, 0.65, stormIntensity);

    if (stormIntensity <= 0.05) return;

    // Follow player center
    this.particles.position.set(playerPos.x, 0, playerPos.z);

    const posAttr = this.particles.geometry.attributes.position as THREE.BufferAttribute;
    const pos = posAttr.array as Float32Array;

    for (let i = 0; i < this.count; i++) {
      pos[i * 3 + 1] -= this.velocities[i] * dt;
      // Slanted wind drift
      pos[i * 3] += 4.0 * stormIntensity * dt;

      // Wrap around bounds
      if (pos[i * 3 + 1] < 0) {
        pos[i * 3 + 1] = 22.0 + Math.random() * 3.0;
        pos[i * 3] = (Math.random() - 0.5) * this.boxSize;
        pos[i * 3 + 2] = (Math.random() - 0.5) * this.boxSize;
      }
    }

    posAttr.needsUpdate = true;
  }
}
