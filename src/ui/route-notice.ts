import type { Flight } from "../game/model";
import { Paint } from "./paint";

export function routeNotice(p: Paint, state: Flight, top: number) {
  const fork = state.forks.find(
    (route) =>
      route.start > state.travel && route.start - state.travel < Math.max(30, state.speed) * 4.5,
  );
  if (!fork) return;
  const width = Math.min(320, p.width - 32);
  const left = (p.width - width) / 2;
  p.ctx.fillStyle = "#082b3bef";
  p.ctx.strokeStyle = "#8be5ee";
  p.ctx.lineWidth = 1.5;
  p.ctx.beginPath();
  p.ctx.roundRect(left, top, width, 68, 12);
  p.ctx.fill();
  p.ctx.stroke();
  p.text("もうすぐ分かれ道", p.width / 2, top + 20, 16, "#ffffff", 700);
  p.text(
    fork.rapidSide === -1 ? "← 急流" : "← 回復",
    left + width * 0.25,
    top + 48,
    15,
    fork.rapidSide === -1 ? "#ffbf67" : "#83ffcf",
    700,
  );
  p.text(
    fork.rapidSide === 1 ? "急流 →" : "回復 →",
    left + width * 0.75,
    top + 48,
    15,
    fork.rapidSide === 1 ? "#ffbf67" : "#83ffcf",
    700,
  );
}
