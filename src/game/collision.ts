import type { EntityKind } from "./model";

export const portalScale = 1.5;
export const itemScale = 1.25;
export function collisionRadius(kind: EntityKind) {
  return kind === "portal" ? 1.65 * portalScale : kind === "ring" ? 1.5 : 1.2;
}
