import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  confirmarDespachoPublico,
  listarOrdenesDespachoPublico,
} from "./despacho-publico.service";

type Fila = Record<string, unknown>;

const bd = vi.hoisted(() => ({
  empresas: [] as Fila[],
  ordenes: new Map<string, Fila[]>(),
}));

const log = vi.hoisted(() => vi.fn(async () => null));

function filas(esquema: string | null): Fila[] {
  const clave = esquema ?? "public";
  if (!bd.ordenes.has(clave)) bd.ordenes.set(clave, []);
  return bd.ordenes.get(clave)!;
}

function coincide(fila: Fila, filtros: { col: string; val: unknown }[]): boolean {
  return filtros.every((filtro) => fila[filtro.col] === filtro.val);
}

function consulta(esquema: string | null, tabla: string) {
  const filtros: { col: string; val: unknown }[] = [];
  const api = {
    select() {
      return api;
    },
    not() {
      return api;
    },
    in(col: string, valores: unknown[]) {
      filtros.push({ col, val: valores });
      return api;
    },
    eq(col: string, val: unknown) {
      filtros.push({ col, val });
      return api;
    },
    update(cambios: Fila) {
      return {
        eq(col: string, val: unknown) {
          filtros.push({ col, val });
          return this;
        },
        select() {
          return {
            maybeSingle: async () => {
              const fila = filas(esquema).find((item) =>
                filtros.every((filtro) => item[filtro.col] === filtro.val),
              );
              if (!fila) return { data: null, error: null };
              Object.assign(fila, cambios);
              return { data: { id_orden_venta: fila.id_orden_venta }, error: null };
            },
          };
        },
      };
    },
    limit: async () => {
      if (tabla === "empresa") return { data: bd.empresas, error: null };
      const estados = filtros.find((filtro) => filtro.col === "estado")?.val;
      const data = filas(esquema).filter((fila) =>
        Array.isArray(estados) ? estados.includes(fila.estado) : true,
      );
      return { data, error: null };
    },
    maybeSingle: async () => {
      const data =
        filas(esquema).find((fila) => coincide(fila, filtros)) ?? null;
      return { data, error: null };
    },
  };
  return api;
}

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => ({
    from: (tabla: string) => consulta(null, tabla),
    schema: (esquema: string) => ({
      from: (tabla: string) => consulta(esquema, tabla),
    }),
  }),
}));

vi.mock("@/modules/sales/ordenes/services/orden-venta-log.server", () => ({
  recordOrdenVentaLogServer: log,
}));

const resolverEsquema = vi.hoisted(() => vi.fn(async () => "emp_demo" as string | null));

vi.mock("@/modules/sales/shared/services/sales-catalog.server", () => ({
  resolveTenantSchemaForCuenta: resolverEsquema,
}));

beforeEach(() => {
  bd.empresas = [{ schema_name: "emp_demo" }];
  bd.ordenes.clear();
  log.mockClear();
  resolverEsquema.mockReset();
  resolverEsquema.mockResolvedValue("emp_demo");
  filas("emp_demo").push(
    {
      id_orden_venta: "ov-1",
      codigo: "OV-1",
      estado: "alistada",
      codigo_cuenta: "023WA",
      comprador: { nombre: "Krystal Cancún" },
    },
    {
      id_orden_venta: "ov-2",
      codigo: "OV-2",
      estado: "alistamiento",
      codigo_cuenta: "023WA",
    },
    {
      id_orden_venta: "ov-4",
      codigo: "OV-4",
      estado: "alistada",
      codigo_cuenta: "49M04",
    },
    {
      id_orden_venta: "ov-3",
      codigo: "OV-3",
      estado: "revisada",
      codigo_cuenta: "023WA",
    },
  );
});

describe("listarOrdenesDespachoPublico", () => {
  it("trae alistada y alistamiento, y deja fuera revisada", async () => {
    const ordenes = await listarOrdenesDespachoPublico("023WA");
    expect(ordenes.map((orden) => orden.codigo)).toEqual(["OV-1", "OV-2"]);
    expect(ordenes.find((orden) => orden.codigo === "OV-1")?.nombreCliente).toBe(
      "Krystal Cancún",
    );
  });
});

describe("confirmarDespachoPublico", () => {
  it("pasa la orden a despachada y guarda los dos nombres", async () => {
    const resultado = await confirmarDespachoPublico({
      idOrdenVenta: "ov-1",
      codigoCuenta: "023WA",
      despachador: "Ana",
      transportista: "Luis",
    });

    expect(resultado).toEqual({ ok: true });
    expect(filas("emp_demo").find((fila) => fila.id_orden_venta === "ov-1"))
      .toMatchObject({ estado: "despachada" });
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: "cambio_estado",
        payloadExtra: expect.objectContaining({
          despachador: "Ana",
          transportista: "Luis",
          estado: "despachada",
        }),
      }),
    );
  });

  it("actualiza la copia de la empresa si también está en public", async () => {
    filas(null).push({
      id_orden_venta: "ov-1",
      codigo: "OV-1",
      estado: "alistada",
      codigo_cuenta: "023WA",
    });

    const resultado = await confirmarDespachoPublico({
      idOrdenVenta: "ov-1",
      codigoCuenta: "023WA",
      despachador: "Ana",
      transportista: "Luis",
    });

    expect(resultado).toEqual({ ok: true });
    expect(filas("emp_demo").find((fila) => fila.id_orden_venta === "ov-1"))
      .toMatchObject({ estado: "despachada" });
    expect(filas(null).find((fila) => fila.id_orden_venta === "ov-1"))
      .toMatchObject({ estado: "alistada" });
  });

  it("no cambia una orden que ya no está en alistada ni alistamiento", async () => {
    const resultado = await confirmarDespachoPublico({
      idOrdenVenta: "ov-3",
      codigoCuenta: "023WA",
      despachador: "Ana",
      transportista: "Luis",
    });

    expect(resultado.ok).toBe(false);
    expect(filas("emp_demo").find((fila) => fila.id_orden_venta === "ov-3"))
      .toMatchObject({ estado: "revisada" });
    expect(log).not.toHaveBeenCalled();
  });
});
