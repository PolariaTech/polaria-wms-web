import type { jsPDF } from "jspdf";
import {
  PORTRAIT_CONTENT_W,
  PORTRAIT_MARGIN,
  PORTRAIT_PAGE_BOTTOM,
  portraitBox,
  portraitEnsureSpace,
  portraitMarkTickCell,
} from "./draw-portrait-orden-pdf-layout";
import type { OrdenTareaAlmacenPrintData } from "./orden-tarea-almacen.types";

export const PORTRAIT_MIN_PRODUCT_ROWS_PER_COL = 25;
export const PORTRAIT_PRODUCT_TABLE_W = 99;
const PRODUCT_COL_GAP = PORTRAIT_CONTENT_W - PORTRAIT_PRODUCT_TABLE_W * 2;

const PRODUCT_COLS = [
  { key: "#", w: 5 },
  { key: "Producto", w: 36 },
  { key: "Especificación", w: 24 },
  { key: "Cant.\nsolicitada", w: 14 },
  { key: "Alistó", w: 10 },
  { key: "Revisó", w: 10 },
] as const;

const PRODUCT_HEADER_H = 6.5;
const PRODUCT_BODY_H = 5.4;

function drawProductHeader(doc: jsPDF, y: number, startX: number): number {
  portraitBox(doc, startX, y, PORTRAIT_PRODUCT_TABLE_W, PRODUCT_HEADER_H);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);

  let hx = startX;
  for (const colDef of PRODUCT_COLS) {
    const headerLines = colDef.key.split("\n");
    doc.text(headerLines, hx + colDef.w / 2, y + 1.2, {
      align: "center",
      baseline: "top",
      lineHeightFactor: 1.05,
    });
    hx += colDef.w;
  }

  let vx = startX;
  for (let index = 0; index < PRODUCT_COLS.length - 1; index += 1) {
    vx += PRODUCT_COLS[index]!.w;
    doc.line(vx, y, vx, y + PRODUCT_HEADER_H);
  }

  return y + PRODUCT_HEADER_H;
}

function drawProductRow(
  doc: jsPDF,
  y: number,
  startX: number,
  index: number,
  linea: OrdenTareaAlmacenPrintData["lineas"][number] | undefined,
  shaded = false,
  lineaInicio = 1,
): number {
  if (shaded) {
    doc.setFillColor(232, 232, 232);
    doc.rect(startX, y, PORTRAIT_PRODUCT_TABLE_W, PRODUCT_BODY_H, "F");
  }
  portraitBox(doc, startX, y, PORTRAIT_PRODUCT_TABLE_W, PRODUCT_BODY_H);
  let cursorX = startX;
  const mid = y + PRODUCT_BODY_H / 2;
  const values = [
    String(lineaInicio + index),
    linea?.producto ?? "",
    linea?.especificacion ?? "",
    linea?.cantidadSolicitada ?? "",
    "",
    "",
  ];

  for (let colIndex = 0; colIndex < PRODUCT_COLS.length; colIndex += 1) {
    const colDef = PRODUCT_COLS[colIndex]!;
    const value = values[colIndex] ?? "";
    if (colIndex === 4 || colIndex === 5) {
      const checked =
        colIndex === 4 ? Boolean(linea?.alisto) : Boolean(linea?.reviso);
      portraitMarkTickCell(doc, cursorX, y, colDef.w, PRODUCT_BODY_H, checked);
    } else if (value) {
      const size = colIndex === 1 || colIndex === 2 ? 5.5 : 6.5;
      doc.setFontSize(size);
      doc.setFont("helvetica", "normal");
      const wrapped = doc.splitTextToSize(value, colDef.w - 1.4);
      const shown = (Array.isArray(wrapped) ? wrapped : [wrapped]).slice(0, 2);
      const align = colIndex === 0 || colIndex === 3 ? "center" : "left";
      const textX = align === "center" ? cursorX + colDef.w / 2 : cursorX + 0.8;
      doc.text(shown, textX, mid, {
        align,
        baseline: "middle",
        lineHeightFactor: 1.02,
      });
    }
    cursorX += colDef.w;
    if (colIndex < PRODUCT_COLS.length - 1) {
      doc.line(cursorX, y, cursorX, y + PRODUCT_BODY_H);
    }
  }

  return y + PRODUCT_BODY_H;
}

/** Páginas de a 50 renglones (25 por columna). */
export function portraitDrawProductTables(
  doc: jsPDF,
  data: OrdenTareaAlmacenPrintData,
  startY: number,
): number {
  let y = portraitEnsureSpace(
    doc,
    startY,
    12 + PRODUCT_HEADER_H + PRODUCT_BODY_H * PORTRAIT_MIN_PRODUCT_ROWS_PER_COL,
  );

  const leftX = PORTRAIT_MARGIN;
  const rightX = PORTRAIT_MARGIN + PORTRAIT_PRODUCT_TABLE_W + PRODUCT_COL_GAP;
  const slotsNeeded = Math.max(
    PORTRAIT_MIN_PRODUCT_ROWS_PER_COL * 2,
    data.lineas.length,
  );
  const lineaInicio = data.lineaInicio ?? 1;

  for (
    let pageStart = 0;
    pageStart < slotsNeeded;
    pageStart += PORTRAIT_MIN_PRODUCT_ROWS_PER_COL * 2
  ) {
    if (pageStart > 0) {
      y = portraitEnsureSpace(doc, PORTRAIT_PAGE_BOTTOM, PRODUCT_HEADER_H + PRODUCT_BODY_H);
      y = Math.max(y, PORTRAIT_MARGIN + 6);
    } else if (y + PRODUCT_HEADER_H + PRODUCT_BODY_H > PORTRAIT_PAGE_BOTTOM) {
      y = portraitEnsureSpace(doc, y, PRODUCT_HEADER_H + PRODUCT_BODY_H);
      y = Math.max(y, PORTRAIT_MARGIN + 6);
    }

    drawProductHeader(doc, y, leftX);
    drawProductHeader(doc, y, rightX);
    y += PRODUCT_HEADER_H;

    for (let row = 0; row < PORTRAIT_MIN_PRODUCT_ROWS_PER_COL; row += 1) {
      if (y + PRODUCT_BODY_H > PORTRAIT_PAGE_BOTTOM) {
        y = portraitEnsureSpace(doc, y, PRODUCT_HEADER_H + PRODUCT_BODY_H);
        y = Math.max(y, PORTRAIT_MARGIN + 6);
        drawProductHeader(doc, y, leftX);
        drawProductHeader(doc, y, rightX);
        y += PRODUCT_HEADER_H;
      }
      const leftIndex = pageStart + row;
      const rightIndex = pageStart + PORTRAIT_MIN_PRODUCT_ROWS_PER_COL + row;
      const shaded = row % 2 === 1;
      drawProductRow(
        doc,
        y,
        leftX,
        leftIndex,
        data.lineas[leftIndex],
        shaded,
        lineaInicio,
      );
      drawProductRow(
        doc,
        y,
        rightX,
        rightIndex,
        data.lineas[rightIndex],
        shaded,
        lineaInicio,
      );
      y += PRODUCT_BODY_H;
    }
  }

  return y;
}