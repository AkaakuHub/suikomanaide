import { maxFlightSpeed } from "../tuning";
import { beforeAll, expect, it } from "vite-plus/test";
import { pilots, sampleRuns } from "./pilot";

type Sample = ReturnType<typeof sampleRuns>;
let beginner: Sample;
let normal: Sample;
let practiced: Sample;
let expert: Sample;
beforeAll(() => {
  beginner = sampleRuns(pilots.beginner);
  normal = sampleRuns(pilots.normal);
  practiced = sampleRuns(pilots.practiced);
  expert = sampleRuns(pilots.expert);
  console.info(JSON.stringify({ beginner, normal, practiced, expert }));
}, 30000);
it("回収と回避が遅れる条件では20〜40秒で終わる", () => {
  expect(beginner.medianTime).toBeGreaterThan(20);
  expect(beginner.medianTime).toBeLessThan(40);
  expect(beginner.finished).toBe(100);
});
it("近くを見る操作条件は1分前後で一区切りになる", () => {
  expect(normal.medianDistance).toBeGreaterThan(1000);
  expect(normal.medianDistance).toBeLessThan(6000);
  expect(normal.medianTime).toBeGreaterThan(25);
  expect(normal.medianTime).toBeLessThan(75);
  expect(normal.finished).toBeGreaterThanOrEqual(90);
});
it("先読みと回収を詰めると4000mを越えて進める", () => {
  expect(practiced.medianDistance).toBeGreaterThan(3000);
  expect(practiced.medianDistance).toBeLessThan(7500);
  expect(practiced.upperDistance).toBeGreaterThan(4000);
});
it("精密な操作条件の上位は8000m前後まで届く", () => {
  expect(expert.upperDistance).toBeGreaterThan(7000);
  expect(expert.upperDistance).toBeLessThan(9000);
  expect(expert.bestDistance).toBeGreaterThan(8000);
  expect(expert.medianTime).toBeGreaterThan(45);
  expect(expert.medianTime).toBeLessThan(120);
});
it("同じ100配置で先読みを伴う二つの操作条件は近くを見る条件より遠くへ進む", () => {
  expect(practiced.medianDistance).toBeGreaterThan(normal.medianDistance);
  expect(expert.medianDistance).toBeGreaterThan(normal.medianDistance);
});

it("助走を長引かせず最初の6秒で加速できる", () => {
  expect(normal.medianLaunchSpeed).toBeGreaterThan(maxFlightSpeed * 0.8);
  expect(expert.medianLaunchSpeed).toBeGreaterThan(maxFlightSpeed * 0.9);
});
