import { describe, expect, it } from "vitest";
import type { OrdenVentaOperadorRow } from "../types/sales.types";
import { enrichOperadorListadoAnnotations } from "./enrich-operador-listado-annotations";

const PATH =
  '[{"nombre":"a.pdf","path":"c/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee-a.pdf"}]';

function mapped(
  partial: Partial<OrdenVentaOperadorRow> &
    Pick<OrdenVentaOperadorRow, "idOrdenVenta" | "venta">,
): OrdenVentaOperadorRow {
  return {
    occ: "—",
    occTodas: [],
    cuenta: "c",
    comprador: "Cliente",
    productos: "1",
    cantidadKg: 1,
    total: 1,
    estado: "por_confirmar",
    fecha: "2026-11-12",
    ordenesTrabajo: 1,
    destino: "—",
    idBodega: "b",
    idBodegaDestino: null,
    slaStatus: "ok",
    alertaStatus: "ok",
    minutosEnEstado: 0,
    slaMinutos: 60,
    alertaMinutos: 45,
    ...partial,
  };
}

describe("enrichOperadorListadoAnnotations (REQ-338)", () => {
  it("marca correo partido cuando dos filas comparten el envío", () => {
    const out = enrichOperadorListadoAnnotations(
      [
        mapped({ idOrdenVenta: "a", venta: "OV-1" }),
        mapped({ idOrdenVenta: "b", venta: "OV-2" }),
      ],
      [
        {
          id_orden_venta: "a",
          codigo: "OV-1",
          origen_archivos: PATH,
          estado: "por_confirmar",
        },
        {
          id_orden_venta: "b",
          codigo: "OV-2",
          origen_archivos: PATH,
          estado: "por_confirmar",
        },
      ],
    );
    expect(out[0]?.correoPartido).toBe(true);
    expect(out[0]?.correoPartidoDe).toEqual(["OV-2"]);
    expect(out[1]?.correoPartidoDe).toEqual(["OV-1"]);
  });
});
