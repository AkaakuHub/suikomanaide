import { expect, it } from "vite-plus/test";
import { initialEnergy, initialSpeed } from "./tuning";
import { openingLayout } from "./opening";
import { Simulation } from "./simulation";
import { movementArea } from "./movement";

it("開始時の位置と出現距離を抽選し、2秒の安全区間を残す", () => {
  for (const roll of [0, 0.2, 0.5, 0.9, 0.999999]) {
    const layout = openingLayout(() => roll);
    expect(layout.nextRing).toBeGreaterThanOrEqual(initialSpeed * 2);
    expect(layout.nextRing).toBeLessThan(initialSpeed * 2 + 12);
    expect(layout.nextItem).toBeGreaterThanOrEqual(420);
    expect(layout.nextPortal).toBeGreaterThanOrEqual(450);
    expect(layout.nextHazard).toBeGreaterThanOrEqual(320);
    expect(layout.nextHazard).toBeLessThan(440);
    expect(layout.nextPortal).toBeLessThan(650);
    expect(
      Math.hypot(
        layout.ringPosition.x / movementArea.width,
        layout.ringPosition.y / movementArea.height,
      ),
    ).toBeLessThanOrEqual(0.75);
    const game = new Simulation(() => roll);
    game.start();
    const first = game.state.entities.find((entity) => entity.kind === "ring");
    if (!first) throw new Error("初期配置に浮き輪がありません。");
    for (let i = 0; i < 120; i++) game.tick(1 / 60, { x: 0, y: 0 });
    expect(game.state.entities.every((entity) => entity.z < 0)).toBe(true);
    expect(game.state.energy).toBeLessThan(initialEnergy);
    expect(game.state.hits).toBe(0);
    for (let i = 0; i < 30; i++) game.tick(1 / 60, { x: 0, y: 0 });
    expect(first.z).toBeGreaterThan(0);
  }
});
it("同じゲームを繰り返し開始しても初期配置を使い回さない", () => {
  let seed = 731;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const game = new Simulation(random);
  const layouts = new Set<string>();
  const firstPositions: number[] = [];
  const firstDistances = new Set<number>();
  for (let i = 0; i < 100; i++) {
    game.start();
    layouts.add(JSON.stringify(game.state.entities));
    const first = game.state.entities.find((entity) => entity.kind === "ring");
    if (!first) throw new Error("初期配置に浮き輪がありません。");
    firstPositions.push(first.x);
    firstDistances.add(first.z);
  }
  expect(layouts.size).toBe(100);
  expect(firstDistances.size).toBe(100);
  expect(Math.max(...firstPositions) - Math.min(...firstPositions)).toBeGreaterThan(6);
});
