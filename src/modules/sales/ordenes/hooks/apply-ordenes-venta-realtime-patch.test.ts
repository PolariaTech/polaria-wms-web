import { describe, expect, it } from "vitest";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import { applyOrdenVentaRealtimePatch } from "./apply-ordenes-venta-realtime-patch";

function fila(
  partial: Partial<OrdenVentaOperadorRow> & Pick<OrdenVentaOperadorRow, "idOrdenVenta">,
): OrdenVentaOperadorRow {
  return {
    venta: "OV-1",
    occ: "—",
    occTodas: [],
    cuenta: "C-1",
    comprador: "ACME",
    productos: "0",
    cantidadKg: 0,
    total: 0,
    estado: "confirmada",
    fecha: "2024-01-01T12:00:00.000Z",
    ordenesTrabajo: 0,
    destino: "—",
    idBodega: "b-1",
    idBodegaDestino: null,
    slaStatus: "en_tiempo",
    alertaStatus: "ok",
    minutosEnEstado: 0,
    slaMinutos: 60,
    alertaMinutos: 30,
    ...partial,
  };
}

describe("applyOrdenVentaRealtimePatch", () => {
  it("elimina una fila por id", () => {
    const rows = [
      fila({ idOrdenVenta: "a" }),
      fila({ idOrdenVenta: "b" }),
    ];
    const next = applyOrdenVentaRealtimePatch(rows, {
      type: "remove",
      idOrdenVenta: "a",
    });
    expect(next.map((r) => r.idOrdenVenta)).toEqual(["b"]);
  });

  it("hace upsert y ordena por fecha descendente", () => {
    const rows = [
      fila({ idOrdenVenta: "vieja", fecha: "2024-01-01T10:00:00.000Z" }),
    ];
    const nueva = fila({
      idOrdenVenta: "nueva",
      fecha: "2024-06-01T10:00:00.000Z",
    });
    const next = applyOrdenVentaRealtimePatch(rows, {
      type: "upsert",
      row: nueva,
    });
    expect(next.map((r) => r.idOrdenVenta)).toEqual(["nueva", "vieja"]);
  });

  it("reemplaza una fila existente sin duplicar", () => {
    const base = fila({
      idOrdenVenta: "x",
      venta: "OV-vieja",
      fecha: "2024-03-01T10:00:00.000Z",
    });
    const actualizada = fila({
      idOrdenVenta: "x",
      venta: "OV-nueva",
      fecha: "2024-03-01T10:00:00.000Z",
    });
    const next = applyOrdenVentaRealtimePatch([base], {
      type: "upsert",
      row: actualizada,
    });
    expect(next).toHaveLength(1);
    expect(next[0]?.venta).toBe("OV-nueva");
  });
});