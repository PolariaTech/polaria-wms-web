import { describe, expect, it } from "vitest";
import {
  buildProcesamientoDesgloseEstimado,
  estimadoSecundarioAplicarPerdidaPct,
  unidadesSecundarioPorKgPrimario,
  unidadesSecundarioPorRegla,
} from "./procesamiento-conversion";

describe("procesamiento-conversion", () => {
  it("calcula unidades secundario por regla", () => {
    expect(unidadesSecundarioPorRegla(10, 1, 5)).toBe(50);
    expect(unidadesSecundarioPorKgPrimario(1, 5)).toBe(5);
  });

  it("aplica merma al estimado", () => {
    expect(estimadoSecundarioAplicarPerdidaPct(100, 10)).toBe(90);
    expect(estimadoSecundarioAplicarPerdidaPct(100, 0)).toBe(100);
  });

  it("arma desglose de estimado", () => {
    const desglose = buildProcesamientoDesgloseEstimado(10.5, 12, 50);
    expect(desglose?.uInt).toBe(10);
    expect(desglose?.sobranteKg).toBeGreaterThan(0);
    expect(desglose?.mermaUnidades).toBe(1.5);
  });
});
