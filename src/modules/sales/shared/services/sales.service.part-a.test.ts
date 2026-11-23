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

  it("listOrdenesVenta consulta orden_venta con tenant", async () => {
    const { client, from, chain } = createSupabaseMock({ data: [] });
    setSupabaseClientForTests(client);

    await listOrdenesVenta({
      codigoCuenta: "CUENTA-01",
      idBodega: "BOD-01",
    });

    expect(from).toHaveBeenCalledWith("orden_venta");
    expect(chain.neq).toHaveBeenCalledWith("estado", "cancelada");
    expect(chain.eq).toHaveBeenCalledWith("codigo_cuenta", "CUENTA-01");
    expect(chain.eq).toHaveBeenCalledWith("id_bodega", "BOD-01");
    expect(chain.gte).toHaveBeenCalledWith(
      "created_at",
      getOrdersVisibleSinceDate(),
    );
    expect(chain.order).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });
    expect(chain.order).toHaveBeenCalledWith("id_orden_venta", {
      ascending: false,
    });
  });


  it("listOrdenesVentaOperador enriquece filas con comprador y productos", async () => {
    const ordenMock = createSupabaseMock({
      data: [
        {
          id_orden_venta: "ov-1",
          codigo_cuenta: "CUENTA-01",
          id_bodega: "BOD-01",
          id_cliente: "cli-1",
          id_comprador: "comp-1",
          id_planta: null,
          id_creador: null,
          id_bodega_destino: null,
          codigo: "OV-001",
          estado: "por_confirmar",
          fecha_pedido: "2026-06-28",
          observaciones: null,
          created_at: "2026-06-28T12:00:00.000Z",
          updated_at: "2026-06-28T12:00:00.000Z",
        },
      ],
    });
    const compradorMock = createSupabaseMock({
      data: [{ id_comprador: "comp-1", nombre: "Retail Norte" }],
    });
    const lineaMock = createSupabaseMock({
      data: [
        {
          id_orden_venta: "ov-1",
          id_producto: "prod-1",
          cantidad_pedida: 10,
          precio_unitario: 100,
        },
        {
          id_orden_venta: "ov-1",
          id_producto: "prod-2",
          cantidad_pedida: 5,
          precio_unitario: 200,
        },
      ],
    });

    const client = {
      from: vi.fn((table: string) => {
        if (table === "comprador") return compradorMock.chain;
        if (table === "orden_venta_linea") return lineaMock.chain;
        return ordenMock.chain;
      }),
    } as unknown as SupabaseClient;

    setSupabaseClientForTests(client);

    const rows = await listOrdenesVentaOperador({ codigoCuenta: "CUENTA-01" });

    expect(rows[0]?.venta).toBe("OV-001");
    expect(rows[0]?.comprador).toBe("Retail Norte");
    expect(rows[0]?.productos).toBe("2 productos");
    expect(rows[0]?.cantidadKg).toBe(15);
    expect(rows[0]?.total).toBe(2000);
  });


  it("listOrdenesVentaOperador ordena por fecha de creación, más reciente primero", async () => {
    const ordenMock = createSupabaseMock({
      data: [
        {
          id_orden_venta: "ov-old",
          codigo_cuenta: "CUENTA-01",
          id_bodega: "BOD-01",
          id_cliente: "cli-1",
          id_comprador: null,
          id_planta: null,
          id_creador: null,
          id_bodega_destino: null,
          codigo: "OV-OLD",
          estado: "por_confirmar",
          fecha_pedido: "2026-10-06",
          observaciones: null,
          created_at: "2026-10-02T10:00:00.000Z",
          updated_at: "2026-10-06T10:00:00.000Z",
        },
        {
          id_orden_venta: "ov-new",
          codigo_cuenta: "CUENTA-01",
          id_bodega: "BOD-01",
          id_cliente: "cli-1",
          id_comprador: null,
          id_planta: null,
          id_creador: null,
          id_bodega_destino: null,
          codigo: "OV-NEW",
          estado: "por_confirmar",
          fecha_pedido: "2026-10-02",
          observaciones: null,
          created_at: "2026-10-05T20:54:00.000Z",
          updated_at: "2026-10-05T20:54:00.000Z",
        },
      ],
    });
    const lineaMock = createSupabaseMock({ data: [] });
    const client = {
      from: vi.fn((table: string) => {
        if (table === "orden_venta_linea") return lineaMock.chain;
        return ordenMock.chain;
      }),
    } as unknown as SupabaseClient;

    setSupabaseClientForTests(client);

    const rows = await listOrdenesVentaOperador({ codigoCuenta: "CUENTA-01" });

    expect(rows.map((row) => row.venta)).toEqual(["OV-NEW", "OV-OLD"]);
  });


  it("listOrdenesVentaOperador pide lineas en tandas para no reventar el in de PostgREST", async () => {
    const ordenes = Array.from({ length: 81 }, (_, index) => ({
      id_orden_venta: `ov-${index + 1}`,
      codigo_cuenta: "CUENTA-01",
      id_bodega: "BOD-01",
      id_cliente: "cli-1",
      id_comprador: null,
      id_planta: null,
      id_creador: null,
      id_bodega_destino: null,
      codigo: `OV-${String(index + 1).padStart(3, "0")}`,
      estado: "por_confirmar",
      fecha_pedido: "2026-06-28",
      observaciones: null,
      created_at: "2026-06-28T12:00:00.000Z",
      updated_at: "2026-06-28T12:00:00.000Z",
    }));
    const ordenMock = createSupabaseMock({ data: ordenes });
    const lineaMock = createSupabaseMock({
      data: [{ id_orden_venta: "ov-1", cantidad_pedida: 1, precio_unitario: 10 }],
    });

    const client = {
      from: vi.fn((table: string) => {
        if (table === "orden_venta_linea") return lineaMock.chain;
        return ordenMock.chain;
      }),
    } as unknown as SupabaseClient;

    setSupabaseClientForTests(client);

    await listOrdenesVentaOperador({ codigoCuenta: "CUENTA-01" });

    expect(lineaMock.chain.in).toHaveBeenCalledTimes(2);
    expect(lineaMock.chain.in.mock.calls[0]?.[1]).toHaveLength(80);
    expect(lineaMock.chain.in.mock.calls[1]?.[1]).toHaveLength(1);
  });


  it("listProductosVentaCatalogo lista productos activos y suma stock de almacenamiento", async () => {
    const bodegaChain = createBodegaChain(["bod-1"]);
    const productoChain = createProductoCatalogoChain([
      {
        id_producto: "prod-1",
        sku: "FIL-01",
        descripcion: "Filete",
        id_cliente: "cli-1",
        metadatos_catalogo: { tipo_producto: 1 },
        esta_activo: true,
      },
    ]);
    const warehouseChain = createWarehouseChain([
      {
        id_producto: "prod-1",
        id_bodega: "bod-1",
        id_ubicacion: "ub-1",
        cantidad: "60",
        cantidad_reservada: "0",
        producto: {
          id_producto: "prod-1",
          sku: "FIL-01",
          descripcion: "Filete",
          id_cliente: "cli-1",
          metadatos_catalogo: { tipo_producto: 1 },
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
    const precioChain = createPrecioProductoChain([
      {
        id_producto: "prod-1",
        precio: "106.5700",
        fecha_aplicacion: "2026-07-11T00:38:27.036Z",
      },
    ]);

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

    expect(from).toHaveBeenCalledWith("producto");
    expect(from).toHaveBeenCalledWith("warehouse_state");
    expect(from).toHaveBeenCalledWith("precio_producto");
    expect(warehouseChain.in).toHaveBeenCalledWith("id_bodega", ["bod-1"]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.kgDisponible).toBe(60);
    expect(rows[0]?.idBodega).toBe("bod-1");
    expect(rows[0]?.codigo).toBe("FIL-01");
    expect(rows[0]?.nombre).toBe("Filete");
    expect(rows[0]?.precioUnitario).toBe(106.57);
    expect(rows[0]?.unidadMedida).toBe("kg");
  });


  it("listProductosVentaCatalogo excluye servicios (tipo_producto 3)", async () => {
    const bodegaChain = createBodegaChain(["bod-1"]);
    const productoChain = createProductoCatalogoChain([
      {
        id_producto: "prod-1",
        sku: "FIL-01",
        descripcion: "Filete",
        id_cliente: "cli-1",
        metadatos_catalogo: { tipo_producto: 1 },
        esta_activo: true,
      },
      {
        id_producto: "srv-1",
        sku: "5",
        descripcion: "ANTICIPO DEL BIEN O SERVICIO",
        id_cliente: null,
        metadatos_catalogo: { tipo_producto: 3 },
        esta_activo: true,
      },
    ]);
    const warehouseChain = createWarehouseChain([]);
    const ubicacionChain = createUbicacionChain([]);
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
    expect(rows[0]?.codigo).toBe("FIL-01");
  });

});
