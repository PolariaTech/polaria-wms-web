import { describe, expect, it } from "vitest";
import { hasOtPagerRequiredBlocking } from "./ot-pager-required";

const base = {
  idComprador: "c1",
  exigeOc: false,
  ordenCompraHotel: "",
  idBodegaDestino: "b1",
  fechaEntrega: "2026-10-02",
  todayIso: "2026-10-01",
  ventanaDesde: "07:00",
  ventanaHasta: "13:00",
  lineasPagina: [{ cantidadInput: "10", precioInput: "25" }],
};

describe("hasOtPagerRequiredBlocking", () => {
  it("permite avanzar cuando lo obligatorio está completo", () => {
    expect(hasOtPagerRequiredBlocking(base)).toBe(false);
  });

  it("bloquea sin cliente", () => {
    expect(
      hasOtPagerRequiredBlocking({ ...base, idComprador: "" }),
    ).toBe(true);
  });

  it("bloquea OC solo si el cliente la exige", () => {
    expect(
      hasOtPagerRequiredBlocking({
        ...base,
        exigeOc: true,
        ordenCompraHotel: "",
      }),
    ).toBe(true);
    expect(
      hasOtPagerRequiredBlocking({
        ...base,
        exigeOc: false,
        ordenCompraHotel: "",
      }),
    ).toBe(false);
  });

  it("bloquea líneas de la página sin cantidad o precio", () => {
    expect(
      hasOtPagerRequiredBlocking({
        ...base,
        lineasPagina: [{ cantidadInput: "", precioInput: "10" }],
      }),
    ).toBe(true);
    expect(
      hasOtPagerRequiredBlocking({
        ...base,
        lineasPagina: [{ cantidadInput: "5", precioInput: "0" }],
      }),
    ).toBe(true);
  });

  it("no bloquea por campos opcionales vacíos (solo mira obligatorios)", () => {
    expect(
      hasOtPagerRequiredBlocking({
        ...base,
        ordenCompraHotel: "",
        exigeOc: false,
      }),
    ).toBe(false);
  });
});
