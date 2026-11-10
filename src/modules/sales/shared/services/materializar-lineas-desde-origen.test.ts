import { beforeEach, describe, expect, it, vi } from "vitest";

type Op = {
  table: string;
  kind: "select" | "update" | "insert";
  payload: Record<string, unknown> | Record<string, unknown>[] | null;
};

const estadoSimulado = vi.hoisted(() => ({
  reservada: false,
  reservaFalla: false,
  insertFalla: false,
  lineas: [] as Record<string, unknown>[],
  reservasLiberadas: 0,
}));

function resolver(op: Op) {
  if (op.table === "orden_venta" && op.kind === "select") {
    return {
      data: {
        estado: "por_confirmar",
        id_comprador: "comprador-1",
        orden_compra_hotel: "OC-1",
        centro_consumo: "Centro",
        contacto_entrega: "Contacto",
        correo_contacto: "a@b.co",
        fecha_entrega: "2026-11-10",
        notas_lineas: "ya",
        origen_correo: [{ Producto: "Aguacate", Cantidad: 5 }],
        origen_texto: "texto",
      },
      error: null,
    };
  }
  if (op.table === "orden_venta_linea" && op.kind === "select") {
    return { data: estadoSimulado.lineas.slice(0, 1), error: null };
  }
  if (op.table === "orden_venta" && op.kind === "update") {
    const payload = op.payload as Record<string, unknown>;
    if ("lineas_materializadas_at" in payload) {
      if (payload.lineas_materializadas_at === null) {
        estadoSimulado.reservasLiberadas += 1;
        estadoSimulado.reservada = false;
        return { data: null, error: null };
      }
      if (estadoSimulado.reservada) return { data: [], error: null };
      estadoSimulado.reservada = true;
      return { data: [{ id_orden_venta: "ov-1" }], error: null };
    }
    return { data: null, error: null };
  }
  if (op.table === "orden_venta_linea" && op.kind === "insert") {
    if (estadoSimulado.insertFalla) return { data: null, error: { message: "falló" } };
    estadoSimulado.lineas.push(...(op.payload as Record<string, unknown>[]));
    return { data: null, error: null };
  }
  return { data: null, error: null };
}

function crearCliente() {
  return {
    from(table: string) {
      const op: Op = { table, kind: "select", payload: null };
      const consulta: Record<string, unknown> = {
        select: () => consulta,
        update: (payload: Op["payload"]) => {
          op.kind = "update";
          op.payload = payload;
          return consulta;
        },
        insert: (payload: Op["payload"]) => {
          op.kind = "insert";
          op.payload = payload;
          return consulta;
        },
        eq: () => consulta,
        is: () => consulta,
        or: () => consulta,
        limit: () => consulta,
        maybeSingle: () => consulta,
        // Cede el turno para que dos llamadas simultáneas se entrelacen.
        then: (ok: (v: unknown) => unknown, fail: (e: unknown) => unknown) =>
          new Promise((r) => setTimeout(r, 0))
            .then(() => resolver(op))
            .then(ok, fail),
      };
      return consulta;
    },
  };
}

vi.mock("@/lib/supabase/domain-query", () => {
  const ejecutar = async (cb: (c: unknown) => PromiseLike<unknown>) => {
    const r = (await cb(crearCliente())) as {
      data: unknown;
      error: { message: string } | null;
    };
    if (r.error) throw new Error(r.error.message);
    return r.data;
  };
  return {
    requireCodigoCuenta: (c: string) => c,
    runDomainQuery: ejecutar,
    runDomainMutation: ejecutar,
  };
});

vi.mock("@/modules/admin-panel/compradores/services/compradores.service", () => ({
  listCompradoresAdmin: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../ordenes/utils/origen/materialize-ov-desde-origen", () => ({
  buildMaterializeOvDesdeOrigenPlan: () => ({
    idComprador: null,
    ordenCompraHotel: null,
    centroConsumo: null,
    contactoEntrega: null,
    fechaEntrega: null,
    lineas: [
      {
        idProducto: "p1",
        cantidadPedida: 5,
        precioUnitario: 0,
        unidadMedida: "KGM",
        nombreProducto: "Aguacate",
        aliasCliente: "Aguacate",
        especificacion: "",
      },
      {
        idProducto: "p2",
        cantidadPedida: 3,
        precioUnitario: 0,
        unidadMedida: "KGM",
        nombreProducto: "Cebolla",
        aliasCliente: "Cebolla",
        especificacion: "",
      },
    ],
  }),
}));

import { materializeOrdenVentaDesdeOrigenSiVacia } from "./materializar-lineas-desde-origen";

const params = {
  codigoCuenta: "cuenta-1",
  idOrdenVenta: "ov-1",
  listProductos: vi.fn().mockResolvedValue([]),
};

describe("materializeOrdenVentaDesdeOrigenSiVacia", () => {
  beforeEach(() => {
    estadoSimulado.reservada = false;
    estadoSimulado.insertFalla = false;
    estadoSimulado.lineas = [];
    estadoSimulado.reservasLiberadas = 0;
  });

  it("dos aperturas simultáneas insertan las líneas una sola vez", async () => {
    const [a, b] = await Promise.all([
      materializeOrdenVentaDesdeOrigenSiVacia(params),
      materializeOrdenVentaDesdeOrigenSiVacia(params),
    ]);

    expect(estadoSimulado.lineas).toHaveLength(2);
    expect([a.materializado, b.materializado].filter(Boolean)).toHaveLength(1);
  });

  it("la sesión que pierde la reserva no inserta nada", async () => {
    estadoSimulado.reservada = true;

    const resultado = await materializeOrdenVentaDesdeOrigenSiVacia(params);

    expect(estadoSimulado.lineas).toHaveLength(0);
    expect(resultado.materializado).toBe(false);
  });

  it("si el insert falla libera la reserva y deja reintentar", async () => {
    estadoSimulado.insertFalla = true;

    await expect(
      materializeOrdenVentaDesdeOrigenSiVacia(params),
    ).rejects.toThrow("falló");
    expect(estadoSimulado.reservasLiberadas).toBe(1);

    estadoSimulado.insertFalla = false;
    await materializeOrdenVentaDesdeOrigenSiVacia(params);
    expect(estadoSimulado.lineas).toHaveLength(2);
  });
});
