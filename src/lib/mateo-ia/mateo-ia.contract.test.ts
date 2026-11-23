import { describe, expect, it } from "vitest";
import { parseMateoIaLectura } from "./mateo-ia.contract";

describe("parseMateoIaLectura", () => {
  const valido = {
    pedido: { lineas: [] },
    grupos: [],
    textoOrigen: "ok",
    documentos: [],
    advertencias: [],
    catalogoProductos: 3,
    tokensTotal: 10,
    costoUSD: null,
  };

  it("acepta el envelope de lectura", () => {
    expect(parseMateoIaLectura(valido).catalogoProductos).toBe(3);
  });

  it("falla con mensaje claro si falta pedido", () => {
    const { pedido: _, ...sinPedido } = valido;
    expect(() => parseMateoIaLectura(sinPedido)).toThrow(/Contrato mateo-ia-api/);
  });
});