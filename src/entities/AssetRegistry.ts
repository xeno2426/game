import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SWATCH_INDEX, getSwatchUVBounds, getSharedAtlasMaterial, PALETTE_COLORS } from '../data/palette';

export function applySwatchUVs(geometry: THREE.BufferGeometry, swatchIndex: number): THREE.BufferGeometry {
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox || new THREE.Box3();
  const minY = bb.min.y;
  const maxY = bb.max.y;
  const heightSpan = (maxY - minY) || 1.0;

  const bounds = getSwatchUVBounds(swatchIndex);
  const pos = geometry.attributes.position;
  const count = pos.count;
  const uvs = new Float32Array(count * 2);

  for (let i = 0; i < count; i++) {
    const y = pos.getY(i);
    const t = Math.max(0, Math.min(1, (y - minY) / heightSpan));
    const u = bounds.uMin + (bounds.uMax - bounds.uMin) * 0.5;
    const v = bounds.vMin + (bounds.vMax - bounds.vMin) * t;
    uvs[i * 2] = u;
    uvs[i * 2 + 1] = v;
  }

  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  return geometry;
}

export interface PlayerRig {
  root: THREE.Group;
  torso: THREE.Mesh;
  head: THREE.Mesh;
  backpack: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  weaponSocket: THREE.Group;
}

export class AssetRegistry {
  private static instance: AssetRegistry;
  private material: THREE.MeshLambertMaterial;
  private geoCache = new Map<string, THREE.BufferGeometry>();

  private constructor() {
    this.material = getSharedAtlasMaterial();
  }

  public static get(): AssetRegistry {
    if (!AssetRegistry.instance) {
      AssetRegistry.instance = new AssetRegistry();
    }
    return AssetRegistry.instance;
  }

  public getAtlasMaterial(): THREE.MeshLambertMaterial {
    return this.material;
  }

