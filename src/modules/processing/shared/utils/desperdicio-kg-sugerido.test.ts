import { describe, expect, it } from "vitest";
import {
  buildDesperdicioSugeridoDetalle,
  desperdicioKgSugeridoDesdeMerma,
  stringKgInicialDesperdicio,
} from "./desperdicio-kg-sugerido";

describe("desperdicio-kg-sugerido", () => {
  it("calcula kg primario × % merma", () => {
    expect(
      desperdicioKgSugeridoDesdeMerma({
        kilosPrimario: 10,
        perdidaProcesamientoPct: 8,
      }),
    ).toBe(0.8);
  });

  it("devuelve null sin porcentaje", () => {
    expect(
      desperdicioKgSugeridoDesdeMerma({
        kilosPrimario: 10,
        perdidaProcesamientoPct: 0,
      }),
    ).toBeNull();
  });

  it("stringKgInicialDesperdicio normaliza valores", () => {
    expect(stringKgInicialDesperdicio(null)).toBe("0");
    expect(stringKgInicialDesperdicio(2.5)).toBe("2.5");
  });

  it("arma detalle para UI", () => {
    const detalle = buildDesperdicioSugeridoDetalle({
      kilosPrimario: "10",
      perdidaProcesamientoPct: "12",
    });
    expect(detalle.perdidaPct).toBe(12);
    expect(detalle.desperdicioKg).toBe(1.2);
  });
});
