import { describe, expect, it } from "vitest";
import { createEmptyBodegaReportesData } from "./bodega-reportes.service";

describe("createEmptyBodegaReportesData", () => {
  it("incluye las cinco categorías del gráfico de barras en cero", () => {
    const data = createEmptyBodegaReportesData();

    expect(data.barChart).toHaveLength(5);
    expect(data.barChart.every((point) => point.value === 0)).toBe(true);
    expect(data.donutChart).toHaveLength(0);
    expect(data.resumen.mermaKg).toBe(0);
  });
});
