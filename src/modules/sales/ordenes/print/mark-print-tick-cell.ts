import type { jsPDF } from "jspdf";

type BoxFn = (
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  lineWidth?: number,
) => void;

/** Casilla Alistó/Revisó: casi todo el ancho/alto de la celda, sin pegarse al borde. */
export function markPrintTickCell(
  doc: jsPDF,
  cellX: number,
  cellY: number,
  cellW: number,
  cellH: number,
  checked: boolean,
  box: BoxFn,
): void {
  const padX = 2.1;
  const padY = 0.85;
  const w = Math.max(2.2, cellW - padX * 2);
  const h = Math.max(2.2, cellH - padY * 2);
  const x = cellX + (cellW - w) / 2;
  const y = cellY + (cellH - h) / 2;
  box(doc, x, y, w, h, 0.4);
  if (!checked) return;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(Math.min(8, Math.max(6, h * 1.15)));
  doc.text("X", x + w / 2, y + h / 2, {
    align: "center",
    baseline: "middle",
  });
}
