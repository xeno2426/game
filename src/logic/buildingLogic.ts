import { BLUEPRINTS } from '../data/blueprints';
import { BUILDING_CONSTANTS } from '../data/constants';

export interface PlacedStructure {
  id: string;
  blueprintId: string;
  position: [number, number, number];
  rotationY: number; // in radians (0, PI/2, PI, 3*PI/2)
}

export function computeSocketWorldPos(
  structurePos: [number, number, number],
  structureRotY: number,
  socketOffset: [number, number, number]
): [number, number, number] {
  const [ox, oy, oz] = socketOffset;
  const cos = Math.cos(structureRotY);
  const sin = Math.sin(structureRotY);

  const wx = structurePos[0] + (ox * cos + oz * sin);
  const wy = structurePos[1] + oy;
  const wz = structurePos[2] + (-ox * sin + oz * cos);

  return [Math.round(wx * 1000) / 1000, Math.round(wy * 1000) / 1000, Math.round(wz * 1000) / 1000];
}

export function findBestSnapSocket(
  placed: PlacedStructure[],
  aimPos: [number, number, number],
  _blueprintId: string,
  maxDistance: number = BUILDING_CONSTANTS.SOCKET_SNAP_RADIUS
): { structure: PlacedStructure; socketWorldPos: [number, number, number]; distance: number } | null {
  let closest: { structure: PlacedStructure; socketWorldPos: [number, number, number]; distance: number } | null = null;
  let minD: number = maxDistance;

  for (const item of placed) {
    const bp = BLUEPRINTS[item.blueprintId];
    if (!bp) continue;

    for (const socket of bp.sockets) {
      const worldPos = computeSocketWorldPos(item.position, item.rotationY, socket.offset);
      const dx = worldPos[0] - aimPos[0];
      const dy = worldPos[1] - aimPos[1];
      const dz = worldPos[2] - aimPos[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < minD) {
        minD = dist;
        closest = {
          structure: item,
          socketWorldPos: worldPos,
          distance: dist,
        };
      }
    }
  }

  return closest;
}
