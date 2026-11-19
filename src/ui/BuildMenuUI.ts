import { BLUEPRINTS } from '../data/blueprints';
import { getSvgIcon } from './icons';
import type { BuildingSystem } from '../systems/BuildingSystem';

export class BuildMenuUI {
  private container: HTMLElement;
  private backdrop: HTMLElement;
  private buildingSystem: BuildingSystem;
  public isOpen = false;

  constructor(buildingSystem: BuildingSystem) {
    this.buildingSystem = buildingSystem;

    // Full-screen backdrop to dismiss radial menu on outside tap
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'radial-backdrop hud-interactive';
    this.backdrop.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.close();
    });
    document.getElementById('app')?.appendChild(this.backdrop);

    this.container = document.createElement('div');
    this.container.className = 'radial-build-menu hud-interactive';

    const blueprintList = Object.values(BLUEPRINTS);
    const radius = 110; // px from center
    const total = blueprintList.length;

    blueprintList.forEach((bp, index) => {
      const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * radius + 150 - 28; // Center offset in 300px box
      const y = Math.sin(angle) * radius + 150 - 28;

      const itemEl = document.createElement('div');
      itemEl.className = 'radial-item';
      itemEl.style.left = `${x}px`;
      itemEl.style.top = `${y}px`;
      itemEl.title = bp.name;
      itemEl.innerHTML = getSvgIcon(bp.icon, 26);

      itemEl.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        itemEl.classList.add('pressed');
        this.buildingSystem.selectBlueprint(bp.id);
        this.close();
      });

      const releaseHandler = () => itemEl.classList.remove('pressed');
      itemEl.addEventListener('pointerup', releaseHandler);
      itemEl.addEventListener('pointercancel', releaseHandler);

      this.container.appendChild(itemEl);
    });

    // Central cancel item
    const cancelEl = document.createElement('div');
    cancelEl.className = 'radial-item radial-cancel';
    cancelEl.style.left = '122px';
    cancelEl.style.top = '122px';
    cancelEl.title = 'Cancel Build Mode';
    cancelEl.innerHTML = getSvgIcon('close', 26);
    cancelEl.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      cancelEl.classList.add('pressed');
      this.buildingSystem.selectBlueprint(null);
      this.close();
    });
    const releaseCancel = () => cancelEl.classList.remove('pressed');
    cancelEl.addEventListener('pointerup', releaseCancel);
    cancelEl.addEventListener('pointercancel', releaseCancel);

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
    this.backdrop.style.display = 'block';
    this.container.style.display = 'block';
  }

  public close(): void {
    this.isOpen = false;
    this.backdrop.style.display = 'none';
    this.container.style.display = 'none';
  }
}
