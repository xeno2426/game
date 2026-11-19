import * as THREE from 'three';
import { TIDE_CONSTANTS, BUDGET_CONSTANTS } from '../data/constants';
import { PALETTE_COLORS } from '../data/palette';
import { computeTideState, type TideState } from '../logic/tideLogic';

export class TideSystem {
  public timeInCycle = 0;
  public state: TideState;
  public timescale = 1.0;

  private scene: THREE.Scene;
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private fog: THREE.Fog;

  private colorSkyClear = PALETTE_COLORS.CoastalMist;
  private colorSkyStorm = PALETTE_COLORS.StormSlate;
  private colorGroundClear = PALETTE_COLORS.SunBleachedSand;
  private colorGroundStorm = PALETTE_COLORS.AbyssalNavy;

  constructor(
    scene: THREE.Scene,
    dirLight: THREE.DirectionalLight,
    hemiLight: THREE.HemisphereLight,
    timescale = 1.0
  ) {
    this.scene = scene;
    this.dirLight = dirLight;
    this.hemiLight = hemiLight;
    this.timescale = timescale;

    this.fog = new THREE.Fog(
      this.colorSkyClear,
      BUDGET_CONSTANTS.CLEAR_FOG_NEAR,
      BUDGET_CONSTANTS.CLEAR_FOG_FAR
    );
    this.scene.fog = this.fog;
    this.scene.background = new THREE.Color(this.colorSkyClear);

    this.state = computeTideState(0);
  }

  public update(dt: number): TideState {
    this.timeInCycle = (this.timeInCycle + dt * this.timescale) % TIDE_CONSTANTS.CYCLE_DURATION_SEC;
    this.state = computeTideState(this.timeInCycle);

    // Weather and lighting interpolation based on storm intensity (0 to 1)
    const t = this.state.stormIntensity;

    // Sky & fog color lerp
    const skyR = THREE.MathUtils.lerp(this.colorSkyClear.r, this.colorSkyStorm.r, t);
    const skyG = THREE.MathUtils.lerp(this.colorSkyClear.g, this.colorSkyStorm.g, t);
    const skyB = THREE.MathUtils.lerp(this.colorSkyClear.b, this.colorSkyStorm.b, t);

    this.fog.color.setRGB(skyR, skyG, skyB);
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.setRGB(skyR, skyG, skyB);
    }

    // Pull fog far-clip plane in during storm (mask distant islands)
    this.fog.near = THREE.MathUtils.lerp(BUDGET_CONSTANTS.CLEAR_FOG_NEAR, BUDGET_CONSTANTS.STORM_FOG_NEAR, t);
    this.fog.far = THREE.MathUtils.lerp(BUDGET_CONSTANTS.CLEAR_FOG_FAR, BUDGET_CONSTANTS.STORM_FOG_FAR, t);

    // Directional light intensity (dims during storm)
    this.dirLight.intensity = THREE.MathUtils.lerp(1.2, 0.35, t);

    // Hemisphere light ground tint lerp
    const groundR = THREE.MathUtils.lerp(this.colorGroundClear.r, this.colorGroundStorm.r, t);
    const groundG = THREE.MathUtils.lerp(this.colorGroundClear.g, this.colorGroundStorm.g, t);
    const groundB = THREE.MathUtils.lerp(this.colorGroundClear.b, this.colorGroundStorm.b, t);
    this.hemiLight.color.setRGB(skyR, skyG, skyB);
    this.hemiLight.groundColor.setRGB(groundR, groundG, groundB);
    this.hemiLight.intensity = THREE.MathUtils.lerp(0.8, 0.4, t);

    return this.state;
  }

  public getTimeRemainingInPhase(): number {
    if (this.state.phase === 'low') {
      return TIDE_CONSTANTS.WARNING_START_SEC - this.timeInCycle;
    } else if (this.state.phase === 'warning') {
      return TIDE_CONSTANTS.LOW_TIDE_DURATION_SEC - this.timeInCycle;
    } else {
      return TIDE_CONSTANTS.CYCLE_DURATION_SEC - this.timeInCycle;
    }
  }
}
