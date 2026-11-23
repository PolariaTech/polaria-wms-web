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
  createProductoCatalogoChain,
} from "./sales.service.test-helpers";

describe("sales.service", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
  });

  it("listProductosVentaCatalogo incluye productos sin stock usable (kg 0)", async () => {
    const bodegaChain = createBodegaChain(["bod-1"]);
    const productoChain = createProductoCatalogoChain([
      {
        id_producto: "prod-1",
        sku: "IOZ7Z",
        descripcion: "HPR FROZEN-PORK RACKS",
        id_cliente: "cli-1",
        metadatos_catalogo: { tipo_producto: 1 },
        esta_activo: true,
      },
    ]);
    const warehouseChain = createWarehouseChain([
      {
        id_producto: "prod-1",
        id_bodega: "bod-1",
        id_ubicacion: "ub-sal",
        cantidad: "60",
        cantidad_reservada: "0",
        producto: {
          id_producto: "prod-1",
          sku: "IOZ7Z",
          descripcion: "HPR FROZEN-PORK RACKS",
          id_cliente: "cli-1",
          metadatos_catalogo: { tipo_producto: 1 },
        },
      },
    ]);
    const ubicacionChain = createUbicacionChain([
      {
        id_ubicacion: "ub-sal",
        id_bodega: "bod-1",
        tipo_ubicacion: {
          codigo: "salida",
          es_recepcion: false,
          es_almacenamiento: false,
          es_picking: true,
        },
      },
      {
        id_ubicacion: "ub-alm",
        id_bodega: "bod-1",
        tipo_ubicacion: {
          codigo: "almacen",
          es_recepcion: false,
          es_almacenamiento: true,
          es_picking: false,
        },
      },
    ]);
    const precioChain = createPrecioProductoChain([]);

    const from = vi.fn((table: string) => {
      if (table === "bodega") return bodegaChain;
      if (table === "producto") return productoChain;
      if (table === "warehouse_state") return warehouseChain;
      if (table === "ubicacion") return ubicacionChain;
      if (table === "precio_producto") return precioChain;
      throw new Error(`unexpected table ${table}`);
    });

    setSupabaseClientForTests({ from } as never);

    const rows = await listProductosVentaCatalogo({ codigoCuenta: "CUENTA-01" });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.kgDisponible).toBe(0);
    expect(rows[0]?.codigo).toBe("IOZ7Z");
  });

  it("createOrdenVenta inserta OV por_confirmar y una línea", async () => {
    const bodegaChain = createBodegaChain(["bod-1"]);
    const warehouseChain = createWarehouseChain([
      {
        id_producto: "prod-1",
        id_bodega: "bod-1",
        id_ubicacion: "ub-1",
        cantidad: "50",
        cantidad_reservada: "0",
        producto: {
          id_producto: "prod-1",
          sku: "FIL-01",
          descripcion: "Filete",
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
          data: [{ id_producto: "prod-1" }],
          error: null,
        });
      }

      return Promise.resolve({
        data: [{ id_producto: "prod-1", id_cliente: "cli-1" }],
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
      data: [{ codigo: "OV-LEGACY" }, { codigo: "OV-00000003" }],
      error: null,
    });
    ordenChain.insert.mockReturnValue(ordenChain);
    ordenChain.single.mockResolvedValue({
      data: {
        id_orden_venta: "ov-new",
        codigo_cuenta: "CUENTA-01",
        id_bodega: "bod-1",
        id_cliente: "cli-1",
        id_comprador: "comp-1",
        id_planta: null,
        id_creador: "usr-1",
        id_bodega_destino: null,
        codigo: "OV-00000004",
        estado: "por_confirmar",
        fecha_pedido: "2026-06-28",
        observaciones: "Nota",
        created_at: "2026-06-28T12:00:00.000Z",
        updated_at: "2026-06-28T12:00:00.000Z",
      },
      error: null,
    });

    const lineaInsertChain = {
      insert: vi.fn(),
    };
    lineaInsertChain.insert.mockResolvedValue({ data: null, error: null });

    const precioChain = createPrecioProductoChain([
      {
        id_producto: "prod-1",
        precio: "106.5700",
        fecha_aplicacion: "2026-07-11T00:38:27.036Z",
      },
    ]);

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

    const row = await createOrdenVenta({
      codigoCuenta: "CUENTA-01",
      idBodega: "bod-1",
      idBodegaDestino: "bod-dest",
      idComprador: "comp-1",
      idProducto: "prod-1",
      observaciones: "Nota",
      idCreador: "usr-1",
    });

    expect(ordenChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id_bodega_destino: "bod-dest",
        estado: "por_confirmar",
        // Trigger de BD genera OV-########; app manda vacío (como el bot).
        codigo: "",
      }),
    );

    expect(row.venta).toBe("OV-00000004");
    expect(lineaInsertChain.insert).toHaveBeenCalledWith([
      {
        id_orden_venta: "ov-new",
        id_producto: "prod-1",
        cantidad_pedida: 1,
        precio_unitario: 106.57,
        cajas: null,
        presentacion: null,
        unidad_medida: null,
        match_producto: null,
      },
    ]);
  });

});
