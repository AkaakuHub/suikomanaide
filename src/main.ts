import "./styles/base.css";
import { Simulation } from "./game/simulation";
import { FlightRenderer } from "./scene/renderer";
import { Controls } from "./platform/controls";
import { createRecordImage, shareText } from "./platform/share";
import { createRandom } from "./platform/random";
import { FlightAudio } from "./platform/audio";
import { GameUI } from "./ui/game-ui";
import type { Action } from "./ui/paint";
import type { FlightResult } from "./game/result";

const root = document.getElementById("app");
if (!root) throw new Error("ゲームを開始できません。");
const host = document.createElement("main");
host.id = "game";
host.setAttribute("aria-label", "#吸い込まないでっ");
root.append(host);
const game = new Simulation(createRandom());
const audio = new FlightAudio();
let renderer: FlightRenderer | null = null;
let image: File | null = null;
let finishedResult: FlightResult | null = null;
let lastTime = 0;
let accumulator = 0;
let lastUiTime = 0;
let previousEventTime = 0;

function setPhase(phase: typeof game.state.phase) {
  game.state.phase = phase;
  controls.active = phase === "flying";
  controls.reset();
  audio.update(game.state);
  if (phase === "flying") restoreAudio();
}
function togglePause() {
  if (game.state.phase === "flying") setPhase("paused");
  else if (game.state.phase === "paused") setPhase("flying");
}
const controls = new Controls(host, togglePause);
try {
  renderer = new FlightRenderer(host);
} catch {
  renderer = null;
}
const ui = new GameUI(host, (action) => {
  void dispatch(action);
});
if (!renderer)
  ui.error =
    "3D描画を開始できません。ブラウザのWebGLとハードウェアアクセラレーションを確認してください。";
function start(userGesture = true) {
  if (!renderer) return;
  ui.result = null;
  ui.imageReady = false;
  image = null;
  finishedResult = null;
  game.start();
  setPhase("flying");
  accumulator = 0;
  if (userGesture)
    void audio
      .unlock(true)
      .then(() => audio.play("start"))
      .catch(() => ui.toast("音を再生できませんでした。"));
}
async function arrive() {
  const flight = game.state;
  controls.active = false;
  controls.reset();
  const result: FlightResult = { distance: Math.floor(flight.distance) };
  finishedResult = result;
  ui.result = result;
  try {
    if (!renderer) return;
    const snapshot = renderer.capture();
    const file = await createRecordImage(result, snapshot);
    if (game.state !== flight) return;
    image = file;
    ui.imageReady = true;
  } catch {
    ui.toast("共有画像を作成できませんでした。");
  }
}
async function dispatch(action: Action) {
  if (action === "start") start();
  else if (action === "pause" || action === "resume") togglePause();
  else if (action === "sound") {
    try {
      await audio.toggle();
      ui.sound = audio.enabled;
    } catch {
      ui.toast("音を再生できませんでした。");
    }
  } else if (action === "share" && image && finishedResult) {
    const url = new URL(location.href);
    url.hash = "";
    url.search = "";
    const text = shareText(finishedResult, url.href);
    if (!window.isSecureContext) {
      ui.toast("画像共有はHTTPS接続で利用できます。");
      return;
    }
    if (!navigator.share) {
      ui.toast("このブラウザは画像共有に対応していません。");
      return;
    }
    try {
      await navigator.share({ files: [image], title: "#吸い込まないでっ", text });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        ui.toast("画像を共有できませんでした。");
    }
  }
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (game.state.phase === "flying") setPhase("paused");
    audio.release();
  } else restoreAudio();
});
window.addEventListener("pagehide", () => audio.release());
window.addEventListener("focus", () => restoreAudio());
window.addEventListener("pageshow", () => restoreAudio());
function frame(time: number) {
  const elapsed = lastTime ? Math.min((time - lastTime) / 1000, 0.2) : 0;
  lastTime = time;
  const before = game.state.phase;
  accumulator += elapsed;
  const input = controls.sample(game.state);
  while (accumulator >= 1 / 60) {
    game.tick(1 / 60, input);
    accumulator -= 1 / 60;
  }
  renderer?.render(game.state, elapsed);
  audio.update(game.state);
  if (game.state.eventTime > previousEventTime) audio.play(game.state.event);
  previousEventTime = game.state.eventTime;
  if (before === "flying" && game.state.phase === "arrived") {
    audio.play("arrived");
    void arrive();
  }
  if (time - lastUiTime > 32) {
    ui.sound = audio.enabled;
    ui.render(game.state);
    lastUiTime = time;
  }
  requestAnimationFrame(frame);
}
start(false);
function restoreAudio(fromGesture = false) {
  if (document.hidden || !audio.enabled) return;
  void audio
    .unlock(fromGesture)
    .then(() => audio.update(game.state))
    .catch(() => {});
}
for (const event of ["pointerdown", "pointerup", "keydown", "click"])
  window.addEventListener(event, () => restoreAudio(true), { capture: true });
for (const event of ["touchstart", "touchend"])
  window.addEventListener(event, () => restoreAudio(true), { capture: true, passive: true });
restoreAudio();
requestAnimationFrame(frame);

let resumeAfterPortal = false;
document.addEventListener("portal-menu-open", () => {
  resumeAfterPortal = game.state.phase === "flying";
  if (resumeAfterPortal) setPhase("paused");
});
document.addEventListener("portal-menu-close", () => {
  if (resumeAfterPortal && game.state.phase === "paused") setPhase("flying");
  resumeAfterPortal = false;
});
document.dispatchEvent(new Event("portal-menu-ready"));
