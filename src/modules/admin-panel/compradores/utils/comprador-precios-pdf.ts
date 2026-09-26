import { jsPDF } from "jspdf";
import { formatPrecioEs } from "@/lib/utils/decimal-es";
import type { CompradorPreciosExcelSourceRow } from "./comprador-precios-excel";

/** Carta vertical: misma plantilla base que la OV (sin QR). */
const PAGE_W = 215.9;
const PAGE_H = 279.4;
const MARGIN = 8;
const CONTENT_W = PAGE_W - MARGIN * 2;
const PAGE_BOTTOM = PAGE_H - MARGIN;

const COLS = [
  { key: "codigo", label: "Código", w: 24 },
  { key: "producto", label: "Producto", w: 78 },
  { key: "equivalencia", label: "Equivalencia", w: 62 },
  { key: "precio", label: "Precio", w: CONTENT_W - 24 - 78 - 62 },
] as const;

const HEADER_H = 7;
const ROW_MIN_H = 7.5;
const ROW_PAD_Y = 1.4;

export type CompradorPreciosPrintScope =
  | { mode: "todos" }
  | { mode: "one"; codigoComprador: string };

function box(
  doc: jsPDF,
  posX: number,
  y: number,
  w: number,
  h: number,
  lineWidth = 0.35,
) {
  doc.setDrawColor(0);
  doc.setFillColor(255, 255, 255);
  doc.setLineWidth(lineWidth);
  doc.rect(posX, y, w, h, "S");
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed <= PAGE_BOTTOM) return y;
  doc.addPage([PAGE_W, PAGE_H], "portrait");
  return MARGIN;
}

function formatImpresa(date = new Date()): string {
  return date.toLocaleString("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function writePageNumbers(doc: jsPDF, scopeLabel: string, impresa: string) {
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(80);
    doc.text(
      `${scopeLabel}  ·  Hoja ${page} de ${total}  ·  Impresa ${impresa}`,
      MARGIN,
      PAGE_H - 4,
      { baseline: "bottom" },
    );
    doc.setTextColor(0);
  }
}

function measureWrapped(
  doc: jsPDF,
  value: string,
  maxW: number,
  fontSize: number,
): string[] {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(fontSize);
  const wrapped = doc.splitTextToSize(value.trim() || "—", maxW);
  return (Array.isArray(wrapped) ? wrapped : [wrapped]).slice(0, 3);
}

function rowHeightForLines(lineCount: number): number {
  const lineH = 3.1;
  return Math.max(ROW_MIN_H, ROW_PAD_Y * 2 + lineCount * lineH);
}

function drawTableHeader(doc: jsPDF, y: number): number {
  box(doc, MARGIN, y, CONTENT_W, HEADER_H, 0.5);
  doc.setFillColor(240, 240, 240);
  doc.rect(MARGIN, y, CONTENT_W, HEADER_H, "F");
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(MARGIN, y, CONTENT_W, HEADER_H, "S");

  let cursorX = MARGIN;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  for (let i = 0; i < COLS.length; i += 1) {
    const col = COLS[i]!;
    const align = col.key === "precio" ? "right" : "left";
    const textX = align === "right" ? cursorX + col.w - 1.6 : cursorX + 1.6;
    doc.text(col.label, textX, y + HEADER_H / 2, {
      align,
      baseline: "middle",
    });
    cursorX += col.w;
    if (i < COLS.length - 1) {
      doc.line(cursorX, y, cursorX, y + HEADER_H);
    }
  }
  return y + HEADER_H;
}

function drawDataRow(
  doc: jsPDF,
  y: number,
  row: CompradorPreciosExcelSourceRow,
): number {
  const values = [
    row.codigoProducto || "—",
    row.nombreProducto || "—",
    row.equivalencia?.trim() || "—",
    row.precioActual == null ? "—" : formatPrecioEs(row.precioActual),
  ];

  const lineSets = values.map((value, index) =>
    measureWrapped(doc, value, COLS[index]!.w - 3.2, 7),
  );
  const h = rowHeightForLines(
    Math.max(...lineSets.map((lines) => lines.length), 1),
  );

  box(doc, MARGIN, y, CONTENT_W, h);
  let cursorX = MARGIN;
  for (let i = 0; i < COLS.length; i += 1) {
    const col = COLS[i]!;
    const lines = lineSets[i]!;
    const align = col.key === "precio" ? "right" : "left";
    const textX = align === "right" ? cursorX + col.w - 1.6 : cursorX + 1.6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(lines, textX, y + ROW_PAD_Y, {
      align,
      baseline: "top",
      lineHeightFactor: 1.05,
    });
    cursorX += col.w;
    if (i < COLS.length - 1) {
      doc.line(cursorX, y, cursorX, y + h);
    }
  }
  return y + h;
}

