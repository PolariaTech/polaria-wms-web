import { describe, expect, it } from "vitest";
import type { OrigenCorreoRenglon } from "../origen/origen-correo-ordenes-trabajo";
import {
  emparejarLineasConRenglones,
  normalizarTextoProducto,
  textoClienteDeLinea,
} from "./emparejar-lineas-renglones";

describe("normalizarTextoProducto", () => {
  it("ignora mayúsculas, acentos y espacios de más", () => {
    expect(normalizarTextoProducto("  Piña   MIEL ")).toBe("pina miel");
    expect(normalizarTextoProducto(null)).toBe("");
  });
});

describe("textoClienteDeLinea", () => {
  it("prefiere el texto del formulario y si no, el de match_producto", () => {
    expect(textoClienteDeLinea({ matchTextoCliente: "Lechuga Larga" })).toBe("lechuga larga");
    expect(textoClienteDeLinea({ match_producto: { textoCliente: "Chile Serrano" } })).toBe(
      "chile serrano",
    );
  });

  it("sin texto o con match_producto raro devuelve vacío", () => {
    expect(textoClienteDeLinea({})).toBe("");
    expect(textoClienteDeLinea({ match_producto: "texto" })).toBe("");
    expect(textoClienteDeLinea({ match_producto: { textoCliente: 7 } })).toBe("");
  });
});

describe("emparejarLineasConRenglones", () => {
  const renglones: OrigenCorreoRenglon[] = [
    { Producto: "LECHUGA LARGA" },
    { Producto: "LECHUGA ROMANA" },
  ];
  const puntuar = (linea: { puntajes: number[] }, renglon: OrigenCorreoRenglon) =>
    linea.puntajes[renglones.indexOf(renglon)] ?? -1;

  it("asigna primero el mejor par aunque su renglón venga después", () => {
    // La única línea encaja algo con LARGA (renglón 0) y mucho con ROMANA (renglón 1).
    const pares = emparejarLineasConRenglones([{ puntajes: [5, 100] }], renglones, puntuar);

    expect([...pares.entries()]).toEqual([[0, 1]]);
  });

  it("1:1 y sin pares con puntaje negativo", () => {
    const lineas = [{ puntajes: [100, 100] }, { puntajes: [-1, 50] }, { puntajes: [-1, -1] }];

    const pares = emparejarLineasConRenglones(lineas, renglones, puntuar);

    expect(pares.get(0)).toBe(0);
    expect(pares.get(1)).toBe(1);
    expect(pares.has(2)).toBe(false);
  });
});
