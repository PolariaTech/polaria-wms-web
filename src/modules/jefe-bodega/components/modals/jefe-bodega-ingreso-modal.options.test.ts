import { describe, expect, it } from "vitest";
import type { UbicacionEstadoBodegaDbRow } from "@/modules/warehouses/estado-bodega/types/estado-bodega.types";
import { buildIngresoDestinoOptions } from "./jefe-bodega-ingreso-modal.options";

const ubicacion = (id: string, codigo: string, estado: string | null) =>
  ({ id_ubicacion: id, codigo, estado_slot: estado }) as unknown as UbicacionEstadoBodegaDbRow;

describe("jefe-bodega-ingreso-modal.options", () => {
  it("marca como vacía la ubicación libre y numera los slots", () => {
    const options = buildIngresoDestinoOptions([
      ubicacion("u1", "A-01", "libre"),
      ubicacion("u2", "A-02", "ocupado"),
    ]);

    expect(options[0]).toMatchObject({
      id: "u1",
      slotNumber: 1,
      visual: "vacia",
      subtitle: "Casillero libre",
      detalle: null,
    });
    expect(options[1]).toMatchObject({
      id: "u2",
      slotNumber: 2,
      visual: "ocupada_primario",
      subtitle: "Estado: ocupado",
    });
    expect(options[1]?.detalle?.posicion).toBe("A-02");
  });
});
