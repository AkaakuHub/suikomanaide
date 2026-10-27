import * as THREE from "three";
import { Zap, HeartPulse, ChevronsUp } from "lucide";
import { courseFrame } from "../game/course";
import { channelOffset, forkAt } from "../game/routes";
import type { ChannelSide, Fork } from "../game/routes";
import { iconSprite } from "./icon";

export function channelFrame(station: number, forks: Fork[], side?: ChannelSide) {
  const frame = courseFrame(station);
  const fork = forkAt(forks, station);
  const offset = channelOffset(fork, station) * (side ?? fork?.selected ?? 0);
  return {
    ...frame,
    center: {
      x: frame.center.x + frame.right.x * offset,
      y: frame.center.y + frame.right.y * offset,
      z: frame.center.z + frame.right.z * offset,
    },
  };
}
function sign(rapid: boolean) {
  const group = new THREE.Group();
  const color = rapid ? "#ffb64c" : "#69ffce";
  group.add(
    new THREE.Mesh(
      new THREE.BoxGeometry(4, 1.6, 0.2),
      new THREE.MeshBasicMaterial({ color: "#102c3c" }),
    ),
  );
  const icon = iconSprite(rapid ? Zap : HeartPulse, color, 1.1);
  icon.position.set(-1.2, 0, 0.15);
  group.add(icon);
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("分水路の案内を描画できません。");
  context.fillStyle = color;
  context.font = "bold 72px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(rapid ? "急流" : "回復", 128, 64);
  const label = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(canvas),
      transparent: true,
      depthWrite: false,
      fog: false,
    }),
  );
  label.scale.set(2.2, 1.1, 1);
  label.position.set(0.65, 0, 0.15);
  group.add(label);
  const arrows = iconSprite(ChevronsUp, color, 1.5);
  arrows.position.y = -4.8;
  group.add(arrows);
  return group;
}
export class Channels {
  readonly group = new THREE.Group();
  private readonly rails = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.24, 8, 6),
    new THREE.MeshBasicMaterial({ color: "#ffffff", fog: false }),
    144,
  );
  private readonly matrix = new THREE.Matrix4();
  private readonly color = new THREE.Color();
  private readonly rapid = sign(true);
  private readonly calm = sign(false);
  private readonly markers = new Map<number, THREE.Group>();
  private forks: Fork[] | null = null;
  update(forks: Fork[], travel: number) {
    if (this.forks !== forks) {
      this.group.clear();
      this.group.add(this.rails);
      this.markers.clear();
      this.forks = forks;
    }
    let count = 0;
    for (const fork of forks) {
      if (fork.start > travel + 260 || fork.start + 320 < travel) continue;
      for (const side of [-1, 1]) {
        this.color.set(side === fork.rapidSide ? "#ffbc5e" : "#7affd1");
        for (let j = 0; j < 9; j++) {
          const station = fork.start + j * 40;
          const frame = courseFrame(station);
          const spread = channelOffset(fork, station);
          for (const edge of [-1, 1]) {
            const x = side * Math.max(0.8, spread + edge * 4.5);
            this.matrix.makeTranslation(
              frame.center.x + frame.right.x * x - frame.up.x * 2.8,
              frame.center.y + frame.right.y * x - frame.up.y * 2.8,
              frame.center.z + frame.right.z * x - frame.up.z * 2.8,
            );
            this.rails.setMatrixAt(count, this.matrix);
            this.rails.setColorAt(count++, this.color);
          }
        }
      }
    }
    this.rails.count = count;
    this.rails.instanceMatrix.needsUpdate = true;
    if (this.rails.instanceColor) this.rails.instanceColor.needsUpdate = true;
    this.rails.frustumCulled = false;
    for (const fork of forks) {
      let marker = this.markers.get(fork.start);
      if (fork.start < travel - 30 || fork.start > travel + 260) {
        if (marker) marker.visible = false;
        continue;
      }
      if (!marker) {
        marker = new THREE.Group();
        for (const side of [-1, 1]) {
          const board = (side === fork.rapidSide ? this.rapid : this.calm).clone();
          board.position.set(side * 3.3, 3, 0);
          marker.add(board);
        }
        const frame = courseFrame(fork.start);
        marker.position.set(frame.center.x, frame.center.y, frame.center.z);
        marker.quaternion.setFromRotationMatrix(
          new THREE.Matrix4().makeBasis(
            new THREE.Vector3(frame.right.x, frame.right.y, frame.right.z),
            new THREE.Vector3(frame.up.x, frame.up.y, frame.up.z),
            new THREE.Vector3(-frame.forward.x, -frame.forward.y, -frame.forward.z),
          ),
        );
        this.markers.set(fork.start, marker);
        this.group.add(marker);
      }
      marker.visible = true;
    }
  }
}
