import * as THREE from 'three';
import { AssetRegistry } from '../entities/AssetRegistry';
import { PALETTE_COLORS } from '../data/palette';

export interface LandmarkDef {
  id: string;
  name: string;
  position: [number, number, number];
  type: 'radio_tower' | 'harbour_crane' | 'wrecked_tanker' | 'oil_rig';
}

export const WORLD_LANDMARKS: LandmarkDef[] = [
  {
    id: 'radio_tower_central',
    name: 'Radio Broadcast Tower',
    position: [0, 18.0, 0],
    type: 'radio_tower',
  },
  {
    id: 'harbour_crane_alpha',
    name: 'Harbour Crane Alpha',
    position: [620, 7.5, -580],
    type: 'harbour_crane',
  },
  {
    id: 'harbour_crane_beta',
    name: 'Harbour Crane Beta',
    position: [670, 7.5, -620],
    type: 'harbour_crane',
  },
  {
    id: 'wrecked_tanker_hull',
    name: 'Wrecked Tanker',
    position: [780, 2.0, -500],
    type: 'wrecked_tanker',
  },
  {
    id: 'oil_rig_platform_alpha',
    name: 'Offshore Rig Alpha',
    position: [-900, 8.0, -1000],
    type: 'oil_rig',
  },
  {
    id: 'oil_rig_platform_beta',
    name: 'Offshore Rig Beta',
    position: [450, 8.0, -1150],
    type: 'oil_rig',
  },
];

export class LandmarkManager {
  public group: THREE.Group;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.spawnLandmarks();
  }

  private spawnLandmarks(): void {
    const assetReg = AssetRegistry.get();

    for (let i = 0; i < WORLD_LANDMARKS.length; i++) {
      const lm = WORLD_LANDMARKS[i];
      const mesh = this.createLandmarkMesh(lm, assetReg);
      mesh.position.set(lm.position[0], lm.position[1], lm.position[2]);
      this.group.add(mesh);
    }
  }

  private createLandmarkMesh(lm: LandmarkDef, assetReg: AssetRegistry): THREE.Object3D {
    const root = new THREE.Group();

    if (lm.type === 'radio_tower') {
      // Procedural tall radio lattice mast
      const mastMat = new THREE.MeshLambertMaterial({
        color: PALETTE_COLORS.WarningYellow,
      });
      const mastGeo = new THREE.CylinderGeometry(0.6, 2.8, 32.0, 6);
      const mast = new THREE.Mesh(mastGeo, mastMat);
      mast.position.y = 16.0;
      root.add(mast);

      // Warning beacon light on top
      const beaconGeo = new THREE.SphereGeometry(0.8, 6, 6);
      const beaconMat = new THREE.MeshLambertMaterial({
        color: PALETTE_COLORS.SignalCrimson,
      });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.y = 32.5;
      root.add(beacon);
    } else if (lm.type === 'harbour_crane') {
      // Tall gantry crane
      const craneMat = new THREE.MeshLambertMaterial({
        color: PALETTE_COLORS.WarningYellow,
      });
      const tower = new THREE.Mesh(new THREE.BoxGeometry(2.5, 18.0, 2.5), craneMat);
      tower.position.y = 9.0;
      root.add(tower);

      const boom = new THREE.Mesh(new THREE.BoxGeometry(22.0, 1.8, 1.8), craneMat);
      boom.position.set(6.0, 18.0, 0);
      root.add(boom);
    } else if (lm.type === 'wrecked_tanker') {
      // Huge rusted hull tilted in water
      const hullMat = new THREE.MeshLambertMaterial({
        color: PALETTE_COLORS.OxidisedRust,
      });
      const hull = new THREE.Mesh(new THREE.BoxGeometry(45.0, 12.0, 16.0), hullMat);
      hull.position.y = 4.0;
      hull.rotation.z = 0.12;
      hull.rotation.y = 0.45;
      root.add(hull);

      // Add containers on deck
      const redContainer = assetReg.createShippingContainer(false);
      redContainer.position.set(5, 10.5, 0);
      root.add(redContainer);
    } else if (lm.type === 'oil_rig') {
      // Heavy oil platform on deep ocean pylons
      const steelMat = new THREE.MeshLambertMaterial({
        color: PALETTE_COLORS.GunmetalGrey,
      });
      const rustMat = new THREE.MeshLambertMaterial({
        color: PALETTE_COLORS.OxidisedRust,
      });

      // 4 deep pylons
      const pylonGeo = new THREE.CylinderGeometry(1.5, 1.5, 28.0, 8);
      const offsets = [
        [-12, -12],
        [12, -12],
        [-12, 12],
        [12, 12],
      ];
      for (const [ox, oz] of offsets) {
        const pylon = new THREE.Mesh(pylonGeo, rustMat);
        pylon.position.set(ox, -2.0, oz);
        root.add(pylon);
      }

      // Main elevated deck platform
      const deck = new THREE.Mesh(new THREE.BoxGeometry(32.0, 2.5, 32.0), steelMat);
      deck.position.y = 12.0;
      root.add(deck);

      // Derrick tower
      const derrickMat = new THREE.MeshLambertMaterial({
        color: PALETTE_COLORS.WarningYellow,
      });
      const derrick = new THREE.Mesh(new THREE.ConeGeometry(4.0, 16.0, 4), derrickMat);
      derrick.position.set(0, 21.0, 0);
      root.add(derrick);
    }

    return root;
  }
}
