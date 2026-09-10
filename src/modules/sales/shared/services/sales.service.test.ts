import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getOrdersVisibleSinceDate,
  setSupabaseClientForTests,
} from "@/lib/supabase/domain-query";
import { createSupabaseMock } from "@/test/create-supabase-mock";
import {
  createOrdenVenta,
  getOrdenVentaDetalle,
  listOrdenesVenta,
  listOrdenesVentaOperador,
  listProductosVentaCatalogo,
} from "./sales.service";

function createBodegaChain(ids: string[]) {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
  };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.limit.mockResolvedValue({
    data: ids.map((id_bodega) => ({ id_bodega })),
    error: null,
  });
  return chain;
}

function createWarehouseChain(rows: Record<string, unknown>[]) {
  const chain = {
    select: vi.fn(),
    in: vi.fn(),
    eq: vi.fn(),
    limit: vi.fn(),
  };
  chain.select.mockReturnValue(chain);
  chain.in.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.limit.mockResolvedValue({ data: rows, error: null });
  return chain;
}

function createUbicacionChain(rows: Record<string, unknown>[]) {
  const chain = {
    select: vi.fn(),
    in: vi.fn(),
    eq: vi.fn(),
    limit: vi.fn(),
  };
  chain.select.mockReturnValue(chain);
  chain.in.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.limit.mockResolvedValue({ data: rows, error: null });
  return chain;
}

function createPrecioProductoChain(rows: Record<string, unknown>[]) {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
  };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.in.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.limit.mockResolvedValue({ data: rows, error: null });
  return chain;
}

