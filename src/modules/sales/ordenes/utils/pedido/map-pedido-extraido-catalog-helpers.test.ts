import { describe, expect, it } from "vitest";
import {
  extractCodigoFromCatalogKey,
  norm,
  productoUnicoPorCodigo,
} from "./map-pedido-extraido-catalog-helpers";
import type { ProductoVentaOption } from "../../../shared/types/sales.types";

describe("map-pedido-extraido-catalog-helpers", () => {
  it("extractCodigoFromCatalogKey lee SKU al final del paréntesis", () => {
    expect(extractCodigoFromCatalogKey("AGUACATE HASS (115001005)")).toBe(
      "115001005",
    );
  });

  it("productoUnicoPorCodigo devuelve único hit", () => {
    const p = { codigo: "SKU1" } as ProductoVentaOption;
    const byCodigo = new Map([["sku1", [p]]]);
    expect(productoUnicoPorCodigo("SKU1", byCodigo)).toBe(p);
    expect(norm("  AbC ")).toBe("abc");
  });
});