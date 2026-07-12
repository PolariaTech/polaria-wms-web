import { describe, expect, it } from "vitest";
import { resolvePrecioUnitarioFromMetadatos } from "./sales-precio";

describe("resolvePrecioUnitarioFromMetadatos", () => {
  it("lee precio desde metadatos_catalogo", () => {
    expect(resolvePrecioUnitarioFromMetadatos({ precio: "12000" })).toBe(12000);
    expect(resolvePrecioUnitarioFromMetadatos({ precio: "15,5" })).toBe(15.5);
  });

  it("devuelve 0 si no hay precio", () => {
    expect(resolvePrecioUnitarioFromMetadatos(null)).toBe(0);
    expect(resolvePrecioUnitarioFromMetadatos({})).toBe(0);
  });
});
