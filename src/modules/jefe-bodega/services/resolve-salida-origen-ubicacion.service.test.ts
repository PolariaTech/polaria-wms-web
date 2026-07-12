import { describe, expect, it } from "vitest";
import type { OrdenVentaDetalleRow } from "@/modules/sales/shared/types/sales.types";
import {
  pickMejorUbicacionStockParaVenta,
  resolveOrigenDesdeStockAlmacenamiento,
  scoreUbicacionStockParaVenta,
} from "./resolve-salida-origen-ubicacion.service";

const ORDEN: OrdenVentaDetalleRow = {
  id_orden_venta: "ov-1",
  codigo_cuenta: "CUENTA",
  id_bodega: "b1",
  id_cliente: "c1",
  id_comprador: null,
  id_planta: null,
  id_creador: null,
  id_bodega_destino: null,
  codigo: "OV-20260709-160103",
  estado: "confirmada",
  fecha_pedido: "2026-07-09T12:00:00.000Z",
  observaciones: null,
  created_at: "2026-07-09T12:00:00.000Z",
  updated_at: "2026-07-09T12:00:00.000Z",
  comprador_nombre: null,
  comprador_codigo: null,
  bodega_nombre: null,
  bodega_destino_nombre: null,
  lineas: [
    {
      id_linea_orden_venta: "line-1",
      id_producto: "prod-1",
      cantidad_pedida: 10,
      precio_unitario: 1000,
      producto: null,
    },
  ],
};

describe("resolve-salida-origen-ubicacion", () => {
  it("prefiere slot con reserva que cubre la cantidad pedida", () => {
    const cantidadPedida = new Map([["prod-1", 10]]);

    expect(
      pickMejorUbicacionStockParaVenta(
        [
          {
            id_ubicacion: "ub-1",
            id_producto: "prod-1",
            cantidad: "60",
            cantidad_reservada: "0",
          },
          {
            id_ubicacion: "ub-2",
            id_producto: "prod-1",
            cantidad: "60",
            cantidad_reservada: "10",
          },
        ],
        cantidadPedida,
      ),
    ).toBe("ub-2");
  });

  it("elige slot 2 aunque exista stock sin reserva en slot 1", () => {
    const almacen = new Set(["ub-1", "ub-2"]);

    expect(
      resolveOrigenDesdeStockAlmacenamiento(
        [
          {
            id_ubicacion: "ub-1",
            id_producto: "prod-1",
            cantidad: "50",
            cantidad_reservada: "0",
          },
          {
            id_ubicacion: "ub-2",
            id_producto: "prod-1",
            cantidad: "60",
            cantidad_reservada: "10",
          },
        ],
        ORDEN,
        almacen,
      ),
    ).toBe("ub-2");
  });

  it("puntúa mejor la reserva exacta de la OV", () => {
    const scoreExacta = scoreUbicacionStockParaVenta(
      {
        id_ubicacion: "ub-2",
        id_producto: "prod-1",
        cantidad: "60",
        cantidad_reservada: "10",
      },
      10,
    );
    const scoreParcial = scoreUbicacionStockParaVenta(
      {
        id_ubicacion: "ub-1",
        id_producto: "prod-1",
        cantidad: "60",
        cantidad_reservada: "5",
      },
      10,
    );

    expect(scoreExacta).toBeGreaterThan(scoreParcial);
  });
});
