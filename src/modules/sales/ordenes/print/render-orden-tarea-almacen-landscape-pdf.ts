import { jsPDF } from "jspdf";
import { campoSurtido } from "../surtido/apply-surtido-to-print";
import type { OrdenTareaAlmacenPrintData } from "./orden-tarea-almacen.types";
import { PRODUCTOS_POR_HOJA_TAREA } from "./map-orden-tarea-almacen";

/**
 * Variante 2 columnas (hoja carta vertical):
 * izquierda = mismos campos que la vertical; derecha = productos.
 */
const PAGE_W = 215.9;
const PAGE_H = 279.4;
const MARGIN = 8;
const CONTENT_W = PAGE_W - MARGIN * 2;
const PAGE_BOTTOM = PAGE_H - MARGIN;
const GAP = 3;
const LEFT_W = 78;
const RIGHT_W = CONTENT_W - LEFT_W - GAP;
const PRODUCT_BODY_MIN_H = 5;
const PRODUCT_BODY_MAX_H = 6.2;

function box(
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

function markCheckbox(
  doc: jsPDF,
  x: number,
  y: number,
  checked: boolean,
  size = 2.8,
) {
  box(doc, x, y, size, size, 0.4);
  if (!checked) return;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("X", x + size / 2, y + size / 2, {
    align: "center",
    baseline: "middle",
  });
}

function field(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value = "",
  thick = false,
) {
  box(doc, x, y, w, h, thick ? 0.6 : 0.35);
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
function splitField(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  left: { label: string; value?: string },
  right: { label: string; value?: string },
  thick = false,
) {
  box(doc, x, y, w, h, thick ? 0.6 : 0.35);
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

function drawNotesLines(
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

export function drawOrdenTareaAlmacenLandscapePage(
  doc: jsPDF,
  data: OrdenTareaAlmacenPrintData,
): void {
  const folio = data.folio || "—";
  const isActualizado = Boolean(data.surtido);
  const factura = campoSurtido(
    data.surtido,
    "facturaAsociada",
    "Factura asociada",
    "factura",
  );

  const leftX = MARGIN;
  const rightX = MARGIN + LEFT_W + GAP;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(80);
  const tareaIndex =
    data.tareaIndex && data.tareaIndex > 0 ? data.tareaIndex : 1;
  const tareaTotal =
    data.tareaTotal && data.tareaTotal > 0 ? data.tareaTotal : 1;
  const ordenTrabajo = data.ordenTrabajo || `${tareaIndex}/${tareaTotal}`;
  doc.text(`Impresa ${data.impresa}`, MARGIN, 4.5, {
    baseline: "top",
  });
  doc.setTextColor(0);

  let y = MARGIN + 5;

  // ——— Izquierda: QR + mismos campos que la vertical ———
  const QR_SIZE = 26;
  const qrX = leftX + (LEFT_W - QR_SIZE) / 2;
  if (data.qrDataUrl) {
    try {
      doc.addImage(data.qrDataUrl, "PNG", qrX, y, QR_SIZE, QR_SIZE);
    } catch {
      box(doc, qrX, y, QR_SIZE, QR_SIZE, 0.5);
      doc.setFontSize(6);
      doc.text("QR", qrX + QR_SIZE / 2, y + QR_SIZE / 2, {
        align: "center",
        baseline: "middle",
      });
    }
  } else {
    box(doc, qrX, y, QR_SIZE, QR_SIZE, 0.5);
    doc.setFontSize(6);
    doc.text("QR", qrX + QR_SIZE / 2, y + QR_SIZE / 2, {
      align: "center",
      baseline: "middle",
    });
  }
  y += QR_SIZE + 2;

  const rowH = 10;
  field(
    doc,
    leftX,
    y,
    LEFT_W,
    rowH,
    "Tarea de Almacen",
    folio,
    true,
  );
  if (isActualizado) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.2);
    doc.text("Actualizada", leftX + LEFT_W - 1.4, y + 1.3, {
      align: "right",
      baseline: "top",
    });
  }
  y += rowH;
  splitField(
    doc,
    leftX,
    y,
    LEFT_W,
    rowH,
    { label: "# de orden del cliente", value: data.numeroOrdenCliente },
    { label: "Orden de trabajo", value: ordenTrabajo },
  );
  y += rowH;
  field(doc, leftX, y, LEFT_W, rowH, "Factura asociada", factura);
  y += rowH;
  field(doc, leftX, y, LEFT_W, rowH, "Cliente", data.cliente, true);
  y += rowH;
  field(doc, leftX, y, LEFT_W, rowH, "Centro de consumo", data.centroConsumo);
  y += rowH;
  splitField(
    doc,
    leftX,
    y,
    LEFT_W,
    rowH,
    { label: "Fecha de entrega", value: data.fechaEntrega },
    { label: "Hora de entrega", value: data.horaEntrega },
  );
  y += rowH;
  field(
    doc,
    leftX,
    y,
    LEFT_W,
    14,
    "Dirección de entrega",
    data.direccionEntrega,
  );
  y += 16;

  y = drawNotesLines(doc, leftX, y, LEFT_W, "", data.notasGenerales, 3);
  y += 2;

  const roles: Array<{
    role: string;
    showNombreFirma?: boolean;
    nombreKeys?: string[];
    firmaKeys?: string[];
  }> = [
    { role: "Alistó" },
    { role: "Revisó" },
    { role: "Factura (OK)" },
    {
      role: "Despachó",
      showNombreFirma: true,
      nombreKeys: [
        "despachoFirma",
        "Despachó firma",
        "despachoNombre",
        "Despachó nombre",
      ],
      firmaKeys: [
        "despachoFecha",
        "Despachó fecha",
        "despachoHora",
        "Despachó hora",
      ],
    },
    { role: "Retorno" },
  ];
  const roleH = 11;
  const roleGap = 1.2;
  for (const item of roles) {
    if (y + roleH > PAGE_BOTTOM) break;
    box(doc, leftX, y, LEFT_W, roleH);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(item.role, leftX + 1.4, y + 1.6, { baseline: "top" });
    if (item.showNombreFirma) {
      const nombre = campoSurtido(data.surtido, ...(item.nombreKeys ?? []));
      const firma = campoSurtido(data.surtido, ...(item.firmaKeys ?? []));
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.text(nombre || "Firma", leftX + 1.4, y + 8.5, { baseline: "top" });
      doc.text(firma || "Fecha", leftX + LEFT_W - 1.4, y + 8.5, {
        align: "right",
        baseline: "top",
      });
    }
    y += roleH + roleGap;
  }
  y += 1;
  const incidenciasTexto = campoSurtido(
    data.surtido,
    "incidencias",
    "Incidencias",
  );
  drawNotesLines(
    doc,
    leftX,
    y,
    LEFT_W,
    "Incidencias",
    incidenciasTexto,
    8,
    6.5,
    true,
  );

  // ——— Derecha: productos hasta el margen inferior ———
  const cols = [
    { key: "#", w: 6 },
    { key: "Producto", w: 40 },
    { key: "Especificación", w: 28 },
    { key: "Cant.\nsolicitada", w: 16 },
    { key: "Alistó", w: 12 },
    { key: "Revisó", w: 12 },
  ] as const;
  const baseW = cols.reduce((sum, col) => sum + col.w, 0);
  const scale = RIGHT_W / baseW;
  const scaledCols = cols.map((col) => ({
    key: col.key,
    w: col.w * scale,
  }));

  let py = MARGIN + 5;
  const headerH = 6.5;
  const availableForRows = PAGE_BOTTOM - py - headerH;
  const productRows = Math.min(
    PRODUCTOS_POR_HOJA_TAREA,
    Math.max(1, Math.floor(availableForRows / PRODUCT_BODY_MIN_H)),
  );
  const bodyH = Math.min(PRODUCT_BODY_MAX_H, availableForRows / productRows);

  box(doc, rightX, py, RIGHT_W, headerH);
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
      doc.rect(rightX, py, RIGHT_W, bodyH, "F");
    }
    box(doc, rightX, py, RIGHT_W, bodyH);
    let cursorX = rightX;
    const mid = py + bodyH / 2;
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
        markCheckbox(
          doc,
          cursorX + col.w / 2 - 1.3,
          mid - 1.3,
          colIndex === 4 ? Boolean(linea?.alisto) : Boolean(linea?.reviso),
          2.6,
        );
      } else if (values[colIndex]) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(colIndex === 1 || colIndex === 2 ? 5.5 : 6.2);
        const wrapped = doc.splitTextToSize(values[colIndex]!, col.w - 1.2);
        const shown = (Array.isArray(wrapped) ? wrapped : [wrapped]).slice(
          0,
          1,
        );
        const align = colIndex === 0 || colIndex === 3 ? "center" : "left";
        doc.text(
          shown,
          align === "center" ? cursorX + col.w / 2 : cursorX + 0.7,
          mid,
          {
            align,
            baseline: "middle",
          },
        );
      }
      cursorX += col.w;
      if (colIndex < scaledCols.length - 1) {
        doc.line(cursorX, py, cursorX, py + bodyH);
      }
    }
    py += bodyH;
  }
}

export function buildOrdenTareaAlmacenLandscapePdf(
  data: OrdenTareaAlmacenPrintData,
): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [PAGE_W, PAGE_H],
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
    format: [PAGE_W, PAGE_H],
  });
  sheets.forEach((sheet, index) => {
    if (index > 0) {
      doc.addPage([PAGE_W, PAGE_H], "portrait");
    }
    drawOrdenTareaAlmacenLandscapePage(doc, sheet);
  });
  return doc;
}
