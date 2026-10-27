import { expect, it } from "vite-plus/test";
import { createHazardMotion, advanceHazard } from "./hazard-motion";
import type { Entity } from "./model";
import { createFlight } from "./model";
import { movementArea } from "./movement";
import { safeLane } from "./placement";
import { collisionRadius } from "./collision";
import { Simulation } from "./simulation";
import { Population } from "./population";
import { lightYearsPerUnit } from "./flight";
import { flightDifficulty } from "./difficulty";

function mine(roll: number, distance = 7000): Entity {
  const entity: Entity = { id: 1, kind: "hazard", x: 3, y: 1, z: -250, color: "red", rarity: 1 };
  entity.motion = createHazardMotion(entity, 2000, distance, () => roll);
  advanceHazard(entity, 0);
  return entity;
}
it("横と縦の機雷は異なる軸で往復し、接近する機雷は前へ進む", () => {
  for (const roll of [0, 0.5, 0.9]) {
    const entity = mine(roll);
    const initial = { ...entity };
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i < 400; i++) {
      advanceHazard(entity, 0.05);
      xs.push(entity.x);
      ys.push(entity.y);
    }
    if (entity.motion?.kind === "horizontal") {
      expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(2);
      expect(entity.y).toBe(initial.y);
      expect(entity.z).toBe(initial.z);
    } else if (entity.motion?.kind === "vertical") {
      expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(2);
      expect(entity.x).toBe(initial.x);
      expect(entity.z).toBe(initial.z);
    } else {
      expect(entity.x).toBe(initial.x);
      expect(entity.y).toBe(initial.y);
      expect(entity.z - initial.z).toBeGreaterThan(250);
    }
  }
});
it("往復する全範囲と接近中の経路で壁の内側と回避経路を保つ", () => {
  for (const roll of [0, 0.5, 0.9]) {
    const entity = mine(roll);
    for (let i = 0; i < 400; i++) {
      advanceHazard(entity, 0.05);
      expect(
        Math.hypot(entity.x / movementArea.width, entity.y / movementArea.height),
      ).toBeLessThanOrEqual(0.940001);
      const station = 2000 - (entity.z + 250);
      for (const offset of [-40, 0, 40]) {
        const lane = safeLane(station + offset);
        expect(Math.hypot(entity.x - lane.x, entity.y - lane.y)).toBeGreaterThanOrEqual(
          collisionRadius("hazard") + 0.849,
        );
      }
    }
  }
});
it("接近速度は時間の分割で変わらない", () => {
  const once = mine(0.9);
  const split = mine(0.9);
  advanceHazard(once, 1);
  for (let i = 0; i < 60; i++) advanceHazard(split, 1 / 60);
  expect(split.z).toBeCloseTo(once.z, 10);
  expect(split.motion?.elapsed).toBeCloseTo(1);
});
it("奥の生成で3種類の動く機雷が出現し、序盤には出現しない", () => {
  let seed = 943;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const state = createFlight();
  const population = new Population(random);
  population.start(state);
  state.entities = [];
  state.distance = 10000;
  state.travel = state.distance / lightYearsPerUnit;
  population.populate(state);
  const hazards = state.entities.filter(({ kind }) => kind === "hazard");
  expect(
    hazards.some((entity) => entity.motion && (state.travel - entity.z) * lightYearsPerUnit < 2500),
  ).toBe(false);
  expect(
    new Set(hazards.flatMap((entity) => (entity.motion ? [entity.motion.kind] : []))).size,
  ).toBe(3);
  expect(flightDifficulty(7000).movingHazardChance).toBeGreaterThan(
    flightDifficulty(2500).movingHazardChance,
  );
});
it("機雷が移動する途中の接触を検出し、一時停止中は動かない", () => {
  const game = new Simulation(() => 0.5);
  game.start();
  game.state.elapsed = 4;
  const entity: Entity = {
    id: 1,
    kind: "hazard",
    x: 1.19,
    y: 0,
    z: -0.01,
    color: "red",
    rarity: 1,
    motion: {
      kind: "horizontal",
      anchorX: 1.19,
      anchorY: 0,
      amplitude: 0.8,
      rate: 2.2,
      phase: 0,
      elapsed: 0,
    },
  };
  game.state.entities = [entity];
  game.tick(1 / 30, { x: 0, y: 0 });
  expect(entity.x).toBeGreaterThan(collisionRadius("hazard"));
  expect(game.state.hits).toBe(1);
  entity.z = -20;
  game.state.entities = [entity];
  game.state.phase = "paused";
  const elapsed = entity.motion?.elapsed;
  game.tick(1 / 30, { x: 1, y: 0 });
  expect(entity.motion?.elapsed).toBe(elapsed);
});

it("距離とともに動きが速くなり、12000m以降はそれ以上加速しない", () => {
  for (const roll of [0, 0.5, 0.9]) {
    const near = mine(roll, 2500).motion;
    const far = mine(roll, 8000).motion;
    const capped = mine(roll, 12000).motion;
    const beyond = mine(roll, 1000000).motion;
    if (!near || !far || !capped || !beyond) throw new Error("機雷の動きが設定されていません。");
    expect(far.rate).toBeGreaterThan(near.rate);
    expect(capped.rate).toBe(3.2);
    expect(beyond.rate).toBe(capped.rate);
    expect(beyond.amplitude).toBe(capped.amplitude);
  }
});
it("最大加速時も横・縦の速度と接近速度を上限以内に保つ", () => {
  for (const roll of [0, 0.5, 0.9]) {
    const entity = mine(roll, 1000000);
    const dt = 1 / 120;
    for (let i = 0; i < 1200; i++) {
      const previous = { x: entity.x, y: entity.y, z: entity.z };
      advanceHazard(entity, dt);
      expect(Math.hypot(entity.x - previous.x, entity.y - previous.y) / dt).toBeLessThanOrEqual(
        5.12 + 0.000001,
      );
      expect((entity.z - previous.z) / dt).toBeLessThanOrEqual(34 + 0.000001);
      expect(entity.z).toBeGreaterThanOrEqual(previous.z);
    }
  }
});
