import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { InputManager } from '../src/core/InputManager';
import { Player } from '../src/entities/Player';
import { MOVEMENT_CONSTANTS, VITALS_CONSTANTS } from '../src/data/constants';
import type { Terrain } from '../src/world/Terrain';

// Minimal mock terrain for Player update testing
const mockTerrain: Terrain = {
  getHeight: () => 0,
} as unknown as Terrain;

describe('Input Latching & Player Mobility (A3, A4, A5)', () => {
  let inputManager: InputManager;

  beforeEach(() => {
    // Reset global events/state
    inputManager = new InputManager();
  });

  it('latches one-shot actions until consumed by the game loop (A3)', () => {
    // Simulate one-shot inputs triggered between updates
    inputManager.state.isInteractPressed = true;
    inputManager.state.isJumpPressed = true;
    inputManager.state.isDodgePressed = true;
    inputManager.state.isRotatePressed = true;
    inputManager.state.isBuildMenuTogglePressed = true;
    inputManager.state.isInventoryTogglePressed = true;
    inputManager.state.isFirstPersonTogglePressed = true;
    inputManager.state.isEscapePressed = true;

    // Simulate keyup / pointerup (must NOT clear one-shot latches)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyE' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyC' }));
    }

    expect(inputManager.state.isInteractPressed).toBe(true);
    expect(inputManager.state.isJumpPressed).toBe(true);
    expect(inputManager.state.isDodgePressed).toBe(true);

    // Consuming them clears them
    expect(inputManager.consumeInteract()).toBe(true);
    expect(inputManager.state.isInteractPressed).toBe(false);

    expect(inputManager.consumeJump()).toBe(true);
    expect(inputManager.state.isJumpPressed).toBe(false);

    expect(inputManager.consumeDodge()).toBe(true);
    expect(inputManager.state.isDodgePressed).toBe(false);

    expect(inputManager.consumeRotate()).toBe(true);
    expect(inputManager.state.isRotatePressed).toBe(false);

    expect(inputManager.consumeBuildMenuToggle()).toBe(true);
    expect(inputManager.state.isBuildMenuTogglePressed).toBe(false);

    expect(inputManager.consumeInventoryToggle()).toBe(true);
    expect(inputManager.state.isInventoryTogglePressed).toBe(false);

    expect(inputManager.consumeFirstPersonToggle()).toBe(true);
    expect(inputManager.state.isFirstPersonTogglePressed).toBe(false);

    expect(inputManager.consumeEscape()).toBe(true);
    expect(inputManager.state.isEscapePressed).toBe(false);
  });

  it('keeps attack level-based and resets held inputs on clearHeldInputs / blur (A4)', () => {
    inputManager.state.isAttackPressed = true;
    inputManager.state.isSprinting = true;
    inputManager.state.moveX = 1;
    inputManager.state.moveZ = 1;

    expect(inputManager.state.isAttackPressed).toBe(true);

    // Clear held inputs on blur or visibility change
    inputManager.clearHeldInputs();
    expect(inputManager.state.isAttackPressed).toBe(false);
    expect(inputManager.state.isSprinting).toBe(false);
    expect(inputManager.state.moveX).toBe(0);
    expect(inputManager.state.moveZ).toBe(0);
  });

  it('jump uses JUMP_VELOCITY with 0.1s coyote time and 0.12s input buffer (A5)', () => {
    const scene = new THREE.Scene();
    const player = new Player(scene);
    player.position.set(0, 0, 0);
    player.velocity.set(0, 0, 0);
    player.isGrounded = true;

    // Normal grounded jump
    inputManager.state.isJumpPressed = true;
    player.update(0.016, inputManager.state, 0, mockTerrain, -10, 100);

    expect(player.velocity.y).toBeCloseTo(MOVEMENT_CONSTANTS.JUMP_VELOCITY - MOVEMENT_CONSTANTS.GRAVITY * 0.016, 1);
    expect(player.isGrounded).toBe(false);

    // In mid-air, coyote timer runs down
    player.velocity.set(0, -2, 0);
    player.isGrounded = false;
    player.coyoteTimer = 0.05; // Still within 0.1s coyote window

    inputManager.state.isJumpPressed = true;
    player.update(0.016, inputManager.state, 0, mockTerrain, -10, 100);
    expect(player.velocity.y).toBeCloseTo(MOVEMENT_CONSTANTS.JUMP_VELOCITY - MOVEMENT_CONSTANTS.GRAVITY * 0.016, 1);

    // Past coyote window, jump cannot trigger immediately
    player.coyoteTimer = 0;
    player.velocity.set(0, -2, 0);
    inputManager.state.isJumpPressed = true; // Buffer jump for landing
    player.update(0.016, inputManager.state, 0, mockTerrain, -10, 100);
    expect(player.velocity.y).toBeLessThan(0); // Not jumped yet
    expect(player.jumpBufferTimer).toBeGreaterThan(0); // Buffered

    // When hitting ground within buffer window, buffered jump triggers
    player.position.y = 0;
    player.isGrounded = true;
    player.update(0.016, inputManager.state, 0, mockTerrain, -10, 100);
    expect(player.velocity.y).toBeCloseTo(MOVEMENT_CONSTANTS.JUMP_VELOCITY - MOVEMENT_CONSTANTS.GRAVITY * 0.016, 1);
  });

  it('dodge moves in movement direction when moving, backwards when still, and spends stamina only when started (A5)', () => {
    const scene = new THREE.Scene();
    const player = new Player(scene);
    player.position.set(0, 0, 0);
    player.isGrounded = true;

    // 1. Unaffordable dodge does NOT start and spends zero stamina
    inputManager.state.isDodgePressed = true;
    const resultFailed = player.update(0.016, inputManager.state, 0, mockTerrain, -10, 10); // only 10 stamina
    expect(player.isDodging).toBe(false);
    expect(resultFailed.dodgeCost).toBe(0);

    // 2. Dodge while standing still: dodges backwards
    inputManager.state.isDodgePressed = true;
    inputManager.state.moveX = 0;
    inputManager.state.moveZ = 0;
    player.rotationY = 0; // Facing negative Z (forward = 0, 0, -1; backward = 0, 0, 1)

    const resultStandStill = player.update(0.016, inputManager.state, 0, mockTerrain, -10, 100);
    expect(player.isDodging).toBe(true);
    expect(resultStandStill.dodgeCost).toBe(VITALS_CONSTANTS.STAMINA_DODGE_COST);
    // Backwards movement in Z is positive
    expect(player.position.z).toBeGreaterThan(0);

    // Wait until dodge completes
    player.isDodging = false;
    player.dodgeTimer = 0;
    player.position.set(0, 0, 0);

    // 3. Dodge while moving forward: dodges along movement direction
    inputManager.state.isDodgePressed = true;
    inputManager.state.moveX = 0;
    inputManager.state.moveZ = -1; // Moving forward (-Z in world when yaw is 0)

    const resultMoving = player.update(0.016, inputManager.state, 0, mockTerrain, -10, 100);
    expect(player.isDodging).toBe(true);
    expect(resultMoving.dodgeCost).toBe(VITALS_CONSTANTS.STAMINA_DODGE_COST);
    expect(player.position.z).toBeLessThan(0); // Forward is -Z
  });
});
