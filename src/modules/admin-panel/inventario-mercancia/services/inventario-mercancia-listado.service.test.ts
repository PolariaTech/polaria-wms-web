import { describe, expect, it } from "vitest";
import {
  etapaInventarioPermiteEntrada,
  getInventarioEtapasConKg,
  type InventarioMercanciaReport,
} from "./inventario-mercancia-report.service";
import { tipoBodegaParaEtapa } from "./inventario-mercancia-listado.service";

describe("inventario-mercancia highlights", () => {
  const report: InventarioMercanciaReport = {
    etapas: [
      { id: "proveedor", label: "Proveedor", kg: 10 },
      { id: "transporte", label: "Transporte", kg: 0 },
      { id: "bodega_interna", label: "Bodega interna", kg: 67.3 },
      { id: "bodega_externa", label: "Bodega externa", kg: 0 },
      { id: "ventas", label: "Ventas", kg: 40 },
    ],
  };

  it("resalta todas las etapas con kg > 0", () => {
    expect(getInventarioEtapasConKg(report)).toEqual([
      "proveedor",
      "bodega_interna",
      "ventas",
    ]);
  });

  it("permite entrar solo si hay kg", () => {
    expect(etapaInventarioPermiteEntrada(10)).toBe(true);
    expect(etapaInventarioPermiteEntrada(0)).toBe(false);
  });

  it("filtra tipo de bodega según etapa", () => {
    expect(tipoBodegaParaEtapa("bodega_interna")).toBe("interna");
    expect(tipoBodegaParaEtapa("bodega_externa")).toBe("externa");
    expect(tipoBodegaParaEtapa("proveedor")).toBe("ambas");
  });
});
