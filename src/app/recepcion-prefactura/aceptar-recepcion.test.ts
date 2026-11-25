import { beforeEach, describe, expect, it, vi } from "vitest";

const tablas: Record<string, unknown> = {};
const insertados: unknown[] = [];

function filaUnica(valor: unknown): unknown {
  return Array.isArray(valor) ? (valor[0] ?? null) : valor;
}

function tabla(nombre: string) {
  let modo = "select";
  const builder = {
    select: () => builder,
    update: () => {
      modo = "update";
      return builder;
    },
    eq: () => builder,
    order: () => builder,
    insert: (fila: unknown) => {
      insertados.push(fila);
      return builder;
    },
    maybeSingle: async () => ({
      data: modo === "update" ? { codigo: "OV-00000049" } : filaUnica(tablas[nombre]),
      error: null,
    }),
    then: (resolve: (valor: { data: unknown; error: null }) => void) => {
      resolve({
        data: modo === "update" ? { codigo: "OV-00000049" } : tablas[nombre],
        error: null,
      });
    },
  };
  return builder;
}

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => ({
    from: (nombre: string) => tabla(nombre),
    schema: () => ({ from: (nombre: string) => tabla(nombre) }),
  }),
}));

import { aceptarRecepcionPrefactura } from "./aceptar-recepcion";

describe("aceptarRecepcionPrefactura", () => {
  beforeEach(() => {
    insertados.length = 0;
    tablas.empresa = { schema_name: "emp_demo_1xz77" };
    tablas.orden_venta = {
      id_orden_venta: "ov-1",
      codigo_cuenta: "cta-1",
      estado: "despachada",
      fecha_pedido: "2026-11-17",
      comprador: { codigo: "1052000407" },
      origen_correo: [
        {
          "Numero pedido": "4501110118",
          Almacen: "PUEBLA XO01 XOXIMILCO (Consumo Interno)",
          Producto: "AGUACATE JASS",
          "Codigo producto": "X200011700",
          Cantidad: 3,
          Precio: 67,
        },
      ],
      orden_venta_linea: [
        {
          cantidad_pedida: 3,
          match_producto: { textoCliente: "AGUACATE JASS" },
          producto: { sku: "115001009" },
        },
      ],
    };
    tablas.auditoria_operacion = [
      { payload: { estadoNuevo: "confirmada" } },
      { payload: { estadoNuevo: "alistada" } },
      { payload: { estado: "despachada" } },
    ];
    vi.stubEnv("COMPAC_PREFACTURA_URL", "http://compaq.test/prefactura");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          { ok: true, folio: 18, serie: "CS-" },
          { status: 201 },
        ),
      ),
    );
  });

  it("crea la prefactura y marca la orden como facturada", async () => {
    const resultado = await aceptarRecepcionPrefactura({
      empresa: "1XZ77",
      ov: "OV-00000049",
      ot: "pedido:4501110118|almacen:puebla xo01 xoximilco (consumo interno)",
    });
    expect(resultado).toEqual({
      ok: true,
      mensaje: "Facturado. Folio CS-18.",
      error: "",
    });
    const cuerpo = JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body));
    expect(cuerpo.referencia).toBe("OV-00000049AFBEAF");
    expect(cuerpo.partidas).toEqual([
      { sku: "115001009", bodega: "8", cantidad: 3, precio: 67 },
    ]);
    const facturado = insertados.find(
      (fila) =>
        typeof fila === "object" &&
        fila !== null &&
        (fila as { accion?: string }).accion === "cambio_estado",
    ) as { payload?: { mensaje?: string; estadoNuevo?: string; idOrdenTrabajo?: string } } | undefined;
    expect(facturado?.payload?.mensaje).toBe("Estado de la orden actualizado a Facturado.");
    expect(facturado?.payload?.estadoNuevo).toBe("facturada");
    expect(facturado?.payload?.idOrdenTrabajo).toBeUndefined();
  });

  it("no factura una orden por confirmar", async () => {
    tablas.orden_venta = {
      ...(tablas.orden_venta as Record<string, unknown>),
      estado: "por_confirmar",
    };
    const resultado = await aceptarRecepcionPrefactura({
      empresa: "1XZ77",
      ov: "OV-00000049",
      ot: "pedido:4501110118|almacen:puebla xo01 xoximilco (consumo interno)",
    });
    expect(resultado.ok).toBe(false);
    expect(resultado.error).toBe(
      "Esta orden está por confirmar y todavía no tiene orden de trabajo. No se puede facturar.",
    );
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it("no factura si está despachada sin haber pasado por Alistado", async () => {
    tablas.auditoria_operacion = [
      { payload: { estadoNuevo: "confirmada" } },
      { payload: { estado: "despachada" } },
    ];
    const resultado = await aceptarRecepcionPrefactura({
      empresa: "1XZ77",
      ov: "OV-00000049",
      ot: "pedido:4501110118|almacen:puebla xo01 xoximilco (consumo interno)",
    });
    expect(resultado.ok).toBe(false);
    expect(resultado.error).toContain("Confirmada, Alistado y Despachado");
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });
});
