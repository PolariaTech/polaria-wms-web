import { describe, expect, it } from "vitest";
import {
  extractDomoEspecificacion,
  extractMadurezEspecificacion,
  textoYaTraeMadurez,
} from "./especificacion-madurez-domo";

describe("especificacion-madurez-domo (REQ-287)", () => {
  it("madurez rotulada conserva la etiqueta completa", () => {
    expect(extractMadurezEspecificacion("Madurez: Amarillo")).toBe(
      "Madurez: Amarillo",
    );
    expect(
      extractMadurezEspecificacion("AGUACATE HASS madurez: amarillo"),
    ).toBe("Madurez: Amarillo");
  });

  it("celda corta también sale con etiqueta Madurez:", () => {
    expect(extractMadurezEspecificacion("Amarillo")).toBe("Madurez: Amarillo");
    expect(extractMadurezEspecificacion("firme")).toBe("Madurez: Firme");
  });

  it("extrae Domo de 500g desde el nombre del producto", () => {
    expect(
      extractDomoEspecificacion(
        "FRAMBUESAS (DOMO) (Domo de 500 g) [Cód. 10501529]",
      ),
    ).toBe("Domo de 500g");
    expect(extractDomoEspecificacion("ZARZAMORA Domo de 500g")).toBe(
      "Domo de 500g",
    );
  });

  it("detecta madurez ya presente con o sin etiqueta", () => {
    expect(textoYaTraeMadurez("Amarillo · Firme", "Madurez: Amarillo")).toBe(
      true,
    );
    expect(textoYaTraeMadurez("Madurez: Amarillo", "Madurez: Amarillo")).toBe(
      true,
    );
    expect(textoYaTraeMadurez("sin penacho", "Madurez: Amarillo")).toBe(false);
  });
});
