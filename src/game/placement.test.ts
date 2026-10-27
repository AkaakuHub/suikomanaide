import { describe, expect, it } from "vite-plus/test";
import { placeOutsideLane, safeLane } from "./placement";
import { collisionRadius } from "./collision";
import { Simulation } from "./simulation";
import { createFlight, gravityForce } from "./model";

describe("通過経路と吸引後の操作", () => {
  it("障害物と操作反転と穴が、前後を含めた通過経路を塞がない", () => {
    for (const kind of ["hazard", "reverse", "confusion", "portal"] as const) {
      for (let station = 0; station < 20000; station += 47) {
        const point = placeOutsideLane(kind, station, safeLane(station));
        for (const offset of [-40, 0, 40]) {
          const lane = safeLane(station + offset);
          expect(Math.hypot(point.x - lane.x, point.y - lane.y)).toBeGreaterThanOrEqual(
            collisionRadius(kind) + 0.849,
          );
        }
      }
    }
  });
  it("通り過ぎた穴の引力を残さず、エネルギーが0でも操舵できる", () => {
    const portal = {
      id: 1,
      kind: "portal" as const,
      x: 3,
      y: 1,
      z: 1,
      color: "blue" as const,
      rarity: 1,
    };
    expect(gravityForce(portal, createFlight()).strength).toBe(0);
    const game = new Simulation(() => 0.5);
    game.start();
    game.state.energy = 0;
    game.state.entities = [];
    game.tick(1 / 60, { x: 1, y: 0 });
    expect(game.state.vx).toBeGreaterThan(0);
    expect(game.state.phase).toBe("flying");
  });
  it("重なった障害物で1回の接触が多重ダメージにならない", () => {
    const game = new Simulation(() => 0.5);
    game.start();
    game.state.elapsed = 4;
    game.state.entities = [1, 2].map((id) => ({
      id,
      kind: "hazard" as const,
      x: 0,
      y: 0,
      z: -0.1,
      color: "blue" as const,
      rarity: 1,
    }));
    game.tick(1 / 60, { x: 0, y: 0 });
    expect(game.state.hits).toBe(1);
    expect(game.state.speed).toBeGreaterThan(26);
  });
});
