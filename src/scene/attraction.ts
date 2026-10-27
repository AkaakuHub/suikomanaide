import * as THREE from "three";
import { courseFrame } from "../game/course";
import { gravityForce, portalColors } from "../game/model";
import type { Flight } from "../game/model";

export class Attraction {
  private readonly points = new Float32Array(6 * 16 * 2 * 3);
  private readonly geometry = new THREE.BufferGeometry();
  private readonly material = new THREE.LineBasicMaterial({
    color: "#c2b8ff",
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  readonly mesh: THREE.LineSegments;
  constructor() {
    this.geometry.setAttribute("position", new THREE.BufferAttribute(this.points, 3));
    this.mesh = new THREE.LineSegments(this.geometry, this.material);
    this.mesh.frustumCulled = false;
  }
  update(state: Flight, start: THREE.Vector3, time: number) {
    if (state.confusion > 0) {
      this.mesh.visible = false;
      return;
    }
    let target = null;
    let strength = 0;
    for (const entity of state.entities) {
      if (entity.kind !== "portal" || entity.z > 0) continue;
      const force = gravityForce(entity, state);
      if (force.strength > strength) {
        strength = force.strength;
        target = entity;
      }
    }
    this.mesh.visible = strength > 3 && target !== null;
    if (!target || strength <= 3) return;
    const frame = courseFrame(state.travel - target.z);
    const end = new THREE.Vector3(
      frame.center.x + frame.right.x * target.x + frame.up.x * target.y,
      frame.center.y + frame.right.y * target.x + frame.up.y * target.y,
      frame.center.z + frame.right.z * target.x + frame.up.z * target.y,
    );
    const right = new THREE.Vector3(frame.right.x, frame.right.y, frame.right.z);
    const up = new THREE.Vector3(frame.up.x, frame.up.y, frame.up.z);
    let index = 0;
    const point = new THREE.Vector3();
    for (let arm = 0; arm < 6; arm++) {
      for (let i = 0; i < 16; i++) {
        const from = (i / 16 + time * 0.4) % 1;
        for (const t of [from, Math.min(1, from + 0.022)]) {
          const angle = (arm / 6) * Math.PI * 2 + t * 8 - time * 3;
          const radius = (0.2 + Math.sin(t * Math.PI) * 0.7) * (1 - t);
          point
            .copy(start)
            .lerp(end, t)
            .addScaledVector(right, Math.cos(angle) * radius)
            .addScaledVector(up, Math.sin(angle) * radius);
          this.points.set([point.x, point.y, point.z], index);
          index += 3;
        }
      }
    }
    this.material.color.set(portalColors[target.color]);
    this.material.opacity = Math.min(0.65, strength / 50);
    this.geometry.attributes.position.needsUpdate = true;
  }
}
