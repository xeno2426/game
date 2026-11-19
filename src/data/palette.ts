import * as THREE from 'three';

export const PALETTE = {
  // Environment & Weather
  TropicalTeal: '#1E8E8E',
  AbyssalNavy: '#0D3B4C',
  SeafoamWhite: '#E6F7F5',
  SunBleachedSand: '#DFC79A',
  WetSilt: '#8F7A5B',
  WeatheredSlate: '#6E7478',
  PalmLeafGreen: '#4E9A47',
  DeepJungle: '#265C36',
  CoastalMist: '#A9D6E5',
  StormSlate: '#334452',

  // Industrial & Base Building
  WeatheredDriftwood: '#9C6F44',
  AgedTimber: '#5E4028',
  OxidisedRust: '#B35432',
  GunmetalGrey: '#4A525A',
  IndustrialRed: '#C04A3E',
  IndustrialBlue: '#2E5E7E',
  BuoyancyBlue: '#1F75FE',
  WarningYellow: '#E8B931',
  EmberOrange: '#FF7A29',

  // Loot, Enemies & HUD
  CircuitGreen: '#2ECC71',
  CopperCoil: '#D97736',
  SalvageGold: '#FFE066',
  MuddyOchre: '#7A5638',
  KelpDark: '#1A3A3A',
  BioCyan: '#38F2E6',
  CoralRed: '#E63946',
  ClearSkyBlue: '#29B6F6',
  WarmAmber: '#F4A261',
  FrostCyan: '#7CE8FF',
  SignalCrimson: '#FF3B30',

  // Core neutral tokens for canvas/rendering
  VoidBlack: '#080C10',
  PureWhite: '#FFFFFF',
} as const;

export type PaletteKey = keyof typeof PALETTE;
export type PaletteHex = (typeof PALETTE)[PaletteKey];

export const PALETTE_COLORS: Record<PaletteKey, THREE.Color> = Object.entries(PALETTE).reduce(
  (acc, [key, hex]) => {
    acc[key as PaletteKey] = new THREE.Color(hex);
    return acc;
  },
  {} as Record<PaletteKey, THREE.Color>
);

export const SWATCH_INDEX: Record<PaletteKey, number> = {
  TropicalTeal: 0,
  AbyssalNavy: 1,
  SeafoamWhite: 2,
  SunBleachedSand: 3,
  WetSilt: 4,
  WeatheredSlate: 5,
  PalmLeafGreen: 6,
  DeepJungle: 7,

  CoastalMist: 8,
  StormSlate: 9,
  WeatheredDriftwood: 10,
  AgedTimber: 11,
  OxidisedRust: 12,
  GunmetalGrey: 13,
  IndustrialRed: 14,
  IndustrialBlue: 15,

  BuoyancyBlue: 16,
  WarningYellow: 17,
  EmberOrange: 18,
  CircuitGreen: 19,
  CopperCoil: 20,
  SalvageGold: 21,
  MuddyOchre: 22,
  KelpDark: 23,

  BioCyan: 24,
  CoralRed: 25,
  ClearSkyBlue: 26,
  WarmAmber: 27,
  FrostCyan: 28,
  SignalCrimson: 29,
  VoidBlack: 30,
  PureWhite: 31,
};

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function clampByte(val: number): number {
  return Math.max(0, Math.min(255, Math.round(val)));
}

function adjustBrightness(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex);
  const nr = clampByte(r * factor);
  const ng = clampByte(g * factor);
  const nb = clampByte(b * factor);
  return `rgb(${nr}, ${ng}, ${nb})`;
}

let cachedAtlasTexture: THREE.CanvasTexture | null = null;

export function getPaletteAtlasTexture(): THREE.CanvasTexture {
  if (cachedAtlasTexture) {
    return cachedAtlasTexture;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not create 2D context for palette atlas');
  }

  // Clear background
  ctx.fillStyle = PALETTE.StormSlate;
  ctx.fillRect(0, 0, 256, 256);

  const swatchEntries = Object.entries(SWATCH_INDEX) as [PaletteKey, number][];

  for (const [key, index] of swatchEntries) {
    const col = index % 8;
    const row = Math.floor(index / 8);
    const x = col * 32;
    const y = row * 32;
    const baseHex = PALETTE[key];

    // Top 20% (6.4px -> 6px): 10% lighter
    const light = adjustBrightness(baseHex, 1.1);
    // Middle 60% (19.2px -> 20px): base hex
    const base = baseHex;
    // Bottom 20% (6.4px -> 6px): 15% darker
    const dark = adjustBrightness(baseHex, 0.85);

    // Canvas gradient from y (top) to y+32 (bottom)
    const grad = ctx.createLinearGradient(x, y, x, y + 32);
    grad.addColorStop(0.0, light);
    grad.addColorStop(0.2, light);
    grad.addColorStop(0.201, base);
    grad.addColorStop(0.8, base);
    grad.addColorStop(0.801, dark);
    grad.addColorStop(1.0, dark);

    ctx.fillStyle = grad;
    ctx.fillRect(x, y, 32, 32);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;

  cachedAtlasTexture = texture;
  return texture;
}

export interface SwatchUVBounds {
  uMin: number;
  uMax: number;
  vMin: number;
  vMax: number;
}

export function getSwatchUVBounds(swatchIndex: number, paddingPx = 2.5): SwatchUVBounds {
  const col = swatchIndex % 8;
  const row = Math.floor(swatchIndex / 8);

  const uLeft = col * 32 + paddingPx;
  const uRight = (col + 1) * 32 - paddingPx;

  // In WebGL, V=0 is bottom and V=1 is top.
  // Row 0 in canvas is top, so Y in canvas from row*32 to (row+1)*32.
  // In WebGL V: top is 1.0 - (row * 32 + padding) / 256, bottom is 1.0 - ((row + 1) * 32 - padding) / 256.
  const vTop = 1.0 - (row * 32 + paddingPx) / 256;
  const vBottom = 1.0 - ((row + 1) * 32 - paddingPx) / 256;

  return {
    uMin: uLeft / 256,
    uMax: uRight / 256,
    vMin: vBottom,
    vMax: vTop,
  };
}

let sharedAtlasMaterial: THREE.MeshStandardMaterial | null = null;

export function getSharedAtlasMaterial(): THREE.MeshStandardMaterial {
  if (!sharedAtlasMaterial) {
    const atlas = getPaletteAtlasTexture();
    sharedAtlasMaterial = new THREE.MeshStandardMaterial({
      map: atlas,
      roughness: 0.85,
      metalness: 0.1,
    });
  }
  return sharedAtlasMaterial;
}

export function injectPaletteCSSVariables(): void {
  if (typeof document === 'undefined') return;
  const id = 'tidebound-palette-vars';
  let styleEl = document.getElementById(id) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = id;
    document.head.appendChild(styleEl);
  }

  const cssRules = [
    ':root {',
    ...Object.entries(PALETTE).map(([key, hex]) => {
      // kebab-case
      const kebab = key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
      return `  --color-${kebab}: ${hex};`;
    }),
    '}',
  ].join('\n');

  styleEl.textContent = cssRules;
}
