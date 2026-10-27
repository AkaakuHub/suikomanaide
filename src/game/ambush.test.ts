import { expect, it } from "vite-plus/test";
import { ringRouteAmbush } from "./ambush";
import { collisionRadius } from "./collision";
import { safeLane } from "./placement";
import { flightDifficulty } from "./difficulty";

const rings = [
  { station: 1000, x: 3, y: 1.3 },
  { station: 1200, x: 4, y: -0.4 },
];
it("妨害アイテムは浮き輪をつなぐ経路上に置き、取得の直後と直前を空ける", () => {
  for (const kind of ["reverse", "confusion"] as const) {
    for (const station of [1001, 1100, 1199]) {
      const result = ringRouteAmbush(kind, rings, station, 0.5);
      expect(result).not.toBeNull();
      if (!result) throw new Error("経路上に配置できませんでした。");
      expect(result.station - rings[0].station).toBeGreaterThanOrEqual(50);
      expect(rings[1].station - result.station).toBeGreaterThanOrEqual(50);
      const t = (result.station - rings[0].station) / 200;
      expect(result.x).toBeCloseTo(3 + t);
      for (const offset of [-40, 0, 40]) {
        const lane = safeLane(result.station + offset);
        expect(Math.hypot(result.x - lane.x, result.y - lane.y)).toBeGreaterThanOrEqual(
          collisionRadius(kind) + 0.849,
        );
      }
    }
  }
});
it("浮き輪の間が短い場合は経路上に置かない", () => {
  expect(
    ringRouteAmbush("reverse", [rings[0], { ...rings[1], station: 1080 }], 1040, 0.5),
  ).toBeNull();
});
it("後半ほど妨害アイテムと経路上の配置を増やす", () => {
  const early = flightDifficulty(700);
  const late = flightDifficulty(5000);
  expect(late.reverseChance).toBeGreaterThan(early.reverseChance);
  expect(late.routeAmbushChance).toBeGreaterThan(early.routeAmbushChance);
  expect(late.itemSpacing).toBeLessThan(early.itemSpacing);
});
