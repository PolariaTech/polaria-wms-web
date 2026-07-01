import * as XLSX from "xlsx";
import { generateCodigoCuentaFromNombre } from "@/lib/generate-codigo-cuenta";
import {
  CATALOGO_ESTADO_DEFAULT,
  CATALOGO_TIPO_PRIMARIO,
  CATALOGO_TIPO_SECUNDARIO,
  createEmptyCatalogoMetadatos,
  type CatalogoProductoMetadatos,
} from "../constants/catalogo-producto";

export interface CatalogoExcelImportRow {
  sku: string;
  titulo: string;
  tipo: "primario" | "secundario";
  skuPrimario?: string;
  unidadVisualizacion: string;
  metadatos: CatalogoProductoMetadatos;
}

export interface CatalogoExcelParseResult {
  rows: CatalogoExcelImportRow[];
  errors: string[];
  skipped: number;
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

function cellValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function parseSiNo(value: string): boolean | undefined {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  if (["si", "sí", "yes", "true", "1"].includes(normalized)) return true;
  if (["no", "false", "0"].includes(normalized)) return false;
  return undefined;
}

function resolveTipoRegistro(value: string): "primario" | "secundario" {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("secund")) return "secundario";
  return "primario";
}

function resolveHeaderKey(header: string): string | null {
  const key = normalizeHeader(header);

  if (key === "sku") return "sku";
  if (["titulo", "title"].includes(key)) return "titulo";
  if (key === "slug") return "slug";
  if (["descripcion", "description"].includes(key)) return "descripcion";
  if (["proveedor", "provider", "vendor"].includes(key)) return "proveedor";
  if (["categoria", "category"].includes(key)) return "categoria";
  if (["tipo", "type", "producttype", "product type"].includes(key)) {
    return "tipo";
  }
  if (["etiquetas", "tags"].includes(key)) return "etiquetas";
  if (["publicado", "published", "publishedonline"].includes(key)) {
    return "publicado";
  }
  if (["estado", "status"].includes(key)) return "estado";
  if (["codigo", "code"].includes(key)) return "codigo";
  if (["cod barras", "codigo barras", "barcode"].includes(key)) {
    return "codigoBarras";
  }
  if (["nombre op 1", "nombre opcion 1", "optionname1", "option name 1"].includes(key)) {
    return "nombreOpcion1";
  }
  if (["valor op 1", "valor opcion 1", "optionvalue1", "option value 1"].includes(key)) {
    return "valorOpcion1";
  }
  if (["vinculado", "linkedoption1", "sku primario", "primario", "incluido primario"].includes(key)) {
    return "skuPrimario";
  }
  if (["precio", "price"].includes(key)) return "precio";
  if (["impuesto", "tax", "chargetax"].includes(key)) return "impuesto";
  if (["tracker inv", "tracker inventario", "inventory tracker", "inventorytracker"].includes(key)) {
    return "rastreadorInventario";
  }
  if (["stock", "cantidad inventario", "inventoryqty", "inventory qty"].includes(key)) {
    return "cantidadInventario";
  }
  if (["unidad visualizacion", "unidad"].includes(key)) {
    return "unidadVisualizacion";
  }

  return null;
}

function mapRawRecord(record: Record<string, unknown>): Record<string, string> {
  const mapped: Record<string, string> = {};

  for (const [header, value] of Object.entries(record)) {
    const field = resolveHeaderKey(header);
    if (!field) continue;
    mapped[field] = cellValue(value);
  }

  return mapped;
}

function isRowEmpty(mapped: Record<string, string>): boolean {
  return Object.values(mapped).every((value) => !value.trim());
}