function createProductoCatalogoChain(rows: Record<string, unknown>[]) {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
  };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.limit.mockResolvedValue({ data: rows, error: null });
  return chain;
}

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
    expect(chain.eq).toHaveBeenCalledWith("codigo_cuenta", "CUENTA-01");
    expect(chain.eq).toHaveBeenCalledWith("id_bodega", "BOD-01");
    expect(chain.gte).toHaveBeenCalledWith(
      "fecha_pedido",
      getOrdersVisibleSinceDate(7),
    );
    expect(chain.order).toHaveBeenCalledWith("fecha_pedido", {
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
          estado: "borrador",
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
      estado: "borrador",
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
    expect(lineaMock.chain.in.mock.calls[1]?.[1]).toEqual(["ov-81"]);
  });

  it("listProductosVentaCatalogo lista productos activos y suma stock de almacenamiento", async () => {
    const bodegaChain = createBodegaChain(["bod-1"]);
    const productoChain = createProductoCatalogoChain([
      {
        id_producto: "prod-1",
        sku: "FIL-01",
        descripcion: "Filete",
        id_cliente: "cli-1",
        metadatos_catalogo: null,
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
    expect(rows[0]?.precioUnitario).toBe(106.57);
  });

  it("listProductosVentaCatalogo incluye productos sin stock usable (kg 0)", async () => {
    const bodegaChain = createBodegaChain(["bod-1"]);
    const productoChain = createProductoCatalogoChain([
      {
        id_producto: "prod-1",
        sku: "IOZ7Z",
        descripcion: "HPR FROZEN-PORK RACKS",
        id_cliente: "cli-1",
        metadatos_catalogo: null,
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
          metadatos_catalogo: null,
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
  it("createOrdenVenta inserta OV borrador y una línea", async () => {
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

    const ordenInsertChain = {
      insert: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    };
    ordenInsertChain.insert.mockReturnValue(ordenInsertChain);
    ordenInsertChain.select.mockReturnValue(ordenInsertChain);
    ordenInsertChain.single.mockResolvedValue({
      data: {
        id_orden_venta: "ov-new",
        codigo_cuenta: "CUENTA-01",
        id_bodega: "bod-1",
        id_cliente: "cli-1",
        id_comprador: "comp-1",
        id_planta: null,
        id_creador: "usr-1",
        id_bodega_destino: null,
        codigo: "OV-001",
        estado: "borrador",
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
      if (table === "orden_venta") return ordenInsertChain;
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

    expect(ordenInsertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id_bodega_destino: "bod-dest",
        estado: "borrador",
      }),
    );

    expect(row.venta).toBe("OV-001");
    expect(lineaInsertChain.insert).toHaveBeenCalledWith([
      {
        id_orden_venta: "ov-new",
        id_producto: "prod-1",
        cantidad_pedida: 1,
        precio_unitario: 106.57,
      },
    ]);
  });

  it("createOrdenVenta permite cantidad mayor al stock disponible", async () => {
    const bodegaChain = createBodegaChain(["bod-1"]);

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

    const ordenInsertChain = {
      insert: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    };
    ordenInsertChain.insert.mockReturnValue(ordenInsertChain);
    ordenInsertChain.select.mockReturnValue(ordenInsertChain);
    ordenInsertChain.single.mockResolvedValue({
      data: {
        id_orden_venta: "ov-over",
        codigo_cuenta: "CUENTA-01",
        id_bodega: "bod-1",
        id_cliente: "cli-1",
        id_comprador: "comp-1",
        id_planta: null,
        id_creador: null,
        id_bodega_destino: "bod-dest",
        codigo: "OV-OVER",
        estado: "borrador",
        fecha_pedido: "2026-06-28",
        observaciones: null,
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
        precio: "10",
        fecha_aplicacion: "2026-07-11T00:38:27.036Z",
      },
    ]);

    const from = vi.fn((table: string) => {
      if (table === "bodega") return bodegaChain;
      if (table === "comprador") return compradorChain;
      if (table === "producto") return productoChain;
      if (table === "precio_producto") return precioChain;
      if (table === "orden_venta") return ordenInsertChain;
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
      cantidadPedida: 25,
    });

    expect(row.venta).toBe("OV-OVER");
    expect(lineaInsertChain.insert).toHaveBeenCalledWith([
      {
        id_orden_venta: "ov-over",
        id_producto: "prod-1",
        cantidad_pedida: 25,
        precio_unitario: 10,
      },
    ]);
  });

  it("getOrdenVentaDetalle devuelve orden con líneas y comprador", async () => {
    const ordenChain = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn(),
    };
    ordenChain.select.mockReturnValue(ordenChain);
    ordenChain.eq.mockReturnValue(ordenChain);
    ordenChain.maybeSingle.mockResolvedValue({
      data: {
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
        observaciones: "Nota",
        created_at: "2026-06-28T12:00:00.000Z",
        updated_at: "2026-06-28T12:00:00.000Z",
        comprador: { nombre: "Edgar Escobar", codigo: "3Q12U" },
        orden_venta_linea: [
          {
            id_linea_orden_venta: "line-1",
            id_producto: "prod-1",
            cantidad_pedida: "10",
            precio_unitario: "1000",
            producto: {
              sku: "IOZ7Z",
              descripcion: "Pork racks",
              metadatos_catalogo: { titulo: "HPR FROZEN-PORK RACKS" },
            },
          },
        ],
      },
      error: null,
    });

    const bodegaChain = {
      select: vi.fn(),
      in: vi.fn(),
      limit: vi.fn(),
    };
    bodegaChain.select.mockReturnValue(bodegaChain);
    bodegaChain.in.mockReturnValue(bodegaChain);
    bodegaChain.limit.mockResolvedValue({
      data: [{ id_bodega: "bod-1", nombre: "Bodega central" }],
      error: null,
    });

    const from = vi.fn((table: string) => {
      if (table === "orden_venta") return ordenChain;
      if (table === "bodega") return bodegaChain;
      throw new Error(`unexpected table ${table}`);
    });

    setSupabaseClientForTests({ from } as never);

    const detalle = await getOrdenVentaDetalle({
      codigoCuenta: "CUENTA-01",
      idOrdenVenta: "ov-1",
    });

    expect(detalle.codigo).toBe("OV-001");
    expect(detalle.comprador_nombre).toBe("Edgar Escobar");
    expect(detalle.lineas).toHaveLength(1);
    expect(detalle.lineas[0]?.cantidad_pedida).toBe(10);
    expect(detalle.lineas[0]?.precio_unitario).toBe(1000);
    expect(detalle.bodega_nombre).toBe("Bodega central");
  });
});
