import { playTone } from "./tone";

const chords: readonly (readonly number[])[] = [
  [60, 64, 67, 74],
  [57, 60, 64, 71],
  [65, 69, 72, 76],
  [55, 62, 67, 71],
];
const frequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
export class PoolMusic {
  private readonly bus: GainNode;
  private nextChord = 0;
  private nextNote = 0;
  private chord = 0;
  private note = 0;
  constructor(
    private readonly context: AudioContext,
    output: AudioNode,
  ) {
    this.bus = context.createGain();
    this.bus.gain.value = 0;
    this.bus.connect(output);
    const delay = context.createDelay(1);
    delay.delayTime.value = 0.42;
    const feedback = context.createGain();
    feedback.gain.value = 0.22;
    const wet = context.createGain();
    wet.gain.value = 0.2;
    this.bus.connect(delay);
    delay.connect(wet);
    wet.connect(output);
    delay.connect(feedback);
    feedback.connect(delay);
  }
  update(active: boolean) {
    const now = this.context.currentTime;
    this.bus.gain.setTargetAtTime(active ? 0.42 : 0, now, 0.25);
    if (!active) {
      this.nextChord = now;
      this.nextNote = now;
      return;
    }
    if (this.nextChord < now) this.nextChord = now;
    while (this.nextChord < now + 0.15) {
      const chord = chords[this.chord % chords.length];
      for (const midi of chord)
        playTone(this.context, this.bus, {
          frequency: frequency(midi),
          duration: 4.8,
          volume: 0.038,
          attack: 0.3,
          when: this.nextChord,
        });
      playTone(this.context, this.bus, {
        frequency: frequency(chord[0] - 12),
        duration: 4.6,
        volume: 0.038,
        attack: 0.8,
        wave: "triangle",
        when: this.nextChord,
      });
      this.nextChord += 4.8;
      this.chord++;
    }
    if (this.nextNote < now) this.nextNote = now;
    while (this.nextNote < now + 0.15) {
      const chord = chords[(this.chord + chords.length - 1) % chords.length];
      const order = [0, 2, 1, 3, 2, 1, 3, 1];
      playTone(this.context, this.bus, {
        frequency: frequency(chord[order[this.note % order.length]] + 12),
        duration: 0.85,
        volume: 0.055,
        attack: 0.02,
        when: this.nextNote,
      });
      this.nextNote += 0.6;
      this.note++;
    }
  }
}
