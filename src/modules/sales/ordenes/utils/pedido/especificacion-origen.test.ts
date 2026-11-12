import { describe, expect, it } from "vitest";
import { fraseSinEnvase, frasesDeEspecificacion } from "./especificacion-origen";

describe("frasesDeEspecificacion (REQ-287)", () => {
  it("parte por coma, punto y coma y punto medio", () => {
    expect(frasesDeEspecificacion("Limpio, por kilo; sin cáscara · fresco.")).toEqual([
      "Limpio",
      "por kilo",
      "sin cáscara",
      "fresco",
    ]);
  });

  it("no rompe un paréntesis", () => {
    expect(frasesDeEspecificacion("Limpio por kilo (sin cascara, sin hojas)")).toEqual([
      "Limpio por kilo (sin cascara, sin hojas)",
    ]);
  });

  it("vacío o null no da frases", () => {
    expect(frasesDeEspecificacion(null)).toEqual([]);
    expect(frasesDeEspecificacion("  ")).toEqual([]);
  });
});

describe("fraseSinEnvase", () => {
  it("quita el envase si ya viene calculado y deja lo demás", () => {
    expect(fraseSinEnvase("Jugo de Naranja fresco cubeta de 10 litros", true)).toBe("Jugo de Naranja fresco");
    expect(fraseSinEnvase("18x cubeta de 10 litros", true)).toBe("");
    expect(fraseSinEnvase("galón de 5 litros", true)).toBe("");
  });

  it("sin envase calculado no toca la frase", () => {
    expect(fraseSinEnvase("galón de 5 litros", false)).toBe("galón de 5 litros");
  });
});
