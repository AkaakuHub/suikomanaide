import { expect, it } from "vite-plus/test";
import { maxFlightSpeed } from "./tuning";
import { Simulation } from "./simulation";

it("回収したスタミナを100以上蓄積し、リングの最高速度は維持する", () => {
  const game = new Simulation(() => 0.5);
  game.start();
  game.state.energy = 95;
  game.state.speed = maxFlightSpeed - 2;
  for (let i = 0; i < 12; i++) {
    game.state.entities = [
      {
        id: i + 1,
        kind: "ring",
        x: game.state.x,
        y: game.state.y,
        z: -0.1,
        color: "gold",
        rarity: 1,
      },
    ];
    game.tick(1 / 60, { x: 0, y: 0 });
  }
  expect(game.state.energy).toBeGreaterThan(130);
  expect(game.state.speed).toBe(maxFlightSpeed);
});
