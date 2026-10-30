import { describe, expect, it } from "vitest";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import {
  ensureLineasCompletas,
  expandNombresParcialesFirmas,
  remapLineasPorProducto,
  sanitizeFacturaAsociada,
  sanitizeFacturaOkFolioFirma,
} from "./openai-surtido.client";
import { estimateSurtidoPrecision } from "./estimate-surtido-precision";
import type { OrdenSurtidoCapturaPayload } from "./orden-surtido.types";

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

  it("trata Documentación como la misma caja que Factura (OK)", () => {
    const campos = {
      "Documentación folio": "FAC-10",
      "Documentación firma": "Ana Ruiz",
    };
    sanitizeFacturaOkFolioFirma(campos);
    expect(campos.facturaOkFolio).toBe("FAC-10");
    expect(campos.facturaOkFirma).toBe("Ana Ruiz");
    expect(campos["Documentación folio"]).toBeUndefined();
    expect(campos["Documentación firma"]).toBeUndefined();
  });

  it("no copia Documentó a Factura (OK)", () => {
    const campos = {
      "Documentó nombre": "Ana Ruiz",
      documentoNombre: "Ana Ruiz",
    };
    sanitizeFacturaOkFolioFirma(campos);
    expect(campos.facturaOkNombre).toBeUndefined();
    expect(campos.facturaOkFirma).toBeUndefined();
    expect(campos.documentoNombre).toBe("Ana Ruiz");
  });

  it("corrige folio y firma invertidos cuando el rótulo es Documentación", () => {
    const campos = {
      "Documentación folio": "Ana Ruiz",
      "Documentación firma": "F-9081",
    };
    sanitizeFacturaOkFolioFirma(campos);
    expect(campos.facturaOkFolio).toBe("F-9081");
    expect(campos.facturaOkFirma).toBe("Ana Ruiz");
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
        especificacion: null,
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

describe("ensureLineasCompletas (REQ-153)", () => {
  it("rellena índices faltantes con alisto/reviso false", () => {
    const lineas = ensureLineasCompletas(original, [
      {
        indice: 2,
        especificacion: null,
        cantidadPreparada: "1 kg",
        codigoIncidencia: null,
        nota: null,
        alisto: true,
        reviso: false,
      },
    ]);
    expect(lineas).toHaveLength(3);
    expect(lineas[0]).toMatchObject({
      indice: 1,
      alisto: false,
      reviso: false,
    });
    expect(lineas[1]).toMatchObject({ indice: 2, alisto: true });
    expect(lineas[2]).toMatchObject({
      indice: 3,
      alisto: false,
      reviso: false,
    });
  });
});

describe("chulo de Revisó", () => {
  it("no convierte Revisó en Alistó", () => {
    const lineas = ensureLineasCompletas(original, [
      { indice: 1, alisto: false, reviso: true },
      { indice: 2, alisto: true, reviso: true },
      { indice: 3, alisto: false, reviso: false },
    ]);
    expect(lineas[0]).toMatchObject({ alisto: false, reviso: true });
    expect(lineas[1]).toMatchObject({ alisto: true, reviso: true });
    expect(lineas[2]).toMatchObject({ alisto: false, reviso: false });
  });
});

describe("estimateSurtidoPrecision (REQ-153)", () => {
  it("no cuenta Revisó solo como cobertura de línea", () => {
    const soloReviso: OrdenSurtidoCapturaPayload = {
      campos: {},
      checks: {},
      lineas: [
        { indice: 1, reviso: true, alisto: false },
        { indice: 2, reviso: true, alisto: false },
        { indice: 3, reviso: true, alisto: false },
      ],
    };
    const conAlisto: OrdenSurtidoCapturaPayload = {
      campos: {},
      checks: {},
      lineas: [
        { indice: 1, reviso: false, alisto: true },
        { indice: 2, reviso: false, alisto: true },
        { indice: 3, reviso: false, alisto: true },
      ],
    };
    expect(estimateSurtidoPrecision(soloReviso, 3)).toBeLessThan(
      estimateSurtidoPrecision(conAlisto, 3),
    );
  });

  it("cuenta Documentación folio igual que Factura (OK) folio", () => {
    const vacio: OrdenSurtidoCapturaPayload = {
      campos: {},
      checks: {},
      lineas: [],
    };
    const viejo: OrdenSurtidoCapturaPayload = {
      campos: { "Factura (OK) folio": "F-1" },
      checks: {},
      lineas: [],
    };
    const nuevo: OrdenSurtidoCapturaPayload = {
      campos: { "Documentación folio": "F-1" },
      checks: {},
      lineas: [],
    };
    expect(estimateSurtidoPrecision(nuevo, 0)).toBe(
      estimateSurtidoPrecision(viejo, 0),
    );
    expect(estimateSurtidoPrecision(nuevo, 0)).toBeGreaterThan(
      estimateSurtidoPrecision(vacio, 0),
    );
  });
});
