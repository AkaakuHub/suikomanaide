import type { Entity, Flight } from "./model";
import { maxFlightSpeed, ringEnergy, ringAcceleration } from "./tuning";
import { openingSafetySeconds } from "./opening";
import { effectDuration } from "./effects";

export function collectPickup(s: Flight, entity: Entity): string | null {
  switch (entity.kind) {
    case "ring":
      s.energy += ringEnergy;
      s.speed = Math.min(maxFlightSpeed, s.speed + ringAcceleration);
      return "リング回収";
    case "hazard":
      if (s.elapsed <= openingSafetySeconds || s.hitGrace > 0) return null;
      if (s.shield > 0) {
        s.shield = 0;
        s.hitGrace = 0.75;
        return "シールドで防御";
      } else {
        s.energy = Math.max(0, s.energy - 14);
        s.speed = Math.max(9, s.speed * 0.88);
        s.hitGrace = 0.75;
        s.hits++;
        return "衝突";
      }
    case "shield":
      s.shield = effectDuration.shield;
      return "シールド獲得";
    case "magnet":
      s.magnet = effectDuration.magnet;
      return "マグネット獲得";
    case "reverse":
      s.reverse = effectDuration.reverse;
      return "操作反転";
    case "confusion":
      s.confusion = effectDuration.confusion;
      return "混乱";
    case "portal":
      s.destination = entity;
      s.phase = "arrived";
      return null;
  }
}
