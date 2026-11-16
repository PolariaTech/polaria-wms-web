import { beforeEach, describe, expect, it, vi } from "vitest";
import { buscarOvsDelMismoCorreo } from "./ovs-del-mismo-correo";

const UUID = "3f2a9c1e-7b44-4d1a-9e0f-1a2b3c4d5e6f";
const PATH = `cuenta/${UUID}-OC-140188.pdf`;
const origen = (...paths: string[]) => JSON.stringify(paths.map((path) => ({ nombre: "x.pdf", path })));

const llamadas: Array<[string, ...string[]]> = [];
let consultas = 0;
let filas: unknown[] = [];

function crearCliente() {
  consultas += 1;
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
      Promise.resolve({ data: filas, error: null }).then(ok, fail),
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
  });

  it("filtra siempre por la cuenta", async () => {
    await buscarOvsDelMismoCorreo({ codigoCuenta: "1YW43", origenArchivos: origen(PATH) });

    expect(llamadas).toContainEqual(["eq", "codigo_cuenta", "1YW43"]);
  });

  it("sin ruta con uuid (legado o vacío) devuelve [] sin consultar", async () => {
    await expect(buscarOvsDelMismoCorreo({ codigoCuenta: "c", origenArchivos: "a.pdf, b.pdf" })).resolves.toEqual([]);
    await expect(buscarOvsDelMismoCorreo({ codigoCuenta: "c", origenArchivos: "" })).resolves.toEqual([]);
    await expect(buscarOvsDelMismoCorreo({ codigoCuenta: "c", origenArchivos: null })).resolves.toEqual([]);
    expect(consultas).toBe(0);
  });

  it("escapa % y _ de la ruta en el patrón LIKE", async () => {
    const path = `c/${UUID}-100%_oc.pdf`;

    await buscarOvsDelMismoCorreo({ codigoCuenta: "c", origenArchivos: origen(path) });

    const like = llamadas.find((l) => l[0] === "like")!;
    expect(like[2]).toContain("100\\%\\_oc");
  });

  it("descarta las filas cuyo origen no contiene esa misma ruta y devuelve las demás", async () => {
    filas = [
      fila("OV-00001873", "4500140182", [PATH]),
      fila("OV-00001874", "4500140188", [PATH, "c/otro"]),
      fila("OV-00009999", null, [`c/${UUID}-OTRO.pdf`]),
    ];

    const res = await buscarOvsDelMismoCorreo({ codigoCuenta: "c", origenArchivos: origen(PATH) });

    expect(res).toEqual([
      { idOrdenVenta: "id-OV-00001873", codigo: "OV-00001873", ordenCompra: "4500140182" },
      { idOrdenVenta: "id-OV-00001874", codigo: "OV-00001874", ordenCompra: "4500140188" },
    ]);
  });

  it("con la cuenta vacía lanza, igual que requireCodigoCuenta", async () => {
    await expect(buscarOvsDelMismoCorreo({ codigoCuenta: "", origenArchivos: origen(PATH) })).rejects.toThrow();
  });
});
