import { describe, expect, it } from "vitest";
import { buildTransferenciaObservaciones } from "./jefe-bodega-transferencia-modal.origen";
import type { OrigenMeta } from "./jefe-bodega-transferencia-modal.types";

const meta = (overrides: Partial<OrigenMeta>): OrigenMeta => ({
  idUbicacion: "u1",
  zona: "procesamiento",
  rol: "normal",
  idSolicitud: null,
  idProducto: null,
  cantidad: null,
  ...overrides,
});

describe("jefe-bodega-transferencia-modal.origen", () => {
  it("no genera observaciones para una transferencia normal", () => {
    expect(buildTransferenciaObservaciones(meta({}))).toBeUndefined();
  });

  it("une rol de devolución y referencia de solicitud con |", () => {
    const text = buildTransferenciaObservaciones(
      meta({ rol: "sobrante", idSolicitud: "sol-1" }),
    );
    expect(text?.split("|")).toHaveLength(2);
  });
});
