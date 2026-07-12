import { describe, expect, it } from "vitest";
import type { OrdenVentaDetalleRow } from "@/modules/sales/shared/types/sales.types";
import { resolveSalidaProductoDesdeOrden } from "./salida-orden-venta";

const ORDEN: OrdenVentaDetalleRow = {
  id_orden_venta: "ov-1",
  codigo_cuenta: "CUENTA",
  id_bodega: "b1",
  id_cliente: "c1",
  id_comprador: null,
  id_planta: null,
  id_creador: null,
  id_bodega_destino: null,
  codigo: "OV-001",
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

describe("salida-orden-venta", () => {
  it("usa cantidad pedida de la línea de venta", () => {
    expect(resolveSalidaProductoDesdeOrden(ORDEN)).toEqual({
      idProducto: "prod-1",
      cantidad: 10,
    });
  });
});
