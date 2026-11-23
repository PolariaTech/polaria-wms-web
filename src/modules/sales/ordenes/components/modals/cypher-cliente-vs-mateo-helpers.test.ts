import { describe, expect, it } from "vitest";
import {
  firstNonEmpty,
  mateoSoloSugerencia,
  normalizeKey,
  usuarioSiConfirmado,
} from "./cypher-cliente-vs-mateo-helpers";

describe("cypher-cliente-vs-mateo-helpers", () => {
  it("firstNonEmpty devuelve el primer valor con contenido", () => {
    expect(firstNonEmpty(["", "  ", "ok", "otro"])).toBe("ok");
    expect(firstNonEmpty([null, undefined, ""])).toBe("");
  });

  it("normalizeKey colapsa acentos y puntuación", () => {
    expect(normalizeKey("  Café-Leche  ")).toBe("cafe leche");
  });

  it("mateoSoloSugerencia oculta ecos del correo", () => {
    expect(mateoSoloSugerencia("Hotel X", "hotel x")).toBe("");
    expect(mateoSoloSugerencia("Hotel Y", "Hotel X")).toBe("Hotel Y");
  });

  it("usuarioSiConfirmado solo expone valor tras confirmar", () => {
    expect(usuarioSiConfirmado(false, "Cliente A")).toBe("");
    expect(usuarioSiConfirmado(true, "Cliente A")).toBe("Cliente A");
  });
});