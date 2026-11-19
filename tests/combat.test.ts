import { describe, it, expect } from 'vitest';
import { getForwardFromYaw } from '../src/logic/combatLogic';

describe('Combat and Orientation Math', () => {
  it('should calculate correct forward vector from yaw angles matching player orientation', () => {
    // 0 rad -> forward along +Z
    const fwd0 = getForwardFromYaw(0);
    expect(fwd0.x).toBeCloseTo(0, 5);
    expect(fwd0.y).toBe(0);
    expect(fwd0.z).toBeCloseTo(1, 5);

    // PI/2 rad -> forward along +X
    const fwd90 = getForwardFromYaw(Math.PI / 2);
    expect(fwd90.x).toBeCloseTo(1, 5);
    expect(fwd90.y).toBe(0);
    expect(fwd90.z).toBeCloseTo(0, 5);

    // PI rad -> forward along -Z
    const fwd180 = getForwardFromYaw(Math.PI);
    expect(fwd180.x).toBeCloseTo(0, 5);
    expect(fwd180.y).toBe(0);
    expect(fwd180.z).toBeCloseTo(-1, 5);

    // -PI/2 rad -> forward along -X
    const fwd270 = getForwardFromYaw(-Math.PI / 2);
    expect(fwd270.x).toBeCloseTo(-1, 5);
    expect(fwd270.y).toBe(0);
    expect(fwd270.z).toBeCloseTo(0, 5);
  });

  it('should reuse target vector without extra allocations', () => {
    const target = { x: 0, y: 0, z: 0 };
    const res = getForwardFromYaw(Math.PI / 2, target);
    expect(res).toBe(target);
    expect(target.x).toBeCloseTo(1, 5);
    expect(target.z).toBeCloseTo(0, 5);
  });
});
