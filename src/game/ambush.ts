import { clamp } from "./model";
import { placeOutsideLane } from "./placement";

export interface RingWaypoint {
  station: number;
  x: number;
  y: number;
}
export function ringRouteAmbush(
  kind: "reverse" | "confusion",
  rings: readonly RingWaypoint[],
  station: number,
  roll: number,
) {
  let best: RingWaypoint | null = null;
  let nearest = Infinity;
  for (let i = 1; i < rings.length; i++) {
    const from = rings[i - 1];
    const to = rings[i];
    if (to.station - from.station < 110) continue;
    const at = clamp(station + (roll - 0.5) * 24, from.station + 50, to.station - 50);
    const distance = Math.abs(at - station);
    if (distance > 100 || distance >= nearest) continue;
    const t = (at - from.station) / (to.station - from.station);
    const route = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
    const point = placeOutsideLane(kind, at, route);
    if (Math.hypot(point.x - route.x, point.y - route.y) > 0.8) continue;
    best = { ...point, station: at };
    nearest = distance;
  }
  return best;
}
