import type { Fork, Channel } from "./routes";
import { maxFlightSpeed, initialEnergy, initialSpeed } from "./tuning";

export type PortalColor = "red" | "blue" | "green" | "gold" | "white";
export type EntityKind =
  | "ring"
  | "hazard"
  | "portal"
  | "shield"
  | "magnet"
  | "reverse"
  | "confusion";
export type Phase = "ready" | "flying" | "paused" | "arrived";
export type HazardMotionKind = "horizontal" | "vertical" | "approach";
export interface HazardMotion {
  kind: HazardMotionKind;
  anchorX: number;
  anchorY: number;
  amplitude: number;
  rate: number;
  phase: number;
  elapsed: number;
}
export interface Entity {
  id: number;
  kind: EntityKind;
  x: number;
  y: number;
  z: number;
  color: PortalColor;
  rarity: number;
  motion?: HazardMotion;
  branch?: Channel;
}
export interface Flight {
  phase: Phase;
  x: number;
  y: number;
  vx: number;
  vy: number;
  distance: number;
  travel: number;
  energy: number;
  speed: number;
  elapsed: number;
  hits: number;
  hitGrace: number;
  shield: number;
  magnet: number;
  reverse: number;
  confusion: number;
  gravity: number;
  entities: Entity[];
  forks: Fork[];
  nextId: number;
  destination: Entity | null;
  event: string;
  eventTime: number;
}
export interface Control {
  x: number;
  y: number;
}
export const portalColors: Record<PortalColor, string> = {
  red: "#ff6c83",
  blue: "#67c9ff",
  green: "#83efbd",
  gold: "#ffce75",
  white: "#e8dcff",
};
export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
export function createFlight(): Flight {
  return {
    phase: "ready",
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    distance: 0,
    travel: 0,
    energy: initialEnergy,
    speed: initialSpeed,
    elapsed: 0,
    hits: 0,
    hitGrace: 0,
    shield: 0,
    magnet: 0,
    reverse: 0,
    confusion: 0,
    gravity: 0,
    entities: [],
    forks: [],
    nextId: 1,
    destination: null,
    event: "",
    eventTime: 0,
  };
}
export function portalRarity(distance: number, roll: number): number {
  const weights =
    distance < 1000
      ? [100, 0, 0]
      : distance < 1500
        ? [78, 20, 2]
        : distance < 2000
          ? [66, 30, 4]
          : distance < 2500
            ? [52, 40, 8]
            : [Math.max(29, 33 - Math.floor((distance - 2500) / 500)), 50, 16];
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (roll * 100 < sum) return i + 1;
  }
  return 4;
}
export const maxGravityReach = 88;

export function gravityForce(entity: Entity, flight: Pick<Flight, "x" | "y" | "speed" | "energy">) {
  const dx = entity.x - flight.x;
  const dy = entity.y - flight.y;
  const lateral = Math.hypot(dx, dy);
  const weakness = 1 - clamp(flight.energy / 25, 0, 1);
  const proximity =
    entity.z >= 0 ? 0 : Math.max(0, 1 + entity.z / (52 + weakness * (maxGravityReach - 52)));
  const resistance = clamp((maxFlightSpeed - flight.speed) / (maxFlightSpeed - 9), 0.1, 1);
  const strength =
    (proximity ** 2 * resistance ** 2 * 72 * (1 + weakness * 4.5)) / (1 + lateral * 0.3);
  return {
    x: (dx / Math.max(0.8, lateral)) * strength,
    y: (dy / Math.max(0.8, lateral)) * strength,
    strength,
  };
}
