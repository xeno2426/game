import type { PaletteKey } from './palette';

export type AssetKind = 'instanced_static' | 'unique' | 'animated';

export interface AssetManifestEntry {
  id: string;
  path: string;
  scale: [number, number, number];
  rotation: [number, number, number];
  groundOffset: number;
  castShadow: boolean;
  receiveShadow: boolean;
  kind: AssetKind;
  lod1Path?: string;
  paletteRemap?: Record<string, PaletteKey>;
}

export const ASSET_MANIFEST: Record<string, AssetManifestEntry> = {
  // Biome Flora & Scatter
  palm_tree: {
    id: 'palm_tree',
    path: 'models/palm_tree.glb',
    scale: [1.2, 1.2, 1.2],
    rotation: [0, 0, 0],
    groundOffset: 0,
    castShadow: true,
    receiveShadow: false,
    kind: 'instanced_static',
  },
  tree_jungle: {
    id: 'tree_jungle',
    path: 'models/tree_jungle.glb',
    scale: [1.3, 1.3, 1.3],
    rotation: [0, 0, 0],
    groundOffset: 0,
    castShadow: true,
    receiveShadow: false,
    kind: 'instanced_static',
  },
  tree_mangrove: {
    id: 'tree_mangrove',
    path: 'models/tree_mangrove.glb',
    scale: [1.1, 1.1, 1.1],
    rotation: [0, 0, 0],
    groundOffset: 0,
    castShadow: true,
    receiveShadow: false,
    kind: 'instanced_static',
  },
  rock: {
    id: 'rock',
    path: 'models/rock.glb',
    scale: [1.0, 1.0, 1.0],
    rotation: [0, 0, 0],
    groundOffset: 0,
    castShadow: true,
    receiveShadow: true,
    kind: 'instanced_static',
  },
  rock_highlands: {
    id: 'rock_highlands',
    path: 'models/rock_highlands.glb',
    scale: [1.4, 1.4, 1.4],
    rotation: [0, 0, 0],
    groundOffset: 0,
    castShadow: true,
    receiveShadow: true,
    kind: 'instanced_static',
  },
  grass: {
    id: 'grass',
    path: 'models/grass.glb',
    scale: [1.2, 1.2, 1.2],
    rotation: [0, 0, 0],
    groundOffset: 0,
    castShadow: false,
    receiveShadow: false,
    kind: 'instanced_static',
  },

  // Resource & Industrial Props
  plastic_barrel: {
    id: 'plastic_barrel',
    path: 'models/barrel.glb',
    scale: [1.0, 1.0, 1.0],
    rotation: [0, 0, 0],
    groundOffset: 0,
    castShadow: true,
    receiveShadow: false,
    kind: 'instanced_static',
  },
  crate: {
    id: 'crate',
    path: 'models/crate.glb',
    scale: [1.0, 1.0, 1.0],
    rotation: [0, 0, 0],
    groundOffset: 0,
    castShadow: true,
    receiveShadow: false,
    kind: 'instanced_static',
  },
  scrap_pile: {
    id: 'scrap_pile',
    path: 'models/scrap_pile.glb',
    scale: [1.0, 1.0, 1.0],
    rotation: [0, 0, 0],
    groundOffset: 0,
    castShadow: true,
    receiveShadow: false,
    kind: 'instanced_static',
  },
  shipping_container_red: {
    id: 'shipping_container_red',
    path: 'models/container.glb',
    scale: [1.2, 1.2, 1.2],
    rotation: [0, 0, 0],
    groundOffset: 0,
    castShadow: true,
    receiveShadow: true,
    kind: 'instanced_static',
    paletteRemap: {
      default: 'IndustrialRed',
    },
  },
  shipping_container_blue: {
    id: 'shipping_container_blue',
    path: 'models/container.glb',
    scale: [1.2, 1.2, 1.2],
    rotation: [0, 0, 0],
    groundOffset: 0,
    castShadow: true,
    receiveShadow: true,
    kind: 'instanced_static',
    paletteRemap: {
      default: 'IndustrialBlue',
    },
  },
  sunken_electronics: {
    id: 'sunken_electronics',
    path: 'models/container.glb',
    scale: [1.0, 1.0, 1.0],
    rotation: [0, 0, 0],
    groundOffset: 0,
    castShadow: true,
    receiveShadow: true,
    kind: 'instanced_static',
    paletteRemap: {
      default: 'IndustrialBlue',
    },
  },

  // Equipment & Base Survival
  scrap_axe: {
    id: 'scrap_axe',
    path: 'models/axe.glb',
    scale: [1.0, 1.0, 1.0],
    rotation: [0, 0, 0],
    groundOffset: 0,
    castShadow: true,
    receiveShadow: false,
    kind: 'unique',
  },
  slingshot: {
    id: 'slingshot',
    path: 'models/slingshot.glb',
    scale: [0.6, 0.6, 0.6],
    rotation: [0, 0, 0],
    groundOffset: 0,
    castShadow: true,
    receiveShadow: false,
    kind: 'unique',
  },
  campfire: {
    id: 'campfire',
    path: 'models/campfire.glb',
    scale: [1.2, 1.2, 1.2],
    rotation: [0, 0, 0],
    groundOffset: 0,
    castShadow: true,
    receiveShadow: false,
    kind: 'unique',
  },
  raft: {
    id: 'raft',
    path: 'models/raft.glb',
    scale: [1.0, 1.0, 1.0],
    rotation: [0, 0, 0],
    groundOffset: 0,
    castShadow: true,
    receiveShadow: true,
    kind: 'unique',
  },

  // Characters & Entities
  hound: {
    id: 'hound',
    path: 'models/hound.glb',
    scale: [1.0, 1.0, 1.0],
    rotation: [0, 0, 0],
    groundOffset: 0,
    castShadow: true,
    receiveShadow: false,
    kind: 'animated',
  },
  lurker: {
    id: 'lurker',
    path: 'models/lurker.glb',
    scale: [1.2, 1.2, 1.2],
    rotation: [0, 0, 0],
    groundOffset: 0,
    castShadow: true,
    receiveShadow: false,
    kind: 'animated',
  },
  survivor: {
    id: 'survivor',
    path: 'models/survivor.glb',
    scale: [1.0, 1.0, 1.0],
    rotation: [0, 0, 0],
    groundOffset: 0,
    castShadow: true,
    receiveShadow: false,
    kind: 'animated',
  },
};
