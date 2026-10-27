export const movementArea = { width: 5.6, height: 3.8 };
export function dragTarget(
  origin: { x: number; y: number },
  dx: number,
  dy: number,
  screenWidth: number,
) {
  const scale = (movementArea.width * 3.5) / Math.max(1, screenWidth);
  const point = constrainMovement(origin.x + dx * scale, origin.y - dy * scale, 0, 0);
  return { x: point.x, y: point.y };
}
export function steeringVelocity(
  velocity: number,
  input: number,
  speed: number,
  force: number,
  dt: number,
) {
  const target = input * speed + force / 5.5;
  return target + (velocity - target) * Math.exp(-28 * dt);
}
export function constrainMovement(x: number, y: number, vx: number, vy: number) {
  const radius = Math.hypot(x / movementArea.width, y / movementArea.height);
  if (radius <= 1) return { x, y, vx, vy };
  x /= radius;
  y /= radius;
  const nx = x / (movementArea.width * movementArea.width);
  const ny = y / (movementArea.height * movementArea.height);
  const outward = Math.max(0, (vx * nx + vy * ny) / (nx * nx + ny * ny));
  return { x, y, vx: vx - outward * nx, vy: vy - outward * ny };
}
