import { Workbook, type Cell } from "exceljs";
import { aliasPrincipalPorPar } from "./comprador-alias-reglas";

export const COMPRADOR_PRECIOS_SHEET_NAME = "Precios";

export const COMPRADOR_PRECIOS_EXCEL_FILE_NAME =
  "gestion-precios-compradores.xlsx";

/** Una fila por comprador × producto. */
export const COMPRADOR_PRECIOS_EXCEL_COLUMNS = [
  "Grupo perteneciente",
  "Código del comprador",
  "Comprador",
  "Código de producto",
  "Nombre del producto",
  "Equivalencia",
  "Precio actual",
  "Precio nuevo",
] as const;

/** Equivalencia (F) y Precio nuevo (H). El resto queda bloqueado. */
export const COMPRADOR_PRECIOS_EDITABLE_COLUMN_INDEXES = [5, 7] as const;

export const TEMPLATE_BLANK_ROWS = 20;

export const COLOR_INK = "#111111";
export const COLOR_HEADER = "#4d4d4d";
export const COLOR_HEADER_TEXT = "#ffffff";
export const COLOR_BORDER = "#c4c4c4";
export const COLOR_ROW_EVEN = "#f3f3f3";
export const COLOR_ROW_ODD = "#ffffff";
export const COLOR_INPUT_BG = "#d9d9d9";
export const COLOR_INPUT_TEXT = "#6b6b6b";
export const COLOR_INPUT_HEADER = "#111111";
export const COLOR_INPUT_BORDER = "#111111";
/** Verde suave al modificar precio nuevo. */
export const COLOR_MODIFIED_BG = "#6bcf8e";
export const COLOR_MODIFIED_TEXT = "#ffffff";

export const COLUMN_WIDTH_LIMITS = [
  { min: 18, max: 28 },
  { min: 16, max: 22 },
  { min: 18, max: 36 },
  { min: 16, max: 22 },
  { min: 40, max: 90 },
  { min: 18, max: 42 },
  { min: 14, max: 16 },
  { min: 14, max: 16 },
] as const;

export const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Formato pesos mexicanos: 2 decimales (ej. $50.00). */
export const PRICE_NUM_FMT = "$#,##0.00";

/** Precio por defecto cuando el producto/comprador no tiene precio. */
export const COMPRADOR_PRECIOS_DEFAULT_PRECIO = 50;

export interface CompradorPreciosExcelSourceRow {
  grupo: string;
  codigoComprador: string;
  nombreComprador: string;
  codigoProducto: string;
  nombreProducto: string;
  equivalencia: string;
  /** Precio de lista / actual de catálogo. */
  precioActual: number | null;
  /** Precio importado / override del comprador. */
  precioNuevo: number | null;
}

export type CompradorPreciosExcelVariant = "template" | "print";

export interface CompradorPreciosTemplateComprador {
  idComprador: string;
  codigo: string;
  nombre: string;
  grupo: string;
}

export interface CompradorPreciosTemplateProducto {
  idProducto: string;
  codigo: string;
  nombre: string;
}

export interface CompradorPreciosTemplateAlias {
  idComprador: string;
  idProducto: string;
  equivalencia: string;
  precioOverride: number | null;
}

export interface CompradorPreciosExcelCell {
  value: string | number | null;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  fontSize: number;
  fontWeight?: "bold";
  align: "left" | "center";
  wrap: boolean;
  borderColor: string;
  borderStyle: "thin" | "medium";
  height: number;
  format?: string;
  locked: boolean;
}

export type CompradorPreciosSheetData = CompradorPreciosExcelCell[][];

export interface CompradorPreciosExportFilters {
  /** Si vacío/omitido, no filtra por grupo (salvo que haya otros filtros). */
  grupos?: readonly string[];
  /** Si vacío/omitido, incluye todos los productos. */
  idProductos?: readonly string[];
  /** Periodo del cambio de precios (solo metadato / nombre de archivo). */
  fechaInicio?: string;
  fechaFin?: string;
  /** @deprecated Preferir `codigosComprador`. */
  codigoComprador?: string;
  /** Códigos de comprador adicionales (unión con grupos). */
  codigosComprador?: readonly string[];
}

export const EMPTY_TEMPLATE_ROW: CompradorPreciosExcelSourceRow = {
  grupo: "",
  codigoComprador: "",
  nombreComprador: "",
  codigoProducto: "",
  nombreProducto: "",
  equivalencia: "",
  precioActual: null,
  precioNuevo: null,
};
