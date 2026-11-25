import type { jsPDF } from "jspdf";

/** Carta: coincide con el destino típico del diálogo de impresión. */
export const PORTRAIT_PAGE_W = 215.9;
export const PORTRAIT_PAGE_H = 279.4;
export const PORTRAIT_MARGIN = 8;
export const PORTRAIT_CONTENT_W = PORTRAIT_PAGE_W - PORTRAIT_MARGIN * 2;
export const PORTRAIT_PAGE_BOTTOM = PORTRAIT_PAGE_H - PORTRAIT_MARGIN;

export function portraitBox(
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

/** Casilla Alistó/Revisó: casi todo el ancho/alto de la celda, sin pegarse al borde. */
export function portraitMarkTickCell(
  doc: jsPDF,
  cellX: number,
  cellY: number,
  cellW: number,
  cellH: number,
  checked: boolean,
) {
  const padX = 2.1;
  const padY = 0.85;
  const w = Math.max(2.2, cellW - padX * 2);
  const h = Math.max(2.2, cellH - padY * 2);
  const x = cellX + (cellW - w) / 2;
  const y = cellY + (cellH - h) / 2;
  portraitBox(doc, x, y, w, h, 0.4);
  if (!checked) return;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(Math.min(8, Math.max(6, h * 1.15)));
  doc.text("X", x + w / 2, y + h / 2, {
    align: "center",
    baseline: "middle",
  });
}

export function portraitField(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value = "",
  thick = false,
) {
  portraitBox(doc, x, y, w, h, thick ? 0.6 : 0.35);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(0);
  doc.text(label, x + 1.6, y + 1.4, { baseline: "top" });
  if (!value.trim()) return;

  const innerW = w - 3.2;
  const valueTop = y + 5.2;
  const valueMaxH = h - 6.4;
  let fontSize = 8.5;
  let lines: string[] = [];
  let lineH = 3.3;

  while (fontSize >= 6.5) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(fontSize);
    lineH = fontSize * 0.38;
    lines = doc.splitTextToSize(value.trim(), innerW);
    const maxLines = Math.max(1, Math.floor(valueMaxH / lineH));
    if (lines.length <= maxLines || fontSize === 6.5) {
      lines = lines.slice(0, maxLines);
      break;
    }
    fontSize -= 0.5;
  }

  doc.text(lines, x + 1.6, valueTop, { baseline: "top" });
}

/** Un solo cuadro partido a la mitad (p. ej. Fecha | Hora). */
export function portraitSplitField(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  left: { label: string; value?: string },
  right: { label: string; value?: string },
  thick = false,
) {
  portraitBox(doc, x, y, w, h, thick ? 0.6 : 0.35);
  const mid = x + w / 2;
  doc.setDrawColor(0);
  doc.setLineWidth(0.35);
  doc.line(mid, y, mid, y + h);

  const drawHalf = (hx: number, hw: number, label: string, value = "") => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(0);
    doc.text(label, hx + 1.6, y + 1.4, { baseline: "top" });
    if (!value.trim()) return;
    const innerW = hw - 3.2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    const wrapped = doc.splitTextToSize(value.trim(), innerW);
    const shown = (Array.isArray(wrapped) ? wrapped : [wrapped]).slice(0, 2);
    doc.text(shown, hx + 1.6, y + 5.2, {
      baseline: "top",
      lineHeightFactor: 1.05,
    });
  };

  drawHalf(x, w / 2, left.label, left.value ?? "");
  drawHalf(mid, w / 2, right.label, right.value ?? "");
}

export function portraitSectionTitle(
  doc: jsPDF,
  y: number,
  title: string,
  hint = "",
): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(title, PORTRAIT_MARGIN, y, { baseline: "top" });
  if (hint) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(hint, PORTRAIT_MARGIN + PORTRAIT_CONTENT_W, y + 0.4, {
      baseline: "top",
      align: "right",
    });
  }
  const lineY = y + 5;
  doc.setLineWidth(0.5);
  doc.line(PORTRAIT_MARGIN, lineY, PORTRAIT_MARGIN + PORTRAIT_CONTENT_W, lineY);
  return lineY + 2;
}

/** Si no cabe el bloque, abre hoja nueva y reinicia Y. */
export function portraitEnsureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed <= PORTRAIT_PAGE_BOTTOM) return y;
  doc.addPage([PORTRAIT_PAGE_W, PORTRAIT_PAGE_H], "portrait");
  return PORTRAIT_MARGIN;
}