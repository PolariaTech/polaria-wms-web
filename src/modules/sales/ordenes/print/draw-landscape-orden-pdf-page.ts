import type { jsPDF } from "jspdf";
import { landscapeDrawLeftPanel } from "./draw-landscape-orden-pdf-left-panel";
import { LANDSCAPE_GAP, LANDSCAPE_LEFT_W, LANDSCAPE_MARGIN } from "./draw-landscape-orden-pdf-layout";
import { landscapeDrawProductTable } from "./draw-landscape-orden-pdf-product-table";
import type { OrdenTareaAlmacenPrintData } from "./orden-tarea-almacen.types";

/**
 * Variante 2 columnas (hoja carta vertical):
 * izquierda = mismos campos que la vertical; derecha = productos.
 */
export function drawOrdenTareaAlmacenLandscapePage(
  doc: jsPDF,
  data: OrdenTareaAlmacenPrintData,
): void {
  landscapeDrawLeftPanel(doc, data);
  const rightX = LANDSCAPE_MARGIN + LANDSCAPE_LEFT_W + LANDSCAPE_GAP;
  landscapeDrawProductTable(doc, data, rightX);
}