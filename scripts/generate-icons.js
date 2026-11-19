import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

const crcTable = createCrcTable();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcTarget = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcTarget);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// Tidebound official color tokens (RGB values matching src/data/palette.ts)
const PALETTE_RGB = {
  AbyssalNavy: [13, 59, 76],
  WeatheredSlate: [110, 116, 120],
  SunBleachedSand: [223, 199, 154],
  EmberOrange: [255, 122, 41],
  TropicalTeal: [30, 142, 142],
  SeafoamWhite: [230, 247, 245],
};

function renderPixel(u, v) {
  // Normalize u, v to [0, 1]
  // 1. Sun / Ember Spark
  const sunDx = u - 0.5;
  const sunDy = v - 0.28;
  const sunDist = Math.hypot(sunDx, sunDy);
  if (sunDist <= 0.055) {
    return PALETTE_RGB.EmberOrange;
  }

  // 2. Wave crest and water body
  const waveCrestV = 0.71 + Math.sin(u * Math.PI * 4.0 - 0.5) * 0.038;
  if (v >= waveCrestV) {
    if (v <= waveCrestV + 0.024) {
      return PALETTE_RGB.SeafoamWhite;
    }
    return PALETTE_RGB.TropicalTeal;
  }

  // 3. Mountain / Island Peak
  if (v >= 0.35 && v < waveCrestV) {
    // Outer mountain span
    const prog = (v - 0.35) / (0.75 - 0.35);
    const halfWidth = prog * 0.30;
    const dx = Math.abs(u - 0.5);

    if (dx <= halfWidth) {
      // Inner sand ridge
      if (v >= 0.44) {
        const innerProg = (v - 0.44) / (0.75 - 0.44);
        const innerHalfWidth = innerProg * 0.13;
        if (dx <= innerHalfWidth) {
          return PALETTE_RGB.SunBleachedSand;
        }
      }
      return PALETTE_RGB.WeatheredSlate;
    }
  }

  return null;
}

function generatePng(width, height, options = {}) {
  const {
    isMaskable = false,
    isRound = false,
    isForeground = false,
    isSplash = false,
  } = options;

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdrData);

  const rowStride = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowStride);

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2;

  // Scale emblem based on context
  let emblemScale = 0.92;
  if (isMaskable) emblemScale = 0.72;
  if (isForeground) emblemScale = 0.62;
  if (isSplash) emblemScale = Math.min(width, height) * 0.42 / width;

  const emblemSizeX = width * emblemScale;
  const emblemSizeY = (isSplash ? width * emblemScale : height * emblemScale);
  const emblemStartX = cx - emblemSizeX / 2;
  const emblemStartY = cy - emblemSizeY / 2;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowStride;
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      if (isRound) {
        const d = Math.hypot(x - cx, y - cy);
        if (d > radius) {
          rawData[pxOffset] = 0;
          rawData[pxOffset + 1] = 0;
          rawData[pxOffset + 2] = 0;
          rawData[pxOffset + 3] = 0;
          continue;
        }
      }

      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      if (!isForeground) {
        // Deep background: AbyssalNavy
        [r, g, b] = PALETTE_RGB.AbyssalNavy;
        a = 255;
      }

      // Check if inside emblem bounds
      if (
        x >= emblemStartX &&
        x < emblemStartX + emblemSizeX &&
        y >= emblemStartY &&
        y < emblemStartY + emblemSizeY
      ) {
        const u = (x - emblemStartX) / emblemSizeX;
        const v = (y - emblemStartY) / emblemSizeY;

        const color = renderPixel(u, v);
        if (color) {
          [r, g, b] = color;
          a = 255;
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// 1. Generate PWA and Web icons in public/
const publicDir = path.resolve('public');
fs.mkdirSync(publicDir, { recursive: true });

console.log('Generating PWA icons...');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePng(192, 192, { isMaskable: false }));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePng(512, 512, { isMaskable: false }));
fs.writeFileSync(path.join(publicDir, 'maskable-icon-512x512.png'), generatePng(512, 512, { isMaskable: true }));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePng(180, 180, { isMaskable: false }));

// 2. Generate Capacitor Android launcher icons & splash screens
const resDir = path.resolve('android/app/src/main/res');

if (fs.existsSync(resDir)) {
  console.log('Generating Android icons and splash assets...');

  const mipmapDensities = [
    { dir: 'mipmap-mdpi', iconSize: 48, fgSize: 108 },
    { dir: 'mipmap-hdpi', iconSize: 72, fgSize: 162 },
    { dir: 'mipmap-xhdpi', iconSize: 96, fgSize: 216 },
    { dir: 'mipmap-xxhdpi', iconSize: 144, fgSize: 324 },
    { dir: 'mipmap-xxxhdpi', iconSize: 192, fgSize: 432 },
  ];

  for (const { dir, iconSize, fgSize } of mipmapDensities) {
    const targetDir = path.join(resDir, dir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    fs.writeFileSync(path.join(targetDir, 'ic_launcher.png'), generatePng(iconSize, iconSize, { isMaskable: false }));
    fs.writeFileSync(path.join(targetDir, 'ic_launcher_round.png'), generatePng(iconSize, iconSize, { isRound: true }));
    fs.writeFileSync(path.join(targetDir, 'ic_launcher_foreground.png'), generatePng(fgSize, fgSize, { isForeground: true }));
  }

  const splashScreens = [
    { dir: 'drawable', w: 480, h: 320 },
    { dir: 'drawable-land-mdpi', w: 480, h: 320 },
    { dir: 'drawable-land-hdpi', w: 800, h: 480 },
    { dir: 'drawable-land-xhdpi', w: 1280, h: 720 },
    { dir: 'drawable-land-xxhdpi', w: 1600, h: 960 },
    { dir: 'drawable-land-xxxhdpi', w: 1920, h: 1280 },
    { dir: 'drawable-port-mdpi', w: 320, h: 480 },
    { dir: 'drawable-port-hdpi', w: 480, h: 800 },
    { dir: 'drawable-port-xhdpi', w: 720, h: 1280 },
    { dir: 'drawable-port-xxhdpi', w: 960, h: 1600 },
    { dir: 'drawable-port-xxxhdpi', w: 1280, h: 1920 },
  ];

  for (const { dir, w, h } of splashScreens) {
    const targetDir = path.join(resDir, dir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    fs.writeFileSync(path.join(targetDir, 'splash.png'), generatePng(w, h, { isSplash: true }));
  }
}

console.log('All icons generated successfully with Tidebound palette colors.');
