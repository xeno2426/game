import { describe, it, expect } from 'vitest';
import { computeTideState } from '../src/logic/tideLogic';

describe('Tide Timeline Calculation', () => {
  it('should be in low tide during the first 9 minutes', () => {
    const stateAt0 = computeTideState(0);
    expect(stateAt0.phase).toBe('low');
    expect(stateAt0.waterLevel).toBe(0.0);
    expect(stateAt0.isWarning).toBe(false);

    const stateAt500 = computeTideState(500);
    expect(stateAt500.phase).toBe('low');
    expect(stateAt500.waterLevel).toBe(0.0);
  });

  it('should enter warning phase at 9 minutes (540s) for 60 seconds', () => {
    const stateAt540 = computeTideState(540);
    expect(stateAt540.phase).toBe('warning');
    expect(stateAt540.isWarning).toBe(true);
    expect(stateAt540.waterLevel).toBe(0.0);

    const stateAt599 = computeTideState(599);
    expect(stateAt599.phase).toBe('warning');
    expect(stateAt599.isWarning).toBe(true);
  });

  it('should enter high tide at 10 minutes (600s) and raise water level to 4.5m', () => {
    const stateAt600 = computeTideState(600);
    expect(stateAt600.phase).toBe('high');
    expect(stateAt600.isHighTide).toBe(true);

    const stateAt650 = computeTideState(650);
    expect(stateAt650.waterLevel).toBeCloseTo(4.5, 1);
    expect(stateAt650.stormIntensity).toBe(1.0);
  });

  it('should wrap around after 15 minutes (900s)', () => {
    const stateAt900 = computeTideState(900);
    expect(stateAt900.phase).toBe('low');
    expect(stateAt900.waterLevel).toBe(0.0);

    const stateAt1440 = computeTideState(540 + 900);
    expect(stateAt1440.phase).toBe('warning');
  });
});
