import { jsPDF } from "jspdf";
import type { OrdenTareaAlmacenPrintData } from "./orden-tarea-almacen.types";

const PAGE_W = 216;
const PAGE_H = 330;
const MARGIN = 8;
const CONTENT_W = PAGE_W - MARGIN * 2;
const MIN_PRODUCT_ROWS = 11;

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
  if (value.trim()) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(value, w - 3.2);
    doc.text(lines, x + 1.6, y + 5.4, { baseline: "top" });
  }
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

function legendItem(
  doc: jsPDF,
  x: number,
  y: number,
  code: string,
  label: string,
): number {
  box(doc, x, y, 4.4, 4.4, 0.4);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(code, x + 2.2, y + 2.2, { align: "center", baseline: "middle" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const textX = x + 5.4;
  doc.text(label, textX, y + 2.2, { baseline: "middle" });
  return textX + doc.getTextWidth(label) + 4;
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

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("ORDEN DE TAREA — ALMACÉN", MARGIN, y, { baseline: "top" });

  box(doc, MARGIN + CONTENT_W - 18, y, 18, 18, 0.5);
  doc.setFontSize(5.5);
  doc.setFont("helvetica", "normal");
  doc.text("QR", MARGIN + CONTENT_W - 9, y + 7, {
    align: "center",
    baseline: "middle",
  });
  doc.text("Escanear y fotografiar", MARGIN + CONTENT_W, y + 19, {
    align: "right",
    baseline: "top",
  });

  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(data.folio || "—", MARGIN, y, { baseline: "top" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    `  ·  Hoja 1 de 1  ·  Impresa ${data.impresa}`,
    MARGIN + doc.getTextWidth(data.folio || "—"),
    y + 1.2,
    { baseline: "top" },
  );
  y += 6;
  doc.text("Factura asociada: _______________", MARGIN, y, { baseline: "top" });

  y += 8;
  doc.setLineWidth(0.7);
  doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
  y += 3;

  const col = CONTENT_W / 4;
  const rowH = 11;
  field(doc, MARGIN, y, col * 2, rowH, "Cliente", data.cliente, true);
  field(doc, MARGIN + col * 2, y, col, rowH, "Centro de consumo / cocina", data.centroConsumo);
  field(doc, MARGIN + col * 3, y, col, rowH, "# de orden del cliente", data.numeroOrdenCliente);
  y += rowH;
  field(doc, MARGIN, y, col, rowH, "Fecha de entrega", data.fechaEntrega);
  field(doc, MARGIN + col, y, col, rowH, "Hora comprometida");
  field(doc, MARGIN + col * 2, y, col, rowH, "Hora sugerida de salida");
  field(doc, MARGIN + col * 3, y, col, rowH, "Turno que prepara");
  checkbox(doc, MARGIN + col * 3 + 2, y + 6.2);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("PM", MARGIN + col * 3 + 6.2, y + 7.6, { baseline: "top" });
  checkbox(doc, MARGIN + col * 3 + 14, y + 6.2);
  doc.text("Noche/AM", MARGIN + col * 3 + 18.2, y + 7.6, { baseline: "top" });
  y += rowH;
  field(doc, MARGIN, y, col * 2, rowH, "Dirección de entrega", data.direccionEntrega);
  field(doc, MARGIN + col * 2, y, col, rowH, "Chofer");
  field(doc, MARGIN + col * 3, y, col, rowH, "Unidad");
  y += rowH + 3;

  y = sectionTitle(
    doc,
    y,
    "Productos",
    "Anotar la cantidad preparada. Si difiere, código y nota.",
  );

  const cols = [
    { key: "#", w: 8 },
    { key: "Producto", w: 50 },
    { key: "Especificación", w: 28 },
    { key: "Cant. solicitada", w: 22 },
    { key: "Cant. preparada", w: 22 },
    { key: "Cód.", w: 10 },
    { key: "Nota", w: 36 },
    { key: "Alistó", w: 12 },
    { key: "Revisó", w: 12 },
  ] as const;
  const tableW = cols.reduce((sum, colDef) => sum + colDef.w, 0);
  const headerH = 9;
  const bodyH = 6.8;
  const groupStart = cols.slice(0, 5).reduce((sum, colDef) => sum + colDef.w, 0);

  box(doc, MARGIN, y, tableW, headerH);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.line(MARGIN + groupStart, y, MARGIN + groupStart, y + headerH);
  doc.line(MARGIN + groupStart + 46, y, MARGIN + groupStart + 46, y + headerH);
  doc.text("SI ALGO NO SALIÓ COMO SE PIDIÓ", MARGIN + groupStart + 23, y + 2.2, {
    align: "center",
    baseline: "top",
  });
  doc.text("TURNO PM", MARGIN + groupStart + 58, y + 2.2, {
    align: "center",
    baseline: "top",
  });
  doc.setLineWidth(0.25);
  doc.line(MARGIN, y + 5.2, MARGIN + tableW, y + 5.2);

  let hx = MARGIN;
  for (const colDef of cols) {
    doc.text(colDef.key, hx + colDef.w / 2, y + 6.2, {
      align: "center",
      baseline: "top",
    });
    hx += colDef.w;
  }

  let vx = MARGIN;
  for (let index = 0; index < cols.length - 1; index += 1) {
    vx += cols[index]!.w;
    doc.line(vx, y, vx, y + headerH);
  }

  y += headerH;
  const rowCount = Math.max(MIN_PRODUCT_ROWS, data.lineas.length);
  doc.setFont("helvetica", "normal");

  for (let index = 0; index < rowCount; index += 1) {
    const linea = data.lineas[index];
    box(doc, MARGIN, y, tableW, bodyH);
    let x = MARGIN;
    const mid = y + bodyH / 2;
    const values = [
      String(index + 1),
      linea?.producto ?? "",
      linea?.especificacion ?? "",
      linea?.cantidadSolicitada ?? "",
      "",
      "",
      "",
      "",
      "",
    ];

    for (let colIndex = 0; colIndex < cols.length; colIndex += 1) {
      const colDef = cols[colIndex]!;
      const value = values[colIndex] ?? "";
      if (colIndex === 5 || colIndex === 7 || colIndex === 8) {
        checkbox(doc, x + colDef.w / 2 - 1.6, mid - 1.6);
      } else if (value) {
        const size = colIndex === 1 ? 7 : 8;
        doc.setFontSize(size);
        doc.setFont("helvetica", "normal");
        const wrapped = doc.splitTextToSize(value, colDef.w - 2);
        const line = Array.isArray(wrapped) ? wrapped[0] : wrapped;
        const align = colIndex === 0 || colIndex === 3 ? "center" : "left";
        const textX = align === "center" ? x + colDef.w / 2 : x + 1.2;
        doc.text(line, textX, mid, { align, baseline: "middle" });
      }
      x += colDef.w;
      if (colIndex < cols.length - 1) {
        doc.line(x, y, x, y + bodyH);
      }
    }
    y += bodyH;
  }

  y += 2;
  box(doc, MARGIN, y, CONTENT_W, 9);
  const codes: Array<[string, string]> = [
    ["A", "No había suficiente"],
    ["B", "Se sustituyó"],
    ["C", "Calidad no cumple"],
    ["D", "No está en la factura"],
    ["E", "Especificación poco clara"],
    ["F", "Otro — explicar en la nota"],
  ];
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Códigos:", MARGIN + 2, y + 4.5, { baseline: "middle" });
  let codeX = MARGIN + 20;
  for (const [code, label] of codes) {
    codeX = legendItem(doc, codeX, y + 2.3, code, label);
  }
  y += 12;

  const totW = CONTENT_W / 4;
  const totH = 11;
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
      index === 0 ? String(data.lineas.length) : "",
      true,
    );
  });
  y += totH + 3;

  y = sectionTitle(
    doc,
    y,
    "De la orden completa",
    "Lo que no pertenece a un producto en particular.",
  );
  const incidents = [
    "Orden recibida fuera de horario",
    "Factura trae producto que no se pidió",
    "Sin factura al momento de revisar",
    "Ninguna incidencia en toda la orden",
  ];
  incidents.forEach((label, index) => {
    const x = MARGIN + (index % 2) * (CONTENT_W / 2);
    const rowY = y + Math.floor(index / 2) * 6;
    checkbox(doc, x, rowY);
    doc.setFont("helvetica", index === 3 ? "bold" : "normal");
    doc.setFontSize(8);
    doc.text(label, x + 5, rowY + 1.6, { baseline: "top" });
  });
  y += 14;

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

  box(doc, MARGIN, y, CONTENT_W, 14, 0.6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("¿La mercancía preparada coincide con la factura impresa?", MARGIN + 2, y + 2, {
    baseline: "top",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(
    "Tolerancia por peso: ± ____ %. Dentro de ese rango se marca «dentro de tolerancia».",
    MARGIN + 2,
    y + 6,
    { baseline: "top" },
  );
  const recon = ["Coincide", "Dentro de tolerancia", "Fuera de tolerancia"];
  recon.forEach((label, index) => {
    const x = MARGIN + 2 + index * 52;
    checkbox(doc, x, y + 9, 3.4);
    doc.setFontSize(8);
    doc.text(label, x + 5, y + 9.6, { baseline: "top" });
  });
  y += 17;

  y = sectionTitle(doc, y, "Responsables", "Nombre y hora, siempre.");
  const roles = [
    ["Alistó", "Turno PM"],
    ["Revisó", "Turno PM"],
    ["Documentó", "Noche / AM"],
    ["Despachó", "Noche / AM"],
  ];
  const sigW = CONTENT_W / 4;
  const sigH = 16;
  roles.forEach(([role, turno], index) => {
    const x = MARGIN + sigW * index;
    box(doc, x, y, sigW, sigH);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(role, x + 1.6, y + 1.6, { baseline: "top" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(turno, x + 1.6, y + 5.2, { baseline: "top" });
    doc.setLineWidth(0.3);
    doc.line(x + 1.6, y + 11, x + sigW - 1.6, y + 11);
    doc.text("Nombre", x + 1.6, y + 12.2, { baseline: "top" });
    doc.text("Hora", x + sigW - 12, y + 12.2, { baseline: "top" });
  });
  y += sigH + 3;

  y = sectionTitle(doc, y, "Recepción del cliente");
  const recH = 20;
  box(doc, MARGIN, y, CONTENT_W * 0.68, recH);
  box(doc, MARGIN + CONTENT_W * 0.68, y, CONTENT_W * 0.32, recH);
  const recOpts = ["Aceptado completo", "Aceptado parcial", "Rechazado", "Retorno de factura"];
  recOpts.forEach((label, index) => {
    const x = MARGIN + 2 + (index % 2) * 52;
    const rowY = y + 1.8 + Math.floor(index / 2) * 5;
    checkbox(doc, x, rowY);
    doc.setFontSize(8);
    doc.text(label, x + 5, rowY + 0.4, { baseline: "top" });
  });
  doc.setLineWidth(0.3);
  doc.line(MARGIN + 2, y + 12.5, MARGIN + CONTENT_W * 0.68 - 2, y + 12.5);
  doc.setFontSize(7);
  doc.text("Motivo si es parcial o rechazado — y qué producto", MARGIN + 2, y + 13.4, {
    baseline: "top",
  });
  doc.line(MARGIN + 2, y + 18, MARGIN + 70, y + 18);
  doc.text("Nombre de quien recibe", MARGIN + 2, y + 18.2, { baseline: "top" });
  doc.setFontSize(7.5);
  doc.text("Sello y firma del cliente", MARGIN + CONTENT_W * 0.84, y + recH - 3, {
    align: "center",
    baseline: "top",
  });
  y += recH + 3;

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

  return doc;
}
