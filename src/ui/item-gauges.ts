import type { Flight } from "../game/model";
import { effectDuration } from "../game/effects";
import type { TimedEffect } from "../game/effects";
import type { Paint } from "./paint";

const effects: { key: TimedEffect; label: string; color: string }[] = [
  { key: "shield", label: "ライフジャケット", color: "#54ecae" },
  { key: "magnet", label: "マグネット", color: "#ff7d98" },
  { key: "reverse", label: "操作反転", color: "#f578e8" },
  { key: "confusion", label: "混乱", color: "#ffbd64" },
];
export function itemGauges(p: Paint, state: Flight, left: number, bottom: number) {
  const active = effects.filter(({ key }) => state[key] > 0);
  const width = Math.min(212, p.width - left - 16);
  const c = p.ctx;
  active.forEach(({ key, label, color }, index) => {
    const y = bottom - (active.length - index) * 36;
    c.fillStyle = "#081b2ce6";
    c.beginPath();
    c.roundRect(left, y, width, 32, 6);
    c.fill();
    p.text(label, left + 10, y + 11, 12, color, 600, "left");
    c.fillStyle = "#ffffff24";
    c.fillRect(left + 10, y + 23, width - 20, 4);
    c.fillStyle = color;
    c.fillRect(left + 10, y + 23, (width - 20) * Math.min(1, state[key] / effectDuration[key]), 4);
  });
}
