import { beforeEach, describe, expect, it, vi } from "vitest";

type Op = {
  table: string;
  kind: "select" | "update" | "insert";
  payload: Record<string, unknown> | Record<string, unknown>[] | null;
};

const bd = vi.hoisted(() => ({
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
    return { data: bd.lineas.slice(0, 1), error: null };
  }
  if (op.table === "orden_venta" && op.kind === "update") {
    const payload = op.payload as Record<string, unknown>;
    if ("lineas_materializadas_at" in payload) {
      if (payload.lineas_materializadas_at === null) {
        bd.reservasLiberadas += 1;
        bd.reservada = false;
        return { data: null, error: null };
      }
      if (bd.reservada) return { data: [], error: null };
      bd.reservada = true;
      return { data: [{ id_orden_venta: "ov-1" }], error: null };
    }
    return { data: null, error: null };
  }
  if (op.table === "orden_venta_linea" && op.kind === "insert") {
    if (bd.insertFalla) return { data: null, error: { message: "falló" } };
    bd.lineas.push(...(op.payload as Record<string, unknown>[]));
    return { data: null, error: null };
  }
  return { data: null, error: null };
}

function crearCliente() {
  return {
    from(table: string) {
      const op: Op = { table, kind: "select", payload: null };
      const q: Record<string, unknown> = {
        select: () => q,
        update: (payload: Op["payload"]) => {
          op.kind = "update";
          op.payload = payload;
          return q;
        },
        insert: (payload: Op["payload"]) => {
          op.kind = "insert";
          op.payload = payload;
          return q;
        },
        eq: () => q,
        is: () => q,
        or: () => q,
        limit: () => q,
        maybeSingle: () => q,
        // Cede el turno para que dos llamadas simultáneas se entrelacen.
        then: (ok: (v: unknown) => unknown, fail: (e: unknown) => unknown) =>
          new Promise((r) => setTimeout(r, 0))
            .then(() => resolver(op))
            .then(ok, fail),
      };
      return q;
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
    bd.reservada = false;
    bd.insertFalla = false;
    bd.lineas = [];
    bd.reservasLiberadas = 0;
  });

  it("dos aperturas simultáneas insertan las líneas una sola vez", async () => {
    const [a, b] = await Promise.all([
      materializeOrdenVentaDesdeOrigenSiVacia(params),
      materializeOrdenVentaDesdeOrigenSiVacia(params),
    ]);

    expect(bd.lineas).toHaveLength(2);
    expect([a.materializado, b.materializado].filter(Boolean)).toHaveLength(1);
  });

  it("la sesión que pierde la reserva no inserta nada", async () => {
    bd.reservada = true;

    const resultado = await materializeOrdenVentaDesdeOrigenSiVacia(params);

    expect(bd.lineas).toHaveLength(0);
    expect(resultado.materializado).toBe(false);
  });

  it("si el insert falla libera la reserva y deja reintentar", async () => {
    bd.insertFalla = true;

    await expect(
      materializeOrdenVentaDesdeOrigenSiVacia(params),
    ).rejects.toThrow("falló");
    expect(bd.reservasLiberadas).toBe(1);

    bd.insertFalla = false;
    await materializeOrdenVentaDesdeOrigenSiVacia(params);
    expect(bd.lineas).toHaveLength(2);
  });
});
