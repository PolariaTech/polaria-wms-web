import type { jsPDF } from "jspdf";
import {
  drawLandscapeQrFooter,
  landscapeQrFooterReserve,
} from "./draw-landscape-qr-footer";
import {
  LANDSCAPE_MARGIN,
  LANDSCAPE_PAGE_BOTTOM,
  LANDSCAPE_PAGE_W,
  LANDSCAPE_RIGHT_W,
  landscapeBox,
} from "./draw-landscape-orden-pdf-layout";
import { markPrintTickCell } from "./mark-print-tick-cell";
import { paintPrintCellText } from "./paint-print-cell-text";
import { PRODUCTOS_POR_HOJA_TAREA } from "./map-orden-tarea-almacen";
import type { OrdenTareaAlmacenPrintData } from "./orden-tarea-almacen.types";

const PRODUCT_BODY_MIN_H = 5;
const QR_SIZE = 26;

const COLS = [
  { key: "#", w: 6 },
  { key: "Producto", w: 34 },
  { key: "Especificación", w: 38 },
  { key: "Cant.\nsolicitada", w: 14 },
  { key: "Alistó", w: 11 },
  { key: "Revisó", w: 11 },
] as const;

export function landscapeDrawProductTable(
  doc: jsPDF,
  data: OrdenTareaAlmacenPrintData,
  rightX: number,
): void {
  const baseW = COLS.reduce((sum, col) => sum + col.w, 0);
  const scale = LANDSCAPE_RIGHT_W / baseW;
  const scaledCols = COLS.map((col) => ({
    key: col.key,
    w: col.w * scale,
  }));

  let py = LANDSCAPE_MARGIN + 5;
  const headerH = 6.5;
  const qrFooterReserve = landscapeQrFooterReserve(QR_SIZE, data.diaEntrega);
  const availableForRows = LANDSCAPE_PAGE_BOTTOM - py - headerH - qrFooterReserve;
  const productRows = Math.min(
    PRODUCTOS_POR_HOJA_TAREA,
    Math.max(1, Math.floor(availableForRows / PRODUCT_BODY_MIN_H)),
  );
  const bodyH = availableForRows / productRows;

  landscapeBox(doc, rightX, py, LANDSCAPE_RIGHT_W, headerH);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  let hx = rightX;
  for (const col of scaledCols) {
    doc.text(col.key.split("\n"), hx + col.w / 2, py + 1.2, {
      align: "center",
      baseline: "top",
      lineHeightFactor: 1.05,
    });
    hx += col.w;
  }
  let vx = rightX;
  for (let i = 0; i < scaledCols.length - 1; i += 1) {
    vx += scaledCols[i]!.w;
    doc.line(vx, py, vx, py + headerH);
  }
  py += headerH;

  for (let index = 0; index < productRows; index += 1) {
    const linea = data.lineas[index];
    const shaded = index % 2 === 1;
    if (shaded) {
      doc.setFillColor(232, 232, 232);
      doc.rect(rightX, py, LANDSCAPE_RIGHT_W, bodyH, "F");
    }
    landscapeBox(doc, rightX, py, LANDSCAPE_RIGHT_W, bodyH);
    let cursorX = rightX;
    const values = [
      String((data.lineaInicio ?? 1) + index),
      linea?.producto ?? "",
      linea?.especificacion ?? "",
      linea?.cantidadSolicitada ?? "",
      "",
      "",
    ];
    for (let colIndex = 0; colIndex < scaledCols.length; colIndex += 1) {
      const col = scaledCols[colIndex]!;
      if (colIndex === 4 || colIndex === 5) {
        markPrintTickCell(
          doc,
          cursorX,
          py,
          col.w,
          bodyH,
          colIndex === 4 ? Boolean(linea?.alisto) : Boolean(linea?.reviso),
          landscapeBox,
        );
      } else if (values[colIndex]) {
        paintPrintCellText(doc, values[colIndex]!, cursorX, py, col.w, bodyH, {
          align: colIndex === 0 || colIndex === 3 ? "center" : "left",
          preferSize: colIndex === 1 || colIndex === 2 ? 6.2 : 6.5,
        });
      }
      cursorX += col.w;
      if (colIndex < scaledCols.length - 1) {
        doc.line(cursorX, py, cursorX, py + bodyH);
      }
    }
    py += bodyH;
  }

  drawLandscapeQrFooter(doc, {
    data,
    rightX,
    colWidths: scaledCols.map((c) => c.w),
    py,
    pageBottom: LANDSCAPE_PAGE_BOTTOM,
    pageW: LANDSCAPE_PAGE_W,
    margin: LANDSCAPE_MARGIN,
    qrSize: QR_SIZE,
  });
}