import { Workbook, type Cell } from "exceljs";

export const COMPRADOR_PRECIOS_SHEET_NAME = "Precios";

export const COMPRADOR_PRECIOS_EXCEL_FILE_NAME =
  "gestion-precios-compradores.xlsx";

export const COMPRADOR_PRECIOS_EXCEL_COLUMNS = [
  "Código de comprador",
  "Nombre del comprador",
  "Código de producto",
  "Nombre del producto",
  "Equivalencia",
  "Precio actual",
  "Precio nuevo",
] as const;

/** Equivalencia (E) y Precio nuevo (G). El resto queda bloqueado. */
export const COMPRADOR_PRECIOS_EDITABLE_COLUMN_INDEXES = [4, 6] as const;

const TEMPLATE_BLANK_ROWS = 20;

const COLOR_INK = "#111111";
const COLOR_HEADER = "#4d4d4d";
const COLOR_HEADER_TEXT = "#ffffff";
const COLOR_BORDER = "#c4c4c4";
const COLOR_ROW_EVEN = "#f3f3f3";
const COLOR_ROW_ODD = "#ffffff";
const COLOR_INPUT = "#d6d6d6";
const COLOR_INPUT_HEADER = "#111111";
const COLOR_INPUT_BORDER = "#111111";

const COLUMN_WIDTH_LIMITS = [
  { min: 18, max: 24 },
  { min: 24, max: 38 },
  { min: 16, max: 22 },
  { min: 48, max: 78 },
  { min: 20, max: 42 },
  { min: 14, max: 16 },
  { min: 14, max: 16 },
] as const;

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export interface CompradorPreciosExcelSourceRow {
  codigoComprador: string;
  nombreComprador: string;
  codigoProducto: string;
  nombreProducto: string;
  equivalencia: string;
  precioActual: number | null;
}

