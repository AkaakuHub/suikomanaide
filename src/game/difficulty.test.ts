import { describe, expect, it } from "vite-plus/test";
import { Simulation } from "./simulation";
import { lightYearsPerUnit } from "./flight";

function upcoming(distance: number) {
  const game = new Simulation(() => 0.5);
  game.start();
  game.state.entities = [];
  game.state.distance = distance;
  game.state.travel = distance / lightYearsPerUnit;
  game.tick(0, { x: 0, y: 0 });
  return game.state.entities.filter((entity) => entity.z < 0 && entity.z >= -260);
}
describe("後半の難易度", () => {
  it("同じ先読み範囲で後半ほど障害物とワームホールが増える", () => {
    const early = upcoming(1000);
    const late = upcoming(5000);
    expect(late.filter((entity) => entity.kind === "hazard").length).toBeGreaterThan(
      early.filter((entity) => entity.kind === "hazard").length,
    );
    expect(late.filter((entity) => entity.kind === "portal").length).toBeGreaterThanOrEqual(
      early.filter((entity) => entity.kind === "portal").length,
    );
  });
  it("終盤は妨害アイテムが残り、お助けアイテムと浮き輪は出ない", () => {
    const late = [5500, 5700, 5900].flatMap(upcoming);
    expect(late.some((entity) => entity.kind === "reverse" || entity.kind === "confusion")).toBe(
      true,
    );
    expect(late.some((entity) => ["shield", "magnet", "ring"].includes(entity.kind))).toBe(false);
  });
});
