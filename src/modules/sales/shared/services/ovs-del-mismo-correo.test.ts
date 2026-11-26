import { beforeEach, describe, expect, it, vi } from "vitest";
import { buscarOvsDelMismoCorreo } from "./ovs-del-mismo-correo";

const UUID = "3f2a9c1e-7b44-4d1a-9e0f-1a2b3c4d5e6f";
const PATH = `cuenta/${UUID}-OC-140188.pdf`;
const origen = (...paths: string[]) => JSON.stringify(paths.map((path) => ({ nombre: "x.pdf", path })));

const llamadas: Array<[string, ...string[]]> = [];
let consultas = 0;
let filas: unknown[] = [];
/** Respuestas por consulta (si hay cola, tiene prioridad sobre `filas`). */
let colaFilas: unknown[][] = [];

function crearCliente() {
  consultas += 1;
  const data = colaFilas.length > 0 ? colaFilas.shift()! : filas;
  const consulta: Record<string, unknown> = {
    select: (columnas: string) => {
      llamadas.push(["select", columnas]);
      return consulta;
    },
    eq: (columna: string, valor: string) => {
      llamadas.push(["eq", columna, valor]);
      return consulta;
    },
    like: (columna: string, patron: string) => {
      llamadas.push(["like", columna, patron]);
      return consulta;
    },
    order: (columna: string) => {
      llamadas.push(["order", columna]);
      return consulta;
    },
    limit: (n: number) => {
      llamadas.push(["limit", String(n)]);
      return consulta;
    },
    then: (ok: (v: unknown) => unknown, fail: (e: unknown) => unknown) =>
      Promise.resolve({ data, error: null }).then(ok, fail),
  };
  return { from: () => consulta };
}

vi.mock("@/lib/supabase/domain-query", () => ({
  requireCodigoCuenta: (c: string) => {
    if (!c) throw new Error("Falta la cuenta.");
    return c;
  },
  runDomainQuery: async (cb: (c: unknown) => PromiseLike<unknown>) => {
    const respuesta = (await cb(crearCliente())) as { data: unknown; error: { message: string } | null };
    if (respuesta.error) throw new Error(respuesta.error.message);
    return respuesta.data;
  },
}));

const fila = (codigo: string, oc: string | null, paths: string[]) => ({
  id_orden_venta: `id-${codigo}`,
  codigo,
  orden_compra_hotel: oc,
  estado: "confirmada",
  origen_archivos: origen(...paths),
});

describe("buscarOvsDelMismoCorreo", () => {
  beforeEach(() => {
    llamadas.length = 0;
    consultas = 0;
    filas = [];
    colaFilas = [];
  });

  it("filtra siempre por la cuenta", async () => {
    await buscarOvsDelMismoCorreo({ codigoCuenta: "1YW43", origenArchivos: origen(PATH) });

    expect(llamadas).toContainEqual(["eq", "codigo_cuenta", "1YW43"]);
  });

  it("sin path uuid: vacío no consulta; legado intenta igualdad exacta y si no hay hermanas queda []", async () => {
    await expect(buscarOvsDelMismoCorreo({ codigoCuenta: "c", origenArchivos: "" })).resolves.toEqual([]);
    await expect(buscarOvsDelMismoCorreo({ codigoCuenta: "c", origenArchivos: null })).resolves.toEqual([]);
    expect(consultas).toBe(0);

    filas = [fila("OV-1", "1", ["solo-nombre.pdf"])];
    await expect(
      buscarOvsDelMismoCorreo({ codigoCuenta: "c", origenArchivos: "a.pdf, b.pdf" }),
    ).resolves.toEqual([]);
    expect(consultas).toBe(1);
    expect(llamadas).toContainEqual(["eq", "origen_archivos", "a.pdf, b.pdf"]);
  });

  it("REQ-347: si hay ≥2 con el mismo origen_archivos exacto, no hace falta el LIKE", async () => {
    const json = origen(PATH);
    filas = [
      fila("OV-00001873", "4500140182", [PATH]),
      fila("OV-00001874", "4500140188", [PATH]),
    ];

    const res = await buscarOvsDelMismoCorreo({ codigoCuenta: "c", origenArchivos: json });

    expect(res).toHaveLength(2);
    expect(llamadas.some((l) => l[0] === "like")).toBe(false);
    expect(llamadas).toContainEqual(["eq", "origen_archivos", json]);
  });

  it("busca por LIKE usando el uuid del envío cuando no hay >=2 exactas", async () => {
    const path = `c/${UUID}-100%_oc.pdf`;
    // Exactas < 2 → cae al LIKE
    filas = [fila("OV-unica", "1", [path])];

    await buscarOvsDelMismoCorreo({ codigoCuenta: "c", origenArchivos: origen(path) });

    const like = llamadas.find((l) => l[0] === "like")!;
    expect(like[2]).toBe(`%${UUID}%`);
  });

  it("REQ-361: incluye hermanas del mismo envío con adjunto distinto y descarta otro uuid", async () => {
    const OTRO_UUID = "99999999-8888-4777-8666-555555555555";
    colaFilas = [
      [fila("OV-unica", "1", [PATH])],
      [
        fila("OV-00001873", "4500140182", [PATH]),
        fila("OV-00001874", "4500140188", [`c/${UUID}-OC-140188.pdf`]),
        fila("OV-00009999", null, [`c/${OTRO_UUID}-OTRO.pdf`]),
      ],
    ];

    const res = await buscarOvsDelMismoCorreo({ codigoCuenta: "c", origenArchivos: origen(PATH) });

    expect(res).toEqual([
      { idOrdenVenta: "id-OV-00001873", codigo: "OV-00001873", ordenCompra: "4500140182" },
      { idOrdenVenta: "id-OV-00001874", codigo: "OV-00001874", ordenCompra: "4500140188" },
    ]);
  });

  it("REQ-347: excluye canceladas del aviso", async () => {
    const json = origen(PATH);
    filas = [
      fila("OV-00001873", "4500140182", [PATH]),
      { ...fila("OV-00001874", "4500140188", [PATH]), estado: "cancelada" },
      fila("OV-00001875", "4500140190", [PATH]),
    ];

    const res = await buscarOvsDelMismoCorreo({ codigoCuenta: "c", origenArchivos: json });

    expect(res.map((h) => h.codigo)).toEqual(["OV-00001873", "OV-00001875"]);
  });

  it("con la cuenta vacía lanza, igual que requireCodigoCuenta", async () => {
    await expect(buscarOvsDelMismoCorreo({ codigoCuenta: "", origenArchivos: origen(PATH) })).rejects.toThrow();
  });
});
