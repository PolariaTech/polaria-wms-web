import { Workbook } from "exceljs";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  COMPRADOR_PRECIOS_EXCEL_COLUMNS,
  COMPRADOR_PRECIOS_SHEET_NAME,
} from "./comprador-precios-excel";

export interface CompradorPreciosExcelImportRow {
  rowNumber: number;
  grupo: string;
  codigoComprador: string;
  nombreComprador: string;
  codigoProducto: string;
  nombreProducto: string;
  equivalencia: string;
  precioActual: number | null;
  precioNuevo: number | null;
  hasPrecioNuevo: boolean;
}

export interface CompradorPreciosExcelParseResult {
  rows: CompradorPreciosExcelImportRow[];
  errors: string[];
  skipped: number;
}

/** Filas a mostrar en la vista previa antes de confirmar la importación. */
export const COMPRADOR_PRECIOS_IMPORT_PREVIEW_LIMIT = 12;

export interface CompradorPreciosImportPlanCreate {
  rowNumber: number;
  idComprador: string;
  idProducto: string;
  alias: string;
  precio: number | null;
}

export interface CompradorPreciosImportPlanUpdate {
  rowNumber: number;
  idAlias: string;
  alias?: string;
  precio?: number | null;
}

export interface CompradorPreciosImportPlan {
  creates: CompradorPreciosImportPlanCreate[];
  updates: CompradorPreciosImportPlanUpdate[];
  skipped: number;
  errors: string[];
}

function normalizeHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function excelCellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    const record = value as {
      text?: unknown;
      result?: unknown;
      richText?: { text?: string }[];
    };
    if (typeof record.text === "string") return record.text.trim();
    if (Array.isArray(record.richText)) {
      return record.richText.map((part) => part.text ?? "").join("").trim();
    }
    if ("result" in record) return excelCellText(record.result);
  }
  return String(value).trim();
}

function parsePrecioNuevo(
  value: unknown,
): { ok: true; present: boolean; value: number | null } | { ok: false } {
  if (value === null || value === undefined || value === "") {
    return { ok: true, present: false, value: null };
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return { ok: false };
    return { ok: true, present: true, value };
  }

  const text = excelCellText(value).replace(/\s/g, "").replace(",", ".");
  if (!text) return { ok: true, present: false, value: null };

  if (!/^-?\d+(\.\d+)?$/.test(text)) return { ok: false };

  const parsed = Number.parseFloat(text);
  if (!Number.isFinite(parsed)) return { ok: false };
  return { ok: true, present: true, value: parsed };
}

function expectedHeaders(): string[] {
  return COMPRADOR_PRECIOS_EXCEL_COLUMNS.map((title) => normalizeHeader(title));
}

export async function parseCompradorPreciosExcelBuffer(
  buffer: ArrayBuffer,
): Promise<CompradorPreciosExcelParseResult> {
  const workbook = new Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet =
    workbook.getWorksheet(COMPRADOR_PRECIOS_SHEET_NAME) ??
    workbook.worksheets[0];

  if (!worksheet) {
    throw new DomainServiceError(
      "El archivo no contiene una hoja de precios.",
      "INVALID_ARGUMENT",
    );
  }

  const headerRow = worksheet.getRow(1);
  const actualHeaders = COMPRADOR_PRECIOS_EXCEL_COLUMNS.map((_, index) =>
    normalizeHeader(excelCellText(headerRow.getCell(index + 1).value)),
  );

  if (actualHeaders.join("|") !== expectedHeaders().join("|")) {
    throw new DomainServiceError(
      "El archivo no tiene la plantilla de precios esperada.",
      "INVALID_ARGUMENT",
    );
  }

  const rows: CompradorPreciosExcelImportRow[] = [];
  const errors: string[] = [];
  let skipped = 0;

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;

    const grupo = excelCellText(row.getCell(1).value);
    const codigoComprador = excelCellText(row.getCell(2).value);
    const nombreComprador = excelCellText(row.getCell(3).value);
    const codigoProducto = excelCellText(row.getCell(4).value);
    const nombreProducto = excelCellText(row.getCell(5).value);
    const equivalencia = excelCellText(row.getCell(6).value);
    const precioActualParsed = parsePrecioNuevo(row.getCell(7).value);
    const precioParsed = parsePrecioNuevo(row.getCell(8).value);

    if (
      !grupo &&
      !codigoComprador &&
      !codigoProducto &&
      !equivalencia &&
      !precioParsed.present
    ) {
      skipped += 1;
      return;
    }

    if (!grupo || !codigoComprador || !codigoProducto) {
      errors.push(
        `Fila ${rowNumber}: falta grupo, código de comprador o código de producto.`,
      );
      return;
    }

    if (!precioParsed.ok) {
      errors.push(
        `Fila ${rowNumber}: el precio nuevo no es válido (solo números en pesos).`,
      );
      return;
    }

    if (!precioActualParsed.ok) {
      errors.push(`Fila ${rowNumber}: el precio actual no es válido.`);
      return;
    }

    if (
      precioParsed.present &&
      precioParsed.value != null &&
      precioParsed.value < 0
    ) {
      errors.push(`Fila ${rowNumber}: el precio nuevo no puede ser negativo.`);
      return;
    }

    const precioSinCambio =
      precioParsed.present &&
      precioActualParsed.present &&
      precioParsed.value === precioActualParsed.value;

    rows.push({
      rowNumber,
      grupo,
      codigoComprador,
      nombreComprador,
      codigoProducto,
      nombreProducto,
      equivalencia,
      precioActual: precioActualParsed.value,
      precioNuevo: precioParsed.value,
      hasPrecioNuevo: precioParsed.present && !precioSinCambio,
    });
  });

  return { rows, errors, skipped };
}

