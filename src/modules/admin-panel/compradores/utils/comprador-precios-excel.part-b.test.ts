import { describe, expect, it } from "vitest";
import { Workbook } from "exceljs";
import {
  buildCompradorPreciosColumnWidths,
  buildCompradorPreciosExcelAoA,
  buildCompradorPreciosSheetData,
  buildCompradorPreciosTemplateRows,
  buildCompradorPreciosWorkbook,
  collapseCompradorPreciosRowsByGrupo,
  COMPRADOR_PRECIOS_EXCEL_COLUMNS,
  COMPRADOR_PRECIOS_EXCEL_FILE_NAME,
  fitExcelColumnWidth,
} from "./comprador-precios-excel";
describe("comprador-precios-excel", () => {
  it("protege la hoja y valida precio nuevo como decimal", async () => {
  const workbook = await buildCompradorPreciosWorkbook([
  {
  grupo: "Grupo A",
  codigoComprador: "WAL01",
  nombreComprador: "Walmart",
  codigoProducto: "DICOK",
  nombreProducto: "Pollo entero",
  equivalencia: "Pollo asado",
  precioActual: 50,
  precioNuevo: null,
  },
  ]);
  const worksheet = workbook.getWorksheet("Precios");
  const protection = (
  worksheet as { sheetProtection?: { sheet?: boolean; hashValue?: string } }
  ).sheetProtection;

  expect(protection?.sheet).toBe(true);
  expect(protection?.hashValue).toBeUndefined();
  expect(worksheet?.getCell("A1").protection.locked).toBe(true);
  expect(worksheet?.getCell("H1").protection.locked).toBe(true);
  expect(worksheet?.getCell("A2").protection.locked).toBe(true);
  expect(worksheet?.getCell("E2").protection.locked).toBe(true);
  expect(worksheet?.getCell("G2").protection.locked).toBe(true);
  expect(worksheet?.getCell("F2").protection.locked).toBe(false);
  expect(worksheet?.getCell("H2").protection.locked).toBe(false);
  expect(worksheet?.getCell("H2").value).toBe(50);
  expect(worksheet?.getCell("H2").numFmt).toBe("$#,##0.00");
  expect(
  (worksheet?.getCell("H2").font as { color?: { argb?: string } }).color
  ?.argb,
  ).toBe("FF6B6B6B");
  expect(
  (worksheet?.getCell("H2").fill as { fgColor?: { argb?: string } }).fgColor
  ?.argb,
  ).toBe("FFD9D9D9");
  expect(worksheet?.getCell("H2").dataValidation?.type).toBe("decimal");
  expect(worksheet?.pageSetup.orientation).toBe("landscape");

  const rules = (
  worksheet as {
  conditionalFormattings?: Array<{
  ref?: string;
  rules?: Array<{
  type?: string;
  formulae?: string[];
  style?: {
  fill?: { bgColor?: { argb?: string } };
  font?: { color?: { argb?: string } };
  };
  }>;
  }>;
  }
  ).conditionalFormattings;
  expect(rules?.[0]?.ref).toBe("H2:H2");
  expect(rules?.[0]?.rules?.[0]?.type).toBe("expression");
  expect(rules?.[0]?.rules?.[0]?.formulae?.[0]).toContain("H2<>G2");
  expect(rules?.[0]?.rules?.[0]?.style?.fill?.bgColor?.argb).toBe("FF6BCF8E");
  expect(rules?.[0]?.rules?.[0]?.style?.font?.color?.argb).toBe("FFFFFFFF");
  });

  it("en impresión bloquea todo, usa precios distintos y deja landscape", async () => {
  const workbook = await buildCompradorPreciosWorkbook(
  [
  {
  grupo: "Grupo A",
  codigoComprador: "WAL01",
  nombreComprador: "Walmart",
  codigoProducto: "DICOK",
  nombreProducto: "Pollo entero",
  equivalencia: "Pollo asado",
  precioActual: 110,
  precioNuevo: 125,
  },
  ],
  "print",
  );
  const worksheet = workbook.getWorksheet("Precios");

  expect(worksheet?.pageSetup.orientation).toBe("landscape");
  expect(worksheet?.pageSetup.fitToPage).toBe(true);
  expect(worksheet?.pageSetup.fitToWidth).toBe(1);
  expect(worksheet?.getCell("G2").value).toBe(110);
  expect(worksheet?.getCell("H2").value).toBe(125);
  expect(worksheet?.getCell("F2").protection.locked).toBe(true);
  expect(worksheet?.getCell("H2").protection.locked).toBe(true);
  expect(worksheet?.getCell("H2").dataValidation).toBeFalsy();
  expect(
  (worksheet?.getCell("H2").fill as { fgColor?: { argb?: string } }).fgColor
  ?.argb,
  ).toBe("FF6BCF8E");

  const rules = (
  worksheet as { conditionalFormattings?: unknown[] }
  ).conditionalFormattings;
  expect(rules ?? []).toHaveLength(0);
  });

  it("conserva el bloqueo al guardar y reabrir el xlsx", async () => {
  const workbook = await buildCompradorPreciosWorkbook([
  {
  grupo: "Grupo A",
  codigoComprador: "WAL01",
  nombreComprador: "Walmart",
  codigoProducto: "DICOK",
  nombreProducto: "Pollo entero",
  equivalencia: "Pollo asado",
  precioActual: 50,
  precioNuevo: null,
  },
  ]);
  const buffer = await workbook.xlsx.writeBuffer();
  const loaded = new Workbook();
  await loaded.xlsx.load(buffer);
  const worksheet = loaded.getWorksheet("Precios");
  const protection = (
  worksheet as { sheetProtection?: { sheet?: boolean; hashValue?: string } }
  ).sheetProtection;

  expect(protection?.sheet).toBe(true);
  expect(protection?.hashValue).toBeUndefined();
  expect(worksheet?.getCell("F2").protection?.locked).toBe(false);
  expect(worksheet?.getCell("H2").protection?.locked).toBe(false);
  expect(worksheet?.getCell("A2").protection?.locked).not.toBe(false);
  expect(worksheet?.getCell("G2").protection?.locked).not.toBe(false);
  expect(worksheet?.pageSetup.orientation).toBe("landscape");
  });
});