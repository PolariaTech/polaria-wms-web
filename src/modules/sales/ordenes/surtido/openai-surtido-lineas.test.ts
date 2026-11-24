import { describe, expect, it } from "vitest";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import {
  ensureLineasCompletas,
  remapLineasPorProducto,
  refineSurtidoPayload,
} from "./openai-surtido-lineas";

const original = {
  folio: "OV-1",
  lineas: [
    { producto: "BLUE BERRY", especificacion: "", cantidadSolicitada: "1 kg" },
    { producto: "FRESA", especificacion: "", cantidadSolicitada: "2 kg" },
  ],
} as OrdenTareaAlmacenPrintData;

describe("remapLineasPorProducto", () => {
  it("reubica por productoImpreso", () => {
    const out = remapLineasPorProducto(
      [
        {
          indice: 9,
          productoImpreso: "FRESA",
          especificacion: null,
          cantidadPreparada: "2 kg",
          codigoIncidencia: null,
          nota: null,
          alisto: true,
          reviso: false,
        },
      ],
      original,
    );
    expect(out[0]?.indice).toBe(2);
  });
});

describe("ensureLineasCompletas", () => {
  it("rellena filas faltantes", () => {
    const out = ensureLineasCompletas(original, []);
    expect(out).toHaveLength(2);
    expect(out[0]?.alisto).toBe(false);
  });
});

describe("refineSurtidoPayload", () => {
  it("sanitiza campos", () => {
    const payload = refineSurtidoPayload({
      campos: { facturaAsociada: "Juan Perez" },
      checks: {},
      lineas: [],
      observacionesIa: null,
    });
    expect(payload.campos.facturaAsociada).toBeUndefined();
  });
});