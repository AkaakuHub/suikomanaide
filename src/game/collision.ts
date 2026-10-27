import type { EntityKind } from "./model";

export const itemScale = 1.25;
export function collisionRadius(kind: EntityKind) {
  return kind === "portal" ? 1.65 : kind === "ring" ? 1.5 : 1.2;
}
