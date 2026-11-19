import { describe, it, expect } from 'vitest';
import { TIDE_CONSTANTS } from '../src/data/constants';

export interface TideState {
  timeInCycle: number;
  phase: 'low' | 'warning' | 'high';
  waterLevel: number;
  stormIntensity: number;
  isWarning: boolean;
  isHighTide: boolean;
}

export function computeTideState(timeInCycle: number): TideState {
  const normTime = ((timeInCycle % TIDE_CONSTANTS.CYCLE_DURATION_SEC) + TIDE_CONSTANTS.CYCLE_DURATION_SEC) % TIDE_CONSTANTS.CYCLE_DURATION_SEC;
  
  let phase: 'low' | 'warning' | 'high' = 'low';
  let isWarning = false;
  let isHighTide = false;
  let waterLevel: number = TIDE_CONSTANTS.WATER_LEVEL_LOW;
  let stormIntensity = 0;

  if (normTime < TIDE_CONSTANTS.WARNING_START_SEC) {
    // 0 to 540s (0 to 9 mins): calm low tide
    phase = 'low';
    waterLevel = TIDE_CONSTANTS.WATER_LEVEL_LOW;
    stormIntensity = 0;
  } else if (normTime < TIDE_CONSTANTS.LOW_TIDE_DURATION_SEC) {
    // 540s to 600s (9 to 10 mins): 1-minute warning
    phase = 'warning';
    isWarning = true;
    const warningProgress = (normTime - TIDE_CONSTANTS.WARNING_START_SEC) / TIDE_CONSTANTS.WARNING_DURATION_SEC;
    stormIntensity = warningProgress * 0.3; // rising wind
    waterLevel = TIDE_CONSTANTS.WATER_LEVEL_LOW;
  } else {
    // 600s to 900s (10 to 15 mins): high tide & monsoon storm
    phase = 'high';
    isHighTide = true;
    const highTideTime = normTime - TIDE_CONSTANTS.LOW_TIDE_DURATION_SEC;
    if (highTideTime < TIDE_CONSTANTS.TRANSITION_LERP_SEC) {
      // Lerp water level up
      const progress = highTideTime / TIDE_CONSTANTS.TRANSITION_LERP_SEC;
      waterLevel = TIDE_CONSTANTS.WATER_LEVEL_LOW + (TIDE_CONSTANTS.WATER_LEVEL_HIGH - TIDE_CONSTANTS.WATER_LEVEL_LOW) * progress;
      stormIntensity = 0.3 + 0.7 * progress;
    } else if (highTideTime > TIDE_CONSTANTS.HIGH_TIDE_DURATION_SEC - TIDE_CONSTANTS.TRANSITION_LERP_SEC) {
      // Lerp water level down at end of high tide
      const progress = (TIDE_CONSTANTS.HIGH_TIDE_DURATION_SEC - highTideTime) / TIDE_CONSTANTS.TRANSITION_LERP_SEC;
      waterLevel = TIDE_CONSTANTS.WATER_LEVEL_LOW + (TIDE_CONSTANTS.WATER_LEVEL_HIGH - TIDE_CONSTANTS.WATER_LEVEL_LOW) * progress;
      stormIntensity = progress;
    } else {
      waterLevel = TIDE_CONSTANTS.WATER_LEVEL_HIGH;
      stormIntensity = 1.0;
    }
  }

  return {
    timeInCycle: normTime,
    phase,
    waterLevel,
    stormIntensity,
    isWarning,
    isHighTide,
  };
}

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
