import { describe, expect, it } from "vitest";
import {
  calibresClienteYCatalogoConflictivos,
  matchRequiereConfirmacionPorVariedadOCalibre,
  unmatchedTokensIncluyenVariedad,
} from "./variedad-calibre-match";

describe("calibresClienteYCatalogoConflictivos (REQ-369)", () => {
  it("conflictúa 210–230 vs 140–170", () => {
    expect(
      calibresClienteYCatalogoConflictivos(
        "AGUACATE HASS DE 210 A 230 GR",
        "AGUACATE MEDIANO (140 a 170g)",
      ),
    ).toBe(true);
  });

  it("no conflictúa rangos que se solapan (260 vs 250 del mismo extra)", () => {
    expect(
      calibresClienteYCatalogoConflictivos(
        "AGUACATE EXTRA (200 a 260g)",
        "AGUACATE EXTRA (200 a 250g)",
      ),
    ).toBe(false);
  });

  it("sin calibre en catálogo no conflictúa (talla va a espec)", () => {
    expect(
      calibresClienteYCatalogoConflictivos(
        "PLATANO MACHO DE 20 A 25 CM ACOE",
        "PLATANO MACHO",
      ),
    ).toBe(false);
  });
});

describe("unmatchedTokensIncluyenVariedad (REQ-369)", () => {
  it("detecta larga/hass; ignora ruido de almacén", () => {
    expect(unmatchedTokensIncluyenVariedad(["larga"])).toBe(true);
    expect(unmatchedTokensIncluyenVariedad(["hass"])).toBe(true);
    expect(unmatchedTokensIncluyenVariedad(["acoe"])).toBe(false);
  });
});

describe("matchRequiereConfirmacionPorVariedadOCalibre (REQ-369)", () => {
  it("código exacto no pide confirmación", () => {
    expect(
      matchRequiereConfirmacionPorVariedadOCalibre({
        textoCliente: "LECHUGA LARGA 115001433",
        nombreCatalogo: "LECHUGA ROMANA",
        codigoYaCoincide: true,
        unmatchedDistinctiveTokens: ["larga"],
      }),
    ).toBe(false);
  });

  it("lechuga larga vs romana (variedad descubierta)", () => {
    expect(
      matchRequiereConfirmacionPorVariedadOCalibre({
        textoCliente: "LECHUGA LARGA",
        nombreCatalogo: "LECHUGA ROMANA",
        codigoYaCoincide: false,
        unmatchedDistinctiveTokens: ["larga"],
      }),
    ).toBe(true);
  });

  it("brócoli pata corta vs BROCOLI base: no choca (apodo, no otra SKU)", () => {
    expect(
      matchRequiereConfirmacionPorVariedadOCalibre({
        textoCliente: "BROCOLI PATA CORTA",
        nombreCatalogo: "BROCOLI",
        codigoYaCoincide: false,
        unmatchedDistinctiveTokens: ["pata", "corta"],
      }),
    ).toBe(false);
  });

  it("aguacate hass calibre vs mediano", () => {
    expect(
      matchRequiereConfirmacionPorVariedadOCalibre({
        textoCliente: "AGUACATE HASS DE 210 A 230 GR",
        nombreCatalogo: "AGUACATE MEDIANO (140 a 170g)",
        codigoYaCoincide: false,
        unmatchedDistinctiveTokens: ["hass"],
      }),
    ).toBe(true);
  });
});
