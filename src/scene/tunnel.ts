import { forkAt, channelOffset } from "../game/routes";
import type { Fork } from "../game/routes";
import * as THREE from "three";
import { courseFrame } from "../game/course";
export class Tunnel {
  readonly group = new THREE.Group();
  private readonly geometry = new THREE.BufferGeometry();
  private readonly positions = new Float32Array(2 * 61 * 49 * 3);
  private readonly uvs = new Float32Array(2 * 61 * 49 * 2);
  private readonly streams = new Float32Array(2 * 61 * 49);
  private readonly material: THREE.ShaderMaterial;
  private readonly bubbles: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private readonly bubblePositions = new Float32Array(240 * 3);
  private lastSection = -Infinity;
  private readonly bubbleSeeds = Array.from({ length: 240 }, () => ({
    angle: Math.random() * Math.PI * 2,
    radius: 7.5 + Math.random() * 1.8,
    z: Math.random() * 230,
  }));
  constructor() {
    const indices: number[] = [];
    for (let side = 0; side < 2; side++)
      for (let j = 0; j < 60; j++)
        for (let i = 0; i < 48; i++) {
          const a = side * 61 * 49 + j * 49 + i;
          indices.push(a, a + 49, a + 1, a + 1, a + 49, a + 50);
        }
    this.geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute("uv", new THREE.BufferAttribute(this.uvs, 2));
    this.geometry.setAttribute("stream", new THREE.BufferAttribute(this.streams, 1));
    this.geometry.setIndex(indices);
    this.material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: { time: { value: 0 }, section: { value: 0 } },
      vertexShader:
        "attribute float stream;varying float vStream;varying vec2 vUv;varying float depth;uniform float section;void main(){vStream=stream;vUv=uv;depth=uv.y*240.+section-24.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      fragmentShader: `
        varying float vStream;
        varying vec2 vUv;
        varying float depth;
        uniform float time;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
        void main(){
          float angle=vUv.x*6.283185+depth*.0166667+time*.035;
          vec2 p=vec2(cos(angle)*3.,sin(angle)*3.+depth*.075-time*.08);
          float n=noise(p)*.55+noise(p*2.1)*.28+noise(p*4.3)*.17;
          float flow=sin(vUv.x*37.7+depth*.1083333-time*.12+n*6.);
          vec3 col=mix(vec3(.008,.025,.065),vec3(.025,.13,.2),n);
          vec3 tint=vStream>.5?vec3(.18,.065,.01):vStream<-.5?vec3(.01,.15,.085):vec3(.015,.085,.12);
          col+=tint*pow(max(0.,flow),4.)*n;
          col+=vec3(.015,.055,.065)*pow(n,3.);
          float fade=smoothstep(.75,1.,vUv.y);
          gl_FragColor=vec4(mix(col,vec3(.006,.018,.035),fade),1.);
      }`,
    });
    const mesh = new THREE.Mesh(this.geometry, this.material);
    mesh.frustumCulled = false;
    mesh.renderOrder = -1;
    this.group.add(mesh);
    const bubbleGeometry = new THREE.BufferGeometry();
    bubbleGeometry.setAttribute("position", new THREE.BufferAttribute(this.bubblePositions, 3));
    this.bubbles = new THREE.Points(
      bubbleGeometry,
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { size: { value: 18 } },
        vertexShader:
          "uniform float size;void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(size*12./-p.z,1.,18.);gl_Position=projectionMatrix*p;}",
        fragmentShader:
          "void main(){float r=length(gl_PointCoord-.5)*2.;float edge=exp(-pow((r-.75)*12.,2.));gl_FragColor=vec4(.88,1.,1.,edge*.3);}",
      }),
    );
    this.bubbles.frustumCulled = false;
    this.group.add(this.bubbles);
  }
  update(travel: number, speed: number, forks: Fork[]) {
    this.material.uniforms.time.value = travel * 0.1;
    this.bubbles.material.uniforms.size.value = 14 + speed * 0.08;
    const section = Math.floor(travel / 4) * 4;
    if (section !== this.lastSection) {
      this.lastSection = section;
      this.material.uniforms.section.value = section;
      for (let j = 0; j <= 60; j++) {
        const depth = j * 4 - 24;
        const station = section + depth;
        const frame = courseFrame(station);
        const fork = forkAt(forks, station);
        const spread = channelOffset(fork, station);
        const edge = Math.acos(Math.min(1, spread / 9.5));
        for (let sideIndex = 0; sideIndex < 2; sideIndex++) {
          const side = sideIndex === 0 ? -1 : 1;
          const start = side < 0 ? edge : -Math.PI + edge;
          const arc = Math.PI * 2 - edge * 2;
          for (let i = 0; i <= 48; i++) {
            const angle = start + (i / 48) * arc;
            const x = side * spread + Math.cos(angle) * 9.5;
            const y = Math.sin(angle) * 9.5;
            const vertex = sideIndex * 61 * 49 + j * 49 + i;
            const index = vertex * 3;
            this.positions[index] = frame.center.x + frame.right.x * x + frame.up.x * y;
            this.positions[index + 1] = frame.center.y + frame.right.y * x + frame.up.y * y;
            this.positions[index + 2] = frame.center.z + frame.right.z * x + frame.up.z * y;
            this.uvs[vertex * 2] = angle / (Math.PI * 2);
            this.uvs[vertex * 2 + 1] = j / 60;
            this.streams[vertex] = fork ? (side === fork.rapidSide ? 1 : -1) : 0;
          }
        }
      }
      this.geometry.attributes.uv.needsUpdate = true;
      this.geometry.attributes.stream.needsUpdate = true;
      this.geometry.attributes.position.needsUpdate = true;
    }
    this.bubbleSeeds.forEach((bubble, i) => {
      const depth = ((bubble.z - (travel % 230) + 230) % 230) - 5;
      const frame = courseFrame(travel + depth);
      const fork = forkAt(forks, travel + depth);
      const side = i % 2 === 0 ? -1 : 1;
      const x = Math.cos(bubble.angle) * bubble.radius + side * channelOffset(fork, travel + depth);
      const y = Math.sin(bubble.angle) * bubble.radius;
      const px = frame.center.x + frame.right.x * x + frame.up.x * y;
      const py = frame.center.y + frame.right.y * x + frame.up.y * y;
      const pz = frame.center.z + frame.right.z * x + frame.up.z * y;
      this.bubblePositions.set([px, py, pz], i * 3);
    });
    this.bubbles.geometry.attributes.position.needsUpdate = true;
  }
}
