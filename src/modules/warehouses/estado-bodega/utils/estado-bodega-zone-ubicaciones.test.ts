import { describe, expect, it } from "vitest";
import { isUbicacionStockVentaAlmacenamiento } from "./estado-bodega-zone-ubicaciones";

describe("isUbicacionStockVentaAlmacenamiento (REQ-135)", () => {
  it("incluye GEN con recepción+almacenamiento+picking (stock vendible)", () => {
    expect(
      isUbicacionStockVentaAlmacenamiento({
        tipo_ubicacion: {
          codigo: "GEN",
          es_recepcion: true,
          es_almacenamiento: true,
          es_picking: true,
        },
      }),
    ).toBe(true);
  });

  it("excluye ingreso puro sin almacenamiento", () => {
    expect(
      isUbicacionStockVentaAlmacenamiento({
        tipo_ubicacion: {
          codigo: "INGRESO",
          es_recepcion: true,
          es_almacenamiento: false,
          es_picking: false,
        },
      }),
    ).toBe(false);
  });

  it("excluye procesamiento", () => {
    expect(
      isUbicacionStockVentaAlmacenamiento({
        tipo_ubicacion: {
          codigo: "PROCESO",
          es_recepcion: false,
          es_almacenamiento: true,
          es_picking: false,
        },
      }),
    ).toBe(false);
  });
});