function validateRequiredFrioFields(
  mapped: Record<string, string>,
  lineNumber: number,
): string | null {
  const missing: string[] = [];

  if (!mapped.titulo?.trim()) missing.push("title");
  if (!mapped.descripcion?.trim()) missing.push("description");
  if (!mapped.proveedor?.trim()) missing.push("provider");
  if (!mapped.categoria?.trim()) missing.push("category");
  if (!mapped.tipo?.trim()) missing.push("productType");
  if (!mapped.estado?.trim()) missing.push("status");
  if (!mapped.precio?.trim()) missing.push("precio");

  if (!missing.length) {
    return null;
  }

  return `Fila ${lineNumber}: faltan campos obligatorios (${missing.join(", ")}).`;
}

function mapRecordToRow(
  record: Record<string, unknown>,
  lineNumber: number,
): { row?: CatalogoExcelImportRow; error?: string; skip?: boolean } {
  const mapped = mapRawRecord(record);

  if (isRowEmpty(mapped)) {
    return { skip: true };
  }

  const requiredError = validateRequiredFrioFields(mapped, lineNumber);
  if (requiredError) {
    return { error: requiredError };
  }

  const titulo = mapped.titulo.trim();
  const descripcion = mapped.descripcion.trim();
  const tipo = resolveTipoRegistro(mapped.tipo);
  const sku =
    mapped.sku?.trim() ||
    generateCodigoCuentaFromNombre(titulo) ||
    `SKU-${lineNumber}`;

  if (tipo === "secundario" && !mapped.skuPrimario?.trim()) {
    return {
      error: `Fila ${lineNumber}: el secundario "${sku}" requiere SKU primario en columna Vinculado.`,
    };
  }

  const publicado = parseSiNo(mapped.publicado ?? "");
  const impuesto = parseSiNo(mapped.impuesto ?? "");
  const unidadVisualizacion =
    mapped.unidadVisualizacion?.toLowerCase() === "peso" ? "peso" : "cantidad";

  const metadatos: CatalogoProductoMetadatos = {
    ...createEmptyCatalogoMetadatos(),
    titulo,
    slug: mapped.slug || undefined,
    descripcion,
    proveedor: mapped.proveedor,
    categoria: mapped.categoria,
    tipo: tipo === "secundario" ? CATALOGO_TIPO_SECUNDARIO : CATALOGO_TIPO_PRIMARIO,
    etiquetas: mapped.etiquetas || undefined,
    estado: mapped.estado || CATALOGO_ESTADO_DEFAULT,
    codigoBarras: mapped.codigoBarras || undefined,
    nombreOpcion1: mapped.nombreOpcion1 || undefined,
    valorOpcion1: mapped.valorOpcion1 || undefined,
    vinculadoOpcion1: mapped.skuPrimario || undefined,
    precio: mapped.precio,
    rastreadorInventario: mapped.rastreadorInventario || undefined,
    cantidadInventario: mapped.cantidadInventario || undefined,
    ...(publicado !== undefined ? { publicadoTienda: publicado } : {}),
    ...(impuesto !== undefined ? { cobrarImpuesto: impuesto } : {}),
  };

  return {
    row: {
      sku,
      titulo,
      tipo,
      skuPrimario: mapped.skuPrimario || undefined,
      unidadVisualizacion,
      metadatos,
    },
  };
}

/** Parsea la primera hoja de un Excel/CSV alineado al reporte frio. */
export async function parseCatalogoSpreadsheetFile(
  file: File,
): Promise<CatalogoExcelParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    return { rows: [], errors: ["El archivo no tiene hojas."], skipped: 0 };
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  const rows: CatalogoExcelImportRow[] = [];
  const errors: string[] = [];
  let skipped = 0;

  rawRows.forEach((record, index) => {
    const result = mapRecordToRow(record, index + 2);

    if (result.skip) {
      return;
    }

    if (result.error) {
      errors.push(result.error);
      skipped += 1;
      return;
    }

    if (result.row) {
      rows.push(result.row);
    }
  });

  if (!rows.length && !errors.length) {
    errors.push(
      "No se encontraron filas válidas. Campos obligatorios: title, description, provider, category, productType, status, precio.",
    );
  }

  return { rows, errors, skipped };
}
