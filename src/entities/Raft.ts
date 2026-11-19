import * as THREE from 'three';
import { AssetRegistry } from './AssetRegistry';
import { getWaveHeight } from '../world/Water';
import { RAFT_CONSTANTS } from '../data/constants';

export class Raft {
  public object: THREE.Group;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public rotationY = 0;
  public isPlayerBoarded = false;

  private barrelOffsets: [number, number][] = [
    [-1.0, -1.0],
    [1.0, -1.0],
    [-1.0, 1.0],
    [1.0, 1.0],
  ];

  constructor(startPos: THREE.Vector3, scene: THREE.Scene) {
    this.position = startPos.clone();
    this.object = AssetRegistry.get().createRaft();
    this.object.position.copy(this.position);
    scene.add(this.object);
  }

  public update(dt: number, timeSec: number, waterLevel: number, steerInput: { moveX: number; moveZ: number }): void {
    // Sample water surface height at 4 barrels
    let avgSurfaceH = 0;
    const h: number[] = [];

    for (let i = 0; i < 4; i++) {
      const [ox, oz] = this.barrelOffsets[i];
      // World position of barrel
      const cos = Math.cos(this.rotationY);
      const sin = Math.sin(this.rotationY);
      const bx = this.position.x + (ox * cos + oz * sin);
      const bz = this.position.z + (-ox * sin + oz * cos);

      const waveH = waterLevel + getWaveHeight(bx, bz, timeSec);
      h.push(waveH);
      avgSurfaceH += waveH;
    }
    avgSurfaceH /= 4.0;

    // Smooth buoyancy displacement
    this.position.y += (avgSurfaceH - this.position.y) * Math.min(1.0, dt * 6.0);

    // Roll and Pitch from barrel height differences
    const roll = (h[1] - h[0] + h[3] - h[2]) * 0.12;
    const pitch = (h[2] - h[0] + h[3] - h[1]) * 0.12;
    this.object.rotation.z = roll;
    this.object.rotation.x = pitch;

    // Sail steering if boarded
    if (this.isPlayerBoarded) {
      this.rotationY -= steerInput.moveX * RAFT_CONSTANTS.TURN_SPEED_RAD * dt;

      if (steerInput.moveZ < -0.1) {
        // Forward sail impulse
        const forwardX = -Math.sin(this.rotationY);
        const forwardZ = -Math.cos(this.rotationY);
        this.velocity.x += forwardX * RAFT_CONSTANTS.MAX_SAIL_SPEED * dt;
        this.velocity.z += forwardZ * RAFT_CONSTANTS.MAX_SAIL_SPEED * dt;
      }
    }

    // Velocity damping
    this.velocity.multiplyScalar(RAFT_CONSTANTS.DAMPING);
    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;

    this.object.position.copy(this.position);
    this.object.rotation.y = this.rotationY;
  }
}
