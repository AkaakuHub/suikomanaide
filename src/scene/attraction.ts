import * as THREE from "three";
import { channelAccessible } from "../game/routes";
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
  update(
    state: Flight,
    start: THREE.Vector3,
    time: number,
    meshes: ReadonlyMap<number, THREE.Object3D>,
  ) {
    if (state.confusion > 0) {
      this.mesh.visible = false;
      return;
    }
    let target = null;
    let strength = 0;
    for (const entity of state.entities) {
      if (
        entity.kind !== "portal" ||
        entity.z >= 0 ||
        !channelAccessible(state.forks, state.travel, entity.branch)
      )
        continue;
      const force = gravityForce(entity, state);
      if (force.strength > strength) {
        strength = force.strength;
        target = entity;
      }
    }
    this.mesh.visible = strength > 3 && target !== null;
    if (!target || strength <= 3) return;
    const targetMesh = meshes.get(target.id);
    if (!targetMesh) {
      this.mesh.visible = false;
      return;
    }
    const end = targetMesh.position;
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(targetMesh.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(targetMesh.quaternion);
    let index = 0;
    const point = new THREE.Vector3();
    for (let arm = 0; arm < 6; arm++) {
      for (let i = 0; i < 16; i++) {
        for (const t of [i / 16, i === 15 ? 1 : (i + 0.38) / 16]) {
          const angle = (arm / 6) * Math.PI * 2 + t * 8 - time * 3;
          const radius = t === 1 ? 0 : Math.sin(t * Math.PI) * 0.9;
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
