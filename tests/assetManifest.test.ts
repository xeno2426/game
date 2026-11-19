import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { ASSET_MANIFEST } from '../src/data/assetManifest';

function parseGlbInfo(filePath: string): { triangleCount: number; sizeBytes: number; animationCount: number } {
  const buf = fs.readFileSync(filePath);
  const sizeBytes = buf.length;
  const jsonLen = buf.readUInt32LE(12);
  const jsonStr = buf.toString('utf8', 20, 20 + jsonLen);
  const gltf = JSON.parse(jsonStr);

  let triangleCount = 0;
  if (gltf.meshes) {
    for (const mesh of gltf.meshes) {
      for (const prim of mesh.primitives) {
        if (prim.indices !== undefined) {
          const acc = gltf.accessors[prim.indices];
          triangleCount += acc.count / 3;
        } else if (prim.attributes && prim.attributes.POSITION !== undefined) {
          const acc = gltf.accessors[prim.attributes.POSITION];
          triangleCount += acc.count / 3;
        }
      }
    }
  }

  const animationCount = gltf.animations ? gltf.animations.length : 0;
  return { triangleCount: Math.round(triangleCount), sizeBytes, animationCount };
}

describe('Asset Manifest and GLB Model Validation', () => {
  const publicDir = path.resolve(__dirname, '../public');
  const modelsDir = path.join(publicDir, 'models');
  const assetsDocPath = path.resolve(__dirname, '../docs/ASSETS.md');

  it('every manifest path should exist on disk under public/', () => {
    for (const [id, entry] of Object.entries(ASSET_MANIFEST)) {
      const fullPath = path.join(publicDir, entry.path);
      expect(fs.existsSync(fullPath), `Asset ${id} path missing: ${fullPath}`).toBe(true);
      if (entry.lod1Path) {
        const lod1FullPath = path.join(publicDir, entry.lod1Path);
        expect(fs.existsSync(lod1FullPath), `LOD1 for ${id} missing: ${lod1FullPath}`).toBe(true);
      }
    }
  });

  it('every GLB file should be under 250 KB and total folder under 15 MB', () => {
    const files = fs.readdirSync(modelsDir).filter((f) => f.endsWith('.glb'));
    expect(files.length).toBeGreaterThan(0);

    let totalSizeBytes = 0;
    const maxFileSizeBytes = 250 * 1024;
    const maxTotalSizeBytes = 15 * 1024 * 1024;

    for (const file of files) {
      const filePath = path.join(modelsDir, file);
      const stat = fs.statSync(filePath);
      totalSizeBytes += stat.size;

      expect(
        stat.size,
        `File ${file} exceeds 250 KB budget (${(stat.size / 1024).toFixed(1)} KB)`
      ).toBeLessThanOrEqual(maxFileSizeBytes);
    }

    expect(totalSizeBytes).toBeLessThanOrEqual(maxTotalSizeBytes);
  });

  it('model triangle counts should be strictly within budget caps', () => {
    // Trees under 800
    const treeFiles = ['palm_tree.glb', 'tree_jungle.glb', 'tree_mangrove.glb'];
    for (const f of treeFiles) {
      const p = path.join(modelsDir, f);
      if (fs.existsSync(p)) {
        const info = parseGlbInfo(p);
        expect(info.triangleCount, `Tree ${f} exceeds 800 triangles`).toBeLessThanOrEqual(800);
      }
    }

    // Rocks under 300
    const rockFiles = ['rock.glb', 'rock_highlands.glb'];
    for (const f of rockFiles) {
      const p = path.join(modelsDir, f);
      if (fs.existsSync(p)) {
        const info = parseGlbInfo(p);
        expect(info.triangleCount, `Rock ${f} exceeds 300 triangles`).toBeLessThanOrEqual(300);
      }
    }

    // Characters under 3000
    const charFiles = ['hound.glb', 'survivor.glb', 'lurker.glb'];
    for (const f of charFiles) {
      const p = path.join(modelsDir, f);
      if (fs.existsSync(p)) {
        const info = parseGlbInfo(p);
        expect(info.triangleCount, `Character ${f} exceeds 3000 triangles`).toBeLessThanOrEqual(3000);
      }
    }
  });

  it('docs/ASSETS.md should document every model file in public/models/', () => {
    expect(fs.existsSync(assetsDocPath), 'docs/ASSETS.md does not exist').toBe(true);
    const docContent = fs.readFileSync(assetsDocPath, 'utf-8');

    const files = fs.readdirSync(modelsDir).filter((f) => f.endsWith('.glb'));
    for (const file of files) {
      expect(
        docContent.includes(file),
        `docs/ASSETS.md is missing documentation for model: ${file}`
      ).toBe(true);
    }
  });

  it('characters should contain animation tracks', () => {
    const survivorInfo = parseGlbInfo(path.join(modelsDir, 'survivor.glb'));
    expect(survivorInfo.animationCount).toBeGreaterThan(0);

    const houndInfo = parseGlbInfo(path.join(modelsDir, 'hound.glb'));
    expect(houndInfo.animationCount).toBeGreaterThan(0);

    const lurkerInfo = parseGlbInfo(path.join(modelsDir, 'lurker.glb'));
    expect(lurkerInfo.animationCount).toBeGreaterThan(0);
  });
});
