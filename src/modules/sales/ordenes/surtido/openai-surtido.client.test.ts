import { describe, expect, it } from "vitest";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import {
  expandNombresParcialesFirmas,
  remapLineasPorProducto,
  sanitizeFacturaAsociada,
  sanitizeFacturaOkFolioFirma,
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

  it("no completa Factura (OK) desde Despachó", () => {
    const campos = {
      facturaOkNombre: "Cantillo",
      "Factura (OK) nombre": "Cantillo",
      despachoNombre: "Luis Cantillo",
    };
    expandNombresParcialesFirmas(campos);
    expect(campos.facturaOkNombre).toBe("Cantillo");
  });
});

describe("sanitizeFacturaOkFolioFirma", () => {
  it("intercambia folio y firma si vinieron invertidos", () => {
    const campos = {
      facturaOkFolio: "Ana Ruiz",
      "Factura (OK) folio": "Ana Ruiz",
      facturaOkFirma: "F-9081",
      "Factura (OK) firma": "F-9081",
    };
    sanitizeFacturaOkFolioFirma(campos);
    expect(campos.facturaOkFolio).toBe("F-9081");
    expect(campos.facturaOkFirma).toBe("Ana Ruiz");
  });

  it("mueve un nombre puesto en folio hacia firma", () => {
    const campos = {
      facturaOkFolio: "Pedro Lopez",
      "Factura (OK) folio": "Pedro Lopez",
    };
    sanitizeFacturaOkFolioFirma(campos);
    expect(campos.facturaOkFolio).toBeUndefined();
    expect(campos.facturaOkFirma).toBe("Pedro Lopez");
  });

  it("mueve un folio puesto en firma hacia folio", () => {
    const campos = {
      facturaOkFirma: "FAC-221",
      "Factura (OK) firma": "FAC-221",
    };
    sanitizeFacturaOkFolioFirma(campos);
    expect(campos.facturaOkFolio).toBe("FAC-221");
    expect(campos.facturaOkFirma).toBeUndefined();
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
