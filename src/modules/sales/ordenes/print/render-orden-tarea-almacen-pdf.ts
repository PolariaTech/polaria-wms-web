import { jsPDF } from "jspdf";
import {
  campoSurtido,
  checkSurtido,
} from "../surtido/apply-surtido-to-print";
import type { OrdenTareaAlmacenPrintData } from "./orden-tarea-almacen.types";

/** Carta: coincide con el destino típico del diálogo de impresión. */
const PAGE_W = 215.9;
const PAGE_H = 279.4;
const MARGIN = 8;
const CONTENT_W = PAGE_W - MARGIN * 2;
const PAGE_BOTTOM = PAGE_H - MARGIN;

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

function checkbox(doc: jsPDF, x: number, y: number, size = 3.2) {
  box(doc, x, y, size, size, 0.4);
}

function markCheckbox(
  doc: jsPDF,
  x: number,
  y: number,
  checked: boolean,
  size = 3.2,
) {
  checkbox(doc, x, y, size);
  if (!checked) return;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(size >= 3.4 ? 9 : 8);
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

function sectionTitle(
  doc: jsPDF,
  y: number,
  title: string,
  hint = "",
): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(title, MARGIN, y, { baseline: "top" });
  if (hint) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(hint, MARGIN + CONTENT_W, y + 0.4, {
      baseline: "top",
      align: "right",
    });
  }
  const lineY = y + 5;
  doc.setLineWidth(0.5);
  doc.line(MARGIN, lineY, MARGIN + CONTENT_W, lineY);
  return lineY + 2;
}

/** Si no cabe el bloque, abre hoja nueva y reinicia Y. */
function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed <= PAGE_BOTTOM) return y;
  doc.addPage([PAGE_W, PAGE_H], "portrait");
  return MARGIN;
}

const MIN_PRODUCT_ROWS_PER_COL = 25;
const PRODUCT_TABLE_W = 99;
const PRODUCT_COL_GAP = CONTENT_W - PRODUCT_TABLE_W * 2;

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
  box(doc, startX, y, PRODUCT_TABLE_W, PRODUCT_HEADER_H);
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
): number {
  if (shaded) {
    doc.setFillColor(232, 232, 232);
    doc.rect(startX, y, PRODUCT_TABLE_W, PRODUCT_BODY_H, "F");
  }
  box(doc, startX, y, PRODUCT_TABLE_W, PRODUCT_BODY_H);
  let cursorX = startX;
  const mid = y + PRODUCT_BODY_H / 2;
  const values = [
    String(index + 1),
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
      markCheckbox(doc, cursorX + colDef.w / 2 - 1.4, mid - 1.4, checked, 2.8);
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

function writePageNumbers(doc: jsPDF, impresa: string) {
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(80);
    doc.text(
      `Orden de tarea ${page}/${total}  ·  Impresa ${impresa}`,
      MARGIN,
      4.5,
      { baseline: "top" },
    );
    doc.setTextColor(0);
  }
}

function drawNotesLines(
  doc: jsPDF,
  y: number,
  label: string,
  value = "",
  lineCount = 2,
): number {
  const labelH = label.trim() ? 5.5 : 0;
  const blockH = labelH + lineCount * 5.2;
  y = ensureSpace(doc, y, blockH + 2);
  let lineY = y;
  if (label.trim()) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(`${label}:`, MARGIN, y, { baseline: "top" });
    lineY = y + 5.5;
  } else {
    lineY = y + 3.2;
  }
  doc.setDrawColor(0);
  doc.setLineWidth(0.35);

  const textW = CONTENT_W - 2;
  const lineStep = 5.2;
  const trimmed = value.replace(/\s+/g, " ").trim();
  let lines: string[] = [];
  let fontSize = 7.5;

  if (trimmed) {
    doc.setFont("helvetica", "normal");
    for (const size of [7.5, 6.5, 5.5, 4.8, 4.2]) {
      doc.setFontSize(size);
      const wrapped = doc.splitTextToSize(trimmed, textW);
      const all = Array.isArray(wrapped) ? wrapped : [wrapped];
      if (all.length <= lineCount) {
        lines = all;
        fontSize = size;
        break;
      }
      lines = all.slice(0, lineCount);
      fontSize = size;
    }
  }

  for (let index = 0; index < lineCount; index += 1) {
    doc.line(MARGIN, lineY, MARGIN + CONTENT_W, lineY);
    const lineText = lines[index];
    if (lineText) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(fontSize);
      doc.text(lineText, MARGIN + 1, lineY - 1.2, { baseline: "bottom" });
    }
    lineY += lineStep;
  }
  return lineY - 1.5;
}

