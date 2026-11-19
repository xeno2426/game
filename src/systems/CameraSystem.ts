import * as THREE from 'three';

export class CameraSystem {
  public camera: THREE.PerspectiveCamera;
  private target = new THREE.Vector3(0, 0, 0);

  // Camera offset relative to player
  private readonly offset = new THREE.Vector3(0, 24, 15);
  private currentPos = new THREE.Vector3(0, 24, 15);

  // Trauma-based screen shake (0 to 1)
  private trauma = 0;
  private traumaDecay = 1.8;
  private maxShakeOffset = 0.8;
  private shakeTime = 0;

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(52, aspect, 0.1, 1000);
    this.camera.position.copy(this.offset);
    this.camera.lookAt(0, 0, 0);
  }

  public resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  public addTrauma(amount: number) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  public update(dt: number, playerPos: THREE.Vector3) {
    this.shakeTime += dt * 35;

    // Decay trauma
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - this.traumaDecay * dt);
    }

    // Smoothly follow player
    const followSpeed = 0.12;
    this.target.x = THREE.MathUtils.lerp(this.target.x, playerPos.x, followSpeed);
    this.target.z = THREE.MathUtils.lerp(this.target.z, playerPos.z, followSpeed);

    this.currentPos.x = this.target.x + this.offset.x;
    this.currentPos.y = this.offset.y;
    this.currentPos.z = this.target.z + this.offset.z;

    // Calculate non-linear screen shake (shake = trauma^2)
    const shake = this.trauma * this.trauma;
    if (shake > 0.001) {
      const offsetX = Math.sin(this.shakeTime * 1.3) * this.maxShakeOffset * shake;
      const offsetZ = Math.cos(this.shakeTime * 1.7) * this.maxShakeOffset * shake;
      const offsetY = Math.sin(this.shakeTime * 2.1) * (this.maxShakeOffset * 0.4) * shake;

      this.camera.position.set(
        this.currentPos.x + offsetX,
        this.currentPos.y + offsetY,
        this.currentPos.z + offsetZ
      );
    } else {
      this.camera.position.copy(this.currentPos);
    }

    this.camera.lookAt(this.target.x, 0, this.target.z);
  }
}
