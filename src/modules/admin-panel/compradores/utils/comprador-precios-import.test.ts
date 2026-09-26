import { describe, expect, it } from "vitest";
import { Workbook } from "exceljs";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { COMPRADOR_PRECIOS_EXCEL_COLUMNS } from "./comprador-precios-excel";
import {
  parseCompradorPreciosExcelBuffer,
  planCompradorPreciosImport,
  takeCompradorPreciosImportPreview,
} from "./comprador-precios-import";

describe("comprador-precios-import", () => {
  it("lee equivalencia y precio nuevo por comprador", async () => {
    const workbook = new Workbook();
    const sheet = workbook.addWorksheet("Precios");
    sheet.addRow([...COMPRADOR_PRECIOS_EXCEL_COLUMNS]);
    sheet.addRow([
      "Grupo A",
      "WAL01",
      "Walmart",
      "DICOK",
      "Pollo entero",
      "Pollo asado",
      110,
      125.5,
    ]);
    sheet.addRow([
      "Grupo B",
      "SOR01",
      "Soriana",
      "OGHK6",
      "Hamburguesa",
      "",
      20,
      "",
    ]);
    sheet.addRow([
      "Grupo A",
      "WAL01",
      "Walmart",
      "RIB01",
      "Ribeye",
      "Rib",
      90,
      90,
    ]);

    const buffer = await workbook.xlsx.writeBuffer();
    const parsed = await parseCompradorPreciosExcelBuffer(buffer as ArrayBuffer);

    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toEqual([
      {
        rowNumber: 2,
        grupo: "Grupo A",
        codigoComprador: "WAL01",
        nombreComprador: "Walmart",
        codigoProducto: "DICOK",
        nombreProducto: "Pollo entero",
        equivalencia: "Pollo asado",
        precioActual: 110,
        precioNuevo: 125.5,
        hasPrecioNuevo: true,
      },
      {
        rowNumber: 3,
        grupo: "Grupo B",
        codigoComprador: "SOR01",
        nombreComprador: "Soriana",
        codigoProducto: "OGHK6",
        nombreProducto: "Hamburguesa",
        equivalencia: "",
        precioActual: 20,
        precioNuevo: null,
        hasPrecioNuevo: false,
      },
      {
        rowNumber: 4,
        grupo: "Grupo A",
        codigoComprador: "WAL01",
        nombreComprador: "Walmart",
        codigoProducto: "RIB01",
        nombreProducto: "Ribeye",
        equivalencia: "Rib",
        precioActual: 90,
        precioNuevo: 90,
        hasPrecioNuevo: false,
      },
    ]);
  });

  it("limita la vista previa a las primeras filas", () => {
    const rows = Array.from({ length: 20 }, (_, index) => ({
      rowNumber: index + 2,
      grupo: "Grupo A",
      codigoComprador: "WAL01",
      nombreComprador: "Walmart",
      codigoProducto: `P${index}`,
      nombreProducto: `Producto ${index}`,
      equivalencia: "",
      precioActual: 50,
      precioNuevo: 50,
      hasPrecioNuevo: false,
    }));

    expect(takeCompradorPreciosImportPreview(rows)).toHaveLength(12);
    expect(takeCompradorPreciosImportPreview(rows, 10)).toHaveLength(10);
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

  it("aplica cambios solo al comprador de la fila", () => {
    const plan = planCompradorPreciosImport({
      rows: [
        {
          rowNumber: 2,
          grupo: "Grupo A",
          codigoComprador: "WAL01",
          nombreComprador: "Walmart",
          codigoProducto: "DICOK",
          nombreProducto: "Pollo",
          equivalencia: "Pollo grill",
          precioActual: 110,
          precioNuevo: 130,
          hasPrecioNuevo: true,
        },
        {
          rowNumber: 3,
          grupo: "Grupo A",
          codigoComprador: "WAL02",
          nombreComprador: "Walmart Sur",
          codigoProducto: "OGHK6",
          nombreProducto: "Burger",
          equivalencia: "Burger",
          precioActual: 20,
          precioNuevo: null,
          hasPrecioNuevo: false,
        },
      ],
      compradores: [
        { idComprador: "c-1", codigo: "WAL01", grupo: "Grupo A" },
        { idComprador: "c-2", codigo: "WAL02", grupo: "Grupo A" },
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
        idComprador: "c-2",
        idProducto: "p-2",
        alias: "Burger",
        precio: null,
      },
    ]);
    expect(plan.updates).toEqual([
      {
        rowNumber: 2,
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
          grupo: "Grupo A",
          codigoComprador: "WAL01",
          nombreComprador: "Walmart",
          codigoProducto: "DICOK",
          nombreProducto: "Pollo",
          equivalencia: "Pollo asado",
          precioActual: 110,
          precioNuevo: null,
          hasPrecioNuevo: false,
        },
        {
          rowNumber: 3,
          grupo: "Grupo A",
          codigoComprador: "WAL01",
          nombreComprador: "Walmart",
          codigoProducto: "OGHK6",
          nombreProducto: "Burger",
          equivalencia: "",
          precioActual: 20,
          precioNuevo: 40,
          hasPrecioNuevo: true,
        },
        {
          rowNumber: 4,
          grupo: "Grupo A",
          codigoComprador: "WAL01",
          nombreComprador: "Walmart",
          codigoProducto: "RIB01",
          nombreProducto: "Ribeye",
          equivalencia: "",
          precioActual: 80,
          precioNuevo: 90,
          hasPrecioNuevo: true,
        },
      ],
      compradores: [
        { idComprador: "c-1", codigo: "WAL01", grupo: "Grupo A" },
      ],
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
