import { jsPDF } from "jspdf";
import { drawOrdenTareaAlmacenLandscapePage } from "./draw-landscape-orden-pdf-page";
import {
  LANDSCAPE_PAGE_H,
  LANDSCAPE_PAGE_W,
} from "./draw-landscape-orden-pdf-layout";
import type { OrdenTareaAlmacenPrintData } from "./orden-tarea-almacen.types";

export { drawOrdenTareaAlmacenLandscapePage } from "./draw-landscape-orden-pdf-page";

export function buildOrdenTareaAlmacenLandscapePdf(
  data: OrdenTareaAlmacenPrintData,
): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [LANDSCAPE_PAGE_W, LANDSCAPE_PAGE_H],
    compress: true,
  });
  drawOrdenTareaAlmacenLandscapePage(doc, data);
  return doc;
}

/** Un solo PDF con una página por orden de trabajo. */
export function buildOrdenTareaAlmacenLandscapePdfMulti(
  sheets: readonly OrdenTareaAlmacenPrintData[],
): jsPDF {
  if (sheets.length === 0) {
    throw new Error("No hay órdenes de trabajo para generar el PDF.");
  }
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [LANDSCAPE_PAGE_W, LANDSCAPE_PAGE_H],
    compress: true,
  });
  sheets.forEach((sheet, index) => {
    if (index > 0) {
      doc.addPage([LANDSCAPE_PAGE_W, LANDSCAPE_PAGE_H], "portrait");
    }
    drawOrdenTareaAlmacenLandscapePage(doc, sheet);
  });
  return doc;
}