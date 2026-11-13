import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductoVentaOption } from "../types/sales.types";
import { productosConFrasesDelComprador } from "./frases-comprador.service";

const filtrosEq: Array<[string, string]> = [];
let consultas = 0;

function crearCliente() {
  return {
    from(table: string) {
      consultas += 1;
      expect(table).toBe("comprador_producto_alias");
      const consulta: Record<string, unknown> = {
        select: (columnas: string) => {
          expect(columnas).toBe("id_producto, alias");
          expect(columnas.includes("alias_normalizado")).toBe(false);
          return consulta;
        },
        eq: (columna: string, valor: string) => {
          filtrosEq.push([columna, valor]);
          return consulta;
        },
        then: (ok: (v: unknown) => unknown, fail: (e: unknown) => unknown) =>
          Promise.resolve({
            data: [
              { id_producto: "p-granny", alias: "Manzana verde" },
              { id_producto: "p-granny", alias: "Granny" },
            ],
            error: null,
          }).then(ok, fail),
      };
      return consulta;
    },
  };
}

vi.mock("@/lib/supabase/domain-query", () => {
  const ejecutar = async (cb: (c: unknown) => PromiseLike<unknown>) => {
    const respuesta = (await cb(crearCliente())) as {
      data: unknown;
      error: { message: string } | null;
    };
    if (respuesta.error) throw new Error(respuesta.error.message);
    return respuesta.data;
  };
  return {
    requireCodigoCuenta: (c: string) => c,
    runDomainQuery: ejecutar,
  };
});

const granny: ProductoVentaOption = {
  idProducto: "p-granny",
  label: "MANZANA GRANNY SMITH (115001010)",
  idCliente: null,
  idBodega: "b1",
  codigo: "115001010",
  nombre: "MANZANA GRANNY SMITH",
  kgDisponible: 10,
  precioUnitario: 1,
  unidadMedida: "kg",
};

describe("productosConFrasesDelComprador", () => {
  beforeEach(() => {
    filtrosEq.length = 0;
    consultas = 0;
  });

  it("sin comprador no consulta y deja los productos igual", async () => {
    const productos = await productosConFrasesDelComprador({
      codigoCuenta: "cuenta-1",
      idComprador: null,
      productos: [granny],
    });
    expect(consultas).toBe(0);
    expect(productos).toEqual([granny]);
  });

  it("una sola consulta filtra por codigo_cuenta e id_comprador", async () => {
    const productos = await productosConFrasesDelComprador({
      codigoCuenta: "cuenta-1",
      idComprador: "comprador-1",
      productos: [granny],
    });
    expect(consultas).toBe(1);
    expect(filtrosEq).toEqual([
      ["codigo_cuenta", "cuenta-1"],
      ["id_comprador", "comprador-1"],
    ]);
    expect(productos[0]?.frasesCliente).toEqual(["Manzana verde", "Granny"]);
  });
});
