import { maxGravityReach } from "./model";
import { lightYearsPerUnit } from "./flight";

export const portalClearanceDistance = Math.ceil(maxGravityReach * lightYearsPerUnit);

export type ZoneKind = "mines" | "drains" | "traps";
interface Zone {
  kind: ZoneKind;
  start: number;
  end: number;
}
const kinds: ZoneKind[] = ["mines", "drains", "traps"];
export class ZonePlan {
  private readonly zones: Zone[] = [];
  private nextStart: number;
  constructor(private readonly random: () => number) {
    this.nextStart = 1200 + random() * 400;
  }
  prepare(distance: number) {
    while (this.nextStart <= distance) {
      const previous = this.zones.at(-1)?.kind;
      const available = kinds.filter((kind) => kind !== previous);
      const kind = available[Math.floor(this.random() * available.length)];
      const zone = { kind, start: this.nextStart, end: this.nextStart + 320 + this.random() * 260 };
      this.zones.push(zone);
      this.nextStart = zone.end + 600 + this.random() * 800;
    }
  }
  at(distance: number) {
    this.prepare(distance);
    return this.zones.find((zone) => distance >= zone.start && distance < zone.end) ?? null;
  }
  allowsPortal(distance: number) {
    this.prepare(distance + portalClearanceDistance);
    return !this.zones.some(
      (zone) =>
        zone.kind === "mines" &&
        distance >= zone.start - portalClearanceDistance &&
        distance < zone.end + portalClearanceDistance,
    );
  }
}
