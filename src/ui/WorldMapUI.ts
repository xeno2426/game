import { WORLD_SIZE, HALF_WORLD } from '../logic/worldLogic';
import type { WorldGen } from '../world/WorldGen';
import { BiomeType } from '../data/biomes';
import { PALETTE } from '../data/palette';
import { WORLD_LANDMARKS } from '../world/Landmarks';
import { getSvgIcon } from './icons';

export class WorldMapUI {
  public isOpen = false;
  private modal: HTMLElement | null = null;
  private mapCanvas: HTMLCanvasElement | null = null;
  private playerMarker: HTMLElement | null = null;
  private worldGen: WorldGen;

  constructor(worldGen: WorldGen) {
    this.worldGen = worldGen;
    if (typeof document !== 'undefined') {
      this.initUI();
    }
  }

  private initUI(): void {
    this.modal = document.createElement('div');
    this.modal.id = 'world-map-modal';
    this.modal.className = 'hud-interactive';
    this.modal.style.position = 'fixed';
    this.modal.style.inset = '0';
    this.modal.style.zIndex = '35';
    this.modal.style.display = 'none';
    this.modal.style.alignItems = 'center';
    this.modal.style.justifyContent = 'center';
    this.modal.style.background = 'rgba(8, 12, 16, 0.85)';
    this.modal.style.backdropFilter = 'none';

    // Prevent touch pass-through
    this.modal.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (e.target === this.modal) {
        this.close();
      }
    });

    const card = document.createElement('div');
    card.style.position = 'relative';
    card.style.background = 'var(--color-StormSlate)';
    card.style.border = '1px solid var(--color-GunmetalGrey)';
    card.style.borderRadius = '8px';
    card.style.padding = '12px';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.alignItems = 'center';
    card.style.maxWidth = '90vw';
    card.style.maxHeight = '90vh';

    const header = document.createElement('div');
    header.style.width = '100%';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '8px';
    header.style.color = 'var(--color-SeafoamWhite)';
    header.style.fontFamily = 'system-ui, sans-serif';
    header.style.fontSize = '14px';
    header.style.fontWeight = '700';
    header.style.letterSpacing = '1px';

    const title = document.createElement('div');
    title.textContent = 'ARCHIPELAGO SURVEY MAP';
    header.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'hud-interactive';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.color = 'var(--color-SeafoamWhite)';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.width = '32px';
    closeBtn.style.height = '32px';
    closeBtn.innerHTML = getSvgIcon('close', 20);
    closeBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.close();
    });
    header.appendChild(closeBtn);
    card.appendChild(header);

    // Map container (512x512 display container, responsive)
    const mapContainer = document.createElement('div');
    mapContainer.style.position = 'relative';
    mapContainer.style.width = 'min(70vw, 70vh, 440px)';
    mapContainer.style.height = 'min(70vw, 70vh, 440px)';
    mapContainer.style.border = '1px solid var(--color-GunmetalGrey)';
    mapContainer.style.overflow = 'hidden';

    this.mapCanvas = document.createElement('canvas');
    this.mapCanvas.width = 512;
    this.mapCanvas.height = 512;
    this.mapCanvas.style.width = '100%';
    this.mapCanvas.style.height = '100%';
    this.mapCanvas.style.display = 'block';
    mapContainer.appendChild(this.mapCanvas);

    // Render static biome map into canvas
    this.renderBiomeMap(this.mapCanvas);

    // Add landmark markers
    for (let i = 0; i < WORLD_LANDMARKS.length; i++) {
      const lm = WORLD_LANDMARKS[i];
      const lx = ((lm.position[0] + HALF_WORLD) / WORLD_SIZE) * 100;
      const lz = ((lm.position[2] + HALF_WORLD) / WORLD_SIZE) * 100;

      const marker = document.createElement('div');
      marker.style.position = 'absolute';
      marker.style.left = `${lx}%`;
      marker.style.top = `${lz}%`;
      marker.style.width = '8px';
      marker.style.height = '8px';
      marker.style.borderRadius = '50%';
      marker.style.background = 'var(--color-WarningYellow)';
      marker.style.transform = 'translate(-50%, -50%)';
      marker.title = lm.name;
      mapContainer.appendChild(marker);
    }

    // Player marker
    this.playerMarker = document.createElement('div');
    this.playerMarker.style.position = 'absolute';
    this.playerMarker.style.width = '14px';
    this.playerMarker.style.height = '14px';
    this.playerMarker.style.transformOrigin = 'center center';
    this.playerMarker.style.pointerEvents = 'none';
    this.playerMarker.innerHTML = `
      <svg viewBox="0 0 24 24" width="14" height="14" style="filter: drop-shadow(0 0 2px var(--color-VoidBlack));">
        <polygon points="12,2 22,22 12,17 2,22" fill="var(--color-EmberOrange)" stroke="var(--color-SeafoamWhite)" stroke-width="2"/>
      </svg>
    `;
    mapContainer.appendChild(this.playerMarker);

    card.appendChild(mapContainer);
    this.modal.appendChild(card);
    document.body.appendChild(this.modal);
  }

  private renderBiomeMap(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx || !this.worldGen.biomeMap) return;

    const imgData = ctx.createImageData(512, 512);
    const data = imgData.data;

    // Palette hex color lookup table parsed into RGB
    const hexToRgb = (hex: string) => {
      const num = parseInt(hex.replace('#', ''), 16);
      return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
    };

    const colorMap: Record<number, { r: number; g: number; b: number }> = {
      [BiomeType.Ocean]: hexToRgb(PALETTE.AbyssalNavy),
      [BiomeType.PalmBeachCoast]: hexToRgb(PALETTE.SunBleachedSand),
      [BiomeType.DenseJungle]: hexToRgb(PALETTE.DeepJungle),
      [BiomeType.MangroveSwamp]: hexToRgb(PALETTE.WetSilt),
      [BiomeType.RockyHighlands]: hexToRgb(PALETTE.WeatheredSlate),
      [BiomeType.IndustrialHarbour]: hexToRgb(PALETTE.GunmetalGrey),
      [BiomeType.TidalFlats]: hexToRgb(PALETTE.TropicalTeal),
      [BiomeType.OffshoreOilRigs]: hexToRgb(PALETTE.OxidisedRust),
    };

    const mapRes = 1024;
    for (let py = 0; py < 512; py++) {
      const srcY = Math.floor((py / 512) * mapRes);
      for (let px = 0; px < 512; px++) {
        const srcX = Math.floor((px / 512) * mapRes);
        const biomeId = this.worldGen.biomeMap[srcY * mapRes + srcX] ?? BiomeType.Ocean;
        const col = colorMap[biomeId] ?? colorMap[BiomeType.Ocean];

        const idx = (py * 512 + px) * 4;
        data[idx] = col.r;
        data[idx + 1] = col.g;
        data[idx + 2] = col.b;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

  public update(playerX: number, playerZ: number, playerYawRad: number): void {
    if (!this.playerMarker) return;

    const normX = Math.max(0, Math.min(1, (playerX + HALF_WORLD) / WORLD_SIZE));
    const normZ = Math.max(0, Math.min(1, (playerZ + HALF_WORLD) / WORLD_SIZE));

    this.playerMarker.style.left = `${normX * 100}%`;
    this.playerMarker.style.top = `${normZ * 100}%`;

    // Rotate player marker towards yaw heading
    const deg = (playerYawRad * 180) / Math.PI;
    this.playerMarker.style.transform = `translate(-50%, -50%) rotate(${deg}deg)`;
  }

  public open(): void {
    this.isOpen = true;
    if (this.modal) {
      this.modal.style.display = 'flex';
    }
  }

  public close(): void {
    this.isOpen = false;
    if (this.modal) {
      this.modal.style.display = 'none';
    }
  }

  public toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
}
