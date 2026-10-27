import { Paint } from "./paint";
import type { FlightResult } from "../game/result";

export function resultScreen(p: Paint, result: FlightResult, imageReady: boolean) {
  p.shade();
  const wide = p.width > p.height * 1.2;
  const cx = wide ? p.width * 0.28 : p.width / 2;
  const top = wide ? p.height / 2 - 90 : Math.max(60, (p.height - 370) / 2);
  p.text("ゴール", cx, top, 24, "#ddfcff", 600);
  p.text(result.distance.toLocaleString("ja-JP"), cx, top + 74, 64, "#fff", 700);
  p.text("m", cx, top + 122, 16, "#b9bfdc");
  const width = Math.min(280, wide ? p.width * 0.38 : p.width - 64);
  const x = wide ? p.width * 0.73 - width / 2 : (p.width - width) / 2;
  const y = wide ? (p.height - 110) / 2 : top + 180;
  p.button("share", "共有", x, y, width, 48, true, !imageReady);
  p.button("start", "もう一度泳ぐ", x, y + 62, width);
}
