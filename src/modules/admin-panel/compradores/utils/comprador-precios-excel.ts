import { Workbook, type Cell } from "exceljs";

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

const TEMPLATE_BLANK_ROWS = 20;

const COLOR_INK = "#111111";
const COLOR_HEADER = "#4d4d4d";
const COLOR_HEADER_TEXT = "#ffffff";
const COLOR_BORDER = "#c4c4c4";
const COLOR_ROW_EVEN = "#f3f3f3";
const COLOR_ROW_ODD = "#ffffff";
const COLOR_INPUT_BG = "#d9d9d9";
const COLOR_INPUT_TEXT = "#6b6b6b";
const COLOR_INPUT_HEADER = "#111111";
const COLOR_INPUT_BORDER = "#111111";
/** Verde suave al modificar precio nuevo. */
const COLOR_MODIFIED_BG = "#6bcf8e";
const COLOR_MODIFIED_TEXT = "#ffffff";

const COLUMN_WIDTH_LIMITS = [
  { min: 18, max: 28 },
  { min: 16, max: 22 },
  { min: 18, max: 36 },
  { min: 16, max: 22 },
  { min: 40, max: 90 },
  { min: 18, max: 42 },
  { min: 14, max: 16 },
  { min: 14, max: 16 },
] as const;

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Formato pesos mexicanos: 2 decimales (ej. $50.00). */
const PRICE_NUM_FMT = "$#,##0.00";

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

const EMPTY_TEMPLATE_ROW: CompradorPreciosExcelSourceRow = {
  grupo: "",
  codigoComprador: "",
  nombreComprador: "",
  codigoProducto: "",
  nombreProducto: "",
  equivalencia: "",
  precioActual: null,
  precioNuevo: null,
};

function normalizeGrupo(value: string): string {
  return value.trim();
}

/** Precio a mostrar/exportar: usa el actual o 50 si no hay. */
export function resolveCompradorPrecioExcel(
  precioActual: number | null | undefined,
): number {
  if (precioActual == null || !Number.isFinite(precioActual)) {
    return COMPRADOR_PRECIOS_DEFAULT_PRECIO;
  }
  return precioActual;
}

/** Precio vigente efectivo (override importado o lista). */
export function resolveCompradorPrecioVigente(row: {
  precioActual: number | null;
  precioNuevo: number | null;
}): number {
  if (row.precioNuevo != null && Number.isFinite(row.precioNuevo)) {
    return row.precioNuevo;
  }
  return resolveCompradorPrecioExcel(row.precioActual);
}

export function resolveCompradorPrecioNuevoPrint(
  precioNuevo: number | null | undefined,
): number {
  if (precioNuevo == null || !Number.isFinite(precioNuevo)) {
    return COMPRADOR_PRECIOS_DEFAULT_PRECIO;
  }
  return precioNuevo;
}

function pricesForVariant(
  row: CompradorPreciosExcelSourceRow,
  variant: CompradorPreciosExcelVariant,
): { actual: number; nuevo: number } {
  if (variant === "print") {
    return {
      actual: resolveCompradorPrecioExcel(row.precioActual),
      nuevo: resolveCompradorPrecioNuevoPrint(row.precioNuevo),
    };
  }

  const vigente = resolveCompradorPrecioVigente(row);
  return { actual: vigente, nuevo: vigente };
}