export interface CompradorPreciosTemplateComprador {
  idComprador: string;
  codigo: string;
  nombre: string;
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

const EMPTY_TEMPLATE_ROW: CompradorPreciosExcelSourceRow = {
  codigoComprador: "",
  nombreComprador: "",
  codigoProducto: "",
  nombreProducto: "",
  equivalencia: "",
  precioActual: null,
};

export function buildCompradorPreciosTemplateRows(input: {
  compradores: readonly CompradorPreciosTemplateComprador[];
  productos: readonly CompradorPreciosTemplateProducto[];
  aliases: readonly CompradorPreciosTemplateAlias[];
  precioListaByProductoId: Record<string, number | null | undefined>;
}): CompradorPreciosExcelSourceRow[] {
  const aliasByPair = new Map(
    input.aliases.map(
      (row) => [`${row.idComprador}::${row.idProducto}`, row] as const,
    ),
  );

  const compradores = [...input.compradores].sort((left, right) =>
    left.nombre.localeCompare(right.nombre, "es"),
  );
  const productos = [...input.productos].sort((left, right) =>
    left.codigo.localeCompare(right.codigo, "es"),
  );

  const rows: CompradorPreciosExcelSourceRow[] = [];

  for (const comprador of compradores) {
    for (const producto of productos) {
      const alias = aliasByPair.get(
        `${comprador.idComprador}::${producto.idProducto}`,
      );
      const precioLista = input.precioListaByProductoId[producto.idProducto];

      rows.push({
        codigoComprador: comprador.codigo,
        nombreComprador: comprador.nombre,
        codigoProducto: producto.codigo,
        nombreProducto: producto.nombre,
        equivalencia: alias?.equivalencia ?? "",
        precioActual:
          alias?.precioOverride ??
          (precioLista !== undefined && precioLista !== null
            ? precioLista
            : null),
      });
    }
  }

  return rows;
}

function templateDataRows(
  rows: readonly CompradorPreciosExcelSourceRow[],
): CompradorPreciosExcelSourceRow[] {
  if (rows.length > 0) return [...rows];

  return Array.from({ length: TEMPLATE_BLANK_ROWS }, () => EMPTY_TEMPLATE_ROW);
}

export function buildCompradorPreciosExcelAoA(
  rows: readonly CompradorPreciosExcelSourceRow[],
): (string | number)[][] {
  return [
    [...COMPRADOR_PRECIOS_EXCEL_COLUMNS],
    ...templateDataRows(rows).map((row) => [
      row.codigoComprador || "",
      row.nombreComprador || "",
      row.codigoProducto || "",
      row.nombreProducto || "",
      row.equivalencia || "",
      row.precioActual ?? "",
      "",
    ]),
  ];
}

export function fitExcelColumnWidth(
  values: readonly string[],
  min: number,
  max: number,
): number {
  const longest = values.reduce(
    (current, value) => Math.max(current, value.trim().length),
    0,
  );

  return Math.min(max, Math.max(min, longest + 3));
}

export function buildCompradorPreciosColumnWidths(
  rows: readonly CompradorPreciosExcelSourceRow[],
): { width: number }[] {
  const dataRows = templateDataRows(rows);

  const columns = [
    dataRows.map((row) => row.codigoComprador),
    dataRows.map((row) => row.nombreComprador),
    dataRows.map((row) => row.codigoProducto),
    dataRows.map((row) => row.nombreProducto),
    dataRows.map((row) => row.equivalencia),
    ["Precio actual"],
    ["Precio nuevo"],
  ];

  return COLUMN_WIDTH_LIMITS.map((limits, index) => ({
    width: fitExcelColumnWidth(
      [COMPRADOR_PRECIOS_EXCEL_COLUMNS[index], ...columns[index]],
      limits.min,
      limits.max,
    ),
  }));
}

function rowHeightFor(
  row: CompradorPreciosExcelSourceRow,
  productWidth: number,
  equivalenciaWidth: number,
): number {
  const productLines = Math.ceil(
    Math.max(row.nombreProducto.length, 1) / Math.max(productWidth - 1, 8),
  );
  const aliasLines = Math.ceil(
    Math.max(row.equivalencia.length, 1) / Math.max(equivalenciaWidth - 1, 8),
  );

  return Math.min(52, Math.max(22, Math.max(productLines, aliasLines) * 16));
}

function baseCell(
  isEven: boolean,
  isInput = false,
): Pick<
  CompradorPreciosExcelCell,
  | "fontFamily"
  | "fontSize"
  | "textColor"
  | "wrap"
  | "borderColor"
  | "borderStyle"
  | "backgroundColor"
  | "fontWeight"
> {
  return {
    fontFamily: "Calibri",
    fontSize: 11,
    textColor: COLOR_INK,
    wrap: true,
    borderColor: isInput ? COLOR_INPUT_BORDER : COLOR_BORDER,
    borderStyle: "thin",
    backgroundColor: isInput
      ? COLOR_INPUT
      : isEven
        ? COLOR_ROW_EVEN
        : COLOR_ROW_ODD,
    ...(isInput ? { fontWeight: "bold" as const } : {}),
  };
}

function headerCell(value: string, highlight = false): CompradorPreciosExcelCell {
  return {
    value,
    fontFamily: "Calibri",
    fontSize: 11,
    fontWeight: "bold",
    textColor: COLOR_HEADER_TEXT,
    backgroundColor: highlight ? COLOR_INPUT_HEADER : COLOR_HEADER,
    align: "center",
    wrap: true,
    height: 34,
    borderColor: highlight ? COLOR_INPUT_BORDER : COLOR_HEADER,
    borderStyle: highlight ? "medium" : "thin",
    locked: true,
  };
}

function textCell(
  value: string,
  isEven: boolean,
  height: number,
  align: "left" | "center" = "left",
  locked = true,
): CompradorPreciosExcelCell {
  return {
    ...baseCell(isEven),
    value: value || null,
    format: "@",
    align,
    height,
    locked,
  };
}

function priceCell(
  value: number | null,
  isEven: boolean,
  height: number,
  isInput = false,
  locked = true,
): CompradorPreciosExcelCell {
  return {
    ...baseCell(isEven, isInput),
    value: value ?? null,
    format: "#,##0.00",
    align: "center",
    height,
    locked,
  };
}

export function buildCompradorPreciosSheetData(
  rows: readonly CompradorPreciosExcelSourceRow[],
): CompradorPreciosSheetData {
  const dataRows = templateDataRows(rows);
  const columns = buildCompradorPreciosColumnWidths(rows);
  const productWidth = columns[3]?.width ?? 48;
  const equivalenciaWidth = columns[4]?.width ?? 20;

  const header = COMPRADOR_PRECIOS_EXCEL_COLUMNS.map((title) =>
    headerCell(title, title === "Precio nuevo"),
  );

  const body = dataRows.map((row, index) => {
    const isEven = index % 2 === 1;
    const height = rowHeightFor(row, productWidth, equivalenciaWidth);

    return [
      textCell(row.codigoComprador, isEven, height, "center"),
      textCell(row.nombreComprador, isEven, height),
      textCell(row.codigoProducto, isEven, height, "center"),
      textCell(row.nombreProducto, isEven, height),
      textCell(row.equivalencia, isEven, height, "left", false),
      priceCell(row.precioActual, isEven, height),
      priceCell(null, isEven, height, true, false),
    ];
  });

  return [header, ...body];
}

function hexToArgb(hex: string): string {
  return `FF${hex.replace("#", "").toUpperCase()}`;
}

function applyExcelCell(cell: Cell, style: CompradorPreciosExcelCell): void {
  cell.value = style.value;
  cell.font = {
    name: style.fontFamily,
    size: style.fontSize,
    bold: style.fontWeight === "bold",
    color: { argb: hexToArgb(style.textColor) },
  };
  cell.alignment = {
    horizontal: style.align,
    vertical: "middle",
    wrapText: style.wrap,
  };
  cell.border = {
    top: {
      style: style.borderStyle,
      color: { argb: hexToArgb(style.borderColor) },
    },
    left: {
      style: style.borderStyle,
      color: { argb: hexToArgb(style.borderColor) },
    },
    bottom: {
      style: style.borderStyle,
      color: { argb: hexToArgb(style.borderColor) },
    },
    right: {
      style: style.borderStyle,
      color: { argb: hexToArgb(style.borderColor) },
    },
  };
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: hexToArgb(style.backgroundColor) },
  };
  cell.protection = { locked: style.locked };

  if (style.format) {
    cell.numFmt = style.format;
  }
}

