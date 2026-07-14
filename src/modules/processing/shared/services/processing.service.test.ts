import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { createSupabaseMock } from "@/test/create-supabase-mock";
import {
  createSolicitudProcesamiento,
  listProductosSecundariosProcesamiento,
  listSolicitudesProcesamiento,
  listSolicitudesProcesamientoOperador,
  listTareasCola,
} from "./processing.service";

describe("processing.service", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
    vi.restoreAllMocks();
  });

  it("listSolicitudesProcesamiento consulta solicitud_procesamiento", async () => {
    const { client, from } = createSupabaseMock({ data: [] });
    setSupabaseClientForTests(client);

    await listSolicitudesProcesamiento({
      codigoCuenta: "CUENTA-01",
      idBodega: "BOD-01",
    });

    expect(from).toHaveBeenCalledWith("solicitud_procesamiento");
  });

  it("listSolicitudesProcesamientoOperador enriquece filas con nombres de producto", async () => {
    const solicitudMock = createSupabaseMock({
      data: [
        {
          id_solicitud_procesamiento: "sol-1",
          codigo_cuenta: "CUENTA-01",
          id_bodega: "BOD-01",
          codigo: "OP-001",
          id_cliente: null,
          id_producto_primario: "prod-1",
          id_producto_secundario: "prod-2",
          id_solicitante: "user-1",
          id_procesador: null,
          estado: "pendiente",
          kilos_primario: "10",
          kilos_secundario: null,
          kilos_merma: null,
          regla_conversion_cantidad_primario: "1",
          regla_conversion_unidades_secundario: "2",
          estimado_unidades_secundario: "20",
          created_at: "2026-06-28T12:00:00.000Z",
          updated_at: "2026-06-28T12:00:00.000Z",
        },
      ],
    });
    const productoMock = createSupabaseMock({
      data: [
        {
          id_producto: "prod-1",
          descripcion: "Salmón",
          sku: "SAL-01",
          regla_conversion_cantidad_primario: null,
          regla_conversion_unidades_secundario: null,
          id_producto_primario: null,
        },
        {
          id_producto: "prod-2",
          descripcion: "Filete",
          sku: "FIL-01",
          regla_conversion_cantidad_primario: null,
          regla_conversion_unidades_secundario: null,
          id_producto_primario: "prod-1",
        },
      ],
    });

    const client = {
      from: vi.fn((table: string) => {
        if (table === "producto") return productoMock.chain;
        return solicitudMock.chain;
      }),
    } as unknown as SupabaseClient;

    setSupabaseClientForTests(client);

    const rows = await listSolicitudesProcesamientoOperador({
      codigoCuenta: "CUENTA-01",
      idBodega: "BOD-01",
    });

    expect(rows[0]?.orden).toBe("OP-001");
    expect(rows[0]?.primario).toContain("Salmón");
    expect(rows[0]?.secundario).toContain("Filete");
  });

  it("createSolicitudProcesamiento valida stock", async () => {
    const { client, from } = createSupabaseMock({ data: [] });
    from.mockImplementation(((_table?: string) => {
      if (_table === "warehouse_state") {
        return createSupabaseMock({ data: [] }).chain;
      }
      return createSupabaseMock({ data: [] }).chain;
    }) as typeof from);
    setSupabaseClientForTests(client);

    await expect(
      createSolicitudProcesamiento({
        codigoCuenta: "CUENTA-01",
        idBodega: "BOD-01",
        idSolicitante: "user-1",
        idProductoPrimario: "prod-1",
        idProductoSecundario: "prod-2",
        kilosPrimario: 5,
        reglaConversionCantidadPrimario: 1,
        reglaConversionUnidadesSecundario: 2,
        estimadoUnidadesSecundario: 10,
      }),
    ).rejects.toThrow("Sin stock disponible");
  });

  it("listTareasCola consulta tarea_cola", async () => {
    const { client, from } = createSupabaseMock({ data: [] });
    setSupabaseClientForTests(client);

    await listTareasCola({
      codigoCuenta: "CUENTA-01",
      idBodega: "BOD-01",
    });

    expect(from).toHaveBeenCalledWith("tarea_cola");
  });

  it("listProductosSecundariosProcesamiento mapea reglas numericas de Postgres", async () => {
    const productoMock = createSupabaseMock({
      data: [
        {
          id_producto: "sec-1",
          descripcion: "Chuleta",
          sku: "94Z5T",
          regla_conversion_cantidad_primario: 1,
          regla_conversion_unidades_secundario: 5,
          id_producto_primario: "prim-1",
          merma_pct: 12,
          metadatos_catalogo: null,
        },
      ],
    });

    const client = {
      from: vi.fn(() => productoMock.chain),
    } as unknown as SupabaseClient;

    setSupabaseClientForTests(client);

    const rows = await listProductosSecundariosProcesamiento(
      "CUENTA-01",
      "prim-1",
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]?.label).toContain("Chuleta");
    expect(rows[0]?.reglaConversionCantidadPrimario).toBe(1);
    expect(rows[0]?.reglaConversionUnidadesSecundario).toBe(5);
    expect(rows[0]?.mermaPct).toBe(12);
  });
});
