import { expect, it } from "vite-plus/test";
import { Object3D, Vector3 } from "three";
import { createFlight } from "../game/model";
import { Attraction } from "./attraction";

function setup() {
  const state = createFlight();
  state.travel = 200;
  state.speed = 15;
  state.energy = 0;
  state.forks = [{ start: 100, end: 900, rapidSide: 1, selected: 1 }];
  state.entities = [
    {
      id: 1,
      kind: "portal",
      x: 2,
      y: 1,
      z: -10,
      color: "blue",
      rarity: 1,
      branch: { start: 100, side: 1 },
    },
  ];
  const target = new Object3D();
  target.position.set(120, 30, -70);
  return { state, target, meshes: new Map([[1, target]]), start: new Vector3(100, 20, -50) };
}
it("吸引線は自機から始まり、分岐先に描画した排水口の中心へ届く", () => {
  const { state, target, meshes, start } = setup();
  const attraction = new Attraction();
  for (const time of [0, 0.7, 3]) {
    attraction.update(state, start, time, meshes);
    expect(attraction.mesh.visible).toBe(true);
    const vertices = attraction.mesh.geometry.getAttribute("position");
    for (let arm = 0; arm < 6; arm++) {
      expect(new Vector3().fromBufferAttribute(vertices, arm * 32)).toEqual(start);
      expect(new Vector3().fromBufferAttribute(vertices, arm * 32 + 31)).toEqual(target.position);
    }
  }
});
it("別水路の排水口へ吸引線を描かない", () => {
  const { state, meshes, start } = setup();
  state.forks[0].selected = -1;
  const attraction = new Attraction();
  attraction.update(state, start, 0, meshes);
  expect(attraction.mesh.visible).toBe(false);
});
