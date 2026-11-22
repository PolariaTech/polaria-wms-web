import { describe, expect, it } from "vitest";
import { shouldAutoAcceptProductoSuggestion } from "./should-auto-accept-producto";

describe("shouldAutoAcceptProductoSuggestion (REQ-369)", () => {
  it("no auto-acepta variedad descubierta aunque el score sea alto", () => {
    expect(
      shouldAutoAcceptProductoSuggestion({
        query: "LECHUGA LARGA",
        sugerenciaNombre: "LECHUGA ROMANA",
        sugerenciaCodigo: "115001434",
        topScore: 0.9,
        secondScore: null,
        ambiguous: false,
      }),
    ).toBe(false);
  });

  it("sigue auto-aceptando el mismo extra con gramos cercanos", () => {
    expect(
      shouldAutoAcceptProductoSuggestion({
        query: "AGUACATE EXTRA (200 a 260g)",
        sugerenciaNombre: "AGUACATE EXTRA (200 a 250g)",
        sugerenciaCodigo: "115001005",
        topScore: 0.88,
        secondScore: 0.72,
        ambiguous: true,
      }),
    ).toBe(true);
  });
});
