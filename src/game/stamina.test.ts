import { expect, it } from "vite-plus/test";
import { energyDrainBase } from "./tuning";
import { Simulation } from "./simulation";

function run(inputX: number, energy = 100) {
  const game = new Simulation(() => 0.5);
  game.start();
  game.state.energy = energy;
  game.state.entities = [];
  for (let i = 0; i < 60; i++) game.tick(1 / 60, { x: inputX, y: 0 });
  return game.state;
}
it("横移動の追加消費は1秒の全力操作でもスタミナ0.15未満に抑える", () => {
  const idle = run(0);
  const moving = run(1);
  expect(moving.energy).toBeLessThan(idle.energy);
  expect(idle.energy - moving.energy).toBeLessThan(0.15);
});
it("引力やカーブで流されるだけでは横移動の追加消費を課さず、残量は負にならない", () => {
  const idle = run(0);
  expect(idle.energy).toBeCloseTo(100 - energyDrainBase - idle.distance / 10000, 2);
  expect(run(1, 0).energy).toBe(0);
});
