import { describe, expect, it } from "vitest";
import { Workbook } from "exceljs";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { COMPRADOR_PRECIOS_EXCEL_COLUMNS } from "./comprador-precios-excel";
import {
  parseCompradorPreciosExcelBuffer,
  planCompradorPreciosImport,
} from "./comprador-precios-import";

describe("comprador-precios-import", () => {
  it("lee equivalencia y precio nuevo de todas las filas", async () => {
    const workbook = new Workbook();
    const sheet = workbook.addWorksheet("Precios");
    sheet.addRow([...COMPRADOR_PRECIOS_EXCEL_COLUMNS]);
    sheet.addRow([
      "WAL01",
      "Walmart",
      "DICOK",
      "Pollo entero",
      "Pollo asado",
      110,
      125.5,
    ]);
    sheet.addRow(["SOR01", "Soriana", "OGHK6", "Hamburguesa", "", 20, ""]);

    const buffer = await workbook.xlsx.writeBuffer();
    const parsed = await parseCompradorPreciosExcelBuffer(buffer as ArrayBuffer);

    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toEqual([
      {
        rowNumber: 2,
        codigoComprador: "WAL01",
        codigoProducto: "DICOK",
        equivalencia: "Pollo asado",
        precioNuevo: 125.5,
        hasPrecioNuevo: true,
      },
      {
        rowNumber: 3,
        codigoComprador: "SOR01",
        codigoProducto: "OGHK6",
        equivalencia: "",
        precioNuevo: null,
        hasPrecioNuevo: false,
      },
    ]);
  });

  it("rechaza un excel que no es la plantilla", async () => {
    const workbook = new Workbook();
    const sheet = workbook.addWorksheet("Precios");
    sheet.addRow(["A", "B", "C"]);
    const buffer = await workbook.xlsx.writeBuffer();

    await expect(
      parseCompradorPreciosExcelBuffer(buffer as ArrayBuffer),
    ).rejects.toBeInstanceOf(DomainServiceError);
  });

  it("crea alias nuevo y actualiza solo equivalencia o precio nuevo", () => {
    const plan = planCompradorPreciosImport({
      rows: [
        {
          rowNumber: 2,
          codigoComprador: "WAL01",
          codigoProducto: "DICOK",
          equivalencia: "Pollo grill",
          precioNuevo: 130,
          hasPrecioNuevo: true,
        },
        {
          rowNumber: 3,
          codigoComprador: "WAL01",
          codigoProducto: "OGHK6",
          equivalencia: "Burger",
          precioNuevo: null,
          hasPrecioNuevo: false,
        },
        {
          rowNumber: 4,
          codigoComprador: "WAL01",
          codigoProducto: "DICOK",
          equivalencia: "Pollo grill",
          precioNuevo: 130,
          hasPrecioNuevo: true,
        },
      ],
      compradores: [
        { idComprador: "c-1", codigo: "WAL01" },
      ],
      productos: [
        { idProducto: "p-1", codigo: "DICOK" },
        { idProducto: "p-2", codigo: "OGHK6" },
      ],
      aliases: [
        {
          idAlias: "a-1",
          idComprador: "c-1",
          idProducto: "p-1",
          alias: "Pollo asado",
          precioOverride: 110,
        },
      ],
    });

    expect(plan.errors).toEqual([]);
    expect(plan.creates).toEqual([
      {
        rowNumber: 3,
        idComprador: "c-1",
        idProducto: "p-2",
        alias: "Burger",
        precio: null,
      },
    ]);
    expect(plan.updates).toEqual([
      {
        rowNumber: 4,
        idAlias: "a-1",
        alias: "Pollo grill",
        precio: 130,
      },
    ]);
  });

  it("omite filas sin cambios y deja equivalencia vacía si el excel viene vacío", () => {
    const plan = planCompradorPreciosImport({
      rows: [
        {
          rowNumber: 2,
          codigoComprador: "WAL01",
          codigoProducto: "DICOK",
          equivalencia: "Pollo asado",
          precioNuevo: null,
          hasPrecioNuevo: false,
        },
        {
          rowNumber: 3,
          codigoComprador: "WAL01",
          codigoProducto: "OGHK6",
          equivalencia: "",
          precioNuevo: 40,
          hasPrecioNuevo: true,
        },
        {
          rowNumber: 4,
          codigoComprador: "WAL01",
          codigoProducto: "RIB01",
          equivalencia: "",
          precioNuevo: 90,
          hasPrecioNuevo: true,
        },
      ],
      compradores: [{ idComprador: "c-1", codigo: "WAL01" }],
      productos: [
        { idProducto: "p-1", codigo: "DICOK", nombre: "Pollo entero" },
        { idProducto: "p-2", codigo: "OGHK6", nombre: "Hamburguesa" },
        { idProducto: "p-3", codigo: "RIB01", nombre: "Ribeye" },
      ],
      aliases: [
        {
          idAlias: "a-1",
          idComprador: "c-1",
          idProducto: "p-1",
          alias: "Pollo asado",
          precioOverride: 110,
        },
        {
          idAlias: "a-3",
          idComprador: "c-1",
          idProducto: "p-3",
          alias: "Ribeye hotel",
          precioOverride: 80,
        },
      ],
    });

    expect(plan.errors).toEqual([]);
    expect(plan.skipped).toBe(1);
    expect(plan.creates).toEqual([
      {
        rowNumber: 3,
        idComprador: "c-1",
        idProducto: "p-2",
        alias: "",
        precio: 40,
      },
    ]);
    expect(plan.updates).toEqual([
      {
        rowNumber: 4,
        idAlias: "a-3",
        alias: "",
        precio: 90,
      },
    ]);
  });
});
