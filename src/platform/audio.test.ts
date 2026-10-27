import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";
import { FlightAudio } from "./audio";
import { createFlight } from "../game/model";

class AudioParameter {
  value = 0;
  cancelScheduledValues = vi.fn();
  setValueAtTime = vi.fn((value: number) => {
    this.value = value;
  });
  setTargetAtTime = vi.fn((value: number) => {
    this.value = value;
  });
  linearRampToValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
}
class AudioNodeStub {
  gain = new AudioParameter();
  frequency = new AudioParameter();
  delayTime = new AudioParameter();
  connect = vi.fn();
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
  type = "sine";
  onended: (() => void) | null = null;
}
class AudioContextStub {
  static instances: AudioContextStub[] = [];
  static pendingResume = false;
  state: AudioContextState = "suspended";
  currentTime = 0;
  destination = new AudioNodeStub();
  gains: AudioNodeStub[] = [];
  oscillators: AudioNodeStub[] = [];
  private readonly listeners: (() => void)[] = [];
  addEventListener(_event: string, listener: () => void) {
    this.listeners.push(listener);
  }
  constructor() {
    AudioContextStub.instances.push(this);
  }
  resume = vi.fn(() => {
    if (AudioContextStub.pendingResume) return new Promise<void>(() => {});
    this.change("running");
    return Promise.resolve();
  });
  close = vi.fn(() => {
    this.change("closed");
    return Promise.resolve();
  });
  change(state: AudioContextState) {
    this.state = state;
    for (const listener of this.listeners) listener();
  }
  createGain() {
    const node = new AudioNodeStub();
    this.gains.push(node);
    return node;
  }
  createOscillator() {
    const node = new AudioNodeStub();
    this.oscillators.push(node);
    return node;
  }
  createDelay() {
    return new AudioNodeStub();
  }
}
let wallTime = 0;
const flight = () => ({ ...createFlight(), phase: "flying" as const });
beforeEach(() => {
  AudioContextStub.instances = [];
  AudioContextStub.pendingResume = false;
  wallTime = 0;
  vi.stubGlobal("AudioContext", AudioContextStub);
  vi.stubGlobal("document", { hidden: false });
  vi.spyOn(performance, "now").mockImplementation(() => wallTime);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("背景に移る前の音声処理を破棄し、復帰後の操作でBGMを新しく再生する", async () => {
  const audio = new FlightAudio();
  await audio.unlock();
  const old = AudioContextStub.instances[0];
  audio.update(flight());
  audio.release();
  expect(old.close).toHaveBeenCalledOnce();
  await audio.unlock();
  audio.update(flight());
  const current = AudioContextStub.instances[1];
  expect(current.state).toBe("running");
  expect(current.oscillators.length).toBeGreaterThan(1);
  expect(current.gains[1].gain.value).toBeGreaterThan(0);
});
it("runningでも再生時計が止まった音声処理を交換する", async () => {
  const audio = new FlightAudio();
  await audio.unlock();
  const old = AudioContextStub.instances[0];
  audio.update(flight());
  wallTime = 800;
  audio.update(flight());
  expect(old.close).toHaveBeenCalledOnce();
  expect(AudioContextStub.instances).toHaveLength(2);
  expect(AudioContextStub.instances[1].oscillators.length).toBeGreaterThan(1);
});
it("再生時計が進む場合は長いフレーム間隔でも音声処理を交換しない", async () => {
  const audio = new FlightAudio();
  await audio.unlock();
  wallTime = 2000;
  AudioContextStub.instances[0].currentTime = 2;
  audio.update(flight());
  expect(AudioContextStub.instances).toHaveLength(1);
});
it("中断状態が続く間は作り直しを繰り返さず、次の操作で再開する", async () => {
  const audio = new FlightAudio();
  await audio.unlock();
  const old = AudioContextStub.instances[0];
  old.change("suspended");
  for (let i = 0; i < 60; i++) audio.update(flight());
  expect(AudioContextStub.instances).toHaveLength(1);
  await audio.unlock();
  expect(old.close).toHaveBeenCalledOnce();
  expect(AudioContextStub.instances[1].state).toBe("running");
});
it("古い再開待ちが未解決でも復帰後の操作と音量の復元を妨げない", async () => {
  const audio = new FlightAudio();
  AudioContextStub.pendingResume = true;
  void audio.unlock();
  await audio.toggle();
  const old = AudioContextStub.instances[0];
  expect(old.gains[0].gain.value).toBe(0);
  void audio.toggle();
  expect(old.gains[0].gain.value).toBeGreaterThan(0);
  audio.release();
  AudioContextStub.pendingResume = false;
  await audio.unlock();
  audio.update(flight());
  old.change("suspended");
  await audio.unlock();
  expect(AudioContextStub.instances).toHaveLength(2);
  expect(AudioContextStub.instances[1].oscillators.length).toBeGreaterThan(1);
});
it("音をオフにした後は背景復帰でも音声処理を作成しない", async () => {
  const audio = new FlightAudio();
  await audio.unlock();
  await audio.toggle();
  audio.release();
  await audio.unlock();
  audio.update(flight());
  expect(AudioContextStub.instances).toHaveLength(1);
  expect(audio.enabled).toBe(false);
});

it("再開待ちが止まった初回の音声処理を次のユーザー操作で交換する", async () => {
  const audio = new FlightAudio();
  AudioContextStub.pendingResume = true;
  void audio.unlock();
  const old = AudioContextStub.instances[0];
  wallTime = 1000;
  AudioContextStub.pendingResume = false;
  await audio.unlock(true);
  audio.update(flight());
  expect(old.close).toHaveBeenCalledOnce();
  expect(AudioContextStub.instances[1].oscillators.length).toBeGreaterThan(1);
});
