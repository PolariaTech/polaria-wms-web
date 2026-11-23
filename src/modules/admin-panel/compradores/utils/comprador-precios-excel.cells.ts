import {
  COLOR_BORDER,
  COLOR_INK,
  COLOR_HEADER,
  COLOR_HEADER_TEXT,
  COLOR_INPUT_BG,
  COLOR_INPUT_BORDER,
  COLOR_INPUT_HEADER,
  COLOR_INPUT_TEXT,
  COLOR_MODIFIED_BG,
  COLOR_MODIFIED_TEXT,
  COLOR_ROW_EVEN,
  COLOR_ROW_ODD,
  COMPRADOR_PRECIOS_EXCEL_COLUMNS,
  PRICE_NUM_FMT,
  type CompradorPreciosExcelCell,
  type CompradorPreciosExcelSourceRow,
  type CompradorPreciosExcelVariant,
  type CompradorPreciosSheetData,
} from "./comprador-precios-excel.constants";
import {
  buildCompradorPreciosColumnWidths,
  pricesForVariant,
  templateDataRows,
} from "./comprador-precios-excel.rows";

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

