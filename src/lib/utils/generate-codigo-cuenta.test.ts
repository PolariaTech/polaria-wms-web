import { describe, expect, it } from "vitest";
import {
  generateCodigoCuentaFromNombre,
  normalizeCodigoCuentaInput,
} from "./generate-codigo-cuenta";

describe("generateCodigoCuentaFromNombre", () => {
  it("genera 5 caracteres en base 36", () => {
    const code = generateCodigoCuentaFromNombre("Mitre");
    expect(code).toHaveLength(5);
    expect(code).toMatch(/^[0-9A-Z]{5}$/);
  });

  it("retorna vacío sin nombre", () => {
    expect(generateCodigoCuentaFromNombre("   ")).toBe("");
  });
});

describe("normalizeCodigoCuentaInput", () => {
  it("normaliza a mayúsculas alfanuméricas", () => {
    expect(normalizeCodigoCuentaInput(" mit-00 ")).toBe("MIT00");
  });
});
