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
  private scratchLookDir = new THREE.Vector3();
  private scratchForward = new THREE.Vector3();
  private scratchRight = new THREE.Vector3();

  // Over-the-shoulder parameters
  private thirdPersonDistance = 4.2;
  private thirdPersonOffset = new THREE.Vector3(0, 1.6, 0); // vertical eye level, shoulder offset applied via yaw
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

    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);
    const cosYaw = Math.cos(this.yaw);
    const sinYaw = Math.sin(this.yaw);

    if (this.isFirstPerson) {
      // First person: place camera at head, look outward along (-sinYaw*cosPitch, -sinPitch, -cosYaw*cosPitch)
      this.scratchCamPos.copy(playerPos).add(this.firstPersonOffset);
      this.camera.position.lerp(this.scratchCamPos, damp);

      this.scratchLookDir.set(-sinYaw * cosPitch, -sinPitch, -cosYaw * cosPitch);
      this.scratchTarget.copy(this.camera.position).add(this.scratchLookDir);
      this.camera.lookAt(this.scratchTarget);
    } else {
      // Third person: over-the-shoulder offset rotated by yaw
      this.scratchTarget.copy(playerPos).add(this.thirdPersonOffset);
      this.currentTarget.lerp(this.scratchTarget, damp);

      const shoulderRightX = Math.cos(this.yaw) * 0.6;
      const shoulderRightZ = -Math.sin(this.yaw) * 0.6;

      const camX = this.currentTarget.x + sinYaw * cosPitch * this.thirdPersonDistance + shoulderRightX;
      const camY = this.currentTarget.y + sinPitch * this.thirdPersonDistance;
      const camZ = this.currentTarget.z + cosYaw * cosPitch * this.thirdPersonDistance + shoulderRightZ;

      this.scratchCamPos.set(camX, camY, camZ);
      this.camera.position.lerp(this.scratchCamPos, damp);

      this.camera.lookAt(this.currentTarget);
    }
  }

  public getForwardVector(out?: THREE.Vector3): THREE.Vector3 {
    const target = out || this.scratchForward;
    this.camera.getWorldDirection(target);
    target.y = 0;
    target.normalize();
    return target;
  }

  public getRightVector(out?: THREE.Vector3): THREE.Vector3 {
    const target = out || this.scratchRight;
    this.getForwardVector(target);
    const x = target.x;
    target.x = -target.z;
    target.z = x;
    return target;
  }

  public getYaw(): number {
    return this.yaw;
  }
}
