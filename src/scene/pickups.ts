import * as THREE from "three";
import { LifeBuoy, CirclePlus, ArrowLeftRight, TriangleAlert, CircleQuestionMark } from "lucide";
import { iconSprite } from "./icon";

export function createPickup(kind: "shield" | "magnet" | "reverse" | "confusion") {
  const group = new THREE.Group();
  if (kind === "magnet") {
    const red = new THREE.MeshStandardMaterial({
      color: "#ff6c83",
      emissive: "#ff506e",
      emissiveIntensity: 0.8,
      metalness: 0.35,
      roughness: 0.3,
    });
    const silver = new THREE.MeshStandardMaterial({
      color: "#e8faff",
      emissive: "#97dfff",
      emissiveIntensity: 0.9,
    });
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.13, 8, 24, Math.PI), red);
    arc.rotation.z = Math.PI;
    arc.position.y = -0.12;
    group.add(arc);
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.5, 0.24), red);
      leg.position.set(side * 0.44, 0.12, 0);
      group.add(leg);
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.25), silver);
      tip.position.set(side * 0.44, 0.45, 0);
      group.add(tip);
    }
  } else if (kind === "shield") {
    const fabric = new THREE.MeshStandardMaterial({
      color: "#54ecae",
      emissive: "#32dc92",
      emissiveIntensity: 0.65,
      roughness: 0.7,
    });
    for (const side of [-1, 1]) {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.48, 1.25, 0.27), fabric);
      pad.position.set(side * 0.31, 0, 0);
      group.add(pad);
    }
    const strap = new THREE.Mesh(
      new THREE.BoxGeometry(1.12, 0.13, 0.3),
      new THREE.MeshStandardMaterial({ color: "#176d60", roughness: 0.6 }),
    );
    strap.position.set(0, -0.22, 0.03);
    group.add(strap);
    const symbol = iconSprite(LifeBuoy, "#ffffff", 0.55);
    symbol.position.set(0.31, 0.23, 0.19);
    group.add(symbol);
  } else if (kind === "confusion") {
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.72, 16, 12),
      new THREE.MeshStandardMaterial({
        color: "#ffb846",
        emissive: "#d97016",
        emissiveIntensity: 0.5,
      }),
    );
    const question = iconSprite(CircleQuestionMark, "#fffaf0", 1.1);
    question.position.z = 0.75;
    group.add(sphere, question);
  } else {
    const badge = new THREE.Mesh(
      new THREE.BoxGeometry(1.05, 1.05, 0.2),
      new THREE.MeshBasicMaterial({ color: "#f34ce6" }),
    );
    badge.rotation.z = Math.PI / 4;
    group.add(badge);
    const arrows = iconSprite(ArrowLeftRight, "#fff3fe", 1.15);
    arrows.position.z = 0.2;
    group.add(arrows);
  }
  const plus = iconSprite(
    kind === "reverse" || kind === "confusion" ? TriangleAlert : CirclePlus,
    kind === "reverse" || kind === "confusion" ? "#ffdb78" : "#aaffbc",
    0.43,
  );
  plus.position.set(0.7, 0.67, 0.2);
  group.add(plus);
  return group;
}
