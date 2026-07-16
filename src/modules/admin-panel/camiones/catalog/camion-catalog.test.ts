import { describe, expect, it } from "vitest";
import {
  CAMION_MARCAS_CATALOG,
  CAMION_MODELOS_CATALOG,
  listModelosByMarcaId,
} from "./camion-vehiculos.catalog";
import {
  clampTemp,
  formatRangoTemperatura,
  TEMP_SLIDER_MAX,
  TEMP_SLIDER_MIN,
} from "./camion-tipo-temperatura";

describe("camion-vehiculos.catalog", () => {
  it("tiene marcas y modelos relacionados por marcaId", () => {
    expect(CAMION_MARCAS_CATALOG.length).toBeGreaterThan(5);
    expect(CAMION_MODELOS_CATALOG.length).toBeGreaterThan(10);

    for (const modelo of CAMION_MODELOS_CATALOG) {
      expect(
        CAMION_MARCAS_CATALOG.some((marca) => marca.id === modelo.marcaId),
      ).toBe(true);
    }
  });

  it("listModelosByMarcaId filtra por marca", () => {
    const volvo = listModelosByMarcaId("volvo");
    expect(volvo.length).toBeGreaterThan(0);
    expect(volvo.every((m) => m.marcaId === "volvo")).toBe(true);
  });
});

describe("camion-tipo-temperatura", () => {
  it("formatea rango y limita slider", () => {
    expect(formatRangoTemperatura(-18, 4)).toBe("-18 °C a 4 °C");
    expect(formatRangoTemperatura(4, 4)).toBe("4 °C");
    expect(clampTemp(TEMP_SLIDER_MIN - 10)).toBe(TEMP_SLIDER_MIN);
    expect(clampTemp(TEMP_SLIDER_MAX + 10)).toBe(TEMP_SLIDER_MAX);
  });
});