  public getPropGeometry(propType: string): THREE.BufferGeometry {
    switch (propType) {
      case 'palm_tree':
        return this.getCachedGeometry('palm_tree', () => {
          const trunk = applySwatchUVs(new THREE.CylinderGeometry(0.2, 0.35, 6.0, 6), SWATCH_INDEX.AgedTimber);
          trunk.translate(0, 3.0, 0);
          const parts: THREE.BufferGeometry[] = [trunk];
          for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const frond = applySwatchUVs(new THREE.ConeGeometry(0.8, 3.2, 4), SWATCH_INDEX.PalmLeafGreen);
            frond.rotateX(Math.PI / 2.8);
            frond.translate(0, 0, 1.4);
            frond.rotateY(angle);
            frond.translate(0, 5.8, 0);
            parts.push(frond);
          }
          return mergeGeometries(parts, false)!;
        });
      case 'rock':
        return this.getCachedGeometry('rock_1.4', () =>
          applySwatchUVs(new THREE.IcosahedronGeometry(1.4, 0), SWATCH_INDEX.WeatheredSlate)
        );
      case 'plastic_barrel':
        return this.getCachedGeometry('barrel', () =>
          applySwatchUVs(new THREE.CylinderGeometry(0.35, 0.35, 0.9, 8), SWATCH_INDEX.BuoyancyBlue)
        );
      case 'scrap_pile':
        return this.getCachedGeometry('scrap_pile', () => {
          const parts: THREE.BufferGeometry[] = [];
          for (let i = 0; i < 3; i++) {
            const plate = applySwatchUVs(new THREE.BoxGeometry(0.9, 0.15, 0.7), SWATCH_INDEX.OxidisedRust);
            plate.rotateY(i * 0.8);
            plate.translate((i - 1) * 0.3, i * 0.12, (i % 2) * 0.2);
            parts.push(plate);
          }
          return mergeGeometries(parts, false)!;
        });
      case 'grass':
        return this.getCachedGeometry('grass_tuft', () => {
          const blade1 = applySwatchUVs(new THREE.ConeGeometry(0.25, 0.9, 3), SWATCH_INDEX.PalmLeafGreen);
          blade1.translate(0, 0.45, 0);
          const blade2 = applySwatchUVs(new THREE.ConeGeometry(0.2, 0.75, 3), SWATCH_INDEX.PalmLeafGreen);
          blade2.rotateZ(0.25);
          blade2.translate(0.15, 0.38, 0);
          return mergeGeometries([blade1, blade2], false)!;
        });
      case 'shipping_container_red':
        return this.getCachedGeometry('container_red', () =>
          applySwatchUVs(new THREE.BoxGeometry(6.0, 2.6, 2.4), SWATCH_INDEX.IndustrialRed)
        );
      case 'shipping_container_blue':
      case 'sunken_electronics':
        return this.getCachedGeometry('container_blue', () =>
          applySwatchUVs(new THREE.BoxGeometry(6.0, 2.6, 2.4), SWATCH_INDEX.IndustrialBlue)
        );
      default:
        return this.createRock().geometry;
    }
  }

  private getCachedGeometry(key: string, factory: () => THREE.BufferGeometry): THREE.BufferGeometry {
    let geo = this.geoCache.get(key);
    if (!geo) {
      geo = factory();
      this.geoCache.set(key, geo);
    }
    return geo;
  }

  // Survivor Humanoid Rig (limbs cached, joints separate for procedural animation)
  public createPlayerMesh(): PlayerRig {
    const root = new THREE.Group();

    // Torso (Weathered Driftwood vest)
    const torsoGeo = this.getCachedGeometry('player_torso', () =>
      applySwatchUVs(new THREE.BoxGeometry(0.5, 0.65, 0.3), SWATCH_INDEX.WeatheredDriftwood)
    );
    const torso = new THREE.Mesh(torsoGeo, this.material);
    torso.position.y = 1.05;
    torso.castShadow = true;
    root.add(torso);

    // Head (Sun-Bleached Sand skin tone)
    const headGeo = this.getCachedGeometry('player_head', () =>
      applySwatchUVs(new THREE.BoxGeometry(0.28, 0.28, 0.28), SWATCH_INDEX.SunBleachedSand)
    );
    const head = new THREE.Mesh(headGeo, this.material);
    head.position.y = 0.52;
    head.castShadow = true;
    torso.add(head);

    // Modular Backpack (Aged Timber)
    const packGeo = this.getCachedGeometry('player_pack', () =>
      applySwatchUVs(new THREE.BoxGeometry(0.38, 0.45, 0.2), SWATCH_INDEX.AgedTimber)
    );
    const backpack = new THREE.Mesh(packGeo, this.material);
    backpack.position.set(0, 0, -0.22);
    backpack.castShadow = true;
    torso.add(backpack);

    // Left Arm
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.35, 0.25, 0);
    const armGeoL = this.getCachedGeometry('player_arm_l', () => {
      const g = applySwatchUVs(new THREE.BoxGeometry(0.16, 0.6, 0.16), SWATCH_INDEX.AgedTimber);
      g.translate(0, -0.3, 0);
      return g;
    });
    const leftArmMesh = new THREE.Mesh(armGeoL, this.material);
    leftArmMesh.castShadow = true;
    leftArm.add(leftArmMesh);
    torso.add(leftArm);

    // Right Arm with weapon socket
    const rightArm = new THREE.Group();
    rightArm.position.set(0.35, 0.25, 0);
    const armGeoR = this.getCachedGeometry('player_arm_r', () => {
      const g = applySwatchUVs(new THREE.BoxGeometry(0.16, 0.6, 0.16), SWATCH_INDEX.AgedTimber);
      g.translate(0, -0.3, 0);
      return g;
    });
    const rightArmMesh = new THREE.Mesh(armGeoR, this.material);
    rightArmMesh.castShadow = true;
    rightArm.add(rightArmMesh);

    const weaponSocket = new THREE.Group();
    weaponSocket.position.set(0, -0.55, 0.1);
    rightArm.add(weaponSocket);
    torso.add(rightArm);

    // Left Leg
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.16, 0.72, 0);
    const legGeoL = this.getCachedGeometry('player_leg_l', () => {
      const g = applySwatchUVs(new THREE.BoxGeometry(0.18, 0.72, 0.18), SWATCH_INDEX.GunmetalGrey);
      g.translate(0, -0.36, 0);
      return g;
    });
    const leftLegMesh = new THREE.Mesh(legGeoL, this.material);
    leftLegMesh.castShadow = true;
    leftLeg.add(leftLegMesh);
    root.add(leftLeg);

    // Right Leg
    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.16, 0.72, 0);
    const legGeoR = this.getCachedGeometry('player_leg_r', () => {
      const g = applySwatchUVs(new THREE.BoxGeometry(0.18, 0.72, 0.18), SWATCH_INDEX.GunmetalGrey);
      g.translate(0, -0.36, 0);
      return g;
    });
    const rightLegMesh = new THREE.Mesh(legGeoR, this.material);
    rightLegMesh.castShadow = true;
    rightLeg.add(rightLegMesh);
    root.add(rightLeg);

    return {
      root,
      torso,
      head,
      backpack,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      weaponSocket,
    };
  }

  // Weapon: Scrap Axe (merged static geometry)
  public createScrapAxe(): THREE.Group {
    const geo = this.getCachedGeometry('scrap_axe', () => {
      const handle = applySwatchUVs(new THREE.CylinderGeometry(0.025, 0.03, 0.7, 5), SWATCH_INDEX.AgedTimber);
      handle.translate(0, 0.25, 0);
      const blade = applySwatchUVs(new THREE.BoxGeometry(0.2, 0.15, 0.04), SWATCH_INDEX.GunmetalGrey);
      blade.translate(0.08, 0.52, 0);
      return mergeGeometries([handle, blade], false)!;
    });

    const mesh = new THREE.Mesh(geo, this.material);
    mesh.castShadow = true;
    const group = new THREE.Group();
    group.add(mesh);
    return group;
  }

  // Weapon: Slingshot (merged static geometry)
  public createSlingshot(): THREE.Group {
    const geo = this.getCachedGeometry('slingshot', () => {
      const handle = applySwatchUVs(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 5), SWATCH_INDEX.AgedTimber);
      const forkL = applySwatchUVs(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 4), SWATCH_INDEX.AgedTimber);
      forkL.rotateZ(-Math.PI / 6);
      forkL.translate(-0.06, 0.22, 0);
      const forkR = applySwatchUVs(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 4), SWATCH_INDEX.AgedTimber);
      forkR.rotateZ(Math.PI / 6);
      forkR.translate(0.06, 0.22, 0);
      return mergeGeometries([handle, forkL, forkR], false)!;
    });

    const mesh = new THREE.Mesh(geo, this.material);
    mesh.castShadow = true;
    const group = new THREE.Group();
    group.add(mesh);
    return group;
  }

  // Environment: Palm Tree (merged static trunk + 5 fronds)
  public createPalmTree(): THREE.Group {
    const geo = this.getCachedGeometry('palm_tree', () => {
      const trunk = applySwatchUVs(new THREE.CylinderGeometry(0.2, 0.35, 6.0, 6), SWATCH_INDEX.AgedTimber);
      trunk.translate(0, 3.0, 0);

      const parts: THREE.BufferGeometry[] = [trunk];
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const frond = applySwatchUVs(new THREE.ConeGeometry(0.8, 3.2, 4), SWATCH_INDEX.PalmLeafGreen);
        frond.rotateX(Math.PI / 2.8);
        frond.translate(0, 0, 1.4);
        frond.rotateY(angle);
        frond.translate(0, 5.8, 0);
        parts.push(frond);
      }
      return mergeGeometries(parts, false)!;
    });

    const mesh = new THREE.Mesh(geo, this.material);
    mesh.castShadow = true;
    const group = new THREE.Group();
    group.add(mesh);
    return group;
  }

  // Environment: Rock Boulder
  public createRock(radius = 1.4): THREE.Mesh {
    const key = `rock_${radius}`;
    const geo = this.getCachedGeometry(key, () =>
      applySwatchUVs(new THREE.IcosahedronGeometry(radius, 0), SWATCH_INDEX.WeatheredSlate)
    );
    const mesh = new THREE.Mesh(geo, this.material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // Environment: Plastic Barrel (Buoyancy Blue)
  public createPlasticBarrel(): THREE.Mesh {
    const geo = this.getCachedGeometry('barrel', () =>
      applySwatchUVs(new THREE.CylinderGeometry(0.35, 0.35, 0.9, 8), SWATCH_INDEX.BuoyancyBlue)
    );
    const mesh = new THREE.Mesh(geo, this.material);
    mesh.castShadow = true;
    return mesh;
  }

  // Environment: Scrap Pile (merged static plates)
  public createScrapPile(): THREE.Group {
    const geo = this.getCachedGeometry('scrap_pile', () => {
      const parts: THREE.BufferGeometry[] = [];
      for (let i = 0; i < 3; i++) {
        const plate = applySwatchUVs(new THREE.BoxGeometry(0.9, 0.15, 0.7), SWATCH_INDEX.OxidisedRust);
        plate.rotateY(i * 0.8);
        plate.translate((i - 1) * 0.3, i * 0.12, (i % 2) * 0.2);
        parts.push(plate);
      }
      return mergeGeometries(parts, false)!;
    });

    const mesh = new THREE.Mesh(geo, this.material);
    mesh.castShadow = true;
    const group = new THREE.Group();
    group.add(mesh);
    return group;
  }

  // Environment: Sunken Shipping Container
  public createShippingContainer(isBlue = false): THREE.Mesh {
    const key = isBlue ? 'container_blue' : 'container_red';
    const swatch = isBlue ? SWATCH_INDEX.IndustrialBlue : SWATCH_INDEX.IndustrialRed;
    const geo = this.getCachedGeometry(key, () =>
      applySwatchUVs(new THREE.BoxGeometry(6.0, 2.6, 2.4), swatch)
    );
    const mesh = new THREE.Mesh(geo, this.material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // Modular Base: Foundation
  public createFoundationMesh(): THREE.Mesh {
    const geo = this.getCachedGeometry('foundation', () =>
      applySwatchUVs(new THREE.BoxGeometry(3.0, 0.4, 3.0), SWATCH_INDEX.WeatheredDriftwood)
    );
    const mesh = new THREE.Mesh(geo, this.material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // Modular Base: Stilts (3m high, merged static geometry)
  public createStiltsMesh(): THREE.Group {
    const geo = this.getCachedGeometry('stilts', () => {
      const parts: THREE.BufferGeometry[] = [];
      const postCoords = [
        [-1.4, 1.5, -1.4],
        [1.4, 1.5, -1.4],
        [-1.4, 1.5, 1.4],
        [1.4, 1.5, 1.4],
      ];
      for (const [x, y, z] of postCoords) {
        const post = applySwatchUVs(new THREE.BoxGeometry(0.2, 3.0, 0.2), SWATCH_INDEX.WeatheredDriftwood);
        post.translate(x, y, z);
        parts.push(post);
      }
      const barN = applySwatchUVs(new THREE.BoxGeometry(2.8, 0.15, 0.15), SWATCH_INDEX.AgedTimber);
      barN.translate(0, 2.8, -1.4);
      parts.push(barN);

      const barS = applySwatchUVs(new THREE.BoxGeometry(2.8, 0.15, 0.15), SWATCH_INDEX.AgedTimber);
      barS.translate(0, 2.8, 1.4);
      parts.push(barS);

      return mergeGeometries(parts, false)!;
    });

    const mesh = new THREE.Mesh(geo, this.material);
    mesh.castShadow = true;
    const group = new THREE.Group();
    group.add(mesh);
    return group;
  }

  // Modular Base: Wall
  public createWallMesh(): THREE.Mesh {
    const geo = this.getCachedGeometry('wall', () => {
      const g = applySwatchUVs(new THREE.BoxGeometry(3.0, 3.0, 0.2), SWATCH_INDEX.WeatheredDriftwood);
      g.translate(0, 1.5, 0);
      return g;
    });
    const mesh = new THREE.Mesh(geo, this.material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // Modular Base: Doorframe (merged static geometry)
  public createDoorframeMesh(): THREE.Group {
    const geo = this.getCachedGeometry('doorframe', () => {
      const postL = applySwatchUVs(new THREE.BoxGeometry(0.9, 3.0, 0.2), SWATCH_INDEX.WeatheredDriftwood);
      postL.translate(-1.05, 1.5, 0);

      const postR = applySwatchUVs(new THREE.BoxGeometry(0.9, 3.0, 0.2), SWATCH_INDEX.WeatheredDriftwood);
      postR.translate(1.05, 1.5, 0);

      const topBeam = applySwatchUVs(new THREE.BoxGeometry(1.2, 0.7, 0.2), SWATCH_INDEX.WeatheredDriftwood);
      topBeam.translate(0, 2.65, 0);

      return mergeGeometries([postL, postR, topBeam], false)!;
    });

    const mesh = new THREE.Mesh(geo, this.material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const group = new THREE.Group();
    group.add(mesh);
    return group;
  }

  // Modular Base: Roof
  public createRoofMesh(): THREE.Mesh {
    const geo = this.getCachedGeometry('roof', () => {
      const g = applySwatchUVs(new THREE.ConeGeometry(2.2, 1.2, 4), SWATCH_INDEX.PalmLeafGreen);
      g.rotateY(Math.PI / 4);
      g.translate(0, 0.6, 0);
      return g;
    });
    const mesh = new THREE.Mesh(geo, this.material);
    mesh.castShadow = true;
    return mesh;
  }

  // Survival Station: Campfire (8 stones merged + fire mesh)
  public createCampfire(): THREE.Group {
    const stoneRingGeo = this.getCachedGeometry('campfire_stones', () => {
      const parts: THREE.BufferGeometry[] = [];
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const stone = applySwatchUVs(new THREE.DodecahedronGeometry(0.18, 0), SWATCH_INDEX.WeatheredSlate);
        stone.translate(Math.cos(angle) * 0.5, 0.1, Math.sin(angle) * 0.5);
        parts.push(stone);
      }
      return mergeGeometries(parts, false)!;
    });

    const fireGeo = this.getCachedGeometry('campfire_fire', () => {
      const g = applySwatchUVs(new THREE.ConeGeometry(0.3, 0.6, 5), SWATCH_INDEX.EmberOrange);
      g.translate(0, 0.3, 0);
      return g;
    });

    const group = new THREE.Group();
    const stones = new THREE.Mesh(stoneRingGeo, this.material);
    stones.castShadow = true;
    group.add(stones);

    const fireMat = new THREE.MeshBasicMaterial({ color: PALETTE_COLORS.EmberOrange });
    const fire = new THREE.Mesh(fireGeo, fireMat);
    group.add(fire);

    return group;
  }

  // Survival Station: Rain Collector (barrel + funnel merged static geometry)
  public createRainCollector(): THREE.Group {
    const geo = this.getCachedGeometry('rain_collector', () => {
      const barrel = applySwatchUVs(new THREE.CylinderGeometry(0.35, 0.35, 0.9, 8), SWATCH_INDEX.BuoyancyBlue);
      barrel.translate(0, 0.45, 0);

      const funnel = applySwatchUVs(new THREE.ConeGeometry(0.75, 0.5, 6), SWATCH_INDEX.SeafoamWhite);
      funnel.rotateX(Math.PI);
      funnel.translate(0, 1.15, 0);

      return mergeGeometries([barrel, funnel], false)!;
    });

    const mesh = new THREE.Mesh(geo, this.material);
    mesh.castShadow = true;
    const group = new THREE.Group();
    group.add(mesh);
    return group;
  }

  // Modular Raft (4 barrels + deck + mast + sail merged static geometry)
  public createRaft(): THREE.Group {
    const geo = this.getCachedGeometry('raft', () => {
      const parts: THREE.BufferGeometry[] = [];
      const barrelOffsets = [
        [-1.0, -0.2, -1.0],
        [1.0, -0.2, -1.0],
        [-1.0, -0.2, 1.0],
        [1.0, -0.2, 1.0],
      ];
      for (const [x, y, z] of barrelOffsets) {
        const b = applySwatchUVs(new THREE.CylinderGeometry(0.35, 0.35, 0.9, 8), SWATCH_INDEX.BuoyancyBlue);
        b.rotateZ(Math.PI / 2);
        b.translate(x, y, z);
        parts.push(b);
      }

      const deck = applySwatchUVs(new THREE.BoxGeometry(2.8, 0.2, 2.8), SWATCH_INDEX.WeatheredDriftwood);
      deck.translate(0, 0.2, 0);
      parts.push(deck);

      const mast = applySwatchUVs(new THREE.CylinderGeometry(0.06, 0.08, 3.5, 5), SWATCH_INDEX.AgedTimber);
      mast.translate(0, 1.85, 0);
      parts.push(mast);

      const sail = applySwatchUVs(new THREE.BoxGeometry(1.6, 2.0, 0.04), SWATCH_INDEX.SeafoamWhite);
      sail.translate(0.8, 2.2, 0);
      parts.push(sail);

      return mergeGeometries(parts, false)!;
    });

    const mesh = new THREE.Mesh(geo, this.material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const group = new THREE.Group();
    group.add(mesh);
    return group;
  }

  // Feral Hound (body + head + snout + 4 legs merged static geometry)
  public createHound(): THREE.Group {
    const geo = this.getCachedGeometry('hound', () => {
      const body = applySwatchUVs(new THREE.BoxGeometry(0.45, 0.45, 0.9), SWATCH_INDEX.MuddyOchre);
      body.translate(0, 0.55, 0);

      const head = applySwatchUVs(new THREE.BoxGeometry(0.3, 0.3, 0.4), SWATCH_INDEX.MuddyOchre);
      head.translate(0, 0.75, 0.55);

      const snout = applySwatchUVs(new THREE.BoxGeometry(0.18, 0.15, 0.25), SWATCH_INDEX.AgedTimber);
      snout.translate(0, 0.7, 0.8);

      const parts = [body, head, snout];

      const legCoords = [
        [-0.18, 0.25, -0.3],
        [0.18, 0.25, -0.3],
        [-0.18, 0.25, 0.3],
        [0.18, 0.25, 0.3],
      ];
      for (const [x, y, z] of legCoords) {
        const leg = applySwatchUVs(new THREE.BoxGeometry(0.12, 0.5, 0.12), SWATCH_INDEX.MuddyOchre);
        leg.translate(x, y, z);
        parts.push(leg);
      }

      return mergeGeometries(parts, false)!;
    });

    const mesh = new THREE.Mesh(geo, this.material);
    mesh.castShadow = true;
    const group = new THREE.Group();
    group.add(mesh);
    return group;
  }

  // Tide Lurker (body + fin merged static geometry + emissive eyes)
  public createLurker(): THREE.Group {
    const geo = this.getCachedGeometry('lurker_body', () => {
      const body = applySwatchUVs(new THREE.CylinderGeometry(0.2, 0.55, 1.8, 6), SWATCH_INDEX.KelpDark);
      body.rotateX(Math.PI / 2);
      body.translate(0, 0.6, 0);

      const fin = applySwatchUVs(new THREE.ConeGeometry(0.3, 0.7, 3), SWATCH_INDEX.BioCyan);
      fin.rotateX(-Math.PI / 4);
      fin.translate(0, 1.1, -0.2);

      return mergeGeometries([body, fin], false)!;
    });

    const eyeGeo = this.getCachedGeometry('lurker_eyes', () => {
      const eyeL = new THREE.SphereGeometry(0.08, 4, 4);
      eyeL.translate(-0.25, 0.75, 0.7);
      const eyeR = new THREE.SphereGeometry(0.08, 4, 4);
      eyeR.translate(0.25, 0.75, 0.7);
      return mergeGeometries([eyeL, eyeR], false)!;
    });

    const group = new THREE.Group();
    const bodyMesh = new THREE.Mesh(geo, this.material);
    bodyMesh.castShadow = true;
    group.add(bodyMesh);

    const eyeMat = new THREE.MeshBasicMaterial({ color: PALETTE_COLORS.BioCyan });
    const eyes = new THREE.Mesh(eyeGeo, eyeMat);
    group.add(eyes);

    return group;
  }

  // Subtle Salvage Gold Loot Pickup
  public createLootPickup(itemId: string): THREE.Group {
    const geo = this.getCachedGeometry('loot_pickup', () => {
      const g = applySwatchUVs(new THREE.BoxGeometry(0.4, 0.4, 0.4), SWATCH_INDEX.SalvageGold);
      g.translate(0, 0.2, 0);
      return g;
    });

    const group = new THREE.Group();
    const box = new THREE.Mesh(geo, this.material);
    box.castShadow = true;
    group.add(box);
    group.userData.itemId = itemId;
    return group;
  }
}
