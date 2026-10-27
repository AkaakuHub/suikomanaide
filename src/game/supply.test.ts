import { describe, expect, it } from "vite-plus/test";
import { Simulation } from "./simulation";
import { Population } from "./population";
import { createFlight } from "./model";
import { lightYearsPerUnit } from "./flight";
import { ringSupply } from "./supply";

describe("開始区間とリングの供給", () => {
  it("最初の2秒の区間は空け、その先の見える配置を初めから用意する", () => {
    const game = new Simulation(() => 0.5);
    game.start();
    expect(game.state.entities.some((entity) => entity.kind === "ring" && entity.z < -100)).toBe(
      true,
    );
    for (let i = 0; i < 119; i++) game.tick(1 / 60, { x: 0, y: 0 });
    expect(game.state.elapsed).toBeLessThan(2);
    expect(game.state.entities.every((entity) => entity.z < 0)).toBe(true);
    for (let i = 0; i < 3; i++) game.tick(1 / 60, { x: 0, y: 0 });
    expect(game.state.entities.some((entity) => entity.kind === "ring")).toBe(true);
  });
  it("序盤から供給が減り、5000m以降はリングがなくなる", () => {
    const rate = (distance: number) => {
      const supply = ringSupply(distance);
      return supply.probability / supply.interval;
    };
    expect(rate(0)).toBeGreaterThan(rate(2000));
    expect(rate(2000)).toBeGreaterThan(rate(4000));
    expect(rate(4800)).toBeLessThan(rate(0) / 100);
    expect(rate(4999)).toBeGreaterThan(0);
    expect(rate(5000)).toBe(0);
    expect(rate(9000)).toBe(0);
  });
});

it("最初の600mは浮き輪を12個以内に抑え、機雷と排水口も混ぜる", () => {
  const state = createFlight();
  const population = new Population(() => 0.5);
  population.start(state);
  state.travel = 600 / lightYearsPerUnit - 260;
  population.populate(state);
  const rings = state.entities.filter((entity) => entity.kind === "ring");
  expect(rings.length).toBeGreaterThanOrEqual(6);
  expect(rings.length).toBeLessThanOrEqual(12);
  expect(state.entities.some((entity) => entity.kind === "hazard")).toBe(true);
  expect(state.entities.some((entity) => entity.kind === "portal")).toBe(true);
});
