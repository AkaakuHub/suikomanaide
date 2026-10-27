import { collisionRadius } from "./collision";
import { movementArea } from "./movement";
import type { EntityKind } from "./model";

export function safeLane(station: number) {
  return {
    x: Math.sin(station / 260) * 1.15 + Math.sin(station / 530) * 0.35,
    y: Math.sin(station / 350) * 0.6,
  };
}
export function placeOutsideLane(
  kind: EntityKind,
  station: number,
  candidate: { x: number; y: number },
) {
  if (kind !== "hazard" && kind !== "reverse" && kind !== "confusion" && kind !== "portal")
    return candidate;
  const lane = [-40, 0, 40].map((offset) => safeLane(station + offset));
  const clearance = collisionRadius(kind) + 0.85;
  const clears = (point: { x: number; y: number }) =>
    lane.every((center) => Math.hypot(point.x - center.x, point.y - center.y) >= clearance);
  if (clears(candidate)) return candidate;
  let best = null;
  let nearest = Infinity;
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const point = {
      x: Math.cos(angle) * movementArea.width * 0.86,
      y: Math.sin(angle) * movementArea.height * 0.86,
    };
    const distance = Math.hypot(point.x - candidate.x, point.y - candidate.y);
    if (clears(point) && distance < nearest) {
      best = point;
      nearest = distance;
    }
  }
  if (!best) throw new Error("通過経路を確保できません。");
  return best;
}
