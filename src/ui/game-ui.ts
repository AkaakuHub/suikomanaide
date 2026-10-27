import { bindButton } from "./button-input";
import { Paint } from "./paint";
import type { Action, ButtonRegion } from "./paint";
import { itemGauges } from "./item-gauges";
import { routeNotice } from "./route-notice";
import { resultScreen } from "./screens";
import type { Flight } from "../game/model";
import type { FlightResult } from "../game/result";

export class GameUI {
  sound = true;
  private inset = { top: 0, right: 0, bottom: 0, left: 0 };
  result: FlightResult | null = null;
  imageReady = false;
  error = "";
  private readonly canvas = document.createElement("canvas");
  private readonly ctx: CanvasRenderingContext2D;
  private readonly actions = document.createElement("div");
  private readonly buttons = new Map<Action, HTMLButtonElement>();
  private notice = "";
  private noticeUntil = 0;
  private width = 0;
  private height = 0;
  constructor(
    host: HTMLElement,
    private readonly action: (action: Action) => void,
  ) {
    const context = this.canvas.getContext("2d");
    if (!context) throw new Error("画面を表示できません。");
    this.ctx = context;
    this.canvas.className = "game-ui";
    this.canvas.setAttribute("aria-hidden", "true");
    this.actions.className = "game-actions";
    this.actions.setAttribute("aria-label", "ゲーム操作");
    host.append(this.canvas, this.actions);
    new ResizeObserver(() => {
      const style = getComputedStyle(host);
      for (const side of ["top", "right", "bottom", "left"] as const)
        this.inset[side] = Number.parseFloat(style.getPropertyValue(`--safe-${side}`)) || 0;
      const bounds = host.getBoundingClientRect();
      this.width = bounds.width;
      this.height = bounds.height;
      const ratio = Math.min(2, window.devicePixelRatio);
      this.canvas.width = Math.round(this.width * ratio);
      this.canvas.height = Math.round(this.height * ratio);
      this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }).observe(host);
  }
  toast(message: string) {
    this.notice = message;
    this.noticeUntil = performance.now() + 4500;
  }
  private syncButtons(regions: ButtonRegion[]) {
    const active = new Set(regions.map((region) => region.action));
    for (const [key, button] of this.buttons) {
      if (!active.has(key)) {
        button.remove();
        this.buttons.delete(key);
      }
    }
    for (const region of regions) {
      let button = this.buttons.get(region.action);
      if (!button) {
        button = document.createElement("button");
        button.type = "button";
        button.className = "game-action";
        bindButton(button, () => this.action(region.action));
        this.buttons.set(region.action, button);
        this.actions.append(button);
      }
      if (button.textContent !== region.label) button.textContent = region.label;
      button.disabled = region.disabled;
      if (region.action === "sound") button.setAttribute("aria-pressed", String(this.sound));
      button.style.left = `${region.x}px`;
      button.style.top = `${region.y}px`;
      button.style.width = `${region.width}px`;
      button.style.height = `${region.height}px`;
    }
  }
  render(state: Flight) {
    if (!this.width || !this.height) return;
    const { width: w, height: h } = this;
    this.ctx.clearRect(0, 0, w, h);
    const p = new Paint(this.ctx, w, h);
    if (this.error) {
      p.shade();
      p.paragraph(this.error, 30, h / 2, w - 60);
    } else if (state.phase === "paused") {
      this.ctx.fillStyle = "#06102066";
      this.ctx.fillRect(0, 0, w, h);
      p.button("resume", "再開", (w - 144) / 2, (h - 56) / 2, 144, 56, true);
    } else if (state.phase === "arrived" && this.result)
      resultScreen(p, this.result, this.imageReady);
    else if (state.phase === "flying") {
      routeNotice(p, state, this.inset.top + 76);
      itemGauges(p, state, this.inset.left + 16, h - this.inset.bottom - 20);
      if (state.event === "衝突" && state.eventTime > 1.4) {
        const gradient = this.ctx.createRadialGradient(
          w / 2,
          h / 2,
          Math.min(w, h) * 0.25,
          w / 2,
          h / 2,
          Math.max(w, h) * 0.7,
        );
        gradient.addColorStop(0, "#ff315800");
        gradient.addColorStop(1, `rgba(255,49,88,${(state.eventTime - 1.4) * 0.7})`);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, w, h);
      }
    }
    if (!this.error)
      p.button(
        "portal",
        "ゲーム一覧",
        this.inset.left + 12,
        this.inset.top + 12,
        48,
        48,
        false,
        false,
        true,
      );
    if (!this.error && state.phase !== "paused") {
      const top = this.inset.top + 12;
      let right = w - this.inset.right - 60;
      p.button(
        "sound",
        `音：${this.sound ? "オン" : "オフ"}`,
        right,
        top,
        48,
        48,
        false,
        false,
        true,
      );
      right -= 56;
      if (state.phase === "flying")
        p.button("pause", "一時停止", right, top, 48, 48, false, false, true);
    }
    if (performance.now() < this.noticeUntil) {
      const textWidth = Math.min(w - 36, 560);
      this.ctx.fillStyle = "#0b1029e8";
      this.ctx.beginPath();
      this.ctx.roundRect((w - textWidth) / 2, h - 128, textWidth, 48, 8);
      this.ctx.fill();
      p.paragraph(this.notice, (w - textWidth) / 2 + 14, h - 112, textWidth - 28, 12);
    }
    this.syncButtons(p.buttons);
  }
}
