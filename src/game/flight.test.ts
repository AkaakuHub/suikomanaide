import { describe, expect, it } from "vite-plus/test";
import { flightSpeed, steeringSpeed } from "./flight";

describe("速度と操舵の減衰", () => {
  it("エネルギー切れでも瞬間的に失速せず数秒かけて減速する", () => {
    expect(flightSpeed(65, 0, 1)).toBeGreaterThan(50);
    expect(flightSpeed(65, 0, 1)).toBeLessThan(60);
    expect(flightSpeed(65, 0, 6)).toBeGreaterThan(18);
    expect(flightSpeed(65, 0, 6)).toBeLessThan(30);
  });
  it("十分な蓄積があれば高速を維持し、残量低下に伴い減速が早まる", () => {
    expect(flightSpeed(65, 200, 10)).toBeGreaterThan(60);
    expect(flightSpeed(65, 25, 10)).toBeLessThan(flightSpeed(65, 75, 10));
    expect(flightSpeed(65, 0, 10)).toBeLessThan(flightSpeed(65, 25, 10));
  });
  it("速度が落ちるほど操舵が弱まり、高速状態では十分に操作できる", () => {
    expect(steeringSpeed(25)).toBeLessThan(steeringSpeed(65) * 0.4);
    expect(steeringSpeed(9)).toBeGreaterThan(0);
  });
  it("時間の分割によって減衰結果が変化しない", () => {
    const once = flightSpeed(65, 10, 1);
    let split = 65;
    for (let i = 0; i < 60; i++) split = flightSpeed(split, 10, 1 / 60);
    expect(split).toBeCloseTo(once);
  });
});
