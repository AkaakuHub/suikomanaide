import type { ZoneKind } from "./zones";
import { clamp } from "./model";

export function flightDifficulty(distance: number, zone: ZoneKind | null = null) {
  const progress = clamp((distance - 500) / 4500, 0, 1);
  return {
    hazardSpacing: (150 - progress * 90) * (zone === "mines" ? 0.45 : zone === "drains" ? 1.3 : 1),
    movingHazardChance: distance < 2500 ? 0 : 0.15 + clamp((distance - 2500) / 4500, 0, 1) * 0.6,
    pairedHazardChance: Math.min(0.85, progress * 0.6 + (zone === "mines" ? 0.25 : 0)),
    reverseChance: zone === "traps" ? 1 : distance < 500 ? 0 : 0.12 + progress * 0.68,
    itemSpacing: (720 - progress * 360) * (zone === "traps" ? 0.45 : 1),
    routeAmbushChance: zone === "traps" ? 1 : progress * 0.9,
    portalSpacing: (310 - progress * 135) * (zone === "drains" ? 0.45 : 1),
    portalInset: 0.72 - progress * 0.15,
  };
}
