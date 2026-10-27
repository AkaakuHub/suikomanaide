import { describe, expect, it } from "vite-plus/test";
import { dragTarget, steeringVelocity, movementArea } from "./movement";

describe("ドラッグと操舵の応答", () => {
  it("ドラッグ開始位置からの移動量で機体の目標を決め、触った位置へ飛ばない", () => {
    expect(dragTarget({ x: 2, y: -1 }, 0, 0, 390)).toEqual({ x: 2, y: -1 });
    const target = dragTarget({ x: 2, y: -1 }, -40, -20, 390);
    expect(target.x).toBeLessThan(2);
    expect(target.y).toBeGreaterThan(-1);
    const edge = dragTarget({ x: 0, y: 0 }, 1000, 1000, 390);
    expect(Math.hypot(edge.x / movementArea.width, edge.y / movementArea.height)).toBeCloseTo(1);
  });
  it("入力開始から100msで移動速度が立ち上がり、離すと速やかに止まる", () => {
    expect(steeringVelocity(0, 1, 10, 0, 0.1)).toBeGreaterThan(9);
    expect(steeringVelocity(10, 0, 10, 0, 0.1)).toBeLessThan(1);
  });
  it("入力を離してもワームホールの引力は残る", () => {
    expect(steeringVelocity(0, 0, 0, 30, 0.1)).toBeGreaterThan(4);
  });
});
