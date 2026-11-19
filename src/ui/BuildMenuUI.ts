import { BLUEPRINTS } from '../data/blueprints';
import { getSvgIcon } from './icons';
import type { BuildingSystem } from '../systems/BuildingSystem';

export class BuildMenuUI {
  private container: HTMLElement;
  private buildingSystem: BuildingSystem;
  public isOpen = false;

  constructor(buildingSystem: BuildingSystem) {
    this.buildingSystem = buildingSystem;

    this.container = document.createElement('div');
    this.container.className = 'radial-build-menu hud-interactive';

    const blueprintList = Object.values(BLUEPRINTS);
    const radius = 105; // px from center
    const total = blueprintList.length;

    blueprintList.forEach((bp, index) => {
      const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * radius + 140 - 26; // Center offset
      const y = Math.sin(angle) * radius + 140 - 26;

      const itemEl = document.createElement('div');
      itemEl.className = 'radial-item';
      itemEl.style.left = `${x}px`;
      itemEl.style.top = `${y}px`;
      itemEl.title = bp.name;
      itemEl.innerHTML = getSvgIcon(bp.icon, 24);

      itemEl.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        this.buildingSystem.selectBlueprint(bp.id);
        this.close();
      });

      this.container.appendChild(itemEl);
    });

    // Central cancel item
    const cancelEl = document.createElement('div');
    cancelEl.className = 'radial-item radial-cancel';
    cancelEl.style.left = `${140 - 26}px`;
    cancelEl.style.top = `${140 - 26}px`;
    cancelEl.title = 'Cancel Build Mode';
    cancelEl.innerHTML = getSvgIcon('close', 24);
    cancelEl.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.buildingSystem.selectBlueprint(null);
      this.close();
    });
    this.container.appendChild(cancelEl);

    document.getElementById('app')?.appendChild(this.container);
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
    this.container.style.display = 'block';
  }

  public close(): void {
    this.isOpen = false;
    this.container.style.display = 'none';
  }
}
