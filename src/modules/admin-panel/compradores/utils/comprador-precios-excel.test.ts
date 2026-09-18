import { describe, expect, it } from "vitest";
import { Workbook } from "exceljs";
import {
  buildCompradorPreciosColumnWidths,
  buildCompradorPreciosExcelAoA,
  buildCompradorPreciosSheetData,
  buildCompradorPreciosTemplateRows,
  buildCompradorPreciosWorkbook,
  COMPRADOR_PRECIOS_EXCEL_COLUMNS,
  COMPRADOR_PRECIOS_EXCEL_FILE_NAME,
  fitExcelColumnWidth,
} from "./comprador-precios-excel";

describe("comprador-precios-excel", () => {
  it("arma una fila por cada comprador y cada producto del catálogo", () => {
    const rows = buildCompradorPreciosTemplateRows({
      compradores: [
        { idComprador: "c-2", codigo: "SOR01", nombre: "Soriana" },
        { idComprador: "c-1", codigo: "WAL01", nombre: "Walmart" },
      ],
      productos: [
        { idProducto: "p-2", codigo: "OGHK6", nombre: "Hamburguesa" },
        { idProducto: "p-1", codigo: "DICOK", nombre: "Pollo entero" },
      ],
      aliases: [
        {
          idComprador: "c-1",
          idProducto: "p-1",
          equivalencia: "Pollo asado",
          precioOverride: 50,
        },
      ],
      precioListaByProductoId: {
        "p-1": 40,
        "p-2": 20,
      },
    });

    expect(rows).toHaveLength(4);
    expect(rows[0]).toEqual({
      codigoComprador: "SOR01",
      nombreComprador: "Soriana",
      codigoProducto: "DICOK",
      nombreProducto: "Pollo entero",
      equivalencia: "",
      precioActual: 40,
    });
    expect(rows[2]).toEqual({
      codigoComprador: "WAL01",
      nombreComprador: "Walmart",
      codigoProducto: "DICOK",
      nombreProducto: "Pollo entero",
      equivalencia: "Pollo asado",
      precioActual: 50,
    });
  });

  it("arma la plantilla con las 7 columnas y precio nuevo vacío", () => {
    const aoa = buildCompradorPreciosExcelAoA([
      {
        codigoComprador: "WAL01",
        nombreComprador: "Walmart",
        codigoProducto: "DICOK",
        nombreProducto: "Pollo entero",
        equivalencia: "Pollo asado",
        precioActual: 110,
      },
    ]);

    expect(aoa[0]).toEqual([...COMPRADOR_PRECIOS_EXCEL_COLUMNS]);
    expect(aoa[1]).toEqual([
      "WAL01",
      "Walmart",
      "DICOK",
      "Pollo entero",
      "Pollo asado",
      110,
      "",
    ]);
  });

  it("deja la grilla vacía si no hay productos", () => {
    const aoa = buildCompradorPreciosExcelAoA([]);
    expect(aoa[0]).toEqual([...COMPRADOR_PRECIOS_EXCEL_COLUMNS]);
    expect(aoa).toHaveLength(21);
  });

  it("ensancha las columnas según el contenido para que no se corten", () => {
    expect(fitExcelColumnWidth(["abc"], 10, 20)).toBe(10);
    expect(
      fitExcelColumnWidth(
        ["FROZEN-HIGH CHOICE BEEF BLACK ANGUS NY STRIP BONE IN CENTER"],
        48,
        78,
      ),
    ).toBe(62);

    const widths = buildCompradorPreciosColumnWidths([
      {
        codigoComprador: "BSXA1",
        nombreComprador: "Guillermo Mendoza",
        codigoProducto: "A3EZB",
        nombreProducto:
          "FROZEN-HIGH CHOICE BEEF BLACK ANGUS NY STRIP BONE IN CENTER",
        equivalencia: "Strip center",
        precioActual: 111.56,
      },
    ]);

    expect(widths[3]?.width).toBeGreaterThanOrEqual(48);
    expect(COMPRADOR_PRECIOS_EXCEL_FILE_NAME.endsWith(".xlsx")).toBe(true);
  });

  it("arma una hoja xlsx en gris y resalta precio nuevo", () => {
    const sheet = buildCompradorPreciosSheetData([
      {
        codigoComprador: "WAL01",
        nombreComprador: "Walmart",
        codigoProducto: "DICOK",
        nombreProducto: "Pollo entero",
        equivalencia: "Pollo asado",
        precioActual: 50,
      },
    ]);

    const header = sheet[0] as {
      value?: string;
      backgroundColor?: string;
      locked?: boolean;
    }[];
    expect(header.map((cell) => cell.value)).toEqual([
      ...COMPRADOR_PRECIOS_EXCEL_COLUMNS,
    ]);
    expect(header[0]?.backgroundColor).toBe("#4d4d4d");
    expect(header[6]?.backgroundColor).toBe("#111111");

    const firstRow = sheet[1] as {
      value?: string | number | null;
      wrap?: boolean;
      backgroundColor?: string;
      locked?: boolean;
    }[];
    expect(firstRow[3]?.value).toBe("Pollo entero");
    expect(firstRow[3]?.wrap).toBe(true);
    expect(firstRow[6]?.value).toBeNull();
    expect(firstRow[6]?.backgroundColor).toBe("#d6d6d6");
    expect(firstRow[4]?.locked).toBe(false);
    expect(firstRow[6]?.locked).toBe(false);
    expect(firstRow[0]?.locked).toBe(true);
    expect(firstRow[5]?.locked).toBe(true);
    expect(header[6]?.locked).toBe(true);
  });

  it("protege la hoja sin contraseña y deja editables equivalencia y precio nuevo", async () => {
    const workbook = await buildCompradorPreciosWorkbook([
      {
        codigoComprador: "WAL01",
        nombreComprador: "Walmart",
        codigoProducto: "DICOK",
        nombreProducto: "Pollo entero",
        equivalencia: "Pollo asado",
        precioActual: 50,
      },
    ]);
    const worksheet = workbook.getWorksheet("Precios");
    const protection = (
      worksheet as { sheetProtection?: { sheet?: boolean; hashValue?: string } }
    ).sheetProtection;

    expect(protection?.sheet).toBe(true);
    expect(protection?.hashValue).toBeUndefined();
    expect(worksheet?.getCell("A1").protection.locked).toBe(true);
    expect(worksheet?.getCell("G1").protection.locked).toBe(true);
    expect(worksheet?.getCell("A2").protection.locked).toBe(true);
    expect(worksheet?.getCell("D2").protection.locked).toBe(true);
    expect(worksheet?.getCell("F2").protection.locked).toBe(true);
    expect(worksheet?.getCell("E2").protection.locked).toBe(false);
    expect(worksheet?.getCell("G2").protection.locked).toBe(false);
    expect(
      (worksheet?.getCell("A1").fill as { fgColor?: { argb?: string } }).fgColor
        ?.argb,
    ).toBe("FF4D4D4D");
    expect(
      (worksheet?.getCell("G1").fill as { fgColor?: { argb?: string } }).fgColor
        ?.argb,
    ).toBe("FF111111");
    expect(
      (worksheet?.getCell("G2").fill as { fgColor?: { argb?: string } }).fgColor
        ?.argb,
    ).toBe("FFD6D6D6");
  });

  it("conserva el bloqueo al guardar y reabrir el xlsx", async () => {
    const workbook = await buildCompradorPreciosWorkbook([
      {
        codigoComprador: "WAL01",
        nombreComprador: "Walmart",
        codigoProducto: "DICOK",
        nombreProducto: "Pollo entero",
        equivalencia: "Pollo asado",
        precioActual: 50,
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
    expect(worksheet?.getCell("E2").protection?.locked).toBe(false);
    expect(worksheet?.getCell("G2").protection?.locked).toBe(false);
    expect(worksheet?.getCell("A2").protection?.locked).not.toBe(false);
    expect(worksheet?.getCell("F2").protection?.locked).not.toBe(false);
  });
});
