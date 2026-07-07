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

  it("listCatalogoProductosAdmin omite metadatos_catalogo si la columna no existe", async () => {
    const selectChain = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
    };
    selectChain.select.mockReturnValue(selectChain);
    selectChain.eq.mockReturnValue(selectChain);
    selectChain.order.mockReturnValue(selectChain);
    selectChain.limit
      .mockResolvedValueOnce({
        data: null,
        error: {
          message: "column producto.metadatos_catalogo does not exist",
        },
      })
      .mockResolvedValueOnce({
        data: [
          {
            id_producto: "prod-2",
            sku: "SKU02",
            descripcion: "Solo descripcion",
            codigo_almacen: "PROD02",
            es_primario: true,
            es_secundario: false,
            unidad_visualizacion: "cantidad",
            id_producto_primario: null,
          },
        ],
        error: null,
      });

    const from = vi.fn(() => selectChain);
    setSupabaseClientForTests({ from } as never);

    const rows = await listCatalogoProductosAdmin({ codigoCuenta: "MIT00" });

    expect(selectChain.select).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("metadatos_catalogo"),
    );
    expect(selectChain.select).toHaveBeenNthCalledWith(
      2,
      expect.not.stringContaining("metadatos_catalogo"),
    );
    expect(rows[0]?.titulo).toBe("Solo descripcion");
  });

  it("updateCatalogoProducto actualiza producto activo", async () => {
    const updateChain = {
      update: vi.fn(),
      eq: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    };
    updateChain.update.mockReturnValue(updateChain);
    updateChain.eq.mockReturnValue(updateChain);
    updateChain.select.mockReturnValue(updateChain);
    updateChain.single.mockResolvedValue({
      data: {
        id_producto: "prod-1",
        sku: "SKU01",
        descripcion: "Producto editado",
        codigo_almacen: "PROD01",
        es_primario: true,
        es_secundario: false,
        unidad_visualizacion: "cantidad",
        id_producto_primario: null,
        metadatos_catalogo: { titulo: "Producto editado", precio: "2000" },
      },
      error: null,
    });

    const from = vi.fn(() => updateChain);
    setSupabaseClientForTests({ from } as never);

    const { updateCatalogoProducto } = await import("./productos-catalogo.service");

    const row = await updateCatalogoProducto({
      codigoCuenta: "MIT00",
      idProducto: "prod-1",
      sku: "SKU01",
      titulo: "Producto editado",
      unidadMedida: "und",
      unidadVisualizacion: "cantidad",
      esPrimario: true,
      esSecundario: false,
      metadatos: { titulo: "Producto editado", precio: "2000" },
    });

    expect(from).toHaveBeenCalledWith("producto");
    expect(updateChain.eq).toHaveBeenCalledWith("codigo_cuenta", "MIT00");
    expect(updateChain.eq).toHaveBeenCalledWith("id_producto", "prod-1");
    expect(row.titulo).toBe("Producto editado");
    expect(row.precio).toBe("2000");
  });

  it("deactivateCatalogoProducto marca esta_activo en false", async () => {
    const updateChain = {
      update: vi.fn(),
      eq: vi.fn(),
      then: (resolve: (value: { data: null; error: null }) => void) =>
        resolve({ data: null, error: null }),
    };
    updateChain.update.mockReturnValue(updateChain);
    updateChain.eq.mockReturnValue(updateChain);

    const from = vi.fn(() => updateChain);
    setSupabaseClientForTests({ from } as never);

    const { deactivateCatalogoProducto } = await import(
      "./productos-catalogo.service"
    );

    await deactivateCatalogoProducto("MIT00", "prod-1");

    expect(updateChain.update).toHaveBeenCalledWith({ esta_activo: false });
    expect(updateChain.eq).toHaveBeenCalledWith("codigo_cuenta", "MIT00");
    expect(updateChain.eq).toHaveBeenCalledWith("id_producto", "prod-1");
  });
});
