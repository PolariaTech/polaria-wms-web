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

describe("hasOtPagerRequiredBlocking (REQ-233)", () => {
  it("nunca bloquea el pager (Cypher permite moverse libre)", () => {
    expect(hasOtPagerRequiredBlocking(base)).toBe(false);
    expect(
      hasOtPagerRequiredBlocking({ ...base, idComprador: "" }),
    ).toBe(false);
    expect(
      hasOtPagerRequiredBlocking({
        ...base,
        exigeOc: true,
        ordenCompraHotel: "",
      }),
    ).toBe(false);
    expect(
      hasOtPagerRequiredBlocking({
        ...base,
        lineasPagina: [{ cantidadInput: "", precioInput: "" }],
      }),
    ).toBe(false);
  });
});
