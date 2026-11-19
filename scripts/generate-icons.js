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

function generatePng(width, height, isMaskable = false) {
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

  // Scanline data (filter byte 0 + RGBA per pixel)
  const rowStride = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowStride);

  const cx = width / 2;
  const cy = height / 2;
  const maxR = (width / 2) * (isMaskable ? 0.72 : 0.85);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowStride;
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy);

      // Default background: deep space dark navy #0a0e1c
      let r = 10;
      let g = 14;
      let b = 28;
      let a = 255;

      // Outer glowing ring
      if (dist >= maxR - 8 && dist <= maxR) {
        const ringGlow = 1 - Math.abs(dist - (maxR - 4)) / 4;
        r = Math.min(255, r + 0 * ringGlow);
        g = Math.min(255, g + 240 * ringGlow);
        b = Math.min(255, b + 255 * ringGlow);
      }

      // Inside badge background
      if (dist < maxR - 8) {
        r = 15;
        g = 22;
        b = 42;
      }

      // Cyber Ship (Triangular Neon Vessel pointing UP)
      // Tip at (cx, cy - maxR * 0.55), base left (cx - maxR * 0.45, cy + maxR * 0.45), base right (cx + maxR * 0.45, cy + maxR * 0.45)
      const shipTopY = cy - maxR * 0.55;
      const shipBottomY = cy + maxR * 0.45;
      const shipWidthHalf = maxR * 0.45;

      if (y >= shipTopY && y <= shipBottomY) {
        const prog = (y - shipTopY) / (shipBottomY - shipTopY);
        const halfSpan = prog * shipWidthHalf;

        if (Math.abs(dx) <= halfSpan) {
          // Inside ship
          if (Math.abs(dx) <= halfSpan * 0.25) {
            // Cockpit neon magenta #ff0077
            r = 255;
            g = 0;
            b = 119;
          } else {
            // Cyber wings neon cyan #00f0ff
            r = 0;
            g = 240;
            b = 255;
          }

          // Edge highlight
          if (Math.abs(dx) >= halfSpan - 3) {
            r = 255;
            g = 255;
            b = 255;
          }
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

const publicDir = path.resolve('public');
fs.mkdirSync(publicDir, { recursive: true });

// Generate icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'maskable-icon-512x512.png'), generatePng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePng(180, 180, false));

console.log('Successfully generated PWA icons in public/');