export function buildOrdenTareaAlmacenPdf(
  data: OrdenTareaAlmacenPrintData,
): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [PAGE_W, PAGE_H],
  });

  const QR_SIZE = 28;
  const QR_GAP = 2.5;
  const gridW = CONTENT_W - QR_SIZE - QR_GAP;
  const col = gridW / 3;
  const rowH = 11;
  const addrH = 12;
  const sigH = 16;
  const pageMetaH = 6;
  // Sin centrado vertical: el bloque de incidencias llena hasta el margen inferior.
  let y = MARGIN + pageMetaH;

  const folio = data.folio || "—";
  const isActualizado = Boolean(data.surtido);
  const factura = campoSurtido(
    data.surtido,
    "facturaAsociada",
    "Factura asociada",
    "factura",
  );

  // Toda la grilla a la izquierda del QR, columnas alineadas.
  // Fila 1: Tarea de Almacen · # orden · Factura
  field(
    doc,
    MARGIN,
    y,
    col,
    rowH,
    "Tarea de Almacen",
    isActualizado ? `${folio}\nActualizada` : folio,
    true,
  );
  field(
    doc,
    MARGIN + col,
    y,
    col,
    rowH,
    "# de orden del cliente",
    data.numeroOrdenCliente,
  );
  field(doc, MARGIN + col * 2, y, col, rowH, "Factura asociada", factura);

  const qrX = MARGIN + gridW + QR_GAP;
  const qrY = y;
  if (data.qrDataUrl) {
    try {
      doc.addImage(data.qrDataUrl, "PNG", qrX, qrY, QR_SIZE, QR_SIZE);
    } catch {
      box(doc, qrX, qrY, QR_SIZE, QR_SIZE, 0.5);
      doc.setFontSize(5.5);
      doc.setFont("helvetica", "normal");
      doc.text("QR", qrX + QR_SIZE / 2, qrY + QR_SIZE / 2, {
        align: "center",
        baseline: "middle",
      });
    }
  } else {
    box(doc, qrX, qrY, QR_SIZE, QR_SIZE, 0.5);
    doc.setFontSize(5.5);
    doc.setFont("helvetica", "normal");
    doc.text("QR", qrX + QR_SIZE / 2, qrY + QR_SIZE / 2, {
      align: "center",
      baseline: "middle",
    });
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.text("Escanear y fotografiar", qrX + QR_SIZE / 2, qrY + QR_SIZE + 1, {
    align: "center",
    baseline: "top",
    maxWidth: QR_SIZE + QR_GAP,
  });

  y += rowH;
  // Fila 2: Cliente · Centro · Fecha|Hora (un solo campo partido)
  field(doc, MARGIN, y, col, rowH, "Cliente", data.cliente, true);
  field(
    doc,
    MARGIN + col,
    y,
    col,
    rowH,
    "Centro de consumo",
    data.centroConsumo,
  );
  splitField(
    doc,
    MARGIN + col * 2,
    y,
    col,
    rowH,
    { label: "Fecha de entrega", value: data.fechaEntrega },
    { label: "Hora de entrega", value: data.horaEntrega },
  );
  y += rowH;

  // Fila 3: Dirección sola
  field(
    doc,
    MARGIN,
    y,
    gridW,
    addrH,
    "Dirección de entrega",
    data.direccionEntrega,
  );
  y += addrH + 2;
  y = drawNotesLines(doc, y, "", data.notasGenerales, 3);
  y += 2;

  // Páginas de a 50 renglones (25 por columna).
  y = ensureSpace(
    doc,
    y,
    12 + PRODUCT_HEADER_H + PRODUCT_BODY_H * MIN_PRODUCT_ROWS_PER_COL,
  );

  const leftX = MARGIN;
  const rightX = MARGIN + PRODUCT_TABLE_W + PRODUCT_COL_GAP;
  const slotsNeeded = Math.max(
    MIN_PRODUCT_ROWS_PER_COL * 2,
    data.lineas.length,
  );
  for (
    let pageStart = 0;
    pageStart < slotsNeeded;
    pageStart += MIN_PRODUCT_ROWS_PER_COL * 2
  ) {
    if (pageStart > 0) {
      y = ensureSpace(doc, PAGE_BOTTOM, PRODUCT_HEADER_H + PRODUCT_BODY_H);
      y = Math.max(y, MARGIN + 6);
    } else if (y + PRODUCT_HEADER_H + PRODUCT_BODY_H > PAGE_BOTTOM) {
      y = ensureSpace(doc, y, PRODUCT_HEADER_H + PRODUCT_BODY_H);
      y = Math.max(y, MARGIN + 6);
    }

    drawProductHeader(doc, y, leftX);
    drawProductHeader(doc, y, rightX);
    y += PRODUCT_HEADER_H;

    for (let row = 0; row < MIN_PRODUCT_ROWS_PER_COL; row += 1) {
      if (y + PRODUCT_BODY_H > PAGE_BOTTOM) {
        y = ensureSpace(doc, y, PRODUCT_HEADER_H + PRODUCT_BODY_H);
        y = Math.max(y, MARGIN + 6);
        drawProductHeader(doc, y, leftX);
        drawProductHeader(doc, y, rightX);
        y += PRODUCT_HEADER_H;
      }
      const leftIndex = pageStart + row;
      const rightIndex = pageStart + MIN_PRODUCT_ROWS_PER_COL + row;
      const shaded = row % 2 === 1;
      drawProductRow(doc, y, leftX, leftIndex, data.lineas[leftIndex], shaded);
      drawProductRow(doc, y, rightX, rightIndex, data.lineas[rightIndex], shaded);
      y += PRODUCT_BODY_H;
    }
  }

  y += 2;
  y = ensureSpace(doc, y, 6 + sigH);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
  y += 3;

  const roles: Array<{
    role: string;
    showNombreHora: boolean;
    nombreKeys: string[];
    horaKeys: string[];
  }> = [
    {
      role: "Alistó",
      showNombreHora: true,
      nombreKeys: ["alistoNombre", "Alistó nombre", "Alistó"],
      horaKeys: ["alistoHora", "Alistó hora"],
    },
    {
      role: "Revisó",
      showNombreHora: true,
      nombreKeys: ["revisoNombre", "Revisó nombre", "Revisó"],
      horaKeys: ["revisoHora", "Revisó hora"],
    },
    {
      role: "Factura (OK)",
      showNombreHora: true,
      nombreKeys: [
        "facturaOkNombre",
        "Factura (OK) nombre",
        "documentoNombre",
        "Documentó nombre",
      ],
      horaKeys: [
        "facturaOkHora",
        "Factura (OK) hora",
        "documentoHora",
        "Documentó hora",
      ],
    },
    {
      role: "Despachó",
      showNombreHora: true,
      nombreKeys: ["despachoNombre", "Despachó nombre"],
      horaKeys: ["despachoHora", "Despachó hora"],
    },
    {
      role: "Retorno",
      showNombreHora: true,
      nombreKeys: ["retornoNombre", "Retorno nombre", "Retorno"],
      horaKeys: ["retornoHora", "Retorno hora"],
    },
  ];
  const sigW = CONTENT_W / roles.length;
  roles.forEach((item, index) => {
    const x = MARGIN + sigW * index;
    box(doc, x, y, sigW, sigH);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(item.role, x + 1.6, y + 1.6, { baseline: "top" });
    if (!item.showNombreHora) return;

    const nombre = campoSurtido(data.surtido, ...item.nombreKeys);
    const firma = campoSurtido(data.surtido, ...item.horaKeys);
    if (nombre) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text(nombre, x + 1.6, y + 12.2, {
        baseline: "top",
        maxWidth: sigW / 2 - 3,
      });
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
      doc.text("Nombre", x + 1.6, y + 12.2, { baseline: "top" });
    }
    if (firma) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text(firma, x + sigW - 1.6, y + 12.2, {
        align: "right",
        baseline: "top",
      });
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
      doc.text("Firma", x + sigW - 1.6, y + 12.2, {
        align: "right",
        baseline: "top",
      });
    }
  });
  y += sigH + 3;
  const incidenciaLineStep = 5.2;
  const incidenciaLabelH = 5.5;
  // Reserva 2 mm del ensureSpace interno de drawNotesLines.
  const incidenciaRemaining = PAGE_BOTTOM - y - incidenciaLabelH - 2;
  const incidenciaLines = Math.max(
    3,
    Math.floor(incidenciaRemaining / incidenciaLineStep),
  );
  const incidenciasTexto = campoSurtido(
    data.surtido,
    "incidencias",
    "Incidencias",
  );
  drawNotesLines(doc, y, "Incidencias", incidenciasTexto, incidenciaLines);

  writePageNumbers(doc, data.impresa);
  return doc;
}
