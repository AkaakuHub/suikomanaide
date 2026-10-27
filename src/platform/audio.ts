import type { Flight } from "../game/model";
import { PoolMusic } from "./audio/music";
import { FlightEffects } from "./audio/effects";

export class FlightAudio {
  enabled = true;
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private engine: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private music: PoolMusic | null = null;
  private effects: FlightEffects | null = null;
  private resetRequired = false;
  private audioTime = 0;
  private progressAt = 0;
  private clockStalled() {
    return (
      this.context?.state === "running" &&
      this.context.currentTime === this.audioTime &&
      performance.now() - this.progressAt > 750
    );
  }
  private applyVolume() {
    if (!this.context || !this.master) return;
    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(this.enabled ? 0.65 : 0, now, 0.02);
  }
  release() {
    const context = this.context;
    this.context = null;
    this.master = null;
    this.engine = null;
    this.engineGain = null;
    this.music = null;
    this.effects = null;
    this.resetRequired = false;
    if (context && context.state !== "closed") void context.close().catch(() => {});
  }
  async unlock(fromGesture = false) {
    if (!this.enabled || document.hidden) return;
    const resumeStalled =
      fromGesture &&
      this.context !== null &&
      this.context.state !== "running" &&
      performance.now() - this.progressAt > 750;
    if (
      this.resetRequired ||
      this.context?.state === "closed" ||
      this.clockStalled() ||
      resumeStalled
    )
      this.release();
    if (!this.context) {
      const context = new AudioContext();
      this.context = context;
      this.audioTime = context.currentTime;
      this.progressAt = performance.now();
      context.addEventListener("statechange", () => {
        if (this.context !== context) return;
        if (context.state !== "running") this.resetRequired = true;
        else {
          this.resetRequired = false;
          this.audioTime = context.currentTime;
          this.progressAt = performance.now();
        }
      });
      this.master = context.createGain();
      this.master.gain.value = 0.65;
      this.master.connect(context.destination);
      this.music = new PoolMusic(context, this.master);
      this.effects = new FlightEffects(context, this.master);
      this.engine = context.createOscillator();
      this.engine.type = "triangle";
      this.engineGain = context.createGain();
      this.engineGain.gain.value = 0;
      this.engine.connect(this.engineGain);
      this.engineGain.connect(this.master);
      this.engine.start();
    }
    this.applyVolume();
    if (this.context.state !== "running") await this.context.resume();
  }
  async toggle() {
    this.enabled = !this.enabled;
    this.applyVolume();
    if (this.enabled) await this.unlock(true);
  }
  update(state: Flight) {
    if (document.hidden) return;
    if (this.enabled && this.clockStalled()) {
      this.release();
      void this.unlock().catch(() => {});
    }
    const context = this.context;
    if (!context || !this.engine || !this.engineGain || context.state !== "running") return;
    const now = context.currentTime;
    if (now !== this.audioTime) {
      this.audioTime = now;
      this.progressAt = performance.now();
    }
    const active = this.enabled && state.phase === "flying";
    this.music?.update(active);
    this.engine.frequency.setTargetAtTime(90 + state.speed * 0.8, now, 0.1);
    this.engineGain.gain.setTargetAtTime(active ? 0.004 : 0, now, 0.12);
  }
  play(event: string) {
    if (this.enabled && this.context?.state === "running") this.effects?.play(event);
  }
}
