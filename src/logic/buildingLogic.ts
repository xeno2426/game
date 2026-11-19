import { BLUEPRINTS } from '../data/blueprints';
import { BUILDING_CONSTANTS } from '../data/constants';

export interface PlacedStructure {
  id: string;
  blueprintId: string;
  position: [number, number, number];
  rotationY: number; // in radians (0, PI/2, PI, 3*PI/2)
}

export interface StructureAABB {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
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

export function computeStructureAABBs(struct: PlacedStructure): StructureAABB[] {
  const [x, y, z] = struct.position;
  const rot = struct.rotationY || 0;
  const isRotated90 = Math.abs(Math.sin(rot)) > 0.5;

  if (struct.blueprintId === 'wall') {
    const halfWidth = 1.5;
    const halfThick = 0.15;
    const height = 3.0;

    if (isRotated90) {
      return [
        {
          minX: x - halfThick,
          maxX: x + halfThick,
          minY: y,
          maxY: y + height,
          minZ: z - halfWidth,
          maxZ: z + halfWidth,
        },
      ];
    } else {
      return [
        {
          minX: x - halfWidth,
          maxX: x + halfWidth,
          minY: y,
          maxY: y + height,
          minZ: z - halfThick,
          maxZ: z + halfThick,
        },
      ];
    }
  }

  if (struct.blueprintId === 'doorframe') {
    const halfThick = 0.15;
    const height = 3.0;

    if (isRotated90) {
      return [
        {
          minX: x - halfThick,
          maxX: x + halfThick,
          minY: y,
          maxY: y + height,
          minZ: z - 1.5,
          maxZ: z - 0.6,
        },
        {
          minX: x - halfThick,
          maxX: x + halfThick,
          minY: y,
          maxY: y + height,
          minZ: z + 0.6,
          maxZ: z + 1.5,
        },
      ];
    } else {
      return [
        {
          minX: x - 1.5,
          maxX: x - 0.6,
          minY: y,
          maxY: y + height,
          minZ: z - halfThick,
          maxZ: z + halfThick,
        },
        {
          minX: x + 0.6,
          maxX: x + 1.5,
          minY: y,
          maxY: y + height,
          minZ: z - halfThick,
          maxZ: z + halfThick,
        },
      ];
    }
  }

  return [];
}

export function computeGroundHeight(
  terrainHeight: number,
  structures: PlacedStructure[],
  x: number,
  y: number,
  z: number,
  stepTolerance = 0.6
): number {
  let maxFloorTop: number | null = null;
  const halfSize = 1.5;

  for (const s of structures) {
    if (s.blueprintId !== 'foundation' && s.blueprintId !== 'stilts') continue;

    if (
      x >= s.position[0] - halfSize &&
      x <= s.position[0] + halfSize &&
      z >= s.position[2] - halfSize &&
      z <= s.position[2] + halfSize
    ) {
      const floorTop = s.blueprintId === 'stilts' ? s.position[1] + 3.0 : s.position[1] + 0.2;
      if (y >= floorTop - stepTolerance) {
        if (maxFloorTop === null || floorTop > maxFloorTop) {
          maxFloorTop = floorTop;
        }
      }
    }
  }

  if (maxFloorTop !== null && maxFloorTop > terrainHeight) {
    return maxFloorTop;
  }
  return terrainHeight;
}

export function resolveHorizontalCollision(
  pos: { x: number; y: number; z: number },
  radius: number,
  aabbs: StructureAABB[]
): boolean {
  let collided = false;

  for (const aabb of aabbs) {
    if (pos.y + 1.8 <= aabb.minY || pos.y >= aabb.maxY) {
      continue;
    }

    const cx = Math.max(aabb.minX, Math.min(pos.x, aabb.maxX));
    const cz = Math.max(aabb.minZ, Math.min(pos.z, aabb.maxZ));

    const dx = pos.x - cx;
    const dz = pos.z - cz;
    const distSq = dx * dx + dz * dz;

    if (distSq < radius * radius) {
      collided = true;
      if (distSq > 0.000001) {
        const dist = Math.sqrt(distSq);
        const overlap = radius - dist;
        pos.x += (dx / dist) * overlap;
        pos.z += (dz / dist) * overlap;
      } else {
        const left = pos.x - aabb.minX;
        const right = aabb.maxX - pos.x;
        const bottom = pos.z - aabb.minZ;
        const top = aabb.maxZ - pos.z;
        const minPen = Math.min(left, right, bottom, top);

        if (minPen === left) pos.x = aabb.minX - radius;
        else if (minPen === right) pos.x = aabb.maxX + radius;
        else if (minPen === bottom) pos.z = aabb.minZ - radius;
        else pos.z = aabb.maxZ + radius;
      }
    }
  }

  return collided;
}
