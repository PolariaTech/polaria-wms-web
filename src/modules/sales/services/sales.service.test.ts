import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { createSupabaseMock } from "@/test/create-supabase-mock";
import {
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
    expect(rows[0]?.comprador).toBe("Retail Norte");
    expect(rows[0]?.productos).toBe("2 productos");
  });

  it("listProductosVentaCatalogo consulta producto activo sin metadatos", async () => {
    const { client, from } = createSupabaseMock({
      data: [
        {
          id_producto: "prod-1",
          descripcion: "Filete",
          sku: "FIL-01",
        },
      ],
    });
    setSupabaseClientForTests(client);

    const rows = await listProductosVentaCatalogo("CUENTA-01");

    expect(from).toHaveBeenCalledWith("producto");
    expect(rows[0]?.label).toContain("Filete");
  });
});
