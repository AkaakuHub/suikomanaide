export const effectDuration = {
  shield: 14,
  magnet: 12,
  reverse: 8,
  confusion: 8,
} as const;
export type TimedEffect = keyof typeof effectDuration;
