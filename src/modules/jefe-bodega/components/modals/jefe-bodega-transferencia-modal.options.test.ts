import { describe, expect, it } from "vitest";
import type { UbicacionEstadoBodegaDbRow } from "@/modules/warehouses/estado-bodega/types/estado-bodega.types";
import {
  buildTransferenciaDestinoOptions,
  buildTransferenciaSlotNumberById,
} from "./jefe-bodega-transferencia-modal.options";
import type { OrigenMeta } from "./jefe-bodega-transferencia-modal.types";

const ubicaciones = (rows: Array<[string, string, string | null]>) =>
  rows.map(([id_ubicacion, codigo, estado_slot]) => ({
    id_ubicacion,
    codigo,
    estado_slot,
  })) as unknown as UbicacionEstadoBodegaDbRow[];

describe("jefe-bodega-transferencia-modal.options", () => {
  it("numera por código cada zona de forma independiente", () => {
    const map = buildTransferenciaSlotNumberById(
      ubicaciones([["a2", "A-02", null], ["a1", "A-01", null]]),
      ubicaciones([["p1", "P-01", null]]),
    );
    expect(map.get("a1")).toBe(1);
    expect(map.get("a2")).toBe(2);
    expect(map.get("p1")).toBe(1);
  });

  it("deshabilita el casillero de origen en almacenamiento", () => {
    const origen: OrigenMeta = {
      idUbicacion: "a1",
      zona: "almacenamiento",
      rol: "normal",
      idSolicitud: null,
      idProducto: null,
      cantidad: null,
    };
    const options = buildTransferenciaDestinoOptions(
      ubicaciones([["a1", "A-01", "ocupado"], ["a2", "A-02", "libre"]]),
      origen,
    );
    expect(options[0]).toMatchObject({ disabled: true, subtitle: "Casillero de origen" });
    expect(options[1]).toMatchObject({ disabled: false, visual: "vacia" });
  });
});
