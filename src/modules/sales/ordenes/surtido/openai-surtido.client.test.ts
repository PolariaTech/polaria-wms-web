import { describe, expect, it } from "vitest";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import {
  expandNombresParcialesFirmas,
  remapLineasPorProducto,
  sanitizeFacturaAsociada,
} from "./openai-surtido.client";

const original = {
  folio: "OV-1",
  lineas: [
    { producto: "BLUE BERRY", especificacion: "", cantidadSolicitada: "0,5 kg" },
    { producto: "FRAMBUESA", especificacion: "", cantidadSolicitada: "1 kg" },
    { producto: "FRESA FRESCA", especificacion: "", cantidadSolicitada: "4 kg" },
  ],
} as OrdenTareaAlmacenPrintData;

describe("sanitizeFacturaAsociada", () => {
  it("limpia factura asociada si copió un nombre de firma", () => {
    const campos = {
      facturaAsociada: "Luis Cantillo",
      "Factura asociada": "Luis Cantillo",
      alistoNombre: "Luis Cantillo",
      despachoNombre: "Luis Cantillo",
    };
    sanitizeFacturaAsociada(campos);
    expect(campos.facturaAsociada).toBeUndefined();
    expect(campos["Factura asociada"]).toBeUndefined();
    expect(campos.alistoNombre).toBe("Luis Cantillo");
  });

  it("limpia factura asociada si parece nombre sin folio", () => {
    const campos = { facturaAsociada: "Juan Perez" };
    sanitizeFacturaAsociada(campos);
    expect(campos.facturaAsociada).toBeUndefined();
  });

  it("conserva folio de factura con dígitos", () => {
    const campos = { facturaAsociada: "F-2026-991" };
    sanitizeFacturaAsociada(campos);
    expect(campos.facturaAsociada).toBe("F-2026-991");
  });
});

describe("expandNombresParcialesFirmas", () => {
  it("completa Revisó cuando solo vino el apellido", () => {
    const campos = {
      revisoNombre: "Cantillo",
      "Revisó nombre": "Cantillo",
      alistoNombre: "Luis Cantillo",
      despachoNombre: "Luis Cantillo",
    };
    expandNombresParcialesFirmas(campos);
    expect(campos.revisoNombre).toBe("Luis Cantillo");
    expect(campos["Revisó nombre"]).toBe("Luis Cantillo");
  });
});

describe("remapLineasPorProducto", () => {
  it("corrige indice usando productoImpreso cuando el modelo desfasó la fila", () => {
    const lineas = remapLineasPorProducto(
      [
        {
          indice: 2,
          productoImpreso: "BLUE BERRY",
          especificacion: "grandes",
          cantidadPreparada: null,
          codigoIncidencia: null,
          nota: null,
          alisto: true,
          reviso: true,
        },
        {
          indice: 2,
          productoImpreso: "FRAMBUESA",
          especificacion: null,
          cantidadPreparada: null,
          codigoIncidencia: null,
          nota: null,
          alisto: true,
          reviso: true,
        },
      ],
      original,
    );

    expect(lineas).toEqual([
      {
        indice: 1,
        especificacion: "grandes",
        cantidadPreparada: null,
        codigoIncidencia: null,
        nota: null,
        alisto: true,
        reviso: true,
      },
      {
        indice: 2,
        especificacion: null,
        cantidadPreparada: null,
        codigoIncidencia: null,
        nota: null,
        alisto: true,
        reviso: true,
      },
    ]);
  });
});