/** Matriz comprador × producto. */
export function buildCompradorPreciosTemplateRows(input: {
  compradores: readonly CompradorPreciosTemplateComprador[];
  productos: readonly CompradorPreciosTemplateProducto[];
  aliases: readonly CompradorPreciosTemplateAlias[];
  precioListaByProductoId: Record<string, number | null | undefined>;
  filters?: CompradorPreciosExportFilters;
}): CompradorPreciosExcelSourceRow[] {
  const aliasByPair = new Map(
    input.aliases.map(
      (row) => [`${row.idComprador}::${row.idProducto}`, row] as const,
    ),
  );

  const grupoFilter = input.filters?.grupos
    ?.map(normalizeGrupo)
    .filter(Boolean);
  const grupoSet =
    grupoFilter && grupoFilter.length > 0
      ? new Set(grupoFilter.map((value) => value.toLowerCase()))
      : null;

  const productoFilter = input.filters?.idProductos?.filter(Boolean);
  const productoSet =
    productoFilter && productoFilter.length > 0
      ? new Set(productoFilter)
      : null;

  const codigosExtra = [
    ...(input.filters?.codigosComprador ?? []),
    ...(input.filters?.codigoComprador
      ? [input.filters.codigoComprador]
      : []),
  ]
    .map((value) => value.trim())
    .filter(Boolean);
  const codigoSet =
    codigosExtra.length > 0
      ? new Set(codigosExtra.map((value) => value.toLowerCase()))
      : null;

  const compradores = [...input.compradores]
    .filter((row) => {
      const grupo = normalizeGrupo(row.grupo);
      const inGrupo = Boolean(
        grupoSet && grupo && grupoSet.has(grupo.toLowerCase()),
      );
      const inExtra = Boolean(
        codigoSet && codigoSet.has(row.codigo.trim().toLowerCase()),
      );

      if (grupoSet && codigoSet) return inGrupo || inExtra;
      if (grupoSet) return inGrupo;
      if (codigoSet) return inExtra;
      return true;
    })
    .sort((left, right) => left.nombre.localeCompare(right.nombre, "es"));

  const productos = [...input.productos]
    .filter((row) => (productoSet ? productoSet.has(row.idProducto) : true))
    .sort((left, right) => left.codigo.localeCompare(right.codigo, "es"));

  const rows: CompradorPreciosExcelSourceRow[] = [];

  for (const comprador of compradores) {
    for (const producto of productos) {
      const alias = aliasByPair.get(
        `${comprador.idComprador}::${producto.idProducto}`,
      );
      const precioLista = input.precioListaByProductoId[producto.idProducto];

      rows.push({
        grupo: normalizeGrupo(comprador.grupo),
        codigoComprador: comprador.codigo,
        nombreComprador: comprador.nombre,
        codigoProducto: producto.codigo,
        nombreProducto: producto.nombre,
        equivalencia: alias?.equivalencia ?? "",
        precioActual:
          precioLista !== undefined && precioLista !== null
            ? precioLista
            : null,
        precioNuevo: alias?.precioOverride ?? null,
      });
    }
  }

  return rows;
}

/**
 * Colapsa a una fila por (grupo × producto).
 * Conservado por si hace falta un resumen; el Excel de gestión no lo usa.
 */
export function collapseCompradorPreciosRowsByGrupo(
  rows: readonly CompradorPreciosExcelSourceRow[],
): CompradorPreciosExcelSourceRow[] {
  const byKey = new Map<string, CompradorPreciosExcelSourceRow>();

  const sorted = [...rows].sort((left, right) => {
    const byGrupo = left.grupo.localeCompare(right.grupo, "es");
    if (byGrupo !== 0) return byGrupo;
    const byProducto = left.codigoProducto.localeCompare(
      right.codigoProducto,
      "es",
    );
    if (byProducto !== 0) return byProducto;
    return left.nombreComprador.localeCompare(right.nombreComprador, "es");
  });

  for (const row of sorted) {
    const grupo = normalizeGrupo(row.grupo);
    const codigoProducto = row.codigoProducto.trim();
    if (!grupo || !codigoProducto) continue;

    const key = `${grupo.toLowerCase()}::${codigoProducto.toLowerCase()}`;
    if (byKey.has(key)) continue;
    byKey.set(key, { ...row, grupo });
  }

  return [...byKey.values()];
}

function templateDataRows(
  rows: readonly CompradorPreciosExcelSourceRow[],
): CompradorPreciosExcelSourceRow[] {
  if (rows.length > 0) return [...rows];

  return Array.from({ length: TEMPLATE_BLANK_ROWS }, () => EMPTY_TEMPLATE_ROW);
}

