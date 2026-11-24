import { describe, expect, it } from "vitest";
import {
  extractCuerpoCorreo,
  extractFromHtml,
  plainPareceTablaAplastada,
} from "./file-extractors-html";
import { plainPareceTablaAplastada as desdeExtractores } from "./file-extractors";

describe("extractFromHtml", () => {
  it("convierte una tabla HTML en texto con columnas y quita enlaces", () => {
    const html =
      '<table><tr><th>SKU</th><th>Cant</th></tr><tr><td>X1</td><td>5</td></tr></table><a href="https://x.test">ver</a>';

    const texto = extractFromHtml(Buffer.from(html));

    expect(texto).toContain("SKU");
    expect(texto).toContain("X1");
    expect(texto).not.toContain("https://x.test");
  });
});

describe("extractCuerpoCorreo", () => {
  it("prefiere el HTML cuando trae una tabla", () => {
    const cuerpo = extractCuerpoCorreo({
      text: "plano",
      html: "<table><tr><td>A</td><td>B</td></tr></table>",
    });

    expect(cuerpo).toContain("A");
    expect(cuerpo).not.toBe("plano");
  });

  it("usa el texto plano cuando no hay HTML", () => {
    expect(extractCuerpoCorreo({ text: "  hola  ", html: false })).toBe("hola");
  });
});

describe("plainPareceTablaAplastada", () => {
  it("detecta una celda por línea sin columnas alineadas", () => {
    const aplastada = ["SKU", "Producto", "Cantidad", "Unidad", "Precio", "X1", "Tomate", "5"].join("\n");

    expect(plainPareceTablaAplastada(aplastada)).toBe(true);
  });

  it("no marca como aplastado un texto corto", () => {
    expect(plainPareceTablaAplastada("hola\nadios")).toBe(false);
  });

  it("file-extractors sigue exportando la misma función", () => {
    expect(desdeExtractores).toBe(plainPareceTablaAplastada);
  });
});
