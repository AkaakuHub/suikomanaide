interface Tone {
  frequency: number;
  duration: number;
  volume: number;
  wave?: OscillatorType;
  when?: number;
  attack?: number;
  endFrequency?: number;
}
export function playTone(context: AudioContext, output: AudioNode, tone: Tone) {
  const start = tone.when ?? context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = tone.wave ?? "sine";
  oscillator.frequency.setValueAtTime(tone.frequency, start);
  if (tone.endFrequency !== undefined)
    oscillator.frequency.exponentialRampToValueAtTime(tone.endFrequency, start + tone.duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(
    tone.volume,
    start + Math.min(tone.attack ?? 0.008, tone.duration / 2),
  );
  gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.duration);
  oscillator.connect(gain);
  gain.connect(output);
  oscillator.start(start);
  oscillator.stop(start + tone.duration + 0.02);
  oscillator.onended = () => {
    oscillator.disconnect();
    gain.disconnect();
  };
}
