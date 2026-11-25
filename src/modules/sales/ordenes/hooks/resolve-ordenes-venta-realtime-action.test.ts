import { describe, expect, it } from "vitest";
import type { OrdenVentaRealtimePostgresPayload } from "../../shared/hooks/ordenes-venta-realtime.types";
import { resolveOrdenVentaRealtimeAction } from "./resolve-ordenes-venta-realtime-action";

function payload(
  partial: Partial<OrdenVentaRealtimePostgresPayload>,
): OrdenVentaRealtimePostgresPayload {
  return {
    eventType: "UPDATE",
    table: "orden_venta",
    new: {},
    old: {},
    ...partial,
  };
}

describe("resolveOrdenVentaRealtimeAction", () => {
  it("pide recarga completa en cambios de línea", () => {
    expect(
      resolveOrdenVentaRealtimeAction(
        payload({ table: "orden_venta_linea", eventType: "INSERT" }),
        "C-1",
      ),
    ).toEqual({ kind: "reload" });
  });

  it("ignora eventos de otra cuenta", () => {
    expect(
      resolveOrdenVentaRealtimeAction(
        payload({
          new: { codigo_cuenta: "OTRA", id_orden_venta: "ov-1" },
        }),
        "C-1",
      ),
    ).toEqual({ kind: "ignore" });
  });

  it("DELETE genera patch de eliminación", () => {
    expect(
      resolveOrdenVentaRealtimeAction(
        payload({
          eventType: "DELETE",
          old: { id_orden_venta: "ov-del" },
        }),
        "C-1",
      ),
    ).toEqual({
      kind: "patch",
      event: { type: "remove", idOrdenVenta: "ov-del" },
    });
  });

  it("estado cancelada genera patch de eliminación", () => {
    expect(
      resolveOrdenVentaRealtimeAction(
        payload({
          new: {
            codigo_cuenta: "C-1",
            id_orden_venta: "ov-x",
            estado: "cancelada",
          },
        }),
        "C-1",
      ),
    ).toEqual({
      kind: "patch",
      event: { type: "remove", idOrdenVenta: "ov-x" },
    });
  });

  it("INSERT/UPDATE con id pide fetch puntual", () => {
    expect(
      resolveOrdenVentaRealtimeAction(
        payload({
          eventType: "INSERT",
          new: {
            codigo_cuenta: "C-1",
            id_orden_venta: "ov-nueva",
            estado: "por_confirmar",
          },
        }),
        "C-1",
      ),
    ).toEqual({ kind: "fetch", idOrdenVenta: "ov-nueva" });
  });
});