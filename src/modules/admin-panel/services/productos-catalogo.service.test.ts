import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { listCatalogoProductosAdmin } from "./productos-catalogo.service";

describe("productos-catalogo.service", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
    vi.restoreAllMocks();
  });

  it("listCatalogoProductosAdmin consulta productos activos de la cuenta", async () => {
    const selectChain = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
    };
    selectChain.select.mockReturnValue(selectChain);
    selectChain.eq.mockReturnValue(selectChain);
    selectChain.order.mockReturnValue(selectChain);
    selectChain.limit.mockResolvedValue({
      data: [
        {
          id_producto: "prod-1",
          sku: "SKU01",
          descripcion: "Producto demo",
          codigo_almacen: "PROD01",
          es_primario: true,
          es_secundario: false,
          unidad_visualizacion: "cantidad",
          id_producto_primario: null,
          metadatos_catalogo: {
            titulo: "Producto demo",
            slug: "producto-demo",
            proveedor: "Proveedor A",
            categoria: "General",
            precio: "1000",
            cantidadInventario: "5",
          },
        },
      ],
      error: null,
    });

    const from = vi.fn(() => selectChain);
    setSupabaseClientForTests({ from } as never);

    const rows = await listCatalogoProductosAdmin({ codigoCuenta: "MIT00" });

    expect(from).toHaveBeenCalledWith("producto");
    expect(selectChain.eq).toHaveBeenCalledWith("codigo_cuenta", "MIT00");
    expect(selectChain.eq).toHaveBeenCalledWith("esta_activo", true);
    expect(rows[0]?.titulo).toBe("Producto demo");
    expect(rows[0]?.slug).toBe("producto-demo");
    expect(rows[0]?.stock).toBe("5");
  });
});