export async function parseCompradorPreciosExcelFile(
  file: File,
): Promise<CompradorPreciosExcelParseResult> {
  return parseCompradorPreciosExcelBuffer(await file.arrayBuffer());
}

export function takeCompradorPreciosImportPreview(
  rows: readonly CompradorPreciosExcelImportRow[],
  limit = COMPRADOR_PRECIOS_IMPORT_PREVIEW_LIMIT,
): CompradorPreciosExcelImportRow[] {
  return rows.slice(0, Math.max(1, limit));
}

export function planCompradorPreciosImport(input: {
  rows: readonly CompradorPreciosExcelImportRow[];
  parseErrors?: readonly string[];
  parseSkipped?: number;
  compradores: readonly {
    idComprador: string;
    codigo: string;
    grupo: string;
  }[];
  productos: readonly { idProducto: string; codigo: string; nombre?: string }[];
  aliases: readonly {
    idAlias: string;
    idComprador: string;
    idProducto: string;
    alias: string;
    precioOverride: number | null;
  }[];
}): CompradorPreciosImportPlan {
  const errors = [...(input.parseErrors ?? [])];
  let skipped = input.parseSkipped ?? 0;

  const compradorByCodigo = new Map(
    input.compradores.map(
      (row) => [row.codigo.trim().toLowerCase(), row] as const,
    ),
  );
  const productoByCodigo = new Map(
    input.productos.map(
      (row) => [row.codigo.trim().toLowerCase(), row] as const,
    ),
  );
  const aliasByPair = new Map(
    input.aliases.map(
      (row) => [`${row.idComprador}::${row.idProducto}`, row] as const,
    ),
  );

  const latestByPair = new Map<string, CompradorPreciosExcelImportRow>();
  for (const row of input.rows) {
    latestByPair.set(
      `${row.codigoComprador.trim().toLowerCase()}::${row.codigoProducto.trim().toLowerCase()}`,
      row,
    );
  }

  const creates: CompradorPreciosImportPlanCreate[] = [];
  const updates: CompradorPreciosImportPlanUpdate[] = [];

  for (const row of latestByPair.values()) {
    const comprador = compradorByCodigo.get(
      row.codigoComprador.trim().toLowerCase(),
    );
    const producto = productoByCodigo.get(
      row.codigoProducto.trim().toLowerCase(),
    );

    if (!comprador) {
      errors.push(
        `Fila ${row.rowNumber}: no se encontró el comprador ${row.codigoComprador}.`,
      );
      continue;
    }

    if (!producto) {
      errors.push(
        `Fila ${row.rowNumber}: no se encontró el producto ${row.codigoProducto}.`,
      );
      continue;
    }

    if (!row.equivalencia && !row.hasPrecioNuevo) {
      skipped += 1;
      continue;
    }

    const existing = aliasByPair.get(
      `${comprador.idComprador}::${producto.idProducto}`,
    );

    if (!existing) {
      creates.push({
        rowNumber: row.rowNumber,
        idComprador: comprador.idComprador,
        idProducto: producto.idProducto,
        alias: row.equivalencia,
        precio: row.hasPrecioNuevo ? row.precioNuevo : null,
      });
      continue;
    }

    const nextAlias = row.equivalencia;
    const nextPrecio = row.hasPrecioNuevo ? row.precioNuevo : undefined;
    const aliasUnchanged = nextAlias === existing.alias;
    const precioUnchanged =
      nextPrecio === undefined || nextPrecio === existing.precioOverride;

    if (aliasUnchanged && precioUnchanged) {
      skipped += 1;
      continue;
    }

    const update: CompradorPreciosImportPlanUpdate = {
      rowNumber: row.rowNumber,
      idAlias: existing.idAlias,
    };
    if (!aliasUnchanged) update.alias = nextAlias;
    if (!precioUnchanged) update.precio = nextPrecio ?? null;
    updates.push(update);
  }

  return { creates, updates, skipped, errors };
}
