import { describe, it, expect } from 'vitest';
import { computeSocketWorldPos, findBestSnapSocket, type PlacedStructure } from '../src/logic/buildingLogic';

describe('Snap-Grid Building Math', () => {
  it('should correctly calculate world position of sockets for unrotated structure', () => {
    const pos: [number, number, number] = [10, 0, 10];
    const rotY = 0;
    const socketOffset: [number, number, number] = [0, 0, -3];

    const worldPos = computeSocketWorldPos(pos, rotY, socketOffset);
    expect(worldPos).toEqual([10, 0, 7]);
  });

  it('should rotate socket offsets by 90-degree increments', () => {
    const pos: [number, number, number] = [0, 0, 0];
    const rot90 = Math.PI / 2; // 90 degrees
    const socketNorth: [number, number, number] = [0, 0, -3];

    const worldPos = computeSocketWorldPos(pos, rot90, socketNorth);
    // When rotated 90 deg around Y: (0, 0, -3) rotates to (-3, 0, 0)
    expect(worldPos[0]).toBeCloseTo(-3, 2);
    expect(worldPos[1]).toBeCloseTo(0, 2);
    expect(worldPos[2]).toBeCloseTo(0, 2);
  });

  it('should find closest socket when aiming within snap radius', () => {
    const placed: PlacedStructure[] = [
      {
        id: 'stilt-1',
        blueprintId: 'stilts',
        position: [0, 0, 0],
        rotationY: 0,
      },
    ];

    // Stilt top socket is at [0, 3, 0]
    const aimPos: [number, number, number] = [0.2, 3.1, 0.1];
    const snap = findBestSnapSocket(placed, aimPos, 'foundation', 1.5);

    expect(snap).not.toBeNull();
    expect(snap?.socketWorldPos).toEqual([0, 3, 0]);
  });
});
