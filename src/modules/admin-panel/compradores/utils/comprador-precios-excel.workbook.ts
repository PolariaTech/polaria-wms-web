import { Workbook, type Cell } from "exceljs";
import { COLOR_MODIFIED_BG, COLOR_MODIFIED_TEXT, COMPRADOR_PRECIOS_EXCEL_FILE_NAME, COMPRADOR_PRECIOS_SHEET_NAME, XLSX_MIME, type CompradorPreciosExcelCell } from "./comprador-precios-excel.constants";
import { buildCompradorPreciosSheetData } from "./comprador-precios-excel.cells";
import type { CompradorPreciosExcelSourceRow, CompradorPreciosExcelVariant } from "./comprador-precios-excel.constants";
import { buildCompradorPreciosColumnWidths } from "./comprador-precios-excel.rows";

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
