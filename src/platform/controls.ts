import { clamp } from "../game/model";
import type { Control, Flight } from "../game/model";
import { dragTarget, movementArea } from "../game/movement";

export class Controls {
  active = false;
  private readonly keys = new Set<string>();
  private pointer: { x: number; y: number } | null = null;
  private dragging = false;
  private dragOrigin: { x: number; y: number; worldX: number; worldY: number } | null = null;
  private activePointer: number | null = null;
  private player = { x: 0, y: 0 };
  constructor(
    host: HTMLElement,
    private readonly pause: () => void,
  ) {
    const preventBrowserGesture = (event: Event) => {
      if (event.cancelable) event.preventDefault();
    };
    for (const type of ["gesturestart", "gesturechange", "touchstart", "touchmove", "touchend"])
      host.addEventListener(type, preventBrowserGesture, { capture: true, passive: false });
    for (const type of ["contextmenu", "selectstart", "dblclick"])
      host.addEventListener(type, preventBrowserGesture);
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !event.repeat) {
        if (this.active) event.preventDefault();
        this.pause();
        return;
      }
      if (!this.active || event.target instanceof HTMLInputElement) return;
      if (
        event.target instanceof HTMLButtonElement &&
        (event.code === "Space" || event.key === "Enter")
      )
        return;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Escape"].includes(event.key))
        event.preventDefault();
      this.keys.add(event.key.toLowerCase());
      this.pointer = null;
    });
    window.addEventListener("keyup", (event) => this.keys.delete(event.key.toLowerCase()));
    window.addEventListener("blur", () => {
      this.reset();
      if (this.active) this.pause();
    });
    const updatePointer = (event: PointerEvent) => {
      const bounds = host.getBoundingClientRect();
      this.pointer = {
        x: ((event.clientX - bounds.left) / bounds.width - 0.5) * movementArea.width * 2.8,
        y: (0.55 - (event.clientY - bounds.top) / bounds.height) * movementArea.height * 2.8,
      };
    };
    host.addEventListener("pointerdown", (event) => {
      if (
        !this.active ||
        this.activePointer !== null ||
        (event.target !== host && !(event.target instanceof HTMLCanvasElement))
      )
        return;
      this.dragging = true;
      this.activePointer = event.pointerId;
      this.dragOrigin = {
        x: event.clientX,
        y: event.clientY,
        worldX: this.player.x,
        worldY: this.player.y,
      };
      host.setPointerCapture(event.pointerId);
      if (event.pointerType === "mouse") updatePointer(event);
      else {
        this.pointer = { ...this.player };
      }
    });
    host.addEventListener("pointermove", (event) => {
      if (!this.active) return;
      if (event.pointerType === "mouse") updatePointer(event);
      else if (this.dragging && this.dragOrigin && event.pointerId === this.activePointer) {
        this.pointer = dragTarget(
          { x: this.dragOrigin.worldX, y: this.dragOrigin.worldY },
          event.clientX - this.dragOrigin.x,
          event.clientY - this.dragOrigin.y,
          host.clientWidth,
        );
      }
    });
    const release = (event: PointerEvent) => {
      if (event.pointerId !== this.activePointer) return;
      this.dragging = false;
      this.pointer = null;
      this.dragOrigin = null;
      this.activePointer = null;
    };
    host.addEventListener("pointerup", release);
    host.addEventListener("pointercancel", release);
    host.addEventListener("lostpointercapture", release);
    host.addEventListener("pointerleave", () => {
      if (!this.dragging) this.pointer = null;
    });
  }
  reset() {
    this.keys.clear();
    this.pointer = null;
    this.dragging = false;
    this.dragOrigin = null;
    this.activePointer = null;
  }
  sample(state: Flight): Control {
    this.player.x = state.x;
    this.player.y = state.y;
    let x =
      Number(this.keys.has("d") || this.keys.has("arrowright")) -
      Number(this.keys.has("a") || this.keys.has("arrowleft"));
    let y =
      Number(this.keys.has("w") || this.keys.has("arrowup")) -
      Number(this.keys.has("s") || this.keys.has("arrowdown"));
    if (x === 0 && y === 0) {
      if (this.pointer) {
        x = (this.pointer.x - state.x) * 1.2;
        y = (this.pointer.y - state.y) * 1.2;
      }
    }
    return { x: clamp(x, -1, 1), y: clamp(y, -1, 1) };
  }
}
