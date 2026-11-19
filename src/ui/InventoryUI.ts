import { getSvgIcon } from './icons';
import { ITEMS } from '../data/items';
import { RECIPES } from '../data/recipes';
import { canCraft } from '../logic/craftingLogic';
import type { CraftingSystem } from '../systems/CraftingSystem';
import type { VitalsSystem } from '../systems/VitalsSystem';

export class InventoryUI {
  private overlay: HTMLElement;
  private craftingSystem: CraftingSystem;
  private vitalsSystem: VitalsSystem;
  private getStation?: () => 'none' | 'workbench' | 'campfire';
  private onDropItem?: (itemId: string, count: number) => void;
  public isOpen = false;
  private selectedSlotIndex: number | null = null;

  constructor(
    craftingSystem: CraftingSystem,
    vitalsSystem: VitalsSystem,
    getStation?: () => 'none' | 'workbench' | 'campfire',
    onDropItem?: (itemId: string, count: number) => void
  ) {
    this.craftingSystem = craftingSystem;
    this.vitalsSystem = vitalsSystem;
    this.getStation = getStation;
    this.onDropItem = onDropItem;

    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay hud-interactive';
    this.overlay.style.display = 'none';

    // Tapping outside the card closes the modal
    this.overlay.addEventListener('pointerdown', (e) => {
      if (e.target === this.overlay) {
        e.stopPropagation();
        this.close();
      }
    });

    this.overlay.innerHTML = `
      <div class="ui-panel modal-card">
        <div class="modal-header">
          <span class="modal-title">INVENTORY & CRAFTING</span>
          <button id="modal-close-btn" class="modal-close-btn" title="Close Inventory">
            ${getSvgIcon('close', 24)}
          </button>
        </div>

        <div style="font-size: 12px; font-weight: 600; color: var(--color-seafoam-white); margin-top: 4px;">STORAGE (12 SLOTS)</div>
        <div id="inv-grid" class="inventory-grid"></div>

        <div id="slot-actions-container"></div>

        <div style="font-size: 12px; font-weight: 600; color: var(--color-seafoam-white); margin-top: 8px;">CRAFTING RECIPES</div>
        <div id="craft-list" style="display: flex; flex-direction: column; gap: 8px; max-height: 180px; overflow-y: auto;"></div>
      </div>
    `;

    document.getElementById('app')?.appendChild(this.overlay);

    const closeBtn = this.overlay.querySelector('#modal-close-btn');
    closeBtn?.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.close();
    });
  }

  public toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  public open(): void {
    this.isOpen = true;
    this.selectedSlotIndex = null;
    this.render();
    this.overlay.style.display = 'flex';
  }

  public close(): void {
    this.isOpen = false;
    this.selectedSlotIndex = null;
    this.overlay.style.display = 'none';
  }

  private render(): void {
    const grid = this.overlay.querySelector('#inv-grid') as HTMLElement;
    grid.innerHTML = '';

    this.craftingSystem.inventory.forEach((slot, index) => {
      const slotEl = document.createElement('div');
      slotEl.className = `inventory-slot ${this.selectedSlotIndex === index ? 'selected' : ''}`;
      slotEl.dataset.slotIndex = index.toString();

      if (slot.itemId && ITEMS[slot.itemId]) {
        const def = ITEMS[slot.itemId];
        slotEl.innerHTML = `
          <div style="pointer-events: none;">${getSvgIcon(def.icon, 28)}</div>
          <div style="font-size: 10px; font-weight: 700; position: absolute; bottom: 2px; right: 4px;">${slot.count > 1 ? slot.count : ''}</div>
        `;

        slotEl.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          if (this.selectedSlotIndex === index) {
            this.selectedSlotIndex = null;
          } else {
            this.selectedSlotIndex = index;
          }
          this.render();
        });
      } else {
        slotEl.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          this.selectedSlotIndex = null;
          this.render();
        });
      }

      grid.appendChild(slotEl);
    });

    // Render slot actions if a slot with an item is selected
    const actionsContainer = this.overlay.querySelector('#slot-actions-container') as HTMLElement;
    actionsContainer.innerHTML = '';

    if (this.selectedSlotIndex !== null) {
      const slot = this.craftingSystem.inventory[this.selectedSlotIndex];
      if (slot && slot.itemId && ITEMS[slot.itemId]) {
        const def = ITEMS[slot.itemId];
        const isConsumable = Boolean(def.healAmount || def.hydrationAmount || def.hungerAmount);

        const actionsPanel = document.createElement('div');
        actionsPanel.className = 'slot-actions-panel';
        actionsPanel.innerHTML = `
          <button id="btn-slot-use" class="slot-action-btn ${!isConsumable ? 'disabled' : ''}" ${!isConsumable ? 'disabled' : ''}>
            USE
          </button>
          <button id="btn-slot-equip" class="slot-action-btn">
            EQUIP TO QUICK BAR
          </button>
          <button id="btn-slot-drop" class="slot-action-btn">
            DROP
          </button>
        `;

        const useBtn = actionsPanel.querySelector('#btn-slot-use');
        useBtn?.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          if (!isConsumable) return;
          if (def.healAmount) this.vitalsSystem.heal(def.healAmount);
          if (def.hydrationAmount) this.vitalsSystem.restoreHydration(def.hydrationAmount);
          if (def.hungerAmount) this.vitalsSystem.restoreHunger(def.hungerAmount);

          slot.count--;
          if (slot.count <= 0) {
            slot.itemId = null;
            slot.count = 0;
            this.selectedSlotIndex = null;
          }
          this.craftingSystem.updateHUD();
          this.render();
        });

        const equipBtn = actionsPanel.querySelector('#btn-slot-equip');
        equipBtn?.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          const targetQuickSlot = this.craftingSystem.activeQuickSlot;
          const temp = { ...this.craftingSystem.inventory[targetQuickSlot] };
          this.craftingSystem.inventory[targetQuickSlot] = { ...slot };
          this.craftingSystem.inventory[this.selectedSlotIndex!] = temp;
          this.craftingSystem.updateHUD();
          this.selectedSlotIndex = null;
          this.render();
        });

        const dropBtn = actionsPanel.querySelector('#btn-slot-drop');
        dropBtn?.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          if (slot.itemId && slot.count > 0) {
            const droppedId = slot.itemId;
            const droppedCount = slot.count;
            slot.itemId = null;
            slot.count = 0;
            this.selectedSlotIndex = null;
            this.craftingSystem.updateHUD();
            this.onDropItem?.(droppedId, droppedCount);
            this.render();
          }
        });

        actionsContainer.appendChild(actionsPanel);
      }
    }

    // Render craft list: list all recipes with required items and counts, and disabled CRAFT button when unaffordable
    const craftList = this.overlay.querySelector('#craft-list') as HTMLElement;
    craftList.innerHTML = '';
    const station = this.getStation ? this.getStation() : 'none';

    // Count current inventory items for ingredient display
    const invCounts: Record<string, number> = {};
    for (const s of this.craftingSystem.inventory) {
      if (s.itemId) {
        invCounts[s.itemId] = (invCounts[s.itemId] || 0) + s.count;
      }
    }

    RECIPES.forEach((recipe) => {
      const affordable = canCraft(recipe, this.craftingSystem.inventory, station);

      const ingTexts = recipe.ingredients.map((ing) => {
        const itemDef = ITEMS[ing.itemId];
        const name = itemDef ? itemDef.name : ing.itemId;
        const have = invCounts[ing.itemId] || 0;
        return `${name}: ${have}/${ing.count}`;
      });

      const row = document.createElement('div');
      row.className = `craft-row ${!affordable ? 'unaffordable' : ''}`;

      let stationTag = '';
      if (recipe.stationRequired && recipe.stationRequired !== 'none') {
        const stationName = recipe.stationRequired === 'workbench' ? 'Workbench' : 'Campfire';
        stationTag = ` <span style="font-size: 10px; color: var(--color-warm-amber);">[${stationName}]</span>`;
      }

      row.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <div style="font-size: 13px; font-weight: 700; color: var(--color-seafoam-white);">
            ${recipe.name}${stationTag}
          </div>
          <div style="font-size: 11px; color: var(--color-weathered-slate);">
            ${ingTexts.join(', ')}
          </div>
        </div>
        <button class="craft-btn ${!affordable ? 'disabled' : ''}" ${!affordable ? 'disabled' : ''}>
          CRAFT
        </button>
      `;

      const btn = row.querySelector('.craft-btn');
      if (affordable) {
        btn?.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          this.craftingSystem.craft(recipe.id, station);
          this.render();
        });
      }

      craftList.appendChild(row);
    });
  }
}
