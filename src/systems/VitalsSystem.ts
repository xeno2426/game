import { createInitialVitals, updateVitals, type VitalsState } from '../../tests/vitals.test';
import type { HUD } from '../ui/HUD';

export class VitalsSystem {
  public vitals: VitalsState;
  private hud: HUD;

  constructor(hud: HUD, initial?: VitalsState) {
    this.hud = hud;
    this.vitals = initial || createInitialVitals();
    this.updateHUD();
  }

  public update(
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
    updateVitals(this.vitals, dt, flags);
    this.updateHUD();
  }

  public takeDamage(amount: number): void {
    this.vitals.health = Math.max(0, this.vitals.health - amount);
    if (this.vitals.health === 0) {
      this.vitals.isDead = true;
    }
    this.updateHUD();
  }

  public heal(amount: number): void {
    this.vitals.health = Math.min(100, this.vitals.health + amount);
    this.updateHUD();
  }

  public restoreHydration(amount: number): void {
    this.vitals.hydration = Math.min(100, this.vitals.hydration + amount);
    this.updateHUD();
  }

  public restoreHunger(amount: number): void {
    this.vitals.hunger = Math.min(100, this.vitals.hunger + amount);
    this.updateHUD();
  }

  public updateHUD(): void {
    this.hud.updateVitals(
      this.vitals.health,
      this.vitals.hydration,
      this.vitals.hunger,
      this.vitals.exposure
    );
  }
}
