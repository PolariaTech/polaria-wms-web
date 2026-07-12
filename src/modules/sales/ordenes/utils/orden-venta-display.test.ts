import { describe, expect, it } from "vitest";
import type { OrdenVentaDetalleRow } from "../../shared/types/sales.types";
import {
  formatOrdenVentaTotal,
  sumOrdenVentaCantidadKg,
} from "./orden-venta-display";

const ORDEN: OrdenVentaDetalleRow = {
  id_orden_venta: "ov-1",
  codigo_cuenta: "CUENTA-01",
  id_bodega: "bod-1",
  id_cliente: "cli-1",
  id_comprador: "comp-1",
  id_planta: null,
  id_creador: null,
  id_bodega_destino: null,
  codigo: "OV-001",
  estado: "borrador",
  fecha_pedido: "2026-06-28",
  observaciones: null,
  created_at: "2026-06-28T12:00:00.000Z",
  updated_at: "2026-06-28T12:00:00.000Z",
  comprador_nombre: "Edgar Escobar",
  comprador_codigo: "3Q12U",
  bodega_nombre: "Bodega central",
  bodega_destino_nombre: null,
  lineas: [
    {
      id_linea_orden_venta: "line-1",
      id_producto: "prod-1",
      cantidad_pedida: 10,
      precio_unitario: 1000,
      producto: {
        sku: "IOZ7Z",
        descripcion: "Pork racks",
        metadatos_catalogo: { titulo: "HPR FROZEN-PORK RACKS" },
      },
    },
  ],
};

describe("orden-venta-display", () => {
  it("suma cantidad y total de la orden", () => {
    expect(sumOrdenVentaCantidadKg(ORDEN)).toBe(10);
    expect(formatOrdenVentaTotal(ORDEN)).toBe("$10.000");
  });
});
