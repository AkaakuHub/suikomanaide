import { buttonIcon } from "./icons";

export type Action = "start" | "pause" | "resume" | "sound" | "share";
export interface ButtonRegion {
  action: Action;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  disabled: boolean;
}
export class Paint {
  readonly buttons: ButtonRegion[] = [];
  constructor(
    readonly ctx: CanvasRenderingContext2D,
    readonly width: number,
    readonly height: number,
  ) {}
  text(
    text: string,
    x: number,
    y: number,
    size = 18,
    color = "#f2feff",
    weight = 500,
    align: CanvasTextAlign = "center",
  ) {
    const c = this.ctx;
    c.font = `${weight} ${size}px system-ui, sans-serif`;
    c.fillStyle = color;
    c.textAlign = align;
    c.textBaseline = "middle";
    c.fillText(text, x, y);
  }
  shade() {
    this.ctx.fillStyle = "#063746bf";
    this.ctx.fillRect(0, 0, this.width, this.height);
  }
  button(
    action: Action,
    label: string,
    x: number,
    y: number,
    width: number,
    height = 46,
    primary = false,
    disabled = false,
    iconOnly = false,
  ) {
    const c = this.ctx;
    c.save();
    c.globalAlpha = disabled ? 0.4 : 1;
    c.beginPath();
    c.roundRect(x, y, width, height, 8);
    c.fillStyle = primary ? "#ffe18b" : "#07516dbf";
    c.fill();
    c.strokeStyle = primary ? "#fff0d4" : "#c7ccff40";
    c.lineWidth = 1;
    c.stroke();
    const color = primary ? "#173e4c" : "#f1edff";
    const icon = buttonIcon(action, label, color);
    const hasIcon = (width >= 110 || iconOnly) && icon.complete && icon.naturalWidth > 0;
    if (hasIcon) {
      c.font = `${primary ? 700 : 500} 15px system-ui, sans-serif`;
      const contentWidth = iconOnly ? 19 : c.measureText(label).width + 28;
      c.drawImage(icon, x + (width - contentWidth) / 2, y + (height - 19) / 2, 19, 19);
    }
    if (!iconOnly)
      this.text(
        label,
        x + width / 2 + (hasIcon ? 14 : 0),
        y + height / 2,
        15,
        primary ? "#173e4c" : "#f1edff",
        primary ? 700 : 500,
      );
    c.restore();
    this.buttons.push({ action, label, x, y, width, height, disabled });
  }
  paragraph(text: string, x: number, y: number, width: number, size = 15) {
    let line = "";
    let row = 0;
    this.ctx.font = `400 ${size}px system-ui, sans-serif`;
    for (const char of text) {
      if (char === "\n" || this.ctx.measureText(line + char).width > width) {
        this.text(line, x, y + row * size * 1.8, size, "#d7dbef", 400, "left");
        row++;
        line = char === "\n" ? "" : char;
      } else line += char;
    }
    this.text(line, x, y + row * size * 1.8, size, "#d7dbef", 400, "left");
    return y + (row + 1) * size * 1.8;
  }
}
