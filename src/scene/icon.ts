import * as THREE from "three";
import { createElement } from "lucide";
import type { IconNode } from "lucide";

export function iconSprite(icon: IconNode, color: string, size: number) {
  const svg = createElement(icon, {
    width: 96,
    height: 96,
    stroke: color,
    "stroke-width": 2,
    fill: "none",
  });
  const image = new Image();
  const texture = new THREE.Texture(image);
  image.onload = () => {
    texture.needsUpdate = true;
  };
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }),
  );
  sprite.scale.set(size, size, 1);
  return sprite;
}
