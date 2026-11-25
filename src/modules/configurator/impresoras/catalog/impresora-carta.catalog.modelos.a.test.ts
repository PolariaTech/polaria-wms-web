import { describe, expect, it } from "vitest";
import { IMPRESORA_MODELOS_CATALOG } from "./impresora-carta.catalog.modelos";
import { IMPRESORA_MODELOS_CATALOG_A } from "./impresora-carta.catalog.modelos.a";

describe("impresora-carta.catalog.modelos.a", () => {
  it("el agregado incluye todos los modelos de la parte", () => {
    expect(IMPRESORA_MODELOS_CATALOG_A.length).toBeGreaterThan(0);
    for (const m of IMPRESORA_MODELOS_CATALOG_A) {
      expect(IMPRESORA_MODELOS_CATALOG).toContain(m);
    }
  });
});
