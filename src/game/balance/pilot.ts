import { channelAccessible } from "../routes";
import { Simulation } from "../simulation";
import { constrainMovement } from "../movement";
import { collisionRadius } from "../collision";
import { steeringSpeed } from "../flight";

interface Pilot {
  reaction: number;
  lookahead: number;
  aimError: number;
  margin: number;
  planning: boolean;
  reserve: number;
}
export const pilots = {
  beginner: { reaction: 0.8, lookahead: 16, aimError: 3.5, margin: 0, planning: false, reserve: 0 },
  normal: { reaction: 0.4, lookahead: 32, aimError: 2, margin: 0.2, planning: false, reserve: 0 },
  practiced: {
    reaction: 0.25,
    lookahead: 42,
    aimError: 1,
    margin: 0.5,
    planning: true,
    reserve: 30,
  },
  expert: {
    reaction: 0.08,
    lookahead: 180,
    aimError: 0.1,
    margin: 0.8,
    planning: true,
    reserve: 90,
  },
} satisfies Record<string, Pilot>;
function randomSource(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}
function pilotRun(seed: number, pilot: Pilot) {
  const game = new Simulation(randomSource(seed));
  const random = randomSource(seed + 997);
  game.start();
  let nextReaction = 0;
  let target = { x: 0, y: 0 };
  let direction = 1;
  let launchSpeed = 0;
  for (let frame = 0; frame < 5400 && game.state.phase === "flying"; frame++) {
    const s = game.state;
    if (s.elapsed >= nextReaction) {
      nextReaction = s.elapsed + pilot.reaction;
      const visible = s.entities.filter(
        (e) => e.z < 0 && e.z > -pilot.lookahead && channelAccessible(s.forks, s.travel, e.branch),
      );
      const ring =
        s.confusion > 0
          ? null
          : visible.filter((e) => e.kind === "ring").sort((a, b) => b.z - a.z)[0];
      target = ring ? { x: ring.x, y: ring.y } : { x: 0, y: 0 };
      if (s.confusion <= 0)
        for (const threat of visible) {
          if (!["hazard", "portal", "reverse", "confusion"].includes(threat.kind)) continue;
          const watchTime = pilot.planning ? 0.45 + pilot.reaction : pilot.reaction * 2;
          if (threat.z < -Math.max(12, s.speed * watchTime)) continue;
          if (pilot.planning && ring && threat.z < ring.z - s.speed * 0.2) continue;
          const radius = collisionRadius(threat.kind) + pilot.margin;
          let px = target.x,
            py = target.y;
          if (pilot.planning) {
            const eta = -threat.z / (s.speed + (threat.motion?.kind === "approach" ? 20 : 0));
            const gap = Math.max(0.001, Math.hypot(target.x - s.x, target.y - s.y));
            const reach = Math.min(
              1,
              (steeringSpeed(s.speed) * Math.max(0, eta - pilot.reaction * 0.5)) / gap,
            );
            px = s.x + (target.x - s.x) * reach;
            py = s.y + (target.y - s.y) * reach;
          }
          const dx = px - threat.x,
            dy = py - threat.y;
          const gap = Math.hypot(dx, dy);
          if (gap < radius) {
            const angle = gap > 0.05 ? Math.atan2(dy, dx) : threat.id * 2.4;
            target = {
              x: threat.x + Math.cos(angle) * (radius + 0.2),
              y: threat.y + Math.sin(angle) * (radius + 0.2),
            };
          }
        }
      const fork = s.forks.find(
        (candidate) => candidate.start > s.travel && candidate.start - s.travel < pilot.lookahead,
      );
      if (fork) {
        const side = pilot.planning && s.energy > pilot.reserve ? fork.rapidSide : -fork.rapidSide;
        target = { x: side * 3, y: 0 };
      }
      target.x += (random() - 0.5) * pilot.aimError;
      target.y += (random() - 0.5) * pilot.aimError;
      const bounded = constrainMovement(target.x, target.y, 0, 0);
      target = { x: bounded.x, y: bounded.y };
      direction = s.reverse > 0 ? -1 : 1;
    }
    if (s.elapsed < 6) {
      launchSpeed = Math.max(launchSpeed, s.speed);
    }
    game.tick(1 / 30, {
      x: Math.max(-1, Math.min(1, (target.x - s.x) * 1.2)) * direction,
      y: Math.max(-1, Math.min(1, (target.y - s.y) * 1.2)) * direction,
    });
  }
  return {
    launchSpeed,
    distance: game.state.distance,
    time: game.state.elapsed,
    ended: game.state.phase === "arrived",
  };
}
export function sampleRuns(pilot: Pilot) {
  const runs = Array.from({ length: 100 }, (_, i) => pilotRun(7919 + i * 104729, pilot));
  const distances = runs.map((run) => run.distance).sort((a, b) => a - b);
  const times = runs.map((run) => run.time).sort((a, b) => a - b);
  return {
    medianLaunchSpeed: runs.map((run) => run.launchSpeed).sort((a, b) => a - b)[50],
    medianDistance: distances[50],
    upperDistance: distances[90],
    bestDistance: distances[99],
    medianTime: times[50],
    finished: runs.filter((run) => run.ended).length,
  };
}
