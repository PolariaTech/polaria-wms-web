import { jsPDF } from "jspdf";
import { drawPrintQrCaptionedOnPages } from "./draw-print-qr-captioned";
import { portraitDrawOrdenHeader } from "./draw-portrait-orden-pdf-header";
import {
  PORTRAIT_MARGIN,
  PORTRAIT_PAGE_H,
  PORTRAIT_PAGE_W,
} from "./draw-portrait-orden-pdf-layout";
import { portraitWritePageNumbers } from "./draw-portrait-orden-pdf-notes";
import { portraitDrawProductTables } from "./draw-portrait-orden-pdf-product-table";
import { portraitDrawSignaturesAndIncidencias } from "./draw-portrait-orden-pdf-signatures";
import type { OrdenTareaAlmacenPrintData } from "./orden-tarea-almacen.types";

const QR_SIZE = 28;

export function buildOrdenTareaAlmacenPdf(
  data: OrdenTareaAlmacenPrintData,
): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [PORTRAIT_PAGE_W, PORTRAIT_PAGE_H],
    compress: true,
  });

  const pageMetaH = 6;
  let y = PORTRAIT_MARGIN + pageMetaH;

  y = portraitDrawOrdenHeader(doc, data, y);
  y = portraitDrawProductTables(doc, data, y);
  portraitDrawSignaturesAndIncidencias(doc, data, y);

  portraitWritePageNumbers(doc, data.creada, data.impresa);
  drawPrintQrCaptionedOnPages(doc, {
    qrDataUrl: data.qrDataUrl,
    creada: data.creada,
    impresa: data.impresa,
    diaEntrega: data.diaEntrega,
    pageW: PORTRAIT_PAGE_W,
    pageH: PORTRAIT_PAGE_H,
    margin: PORTRAIT_MARGIN,
    size: QR_SIZE,
  });
  return doc;
}