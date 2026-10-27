import type { Flight } from "./model";
import { selectChannel } from "./routes";
import { energyDrainBase, maxFlightSpeed, initialSpeed } from "./tuning";
import { flightSpeed, lightYearsPerUnit } from "./flight";

export function advanceCurrent(s: Flight, dt: number): string | null {
  const beforeTravel = s.travel;
  const previousFork = s.forks.find((fork) => fork.selected === null && fork.start >= s.travel);
  const channel = selectChannel(s.forks, s.travel, s.x);
  const calm = channel && channel.selected !== channel.rapidSide;
  s.energy = Math.max(
    0,
    s.energy - dt * (energyDrainBase + s.distance / 5000) * (calm ? 0.4 : channel ? 1.5 : 1),
  );
  s.speed = flightSpeed(s.speed, s.energy, dt);
  if (channel)
    s.speed = calm
      ? initialSpeed + (s.speed - initialSpeed) * Math.exp(-dt * 1.5)
      : Math.min(maxFlightSpeed, s.speed + 14 * dt);
  s.distance += s.speed * dt * lightYearsPerUnit;
  s.travel += s.speed * dt;
  const entered = selectChannel(s.forks, s.travel, s.x);
  if (entered && entered === previousFork && beforeTravel < entered.start) {
    if (entered.selected !== entered.rapidSide) s.energy += 12;
    return entered.selected === entered.rapidSide ? "急流" : "ゆったり";
  }
  return null;
}
