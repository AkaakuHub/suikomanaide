import { expect, it } from "vite-plus/test";
import { ZonePlan, portalClearanceDistance } from "./zones";
import { Population } from "./population";
import { createFlight } from "./model";
import { lightYearsPerUnit } from "./flight";
import { collisionRadius } from "./collision";
import { safeLane } from "./placement";

function generate(roll: number) {
  const state = createFlight();
  const population = new Population(() => roll);
  population.start(state);
  state.entities = [];
  state.distance = 15000;
  state.travel = state.distance / lightYearsPerUnit;
  population.populate(state);
  return state.entities.map((entity) => ({
    ...entity,
    station: state.travel - entity.z,
    distance: (state.travel - entity.z) * lightYearsPerUnit,
  }));
}
it("特殊区間は奥で始まり、通常区間を挟み、同じ特性を連続させない", () => {
  for (const roll of [0, 0.5, 0.999]) {
    const plan = new ZonePlan(() => roll);
    expect(plan.at(1199)).toBeNull();
    let previous = null;
    for (let distance = 1200; distance < 15000; distance += 10) {
      const zone = plan.at(distance);
      if (!zone || previous === zone) continue;
      expect(zone.start).toBeGreaterThanOrEqual(1200);
      expect(zone.end - zone.start).toBeGreaterThanOrEqual(320);
      expect(zone.end - zone.start).toBeLessThan(580);
      if (previous) {
        expect(zone.kind).not.toBe(previous.kind);
        expect(zone.start - previous.end).toBeGreaterThanOrEqual(600);
      }
      previous = zone;
    }
  }
});
it("機雷が多い区間には排水口がなく、前後の吸引範囲にも生成しない", () => {
  const entities = generate(0);
  const inside = entities.filter(({ distance }) => distance >= 1200 && distance < 1520);
  const before = entities.filter(({ distance }) => distance >= 700 && distance < 1020);
  expect(inside.filter(({ kind }) => kind === "hazard").length).toBeGreaterThan(
    before.filter(({ kind }) => kind === "hazard").length,
  );
  expect(
    entities.some(
      ({ kind, distance }) =>
        kind === "portal" &&
        distance >= 1200 - portalClearanceDistance &&
        distance < 1520 + portalClearanceDistance,
    ),
  ).toBe(false);
  expect(entities.some(({ kind, distance }) => kind === "portal" && distance > 1600)).toBe(true);
});
it("排水口が集中する区間と妨害アイテムが増える区間を生成する", () => {
  for (const { roll, kind } of [
    { roll: 0.5, kind: "portal" },
    { roll: 0.999, kind: "reverse" },
  ]) {
    const zone = new ZonePlan(() => roll).at(1600);
    if (!zone) throw new Error("特殊区間がありません。");
    const entities = generate(roll);
    const inside = entities.filter(
      (entity) =>
        entity.kind === kind && entity.distance >= zone.start && entity.distance < zone.end,
    );
    const before = entities.filter(
      (entity) =>
        entity.kind === kind &&
        entity.distance >= zone.start - (zone.end - zone.start) - 80 &&
        entity.distance < zone.start - 80,
    );
    expect(inside.length).toBeGreaterThan(before.length);
  }
});
it("特殊区間も通過経路を確保し、5000m以降は補充処理からも浮き輪を出さない", () => {
  for (const roll of [0, 0.5, 0.999]) {
    const entities = generate(roll);
    expect(entities.some(({ kind }) => kind === "ring")).toBe(true);
    expect(entities.some(({ kind, distance }) => kind === "ring" && distance >= 5000)).toBe(false);
    for (const entity of entities) {
      if (["ring", "shield", "magnet"].includes(entity.kind)) continue;
      for (const offset of [-40, 0, 40]) {
        const lane = safeLane(entity.station + offset);
        expect(Math.hypot(entity.x - lane.x, entity.y - lane.y)).toBeGreaterThanOrEqual(
          collisionRadius(entity.kind) + 0.849,
        );
      }
    }
  }
});

it("吸引の強化後も機雷区間の端へ外側の排水口の引力が届かない", () => {
  const plan = new ZonePlan(() => 0);
  expect(plan.allowsPortal(1200 - portalClearanceDistance)).toBe(false);
  expect(plan.allowsPortal(1520 + portalClearanceDistance - 0.001)).toBe(false);
  expect(plan.allowsPortal(1200 - portalClearanceDistance - 0.001)).toBe(true);
  expect(plan.allowsPortal(1520 + portalClearanceDistance)).toBe(true);
});
