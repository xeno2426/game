import { VITALS_CONSTANTS } from '../data/constants';

export interface VitalsState {
  health: number;
  hydration: number;
  hunger: number;
  exposure: number;
  stamina: number;
  isDead: boolean;
}

export function createInitialVitals(): VitalsState {
  return {
    health: VITALS_CONSTANTS.MAX_HEALTH,
    hydration: VITALS_CONSTANTS.MAX_HYDRATION,
    hunger: VITALS_CONSTANTS.MAX_HUNGER,
    exposure: 0,
    stamina: VITALS_CONSTANTS.MAX_STAMINA,
    isDead: false,
  };
}

export function updateVitals(
  vitals: VitalsState,
  dt: number,
  flags: {
    isSprinting?: boolean;
    isSwimming?: boolean;
    isInStorm?: boolean;
    isNearCampfire?: boolean;
    isUnderRoof?: boolean;
    isActing?: boolean;
  }
): void {
  if (vitals.isDead) return;

  // Hydration drain
  const hydDrain = flags.isSprinting
    ? VITALS_CONSTANTS.HYDRATION_DRAIN_SPRINT
    : VITALS_CONSTANTS.HYDRATION_DRAIN_IDLE;
  vitals.hydration = Math.max(0, vitals.hydration - hydDrain * dt);

  // Hunger drain
  const hngDrain = flags.isActing
    ? VITALS_CONSTANTS.HUNGER_DRAIN_ACTION
    : VITALS_CONSTANTS.HUNGER_DRAIN_IDLE;
  vitals.hunger = Math.max(0, vitals.hunger - hngDrain * dt);

  // Exposure
  if (flags.isSwimming) {
    vitals.exposure = Math.min(
      VITALS_CONSTANTS.MAX_EXPOSURE,
      vitals.exposure + VITALS_CONSTANTS.EXPOSURE_RISE_SWIM * dt
    );
  } else if (flags.isInStorm && !flags.isUnderRoof) {
    vitals.exposure = Math.min(
      VITALS_CONSTANTS.MAX_EXPOSURE,
      vitals.exposure + VITALS_CONSTANTS.EXPOSURE_RISE_STORM * dt
    );
  } else if (flags.isNearCampfire) {
    vitals.exposure = Math.max(0, vitals.exposure - VITALS_CONSTANTS.EXPOSURE_DROP_CAMPFIRE * dt);
  } else if (flags.isUnderRoof) {
    vitals.exposure = Math.max(0, vitals.exposure - VITALS_CONSTANTS.EXPOSURE_DROP_ROOF * dt);
  }

  // Stamina cap and regen
  const maxStamina =
    vitals.hydration === 0 ? VITALS_CONSTANTS.MAX_STAMINA / 2 : VITALS_CONSTANTS.MAX_STAMINA;
  const stamRegenRate =
    vitals.exposure >= 100
      ? VITALS_CONSTANTS.STAMINA_REGEN_PER_SEC * 0.5
      : VITALS_CONSTANTS.STAMINA_REGEN_PER_SEC;

  if (flags.isSprinting && vitals.stamina > 0) {
    vitals.stamina = Math.max(
      0,
      vitals.stamina - VITALS_CONSTANTS.STAMINA_SPRINT_DRAIN_PER_SEC * dt
    );
  } else {
    vitals.stamina = Math.min(maxStamina, vitals.stamina + stamRegenRate * dt);
  }

  // Health drain / regen
  let healthDelta = 0;
  if (vitals.hydration === 0) healthDelta -= VITALS_CONSTANTS.CRITICAL_DAMAGE_PER_SEC;
  if (vitals.hunger === 0) healthDelta -= VITALS_CONSTANTS.CRITICAL_DAMAGE_PER_SEC;
  if (vitals.exposure >= 100) healthDelta -= VITALS_CONSTANTS.CRITICAL_DAMAGE_PER_SEC;

  if (healthDelta === 0 && vitals.hunger > 50 && vitals.hydration > 50) {
    healthDelta += VITALS_CONSTANTS.PASSIVE_HEALTH_REGEN_PER_SEC;
  }

  vitals.health = Math.max(
    0,
    Math.min(VITALS_CONSTANTS.MAX_HEALTH, vitals.health + healthDelta * dt)
  );

  if (vitals.health <= 0) {
    vitals.isDead = true;
  }
}
