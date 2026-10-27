import { describe, expect, it } from "vite-plus/test";
import { courseFrame, curveAcceleration } from "./course";
import { constrainMovement, movementArea } from "./movement";

describe("航路と移動領域", () => {
  it("斜め入力でも楕円の断面から出ず、壁に沿う速度は残る", () => {
    const point = constrainMovement(8, 5, 6, 1);
    expect(Math.hypot(point.x / movementArea.width, point.y / movementArea.height)).toBeCloseTo(1);
    const outward =
      (point.vx * point.x) / movementArea.width ** 2 +
      (point.vy * point.y) / movementArea.height ** 2;
    expect(outward).toBeCloseTo(0);
    expect(Math.hypot(point.vx, point.vy)).toBeGreaterThan(0);
  });
  it("航路が左右上下に曲がり、進行方向に垂直な移動面を持つ", () => {
    const frame = courseFrame(300);
    expect(frame.center.x).toBeGreaterThan(30);
    expect(frame.center.y).toBeGreaterThan(10);
    const dot = (a: typeof frame.right, b: typeof frame.right) => a.x * b.x + a.y * b.y + a.z * b.z;
    expect(dot(frame.forward, frame.right)).toBeCloseTo(0);
    expect(dot(frame.forward, frame.up)).toBeCloseTo(0);
    expect(dot(frame.right, frame.up)).toBeCloseTo(0);
    expect(dot(frame.forward, frame.forward)).toBeCloseTo(1);
  });
  it("同じ地点の航路が後の問い合わせで変化せず、曲がる外側に慣性が働く", () => {
    const before = courseFrame(100);
    courseFrame(5000);
    expect(courseFrame(100)).toEqual(before);
    expect(curveAcceleration(50, 60).x).toBeLessThan(0);
    expect(Math.abs(curveAcceleration(50, 60).x)).toBeGreaterThan(
      Math.abs(curveAcceleration(50, 20).x),
    );
  });
});
