import { describe, it, expect } from 'vitest';
import { createInitialVitals, updateVitals } from '../src/logic/vitalsLogic';

describe('Vitals System', () => {
  it('should drain hydration faster while sprinting', () => {
    const vIdle = createInitialVitals();
    const vSprint = createInitialVitals();

    updateVitals(vIdle, 10, { isSprinting: false });
    updateVitals(vSprint, 10, { isSprinting: true });

    expect(vSprint.hydration).toBeLessThan(vIdle.hydration);
  });

  it('should halve stamina cap when hydration reaches 0', () => {
    const v = createInitialVitals();
    v.hydration = 0;
    v.stamina = 100;

    updateVitals(v, 1, {});
    expect(v.stamina).toBeLessThanOrEqual(50);
  });

  it('should rapidly increase exposure in storm, and reduce near campfire', () => {
    const v = createInitialVitals();
    updateVitals(v, 10, { isInStorm: true });
    expect(v.exposure).toBeGreaterThan(20);

    updateVitals(v, 10, { isNearCampfire: true });
    expect(v.exposure).toBeLessThan(20);
  });

  it('should drain health when vitals hit critical levels', () => {
    const v = createInitialVitals();
    v.hydration = 0;
    v.hunger = 0;
    v.exposure = 100;

    const initialHealth = v.health;
    updateVitals(v, 5, {});
    expect(v.health).toBeLessThan(initialHealth);
  });
});
