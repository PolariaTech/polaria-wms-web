import type { jsPDF } from "jspdf";
import {
  drawPrintQrCaptioned,
  printQrCaptionedHeight,
} from "./draw-print-qr-captioned";
import type { OrdenTareaAlmacenPrintData } from "./orden-tarea-almacen.types";

/** Holgura entre el borde inferior de la tabla y el QR. */
export const LANDSCAPE_QR_TABLE_GAP = 3;

export function landscapeQrFooterReserve(
  qrSize: number,
  diaEntrega?: string | null,
): number {
  return LANDSCAPE_QR_TABLE_GAP + printQrCaptionedHeight(qrSize, diaEntrega);
}

/** QR bajo la columna Especificación: día debajo, Creada/Impresa a la derecha. */
export function drawLandscapeQrFooter(
  doc: jsPDF,
  opts: {
    data: OrdenTareaAlmacenPrintData;
    rightX: number;
    colWidths: readonly number[];
    py: number;
    pageBottom: number;
    pageW: number;
    margin: number;
    qrSize: number;
  },
): void {
  const { data, rightX, colWidths, py, pageBottom, pageW, margin, qrSize } =
    opts;
  const qrBlockH = printQrCaptionedHeight(qrSize, data.diaEntrega);
  let specColX = rightX;
  for (let i = 0; i < 2; i += 1) specColX += colWidths[i]!;
  const specColW = colWidths[2]!;
  const spaceBelow = Math.max(0, pageBottom - py - LANDSCAPE_QR_TABLE_GAP);
  const topY =
    py + LANDSCAPE_QR_TABLE_GAP + Math.max(0, (spaceBelow - qrBlockH) / 2);
  drawPrintQrCaptioned(doc, {
    qrDataUrl: data.qrDataUrl,
    creada: data.creada,
    impresa: data.impresa,
    diaEntrega: data.diaEntrega,
    centerX: specColX + specColW / 2,
    topY,
    size: qrSize,
    metaRightX: pageW - margin,
  });
}
