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
const MIN_PRODUCT_ROWS = 10;

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

const INCIDENT_CODES: ReadonlyArray<readonly [string, string]> = [
  ["A", "No había suficiente"],
  ["B", "Se sustituyó"],
  ["C", "Calidad no cumple"],
  ["D", "No está en la factura"],
  ["E", "Especificación poco clara"],
  ["F", "Otro — explicar en la nota"],
];

/** Dibuja un ítem de leyenda y devuelve la X siguiente (o -1 si no cabe en la fila). */
function legendItemWidth(doc: jsPDF, _code: string, label: string): number {
  const codeW = 4.2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  return codeW + 1.2 + doc.getTextWidth(label) + 3.2;
}

function drawLegendItem(
  doc: jsPDF,
  x: number,
  y: number,
  code: string,
  label: string,
): number {
  const codeW = 4.2;
  box(doc, x, y, codeW, codeW, 0.4);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text(code, x + codeW / 2, y + codeW / 2, {
    align: "center",
    baseline: "middle",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  const textX = x + codeW + 1.2;
  doc.text(label, textX, y + codeW / 2, { baseline: "middle" });
  return textX + doc.getTextWidth(label) + 3.2;
}

/** Leyenda A–F dentro del recuadro, en filas para no salirse del ancho. */
function drawCodesLegend(doc: jsPDF, startY: number): number {
  const padX = 2;
  const padTop = 2;
  const rowGap = 1.6;
  const rowH = 5.2;
  const innerLeft = MARGIN + padX;
  const innerRight = MARGIN + CONTENT_W - padX;

  // Medir filas para fijar la altura del box.
  const rows: Array<Array<readonly [string, string]>> = [[]];
  let rowWidth = 0;
  for (const item of INCIDENT_CODES) {
    const w = legendItemWidth(doc, item[0], item[1]);
    const current = rows[rows.length - 1]!;
    if (current.length > 0 && innerLeft + rowWidth + w > innerRight) {
      rows.push([item]);
      rowWidth = w;
    } else {
      current.push(item);
      rowWidth += w;
    }
  }

  const titleH = 4.2;
  const codesH = padTop + titleH + rows.length * rowH + (rows.length - 1) * rowGap + 2;
  const y = ensureSpace(doc, startY, codesH + 3);
  box(doc, MARGIN, y, CONTENT_W, codesH, 0.6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("Códigos:", MARGIN + padX, y + padTop, { baseline: "top" });

  let itemY = y + padTop + titleH;
  for (const row of rows) {
    let x = innerLeft;
    for (const [code, label] of row) {
      x = drawLegendItem(doc, x, itemY, code, label);
    }
    itemY += rowH + rowGap;
  }

  return y + codesH + 3;
}

const PRODUCT_COLS = [
  { key: "#", w: 8 },
  { key: "Producto", w: 50 },
  { key: "Especificación", w: 30 },
  { key: "Cant.\nsolicitada", w: 20 },
  { key: "Cant.\npreparada", w: 20 },
  { key: "Cód.", w: 14 },
  { key: "Nota", w: 34 },
  { key: "Alistó", w: 12 },
  { key: "Revisó", w: 12 },
] as const;

const PRODUCT_TABLE_W = PRODUCT_COLS.reduce((sum, col) => sum + col.w, 0);
const PRODUCT_HEADER_H = 8;
const PRODUCT_BODY_H = 8;

function drawProductHeader(doc: jsPDF, y: number): number {
  box(doc, MARGIN, y, PRODUCT_TABLE_W, PRODUCT_HEADER_H);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);

  let hx = MARGIN;
  for (const colDef of PRODUCT_COLS) {
    const headerLines = colDef.key.split("\n");
    doc.text(headerLines, hx + colDef.w / 2, y + 1.6, {
      align: "center",
      baseline: "top",
      lineHeightFactor: 1.1,
    });
    hx += colDef.w;
  }

  let vx = MARGIN;
  for (let index = 0; index < PRODUCT_COLS.length - 1; index += 1) {
    vx += PRODUCT_COLS[index]!.w;
    doc.line(vx, y, vx, y + PRODUCT_HEADER_H);
  }

  return y + PRODUCT_HEADER_H;
}

function drawProductRow(
  doc: jsPDF,
  y: number,
  index: number,
  linea: OrdenTareaAlmacenPrintData["lineas"][number] | undefined,
): number {
  box(doc, MARGIN, y, PRODUCT_TABLE_W, PRODUCT_BODY_H);
  let x = MARGIN;
  const mid = y + PRODUCT_BODY_H / 2;
  const values = [
    String(index + 1),
    linea?.producto ?? "",
    linea?.especificacion ?? "",
    linea?.cantidadSolicitada ?? "",
    linea?.cantidadPreparada ?? "",
    linea?.codigoIncidencia ?? "",
    linea?.nota ?? "",
    "",
    "",
  ];

  for (let colIndex = 0; colIndex < PRODUCT_COLS.length; colIndex += 1) {
    const colDef = PRODUCT_COLS[colIndex]!;
    const value = values[colIndex] ?? "";
    if (colIndex === 7 || colIndex === 8) {
      const checked =
        colIndex === 7 ? Boolean(linea?.alisto) : Boolean(linea?.reviso);
      markCheckbox(doc, x + colDef.w / 2 - 1.6, mid - 1.6, checked);
    } else if (value) {
      const size = colIndex === 1 || colIndex === 2 ? 6.5 : 7.5;
      doc.setFontSize(size);
      doc.setFont("helvetica", "normal");
      const wrapped = doc.splitTextToSize(value, colDef.w - 2);
      const shown = (Array.isArray(wrapped) ? wrapped : [wrapped]).slice(0, 2);
      const align = colIndex === 0 || colIndex === 3 || colIndex === 4 || colIndex === 5
        ? "center"
        : "left";
      const textX = align === "center" ? x + colDef.w / 2 : x + 1.2;
      doc.text(shown, textX, mid, {
        align,
        baseline: "middle",
        lineHeightFactor: 1.05,
      });
    }
    x += colDef.w;
    if (colIndex < PRODUCT_COLS.length - 1) {
      doc.line(x, y, x, y + PRODUCT_BODY_H);
    }
  }

  return y + PRODUCT_BODY_H;
}

function writePageNumbers(doc: jsPDF, folio: string, impresa: string) {
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(80);
    doc.text(
      `${folio}  ·  Hoja ${page} de ${total}  ·  Impresa ${impresa}`,
      MARGIN,
      PAGE_H - 4,
      { baseline: "bottom" },
    );
    doc.setTextColor(0);
  }
}

export function buildOrdenTareaAlmacenPdf(
  data: OrdenTareaAlmacenPrintData,
): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [PAGE_W, PAGE_H],
  });

  let y = MARGIN;
  const folio = data.folio || "—";
  const isActualizado = Boolean(data.surtido);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(
    isActualizado ? "ORDEN DE VENTA (ACTUALIZADA)" : "ORDEN DE VENTA",
    MARGIN,
    y,
    { baseline: "top" },
  );

  const qrX = MARGIN + CONTENT_W - 18;
  const qrY = y;
  if (data.qrDataUrl) {
    try {
      doc.addImage(data.qrDataUrl, "PNG", qrX, qrY, 18, 18);
    } catch {
      box(doc, qrX, qrY, 18, 18, 0.5);
      doc.setFontSize(5.5);
      doc.setFont("helvetica", "normal");
      doc.text("QR", qrX + 9, qrY + 7, { align: "center", baseline: "middle" });
    }
  } else {
    box(doc, qrX, qrY, 18, 18, 0.5);
    doc.setFontSize(5.5);
    doc.setFont("helvetica", "normal");
    doc.text("QR", qrX + 9, qrY + 7, { align: "center", baseline: "middle" });
  }
  doc.setFontSize(5.5);
  doc.setFont("helvetica", "normal");
  doc.text("Escanear y fotografiar", MARGIN + CONTENT_W, y + 19, {
    align: "right",
    baseline: "top",
  });

  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(folio, MARGIN, y, { baseline: "top" });
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const factura = campoSurtido(
    data.surtido,
    "facturaAsociada",
    "Factura asociada",
    "factura",
  );
  doc.text(
    factura
      ? `Factura asociada: ${factura}`
      : "Factura asociada: _______________",
    MARGIN,
    y,
    { baseline: "top" },
  );

  y += 8;
  doc.setLineWidth(0.7);
  doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
  y += 3;

  const col = CONTENT_W / 4;
  const rowH = 11;
  const horaComprometida = campoSurtido(
    data.surtido,
    "horaComprometida",
    "Hora comprometida",
  );
  const horaSalida = campoSurtido(
    data.surtido,
    "horaSugeridaSalida",
    "Hora sugerida de salida",
  );
  const chofer = campoSurtido(data.surtido, "chofer", "Chofer");
  const unidad = campoSurtido(data.surtido, "unidad", "Unidad");

  field(doc, MARGIN, y, col * 2, rowH, "Cliente", data.cliente, true);
  field(doc, MARGIN + col * 2, y, col, rowH, "Centro de consumo / cocina", data.centroConsumo);
  field(doc, MARGIN + col * 3, y, col, rowH, "# de orden del cliente", data.numeroOrdenCliente);
  y += rowH;
  field(doc, MARGIN, y, col, rowH, "Fecha de entrega", data.fechaEntrega);
  field(doc, MARGIN + col, y, col, rowH, "Hora comprometida", horaComprometida);
  field(doc, MARGIN + col * 2, y, col, rowH, "Hora sugerida de salida", horaSalida);
  field(doc, MARGIN + col * 3, y, col, rowH, "Turno que prepara");
  markCheckbox(
    doc,
    MARGIN + col * 3 + 2,
    y + 6.2,
    checkSurtido(data.surtido, "turnoPm"),
    2.8,
  );
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.text("PM", MARGIN + col * 3 + 5.6, y + 6.6, { baseline: "top" });
  markCheckbox(
    doc,
    MARGIN + col * 3 + 16,
    y + 6.2,
    checkSurtido(data.surtido, "turnoNocheAm"),
    2.8,
  );
  doc.text("Noche / AM", MARGIN + col * 3 + 19.6, y + 6.6, { baseline: "top" });
  y += rowH;
  const addrH = 16;
  field(doc, MARGIN, y, col * 2, addrH, "Dirección de entrega", data.direccionEntrega);
  field(doc, MARGIN + col * 2, y, col, addrH, "Chofer", chofer);
  field(doc, MARGIN + col * 3, y, col, addrH, "Unidad", unidad);
  y += addrH + 3;

  y = ensureSpace(doc, y, 12 + PRODUCT_HEADER_H + PRODUCT_BODY_H);
  y = sectionTitle(
    doc,
    y,
    "Productos",
    "Anotar la cantidad preparada. Si difiere, código y nota.",
  );
  y = drawProductHeader(doc, y);

  const rowCount = Math.max(MIN_PRODUCT_ROWS, data.lineas.length);
  for (let index = 0; index < rowCount; index += 1) {
    if (y + PRODUCT_BODY_H > PAGE_BOTTOM) {
      y = ensureSpace(doc, y, PRODUCT_HEADER_H + PRODUCT_BODY_H);
      y = drawProductHeader(doc, y);
    }
    y = drawProductRow(doc, y, index, data.lineas[index]);
  }

  y += 2;
  y = drawCodesLegend(doc, y);

  const totW = CONTENT_W / 4;
  const totH = 11;
  y = ensureSpace(doc, y, totH + 3);
  const totValues = [
    String(data.lineas.length),
    campoSurtido(
      data.surtido,
      "renglonesSurtidosCompletos",
      "Renglones surtidos completos",
    ),
    campoSurtido(
      data.surtido,
      "cajas15kg21kg",
      "Cajas 1.5 kg / 21 kg",
      "Cajas 1.5",
    ),
    campoSurtido(
      data.surtido,
      "totalBultosCamion",
      "Total de bultos al camión",
      "bultos",
    ),
  ];
  const totLabels = [
    "Renglones en esta orden",
    "Renglones surtidos completos",
    "Cajas 1.5 kg / 21 kg",
    "Total de bultos al camión",
  ];
  totLabels.forEach((label, index) => {
    field(
      doc,
      MARGIN + totW * index,
      y,
      totW,
      totH,
      label,
      totValues[index] ?? "",
      true,
    );
  });
  y += totH + 3;

  y = ensureSpace(doc, y, 30);
  y = sectionTitle(
    doc,
    y,
    "De la orden completa",
    "Lo que no pertenece a un producto en particular.",
  );
  const incidents: Array<{
    label: string;
    key:
      | "incidenciaFueraHorario"
      | "incidenciaFacturaNoPedida"
      | "incidenciaSinFactura"
      | "incidenciaNinguna";
  }> = [
    {
      label: "Orden recibida fuera de horario",
      key: "incidenciaFueraHorario",
    },
    {
      label: "Factura trae producto que no se pidió",
      key: "incidenciaFacturaNoPedida",
    },
    {
      label: "Sin factura al momento de revisar",
      key: "incidenciaSinFactura",
    },
    {
      label: "Ninguna incidencia en toda la orden",
      key: "incidenciaNinguna",
    },
  ];
  incidents.forEach((item, index) => {
    const x = MARGIN + (index % 2) * (CONTENT_W / 2);
    const rowY = y + Math.floor(index / 2) * 6;
    markCheckbox(doc, x, rowY, checkSurtido(data.surtido, item.key));
    doc.setFont("helvetica", index === 3 ? "bold" : "normal");
    doc.setFontSize(8);
    doc.text(item.label, x + 5, rowY + 1.6, { baseline: "top" });
  });
  y += 14;

  y = ensureSpace(doc, y, 19);
  box(doc, MARGIN, y, CONTENT_W, 16, 0.6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Si algo no se puede surtir y no hay a quién preguntarle", MARGIN + 2, y + 2, {
    baseline: "top",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const rules = [
    "1. No sustituir por criterio propio ni dejar el renglón en blanco.",
    "2. Anotar la cantidad real preparada (puede ser 0), poner el código y escribir la nota.",
    "3. Fotografiar la hoja igual. No se detiene el embarque por esto.",
  ];
  rules.forEach((rule, index) => {
    doc.text(rule, MARGIN + 2, y + 6 + index * 3.2, { baseline: "top" });
  });
  y += 19;

  y = ensureSpace(doc, y, 17);
  box(doc, MARGIN, y, CONTENT_W, 14, 0.6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("¿La mercancía preparada coincide con la factura impresa?", MARGIN + 2, y + 2, {
    baseline: "top",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  const tolerancia = campoSurtido(
    data.surtido,
    "toleranciaPesoPct",
    "Tolerancia por peso",
    "tolerancia",
  );
  doc.text(
    tolerancia
      ? `Tolerancia por peso: ± ${tolerancia} %. Dentro de ese rango se marca «dentro de tolerancia».`
      : "Tolerancia por peso: ± ____ %. Dentro de ese rango se marca «dentro de tolerancia».",
    MARGIN + 2,
    y + 6,
    { baseline: "top" },
  );
  const recon: Array<{
    label: string;
    key:
      | "mercanciaCoincide"
      | "mercanciaDentroTolerancia"
      | "mercanciaFueraTolerancia";
  }> = [
    { label: "Coincide", key: "mercanciaCoincide" },
    { label: "Dentro de tolerancia", key: "mercanciaDentroTolerancia" },
    { label: "Fuera de tolerancia", key: "mercanciaFueraTolerancia" },
  ];
  recon.forEach((item, index) => {
    const x = MARGIN + 2 + index * 52;
    markCheckbox(doc, x, y + 9, checkSurtido(data.surtido, item.key), 3.4);
    doc.setFontSize(8);
    doc.text(item.label, x + 5, y + 9.6, { baseline: "top" });
  });
  y += 17;

  const sigH = 16;
  y = ensureSpace(doc, y, 10 + sigH);
  y = sectionTitle(doc, y, "Responsables", "Nombre y hora, siempre.");
  const roles: Array<{
    role: string;
    turno: string;
    nombreKeys: string[];
    horaKeys: string[];
  }> = [
    {
      role: "Alistó",
      turno: "Turno PM",
      nombreKeys: ["alistoNombre", "Alistó nombre"],
      horaKeys: ["alistoHora", "Alistó hora"],
    },
    {
      role: "Revisó",
      turno: "Turno PM",
      nombreKeys: ["revisoNombre", "Revisó nombre"],
      horaKeys: ["revisoHora", "Revisó hora"],
    },
    {
      role: "Documentó",
      turno: "Noche / AM",
      nombreKeys: ["documentoNombre", "Documentó nombre"],
      horaKeys: ["documentoHora", "Documentó hora"],
    },
    {
      role: "Despachó",
      turno: "Noche / AM",
      nombreKeys: ["despachoNombre", "Despachó nombre"],
      horaKeys: ["despachoHora", "Despachó hora"],
    },
  ];
  const sigW = CONTENT_W / 4;
  roles.forEach((item, index) => {
    const x = MARGIN + sigW * index;
    const nombre = campoSurtido(data.surtido, ...item.nombreKeys);
    const hora = campoSurtido(data.surtido, ...item.horaKeys);
    box(doc, x, y, sigW, sigH);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(item.role, x + 1.6, y + 1.6, { baseline: "top" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(item.turno, x + 1.6, y + 5.2, { baseline: "top" });
    doc.setLineWidth(0.3);
    doc.line(x + 1.6, y + 11, x + sigW - 1.6, y + 11);
    if (nombre) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text(nombre, x + 1.6, y + 9.2, {
        baseline: "bottom",
        maxWidth: sigW - 16,
      });
    } else {
      doc.setFontSize(6.8);
      doc.text("Nombre", x + 1.6, y + 12.2, { baseline: "top" });
    }
    if (hora) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text(hora, x + sigW - 1.6, y + 9.2, {
        align: "right",
        baseline: "bottom",
      });
    } else {
      doc.setFontSize(6.8);
      doc.text("Hora", x + sigW - 12, y + 12.2, { baseline: "top" });
    }
  });
  y += sigH + 3;

  const recH = 26;
  y = ensureSpace(doc, y, 10 + recH);
  y = sectionTitle(doc, y, "Recepción del cliente");
  const recW = CONTENT_W * 0.68;
  box(doc, MARGIN, y, recW, recH);
  box(doc, MARGIN + recW, y, CONTENT_W * 0.32, recH);
  const recOpts: Array<{
    label: string;
    key:
      | "recepcionAceptadoCompleto"
      | "recepcionAceptadoParcial"
      | "recepcionRechazado"
      | "recepcionRetornoFactura";
  }> = [
    { label: "Aceptado completo", key: "recepcionAceptadoCompleto" },
    { label: "Aceptado parcial", key: "recepcionAceptadoParcial" },
    { label: "Rechazado", key: "recepcionRechazado" },
    { label: "Retorno de factura", key: "recepcionRetornoFactura" },
  ];
  recOpts.forEach((item, index) => {
    const x = MARGIN + 2 + (index % 2) * 52;
    const rowY = y + 1.8 + Math.floor(index / 2) * 5;
    markCheckbox(doc, x, rowY, checkSurtido(data.surtido, item.key));
    doc.setFontSize(8);
    doc.text(item.label, x + 5, rowY + 0.4, { baseline: "top" });
  });
  doc.setLineWidth(0.3);
  doc.line(MARGIN + 2, y + 12.2, MARGIN + recW - 2, y + 12.2);
  const recepcionMotivo = campoSurtido(
    data.surtido,
    "recepcionMotivo",
    "Recepción motivo",
  );
  doc.setFontSize(6.8);
  doc.text(
    recepcionMotivo ||
      "Motivo si es parcial o rechazado — y qué producto",
    MARGIN + 2,
    y + 13.2,
    { baseline: "top", maxWidth: recW - 4 },
  );
  const recepcionNombre = campoSurtido(
    data.surtido,
    "recepcionNombre",
    "Recepción nombre",
  );
  const recepcionHora = campoSurtido(
    data.surtido,
    "recepcionHora",
    "Recepción hora",
  );
  doc.setFontSize(6.8);
  doc.text(
    recepcionNombre ? `Nombre: ${recepcionNombre}` : "Nombre de quien recibe",
    MARGIN + 2,
    y + 18.4,
    { baseline: "top" },
  );
  doc.setLineWidth(0.3);
  doc.line(MARGIN + 2, y + 23.4, MARGIN + recW - 28, y + 23.4);
  doc.text(
    recepcionHora ? `Hora: ${recepcionHora}` : "Hora",
    MARGIN + recW - 26,
    y + 18.4,
    { baseline: "top" },
  );
  doc.line(MARGIN + recW - 26, y + 23.4, MARGIN + recW - 2, y + 23.4);
  doc.setFontSize(7.5);
  doc.text("Sello y firma del cliente", MARGIN + recW + CONTENT_W * 0.16, y + recH - 3.2, {
    align: "center",
    baseline: "top",
  });
  y += recH + 3;

  y = ensureSpace(doc, y, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
  doc.text(
    "Cómo se llena: pluma negra o azul, nunca lápiz. Marcar casillas y anotar cantidades dentro de los cuadros. Nada de notas al margen ni hojas sueltas. No meter la hoja al cuarto frío.",
    MARGIN,
    y + 1.5,
    { baseline: "top", maxWidth: CONTENT_W },
  );
  doc.text(
    "Foto 1: al cerrar almacén, antes de subir al camión.  Foto 2: ya firmada por el cliente.  Hoja plana, sin sombra.",
    MARGIN,
    y + 8,
    { baseline: "top" },
  );

  writePageNumbers(doc, folio, data.impresa);
  return doc;
}
