import { describe, expect, it } from "vite-plus/test";
import { Simulation } from "./simulation";
import { nextRingPosition } from "./ring-layout";
import type { EntityKind } from "./model";
import { movementArea } from "./movement";

describe("操作反転", () => {
  it("取得すると8秒間入力を反転し、終了後に元へ戻る", () => {
    const game = new Simulation(() => 0.5);
    game.start();
    game.state.entities = [
      { id: 1, kind: "reverse", x: 0, y: 0, z: -0.1, color: "red", rarity: 1 },
    ];
    game.tick(1 / 60, { x: 0, y: 0 });
    expect(game.state.reverse).toBe(8);
    game.tick(1 / 60, { x: 1, y: 1 });
    expect(game.state.vx).toBeLessThan(0);
    expect(game.state.vy).toBeLessThan(0);
    game.state.reverse = 0.001;
    game.state.vx = 0;
    game.state.vy = 0;
    game.tick(1 / 60, { x: 1, y: 1 });
    expect(game.state.reverse).toBe(0);
    expect(game.state.vx).toBeGreaterThan(0);
    expect(game.state.vy).toBeGreaterThan(0);
  });
});
describe("リング配置", () => {
  it("位置に変化があり、連続するリングの横の間隔を取り得る範囲に抑える", () => {
    let previous = { x: 0, y: 0 };
    let seed = 17;
    const positions: number[] = [];
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < 200; i++) {
      const next = nextRingPosition(previous, random(), random());
      expect(Math.hypot(next.x - previous.x, next.y - previous.y)).toBeLessThan(3.21);
      expect(
        Math.hypot(next.x / movementArea.width, next.y / movementArea.height),
      ).toBeLessThanOrEqual(0.851);
      positions.push(next.x);
      previous = next;
    }
    expect(Math.max(...positions) - Math.min(...positions)).toBeGreaterThan(4);
  });
});

it("複数の効果を同時に使い、期限切れの効果だけを終了する", () => {
  const game = new Simulation(() => 0.5);
  game.start();
  const kinds: EntityKind[] = ["shield", "magnet", "reverse", "confusion"];
  game.state.entities = kinds.map((kind, index) => ({
    id: index + 1,
    kind,
    x: 0,
    y: 0,
    z: -0.1,
    color: "blue",
    rarity: 1,
  }));
  game.tick(1 / 60, { x: 0, y: 0 });
  game.tick(1 / 60, { x: 0, y: 0 });
  expect(game.state.shield).toBeGreaterThan(13);
  expect(game.state.magnet).toBeGreaterThan(11);
  expect(game.state.reverse).toBeGreaterThan(7);
  expect(game.state.confusion).toBeGreaterThan(7);
  game.state.reverse = 0.001;
  game.tick(1 / 60, { x: 0, y: 0 });
  expect(game.state.reverse).toBe(0);
  expect(game.state.confusion).toBeGreaterThan(7);
  expect(game.state.shield).toBeGreaterThan(13);
  expect(game.state.magnet).toBeGreaterThan(11);
});

it("混乱は8秒で終了し、移動・吸引・当たり判定を変えない", () => {
  const normal = new Simulation(() => 0.5);
  const confused = new Simulation(() => 0.5);
  for (const game of [normal, confused]) {
    game.start();
    game.state.entities = [
      { id: 1, kind: "ring", x: 0, y: 0, z: -20, color: "gold", rarity: 1 },
      { id: 2, kind: "portal", x: 4, y: 2, z: -50, color: "blue", rarity: 1 },
    ];
  }
  confused.state.entities.push({
    id: 3,
    kind: "confusion",
    x: 0,
    y: 0,
    z: -0.1,
    color: "red",
    rarity: 1,
  });
  for (const game of [normal, confused]) game.tick(1 / 60, { x: 0, y: 0 });
  expect(confused.state.confusion).toBe(8);
  for (let i = 0; i < 60; i++) {
    for (const game of [normal, confused]) game.tick(1 / 60, { x: 0.2, y: 0.1 });
  }
  expect(confused.state.x).toBe(normal.state.x);
  expect(confused.state.y).toBe(normal.state.y);
  expect(confused.state.speed).toBe(normal.state.speed);
  expect(confused.state.energy).toBe(normal.state.energy);
  expect(confused.state.entities).toEqual(normal.state.entities);
  confused.state.confusion = 0.001;
  confused.tick(1 / 60, { x: 0, y: 0 });
  expect(confused.state.confusion).toBe(0);
});
