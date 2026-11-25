import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
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
      const aplicar = async () => {
        const afectados = filas(esquema).filter((fila) =>
          filtros.every((filtro) =>
            Array.isArray(filtro.val)
              ? filtro.val.includes(fila[filtro.col])
              : fila[filtro.col] === filtro.val,
          ),
        );
        for (const fila of afectados) Object.assign(fila, cambios);
        return { data: afectados, error: null };
      };
      const cadena = {
        eq(col: string, val: unknown) {
          filtros.push({ col, val });
          return cadena;
        },
        in(col: string, valores: unknown[]) {
          filtros.push({ col, val: valores });
          return cadena;
        },
        select() {
          return aplicar();
        },
        then(
          resolve: (value: { data: Fila[]; error: null }) => unknown,
          reject?: (reason: unknown) => unknown,
        ) {
          return aplicar().then(resolve, reject);
        },
      };
      return cadena;
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

const avanzarNest = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock("@/modules/sales/ordenes/surtido/avanzar-estado-surtido.server", () => ({
  avanzarEstadoSurtidoEnNest: (...args: unknown[]) => avanzarNest(...args),
}));

const resolverEsquema = vi.hoisted(() => vi.fn(async () => "emp_demo" as string | null));

vi.mock("@/modules/sales/shared/services/sales-catalog.server", () => ({
  resolveTenantSchemaForCuenta: resolverEsquema,
}));

beforeEach(() => {
  bd.empresas = [{ schema_name: "emp_demo" }];
  bd.ordenes.clear();
  log.mockClear();
  avanzarNest.mockReset();
  avanzarNest.mockResolvedValue(undefined);
  resolverEsquema.mockReset();
  resolverEsquema.mockResolvedValue("emp_demo");
  filas("emp_demo").push(
    {
      id_orden_venta: "ov-1",
      codigo: "OV-1",
      estado: "alistada",
      codigo_cuenta: "023WA",
      comprador: { nombre: "Krystal Cancún", apodo: "Krystal", denominacion_comercial_override: null },
      orden_compra_hotel: "OC-77",
      denominacion_comercial_override: null,
      origen_correo: [{ Cantidad: 1, Almacen: "Cocina" }, { Cantidad: 1, Almacen: "Bar" }],
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
    expect(ordenes.find((orden) => orden.codigo === "OV-1")).toMatchObject({
      nombreCliente: "Krystal Cancún",
      denominacionComercial: "Krystal",
      ordenCompraCliente: "OC-77",
      cantidadOrdenesTrabajo: 2,
    });
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
    expect(avanzarNest).toHaveBeenCalledWith({
      idOrdenVenta: "ov-1",
      estado: "despachada",
      codigoCuenta: "023WA",
    });
    expect(filas("emp_demo").find((fila) => fila.id_orden_venta === "ov-1"))
      .toMatchObject({ estado: "alistada" });
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

  it("en producción el estado lo escribe Nest; el update local queda detrás del API de loopback", () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "despacho-publico.service.ts"),
      "utf8",
    );
    expect(source).toContain("avanzarEstadoSurtidoEnNest");
    expect(source).toContain("despachoLocalPuedeEscribirEstado");
    expect(source).toContain(".update(");
  });

  it("si el API local no tiene la ruta, deja la orden despachada", async () => {
    avanzarNest.mockRejectedValue(
      new Error("Nest avanzar-estado-surtido falló (404): Cannot POST /ventas/ordenes/ov-1/avanzar-estado-surtido"),
    );
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://127.0.0.1:3000");
    try {
      const resultado = await confirmarDespachoPublico({
        idOrdenVenta: "ov-1",
        codigoCuenta: "023WA",
        despachador: "Ana",
        transportista: "Luis",
      });

      expect(resultado).toEqual({ ok: true });
      expect(filas("emp_demo").find((fila) => fila.id_orden_venta === "ov-1"))
        .toMatchObject({ estado: "despachada" });
      expect(log).toHaveBeenCalled();
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("si Nest rechaza el avance, la orden queda en su estado", async () => {
    avanzarNest.mockRejectedValue(new Error("Nest avanzar-estado-surtido falló (409): no permitida"));

    const resultado = await confirmarDespachoPublico({
      idOrdenVenta: "ov-1",
      codigoCuenta: "023WA",
      despachador: "Ana",
      transportista: "Luis",
    });

    expect(resultado.ok).toBe(false);
    expect(filas("emp_demo").find((fila) => fila.id_orden_venta === "ov-1"))
      .toMatchObject({ estado: "alistada" });
    expect(log).not.toHaveBeenCalled();
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
