import * as THREE from 'three';
import { WorldGen } from './WorldGen';
import { TerrainChunks } from './TerrainChunks';

export class Terrain {
  public scene: THREE.Scene;
  public worldGen: WorldGen;
  public chunks: TerrainChunks;
  public mesh: THREE.Group;

  constructor(scene: THREE.Scene, worldGen?: WorldGen) {
    this.scene = scene;
    this.worldGen = worldGen ?? WorldGen.get();
    this.mesh = new THREE.Group();
    this.scene.add(this.mesh);

    this.chunks = new TerrainChunks(scene, this.worldGen);
  }

  public getHeight(x: number, z: number): number {
    return this.worldGen.getHeight(x, z);
  }

  public getNormal(x: number, z: number, out = new THREE.Vector3()): THREE.Vector3 {
    const n = this.worldGen.getNormal(x, z);
    out.set(n.x, n.y, n.z);
    return out;
  }

  public update(playerPos: THREE.Vector3): void {
    this.chunks.update(playerPos);
  }
}
