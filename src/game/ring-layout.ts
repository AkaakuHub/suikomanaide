import { constrainMovement } from "./movement";

export function nextRingPosition(previous: { x: number; y: number }, rollX: number, rollY: number) {
  const x = previous.x * 0.75 + (rollX - 0.5) * 6.2;
  const y = previous.y * 0.75 + (rollY - 0.5) * 4.2;
  const point = constrainMovement(x / 0.85, y / 0.85, 0, 0);
  const dx = point.x * 0.85 - previous.x;
  const dy = point.y * 0.85 - previous.y;
  const scale = Math.min(1, 3.2 / Math.max(0.001, Math.hypot(dx, dy)));
  return { x: previous.x + dx * scale, y: previous.y + dy * scale };
}
