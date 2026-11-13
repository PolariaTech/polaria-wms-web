import { beforeEach, describe, expect, it, vi } from "vitest";
import { aprenderEquivalencias } from "./aprender-equivalencias.service";

type Respuesta = { data: unknown; error: { message: string } | null };

const operaciones: Array<{
  table: string;
  select?: string;
  insert?: Record<string, unknown>;
  update?: Record<string, unknown>;
  eqs: Array<[string, string]>;
}> = [];
let respuestas: Respuesta[] = [];
let consultas = 0;

function crearCliente() {
  return {
    from(table: string) {
      consultas += 1;
      const operacion = { table, eqs: [] as Array<[string, string]> };
      operaciones.push(operacion);
      const consulta: Record<string, unknown> = {
        select: (columnas: string) => {
          operacion.select = columnas;
          return consulta;
        },
        insert: (fila: Record<string, unknown>) => {
          operacion.insert = fila;
          return consulta;
        },
        update: (fila: Record<string, unknown>) => {
          operacion.update = fila;
          return consulta;
        },
        eq: (columna: string, valor: string) => {
          operacion.eqs.push([columna, valor]);
          return consulta;
        },
        then: (ok: (v: unknown) => unknown, fail: (e: unknown) => unknown) =>
          Promise.resolve(respuestas.shift() ?? { data: [], error: null }).then(
            ok,
            fail,
          ),
      };
      return consulta;
    },
  };
}

vi.mock("@/lib/supabase/domain-query", () => {
  const ejecutar = async (cb: (c: unknown) => PromiseLike<unknown>) => {
    const r = (await cb(crearCliente())) as Respuesta;
    if (r.error) throw new Error(r.error.message);
    return r.data;
  };
  return {
    requireCodigoCuenta: (c: string) => c,
    runDomainQuery: ejecutar,
    runDomainMutation: ejecutar,
  };
});

const aprendizaje = { frase: "Manzana verde", idProducto: "p-red" };

describe("aprenderEquivalencias", () => {
  beforeEach(() => {
    operaciones.length = 0;
    consultas = 0;
    respuestas = [];
  });

  it("sin aprendizajes no consulta", async () => {
    const resumen = await aprenderEquivalencias({
      codigoCuenta: "cuenta-1",
      idComprador: "c1",
      aprendizajes: [],
    });
    expect(consultas).toBe(0);
    expect(resumen).toEqual({ creadas: 0, actualizadas: 0, fallidas: 0 });
  });

  it("inserta si no hay fila", async () => {
    respuestas = [
      { data: [], error: null },
      { data: null, error: null },
    ];
    const resumen = await aprenderEquivalencias({
      codigoCuenta: "cuenta-1",
      idComprador: "c1",
      aprendizajes: [aprendizaje],
    });
    expect(resumen.creadas).toBe(1);
    expect(operaciones[0]?.eqs).toEqual([
      ["codigo_cuenta", "cuenta-1"],
      ["id_comprador", "c1"],
      ["alias_normalizado", "manzana verde"],
    ]);
    expect(operaciones[1]?.insert).toEqual({
      codigo_cuenta: "cuenta-1",
      id_comprador: "c1",
      id_producto: "p-red",
      alias: "Manzana verde",
      precio: null,
    });
    expect(operaciones[1]?.insert).not.toHaveProperty("alias_normalizado");
  });

  it("no escribe si la frase ya es de ese producto", async () => {
    respuestas = [
      {
        data: [
          {
            id_alias: "a1",
            id_producto: "p-red",
            alias: "Manzana verde",
            precio: null,
          },
        ],
        error: null,
      },
    ];
    const resumen = await aprenderEquivalencias({
      codigoCuenta: "cuenta-1",
      idComprador: "c1",
      aprendizajes: [aprendizaje],
    });
    expect(resumen).toEqual({ creadas: 0, actualizadas: 0, fallidas: 0 });
    expect(operaciones).toHaveLength(1);
  });

  it("sobrescribe si hay otro producto sin precio", async () => {
    respuestas = [
      {
        data: [
          {
            id_alias: "a1",
            id_producto: "p-granny",
            alias: "Manzana verde",
            precio: null,
          },
        ],
        error: null,
      },
      { data: null, error: null },
    ];
    const resumen = await aprenderEquivalencias({
      codigoCuenta: "cuenta-1",
      idComprador: "c1",
      aprendizajes: [aprendizaje],
    });
    expect(resumen.actualizadas).toBe(1);
    expect(operaciones[1]?.update).toEqual({
      id_producto: "p-red",
      alias: "Manzana verde",
    });
    expect(operaciones[1]?.eqs).toEqual([
      ["codigo_cuenta", "cuenta-1"],
      ["id_alias", "a1"],
    ]);
  });

  it("deja el precio en su producto y crea la frase nueva", async () => {
    respuestas = [
      {
        data: [
          {
            id_alias: "a1",
            id_producto: "p-granny",
            alias: "Manzana verde",
            precio: 12,
          },
        ],
        error: null,
      },
      { data: null, error: null },
      { data: null, error: null },
    ];
    const resumen = await aprenderEquivalencias({
      codigoCuenta: "cuenta-1",
      idComprador: "c1",
      aprendizajes: [aprendizaje],
    });
    expect(resumen).toEqual({ creadas: 1, actualizadas: 1, fallidas: 0 });
    expect(operaciones[1]?.update).toEqual({ alias: "" });
    expect(operaciones[2]?.insert).toMatchObject({
      id_producto: "p-red",
      alias: "Manzana verde",
      precio: null,
    });
  });

  it("un error de la base no se propaga", async () => {
    respuestas = [{ data: null, error: { message: "db down" } }];
    await expect(
      aprenderEquivalencias({
        codigoCuenta: "cuenta-1",
        idComprador: "c1",
        aprendizajes: [aprendizaje],
      }),
    ).resolves.toEqual({ creadas: 0, actualizadas: 0, fallidas: 1 });
  });

  it("todas las consultas filtran por codigo_cuenta", async () => {
    respuestas = [
      { data: [], error: null },
      { data: null, error: null },
    ];
    await aprenderEquivalencias({
      codigoCuenta: "cuenta-1",
      idComprador: "c1",
      aprendizajes: [aprendizaje],
    });
    expect(operaciones.length).toBeGreaterThan(0);
    for (const operacion of operaciones) {
      if (operacion.insert) {
        expect(operacion.insert.codigo_cuenta).toBe("cuenta-1");
        continue;
      }
      expect(operacion.eqs.some(([col]) => col === "codigo_cuenta")).toBe(true);
    }
  });
});
