export type IconName =
  | 'health'
  | 'hydration'
  | 'hunger'
  | 'exposure'
  | 'tide'
  | 'tideAlert'
  | 'interact'
  | 'jump'
  | 'dodge'
  | 'attack'
  | 'slingshot'
  | 'build'
  | 'rotate'
  | 'cameraView'
  | 'inventory'
  | 'craft'
  | 'campfire'
  | 'rainCollector'
  | 'foundation'
  | 'stilts'
  | 'wall'
  | 'door'
  | 'roof'
  | 'raft'
  | 'wood'
  | 'scrap'
  | 'barrel'
  | 'circuit'
  | 'battery'
  | 'copper'
  | 'medkit'
  | 'food'
  | 'waterBottle'
  | 'axe'
  | 'close'
  | 'checkmark';

const SVG_PATHS: Record<IconName, string> = {
  health:
    '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  hydration:
    '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>',
  hunger:
    '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/><path d="M12 8v8"/>',
  exposure:
    '<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/><path d="M4 14.89 8 11"/><path d="M20 14.89 16 11"/>',
  tide:
    '<path d="M2 12c2.5 0 2.5-3 5-3s2.5 3 5 3 2.5-3 5-3 2.5 3 5 3"/><path d="M2 18c2.5 0 2.5-3 5-3s2.5 3 5 3 2.5-3 5-3 2.5 3 5 3"/>',
  tideAlert:
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  interact:
    '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>',
  jump:
    '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
  dodge:
    '<path d="m13 17 5-5-5-5"/><path d="m6 17 5-5-5-5"/>',
  attack:
    '<path d="m14.5 17.5 3 3 4-4-3-3"/><path d="m4 20 10.5-10.5"/><path d="m11.5 6.5 3 3"/><path d="m16 4 4 4"/>',
  slingshot:
    '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>',
  build:
    '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/>',
  rotate:
    '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
  cameraView:
    '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  inventory:
    '<path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M4 14h16"/>',
  craft:
    '<path d="m14 7 3-3 3 3-3 3z"/><path d="m9 12 3-3 3 3-3 3z"/><path d="m4 17 3-3 3 3-3 3z"/>',
  campfire:
    '<path d="M12 2c1 3 4 5 4 9a6 6 0 0 1-12 0c0-4 3-6 4-9 1 2 3 3 4 0Z"/><path d="m4 21 16-4"/><path d="m20 21-16-4"/>',
  rainCollector:
    '<path d="m4 4 8 8 8-8"/><path d="M6 12v7a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-7"/>',
  foundation:
    '<rect x="3" y="5" width="18" height="6" rx="1"/><path d="M5 11v8"/><path d="M12 11v8"/><path d="M19 11v8"/>',
  stilts:
    '<path d="M4 5h16"/><path d="M6 5v16"/><path d="M18 5v16"/><path d="M6 13h12"/>',
  wall:
    '<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 10h16"/><path d="M4 16h16"/><path d="M10 4v6"/><path d="M14 10v6"/><path d="M9 16v4"/>',
  door:
    '<path d="M6 3h12a1 1 0 0 1 1 1v17H5V4a1 1 0 0 1 1-1Z"/><circle cx="15" cy="13" r="1"/>',
  roof:
    '<path d="m2 14 10-10 10 10"/><path d="M5 12v8h14v-8"/>',
  raft:
    '<path d="M3 17h18"/><path d="M5 17a2 2 0 0 1 4 0 2 2 0 0 1 4 0 2 2 0 0 1 4 0"/><path d="M12 4v13"/><path d="m12 6 6 4-6 2"/>',
  wood:
    '<path d="M6 4h12v16H6z"/><path d="M6 8h12"/><path d="M6 16h12"/>',
  scrap:
    '<circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3m-3.5-6.5-2.2 2.2m-8.6 8.6-2.2 2.2m0-13 2.2 2.2m8.6 8.6 2.2 2.2"/>',
  barrel:
    '<path d="M6 6c0-1.1 2.7-2 6-2s6 .9 6 2v12c0 1.1-2.7 2-6 2s-6-.9-6-2z"/><path d="M6 10c0 1.1 2.7 2 6 2s6-.9 6-2"/><path d="M6 14c0 1.1 2.7 2 6 2s6-.9 6-2"/>',
  circuit:
    '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/><path d="M9 4v3"/><path d="M15 4v3"/><path d="M9 17v3"/><path d="M15 17v3"/>',
  battery:
    '<rect x="2" y="7" width="18" height="12" rx="2"/><line x1="22" y1="11" x2="22" y2="15"/><line x1="7" y1="11" x2="7" y2="15"/><line x1="11" y1="13" x2="15" y2="13"/>',
  copper:
    '<path d="M4 12a8 8 0 0 1 16 0"/><path d="M7 12a5 5 0 0 1 10 0"/><circle cx="12" cy="12" r="2"/>',
  medkit:
    '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M12 10v6"/><path d="M9 13h6"/>',
  food:
    '<path d="M18 6a6 6 0 0 0-10 6l-4 4a2 2 0 0 0 3 3l4-4a6 6 0 0 0 7-9Z"/>',
  waterBottle:
    '<path d="M9 2h6v3H9z"/><path d="M7 8a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z"/>',
  axe:
    '<path d="m14 4 6 6-4 4-6-6z"/><path d="m5 19 8-8"/>',
  close:
    '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  checkmark:
    '<polyline points="20 6 9 17 4 12"/>',
};

export function getSvgIcon(name: IconName, size = 24, className = 'svg-icon'): string {
  const content = SVG_PATHS[name] || SVG_PATHS.interact;
  return `<svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${content}</svg>`;
}
