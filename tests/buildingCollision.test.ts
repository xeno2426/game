import { describe, it, expect } from 'vitest';
import {
  computeGroundHeight,
  computeStructureAABBs,
  resolveHorizontalCollision,
  type StructureAABB,
  type PlacedStructure,
} from '../src/logic/buildingLogic';

describe('Building Collision and Ground Height Logic', () => {
  it('should return terrain height when no structures are present', () => {
    const structures: PlacedStructure[] = [];
    const h = computeGroundHeight(2.5, structures, 10, 2.5, 10);
    expect(h).toBe(2.5);
  });

  it('should elevate groundHeight when standing on a foundation', () => {
    const structures: PlacedStructure[] = [
      {
        id: 'f1',
        blueprintId: 'foundation',
        position: [0, 1.0, 0],
        rotationY: 0,
      },
    ];
    // Foundation top is 1.0 + 0.2 = 1.2
    const h = computeGroundHeight(0, structures, 0.5, 1.3, -0.5);
    expect(h).toBeCloseTo(1.2, 2);
  });

  it('should elevate groundHeight when standing atop stilts', () => {
    const structures: PlacedStructure[] = [
      {
        id: 's1',
        blueprintId: 'stilts',
        position: [5, 0, 5],
        rotationY: 0,
      },
    ];
    // Stilts top is 0 + 3.0 = 3.0
    const h = computeGroundHeight(0, structures, 5.2, 3.1, 4.8);
    expect(h).toBeCloseTo(3.0, 2);
  });

  it('should not elevate groundHeight when walking beneath stilts', () => {
    const structures: PlacedStructure[] = [
      {
        id: 's1',
        blueprintId: 'stilts',
        position: [5, 0, 5],
        rotationY: 0,
      },
    ];
    // Player is at y = 0.2, beneath 3.0m stilts
    const h = computeGroundHeight(0, structures, 5.2, 0.2, 4.8);
    expect(h).toBe(0);
  });

  it('should compute correct AABBs for unrotated and 90-degree rotated walls', () => {
    const wallUnrotated: PlacedStructure = {
      id: 'w1',
      blueprintId: 'wall',
      position: [0, 0, 0],
      rotationY: 0,
    };
    const aabbs1 = computeStructureAABBs(wallUnrotated);
    expect(aabbs1.length).toBe(1);
    expect(aabbs1[0].minX).toBeCloseTo(-1.5, 2);
    expect(aabbs1[0].maxX).toBeCloseTo(1.5, 2);
    expect(aabbs1[0].minZ).toBeCloseTo(-0.15, 2);
    expect(aabbs1[0].maxZ).toBeCloseTo(0.15, 2);

    const wallRotated: PlacedStructure = {
      id: 'w2',
      blueprintId: 'wall',
      position: [0, 0, 0],
      rotationY: Math.PI / 2,
    };
    const aabbs2 = computeStructureAABBs(wallRotated);
    expect(aabbs2.length).toBe(1);
    expect(aabbs2[0].minX).toBeCloseTo(-0.15, 2);
    expect(aabbs2[0].maxX).toBeCloseTo(0.15, 2);
    expect(aabbs2[0].minZ).toBeCloseTo(-1.5, 2);
    expect(aabbs2[0].maxZ).toBeCloseTo(1.5, 2);
  });

  it('should compute two side post AABBs for doorframes to allow passage in center', () => {
    const doorframe: PlacedStructure = {
      id: 'd1',
      blueprintId: 'doorframe',
      position: [0, 0, 0],
      rotationY: 0,
    };
    const aabbs = computeStructureAABBs(doorframe);
    expect(aabbs.length).toBe(2);

    // Left post: -1.5 to -0.6
    expect(aabbs[0].minX).toBeCloseTo(-1.5, 2);
    expect(aabbs[0].maxX).toBeCloseTo(-0.6, 2);

    // Right post: 0.6 to 1.5
    expect(aabbs[1].minX).toBeCloseTo(0.6, 2);
    expect(aabbs[1].maxX).toBeCloseTo(1.5, 2);
  });

  it('should push player out when colliding horizontally with a wall', () => {
    const wallAABB: StructureAABB = {
      minX: -1.5,
      maxX: 1.5,
      minY: 0,
      maxY: 3.0,
      minZ: -0.15,
      maxZ: 0.15,
    };
    // Player radius 0.5 at (0, 0.5, 0.3) overlaps with wall maxZ (0.15)
    const playerPos = { x: 0, y: 0.5, z: 0.3 };
    const collided = resolveHorizontalCollision(playerPos, 0.5, [wallAABB]);
    expect(collided).toBe(true);
    expect(playerPos.z).toBeGreaterThanOrEqual(0.65 - 0.001);
  });

  it('should allow player to pass unobstructed through center of doorframe', () => {
    const doorframe: PlacedStructure = {
      id: 'd1',
      blueprintId: 'doorframe',
      position: [0, 0, 0],
      rotationY: 0,
    };
    const aabbs = computeStructureAABBs(doorframe);
    // Player passes directly through x = 0
    const playerPos = { x: 0, y: 0.5, z: 0 };
    const collided = resolveHorizontalCollision(playerPos, 0.5, aabbs);
    expect(collided).toBe(false);
    expect(playerPos.x).toBe(0);
    expect(playerPos.z).toBe(0);
  });
});
