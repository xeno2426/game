/**
 * Safe Vibration Haptics wrapper for mobile devices
 */
export class Haptics {
  private static enabled = true;

  public static setEnabled(val: boolean) {
    this.enabled = val;
  }

  public static isEnabled(): boolean {
    return this.enabled;
  }

  private static trigger(pattern: number | number[]) {
    if (!this.enabled) return;
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignore vibration errors on non-supported platforms
    }
  }

  /**
   * Subtle tap on firing
   */
  public static shoot() {
    this.trigger(8);
  }

  /**
   * Impact tap when bullet strikes enemy
   */
  public static hit() {
    this.trigger(20);
  }

  /**
   * Heavy rumble when player takes damage
   */
  public static damage() {
    this.trigger([40, 30, 45]);
  }

  /**
   * Distinct dash burst pulse
   */
  public static dash() {
    this.trigger([25, 20, 25]);
  }

  /**
   * Celebratory pattern on wave clear / level up
   */
  public static levelUp() {
    this.trigger([30, 40, 50, 40, 70]);
  }

  /**
   * Long rumble pattern on game over
   */
  public static gameOver() {
    this.trigger([100, 50, 150]);
  }
}
