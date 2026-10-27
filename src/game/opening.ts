import { initialSpeed } from "./tuning";
import { movementArea } from "./movement";

export const openingSafetySeconds = 2;

export function openingLayout(random: () => number) {
  const angle = random() * Math.PI * 2;
  const radius = Math.sqrt(random()) * 0.75;
  return {
    ringPosition: {
      x: Math.cos(angle) * radius * movementArea.width,
      y: Math.sin(angle) * radius * movementArea.height,
    },
    nextRing: openingSafetySeconds * initialSpeed + random() * 12,
    nextItem: 420 + random() * 160,
    nextPortal: 450 + random() * 200,
    nextHazard: 320 + random() * 120,
  };
}
