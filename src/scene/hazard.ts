import * as THREE from "three";

import type { HazardMotionKind } from "../game/model";

export const hazardAuraColors: Record<HazardMotionKind, string> = {
  horizontal: "#4ee5ff",
  vertical: "#ac8dff",
  approach: "#ffb34b",
};
export function createHazard(motion?: HazardMotionKind) {
  const group = new THREE.Group();
  const aura = motion ? hazardAuraColors[motion] : "#ffed83";
  const dark = new THREE.MeshStandardMaterial({
    color: motion ? "#ff384d" : "#eb4267",
    emissive: "#e9233c",
    emissiveIntensity: 0.65,
    flatShading: true,
    metalness: 0.4,
    roughness: 0.65,
  });
  group.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.65, 0), dark));
  group.add(
    new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.67, 0),
      new THREE.MeshBasicMaterial({ color: motion ? aura : "#ffefcf", wireframe: true }),
    ),
  );
  const spikeGeometry = new THREE.ConeGeometry(0.12, 0.48, 4);
  const spikeMaterial = new THREE.MeshBasicMaterial({ color: aura });
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const direction = new THREE.Vector3(
      Math.cos(angle),
      Math.sin(angle),
      Math.sin(i * 2) * 0.35,
    ).normalize();
    const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
    spike.position.copy(direction).multiplyScalar(0.7);
    spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    group.add(spike);
  }
  if (motion)
    group.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(1.02, 16, 12),
        new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          uniforms: { color: { value: new THREE.Color(aura) } },
          vertexShader:
            "varying vec3 n;varying vec3 v;void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=-p.xyz;gl_Position=projectionMatrix*p;}",
          fragmentShader:
            "varying vec3 n;varying vec3 v;uniform vec3 color;void main(){float rim=pow(1.-max(0.,dot(normalize(n),normalize(v))),2.);gl_FragColor=vec4(color,rim*.65);}",
        }),
      ),
    );
  return group;
}
