import { playTone } from "./tone";

export class FlightEffects {
  constructor(
    private readonly context: AudioContext,
    private readonly output: AudioNode,
  ) {}
  play(event: string) {
    const context = this.context;
    const output = this.output;
    const now = context.currentTime;
    if (event === "衝突") {
      playTone(context, output, {
        frequency: 140,
        endFrequency: 55,
        duration: 0.32,
        volume: 0.13,
        wave: "triangle",
      });
    } else if (event === "操作反転") {
      playTone(context, output, {
        frequency: 720,
        endFrequency: 180,
        duration: 0.45,
        volume: 0.08,
        wave: "triangle",
      });
      playTone(context, output, {
        frequency: 310,
        endFrequency: 155,
        duration: 0.3,
        volume: 0.07,
        when: now + 0.18,
      });
    } else if (event === "混乱") {
      for (const [i, frequency] of [420, 670, 360, 580].entries())
        playTone(context, output, {
          frequency,
          endFrequency: frequency * 0.7,
          duration: 0.25,
          volume: 0.06,
          when: now + i * 0.09,
        });
    } else if (event === "arrived") {
      for (const [i, frequency] of [900, 680, 1050, 520, 760].entries())
        playTone(context, output, {
          frequency,
          endFrequency: 180,
          duration: 0.38,
          volume: 0.07,
          when: now + i * 0.1,
          attack: 0.07,
        });
    } else if (event === "シールドで防御") {
      for (const frequency of [1400, 2100])
        playTone(context, output, { frequency, duration: 0.22, volume: 0.045 });
    } else if (event === "マグネット獲得") {
      playTone(context, output, {
        frequency: 240,
        endFrequency: 880,
        duration: 0.4,
        volume: 0.075,
        wave: "triangle",
      });
    } else {
      const notes = event === "リング回収" ? [784, 1175] : [587, 880, 1175];
      notes.forEach((frequency, index) =>
        playTone(context, output, {
          frequency,
          duration: 0.28,
          volume: 0.065,
          when: now + index * 0.07,
        }),
      );
    }
  }
}
