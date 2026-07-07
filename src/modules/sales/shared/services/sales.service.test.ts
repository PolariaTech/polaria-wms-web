import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { createSupabaseMock } from "@/test/create-supabase-mock";
import {
  createOrdenVenta,
  listOrdenesVenta,
  listOrdenesVentaOperador,
  listProductosVentaCatalogo,
} from "./sales.service";

describe("sales.service", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
    vi.restoreAllMocks();
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
        { id_orden_venta: "ov-1", id_producto: "prod-1" },
        { id_orden_venta: "ov-1", id_producto: "prod-2" },
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
    expect(rows[0]?.cuenta).toBe("CUENTA-01");
    expect(rows[0]?.comprador).toBe("Retail Norte");
    expect(rows[0]?.productos).toBe("2 productos");
    expect(rows[0]?.destino).toBe("—");
  });

  it("listProductosVentaCatalogo consulta producto activo sin metadatos", async () => {
    const { client, from } = createSupabaseMock({
      data: [
        {
          id_producto: "prod-1",
          descripcion: "Filete",
          sku: "FIL-01",
          id_cliente: "cli-1",
        },
      ],
    });
    setSupabaseClientForTests(client);

    const rows = await listProductosVentaCatalogo("CUENTA-01");

    expect(from).toHaveBeenCalledWith("producto");
    expect(rows[0]?.label).toContain("Filete");
    expect(rows[0]?.idCliente).toBe("cli-1");
  });

  it("createOrdenVenta inserta OV borrador y una línea", async () => {
    const bodegaChain = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
    };
    bodegaChain.select.mockReturnValue(bodegaChain);
    bodegaChain.eq.mockReturnValue(bodegaChain);
    bodegaChain.order.mockReturnValue(bodegaChain);
    bodegaChain.limit.mockResolvedValue({
      data: [{ id_bodega: "bod-1" }],
      error: null,
    });

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
      limit: vi.fn(),
    };
    productoChain.select.mockReturnValue(productoChain);
    productoChain.eq.mockReturnValue(productoChain);
    productoChain.limit.mockResolvedValue({
      data: [{ id_producto: "prod-1", id_cliente: "cli-1" }],
      error: null,
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

    const from = vi.fn((table: string) => {
      if (table === "bodega") return bodegaChain;
      if (table === "comprador") return compradorChain;
      if (table === "producto") return productoChain;
      if (table === "orden_venta") return ordenInsertChain;
      if (table === "orden_venta_linea") return lineaInsertChain;
      throw new Error(`unexpected table ${table}`);
    });

    setSupabaseClientForTests({ from } as never);

    const row = await createOrdenVenta({
      codigoCuenta: "CUENTA-01",
      idComprador: "comp-1",
      idProducto: "prod-1",
      observaciones: "Nota",
      idCreador: "usr-1",
    });

    expect(ordenInsertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        codigo_cuenta: "CUENTA-01",
        id_bodega: "bod-1",
        id_cliente: "cli-1",
        id_comprador: "comp-1",
        estado: "borrador",
        observaciones: "Nota",
      }),
    );
    expect(lineaInsertChain.insert).toHaveBeenCalledWith({
      id_orden_venta: "ov-new",
      id_producto: "prod-1",
      cantidad_pedida: 1,
    });
    expect(row.venta).toBe("OV-001");
    expect(row.comprador).toBe("Retail Norte");
    expect(row.productos).toBe("1 producto");
  });

  it("createOrdenVenta rechaza comprador inválido", async () => {
    const compradorChain = {
      select: vi.fn(),
      eq: vi.fn(),
      limit: vi.fn(),
    };
    compradorChain.select.mockReturnValue(compradorChain);
    compradorChain.eq.mockReturnValue(compradorChain);
    compradorChain.limit.mockResolvedValue({ data: [], error: null });

    setSupabaseClientForTests({
      from: vi.fn(() => compradorChain),
    } as never);

    await expect(
      createOrdenVenta({
        codigoCuenta: "CUENTA-01",
        idComprador: "comp-x",
        idProducto: "prod-1",
      }),
    ).rejects.toThrow("El comprador seleccionado no es válido.");
  });
});
