import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { GameLoop } from '../src/core/GameLoop';
import { QualityManager } from '../src/core/QualityManager';
import { AssetRegistry } from '../src/entities/AssetRegistry';
import { DebugOverlay } from '../src/ui/DebugOverlay';
import { Water } from '../src/world/Water';

function createMockRenderer() {
  return {
    setPixelRatio: () => {},
    shadowMap: { enabled: true, type: 0 },
    info: { render: { calls: 12, triangles: 4500 } },
  } as unknown as THREE.WebGLRenderer;
}

describe('Group B: Smoothness and Rendering Optimizations', () => {
  it('GameLoop caps fixed steps at 3 per frame and passes alpha & frameDt to render (B1, B2)', () => {
    let updateCount = 0;
    let renderedAlpha = -1;
    let renderedFrameDt = -1;

    const loop = new GameLoop(
      () => {
        updateCount++;
      },
      (alpha, frameDt) => {
        renderedAlpha = alpha;
        renderedFrameDt = frameDt;
      }
    );

    // Simulate 0.5s passing between frames (a massive tab hang / lag spike)
    // GameLoop caps maxFrameTime at 0.1s and max steps at 3.
    // 0.1s / (1/60s) = 6 steps theoretically, but clamped strictly to 3 steps, dropping remainder.
    (loop as any).isRunning = true;
    const now = performance.now();
    (loop as any).lastTime = now - 500;
    (loop as any).tick(now);

    expect(updateCount).toBe(3);
    expect(renderedAlpha).toBeGreaterThanOrEqual(0);
    expect(renderedAlpha).toBeLessThanOrEqual(1);
    expect(renderedFrameDt).toBeGreaterThan(0);
  });

  it('QualityManager applies Low, Medium, High presets and dynamic resolution scaling (B4)', () => {
    const renderer = createMockRenderer();
    const light = new THREE.DirectionalLight();

    const qm = new QualityManager(renderer, light);

    // High preset
    qm.applyPreset('high', false);
    expect(qm.currentPreset).toBe('high');
    expect(qm.shadowsEnabled).toBe(true);

    // Medium preset
    qm.applyPreset('medium', false);
    expect(qm.currentPreset).toBe('medium');
    expect(qm.shadowsEnabled).toBe(true);

    // Low preset disables shadows (B3, B4)
    qm.applyPreset('low', false);
    expect(qm.currentPreset).toBe('low');
    expect(qm.shadowsEnabled).toBe(false);
    expect(light.castShadow).toBe(false);
    expect(renderer.shadowMap.enabled).toBe(false);

    // High frame times (> 24ms) shut off shadows automatically
    qm.applyPreset('medium', false);
    expect(qm.shadowsEnabled).toBe(true);

    // Record high frame times (> 25ms) across 2+ seconds
    for (let i = 0; i < 100; i++) {
      qm.recordFrame(30.0, i * 0.03);
    }
    qm.recordFrame(30.0, 3.0);
    expect(qm.shadowsEnabled).toBe(false);
  });

  it('AssetRegistry shares one MeshLambertMaterial and merges static geometry per prop (B5)', () => {
    const registry = AssetRegistry.get();
    const mat = registry.getAtlasMaterial();

    expect(mat).toBeInstanceOf(THREE.MeshLambertMaterial);

    // Palm tree: single merged mesh inside the group instead of 6 separate meshes
    const palm = registry.createPalmTree();
    expect(palm.children.length).toBe(1);
    expect((palm.children[0] as THREE.Mesh).isMesh).toBe(true);
    expect((palm.children[0] as THREE.Mesh).material).toBe(mat);

    // Scrap pile: single merged mesh inside the group
    const scrap = registry.createScrapPile();
    expect(scrap.children.length).toBe(1);
    expect((scrap.children[0] as THREE.Mesh).isMesh).toBe(true);

    // Raft: single merged mesh (deck + 4 barrels + mast + sail)
    const raft = registry.createRaft();
    expect(raft.children.length).toBe(1);
    expect((raft.children[0] as THREE.Mesh).isMesh).toBe(true);

    // Feral Hound: single merged mesh
    const hound = registry.createHound();
    expect(hound.children.length).toBe(1);
    expect((hound.children[0] as THREE.Mesh).isMesh).toBe(true);

    // Calling createPalmTree again reuses the cached BufferGeometry
    const palm2 = registry.createPalmTree();
    const geo1 = (palm.children[0] as THREE.Mesh).geometry;
    const geo2 = (palm2.children[0] as THREE.Mesh).geometry;
    expect(geo1).toBe(geo2);
  });

  it('DebugOverlay computes avgDt, P95, and counts frame spikes over 25ms in last 10s (B9)', () => {
    const overlay = new DebugOverlay();
    overlay.isEnabled = true;
    const mockEl = { textContent: '' } as any;
    (overlay as any).el = mockEl;

    // Simulate 100 frames with varying latencies
    for (let i = 0; i < 90; i++) {
      overlay.recordFrame(16.0); // 90 normal frames
    }
    for (let i = 0; i < 10; i++) {
      overlay.recordFrame(32.0); // 10 spike frames (> 25ms)
    }

    const renderer = createMockRenderer();

    // Force update
    (overlay as any).lastUpdate = performance.now() - 600;
    overlay.update(renderer, 'low', 300, 0, new THREE.Vector3(0, 0, 0), 'high', 1.5);

    const text = mockEl.textContent;
    expect(text).toContain('FPS:');
    expect(text).toContain('Avg:');
    expect(text).toContain('P95:');
    expect(text).toContain('Frames > 25ms (last 10s): 10');
    expect(text).toContain('Quality: HIGH');
    expect(text).toContain('Pixel Ratio: 1.50');
  });

  it('Water mesh snaps to vertex grid when following player (B6)', () => {
    const scene = new THREE.Scene();
    const water = new Water(scene);

    const gridSize = 260.0 / 90; // ~2.8888m
    const playerPos = new THREE.Vector3(14.7, 0, 22.3);

    water.update(10.0, 1.5, playerPos);

    const expectedX = Math.floor(playerPos.x / gridSize) * gridSize;
    const expectedZ = Math.floor(playerPos.z / gridSize) * gridSize;

    expect(water.mesh.position.x).toBeCloseTo(expectedX, 5);
    expect(water.mesh.position.z).toBeCloseTo(expectedZ, 5);
  });
});
