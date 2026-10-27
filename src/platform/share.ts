import type { FlightResult } from "../game/result";

export async function createRecordImage(
  result: FlightResult,
  snapshot: HTMLCanvasElement,
): Promise<File> {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 1600 / Math.max(snapshot.width, snapshot.height));
  canvas.width = Math.round(snapshot.width * scale);
  canvas.height = Math.round(snapshot.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("記録画像を作成できませんでした。");
  ctx.drawImage(snapshot, 0, 0, canvas.width, canvas.height);
  const gradient = ctx.createLinearGradient(0, canvas.height * 0.58, 0, canvas.height);
  gradient.addColorStop(0, "#064c6500");
  gradient.addColorStop(1, "#064c65e8");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const margin = canvas.width * 0.06;
  const titleSize = Math.max(20, canvas.width * 0.032);
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${titleSize}px system-ui, sans-serif`;
  ctx.shadowColor = "#05071b";
  ctx.shadowBlur = 10;
  ctx.fillText("#吸い込まないでっ", margin, margin + titleSize);
  ctx.font = `700 ${Math.max(32, canvas.width * 0.075)}px system-ui, sans-serif`;
  ctx.fillText(`${result.distance.toLocaleString("ja-JP")}m`, margin, canvas.height - margin);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (value) => (value ? resolve(value) : reject(new Error("画像を保存できませんでした。"))),
      "image/png",
    ),
  );
  return new File([blob], `吸い込まないでっ-${result.distance}m.png`, { type: "image/png" });
}
export function shareText(result: FlightResult, url: string) {
  return `プールで${result.distance}m泳ぎました #吸い込まないでっ ${url}`;
}
