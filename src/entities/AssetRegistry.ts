import * as THREE from 'three';
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
  private material: THREE.MeshStandardMaterial;

  private constructor() {
    this.material = getSharedAtlasMaterial();
  }

  public static get(): AssetRegistry {
    if (!AssetRegistry.instance) {
      AssetRegistry.instance = new AssetRegistry();
    }
    return AssetRegistry.instance;
  }

  public getAtlasMaterial(): THREE.MeshStandardMaterial {
    return this.material;
  }

  // Survivor Humanoid Rig
  public createPlayerMesh(): PlayerRig {
    const root = new THREE.Group();

    // Torso (Weathered Driftwood vest)
    const torsoGeo = applySwatchUVs(new THREE.BoxGeometry(0.5, 0.65, 0.3), SWATCH_INDEX.WeatheredDriftwood);
    const torso = new THREE.Mesh(torsoGeo, this.material);
    torso.position.y = 1.05;
    torso.castShadow = true;
    root.add(torso);

    // Head (Sun-Bleached Sand skin tone)
    const headGeo = applySwatchUVs(new THREE.BoxGeometry(0.28, 0.28, 0.28), SWATCH_INDEX.SunBleachedSand);
    const head = new THREE.Mesh(headGeo, this.material);
    head.position.y = 0.52;
    head.castShadow = true;
    torso.add(head);

    // Modular Backpack (Aged Timber)
    const packGeo = applySwatchUVs(new THREE.BoxGeometry(0.38, 0.45, 0.2), SWATCH_INDEX.AgedTimber);
    const backpack = new THREE.Mesh(packGeo, this.material);
    backpack.position.set(0, 0, -0.22);
    backpack.castShadow = true;
    torso.add(backpack);

    // Left Arm
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.35, 0.25, 0);
    const armGeoL = applySwatchUVs(new THREE.BoxGeometry(0.16, 0.6, 0.16), SWATCH_INDEX.AgedTimber);
    armGeoL.translate(0, -0.3, 0);
    const leftArmMesh = new THREE.Mesh(armGeoL, this.material);
    leftArmMesh.castShadow = true;
    leftArm.add(leftArmMesh);
    torso.add(leftArm);

    // Right Arm with weapon socket
    const rightArm = new THREE.Group();
    rightArm.position.set(0.35, 0.25, 0);
    const armGeoR = applySwatchUVs(new THREE.BoxGeometry(0.16, 0.6, 0.16), SWATCH_INDEX.AgedTimber);
    armGeoR.translate(0, -0.3, 0);
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
    const legGeoL = applySwatchUVs(new THREE.BoxGeometry(0.18, 0.72, 0.18), SWATCH_INDEX.GunmetalGrey);
    legGeoL.translate(0, -0.36, 0);
    const leftLegMesh = new THREE.Mesh(legGeoL, this.material);
    leftLegMesh.castShadow = true;
    leftLeg.add(leftLegMesh);
    root.add(leftLeg);

    // Right Leg
    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.16, 0.72, 0);
    const legGeoR = applySwatchUVs(new THREE.BoxGeometry(0.18, 0.72, 0.18), SWATCH_INDEX.GunmetalGrey);
    legGeoR.translate(0, -0.36, 0);
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

  // Weapon: Scrap Axe
  public createScrapAxe(): THREE.Group {
    const group = new THREE.Group();
    // Handle
    const handleGeo = applySwatchUVs(new THREE.CylinderGeometry(0.025, 0.03, 0.7, 5), SWATCH_INDEX.AgedTimber);
    handleGeo.translate(0, 0.25, 0);
    const handle = new THREE.Mesh(handleGeo, this.material);
    group.add(handle);

    // Axe head
    const bladeGeo = applySwatchUVs(new THREE.BoxGeometry(0.2, 0.15, 0.04), SWATCH_INDEX.GunmetalGrey);
    bladeGeo.translate(0.08, 0.52, 0);
    const blade = new THREE.Mesh(bladeGeo, this.material);
    group.add(blade);

    return group;
  }

  // Weapon: Slingshot
  public createSlingshot(): THREE.Group {
    const group = new THREE.Group();
    const handleGeo = applySwatchUVs(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 5), SWATCH_INDEX.AgedTimber);
    const handle = new THREE.Mesh(handleGeo, this.material);
    group.add(handle);

    const forkGeoL = applySwatchUVs(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 4), SWATCH_INDEX.AgedTimber);
    forkGeoL.rotateZ(-Math.PI / 6);
    forkGeoL.translate(-0.06, 0.22, 0);
    const forkL = new THREE.Mesh(forkGeoL, this.material);
    group.add(forkL);

    const forkGeoR = applySwatchUVs(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 4), SWATCH_INDEX.AgedTimber);
    forkGeoR.rotateZ(Math.PI / 6);
    forkGeoR.translate(0.06, 0.22, 0);
    const forkR = new THREE.Mesh(forkGeoR, this.material);
    group.add(forkR);

    return group;
  }

  // Environment: Palm Tree
  public createPalmTree(): THREE.Group {
    const group = new THREE.Group();
    // Curved trunk
    const trunkGeo = applySwatchUVs(new THREE.CylinderGeometry(0.2, 0.35, 6.0, 6), SWATCH_INDEX.AgedTimber);
    trunkGeo.translate(0, 3.0, 0);
    const trunk = new THREE.Mesh(trunkGeo, this.material);
    trunk.castShadow = true;
    group.add(trunk);

    // Canopy fronds
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const frondGeo = applySwatchUVs(new THREE.ConeGeometry(0.8, 3.2, 4), SWATCH_INDEX.PalmLeafGreen);
      frondGeo.rotateX(Math.PI / 2.8);
      frondGeo.translate(0, 0, 1.4);
      const frond = new THREE.Mesh(frondGeo, this.material);
      frond.position.set(0, 5.8, 0);
      frond.rotation.y = angle;
      frond.castShadow = true;
      group.add(frond);
    }

    return group;
  }

  // Environment: Rock Boulder
  public createRock(radius = 1.4): THREE.Mesh {
    const geo = applySwatchUVs(new THREE.IcosahedronGeometry(radius, 0), SWATCH_INDEX.WeatheredSlate);
    const mesh = new THREE.Mesh(geo, this.material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // Environment: Plastic Barrel (Buoyancy Blue)
  public createPlasticBarrel(): THREE.Mesh {
    const geo = applySwatchUVs(new THREE.CylinderGeometry(0.35, 0.35, 0.9, 8), SWATCH_INDEX.BuoyancyBlue);
    const mesh = new THREE.Mesh(geo, this.material);
    mesh.castShadow = true;
    return mesh;
  }

  // Environment: Scrap Pile
  public createScrapPile(): THREE.Group {
    const group = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const plateGeo = applySwatchUVs(new THREE.BoxGeometry(0.9, 0.15, 0.7), SWATCH_INDEX.OxidisedRust);
      const plate = new THREE.Mesh(plateGeo, this.material);
      plate.position.set((i - 1) * 0.3, i * 0.12, (i % 2) * 0.2);
      plate.rotation.y = i * 0.8;
      plate.castShadow = true;
      group.add(plate);
    }
    return group;
  }

  // Environment: Sunken Shipping Container
  public createShippingContainer(isBlue = false): THREE.Mesh {
    const swatch = isBlue ? SWATCH_INDEX.IndustrialBlue : SWATCH_INDEX.IndustrialRed;
    const geo = applySwatchUVs(new THREE.BoxGeometry(6.0, 2.6, 2.4), swatch);
    const mesh = new THREE.Mesh(geo, this.material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // Modular Base: Foundation
  public createFoundationMesh(): THREE.Mesh {
    const geo = applySwatchUVs(new THREE.BoxGeometry(3.0, 0.4, 3.0), SWATCH_INDEX.WeatheredDriftwood);
    const mesh = new THREE.Mesh(geo, this.material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // Modular Base: Stilts (3m high)
  public createStiltsMesh(): THREE.Group {
    const group = new THREE.Group();
    // 4 posts
    const postCoords = [
      [-1.4, 1.5, -1.4],
      [1.4, 1.5, -1.4],
      [-1.4, 1.5, 1.4],
      [1.4, 1.5, 1.4],
    ];
    for (const [x, y, z] of postCoords) {
      const postGeo = applySwatchUVs(new THREE.BoxGeometry(0.2, 3.0, 0.2), SWATCH_INDEX.WeatheredDriftwood);
      const post = new THREE.Mesh(postGeo, this.material);
      post.position.set(x, y, z);
      post.castShadow = true;
      group.add(post);
    }
    // Crossbars
    const barGeoX = applySwatchUVs(new THREE.BoxGeometry(2.8, 0.15, 0.15), SWATCH_INDEX.AgedTimber);
    const barN = new THREE.Mesh(barGeoX, this.material);
    barN.position.set(0, 2.8, -1.4);
    group.add(barN);
    const barS = new THREE.Mesh(barGeoX, this.material);
    barS.position.set(0, 2.8, 1.4);
    group.add(barS);

    return group;
  }

  // Modular Base: Wall
  public createWallMesh(): THREE.Mesh {
    const geo = applySwatchUVs(new THREE.BoxGeometry(3.0, 3.0, 0.2), SWATCH_INDEX.WeatheredDriftwood);
    const mesh = new THREE.Mesh(geo, this.material);
    mesh.position.y = 1.5;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // Modular Base: Doorframe
  public createDoorframeMesh(): THREE.Group {
    const group = new THREE.Group();
    // Left post
    const postL = new THREE.Mesh(
      applySwatchUVs(new THREE.BoxGeometry(0.9, 3.0, 0.2), SWATCH_INDEX.WeatheredDriftwood),
      this.material
    );
    postL.position.set(-1.05, 1.5, 0);
    group.add(postL);

    // Right post
    const postR = new THREE.Mesh(
      applySwatchUVs(new THREE.BoxGeometry(0.9, 3.0, 0.2), SWATCH_INDEX.WeatheredDriftwood),
      this.material
    );
    postR.position.set(1.05, 1.5, 0);
    group.add(postR);

    // Top beam
    const topBeam = new THREE.Mesh(
      applySwatchUVs(new THREE.BoxGeometry(1.2, 0.7, 0.2), SWATCH_INDEX.WeatheredDriftwood),
      this.material
    );
    topBeam.position.set(0, 2.65, 0);
    group.add(topBeam);

    return group;
  }

  // Modular Base: Roof
  public createRoofMesh(): THREE.Mesh {
    const geo = applySwatchUVs(new THREE.ConeGeometry(2.2, 1.2, 4), SWATCH_INDEX.PalmLeafGreen);
    geo.rotateY(Math.PI / 4);
    const mesh = new THREE.Mesh(geo, this.material);
    mesh.position.y = 0.6;
    mesh.castShadow = true;
    return mesh;
  }

  // Survival Station: Campfire
  public createCampfire(): THREE.Group {
    const group = new THREE.Group();
    // Stones ring
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const stoneGeo = applySwatchUVs(new THREE.DodecahedronGeometry(0.18, 0), SWATCH_INDEX.WeatheredSlate);
      const stone = new THREE.Mesh(stoneGeo, this.material);
      stone.position.set(Math.cos(angle) * 0.5, 0.1, Math.sin(angle) * 0.5);
      group.add(stone);
    }
    // Emissive fire mesh (Ember Orange with emissive property, no real-time light)
    const fireGeo = applySwatchUVs(new THREE.ConeGeometry(0.3, 0.6, 5), SWATCH_INDEX.EmberOrange);
    const fireMat = new THREE.MeshBasicMaterial({ color: PALETTE_COLORS.EmberOrange });
    const fire = new THREE.Mesh(fireGeo, fireMat);
    fire.position.y = 0.3;
    group.add(fire);

    return group;
  }

  // Survival Station: Rain Collector
  public createRainCollector(): THREE.Group {
    const group = new THREE.Group();
    // Plastic blue barrel base
    const barrel = this.createPlasticBarrel();
    barrel.position.y = 0.45;
    group.add(barrel);

    // Funnel on top
    const funnelGeo = applySwatchUVs(new THREE.ConeGeometry(0.75, 0.5, 6), SWATCH_INDEX.SeafoamWhite);
    funnelGeo.rotateX(Math.PI);
    const funnel = new THREE.Mesh(funnelGeo, this.material);
    funnel.position.y = 1.15;
    group.add(funnel);

    return group;
  }

  // Modular Raft
  public createRaft(): THREE.Group {
    const group = new THREE.Group();
    // 4 blue barrels under deck
    const barrelOffsets = [
      [-1.0, -0.2, -1.0],
      [1.0, -0.2, -1.0],
      [-1.0, -0.2, 1.0],
      [1.0, -0.2, 1.0],
    ];
    for (const [x, y, z] of barrelOffsets) {
      const b = this.createPlasticBarrel();
      b.rotation.z = Math.PI / 2;
      b.position.set(x, y, z);
      group.add(b);
    }
    // Timber deck
    const deck = new THREE.Mesh(
      applySwatchUVs(new THREE.BoxGeometry(2.8, 0.2, 2.8), SWATCH_INDEX.WeatheredDriftwood),
      this.material
    );
    deck.position.y = 0.2;
    group.add(deck);

    // Mast and Sail
    const mast = new THREE.Mesh(
      applySwatchUVs(new THREE.CylinderGeometry(0.06, 0.08, 3.5, 5), SWATCH_INDEX.AgedTimber),
      this.material
    );
    mast.position.set(0, 1.85, 0);
    group.add(mast);

    const sail = new THREE.Mesh(
      applySwatchUVs(new THREE.BoxGeometry(1.6, 2.0, 0.04), SWATCH_INDEX.SeafoamWhite),
      this.material
    );
    sail.position.set(0.8, 2.2, 0);
    group.add(sail);

    return group;
  }

  // Feral Hound (Muddy Ochre)
  public createHound(): THREE.Group {
    const group = new THREE.Group();
    // Body
    const bodyGeo = applySwatchUVs(new THREE.BoxGeometry(0.45, 0.45, 0.9), SWATCH_INDEX.MuddyOchre);
    const body = new THREE.Mesh(bodyGeo, this.material);
    body.position.y = 0.55;
    body.castShadow = true;
    group.add(body);

    // Head
    const headGeo = applySwatchUVs(new THREE.BoxGeometry(0.3, 0.3, 0.4), SWATCH_INDEX.MuddyOchre);
    const head = new THREE.Mesh(headGeo, this.material);
    head.position.set(0, 0.75, 0.55);
    head.castShadow = true;
    group.add(head);

    // Snout
    const snoutGeo = applySwatchUVs(new THREE.BoxGeometry(0.18, 0.15, 0.25), SWATCH_INDEX.AgedTimber);
    const snout = new THREE.Mesh(snoutGeo, this.material);
    snout.position.set(0, 0.7, 0.8);
    group.add(snout);

    // 4 Legs
    const legCoords = [
      [-0.18, 0.25, -0.3],
      [0.18, 0.25, -0.3],
      [-0.18, 0.25, 0.3],
      [0.18, 0.25, 0.3],
    ];
    for (const [x, y, z] of legCoords) {
      const legGeo = applySwatchUVs(new THREE.BoxGeometry(0.12, 0.5, 0.12), SWATCH_INDEX.MuddyOchre);
      const leg = new THREE.Mesh(legGeo, this.material);
      leg.position.set(x, y, z);
      leg.castShadow = true;
      group.add(leg);
    }

    return group;
  }

  // Tide Lurker (Kelp Dark with Bio Cyan eyes & fins)
  public createLurker(): THREE.Group {
    const group = new THREE.Group();
    // Amphibious body
    const bodyGeo = applySwatchUVs(new THREE.CylinderGeometry(0.2, 0.55, 1.8, 6), SWATCH_INDEX.KelpDark);
    bodyGeo.rotateX(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeo, this.material);
    body.position.y = 0.6;
    body.castShadow = true;
    group.add(body);

    // Bio Cyan Emissive Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: PALETTE_COLORS.BioCyan });
    const eyeGeo = new THREE.SphereGeometry(0.08, 4, 4);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.25, 0.75, 0.7);
    group.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.25, 0.75, 0.7);
    group.add(eyeR);

    // Dorsal Fin (Bio Cyan)
    const finGeo = applySwatchUVs(new THREE.ConeGeometry(0.3, 0.7, 3), SWATCH_INDEX.BioCyan);
    const fin = new THREE.Mesh(finGeo, this.material);
    fin.position.set(0, 1.1, -0.2);
    fin.rotation.x = -Math.PI / 4;
    group.add(fin);

    return group;
  }

  // Subtle Salvage Gold Loot Pickup
  public createLootPickup(itemId: string): THREE.Group {
    const group = new THREE.Group();
    const boxGeo = applySwatchUVs(new THREE.BoxGeometry(0.4, 0.4, 0.4), SWATCH_INDEX.SalvageGold);
    const box = new THREE.Mesh(boxGeo, this.material);
    box.position.y = 0.2;
    box.castShadow = true;
    group.add(box);
    group.userData.itemId = itemId;
    return group;
  }
}
