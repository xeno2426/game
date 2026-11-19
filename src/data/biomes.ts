import type { PaletteKey } from './palette';

export const BiomeType = {
  PalmBeachCoast: 0,
  DenseJungle: 1,
  MangroveSwamp: 2,
  RockyHighlands: 3,
  IndustrialHarbour: 4,
  TidalFlats: 5,
  OffshoreOilRigs: 6,
  Ocean: 7,
} as const;

export type BiomeType = (typeof BiomeType)[keyof typeof BiomeType];

export interface PropSpawnEntry {
  propType: string;
  weight: number;
  scaleMin: number;
  scaleMax: number;
}

export interface EnemySpawnEntry {
  enemyType: 'hound' | 'lurker';
  weight: number;
}

export interface BiomeDefinition {
  id: BiomeType;
  name: string;
  primaryColor: PaletteKey;
  secondaryColor: PaletteKey;
  accentColor: PaletteKey;
  minHeight: number;
  maxHeight: number;
  minSlope: number;
  maxSlope: number;
  props: PropSpawnEntry[];
  enemies: EnemySpawnEntry[];
}

export const BIOMES: Record<BiomeType, BiomeDefinition> = {
  [BiomeType.PalmBeachCoast]: {
    id: BiomeType.PalmBeachCoast,
    name: 'Palm Beach Coast',
    primaryColor: 'SunBleachedSand',
    secondaryColor: 'WetSilt',
    accentColor: 'PalmLeafGreen',
    minHeight: 0.0,
    maxHeight: 7.0,
    minSlope: 0.0,
    maxSlope: 0.4,
    props: [
      { propType: 'palm_tree', weight: 6, scaleMin: 0.8, scaleMax: 1.25 },
      { propType: 'rock', weight: 3, scaleMin: 0.7, scaleMax: 1.4 },
      { propType: 'plastic_barrel', weight: 2, scaleMin: 0.9, scaleMax: 1.1 },
      { propType: 'grass', weight: 5, scaleMin: 0.8, scaleMax: 1.2 },
    ],
    enemies: [
      { enemyType: 'hound', weight: 2 },
    ],
  },
  [BiomeType.DenseJungle]: {
    id: BiomeType.DenseJungle,
    name: 'Dense Jungle',
    primaryColor: 'DeepJungle',
    secondaryColor: 'PalmLeafGreen',
    accentColor: 'AgedTimber',
    minHeight: 4.8,
    maxHeight: 18.0,
    minSlope: 0.0,
    maxSlope: 0.5,
    props: [
      { propType: 'palm_tree', weight: 8, scaleMin: 0.9, scaleMax: 1.35 },
      { propType: 'grass', weight: 8, scaleMin: 0.9, scaleMax: 1.5 },
      { propType: 'rock', weight: 3, scaleMin: 0.8, scaleMax: 1.2 },
    ],
    enemies: [
      { enemyType: 'hound', weight: 4 },
    ],
  },
  [BiomeType.MangroveSwamp]: {
    id: BiomeType.MangroveSwamp,
    name: 'Mangrove Swamp',
    primaryColor: 'WetSilt',
    secondaryColor: 'DeepJungle',
    accentColor: 'TropicalTeal',
    minHeight: -1.5,
    maxHeight: 4.5,
    minSlope: 0.0,
    maxSlope: 0.25,
    props: [
      { propType: 'palm_tree', weight: 5, scaleMin: 0.7, scaleMax: 1.1 },
      { propType: 'rock', weight: 2, scaleMin: 0.6, scaleMax: 1.0 },
      { propType: 'grass', weight: 6, scaleMin: 0.8, scaleMax: 1.2 },
      { propType: 'plastic_barrel', weight: 2, scaleMin: 0.9, scaleMax: 1.1 },
    ],
    enemies: [
      { enemyType: 'lurker', weight: 4 },
      { enemyType: 'hound', weight: 1 },
    ],
  },
  [BiomeType.RockyHighlands]: {
    id: BiomeType.RockyHighlands,
    name: 'Rocky Highlands',
    primaryColor: 'WeatheredSlate',
    secondaryColor: 'GunmetalGrey',
    accentColor: 'DeepJungle',
    minHeight: 6.0,
    maxHeight: 32.0,
    minSlope: 0.35,
    maxSlope: 1.0,
    props: [
      { propType: 'rock', weight: 9, scaleMin: 0.8, scaleMax: 1.8 },
      { propType: 'scrap_pile', weight: 2, scaleMin: 0.8, scaleMax: 1.2 },
      { propType: 'grass', weight: 2, scaleMin: 0.6, scaleMax: 1.0 },
    ],
    enemies: [
      { enemyType: 'hound', weight: 3 },
    ],
  },
  [BiomeType.IndustrialHarbour]: {
    id: BiomeType.IndustrialHarbour,
    name: 'Industrial Harbour',
    primaryColor: 'WeatheredSlate',
    secondaryColor: 'GunmetalGrey',
    accentColor: 'OxidisedRust',
    minHeight: 3.5,
    maxHeight: 8.5,
    minSlope: 0.0,
    maxSlope: 0.2,
    props: [
      { propType: 'shipping_container_red', weight: 4, scaleMin: 1.0, scaleMax: 1.0 },
      { propType: 'shipping_container_blue', weight: 4, scaleMin: 1.0, scaleMax: 1.0 },
      { propType: 'scrap_pile', weight: 6, scaleMin: 0.8, scaleMax: 1.3 },
      { propType: 'plastic_barrel', weight: 5, scaleMin: 0.9, scaleMax: 1.1 },
    ],
    enemies: [
      { enemyType: 'hound', weight: 2 },
    ],
  },
  [BiomeType.TidalFlats]: {
    id: BiomeType.TidalFlats,
    name: 'Tidal Flats and Reef Shallows',
    primaryColor: 'WetSilt',
    secondaryColor: 'TropicalTeal',
    accentColor: 'SunBleachedSand',
    minHeight: -3.5,
    maxHeight: 3.0,
    minSlope: 0.0,
    maxSlope: 0.35,
    props: [
      { propType: 'rock', weight: 4, scaleMin: 0.7, scaleMax: 1.3 },
      { propType: 'plastic_barrel', weight: 3, scaleMin: 0.9, scaleMax: 1.1 },
      { propType: 'sunken_electronics', weight: 3, scaleMin: 0.9, scaleMax: 1.1 },
    ],
    enemies: [
      { enemyType: 'lurker', weight: 3 },
    ],
  },
  [BiomeType.OffshoreOilRigs]: {
    id: BiomeType.OffshoreOilRigs,
    name: 'Offshore Oil Rigs',
    primaryColor: 'OxidisedRust',
    secondaryColor: 'GunmetalGrey',
    accentColor: 'WarningYellow',
    minHeight: 3.5,
    maxHeight: 18.0,
    minSlope: 0.0,
    maxSlope: 0.1,
    props: [
      { propType: 'scrap_pile', weight: 5, scaleMin: 0.9, scaleMax: 1.2 },
      { propType: 'sunken_electronics', weight: 4, scaleMin: 0.9, scaleMax: 1.2 },
      { propType: 'plastic_barrel', weight: 4, scaleMin: 0.9, scaleMax: 1.1 },
    ],
    enemies: [
      { enemyType: 'lurker', weight: 4 },
    ],
  },
  [BiomeType.Ocean]: {
    id: BiomeType.Ocean,
    name: 'Open Ocean',
    primaryColor: 'AbyssalNavy',
    secondaryColor: 'TropicalTeal',
    accentColor: 'SeafoamWhite',
    minHeight: -30.0,
    maxHeight: -2.0,
    minSlope: 0.0,
    maxSlope: 1.0,
    props: [],
    enemies: [
      { enemyType: 'lurker', weight: 3 },
    ],
  },
};
