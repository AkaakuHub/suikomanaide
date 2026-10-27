import type { Entity, HazardMotion, HazardMotionKind } from "./model";
import { clamp } from "./model";
import { movementArea } from "./movement";
import { safeLane } from "./placement";
import { collisionRadius } from "./collision";

const kinds: HazardMotionKind[] = ["horizontal", "vertical", "approach"];
export function createHazardMotion(
  origin: { x: number; y: number },
  station: number,
  distance: number,
  random: () => number,
): HazardMotion {
  const kind = kinds[Math.floor(random() * kinds.length)];
  const progress = clamp((distance - 2500) / 4500, 0, 1);
  const speedProgress = clamp((distance - 2500) / 9500, 0, 1);
  const amplitude = 0.7 + progress * 0.6 + random() * 0.3;
  const clearance = collisionRadius("hazard") + 0.85;
  const lane = [-40, 0, 40].map((offset) => safeLane(station + offset));
  const candidates = [
    origin,
    ...Array.from({ length: 16 }, (_, i) => ({
      x: Math.cos((i * Math.PI) / 8) * movementArea.width * 0.78,
      y: Math.sin((i * Math.PI) / 8) * movementArea.height * 0.78,
    })),
  ];
  let anchor: { x: number; y: number } | null = null;
  let nearest = Infinity;
  for (const point of candidates) {
    const dx = kind === "horizontal" ? amplitude : 0;
    const dy = kind === "vertical" ? amplitude : 0;
    if (
      [-1, 1].some(
        (side) =>
          Math.hypot(
            (point.x + dx * side) / movementArea.width,
            (point.y + dy * side) / movementArea.height,
          ) > 0.94,
      )
    )
      continue;
    const clear =
      kind === "approach"
        ? Math.hypot(Math.max(0, Math.abs(point.x) - 1.5), Math.max(0, Math.abs(point.y) - 0.6)) >=
          clearance
        : lane.every((center) => {
            const t = clamp(
              ((center.x - point.x) * dx + (center.y - point.y) * dy) / (amplitude * amplitude),
              -1,
              1,
            );
            return (
              Math.hypot(point.x + dx * t - center.x, point.y + dy * t - center.y) >= clearance
            );
          });
    const gap = Math.hypot(point.x - origin.x, point.y - origin.y);
    if (clear && gap < nearest) {
      anchor = point;
      nearest = gap;
    }
  }
  if (!anchor) throw new Error("動く機雷の回避経路を確保できません。");
  return {
    kind,
    anchorX: anchor.x,
    anchorY: anchor.y,
    amplitude,
    rate: Math.min(3.2, 1.1 + speedProgress * 2.1 + random() * 0.6),
    phase: random() * Math.PI * 2,
    elapsed: 0,
  };
}
export function advanceHazard(entity: Entity, dt: number) {
  const motion = entity.motion;
  if (!motion) return;
  const before = motion.phase + motion.elapsed * motion.rate;
  motion.elapsed += dt;
  const after = motion.phase + motion.elapsed * motion.rate;
  entity.x =
    motion.anchorX + (motion.kind === "horizontal" ? Math.sin(after) * motion.amplitude : 0);
  entity.y = motion.anchorY + (motion.kind === "vertical" ? Math.sin(after) * motion.amplitude : 0);
  if (motion.kind === "approach") {
    const waveSpeed = motion.amplitude * 4;
    const forwardSpeed = Math.min(34 - waveSpeed, 10 + motion.rate * 6);
    entity.z +=
      forwardSpeed * dt + (waveSpeed / motion.rate) * (Math.cos(before) - Math.cos(after));
  }
}
