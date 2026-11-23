import type { jsPDF } from "jspdf";

const PAGE_W = 215.9;
const PAGE_H = 279.4;
export const LANDSCAPE_MARGIN = 8;
const CONTENT_W = PAGE_W - LANDSCAPE_MARGIN * 2;
export const LANDSCAPE_PAGE_BOTTOM = PAGE_H - LANDSCAPE_MARGIN;
export const LANDSCAPE_GAP = 3;
export const LANDSCAPE_LEFT_W = 78;
export const LANDSCAPE_RIGHT_W = CONTENT_W - LANDSCAPE_LEFT_W - LANDSCAPE_GAP;
export const LANDSCAPE_PAGE_W = PAGE_W;
export const LANDSCAPE_PAGE_H = PAGE_H;

export function landscapeBox(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  lineWidth = 0.35,
) {
  doc.setDrawColor(0);
  doc.setFillColor(255, 255, 255);
  doc.setLineWidth(lineWidth);
  doc.rect(x, y, w, h, "S");
}

export function landscapeField(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value = "",
  thick = false,
) {
  landscapeBox(doc, x, y, w, h, thick ? 0.6 : 0.35);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.text(label, x + 1.2, y + 1.2, { baseline: "top" });
  if (!value.trim()) return;
  doc.setFont("helvetica", "bold");
  const innerW = w - 2.4;
  const valueTop = y + 4.8;
  const valueMaxH = Math.max(3.2, h - 6);
  let fontSize = 7.5;
  let lines: string[] = [];
  let lineH = 3.2;
  while (fontSize >= 6) {
    doc.setFontSize(fontSize);
    lineH = fontSize * 0.4;
    lines = doc.splitTextToSize(value.trim(), innerW);
    const maxLines = Math.max(1, Math.floor(valueMaxH / lineH));
    if (lines.length <= maxLines || fontSize === 6) {
      lines = lines.slice(0, maxLines);
      break;
    }
    fontSize -= 0.4;
  }
  doc.text(lines, x + 1.2, valueTop, {
    baseline: "top",
    lineHeightFactor: 1.05,
  });
}

/** Un solo cuadro partido a la mitad (Fecha | Hora). */
export function landscapeSplitField(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  left: { label: string; value?: string },
  right: { label: string; value?: string },
  thick = false,
) {
  landscapeBox(doc, x, y, w, h, thick ? 0.6 : 0.35);
  const mid = x + w / 2;
  doc.setDrawColor(0);
  doc.setLineWidth(0.35);
  doc.line(mid, y, mid, y + h);

  const drawHalf = (hx: number, hw: number, label: string, value = "") => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.text(label, hx + 1, y + 1.1, { baseline: "top" });
    if (!value.trim()) return;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    const wrapped = doc.splitTextToSize(value.trim(), hw - 2);
    const shown = (Array.isArray(wrapped) ? wrapped : [wrapped]).slice(0, 2);
    doc.text(shown, hx + 1, y + 4.4, {
      baseline: "top",
      lineHeightFactor: 1.05,
    });
  };

  drawHalf(x, w / 2, left.label, left.value ?? "");
  drawHalf(mid, w / 2, right.label, right.value ?? "");
}

export function landscapeDrawNotesLines(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  label = "",
  value = "",
  lineCount = 2,
  lineStep = 5,
  startOnSecondLine = false,
): number {
  let lineY = y;
  const hasLabel = Boolean(label.trim());
  if (hasLabel) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(`${label}:`, x, y, { baseline: "top" });
    lineY = y + 5.2;
  } else {
    lineY = y + 3;
  }
  doc.setDrawColor(0);
  doc.setLineWidth(0.45);

  const textW = w - 2;
  const trimmed = value.replace(/\s+/g, " ").trim();
  const contentOffset = startOnSecondLine ? 1 : 0;
  const contentSlots = Math.max(0, lineCount - contentOffset);
  let lines: string[] = [];
  let fontSize = 7;

  if (trimmed && contentSlots > 0) {
    doc.setFont("helvetica", "normal");
    for (const size of [7, 6.2, 5.4, 4.8, 4.2]) {
      doc.setFontSize(size);
      const wrapped = doc.splitTextToSize(trimmed, textW);
      const all = Array.isArray(wrapped) ? wrapped : [wrapped];
      if (all.length <= contentSlots) {
        lines = all;
        fontSize = size;
        break;
      }
      lines = all.slice(0, contentSlots);
      fontSize = size;
    }
  }

  for (let index = 0; index < lineCount; index += 1) {
    doc.line(x, lineY, x + w, lineY);
    const lineText = lines[index - contentOffset];
    if (lineText) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(fontSize);
      doc.text(lineText, x + 1, lineY - 1.4, { baseline: "bottom" });
    }
    lineY += lineStep;
  }
  return lineY;
}