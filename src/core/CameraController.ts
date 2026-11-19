import * as THREE from 'three';

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  public isFirstPerson = false;

  private yaw = 0;
  private pitch = 0.25; // slight downward angle
  private targetYaw = 0;
  private targetPitch = 0.25;

  private currentTarget = new THREE.Vector3();
  private scratchTarget = new THREE.Vector3();
  private scratchCamPos = new THREE.Vector3();

  // Over-the-shoulder parameters
  private thirdPersonDistance = 4.2;
  private thirdPersonOffset = new THREE.Vector3(0.7, 1.6, 0); // slightly right of right shoulder
  private firstPersonOffset = new THREE.Vector3(0, 1.65, 0);

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 200);
    this.camera.position.set(0, 5, 8);
  }

  public handleDrag(dx: number, dy: number, sensitivity = 0.004): void {
    this.targetYaw -= dx * sensitivity;
    this.targetPitch += dy * sensitivity;

    // Clamp pitch between -70 deg and +75 deg
    const maxPitch = Math.PI / 2.3;
    const minPitch = -Math.PI / 2.5;
    this.targetPitch = Math.max(minPitch, Math.min(maxPitch, this.targetPitch));
  }

  public toggleFirstPerson(): void {
    this.isFirstPerson = !this.isFirstPerson;
  }

  public update(playerPos: THREE.Vector3, dt: number): void {
    // Smooth angle damping
    const damp = Math.min(1.0, dt * 14.0);
    this.yaw += (this.targetYaw - this.yaw) * damp;
    this.pitch += (this.targetPitch - this.pitch) * damp;

    const offset = this.isFirstPerson ? this.firstPersonOffset : this.thirdPersonOffset;
    const dist = this.isFirstPerson ? 0.05 : this.thirdPersonDistance;

    // Target focus point (player neck / head level)
    this.scratchTarget.copy(playerPos).add(offset);
    this.currentTarget.lerp(this.scratchTarget, damp);

    // Spherical position based on yaw and pitch
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);
    const cosYaw = Math.cos(this.yaw);
    const sinYaw = Math.sin(this.yaw);

    // In third-person, offset camera to right shoulder
    let shoulderRightX = 0;
    let shoulderRightZ = 0;
    if (!this.isFirstPerson) {
      // Right vector perpendicular to yaw
      shoulderRightX = Math.cos(this.yaw) * 0.6;
      shoulderRightZ = -Math.sin(this.yaw) * 0.6;
    }

    const camX = this.currentTarget.x + sinYaw * cosPitch * dist + shoulderRightX;
    const camY = this.currentTarget.y + sinPitch * dist;
    const camZ = this.currentTarget.z + cosYaw * cosPitch * dist + shoulderRightZ;

    this.scratchCamPos.set(camX, camY, camZ);
    this.camera.position.lerp(this.scratchCamPos, damp);

    // Look at target
    this.camera.lookAt(this.currentTarget);
  }

  public getForwardVector(out = new THREE.Vector3()): THREE.Vector3 {
    this.camera.getWorldDirection(out);
    out.y = 0;
    out.normalize();
    return out;
  }

  public getRightVector(out = new THREE.Vector3()): THREE.Vector3 {
    this.getForwardVector(out);
    const x = out.x;
    out.x = -out.z;
    out.z = x;
    return out;
  }

  public getYaw(): number {
    return this.yaw;
  }
}
