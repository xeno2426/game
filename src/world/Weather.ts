import * as THREE from 'three';
import { PALETTE_COLORS } from '../data/palette';

export class Weather {
  private particles: THREE.Points;
  private material: THREE.ShaderMaterial;
  private count = 1200; // Lightweight pool for mobile budget
  private time = 0;

  constructor(scene: THREE.Scene) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.count * 3);
    const speeds = new Float32Array(this.count);

    const boxWidth = 40.0;
    const boxHeight = 25.0;
    const boxDepth = 40.0;

    for (let i = 0; i < this.count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * boxWidth;
      positions[i * 3 + 1] = Math.random() * boxHeight;
      positions[i * 3 + 2] = (Math.random() - 0.5) * boxDepth;
      speeds[i] = 16.0 + Math.random() * 8.0;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0.0 },
        uStormIntensity: { value: 0.0 },
        uPlayerPos: { value: new THREE.Vector3() },
        uBoxSize: { value: new THREE.Vector3(boxWidth, boxHeight, boxDepth) },
        uColor: { value: new THREE.Color(PALETTE_COLORS.SeafoamWhite) },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uStormIntensity;
        uniform vec3 uPlayerPos;
        uniform vec3 uBoxSize;
        attribute float aSpeed;

        varying float vAlpha;

        void main() {
          if (uStormIntensity <= 0.02) {
            gl_Position = vec4(2.0, 2.0, 2.0, 0.0);
            return;
          }

          // Fall down with individual speed and time
          float fallDist = aSpeed * uTime;
          // Slanted wind drift along X
          float driftX = 4.0 * uStormIntensity * uTime;

          // Wrap around box bounds
          float y = mod(position.y - fallDist, uBoxSize.y);
          float x = mod(position.x + driftX + uBoxSize.x * 0.5, uBoxSize.x) - uBoxSize.x * 0.5;
          float z = position.z;

          vec3 worldPos = vec3(x, y, z) + uPlayerPos;
          vAlpha = clamp(uStormIntensity * 0.65, 0.0, 0.65);

          vec4 mvPosition = modelViewMatrix * vec4(worldPos, 1.0);
          gl_PointSize = clamp(25.0 / -mvPosition.z, 1.0, 4.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;

        void main() {
          if (vAlpha <= 0.01) discard;
          gl_FragColor = vec4(uColor, vAlpha);
        }
      `,
    });

    this.particles = new THREE.Points(geo, this.material);
    this.particles.frustumCulled = false;
    scene.add(this.particles);
  }

  public update(dt: number, stormIntensity: number, playerPos: THREE.Vector3): void {
    this.time += dt;
    this.material.uniforms.uTime.value = this.time;
    this.material.uniforms.uStormIntensity.value = stormIntensity;
    this.material.uniforms.uPlayerPos.value.set(playerPos.x, 0, playerPos.z);
  }
}
