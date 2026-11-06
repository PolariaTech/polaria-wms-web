import type { jsPDF } from "jspdf";
import { drawPrintQr } from "./draw-print-qr";

const META_H = 3.5;
const DIA_H = 9;
const GAP = 1;

/** Altura total: QR + día opcional + meta Creada/Impresa abajo. */
export function printQrCaptionedHeight(
  qrSize: number,
  diaEntrega?: string | null,
): number {
  const diaH = diaEntrega?.trim() ? DIA_H : 0;
  return qrSize + (diaH ? GAP + diaH : 0) + GAP + META_H;
}

/**
 * QR inferior: día centrado debajo; Creada/Impresa abajo alineada a la derecha.
 */
export function drawPrintQrCaptioned(
  doc: jsPDF,
  opts: {
    qrDataUrl: string | null | undefined;
    creada: string;
    impresa: string;
    diaEntrega?: string | null;
    /** Centro horizontal del QR (y de VIERNES). */
    centerX: number;
    topY: number;
    size: number;
    /** Borde derecho donde termina la meta (p. ej. margen derecho de página). */
    metaRightX?: number;
  },
): number {
  const {
    qrDataUrl,
    creada,
    impresa,
    diaEntrega,
    centerX,
    topY,
    size,
    metaRightX = centerX + size / 2,
  } = opts;
  let y = topY;

  drawPrintQr(doc, qrDataUrl, centerX - size / 2, y, size);
  y += size;

  const dia = diaEntrega?.trim();
  if (dia) {
    y += GAP;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(dia, centerX, y + 2, { align: "center", baseline: "top" });
    doc.setFont("helvetica", "normal");
    y += DIA_H;
  }

  y += GAP;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(80);
  doc.text(`Creada ${creada}  ·  Impresa ${impresa}`, metaRightX, y, {
    align: "right",
    baseline: "top",
  });
  doc.setTextColor(0);
  y += META_H;

  return y - topY;
}
