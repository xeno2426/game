import { describe, it, expect } from 'vitest';
import { RECIPES, type CraftingRecipe } from '../src/data/recipes';

export interface InventorySlot {
  itemId: string | null;
  count: number;
}

export function canCraft(
  recipe: CraftingRecipe,
  inventory: InventorySlot[],
  currentStation: 'none' | 'workbench' | 'campfire' = 'none'
): boolean {
  if (recipe.stationRequired && recipe.stationRequired !== 'none' && recipe.stationRequired !== currentStation) {
    return false;
  }

  // Count available items in inventory
  const counts: Record<string, number> = {};
  for (const slot of inventory) {
    if (slot.itemId) {
      counts[slot.itemId] = (counts[slot.itemId] || 0) + slot.count;
    }
  }

  for (const ing of recipe.ingredients) {
    if ((counts[ing.itemId] || 0) < ing.count) {
      return false;
    }
  }

  return true;
}

export function craftItem(
  recipe: CraftingRecipe,
  inventory: InventorySlot[],
  currentStation: 'none' | 'workbench' | 'campfire' = 'none'
): boolean {
  if (!canCraft(recipe, inventory, currentStation)) {
    return false;
  }

  // Deduct ingredients
  for (const ing of recipe.ingredients) {
    let remaining = ing.count;
    for (const slot of inventory) {
      if (slot.itemId === ing.itemId) {
        const take = Math.min(slot.count, remaining);
        slot.count -= take;
        remaining -= take;
        if (slot.count === 0) {
          slot.itemId = null;
        }
        if (remaining <= 0) break;
      }
    }
  }

  // Add output item
  let added = false;
  for (const slot of inventory) {
    if (slot.itemId === recipe.outputItemId) {
      slot.count += recipe.outputCount;
      added = true;
      break;
    }
  }
  if (!added) {
    for (const slot of inventory) {
      if (!slot.itemId) {
        slot.itemId = recipe.outputItemId;
        slot.count = recipe.outputCount;
        added = true;
        break;
      }
    }
  }

  return added;
}

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
});
