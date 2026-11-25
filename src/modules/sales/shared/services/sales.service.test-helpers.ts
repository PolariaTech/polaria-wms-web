import { vi } from "vitest";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";

export function createBodegaChain(ids: string[]) {
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

export function createWarehouseChain(rows: Record<string, unknown>[]) {
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

export function createUbicacionChain(rows: Record<string, unknown>[]) {
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

export function createPrecioProductoChain(rows: Record<string, unknown>[]) {
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

export function createProductoCatalogoChain(rows: Record<string, unknown>[]) {
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

export const ORDEN_VENTA_BASE_ROW = {
  id_orden_venta: "ov-1",
  codigo_cuenta: "CUENTA-01",
  id_bodega: "bod-1",
  id_cliente: "cli-1",
  id_comprador: "comp-1",
  id_planta: null,
  id_creador: "usr-1",
  id_bodega_destino: "bod-dest",
  codigo: "OV-001",
  estado: "confirmada",
  fecha_pedido: "2026-06-28",
  observaciones: "Nota",
  created_at: "2026-06-28T12:00:00.000Z",
  updated_at: "2026-06-28T12:00:00.000Z",
};

export function mockUpdateOrdenVentaDeps(existingEstado: string) {
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

  const existingSelectChain = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  };
  existingSelectChain.select.mockReturnValue(existingSelectChain);
  existingSelectChain.eq.mockReturnValue(existingSelectChain);
  existingSelectChain.maybeSingle.mockResolvedValue({
    data: { estado: existingEstado },
    error: null,
  });

  const ordenUpdateChain = {
    update: vi.fn(),
    eq: vi.fn(),
    select: vi.fn(),
    single: vi.fn(),
  };
  ordenUpdateChain.update.mockReturnValue(ordenUpdateChain);
  ordenUpdateChain.eq.mockReturnValue(ordenUpdateChain);
  ordenUpdateChain.select.mockReturnValue(ordenUpdateChain);
  ordenUpdateChain.single.mockResolvedValue({
    data: { ...ORDEN_VENTA_BASE_ROW, estado: existingEstado },
    error: null,
  });

  const lineaDeleteChain = {
    delete: vi.fn(),
    eq: vi.fn(),
  };
  lineaDeleteChain.delete.mockReturnValue(lineaDeleteChain);
  lineaDeleteChain.eq.mockResolvedValue({ data: null, error: null });

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

  let ordenVentaCalls = 0;
  let lineaCalls = 0;
  const from = vi.fn((table: string) => {
    if (table === "bodega") return bodegaChain;
    if (table === "comprador") return compradorChain;
    if (table === "producto") return productoChain;
    if (table === "precio_producto") return precioChain;
    if (table === "orden_venta") {
      ordenVentaCalls += 1;
      return ordenVentaCalls === 1 ? existingSelectChain : ordenUpdateChain;
    }
    if (table === "orden_venta_linea") {
      lineaCalls += 1;
      return lineaCalls === 1 ? lineaDeleteChain : lineaInsertChain;
    }
    throw new Error(`unexpected table ${table}`);
  });

  setSupabaseClientForTests({ from } as never);

  return {
    existingSelectChain,
    ordenUpdateChain,
    lineaDeleteChain,
    lineaInsertChain,
  };
}
