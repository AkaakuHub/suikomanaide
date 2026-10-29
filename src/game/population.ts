import { ForkPlan, forkAt } from "./routes";
import type { Entity, EntityKind, Flight, PortalColor } from "./model";
import { portalRarity } from "./model";
import { ringSupply, ringCutoffDistance } from "./supply";
import { lightYearsPerUnit } from "./flight";
import { openingLayout } from "./opening";
import { nextRingPosition } from "./ring-layout";
import { flightDifficulty } from "./difficulty";
import { movementArea } from "./movement";
import { ringRouteAmbush } from "./ambush";
import type { RingWaypoint } from "./ambush";
import { placeOutsideLane, safeLane } from "./placement";
import { createHazardMotion, advanceHazard } from "./hazard-motion";
import { ZonePlan } from "./zones";

const colors: PortalColor[] = ["red", "blue", "green", "gold", "white"];
export class Population {
  private ringPosition = { x: 0, y: 0 };
  private nextRing = 0;
  private nextPortal = 0;
  private nextItem = 0;
  private nextHazard = 0;
  private lastRing = 0;
  private ringRoute: RingWaypoint[] = [];
  private zones: ZonePlan;
  private channels: ForkPlan;
  constructor(private readonly random: () => number) {
    this.zones = new ZonePlan(random);
    this.channels = new ForkPlan(random);
  }
  start(state: Flight) {
    const opening = openingLayout(this.random);
    this.ringPosition = opening.ringPosition;
    this.nextRing = opening.nextRing;
    this.nextPortal = opening.nextPortal;
    this.nextItem = opening.nextItem;
    this.nextHazard = opening.nextHazard;
    this.lastRing = 0;
    this.ringRoute = [];
    this.zones = new ZonePlan(this.random);
    this.channels = new ForkPlan(this.random);
    state.forks = this.channels.forks;
    this.populate(state);
  }
  private spawn(s: Flight, kind: EntityKind, x?: number, y?: number, z = -120) {
    const fork = forkAt(s.forks, s.travel - z);
    const safe = kind === "shield" || kind === "magnet";
    const branch = fork
      ? {
          start: fork.start,
          side: safe ? (fork.rapidSide === 1 ? (-1 as const) : (1 as const)) : fork.rapidSide,
        }
      : undefined;
    const angle = this.random() * Math.PI * 2;
    const inset = flightDifficulty(
      (s.travel - z) * lightYearsPerUnit,
      null,
      fork !== undefined,
    ).portalInset;
    const radius =
      kind === "portal" ? inset + this.random() * (0.94 - inset) : Math.sqrt(this.random()) * 0.85;
    const point = placeOutsideLane(kind, s.travel - z, {
      x: x ?? Math.cos(angle) * radius * movementArea.width,
      y: y ?? Math.sin(angle) * radius * movementArea.height,
    });
    const entity: Entity = {
      id: s.nextId++,
      kind,
      x: point.x,
      y: point.y,
      z,
      branch,
      color: colors[Math.min(4, Math.floor(this.random() * 5))],
      rarity: portalRarity((s.travel - z) * lightYearsPerUnit, this.random()),
    };
    const distance = (s.travel - z) * lightYearsPerUnit;
    if (
      kind === "hazard" &&
      !s.forks.some(
        (route) => s.travel - z >= route.start - 300 && s.travel - z <= route.end + 300,
      ) &&
      this.random() < flightDifficulty(distance).movingHazardChance
    ) {
      entity.motion = createHazardMotion(point, s.travel - z, distance, this.random);
      advanceHazard(entity, 0);
    }
    s.entities.push(entity);
    return entity;
  }
  populate(s: Flight) {
    const horizon = s.travel + 260;
    this.zones.prepare(horizon * lightYearsPerUnit + 100);
    this.channels.prepare(horizon + 260);
    while (this.nextRing <= horizon && this.nextRing * lightYearsPerUnit < ringCutoffDistance) {
      const distance = this.nextRing * lightYearsPerUnit;
      const supply = ringSupply(distance);
      const z = s.travel - this.nextRing;
      const guaranteed = this.nextRing - this.lastRing >= (distance < 4000 ? 350 : 1000);
      if (this.random() < supply.probability || guaranteed) {
        this.ringPosition = guaranteed
          ? safeLane(this.nextRing)
          : nextRingPosition(this.ringPosition, this.random(), this.random());
        this.spawn(s, "ring", this.ringPosition.x, this.ringPosition.y, z);
        this.lastRing = this.nextRing;
        this.ringRoute.push({ ...this.ringPosition, station: this.nextRing });
      }
      const spacing = distance < 2000 ? 0.65 + this.random() * 0.7 : 0.85 + this.random() * 0.3;
      this.nextRing += supply.interval * 60 * spacing;
    }
    this.ringRoute = this.ringRoute.filter((ring) => ring.station > s.travel - 1200);
    while (this.nextHazard <= horizon) {
      const distance = this.nextHazard * lightYearsPerUnit;
      const difficulty = flightDifficulty(
        distance,
        this.zones.at(distance)?.kind,
        forkAt(s.forks, distance / lightYearsPerUnit) !== undefined,
      );
      const z = s.travel - this.nextHazard;
      const hazard = this.spawn(s, "hazard", undefined, undefined, z);
      if (this.random() < difficulty.pairedHazardChance)
        this.spawn(s, "hazard", -hazard.x, -hazard.y, z - 12);
      this.nextHazard += difficulty.hazardSpacing * (0.85 + this.random() * 0.3);
    }
    while (this.nextPortal <= horizon) {
      const distance = this.nextPortal * lightYearsPerUnit;
      const difficulty = flightDifficulty(
        distance,
        this.zones.at(distance)?.kind,
        forkAt(s.forks, distance / lightYearsPerUnit) !== undefined,
      );
      if (this.zones.allowsPortal(distance))
        this.spawn(s, "portal", undefined, undefined, s.travel - this.nextPortal);
      this.nextPortal += difficulty.portalSpacing * (0.85 + this.random() * 0.3);
    }
    while (this.nextItem <= horizon) {
      const distance = this.nextItem * lightYearsPerUnit;
      const difficulty = flightDifficulty(
        distance,
        this.zones.at(distance)?.kind,
        forkAt(s.forks, distance / lightYearsPerUnit) !== undefined,
      );
      if (distance >= 5000 || this.random() < difficulty.reverseChance) {
        const kind = distance >= 1200 && this.random() < 0.3 ? "confusion" : "reverse";
        const ambush =
          this.random() < difficulty.routeAmbushChance
            ? ringRouteAmbush(kind, this.ringRoute, this.nextItem, this.random())
            : null;
        this.spawn(s, kind, ambush?.x, ambush?.y, s.travel - (ambush?.station ?? this.nextItem));
      } else {
        const items: EntityKind[] = ["shield", "magnet"];
        this.spawn(
          s,
          items[Math.min(items.length - 1, Math.floor(this.random() * items.length))],
          undefined,
          undefined,
          s.travel - this.nextItem,
        );
      }
      this.nextItem += difficulty.itemSpacing * (0.85 + this.random() * 0.3);
    }
  }
}
