import { describe, expect, it } from "vitest";
import type { OrdenVentaLineaDetalleDbRow } from "./sales-orden-venta.db";
import {
  getOrdenVentaDetalle,
  ordenarLineasPorPosicion,
} from "./sales-orden-venta-detalle.service";

function linea(
  id: string,
  posicion?: number | null,
): OrdenVentaLineaDetalleDbRow {
  return {
    id_linea_orden_venta: id,
    id_producto: `producto-${id}`,
    cantidad_pedida: 1,
    precio_unitario: 1,
    producto: null,
    ...(posicion === undefined ? {} : { posicion }),
  };
}

const ids = (lineas: readonly OrdenVentaLineaDetalleDbRow[]) =>
  lineas.map((fila) => fila.id_linea_orden_venta);

describe("sales-orden-venta-detalle.service", () => {
  it("getOrdenVentaDetalle rechaza id vacío", async () => {
    await expect(
      getOrdenVentaDetalle({ codigoCuenta: "CTA", idOrdenVenta: "  " }),
    ).rejects.toMatchObject({ message: "La orden de venta no es válida." });
  });

  describe("ordenarLineasPorPosicion (REQ-370)", () => {
    it("ordena por posicion aunque lleguen mezcladas (el orden de la OC)", () => {
      const llegada = [linea("pina", 1), linea("limon", 0), linea("papaya", 2)];

      expect(ids(ordenarLineasPorPosicion(llegada))).toEqual(["limon", "pina", "papaya"]);
    });

    it("las líneas sin posicion van al final y conservan su orden de llegada", () => {
      const llegada = [
        linea("vieja-b", null),
        linea("nueva-1", 1),
        linea("vieja-a"),
        linea("nueva-0", 0),
      ];

      expect(ids(ordenarLineasPorPosicion(llegada))).toEqual([
        "nueva-0",
        "nueva-1",
        "vieja-b",
        "vieja-a",
      ]);
    });

    it("con la misma posicion respeta el orden de llegada", () => {
      const llegada = [linea("a", 0), linea("b", 0)];

      expect(ids(ordenarLineasPorPosicion(llegada))).toEqual(["a", "b"]);
    });

    it("no modifica la lista recibida", () => {
      const llegada = [linea("b", 1), linea("a", 0)];

      ordenarLineasPorPosicion(llegada);

      expect(ids(llegada)).toEqual(["b", "a"]);
    });
  });
});
