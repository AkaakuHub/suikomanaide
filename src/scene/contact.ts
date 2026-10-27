import * as THREE from "three";
import type { EntityKind } from "../game/model";
import { collisionRadius, itemScale } from "../game/collision";

const sphere = new THREE.SphereGeometry(1, 14, 10);
export function contactSphere(kind: Exclude<EntityKind, "portal">, color?: string) {
  const harmful = kind === "hazard" || kind === "reverse" || kind === "confusion";
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    uniforms: { color: { value: new THREE.Color(color ?? (harmful ? "#ff7ca6" : "#b3ffe6")) } },
    vertexShader:
      "varying vec3 n;varying vec3 v;void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=-p.xyz;gl_Position=projectionMatrix*p;}",
    fragmentShader:
      "varying vec3 n;varying vec3 v;uniform vec3 color;void main(){float rim=pow(1.-max(0.,dot(normalize(n),normalize(v))),3.);gl_FragColor=vec4(color,.035+rim*.28);}",
  });
  const bubble = new THREE.Mesh(sphere, material);
  bubble.scale.setScalar(collisionRadius(kind) / itemScale);
  return bubble;
}
