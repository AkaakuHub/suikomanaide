import { channelAccessible } from "./routes";
import { advanceCurrent } from "./current";
import { collectPickup } from "./pickups";
import { clamp, createFlight, gravityForce } from "./model";
import type { Control, Flight } from "./model";
import { curveAcceleration } from "./course";
import { constrainMovement, steeringVelocity } from "./movement";
import { steeringSpeed } from "./flight";
import { Population } from "./population";
import { advanceHazard } from "./hazard-motion";
import { collisionRadius } from "./collision";

export class Simulation {
  state: Flight = createFlight();
  private readonly population: Population;
  constructor(random: () => number) {
    this.population = new Population(random);
  }
  start() {
    this.state = createFlight();
    this.state.phase = "flying";
    this.population.start(this.state);
  }
  private announce(message: string) {
    this.state.event = message;
    this.state.eventTime = 2;
  }
  tick(dt: number, input: Control) {
    const s = this.state;
    if (s.phase !== "flying") return;
    dt = clamp(dt, 0, 1 / 30);
    s.elapsed += dt;
    s.eventTime = Math.max(0, s.eventTime - dt);
    for (const key of ["shield", "magnet", "reverse", "confusion", "hitGrace"] as const)
      s[key] = Math.max(0, s[key] - dt);
    const currentEvent = advanceCurrent(s, dt);
    if (currentEvent) this.announce(currentEvent);
    s.gravity = 0;
    let gx = 0;
    let gy = 0;
    for (const entity of s.entities) {
      if (entity.kind !== "portal" || !channelAccessible(s.forks, s.travel, entity.branch))
        continue;
      const force = gravityForce(entity, s);
      gx += force.x;
      gy += force.y;
      s.gravity = Math.max(s.gravity, force.strength);
    }
    const length = Math.max(1, Math.hypot(input.x, input.y));
    const steering = steeringSpeed(s.speed);
    const direction = s.reverse > 0 ? -1 : 1;
    const bend = curveAcceleration(s.travel, s.speed);
    s.vx = steeringVelocity(s.vx, (input.x / length) * direction, steering, gx + bend.x, dt);
    s.vy = steeringVelocity(s.vy, (input.y / length) * direction, steering, gy + bend.y, dt);
    const previousX = s.x;
    const previousY = s.y;
    Object.assign(s, constrainMovement(s.x + s.vx * dt, s.y + s.vy * dt, s.vx, s.vy));
    s.energy = Math.max(
      0,
      s.energy - Math.abs(s.x - previousX) * Math.min(1, Math.abs(input.x)) * 0.015,
    );
    for (const entity of s.entities) {
      const previousZ = entity.z;
      const previousEntityX = entity.x;
      const previousEntityY = entity.y;
      entity.z += s.speed * dt;
      if (entity.kind === "hazard") advanceHazard(entity, dt);
      if (
        entity.kind === "ring" &&
        s.magnet > 0 &&
        channelAccessible(s.forks, s.travel, entity.branch) &&
        entity.z > -25 &&
        Math.hypot(entity.x - s.x, entity.y - s.y) < 5
      ) {
        entity.x += (s.x - entity.x) * dt * 5;
        entity.y += (s.y - entity.y) * dt * 5;
      }
      if (previousZ <= 0 && entity.z >= 0 && channelAccessible(s.forks, s.travel, entity.branch)) {
        const radius = collisionRadius(entity.kind);
        const t = -previousZ / Math.max(0.000001, entity.z - previousZ);
        const dx =
          previousEntityX + (entity.x - previousEntityX) * t - (previousX + (s.x - previousX) * t);
        const dy =
          previousEntityY + (entity.y - previousEntityY) * t - (previousY + (s.y - previousY) * t);
        if (Math.hypot(dx, dy) < radius) {
          const event = collectPickup(s, entity);
          if (event) this.announce(event);
          if (s.destination) break;
          entity.z = 12;
        }
      }
    }
    s.entities = s.entities.filter((entity) => entity.z < 10);
    if (s.phase === "flying") this.population.populate(s);
  }
}
