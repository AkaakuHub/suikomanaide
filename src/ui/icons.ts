import { createElement, Play, Pause, Volume2, VolumeX, Share2 } from "lucide";
import type { IconNode } from "lucide";
import type { Action } from "./paint";

const nodes: Record<Action, IconNode> = {
  start: Play,
  pause: Pause,
  resume: Play,
  sound: Volume2,
  share: Share2,
};
const cache = new Map<string, HTMLImageElement>();
export function buttonIcon(action: Action, label: string, color: string) {
  const muted = label.includes("オフ");
  const key = `${action}-${muted}-${color}`;
  let image = cache.get(key);
  if (!image) {
    const svg = createElement(muted ? VolumeX : nodes[action], {
      width: 24,
      height: 24,
      stroke: color,
      "stroke-width": 1.7,
    });
    image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
    cache.set(key, image);
  }
  return image;
}
