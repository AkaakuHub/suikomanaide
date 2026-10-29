import { describe, expect, it } from "vite-plus/test";
import { maxFlightSpeed } from "./tuning";
import { createFlight, gravityForce, portalRarity } from "./model";
import { Simulation } from "./simulation";
import type { Entity } from "./model";

const portal: Entity = { id: 1, kind: "portal", x: 3, y: 1, z: -10, color: "blue", rarity: 2 };
describe("ワームホールの重力", () => {
  it("減速するほど強く引かれる", () => {
    const state = createFlight();
    expect(gravityForce(portal, { ...state, speed: 15 }).strength).toBeGreaterThan(
      gravityForce(portal, { ...state, speed: maxFlightSpeed * 0.9 }).strength * 5,
    );
  });
  it("低エネルギーでは早い段階から強く引き寄せられる", () => {
    const flight = { ...createFlight(), energy: 0, speed: 20 };
    expect(gravityForce(portal, flight).strength).toBeGreaterThan(100);
    expect(gravityForce({ ...portal, z: -55 }, flight).strength).toBeGreaterThan(20);
    expect(gravityForce(portal, flight).strength).toBeGreaterThan(
      gravityForce(portal, { ...flight, energy: 100 }).strength * 4,
    );
  });
  it("遠方の穴は機体を引かず、近づくと穴の方向へ引く", () => {
    const state = createFlight();
    expect(gravityForce({ ...portal, z: -100 }, state).strength).toBe(0);
    expect(gravityForce(portal, state).x).toBeGreaterThan(0);
    expect(gravityForce(portal, state).y).toBeGreaterThan(0);
  });
});
describe("飛行ルール", () => {
  it("大きくなった排水口は端に浮き輪が触れても吸い込む", () => {
    const game = new Simulation(() => 0.5);
    game.start();
    game.state.entities = [{ ...portal, x: 2.2, y: 0, z: -0.1 }];
    game.tick(1 / 60, { x: 0, y: 0 });
    expect(game.state.phase).toBe("arrived");
  });
  it("リングで回復し加速、電気球で減速する", () => {
    const game = new Simulation(() => 0.5);
    game.start();
    game.state.energy = 50;
    game.state.elapsed = 4;
    game.state.speed = 30;
    game.state.entities = [{ ...portal, kind: "ring", x: 0, y: 0, z: -0.1 }];
    game.tick(1 / 60, { x: 0, y: 0 });
    expect(game.state.energy).toBeGreaterThan(50);
    expect(game.state.speed).toBeGreaterThan(30);
    const accelerated = game.state.speed;
    game.state.entities = [{ ...portal, kind: "hazard", x: 0, y: 0, z: -0.1 }];
    game.tick(1 / 60, { x: 0, y: 0 });
    expect(game.state.speed).toBeGreaterThan(accelerated * 0.87);
    expect(game.state.speed).toBeLessThan(accelerated * 0.89);
    expect(game.state.hits).toBe(1);
  });
  it("シールドが衝突を1回防ぐ", () => {
    const game = new Simulation(() => 0.5);
    game.start();
    game.state.shield = 10;
    game.state.elapsed = 4;
    game.state.entities = [{ ...portal, kind: "hazard", x: 0, y: 0, z: -0.1 }];
    game.tick(1 / 60, { x: 0, y: 0 });
    expect(game.state.hits).toBe(0);
    expect(game.state.shield).toBe(0);
  });
  it("エネルギー切れ後はワームホールに到着し、無限に飛べない", () => {
    const game = new Simulation(() => 0.5);
    game.start();
    game.state.energy = 0;
    game.state.entities = [{ ...portal, x: 2, y: 1, z: -18 }];
    for (let i = 0; i < 1200 && game.state.phase === "flying"; i++)
      game.tick(1 / 60, { x: 0, y: 0 });
    expect(game.state.phase).toBe("arrived");
    expect(game.state.destination?.kind).toBe("portal");
  });
  it("一時停止中は時間もエネルギーも変わらない", () => {
    const game = new Simulation(() => 0.5);
    const energy = game.state.energy;
    game.state.phase = "paused";
    game.tick(1 / 30, { x: 1, y: 1 });
    expect(game.state.elapsed).toBe(0);
    expect(game.state.energy).toBe(energy);
  });
  it("開始直後2秒は障害物で減速せず、経過後は衝突する", () => {
    const game = new Simulation(() => 0.5);
    game.start();
    const hazard: Entity = { ...portal, kind: "hazard", x: 0, y: 0, z: -0.1 };
    game.state.entities = [hazard];
    game.tick(1 / 60, { x: 0, y: 0 });
    expect(game.state.hits).toBe(0);
    expect(game.state.speed).toBeGreaterThan(29);
    game.state.elapsed = 2;
    const beforeHit = game.state.speed;
    game.state.entities = [{ ...hazard, z: -0.1 }];
    game.tick(1 / 60, { x: 0, y: 0 });
    expect(game.state.hits).toBe(1);
    expect(game.state.speed).toBeGreaterThan(beforeHit * 0.87);
    expect(game.state.speed).toBeLessThan(beforeHit * 0.89);
  });
});
describe("レア度とスコア", () => {
  it("2500光年より前に最高レア度が出現しない", () => {
    expect(portalRarity(0, 0.999)).toBe(1);
    expect(portalRarity(2000, 0.999)).toBe(3);
    expect(portalRarity(2500, 0.999)).toBe(4);
    expect(portalRarity(5000, 0.95)).toBe(4);
  });
});
