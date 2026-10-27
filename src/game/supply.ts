export const ringCutoffDistance = 5000;

export function ringSupply(distance: number) {
  if (distance < 270) return { interval: 1.1, probability: 1 };
  if (distance < 1200) return { interval: 1.8, probability: 0.9 };
  if (distance < 2500) return { interval: 1.6, probability: 0.62 };
  if (distance < 4000) return { interval: 2, probability: 0.35 };
  if (distance < 4750) return { interval: 2.4, probability: 0.09 };
  if (distance < ringCutoffDistance) return { interval: 2.8, probability: 0.025 };
  return { interval: 2, probability: 0 };
}