export function buildCompradorPreciosExcelAoA(
  rows: readonly CompradorPreciosExcelSourceRow[],
  variant: CompradorPreciosExcelVariant = "template",
): (string | number)[][] {
  return [
    [...COMPRADOR_PRECIOS_EXCEL_COLUMNS],
    ...templateDataRows(rows).map((row) => {
      const prices = pricesForVariant(row, variant);
      return [
        row.grupo || "",
        row.codigoComprador || "",
        row.nombreComprador || "",
        row.codigoProducto || "",
        row.nombreProducto || "",
        row.equivalencia || "",
        prices.actual,
        prices.nuevo,
      ];
    }),
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
    dataRows.map((row) => row.grupo),
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
  compradorWidth: number,
): number {
  const productLines = Math.ceil(
    Math.max(row.nombreProducto.length, 1) / Math.max(productWidth - 1, 8),
  );
  const aliasLines = Math.ceil(
    Math.max(row.equivalencia.length, 1) / Math.max(equivalenciaWidth - 1, 8),
  );
  const compradorLines = Math.ceil(
    Math.max(row.nombreComprador.length, 1) / Math.max(compradorWidth - 1, 8),
  );

  return Math.min(
    64,
    Math.max(24, Math.max(productLines, aliasLines, compradorLines) * 16),
  );
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
    textColor: isInput ? COLOR_INPUT_TEXT : COLOR_INK,
    wrap: true,
    borderColor: isInput ? COLOR_INPUT_BORDER : COLOR_BORDER,
    borderStyle: "thin",
    backgroundColor: isInput
      ? COLOR_INPUT_BG
      : isEven
        ? COLOR_ROW_EVEN
        : COLOR_ROW_ODD,
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
  value: number,
  isEven: boolean,
  height: number,
  isInput = false,
  locked = true,
): CompradorPreciosExcelCell {
  return {
    ...baseCell(isEven, isInput),
    value,
    format: PRICE_NUM_FMT,
    align: "center",
    height,
    locked,
  };
}

export function buildCompradorPreciosSheetData(
  rows: readonly CompradorPreciosExcelSourceRow[],
  variant: CompradorPreciosExcelVariant = "template",
): CompradorPreciosSheetData {
  const dataRows = templateDataRows(rows);
  const columns = buildCompradorPreciosColumnWidths(rows);
  const compradorWidth = columns[2]?.width ?? 24;
  const productWidth = columns[4]?.width ?? 48;
  const equivalenciaWidth = columns[5]?.width ?? 20;
  const isPrint = variant === "print";

  const header = COMPRADOR_PRECIOS_EXCEL_COLUMNS.map((title) =>
    headerCell(title, !isPrint && title === "Precio nuevo"),
  );

  const body = dataRows.map((row, index) => {
    const isEven = index % 2 === 1;
    const height = rowHeightFor(
      row,
      productWidth,
      equivalenciaWidth,
      compradorWidth,
    );
    const prices = pricesForVariant(row, variant);
    const nuevoChanged = isPrint && prices.nuevo !== prices.actual;

    return [
      textCell(row.grupo, isEven, height, "center"),
      textCell(row.codigoComprador, isEven, height, "center"),
      textCell(row.nombreComprador, isEven, height, "left"),
      textCell(row.codigoProducto, isEven, height, "center"),
      textCell(row.nombreProducto, isEven, height),
      textCell(row.equivalencia, isEven, height, "left", isPrint),
      priceCell(prices.actual, isEven, height),
      nuevoChanged
        ? {
            ...priceCell(prices.nuevo, isEven, height, false, true),
            backgroundColor: COLOR_MODIFIED_BG,
            textColor: COLOR_MODIFIED_TEXT,
            fontWeight: "bold" as const,
          }
        : priceCell(prices.nuevo, isEven, height, !isPrint, isPrint),
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
  variant: CompradorPreciosExcelVariant = "template",
): Promise<Workbook> {
  const sheetData = buildCompradorPreciosSheetData(rows, variant);
  const widths = buildCompradorPreciosColumnWidths(rows);
  const workbook = new Workbook();
  const isPrint = variant === "print";
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
      horizontalCentered: true,
      margins: {
        left: 0.25,
        right: 0.25,
        top: 0.4,
        bottom: 0.4,
        header: 0.2,
        footer: 0.2,
      },
    },
  });

  // ExcelJS a veces ignora orientation en el constructor; forzar en la hoja.
  worksheet.pageSetup = {
    ...worksheet.pageSetup,
    orientation: "landscape",
    paperSize: 9,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    blackAndWhite: false,
    draft: false,
    scale: undefined,
  };

  worksheet.columns = widths.map((column) => ({ width: column.width }));

  sheetData.forEach((rowCells, rowIndex) => {
    const excelRow = worksheet.getRow(rowIndex + 1);
    excelRow.height = rowCells[0]?.height ?? 24;

    rowCells.forEach((style, columnIndex) => {
      applyExcelCell(excelRow.getCell(columnIndex + 1), style);
    });

    excelRow.commit();
  });

  const dataRowCount = Math.max(sheetData.length - 1, 0);
  if (dataRowCount > 0 && !isPrint) {
    const precioNuevoRange = `H2:H${dataRowCount + 1}`;

    worksheet.addConditionalFormatting({
      ref: precioNuevoRange,
      rules: [
        {
          type: "expression",
          priority: 1,
          formulae: ["AND(ISNUMBER(H2),ISNUMBER(G2),H2<>G2)"],
          style: {
            fill: {
              type: "pattern",
              pattern: "solid",
              bgColor: { argb: hexToArgb(COLOR_MODIFIED_BG) },
            },
            font: {
              color: { argb: hexToArgb(COLOR_MODIFIED_TEXT) },
              bold: true,
            },
          },
        },
      ],
    });

    for (let row = 2; row <= dataRowCount + 1; row += 1) {
      worksheet.getCell(`H${row}`).dataValidation = {
        type: "decimal",
        operator: "greaterThanOrEqual",
        allowBlank: true,
        formulae: [0],
        showErrorMessage: true,
        showInputMessage: true,
        promptTitle: "Precio nuevo",
        prompt:
          "Solo números en pesos mexicanos. Usa punto para decimales (ej. 50.00).",
        errorTitle: "Precio inválido",
        error: "Solo se permiten números con hasta 2 decimales (ej. 50.00).",
        errorStyle: "stop",
      };
    }
  }

  await worksheet.protect("", {
    selectLockedCells: true,
    selectUnlockedCells: !isPrint,
  });

  return workbook;
}

export function buildCompradorPreciosExcelFileName(filters?: {
  fechaInicio?: string;
  fechaFin?: string;
  variant?: CompradorPreciosExcelVariant;
}): string {
  const inicio = filters?.fechaInicio?.trim();
  const fin = filters?.fechaFin?.trim();
  const prefix =
    filters?.variant === "print"
      ? "lista-precios-compradores"
      : "gestion-precios-compradores";
  if (inicio && fin) {
    return `${prefix}_${inicio}_${fin}.xlsx`;
  }
  return filters?.variant === "print"
    ? "lista-precios-compradores.xlsx"
    : COMPRADOR_PRECIOS_EXCEL_FILE_NAME;
}

export async function downloadCompradorPreciosExcelTemplate(
  rows: readonly CompradorPreciosExcelSourceRow[],
  options?: {
    fechaInicio?: string;
    fechaFin?: string;
    variant?: CompradorPreciosExcelVariant;
  },
): Promise<void> {
  const variant = options?.variant ?? "template";
  const workbook = await buildCompradorPreciosWorkbook(rows, variant);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([new Uint8Array(buffer as ArrayBuffer)], {
    type: XLSX_MIME,
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = buildCompradorPreciosExcelFileName({
    fechaInicio: options?.fechaInicio,
    fechaFin: options?.fechaFin,
    variant,
  });
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
