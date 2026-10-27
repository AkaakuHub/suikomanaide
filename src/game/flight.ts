import { cruiseEnergy, initialSpeed } from "./tuning";
import { clamp } from "./model";

export const lightYearsPerUnit = 1;
export function flightSpeed(speed: number, energy: number, dt: number) {
  const reserve = clamp(energy / cruiseEnergy, 0, 1);
  const depleted = 1 - clamp(energy / 35, 0, 1);
  const drag = 0.006 + 0.114 * (1 - reserve) ** 2 + 0.8 * depleted ** 2;
  return 9 + (speed - 9) * Math.exp(-drag * dt);
}
export function steeringSpeed(speed: number) {
  const control = clamp((speed - 9) / (initialSpeed - 9), 0, 1) ** 1.2;
  return (8 + speed * 0.06) * (0.16 + 0.84 * control);
}
