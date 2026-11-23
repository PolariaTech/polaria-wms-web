import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { listProductosPrimariosCatalogo } from "./productos-catalogo.primarios";

describe("productos-catalogo.primarios", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
  });

  it("lista primarios activos con etiqueta título (sku)", async () => {
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
      data: [
        {
          id_producto: "p1",
          descripcion: "Pollo",
          sku: "SKU1",
          codigo_almacen: "COD1",
          metadatos_catalogo: { categoria: "Aves", proveedor: "Prov" },
        },
      ],
      error: null,
    });
    const from = vi.fn(() => chain);
    setSupabaseClientForTests({ from } as never);

    const rows = await listProductosPrimariosCatalogo("MIT00");

    expect(from).toHaveBeenCalledWith("producto");
    expect(chain.eq).toHaveBeenCalledWith("es_primario", true);
    expect(rows).toEqual([
      {
        idProducto: "p1",
        label: "Pollo (SKU1)",
        titulo: "Pollo",
        codigo: "COD1",
        sku: "SKU1",
        categoria: "Aves",
        proveedor: "Prov",
      },
    ]);
  });
});
