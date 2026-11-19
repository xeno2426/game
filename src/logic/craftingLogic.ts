import type { CraftingRecipe } from '../data/recipes';

export interface InventorySlot {
  itemId: string | null;
  count: number;
}

export function canCraft(
  recipe: CraftingRecipe,
  inventory: InventorySlot[],
  currentStation: 'none' | 'workbench' | 'campfire' = 'none'
): boolean {
  if (
    recipe.stationRequired &&
    recipe.stationRequired !== 'none' &&
    recipe.stationRequired !== currentStation
  ) {
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
