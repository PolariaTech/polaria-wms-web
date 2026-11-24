import { describe, expect, it } from "vitest";
import {
  absorberAliasDocumentacion,
  normalizeProductoKey,
  pareceFolioManuscrito,
  pareceNombrePersona,
} from "./openai-surtido-campos";

describe("normalizeProductoKey", () => {
  it("quita acentos y unifica", () => {
    expect(normalizeProductoKey("Blue Berry")).toBe("BLUE BERRY");
  });
});

describe("pareceFolioManuscrito", () => {
  it("detecta folios con dígitos", () => {
    expect(pareceFolioManuscrito("F-2026")).toBe(true);
    expect(pareceFolioManuscrito("Juan")).toBe(false);
  });
});

describe("pareceNombrePersona", () => {
  it("rechaza números", () => {
    expect(pareceNombrePersona("Ana Ruiz")).toBe(true);
    expect(pareceNombrePersona("F-1")).toBe(false);
  });
});

describe("absorberAliasDocumentacion", () => {
  it("mapea Documentación folio a canónico", () => {
    const campos: Record<string, string> = {
      "Documentación folio": "F-99",
    };
    absorberAliasDocumentacion(campos);
    expect(campos.facturaOkFolio).toBe("F-99");
    expect(campos["Documentación folio"]).toBeUndefined();
  });
});