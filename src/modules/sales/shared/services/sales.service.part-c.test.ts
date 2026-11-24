import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { createOrdenVenta } from "./sales.service";
import { createBodegaChain, createWarehouseChain, createUbicacionChain, createPrecioProductoChain } from "./sales.service.test-helpers";

describe("sales.service", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
  });

  it("createOrdenVenta persiste unidad_medida de la línea", async () => {
    const bodegaChain = createBodegaChain(["bod-1"]);
    const warehouseChain = createWarehouseChain([
      {
        id_producto: "prod-ltr",
        id_bodega: "bod-1",
        id_ubicacion: "ub-1",
        cantidad: "50",
        cantidad_reservada: "0",
        producto: {
          id_producto: "prod-ltr",
          sku: "JUGO-01",
          descripcion: "Jugo de limón",
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
          data: [{ id_producto: "prod-ltr" }],
          error: null,
        });
      }
      return Promise.resolve({
        data: [{ id_producto: "prod-ltr", id_cliente: "cli-1" }],
        error: null,
      });
    });

    const precioChain = createPrecioProductoChain([
      {
        id_producto: "prod-ltr",
        precio: "70",
        fecha_aplicacion: "2026-07-11T00:38:27.036Z",
      },
    ]);

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
        id_orden_venta: "ov-ltr",
        codigo_cuenta: "CUENTA-01",
        id_bodega: "bod-1",
        id_cliente: "cli-1",
        id_comprador: "comp-1",
        id_planta: null,
        id_creador: null,
        id_bodega_destino: null,
        codigo: "OV-00000011",
        estado: "por_confirmar",
        fecha_pedido: "2026-06-28",
        observaciones: null,
        created_at: "2026-06-28T12:00:00.000Z",
        updated_at: "2026-06-28T12:00:00.000Z",
      },
      error: null,
    });

    const lineaInsertChain = {
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

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

    await createOrdenVenta({
      codigoCuenta: "CUENTA-01",
      idBodega: "bod-1",
      idComprador: "comp-1",
      lineas: [
        {
          idProducto: "prod-ltr",
          cantidadPedida: 5,
          precioUnitario: 70,
          unidadMedida: "LTR",
        },
      ],
    });

    expect(lineaInsertChain.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        id_orden_venta: "ov-ltr",
        id_producto: "prod-ltr",
        unidad_medida: "LTR",
      }),
    ]);
  });

});
