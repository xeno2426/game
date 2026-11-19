import { RECIPES, type CraftingRecipe } from '../data/recipes';
import { canCraft, craftItem, type InventorySlot } from '../logic/craftingLogic';
import { ITEMS } from '../data/items';
import type { HUD } from '../ui/HUD';
import { SoundSynth } from '../audio/SoundSynth';

export class CraftingSystem {
  public inventory: InventorySlot[] = [];
  public activeQuickSlot = 0;
  private hud: HUD;

  constructor(hud: HUD, initialInventory?: InventorySlot[]) {
    this.hud = hud;

    if (initialInventory && initialInventory.length === 12) {
      this.inventory = initialInventory;
    } else {
      // 12-slot mobile inventory, starter kit: scrap axe, coconut, 3 wood logs
      this.inventory = [
        { itemId: 'scrap_axe', count: 1 },
        { itemId: 'coconut', count: 3 },
        { itemId: 'wood_log', count: 5 },
        { itemId: 'scrap_metal', count: 2 },
        { itemId: 'cloth', count: 2 },
        { itemId: null, count: 0 },
        { itemId: null, count: 0 },
        { itemId: null, count: 0 },
        { itemId: null, count: 0 },
        { itemId: null, count: 0 },
        { itemId: null, count: 0 },
        { itemId: null, count: 0 },
      ];
    }

    this.updateHUD();
  }

  public addItem(itemId: string, count = 1): boolean {
    // Try to stack onto existing item
    const def = ITEMS[itemId];
    const maxStack = def ? def.maxStack : 30;

    for (const slot of this.inventory) {
      if (slot.itemId === itemId && slot.count < maxStack) {
        const canTake = maxStack - slot.count;
        const take = Math.min(canTake, count);
        slot.count += take;
        count -= take;
        if (count <= 0) {
          this.updateHUD();
          return true;
        }
      }
    }

    // Put in empty slot
    for (const slot of this.inventory) {
      if (!slot.itemId) {
        slot.itemId = itemId;
        slot.count = count;
        this.updateHUD();
        return true;
      }
    }

    this.updateHUD();
    return false; // Inventory full
  }

  public craft(recipeId: string, station: 'none' | 'workbench' | 'campfire' = 'none'): boolean {
    const recipe = RECIPES.find((r) => r.id === recipeId);
    if (!recipe) return false;

    if (craftItem(recipe, this.inventory, station)) {
      SoundSynth.get().playCraftSuccess();
      this.updateHUD();
      return true;
    }
    return false;
  }

  public getAvailableRecipes(station: 'none' | 'workbench' | 'campfire' = 'none'): CraftingRecipe[] {
    return RECIPES.filter((r) => canCraft(r, this.inventory, station));
  }

  public setActiveQuickSlot(index: number): void {
    if (index >= 0 && index < 5) {
      this.activeQuickSlot = index;
      this.updateHUD();
    }
  }

  public getActiveItem(): string | null {
    return this.inventory[this.activeQuickSlot]?.itemId || null;
  }

  public updateHUD(): void {
    this.hud.updateQuickSlots(this.inventory.slice(0, 5), this.activeQuickSlot);
  }
}
