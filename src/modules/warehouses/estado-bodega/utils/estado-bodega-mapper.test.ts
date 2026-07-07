import { describe, expect, it } from "vitest";
import { mapEstadoBodegaLayout } from "./estado-bodega-mapper";
import type { UbicacionEstadoBodegaDbRow } from "../types/estado-bodega.types";

describe("mapEstadoBodegaLayout", () => {
  it("distribuye slots de almacén y marca ocupación con warehouse_state", () => {
    const ubicaciones: UbicacionEstadoBodegaDbRow[] = [
      {
        id_ubicacion: "u-1",
        codigo: "SLOT-001",
        estado_slot: "ocupado",
        tipo_ubicacion: {
          codigo: "ALMACEN",
          es_recepcion: false,
          es_almacenamiento: true,
          es_picking: false,
        },
      },
      {
        id_ubicacion: "u-2",
        codigo: "SLOT-002",
        estado_slot: "libre",
        tipo_ubicacion: {
          codigo: "ALMACEN",
          es_recepcion: false,
          es_almacenamiento: true,
          es_picking: false,
        },
      },
    ];

    const layout = mapEstadoBodegaLayout(ubicaciones, [
      {
        id_warehouse_state: "ws-1",
        codigo_cuenta: "MIT00",
        id_bodega: "b-1",
        id_ubicacion: "u-1",
        id_producto: "p-1",
        id_lote: null,
        cantidad: "12.5",
        cantidad_reservada: "0",
        temperatura: null,
        locked_by: null,
        locked_at: null,
        version: 1,
        updated_at: "2026-07-01T00:00:00.000Z",
      },
    ]);

    const almacenamiento = layout.sections.find(
      (section) => section.id === "almacenamiento",
    );

    expect(almacenamiento?.occupiedCount).toBe(1);
    expect(almacenamiento?.slots[0]?.visual).toBe("ocupada_primario");
    expect(almacenamiento?.slots[0]?.productoLabel).toBe("12,5 kg");
    expect(almacenamiento?.slots[1]?.visual).toBe("vacia");
    expect(layout.sections.find((section) => section.id === "entrada")?.capacity)
      .toBe(8);
  });
});
