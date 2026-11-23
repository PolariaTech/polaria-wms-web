import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getOrdersVisibleSinceDate,
  setSupabaseClientForTests,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { createSupabaseMock } from "@/test/create-supabase-mock";
import {
  avanzarEstadoOrdenVenta,
  borrarOrdenVenta,
  createOrdenVenta,
  getOrdenVentaDetalle,
  listOrdenesVenta,
  listOrdenesVentaOperador,
  listProductosVentaCatalogo,
  updateOrdenVenta,
} from "./sales.service";
import {
  createBodegaChain,
  createWarehouseChain,
  createUbicacionChain,
  createPrecioProductoChain,
} from "./sales.service.test-helpers";

describe("sales.service", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
  });

  it("createOrdenVenta persiste match_producto en la línea", async () => {
    const bodegaChain = createBodegaChain(["bod-1"]);
    const warehouseChain = createWarehouseChain([
      {
        id_producto: "prod-2",
        id_bodega: "bod-1",
        id_ubicacion: "ub-1",
        cantidad: "50",
        cantidad_reservada: "0",
        producto: {
          id_producto: "prod-2",
          sku: "SKU-P",
          descripcion: "Aguacate Hass Primera",
          id_cliente: "cli-1",
          metadatos_catalogo: null,
        },
      },
    ]);
    const ubicacionChain = createUbicacionChain([
      {
        id_ubicacion: "ub-1",
        id_bodega: "bod-1",
        tipo_ubicacion: {
          codigo: "almacen",
          es_recepcion: false,
          es_almacenamiento: true,
          es_picking: false,
        },
      },
    ]);

    const compradorChain = {
      select: vi.fn(),
      eq: vi.fn(),
      in: vi.fn(),
      limit: vi.fn(),
    };
    compradorChain.select.mockReturnValue(compradorChain);
    compradorChain.eq.mockReturnValue(compradorChain);
    compradorChain.in.mockReturnValue(compradorChain);
    compradorChain.limit.mockImplementation(function (this: typeof compradorChain) {
      if (compradorChain.in.mock.calls.length > 0) {
        return Promise.resolve({
          data: [{ id_comprador: "comp-1", nombre: "Retail Norte" }],
          error: null,
        });
      }
      return Promise.resolve({
        data: [{ id_comprador: "comp-1" }],
        error: null,
      });
    });

    const productoChain = {
      select: vi.fn(),
      eq: vi.fn(),
      in: vi.fn(),
      limit: vi.fn(),
    };
    productoChain.select.mockReturnValue(productoChain);
    productoChain.eq.mockReturnValue(productoChain);
    productoChain.in.mockReturnValue(productoChain);
    productoChain.limit.mockImplementation(function (this: typeof productoChain) {
      if (productoChain.in.mock.calls.length > 0) {
        return Promise.resolve({
          data: [{ id_producto: "prod-2" }],
          error: null,
        });
      }
      return Promise.resolve({
        data: [{ id_producto: "prod-2", id_cliente: "cli-1" }],
        error: null,
      });
    });

    const ordenChain = {
      select: vi.fn(),
      eq: vi.fn(),
      limit: vi.fn(),
      insert: vi.fn(),
      single: vi.fn(),
    };
    ordenChain.select.mockReturnValue(ordenChain);
    ordenChain.eq.mockReturnValue(ordenChain);
    ordenChain.limit.mockResolvedValue({
      data: [{ codigo: "OV-00000010" }],
      error: null,
    });
    ordenChain.insert.mockReturnValue(ordenChain);
    ordenChain.single.mockResolvedValue({
      data: {
        id_orden_venta: "ov-match",
        codigo_cuenta: "CUENTA-01",
        id_bodega: "bod-1",
        id_cliente: "cli-1",
        id_comprador: "comp-1",
        id_planta: null,
        id_creador: null,
        id_bodega_destino: null,
        codigo: "OV-00000011",
        estado: "por_confirmar",
        fecha_pedido: "2026-10-08",
        observaciones: null,
        created_at: "2026-10-08T12:00:00.000Z",
        updated_at: "2026-10-08T12:00:00.000Z",
      },
      error: null,
    });

    const lineaInsertChain = { insert: vi.fn() };
    lineaInsertChain.insert.mockResolvedValue({ data: null, error: null });
    const precioChain = createPrecioProductoChain([]);

    const from = vi.fn((table: string) => {
      if (table === "bodega") return bodegaChain;
      if (table === "warehouse_state") return warehouseChain;
      if (table === "ubicacion") return ubicacionChain;
      if (table === "comprador") return compradorChain;
      if (table === "producto") return productoChain;
      if (table === "precio_producto") return precioChain;
      if (table === "orden_venta") return ordenChain;
      if (table === "orden_venta_linea") return lineaInsertChain;
      throw new Error(`unexpected table ${table}`);
    });
    setSupabaseClientForTests({ from } as never);

    const matchProducto = {
      textoCliente: "AGUACATE JASS",
      sugeridoMateo: {
        idProducto: "sug-1",
        nombre: "Aguacate Hass Extra",
        codigo: "SKU-E",
      },
      elegidoUsuario: {
        idProducto: "prod-2",
        nombre: "Aguacate Hass Primera",
        codigo: "SKU-P",
      },
    };

    await createOrdenVenta({
      codigoCuenta: "CUENTA-01",
      idBodega: "bod-1",
      idComprador: "comp-1",
      lineas: [
        {
          idProducto: "prod-2",
          cantidadPedida: 10,
          precioUnitario: 78,
          matchProducto,
        },
      ],
    });

    expect(lineaInsertChain.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        id_orden_venta: "ov-match",
        id_producto: "prod-2",
        match_producto: matchProducto,
      }),
    ]);
  });

});
