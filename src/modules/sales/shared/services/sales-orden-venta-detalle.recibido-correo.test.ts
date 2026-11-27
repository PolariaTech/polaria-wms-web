import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSupabaseClientForTests } from "@/lib/supabase/domain-query";
import { getOrdenVentaDetalle } from "./sales-orden-venta-detalle.service";

const ORDEN_BASE = {
  id_orden_venta: "ov-1",
  codigo_cuenta: "CUENTA-01",
  id_bodega: "bod-1",
  id_cliente: "cli-1",
  id_comprador: null,
  id_planta: null,
  id_creador: null,
  id_bodega_destino: null,
  codigo: "OV-001",
  estado: "por_confirmar",
  fecha_pedido: "2026-11-25",
  observaciones: null,
  created_at: "2026-11-25T03:15:46.507Z",
  updated_at: "2026-11-25T03:15:46.507Z",
  comprador: null,
  orden_venta_linea: [
    {
      id_linea_orden_venta: "line-1",
      id_producto: "prod-1",
      cantidad_pedida: "10",
      precio_unitario: "1000",
      producto: { sku: "IOZ7Z", descripcion: "Pork racks", metadatos_catalogo: null },
    },
  ],
};

interface ResultadoConsulta {
  data: unknown;
  error: { message: string } | null;
}

/** Cadena de PostgREST simulada: cada paso devuelve la misma cadena y `await` entrega el resultado. */
function cadena(resultado: ResultadoConsulta) {
  const paso = {
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    not: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn(),
    then: (resolver: (valor: ResultadoConsulta) => unknown) => Promise.resolve(resultado).then(resolver),
  };
  for (const nombre of ["select", "eq", "in", "not", "order", "limit"] as const) {
    paso[nombre].mockReturnValue(paso);
  }
  paso.maybeSingle.mockResolvedValue(resultado);
  return paso;
}

function simularTablas(tablas: { ingreso: ResultadoConsulta; entrada: ResultadoConsulta }) {
  const cadenas: Record<string, ReturnType<typeof cadena>> = {
    orden_venta: cadena({ data: ORDEN_BASE, error: null }),
    bodega: cadena({ data: [{ id_bodega: "bod-1", nombre: "Bodega central" }], error: null }),
    correo_pedido_ingreso: cadena(tablas.ingreso),
    correo_pedido_entrada: cadena(tablas.entrada),
  };
  const from = vi.fn((tabla: string) => cadenas[tabla]);
  setSupabaseClientForTests({ from } as never);
  return cadenas;
}

describe("getOrdenVentaDetalle: llegada del correo (REQ-420)", () => {
  beforeEach(() => {
    setSupabaseClientForTests(null);
  });

  it("trae recibido_correo_en del correo de origen, distinto de created_at", async () => {
    const cadenas = simularTablas({
      ingreso: { data: [{ message_id: "msg-1" }], error: null },
      entrada: { data: [{ recibido_en: "2026-11-12T20:27:12.000Z" }], error: null },
    });

    const detalle = await getOrdenVentaDetalle({ codigoCuenta: "CUENTA-01", idOrdenVenta: "ov-1" });

    expect(detalle.recibido_correo_en).toBe("2026-11-12T20:27:12.000Z");
    expect(detalle.created_at).toBe("2026-11-25T03:15:46.507Z");
    expect(cadenas.correo_pedido_ingreso.eq).toHaveBeenCalledWith("id_orden_venta", "ov-1");
    expect(cadenas.correo_pedido_entrada.in).toHaveBeenCalledWith("message_id", ["msg-1"]);
  });

  it("sin correo de origen (OV capturada a mano) deja recibido_correo_en en null", async () => {
    const cadenas = simularTablas({
      ingreso: { data: [], error: null },
      entrada: { data: [{ recibido_en: "no debe leerse" }], error: null },
    });

    const detalle = await getOrdenVentaDetalle({ codigoCuenta: "CUENTA-01", idOrdenVenta: "ov-1" });

    expect(detalle.recibido_correo_en).toBeNull();
    expect(cadenas.correo_pedido_entrada.select).not.toHaveBeenCalled();
  });

  it("si no se puede leer el correo, el detalle de la OV igual se abre", async () => {
    simularTablas({
      ingreso: { data: null, error: { message: "tabla no disponible" } },
      entrada: { data: null, error: null },
    });

    const detalle = await getOrdenVentaDetalle({ codigoCuenta: "CUENTA-01", idOrdenVenta: "ov-1" });

    expect(detalle.codigo).toBe("OV-001");
    expect(detalle.recibido_correo_en).toBeNull();
  });
});
