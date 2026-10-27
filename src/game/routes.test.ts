import { expect, it } from "vite-plus/test";
import { ForkPlan, channelAccessible, channelOffset, forkAt, selectChannel } from "./routes";
import type { Fork } from "./routes";
import { createFlight } from "./model";
import type { Entity } from "./model";
import { advanceCurrent } from "./current";
import { Simulation } from "./simulation";

function fork(): Fork {
  return { start: 100, end: 900, rapidSide: 1, selected: null };
}
function hazard(id: number, z: number): Entity {
  return { id, kind: "hazard", x: 0, y: 0, z, color: "red", rarity: 1 };
}
it("分岐と合流の間だけ左右の水路が開き、入口と出口で段差がない", () => {
  const route = fork();
  expect(channelOffset(route, 100)).toBe(0);
  expect(channelOffset(route, 900)).toBe(0);
  expect(channelOffset(route, 500)).toBe(12);
  for (let station = 100; station <= 900; station++) {
    expect(channelOffset(route, station)).toBeGreaterThanOrEqual(0);
    expect(channelOffset(route, station)).toBeLessThanOrEqual(12);
    expect(
      Math.abs(channelOffset(route, station + 1) - channelOffset(route, station)),
    ).toBeLessThan(0.12);
  }
  expect(forkAt([route], 99)).toBeUndefined();
  expect(forkAt([route], 900)).toBeUndefined();
});
it("入口を泳いだ側が進路になり、途中の横移動では隣の水路へ切り替わらない", () => {
  const routes = [fork()];
  expect(selectChannel(routes, 99, -2)).toBeUndefined();
  expect(selectChannel(routes, 100, -2)?.selected).toBe(-1);
  expect(selectChannel(routes, 500, 3)?.selected).toBe(-1);
  expect(channelAccessible(routes, 90, { start: 100, side: -1 })).toBe(false);
  expect(channelAccessible(routes, 200, { start: 100, side: -1 })).toBe(true);
  expect(channelAccessible(routes, 200, { start: 100, side: 1 })).toBe(false);
  expect(channelAccessible(routes, 200, undefined)).toBe(true);
});
it("急流は速さと消費が大きく、穏やかな水路は速度を落として消費を抑える", () => {
  const rapid = createFlight();
  rapid.travel = 150;
  rapid.speed = 100;
  rapid.forks = [{ ...fork(), selected: 1 }];
  const calm = { ...rapid, forks: [{ ...fork(), selected: -1 as const }] };
  for (let i = 0; i < 60; i++) {
    advanceCurrent(rapid, 1 / 60);
    advanceCurrent(calm, 1 / 60);
  }
  expect(rapid.speed).toBeGreaterThan(calm.speed + 15);
  expect(rapid.distance).toBeGreaterThan(calm.distance);
  expect(calm.energy).toBeGreaterThan(rapid.energy);
});
it("穏やかな水路での回復は入口の一度だけで、滞在中に繰り返さない", () => {
  const state = createFlight();
  state.travel = 99;
  state.speed = 100;
  state.x = -2;
  state.forks = [fork()];
  const initialEnergy = state.energy;
  expect(advanceCurrent(state, 1 / 30)).toBe("ゆったり");
  const recovered = state.energy;
  expect(recovered - initialEnergy).toBeGreaterThan(11);
  for (let i = 0; i < 60; i++) advanceCurrent(state, 1 / 60);
  expect(state.energy).toBeLessThan(recovered);
});
it("別水路の排水口を通過しても吸引も衝突も発生しない", () => {
  const game = new Simulation(() => 0.5);
  game.start();
  game.state.travel = 200;
  game.state.forks = [{ ...fork(), selected: -1 }];
  game.state.entities = [{ ...hazard(1, -0.1), kind: "portal", branch: { start: 100, side: 1 } }];
  game.tick(1 / 60, { x: 0, y: 0 });
  expect(game.state.phase).toBe("flying");
  expect(game.state.gravity).toBe(0);
});
it("分水路の位置と急流側は抽選し、合流後に通常区間を挟む", () => {
  for (const roll of [0, 0.5, 0.999]) {
    const plan = new ForkPlan(() => roll);
    plan.prepare(10000);
    expect(plan.forks[0].start).toBeGreaterThanOrEqual(900);
    expect(plan.forks[0].start).toBeLessThan(1300);
    for (let i = 1; i < plan.forks.length; i++)
      expect(plan.forks[i].start - plan.forks[i - 1].end).toBeGreaterThanOrEqual(1000);
  }
});
