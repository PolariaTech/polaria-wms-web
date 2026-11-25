import { describe, expect, it } from "vitest";
import {
  expandNombresParcialesFirmas,
  sanitizeFacturaAsociada,
  sanitizeFacturaOkFolioFirma,
} from "./openai-surtido-sanitize";

describe("sanitizeFacturaAsociada", () => {
  it("limpia nombre copiado como factura", () => {
    const campos = { facturaAsociada: "Luis Cantillo", alistoNombre: "Luis Cantillo" };
    sanitizeFacturaAsociada(campos);
    expect(campos.facturaAsociada).toBeUndefined();
  });
});

describe("sanitizeFacturaOkFolioFirma", () => {
  it("intercambia folio y firma invertidos", () => {
    const campos = {
      facturaOkFolio: "Ana Ruiz",
      facturaOkFirma: "F-9081",
    };
    sanitizeFacturaOkFolioFirma(campos);
    expect(campos.facturaOkFolio).toBe("F-9081");
    expect(campos.facturaOkFirma).toBe("Ana Ruiz");
  });
});

describe("expandNombresParcialesFirmas", () => {
  it("completa apellido desde otro campo", () => {
    const campos = { revisoNombre: "Cantillo", alistoNombre: "Luis Cantillo" };
    expandNombresParcialesFirmas(campos);
    expect(campos.revisoNombre).toBe("Luis Cantillo");
  });
});