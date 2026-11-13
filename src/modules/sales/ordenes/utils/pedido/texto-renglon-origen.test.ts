import { describe, expect, it } from "vitest";
import { extractDomoEspecificacion } from "./especificacion-madurez-domo";
import { parentesisDelRenglonDesdeTexto } from "./texto-renglon-origen";

const ORIGEN_OV_1980 = [
  "1. FRESAS (DOMO) (Domo de 1 kg) [Cód. 10501527] · 1 domo · $215.00/domo · $215.00",
  " Facturar: 1 kg · $215.00/kg · Cód. 105001503",
  "2. FRAMBUESAS (DOMO) (Domo de 200 g) [Cód. 10501529] · 1 domo · $64.00/domo · $64.00",
  " Facturar: 0.2 kg · $320.00/kg · Cód. 105001506",
  " Obs.: 170 GRAMOS",
  "3. ARÁNDANOS/BLUEBERRIES (DOMO) (Domo de 200 g) [Cód. 10501528] · 1 domo · $64.00/domo · $64.00",
  "4. ZARZAMORA (DOMO) (Domo de 170 g) [Cód. 10501531] · 1 domo · $70.00/domo · $70.00",
  "5. APIO [Cód. 105001554] · 1 pza · $18.00/pza · $18.00",
  " Obs.: 1 PZA LO QUE PESE",
  "6. BROCOLI [Cód. 105001500] · 2 kg · $33.00/kg · $66.00",
  "7. PEPINO [Cód. 10501519] · 4 kg · $25.00/kg · $100.00",
  "8. LIMON PERSA [Cód. 115001400] · 5 kg · $20.00/kg · $100.00",
  "9. JITOMATE GUAJE [Cód. 10501518] · 25 kg · $39.00/kg · Madurez: Amarillo · $975.00",
  "10. CEBOLLA BLANCA [Cód. 105001510] · 3 kg · $12.00/kg · $36.00",
  "11. ELOTE [Cód. 105001552] · 4 pza · $17.00/pza · $68.00",
  "12. PIÑA [Cód. 105001508] · 2 pza · $26.00/pza · $52.00",
].join("\n");

const RENGLON_AGUACATE =
  "1. AGUACATE EXTRA (200 a 260g) [Cód. 115001005] · 3 kg · $47.00/kg · Madurez: Amarillo · $141.00";

const DOMO_1KG = extractDomoEspecificacion("Domo de 1 kg");
const DOMO_200G = extractDomoEspecificacion("Domo de 200 g");

describe("parentesisDelRenglonDesdeTexto (REQ-323)", () => {
  it("FRESAS (DOMO) toma el domo que el renglón trae y el producto no", () => {
    expect(
      parentesisDelRenglonDesdeTexto(ORIGEN_OV_1980, "FRESAS (DOMO)"),
    ).toEqual([DOMO_1KG]);
  });

  it("FRAMBUESAS (DOMO) toma el domo de 200 g", () => {
    expect(
      parentesisDelRenglonDesdeTexto(ORIGEN_OV_1980, "FRAMBUESAS (DOMO)"),
    ).toEqual([DOMO_200G]);
  });

  it("no duplica el paréntesis si el producto ya lo trae", () => {
    expect(
      parentesisDelRenglonDesdeTexto(
        ORIGEN_OV_1980,
        "FRESAS (DOMO) (Domo de 1 kg)",
      ),
    ).toEqual([]);
  });

  it("APIO no aporta paréntesis porque su renglón no tiene", () => {
    expect(parentesisDelRenglonDesdeTexto(ORIGEN_OV_1980, "APIO")).toEqual([]);
  });

  it("AGUACATE EXTRA (200 a 260g) no repite el paréntesis del producto", () => {
    expect(
      parentesisDelRenglonDesdeTexto(
        RENGLON_AGUACATE,
        "AGUACATE EXTRA (200 a 260g)",
      ),
    ).toEqual([]);
  });

  it("AGUACATE EXTRA conserva el calibre que el renglón trae entre paréntesis", () => {
    expect(
      parentesisDelRenglonDesdeTexto(RENGLON_AGUACATE, "AGUACATE EXTRA"),
    ).toEqual(["200 a 260g"]);
  });

  it("exige palabras completas: PAPA no coincide con PAPAYA", () => {
    expect(
      parentesisDelRenglonDesdeTexto(
        "4. PAPAYA MARADOL (Pieza grande) [Cód. 1]",
        "PAPA",
      ),
    ).toEqual([]);
  });

  it("si hay dos renglones que coinciden, no adivina", () => {
    expect(
      parentesisDelRenglonDesdeTexto(
        [
          "1. CEBOLLA BLANCA (Grande) [Cód. 1] · 1 kg",
          "2. CEBOLLA MORADA (Chica) [Cód. 2] · 1 kg",
        ].join("\n"),
        "CEBOLLA",
      ),
    ).toEqual([]);
  });

  it("texto vacío, nulo o sin renglones numerados, o producto vacío, no inventa paréntesis", () => {
    expect(parentesisDelRenglonDesdeTexto("", "FRESAS (DOMO)")).toEqual([]);
    expect(parentesisDelRenglonDesdeTexto(null, "FRESAS (DOMO)")).toEqual([]);
    expect(
      parentesisDelRenglonDesdeTexto("PRODUCTOS\nTOTAL: $1", "FRESAS (DOMO)"),
    ).toEqual([]);
    expect(parentesisDelRenglonDesdeTexto(ORIGEN_OV_1980, "")).toEqual([]);
  });
});
