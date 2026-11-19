export function getForwardFromYaw<T extends { x: number; y: number; z: number }>(
  yaw: number,
  target?: T
): T {
  const out = (target ?? { x: 0, y: 0, z: 0 }) as T;
  out.x = Math.sin(yaw);
  out.y = 0;
  out.z = Math.cos(yaw);
  return out;
}
