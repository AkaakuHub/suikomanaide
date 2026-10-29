import { describe, expect, it } from "vite-plus/test";
import { Simulation } from "./simulation";
import { lightYearsPerUnit } from "./flight";
import { Population } from "./population";
import { createFlight } from "./model";

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

it("急流の分岐では通常水路より機雷と排水口が多く配置される", () => {
  function threats(rapid: boolean) {
    const state = createFlight();
    const population = new Population(() => 0.5);
    population.start(state);
    state.travel = 700;
    population.populate(state);
    if (!rapid) state.forks.splice(0, 1);
    state.entities = [];
    state.travel = 1800;
    population.populate(state);
    return state.entities.filter((entity) => {
      const station = state.travel - entity.z;
      return station >= 1100 && station < 1800;
    });
  }
  const rapid = threats(true);
  const normal = threats(false);
  for (const kind of ["hazard", "portal"]) {
    expect(rapid.filter((entity) => entity.kind === kind).length).toBeGreaterThan(
      normal.filter((entity) => entity.kind === kind).length * 1.4,
    );
  }
});