function groupRowsByComprador(
  rows: readonly CompradorPreciosExcelSourceRow[],
): Array<{
  codigo: string;
  nombre: string;
  rows: CompradorPreciosExcelSourceRow[];
}> {
  const groups = new Map<
    string,
    { codigo: string; nombre: string; rows: CompradorPreciosExcelSourceRow[] }
  >();

  for (const row of rows) {
    const codigo = row.codigoComprador.trim();
    if (!codigo) continue;
    const existing = groups.get(codigo);
    if (existing) {
      existing.rows.push(row);
      continue;
    }
    groups.set(codigo, {
      codigo,
      nombre: row.nombreComprador.trim() || codigo,
      rows: [row],
    });
  }

  return [...groups.values()].sort((left, right) =>
    left.nombre.localeCompare(right.nombre, "es"),
  );
}

function filterRowsForScope(
  rows: readonly CompradorPreciosExcelSourceRow[],
  scope: CompradorPreciosPrintScope,
): CompradorPreciosExcelSourceRow[] {
  if (scope.mode === "todos") {
    return rows.filter((row) => row.codigoComprador.trim());
  }
  const codigo = scope.codigoComprador.trim().toLowerCase();
  return rows.filter(
    (row) => row.codigoComprador.trim().toLowerCase() === codigo,
  );
}

function scopeFooterLabel(
  scope: CompradorPreciosPrintScope,
  filtered: readonly CompradorPreciosExcelSourceRow[],
): string {
  if (scope.mode === "todos") return "Lista de precios · Todos";
  const first = filtered[0];
  const codigo = scope.codigoComprador.trim();
  const nombre = first?.nombreComprador?.trim();
  return nombre ? `Lista de precios · ${codigo} — ${nombre}` : `Lista de precios · ${codigo}`;
}

/** PDF de lista de precios (plantilla OV, sin QR). */
export function buildCompradorPreciosPdf(input: {
  rows: readonly CompradorPreciosExcelSourceRow[];
  scope: CompradorPreciosPrintScope;
  impresaAt?: Date;
}): jsPDF {
  const filtered = filterRowsForScope(input.rows, input.scope);
  const groups = groupRowsByComprador(filtered);
  const impresa = formatImpresa(input.impresaAt);
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [PAGE_W, PAGE_H],
  });

  let y = MARGIN;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("LISTA DE PRECIOS", MARGIN, y, { baseline: "top" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(headerScopeLabel(input.scope, groups), MARGIN + CONTENT_W, y + 1, {
    align: "right",
    baseline: "top",
  });

  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Impresa: ${impresa}`, MARGIN, y, { baseline: "top" });

  y += 6;
  doc.setLineWidth(0.7);
  doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
  y += 4;

  if (groups.length === 0) {
    y = ensureSpace(doc, y, 20);
    box(doc, MARGIN, y, CONTENT_W, 16, 0.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      "No hay filas para imprimir con el alcance seleccionado.",
      MARGIN + 3,
      y + 8,
      { baseline: "middle" },
    );
    writePageNumbers(doc, scopeFooterLabel(input.scope, filtered), impresa);
    return doc;
  }

  for (const group of groups) {
    y = ensureSpace(doc, y, 18 + HEADER_H + ROW_MIN_H);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`${group.codigo} — ${group.nombre}`, MARGIN, y, {
      baseline: "top",
    });
    y += 5;
    doc.setLineWidth(0.45);
    doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
    y += 2.5;

    y = drawTableHeader(doc, y);

    for (const row of group.rows) {
      const previewLines = Math.max(
        measureWrapped(doc, row.nombreProducto || "—", COLS[1]!.w - 3.2, 7)
          .length,
        measureWrapped(doc, row.equivalencia || "—", COLS[2]!.w - 3.2, 7)
          .length,
        1,
      );
      const needed = rowHeightForLines(previewLines);
      const nextY = ensureSpace(doc, y, needed + 0.5);
      if (nextY !== y) {
        y = nextY;
        y = drawTableHeader(doc, y);
      }
      y = drawDataRow(doc, y, row);
    }

    y += 5;
  }

  writePageNumbers(doc, scopeFooterLabel(input.scope, filtered), impresa);
  return doc;
}

function headerScopeLabel(
  printScope: CompradorPreciosPrintScope,
  groups: readonly { codigo: string; nombre: string }[],
): string {
  if (printScope.mode === "todos") {
    return groups.length <= 1
      ? "Todos los compradores"
      : `${groups.length} compradores`;
  }
  const group = groups[0];
  return group
    ? `${group.codigo} — ${group.nombre}`
    : printScope.codigoComprador;
}

function sanitizePdfFilename(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-|-$/g, "");
  return cleaned || "lista-precios";
}

export function buildCompradorPreciosPdfFilename(
  scope: CompradorPreciosPrintScope,
): string {
  if (scope.mode === "todos") return "lista-precios-todos.pdf";
  return `lista-precios-${sanitizePdfFilename(scope.codigoComprador)}.pdf`;
}

export async function downloadCompradorPreciosPdf(input: {
  rows: readonly CompradorPreciosExcelSourceRow[];
  scope: CompradorPreciosPrintScope;
}): Promise<void> {
  const pdf = buildCompradorPreciosPdf(input);
  pdf.save(buildCompradorPreciosPdfFilename(input.scope));
}
