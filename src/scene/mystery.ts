import * as THREE from "three";
import { CircleQuestionMark } from "lucide";
import { iconSprite } from "./icon";

export function createMystery() {
  const group = new THREE.Group();
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.95, 16, 12),
    new THREE.MeshStandardMaterial({
      color: "#bca1fa",
      emissive: "#6a3ba1",
      emissiveIntensity: 0.5,
      fog: false,
    }),
  );
  const question = iconSprite(CircleQuestionMark, "#ffffff", 1.35);
  question.position.z = 0.98;
  group.add(sphere, question);
  return group;
}
