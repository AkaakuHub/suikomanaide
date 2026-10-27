import * as THREE from "three";
import { createPortal } from "./portal";
import { createPickup } from "./pickups";
import { createHazard, hazardAuraColors } from "./hazard";
import { contactSphere } from "./contact";
import type { Entity } from "../game/model";

export function createEntityMesh(entity: Entity) {
  if (entity.kind === "portal") return createPortal(entity);
  if (entity.kind === "hazard") {
    const group = createHazard(entity.motion?.kind);
    group.add(
      contactSphere(entity.kind, entity.motion ? hazardAuraColors[entity.motion.kind] : undefined),
    );
    return group;
  }
  if (entity.kind !== "ring") {
    const group = createPickup(entity.kind);
    group.add(contactSphere(entity.kind));
    return group;
  }
  const group = new THREE.Group();
  group.add(
    new THREE.Mesh(
      new THREE.TorusGeometry(0.85, 0.12, 8, 48),
      new THREE.MeshStandardMaterial({
        color: "#ff962f",
        emissive: "#ff6c16",
        emissiveIntensity: 0.65,
        roughness: 0.3,
      }),
    ),
  );
  const stripe = new THREE.TorusGeometry(0.85, 0.125, 8, 8, Math.PI / 7);
  const white = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    emissive: "#fff5d4",
    emissiveIntensity: 0.35,
    roughness: 0.3,
  });
  for (let i = 0; i < 4; i++) {
    const band = new THREE.Mesh(stripe, white);
    band.rotation.z = (i * Math.PI) / 2;
    group.add(band);
  }
  group.add(contactSphere("ring"));
  return group;
}
export function createShip() {
  const swimmer = new THREE.Group();
  const yellow = new THREE.MeshStandardMaterial({ color: "#ffe05c", roughness: 0.28 });
  const skin = new THREE.MeshStandardMaterial({ color: "#ffc8a2", roughness: 0.6 });
  const suit = new THREE.MeshStandardMaterial({ color: "#f25c85", roughness: 0.45 });
  const blue = new THREE.MeshStandardMaterial({ color: "#267fbe", roughness: 0.35 });
  const float = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.19, 10, 32), yellow);
  float.rotation.x = Math.PI / 2;
  swimmer.add(float);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.6, 4, 12), suit);
  body.rotation.x = Math.PI / 2;
  body.position.set(0, 0.16, 0.04);
  swimmer.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 10), skin);
  head.position.set(0, 0.25, -0.59);
  swimmer.add(head);
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.255, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    blue,
  );
  cap.position.copy(head.position);
  swimmer.add(cap);
  const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.09, 0.1), blue);
  goggles.position.set(0, 0.25, -0.8);
  swimmer.add(goggles);
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.53, 3, 8), skin);
    arm.name = side < 0 ? "left-arm" : "right-arm";
    arm.rotation.x = Math.PI / 2;
    arm.rotation.z = side * 0.25;
    arm.position.set(side * 0.45, 0.12, -0.37);
    swimmer.add(arm);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.47, 3, 8), skin);
    leg.rotation.x = Math.PI / 2;
    leg.position.set(side * 0.2, 0.1, 0.65);
    swimmer.add(leg);
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.065, 0.4), blue);
    fin.name = side < 0 ? "left-fin" : "right-fin";
    fin.position.set(side * 0.2, 0.07, 1.08);
    swimmer.add(fin);
  }
  return swimmer;
}
