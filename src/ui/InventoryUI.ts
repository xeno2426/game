import { getSvgIcon } from './icons';
import { ITEMS } from '../data/items';
import type { CraftingSystem } from '../systems/CraftingSystem';
import type { VitalsSystem } from '../systems/VitalsSystem';

export class InventoryUI {
  private overlay: HTMLElement;
  private craftingSystem: CraftingSystem;
  private vitalsSystem: VitalsSystem;
  public isOpen = false;

  constructor(craftingSystem: CraftingSystem, vitalsSystem: VitalsSystem) {
    this.craftingSystem = craftingSystem;
    this.vitalsSystem = vitalsSystem;

    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.style.display = 'none';

    this.overlay.innerHTML = `
      <div class="ui-panel modal-card">
        <div class="modal-header">
          <span class="modal-title">INVENTORY & CRAFTING</span>
          <button id="modal-close-btn" class="modal-close-btn">
            ${getSvgIcon('close', 20)}
          </button>
        </div>

        <div style="font-size: 12px; font-weight: 600; color: var(--color-seafoam-white); margin-top: 4px;">STORAGE (12 SLOTS)</div>
        <div id="inv-grid" class="inventory-grid"></div>

        <div style="font-size: 12px; font-weight: 600; color: var(--color-seafoam-white); margin-top: 8px;">QUICK CRAFT</div>
        <div id="craft-list" style="display: flex; flex-direction: column; gap: 6px; max-height: 140px; overflow-y: auto;"></div>
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
    this.render();
    this.overlay.style.display = 'flex';
  }

  public close(): void {
    this.isOpen = false;
    this.overlay.style.display = 'none';
  }

  private render(): void {
    const grid = this.overlay.querySelector('#inv-grid') as HTMLElement;
    grid.innerHTML = '';

    this.craftingSystem.inventory.forEach((slot) => {
      const slotEl = document.createElement('div');
      slotEl.className = 'inventory-slot';

      if (slot.itemId && ITEMS[slot.itemId]) {
        const def = ITEMS[slot.itemId];
        slotEl.innerHTML = `
          <div style="pointer-events: none;">${getSvgIcon(def.icon, 28)}</div>
          <div style="font-size: 10px; font-weight: 700; position: absolute; bottom: 2px; right: 4px;">${slot.count > 1 ? slot.count : ''}</div>
        `;

        slotEl.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          // Consume if edible/medical
          if (def.healAmount) {
            this.vitalsSystem.heal(def.healAmount);
            slot.count--;
            if (slot.count === 0) slot.itemId = null;
            this.craftingSystem.updateHUD();
            this.render();
          } else if (def.hydrationAmount || def.hungerAmount) {
            if (def.hydrationAmount) this.vitalsSystem.restoreHydration(def.hydrationAmount);
            if (def.hungerAmount) this.vitalsSystem.restoreHunger(def.hungerAmount);
            slot.count--;
            if (slot.count === 0) slot.itemId = null;
            this.craftingSystem.updateHUD();
            this.render();
          }
        });
      }

      grid.appendChild(slotEl);
    });

    // Render craft list
    const craftList = this.overlay.querySelector('#craft-list') as HTMLElement;
    craftList.innerHTML = '';
    const available = this.craftingSystem.getAvailableRecipes('none');

    available.forEach((recipe) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'center';
      row.style.padding = '6px 8px';
      row.style.backgroundColor = 'var(--color-gunmetal-grey)';
      row.style.borderRadius = '3px';

      row.innerHTML = `
        <span style="font-size: 12px; font-weight: 600;">${recipe.name}</span>
        <button class="action-btn" style="width: auto; height: 28px; padding: 0 10px; border-radius: 3px; font-size: 11px;">CRAFT</button>
      `;

      const btn = row.querySelector('button');
      btn?.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        this.craftingSystem.craft(recipe.id, 'none');
        this.render();
      });

      craftList.appendChild(row);
    });
  }
}
