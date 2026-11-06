import type { jsPDF } from "jspdf";

/**
 * REQ-282: escribe texto en una celda reduciendo fuente y envolviendo
 * hasta que quepa en el alto/ancho disponibles (sin cortar a media letra).
 */
export function paintPrintCellText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  options: { align?: "left" | "center"; preferSize?: number } = {},
) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const align = options.align ?? "left";
  const preferSize = options.preferSize ?? 6;
  const padX = 0.7;
  const padY = 0.55;
  const maxW = Math.max(2, w - padX * 2);
  const maxH = Math.max(2, h - padY * 2);

  let fontSize = preferSize;
  let lineH = fontSize * 0.4;
  let lines: string[] = [];

  doc.setFont("helvetica", "normal");
  while (fontSize >= 4.2) {
    doc.setFontSize(fontSize);
    lineH = fontSize * 0.4;
    const maxLines = Math.max(1, Math.floor(maxH / lineH));
    const wrapped = doc.splitTextToSize(trimmed, maxW);
    const all = Array.isArray(wrapped) ? wrapped : [wrapped];
    if (all.length <= maxLines || fontSize <= 4.2) {
      lines = all.slice(0, maxLines);
      break;
    }
    fontSize -= 0.3;
  }

  doc.setFontSize(fontSize);
  const blockH = lines.length * lineH;
  const textY = y + Math.max(padY, (h - blockH) / 2);
  const textX = align === "center" ? x + w / 2 : x + padX;
  doc.text(lines, textX, textY, {
    align,
    baseline: "top",
    lineHeightFactor: 1.05,
  });
}
