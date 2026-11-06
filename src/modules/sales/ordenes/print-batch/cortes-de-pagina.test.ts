import { describe, expect, it } from "vitest";
import { calcularCortes } from "./cortes-de-pagina";

/**
 * Un lienzo de `alto` filas. `texto` son tramos con tinta a medias (un bloque de renglones) y
 * `rayas` son filas con tinta de lado a lado (el filo de una tabla).
 */
function tintaDe(alto: number, texto: Array<[number, number]> = [], rayas: number[] = []): number[] {
  const filas = new Array<number>(alto).fill(0);
  for (const [desde, hasta] of texto) for (let y = desde; y < hasta; y += 1) filas[y] = 0.3;
  for (const y of rayas) filas[y] = 1;
  return filas;
}

describe("calcularCortes", () => {
  it("un documento que cabe en una hoja no se corta", () => {
    expect(calcularCortes({ alto: 900, altoPagina: 1000, tinta: tintaDe(900), maxPaginas: 10 })).toEqual([]);
  });

  it("corta en el hueco más bajo que cabe en la hoja, no por la mitad de un bloque", () => {
    // Bloques de texto con huecos de 20 filas; el límite (1000) cae dentro del tercero.
    const tinta = tintaDe(1500, [
      [0, 380],
      [400, 780],
      [800, 1200],
      [1220, 1500],
    ]);

    expect(calcularCortes({ alto: 1500, altoPagina: 1000, tinta, maxPaginas: 10 })).toEqual([789]);
  });

  it("si hay una raya encima de la franja, corta pegado a ella para cerrar la hoja con la raya", () => {
    // Raya en la fila 700 y aire hasta que arranca el siguiente bloque en 730.
    const tinta = tintaDe(1500, [[0, 699], [730, 1500]], [700]);

    const [corte] = calcularCortes({ alto: 1500, altoPagina: 1000, tinta, maxPaginas: 10 });

    expect(corte).toBeGreaterThan(700);
    expect(corte).toBeLessThanOrEqual(705);
  });

  it("prefiere cortar bajo una raya aunque haya un hueco más abajo: el encabezado viaja con sus filas", () => {
    // Raya en 700 con aire hasta 720; texto; hueco plano entre 900 y 930 (más abajo, antes del límite).
    const tinta = tintaDe(1500, [[0, 699], [720, 900], [930, 1500]], [700]);

    const [corte] = calcularCortes({ alto: 1500, altoPagina: 1000, tinta, maxPaginas: 10 });

    expect(corte).toBeGreaterThan(700);
    expect(corte).toBeLessThanOrEqual(705);
  });

  it("no corta en un hueco que deja la hoja casi vacía", () => {
    // El único hueco está en la fila 200: antes de la mitad de la hoja. Se prefiere el corte duro.
    const tinta = tintaDe(1500, [[0, 190], [220, 1500]]);

    expect(calcularCortes({ alto: 1500, altoPagina: 1000, tinta, maxPaginas: 10 })).toEqual([1000]);
  });

  it("ignora los huecos de pocas filas: son el espacio entre renglones, no un lugar de corte", () => {
    const tinta = tintaDe(1500, [[0, 800], [803, 1500]]);

    expect(calcularCortes({ alto: 1500, altoPagina: 1000, tinta, maxPaginas: 10 })).toEqual([1000]);
  });

  it("si un bloque es más alto que la hoja corta duro en el límite", () => {
    const tinta = tintaDe(1500, [[100, 1400]]);

    expect(calcularCortes({ alto: 1500, altoPagina: 1000, tinta, maxPaginas: 10 })).toEqual([1000]);
  });

  it("reparte un documento largo en varias hojas, cada una dentro del alto útil", () => {
    const tinta = tintaDe(2500, [
      [0, 940],
      [960, 1880],
      [1900, 2500],
    ]);

    const cortes = calcularCortes({ alto: 2500, altoPagina: 1000, tinta, maxPaginas: 10 });

    expect(cortes).toHaveLength(2);
    const limites = [0, ...cortes, 2500];
    for (let i = 1; i < limites.length; i += 1) {
      expect(limites[i]! - limites[i - 1]!).toBeLessThanOrEqual(1000);
    }
  });

  it("respeta el tope de hojas", () => {
    const cortes = calcularCortes({ alto: 90_000, altoPagina: 1000, tinta: tintaDe(90_000, [[0, 90_000]]), maxPaginas: 4 });

    expect(cortes).toHaveLength(3);
  });
});
