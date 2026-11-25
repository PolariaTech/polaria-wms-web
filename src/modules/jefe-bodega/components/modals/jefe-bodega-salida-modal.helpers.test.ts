import { describe, expect, it } from "vitest";
import type { OrdenVentaOperadorRow } from "@/modules/sales";
import type { UbicacionEstadoBodegaDbRow } from "@/modules/warehouses/estado-bodega/types/estado-bodega.types";
import {
  buildSalidaDestinoOptions,
  formatOrdenVentaLabel,
  resolveOrdenFromList,
} from "./jefe-bodega-salida-modal.helpers";

const orden = (idOrdenVenta: string, venta: string) =>
  ({ idOrdenVenta, venta, comprador: "ACME" }) as unknown as OrdenVentaOperadorRow;

describe("jefe-bodega-salida-modal.helpers", () => {
  it("formatea la etiqueta de la orden de venta", () => {
    expect(formatOrdenVentaLabel(orden("1", "OV-1"))).toBe("OV-1 — ACME");
  });

  it("resuelve la orden por id y luego por código sin distinguir mayúsculas", () => {
    const rows = [orden("1", "OV-1"), orden("2", "OV-2")];
    expect(resolveOrdenFromList(rows, { idOrdenVenta: " 2 " })?.venta).toBe("OV-2");
    expect(resolveOrdenFromList(rows, { ovCodigo: "ov-1" })?.idOrdenVenta).toBe("1");
    expect(resolveOrdenFromList(rows, {})).toBeUndefined();
  });

  it("ordena los destinos por código y numera los slots", () => {
    const options = buildSalidaDestinoOptions([
      { id_ubicacion: "u2", codigo: "S-02", estado_slot: "libre" },
      { id_ubicacion: "u1", codigo: "S-01", estado_slot: "ocupado" },
    ] as unknown as UbicacionEstadoBodegaDbRow[]);

    expect(options.map((o) => o.id)).toEqual(["u1", "u2"]);
    expect(options[0]).toMatchObject({ slotNumber: 1, visual: "ocupada_primario" });
    expect(options[1]).toMatchObject({ slotNumber: 2, visual: "vacia", subtitle: "Zona salida · libre" });
  });
});
