import { describe, expect, it } from "vitest";
import {
  formatCompradorLabel,
  isSamePrecio,
  matchesSearch,
  precioToTexto,
} from "./comprador-alias-create-modal.helpers";

describe("comprador-alias-create-modal.helpers", () => {
  it("formatea etiqueta de comprador", () => {
    expect(
      formatCompradorLabel({
        codigo: "C1",
        comprador: "Hotel",
      } as never),
    ).toBe("C1 — Hotel");
  });

  it("precioToTexto e isSamePrecio", () => {
    expect(precioToTexto(undefined)).toBe("");
    expect(precioToTexto(12.5)).toBe("12.5");
    expect(isSamePrecio(undefined, "")).toBe(true);
    expect(isSamePrecio(10, "10")).toBe(true);
    expect(isSamePrecio(10, "11")).toBe(false);
  });

  it("matchesSearch por tokens", () => {
    expect(matchesSearch("Aguacate Hass Extra", "aguacate")).toBe(true);
    expect(matchesSearch("Aguacate Hass Extra", "tomate")).toBe(false);
  });
});
