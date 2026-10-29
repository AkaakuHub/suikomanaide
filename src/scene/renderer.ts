import { Channels, channelFrame } from "./channels";
import * as THREE from "three";
import { createEntityMesh, createShip } from "./objects";
import { Tunnel } from "./tunnel";
import { createMystery } from "./mystery";
import { Attraction } from "./attraction";
import type { CourseFrame } from "../game/course";
import type { Flight } from "../game/model";
import { itemScale } from "../game/collision";

function position(frame: CourseFrame, x: number, y: number) {
  return new THREE.Vector3(
    frame.center.x + frame.right.x * x + frame.up.x * y,
    frame.center.y + frame.right.y * x + frame.up.y * y,
    frame.center.z + frame.right.z * x + frame.up.z * y,
  );
}
function orientation(frame: CourseFrame) {
  return new THREE.Matrix4().makeBasis(
    new THREE.Vector3(frame.right.x, frame.right.y, frame.right.z),
    new THREE.Vector3(frame.up.x, frame.up.y, frame.up.z),
    new THREE.Vector3(-frame.forward.x, -frame.forward.y, -frame.forward.z),
  );
}
export class FlightRenderer {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(66, 1, 0.1, 320);
  private readonly ship = createShip();
  private readonly tunnel = new Tunnel();
  private readonly channels = new Channels();
  private readonly attraction = new Attraction();
  private readonly mystery = createMystery();
  private readonly meshes = new Map<number, THREE.Group>();
  private readonly templates = new Map<string, THREE.Group>();
  private time = 0;
  private flight: Flight | null = null;
  constructor(host: HTMLElement) {
    this.ship.scale.setScalar(1.18);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setClearColor("#061020");
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    const canvas = this.renderer.domElement;
    canvas.className = "world";
    canvas.setAttribute("aria-hidden", "true");
    host.append(canvas);
    this.scene.fog = new THREE.FogExp2("#071525", 0.003);
    this.scene.add(
      this.tunnel.group,
      this.channels.group,
      this.ship,
      this.attraction.mesh,
      new THREE.AmbientLight("#d0faff", 2.6),
    );
    const light = new THREE.DirectionalLight("#fff1de", 4);
    light.position.set(-3, 5, 8);
    this.camera.add(light);
    this.scene.add(this.camera);
    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      this.renderer.setSize(width, height);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    };
    new ResizeObserver(resize).observe(host);
    resize();
  }
  capture() {
    const source = this.renderer.domElement;
    const snapshot = document.createElement("canvas");
    snapshot.width = source.width;
    snapshot.height = source.height;
    const context = snapshot.getContext("2d");
    if (!context) throw new Error("ゲーム画像を取得できませんでした。");
    context.drawImage(source, 0, 0);
    return snapshot;
  }
  render(state: Flight, dt: number) {
    if (this.flight !== state) {
      for (const mesh of this.meshes.values()) this.scene.remove(mesh);
      this.meshes.clear();
      this.flight = state;
      this.time = 0;
    }
    if (state.phase === "flying") this.time += dt;
    const travel = state.travel;
    const pull = THREE.MathUtils.clamp(state.gravity / 32, 0, 1);
    this.tunnel.update(travel, state.speed, state.forks);
    this.channels.update(state.forks, travel);
    const entities = state.entities;
    const confused = state.confusion > 0;
    const active = new Set(entities.map((entity) => entity.id));
    for (const [id, mesh] of this.meshes) {
      if (!active.has(id)) {
        this.scene.remove(mesh);
        this.meshes.delete(id);
      }
    }
    for (const entity of entities) {
      let mesh = this.meshes.get(entity.id);
      if (!mesh) {
        const key =
          entity.kind === "portal"
            ? `${entity.kind}-${entity.color}-${entity.rarity}`
            : entity.kind === "hazard"
              ? `hazard-${entity.motion?.kind ?? "static"}`
              : entity.kind;
        let template = this.templates.get(key);
        if (!template) {
          template = createEntityMesh(entity);
          this.templates.set(key, template);
        }
        mesh = new THREE.Group();
        mesh.add(template.clone(), this.mystery.clone());
        mesh.traverse((object) => {
          if (
            object instanceof THREE.Mesh ||
            object instanceof THREE.Sprite ||
            object instanceof THREE.Line
          ) {
            object.renderOrder = 0;
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            for (const material of materials) {
              material.depthTest = true;
              material.depthWrite = !material.transparent;
              if (
                material instanceof THREE.MeshStandardMaterial ||
                material instanceof THREE.MeshBasicMaterial ||
                material instanceof THREE.SpriteMaterial ||
                material instanceof THREE.LineBasicMaterial
              )
                material.fog = false;
            }
          }
        });
        this.meshes.set(entity.id, mesh);
        this.scene.add(mesh);
      }
      mesh.children[0].visible = !confused;
      mesh.children[1].visible = confused;
      const frame = channelFrame(travel - entity.z, state.forks, entity.branch?.side);
      mesh.position.copy(position(frame, entity.x, entity.y));
      mesh.scale.setScalar(
        (!confused && entity.kind === "portal" ? 1 : itemScale) *
          (1 + Math.max(0, -entity.z - 35) / 130),
      );
      mesh.quaternion.setFromRotationMatrix(orientation(frame));
      if (!confused)
        mesh.rotateZ(
          entity.kind === "shield" || entity.kind === "magnet" || entity.kind === "reverse"
            ? Math.sin(this.time * 1.2) * 0.12
            : this.time * (entity.kind === "portal" ? 0.3 : 0.7),
        );
      if (!confused && entity.kind === "hazard") mesh.rotateY(this.time);
      if (!confused && entity.kind === "portal")
        mesh.traverse((object) => {
          if (object instanceof THREE.Mesh && object.material instanceof THREE.ShaderMaterial)
            object.material.uniforms.time.value = this.time;
        });
    }
    const frame = channelFrame(travel, state.forks);
    const shipX = state.x;
    const shipY = state.y;
    this.ship.position.copy(position(frame, shipX, shipY));
    this.ship.quaternion.setFromRotationMatrix(orientation(frame));
    this.ship.rotateZ(-state.vx * 0.045 + Math.sin(this.time * 19) * pull * 0.045);
    this.ship.rotateX(state.vy * 0.025 + Math.sin(this.time * 23) * pull * 0.02);
    this.attraction.update(state, this.ship.position, this.time, this.meshes);
    const kick = Math.sin(this.time * (4 + state.speed * 0.06));
    for (const part of this.ship.children) {
      if (part.name === "left-fin" || part.name === "right-fin") {
        const side = part.name === "left-fin" ? -1 : 1;
        part.rotation.x = kick * side * 0.22;
        part.position.y = 0.07 + kick * side * 0.08;
      } else if (part.name === "left-arm" || part.name === "right-arm") {
        const side = part.name === "left-arm" ? -1 : 1;
        part.rotation.z = side * (0.25 + kick * 0.08);
      }
    }
    const cameraPosition = position(frame, 0, 0);
    cameraPosition.addScaledVector(
      new THREE.Vector3(frame.forward.x, frame.forward.y, frame.forward.z),
      -12,
    );
    this.camera.position.copy(cameraPosition);
    this.camera.up.set(frame.up.x, frame.up.y, frame.up.z);
    const look = position(frame, 0, 0);
    look.addScaledVector(new THREE.Vector3(frame.forward.x, frame.forward.y, frame.forward.z), 32);
    this.camera.lookAt(look);
    const horizontalFov = 78;
    this.camera.fov = THREE.MathUtils.radToDeg(
      2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(horizontalFov / 2)) / this.camera.aspect),
    );
    this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene, this.camera);
  }
}
