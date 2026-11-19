import { describe, it, expect } from 'vitest';
import { RECIPES } from '../src/data/recipes';
import { canCraft, craftItem, addItemToInventory, type InventorySlot } from '../src/logic/craftingLogic';

describe('Crafting System', () => {
  it('should validate recipe ingredients and deduct correctly', () => {
    const ropeRecipe = RECIPES.find((r) => r.id === 'craft_rope')!;
    expect(ropeRecipe).toBeDefined();

    const inventory: InventorySlot[] = [
      { itemId: 'palm_frond', count: 5 },
      { itemId: null, count: 0 },
    ];

    expect(canCraft(ropeRecipe, inventory)).toBe(true);

    const crafted = craftItem(ropeRecipe, inventory);
    expect(crafted).toBe(true);

    const frondSlot = inventory.find((s) => s.itemId === 'palm_frond');
    const ropeSlot = inventory.find((s) => s.itemId === 'rope');

    expect(frondSlot?.count).toBe(2);
    expect(ropeSlot?.count).toBe(1);
  });

  it('should enforce station requirements', () => {
    const meatRecipe = RECIPES.find((r) => r.id === 'craft_cooked_meat')!;
    expect(meatRecipe.stationRequired).toBe('campfire');

    const inventory: InventorySlot[] = [
      { itemId: 'raw_meat', count: 2 },
      { itemId: null, count: 0 },
    ];

    expect(canCraft(meatRecipe, inventory, 'none')).toBe(false);
    expect(canCraft(meatRecipe, inventory, 'campfire')).toBe(true);
  });

  it('should respect maxStack in empty slots and spill excess into subsequent empty slots', () => {
    const inventory: InventorySlot[] = [
      { itemId: null, count: 0 },
      { itemId: null, count: 0 },
      { itemId: null, count: 0 },
    ];

    // Add 45 wood logs with maxStack of 20
    const added = addItemToInventory(inventory, 'wood_log', 45, 20);
    expect(added).toBe(true);

    expect(inventory[0]).toEqual({ itemId: 'wood_log', count: 20 });
    expect(inventory[1]).toEqual({ itemId: 'wood_log', count: 20 });
    expect(inventory[2]).toEqual({ itemId: 'wood_log', count: 5 });
  });

  it('should return false if inventory cannot hold entire spill amount', () => {
    const inventory: InventorySlot[] = [
      { itemId: null, count: 0 },
    ];

    // Add 25 items with maxStack of 20 when only 1 slot is open
    const added = addItemToInventory(inventory, 'wood_log', 25, 20);
    expect(added).toBe(false);
    expect(inventory[0]).toEqual({ itemId: 'wood_log', count: 20 });
  });
});
