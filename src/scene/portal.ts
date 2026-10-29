import { portalScale } from "../game/collision";
import * as THREE from "three";
import { portalColors } from "../game/model";
import type { Entity } from "../game/model";

export function createPortal(entity: Entity) {
  const color = new THREE.Color(portalColors[entity.color]);
  const group = new THREE.Group();
  group.scale.setScalar(portalScale);
  const field = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { time: { value: 0 }, color: { value: color }, rarity: { value: entity.rarity } },
    vertexShader:
      "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: `
      varying vec2 vUv;
      uniform float time;
      uniform float rarity;
      uniform vec3 color;
      void main(){
        vec2 p=(vUv-.5)*2.;
        float r=length(p),a=atan(p.y,p.x);
        float twist=a*5.+r*26.-time*2.4;
        float foam=pow(.5+.5*sin(twist+sin(a*3.-time)*1.2),5.);
        float flow=foam*exp(-r*2.8)*smoothstep(.15,.3,r);
        float rim=exp(-pow((r-.29)*45.,2.));
        float ripples=pow(.5+.5*sin(r*65.-time*3.),10.)*.18;
        vec3 water=mix(color*.38,mix(color,vec3(1.),.24),foam);
        vec3 light=water*(.85+flow*1.4)+color*rim*1.3;
        light+=mix(color,vec3(1.),.3)*ripples;
        float alpha=(1.-smoothstep(.65+rarity*.025,1.,r))*smoothstep(.17,.25,r)*(.52+flow*.75+rim*.45);
        gl_FragColor=vec4(light,alpha);
      }`,
  });
  group.add(new THREE.Mesh(new THREE.PlaneGeometry(8.2, 8.2), field));
  const metal = new THREE.MeshStandardMaterial({
    color: "#e3f7ff",
    emissive: color,
    emissiveIntensity: 0.5,
    metalness: 0.65,
    roughness: 0.35,
  });
  const frame = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.14, 8, 40), metal);
  const center = new THREE.Mesh(
    new THREE.CircleGeometry(1.12, 32),
    new THREE.MeshBasicMaterial({ color: "#031019", side: THREE.DoubleSide }),
  );
  center.position.z = -0.08;
  group.add(frame, center);
  for (let i = -3; i <= 3; i++) {
    const x = i * 0.27;
    const length = Math.sqrt(1.08 ** 2 - x ** 2) * 2;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.065, length, 0.07), metal);
    bar.position.set(x, 0, 0.03);
    group.add(bar);
  }
  const geometry = new THREE.BufferGeometry();
  const points: number[] = [];
  for (let arm = 0; arm < 3; arm++) {
    for (let i = 0; i < 64; i++) {
      for (const t of [i / 64, (i + 1) / 64]) {
        const radius = 1.25 + t * 1.8;
        const angle = (arm * Math.PI * 2) / 3 + t * Math.PI * 1.1;
        points.push(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          Math.sin(t * Math.PI) * 0.22,
        );
      }
    }
  }
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  group.add(
    new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({
        color: color.clone().lerp(new THREE.Color("#ffffff"), 0.2),
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    ),
  );
  return group;
}
