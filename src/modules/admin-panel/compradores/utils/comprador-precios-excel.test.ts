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
  it("arma una fila por cada comprador y cada producto del catálogo", () => {
    const rows = buildCompradorPreciosTemplateRows({
      compradores: [
        {
          idComprador: "c-2",
          codigo: "SOR01",
          nombre: "Soriana",
          grupo: "Grupo B",
        },
        {
          idComprador: "c-1",
          codigo: "WAL01",
          nombre: "Walmart",
          grupo: "Grupo A",
        },
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
      grupo: "Grupo B",
      codigoComprador: "SOR01",
      nombreComprador: "Soriana",
      codigoProducto: "DICOK",
      nombreProducto: "Pollo entero",
      equivalencia: "",
      precioActual: 40,
      precioNuevo: null,
    });
    expect(rows[2]).toEqual({
      grupo: "Grupo A",
      codigoComprador: "WAL01",
      nombreComprador: "Walmart",
      codigoProducto: "DICOK",
      nombreProducto: "Pollo entero",
      equivalencia: "Pollo asado",
      precioActual: 40,
      precioNuevo: 50,
    });
  });

  it("colapsa a una fila por grupo y producto", () => {
    const rows = collapseCompradorPreciosRowsByGrupo([
      {
        grupo: "Grupo A",
        codigoComprador: "WAL02",
        nombreComprador: "Walmart Sur",
        codigoProducto: "DICOK",
        nombreProducto: "Pollo entero",
        equivalencia: "B",
        precioActual: 60,
        precioNuevo: null,
      },
      {
        grupo: "Grupo A",
        codigoComprador: "WAL01",
        nombreComprador: "Walmart Centro",
        codigoProducto: "DICOK",
        nombreProducto: "Pollo entero",
        equivalencia: "A",
        precioActual: 50,
        precioNuevo: null,
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.nombreComprador).toBe("Walmart Centro");
    expect(rows[0]?.equivalencia).toBe("A");
  });

  it("arma la plantilla con comprador y precio nuevo igual al actual", () => {
    const aoa = buildCompradorPreciosExcelAoA([
      {
        grupo: "Grupo A",
        codigoComprador: "WAL01",
        nombreComprador: "Walmart",
        codigoProducto: "DICOK",
        nombreProducto: "Pollo entero",
        equivalencia: "Pollo asado",
        precioActual: 110,
        precioNuevo: null,
      },
    ]);

    expect(aoa[0]).toEqual([...COMPRADOR_PRECIOS_EXCEL_COLUMNS]);
    expect(aoa[1]).toEqual([
      "Grupo A",
      "WAL01",
      "Walmart",
      "DICOK",
      "Pollo entero",
      "Pollo asado",
      110,
      110,
    ]);
  });

  it("en impresión separa precio actual (lista) y precio nuevo (importado o 50)", () => {
    const aoa = buildCompradorPreciosExcelAoA(
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
        {
          grupo: "Grupo A",
          codigoComprador: "WAL01",
          nombreComprador: "Walmart",
          codigoProducto: "OGHK6",
          nombreProducto: "Hamburguesa",
          equivalencia: "",
          precioActual: 90,
          precioNuevo: null,
        },
      ],
      "print",
    );

    expect(aoa[1]).toEqual([
      "Grupo A",
      "WAL01",
      "Walmart",
      "DICOK",
      "Pollo entero",
      "Pollo asado",
      110,
      125,
    ]);
    expect(aoa[2]?.[6]).toBe(90);
    expect(aoa[2]?.[7]).toBe(50);
  });

  it("usa 50 por defecto cuando no hay precio", () => {
    const aoa = buildCompradorPreciosExcelAoA([
      {
        grupo: "Grupo A",
        codigoComprador: "WAL01",
        nombreComprador: "Walmart",
        codigoProducto: "DICOK",
        nombreProducto: "Pollo entero",
        equivalencia: "",
        precioActual: null,
        precioNuevo: null,
      },
    ]);

    expect(aoa[1]?.[6]).toBe(50);
    expect(aoa[1]?.[7]).toBe(50);
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
        40,
        90,
      ),
    ).toBe(62);

    const widths = buildCompradorPreciosColumnWidths([
      {
        grupo: "Grupo A",
        codigoComprador: "BSXA1",
        nombreComprador: "Guillermo Mendoza",
        codigoProducto: "A3EZB",
        nombreProducto:
          "FROZEN-HIGH CHOICE BEEF BLACK ANGUS NY STRIP BONE IN CENTER",
        equivalencia: "Strip center",
        precioActual: 111.56,
        precioNuevo: null,
      },
    ]);

    expect(widths[4]?.width).toBeGreaterThanOrEqual(40);
    expect(COMPRADOR_PRECIOS_EXCEL_FILE_NAME.endsWith(".xlsx")).toBe(true);
  });

  it("arma una hoja xlsx con precio nuevo en gris (fondo y número)", () => {
    const sheet = buildCompradorPreciosSheetData([
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
    const header = sheet[0] as {
      value?: string;
      backgroundColor?: string;
      locked?: boolean;
    }[];
    expect(header.map((cell) => cell.value)).toEqual([
      ...COMPRADOR_PRECIOS_EXCEL_COLUMNS,
    ]);
    expect(header[0]?.backgroundColor).toBe("#4d4d4d");
    expect(header[7]?.backgroundColor).toBe("#111111");

    const firstRow = sheet[1] as {
      value?: string | number | null;
      wrap?: boolean;
      backgroundColor?: string;
      textColor?: string;
      locked?: boolean;
    }[];
    expect(firstRow[0]?.value).toBe("Grupo A");
    expect(firstRow[1]?.value).toBe("WAL01");
    expect(firstRow[2]?.value).toBe("Walmart");
    expect(firstRow[4]?.value).toBe("Pollo entero");
    expect(firstRow[4]?.wrap).toBe(true);
    expect(firstRow[7]?.value).toBe(50);
    expect(firstRow[7]?.backgroundColor).toBe("#d9d9d9");
    expect(firstRow[7]?.textColor).toBe("#6b6b6b");
    expect(firstRow[5]?.locked).toBe(false);
    expect(firstRow[7]?.locked).toBe(false);
    expect(firstRow[0]?.locked).toBe(true);
    expect(firstRow[6]?.locked).toBe(true);
    expect(header[7]?.locked).toBe(true);
  });

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