export async function buildCompradorPreciosWorkbook(
  rows: readonly CompradorPreciosExcelSourceRow[],
): Promise<Workbook> {
  const sheetData = buildCompradorPreciosSheetData(rows);
  const widths = buildCompradorPreciosColumnWidths(rows);
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet(COMPRADOR_PRECIOS_SHEET_NAME, {
    views: [
      {
        state: "frozen",
        ySplit: 1,
        showGridLines: false,
      },
    ],
    pageSetup: {
      orientation: "landscape",
      paperSize: 9,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });

  worksheet.columns = widths.map((column) => ({ width: column.width }));

  sheetData.forEach((rowCells, rowIndex) => {
    const excelRow = worksheet.getRow(rowIndex + 1);
    excelRow.height = rowCells[0]?.height ?? 22;

    rowCells.forEach((style, columnIndex) => {
      applyExcelCell(excelRow.getCell(columnIndex + 1), style);
    });

    excelRow.commit();
  });

  await worksheet.protect("", {
    selectLockedCells: true,
    selectUnlockedCells: true,
  });

  return workbook;
}

export async function downloadCompradorPreciosExcelTemplate(
  rows: readonly CompradorPreciosExcelSourceRow[],
): Promise<void> {
  const workbook = await buildCompradorPreciosWorkbook(rows);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([new Uint8Array(buffer as ArrayBuffer)], {
    type: XLSX_MIME,
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = COMPRADOR_PRECIOS_EXCEL_FILE_NAME;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
