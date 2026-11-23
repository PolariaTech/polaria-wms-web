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
  createPrecioProductoChain,
  mockUpdateOrdenVentaDeps,
} from "./sales.service.test-helpers";

describe("sales.service", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
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

    const ordenChain = {
      select: vi.fn(),
      eq: vi.fn(),
      limit: vi.fn(),
      insert: vi.fn(),
      single: vi.fn(),
    };
    ordenChain.select.mockReturnValue(ordenChain);
    ordenChain.eq.mockReturnValue(ordenChain);
    ordenChain.limit.mockResolvedValue({ data: [], error: null });
    ordenChain.insert.mockReturnValue(ordenChain);
    ordenChain.single.mockResolvedValue({
      data: {
        id_orden_venta: "ov-over",
        codigo_cuenta: "CUENTA-01",
        id_bodega: "bod-1",
        id_cliente: "cli-1",
        id_comprador: "comp-1",
        id_planta: null,
        id_creador: null,
        id_bodega_destino: "bod-dest",
        codigo: "OV-00000001",
        estado: "por_confirmar",
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
      cantidadPedida: 25,
    });

    expect(ordenChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ codigo: "" }),
    );
    expect(row.venta).toBe("OV-00000001");
    expect(lineaInsertChain.insert).toHaveBeenCalledWith([
      {
        id_orden_venta: "ov-over",
        id_producto: "prod-1",
        cantidad_pedida: 25,
        precio_unitario: 10,
        cajas: null,
        presentacion: null,
        unidad_medida: null,
        match_producto: null,
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
        estado: "por_confirmar",
        fecha_pedido: "2026-06-28",
        observaciones: "Nota",
        created_at: "2026-06-28T12:00:00.000Z",
        updated_at: "2026-06-28T12:00:00.000Z",
        comprador: { nombre: "Edgar Escobar", codigo: "3Q12U", apodo: "Edgar", rfc: "EESC800101ABC" },
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
    expect(detalle.comprador_nombre).toBe("Edgar Escobar"); expect(detalle.comprador_rfc).toBe("EESC800101ABC");
    expect(detalle.lineas).toHaveLength(1);
    expect(detalle.lineas[0]?.cantidad_pedida).toBe(10);
    expect(detalle.lineas[0]?.precio_unitario).toBe(1000);
    expect(detalle.bodega_nombre).toBe("Bodega central");
  });


  it("updateOrdenVenta actualiza cabecera y reemplaza líneas si está confirmada", async () => {
    const deps = mockUpdateOrdenVentaDeps("confirmada");

    const row = await updateOrdenVenta({
      codigoCuenta: "CUENTA-01",
      idOrdenVenta: "ov-1",
      idBodega: "bod-1",
      idBodegaDestino: "bod-dest",
      idComprador: "comp-1",
      lineas: [
        {
          idProducto: "prod-1",
          cantidadPedida: 12,
          precioUnitario: 110,
          cajas: 2,
          presentacion: "Caja 6 kg",
        },
      ],
    });

    expect(deps.ordenUpdateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id_comprador: "comp-1",
        id_bodega_destino: "bod-dest",
      }),
    );
    expect(deps.lineaDeleteChain.delete).toHaveBeenCalled();
    expect(deps.lineaInsertChain.insert).toHaveBeenCalledWith([
      {
        id_orden_venta: "ov-1",
        id_producto: "prod-1",
        cantidad_pedida: 12,
        precio_unitario: 110,
        cajas: 2,
        presentacion: "Caja 6 kg",
        unidad_medida: null,
        match_producto: null,
      },
    ]);
    expect(row.venta).toBe("OV-001");
    expect(row.estado).toBe("confirmada");
  });


  it("REQ-138: avance permite cantidad 0 y precio 0 (sin inventar $1)", async () => {
    const deps = mockUpdateOrdenVentaDeps("por_confirmar");

    await updateOrdenVenta({
      codigoCuenta: "CUENTA-01",
      idOrdenVenta: "ov-1",
      idBodega: "bod-1",
      idComprador: "comp-1",
      guardarAvance: true,
      lineas: [
        {
          idProducto: "prod-1",
          cantidadPedida: 0,
          precioUnitario: 0,
        },
      ],
    });

    expect(deps.lineaInsertChain.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        id_producto: "prod-1",
        cantidad_pedida: 0,
        precio_unitario: 0,
      }),
    ]);
  });

});
