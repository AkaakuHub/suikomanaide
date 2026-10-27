interface Vector {
  x: number;
  y: number;
  z: number;
}
export interface CourseFrame {
  center: Vector;
  right: Vector;
  up: Vector;
  forward: Vector;
}
const step = 2;
const centers: Vector[] = [{ x: 0, y: 0, z: 0 }];
function direction(distance: number) {
  const yaw = Math.sin(distance / 170) * 0.85 + Math.sin(distance / 320) * 0.45;
  const pitch = Math.sin(distance / 210) * 0.3 + Math.sin(distance / 95) * 0.09;
  return { yaw, pitch };
}
export function courseFrame(distance: number): CourseFrame {
  const station = Math.max(0, distance);
  const index = Math.floor(station / step);
  while (centers.length <= index + 1) {
    const at = (centers.length - 0.5) * step;
    const { yaw, pitch } = direction(at);
    const previous = centers[centers.length - 1];
    centers.push({
      x: previous.x + Math.sin(yaw) * Math.cos(pitch) * step,
      y: previous.y + Math.sin(pitch) * step,
      z: previous.z - Math.cos(yaw) * Math.cos(pitch) * step,
    });
  }
  const a = centers[index];
  const b = centers[index + 1];
  const t = station / step - index;
  const { yaw, pitch } = direction(station);
  return {
    center: {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      z: distance < 0 ? -distance : a.z + (b.z - a.z) * t,
    },
    right: { x: Math.cos(yaw), y: 0, z: Math.sin(yaw) },
    up: {
      x: -Math.sin(yaw) * Math.sin(pitch),
      y: Math.cos(pitch),
      z: Math.cos(yaw) * Math.sin(pitch),
    },
    forward: {
      x: Math.sin(yaw) * Math.cos(pitch),
      y: Math.sin(pitch),
      z: -Math.cos(yaw) * Math.cos(pitch),
    },
  };
}
export function curveAcceleration(travel: number, speed: number) {
  const before = direction(travel - 1);
  const after = direction(travel + 1);
  return {
    x: -(after.yaw - before.yaw) * speed * speed * 0.11,
    y: -(after.pitch - before.pitch) * speed * speed * 0.11,
  };
}
