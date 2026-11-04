import { describe, expect, it } from "vitest";
import { isOrigenOnlyFirstDraft } from "./create-orden-venta-origen-only-draft";

describe("isOrigenOnlyFirstDraft (REQ-199)", () => {
  it("solo en primer avance con origen y sin OV existente", () => {
    expect(
      isOrigenOnlyFirstDraft({
        guardarAvance: true,
        idOrdenVentaExistente: "",
        tieneOrigenCaptura: true,
      }),
    ).toBe(true);
    expect(
      isOrigenOnlyFirstDraft({
        guardarAvance: true,
        idOrdenVentaExistente: "ov-1",
        tieneOrigenCaptura: true,
      }),
    ).toBe(false);
    expect(
      isOrigenOnlyFirstDraft({
        guardarAvance: false,
        idOrdenVentaExistente: "",
        tieneOrigenCaptura: true,
      }),
    ).toBe(false);
  });
});
