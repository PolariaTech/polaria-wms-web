import { describe, expect, it } from "vitest";
import {
  etapaInventarioPermiteEntrada,
  getInventarioEtapasConKg,
  type InventarioMercanciaReport,
} from "./inventario-mercancia-report.service";
import { tipoBodegaParaEtapa } from "./inventario-mercancia-listado.service";
import {
  usaInventarioMitSchema,
  usaKgMitInventarioExterna,
} from "../constants/mit-inventario-fridem";

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

  it("resalta etapas con kg > 0 y siempre bodega externa", () => {
    expect(getInventarioEtapasConKg(report)).toEqual([
      "proveedor",
      "bodega_interna",
      "bodega_externa",
      "ventas",
    ]);
  });

  it("permite entrar solo si hay kg, excepto bodega externa", () => {
    expect(etapaInventarioPermiteEntrada(10)).toBe(true);
    expect(etapaInventarioPermiteEntrada(0)).toBe(false);
    expect(etapaInventarioPermiteEntrada(0, "bodega_externa")).toBe(true);
    expect(etapaInventarioPermiteEntrada(0, "bodega_interna")).toBe(false);
  });

  it("filtra tipo de bodega según etapa", () => {
    expect(tipoBodegaParaEtapa("bodega_interna")).toBe("interna");
    expect(tipoBodegaParaEtapa("bodega_externa")).toBe("externa");
    expect(tipoBodegaParaEtapa("proveedor")).toBe("ambas");
  });

  it("usa mit.inventario solo para cuenta Mit + bodega Fridem", () => {
    expect(usaInventarioMitSchema("02808", "Fridem")).toBe(true);
    expect(usaInventarioMitSchema("02808", "fridem")).toBe(true);
    expect(usaInventarioMitSchema("02808", "TCI")).toBe(false);
    expect(usaInventarioMitSchema("JBR", "Fridem")).toBe(false);
    expect(usaKgMitInventarioExterna("02808")).toBe(true);
    expect(usaKgMitInventarioExterna("JBR")).toBe(false);
  });
});
