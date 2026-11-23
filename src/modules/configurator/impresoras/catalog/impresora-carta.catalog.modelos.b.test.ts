import { describe, expect, it } from "vitest";
import { IMPRESORA_MODELOS_CATALOG } from "./impresora-carta.catalog.modelos";
import { IMPRESORA_MODELOS_CATALOG_B } from "./impresora-carta.catalog.modelos.b";

describe("impresora-carta.catalog.modelos.b", () => {
  it("el agregado incluye todos los modelos de la parte", () => {
    expect(IMPRESORA_MODELOS_CATALOG_B.length).toBeGreaterThan(0);
    for (const m of IMPRESORA_MODELOS_CATALOG_B) {
      expect(IMPRESORA_MODELOS_CATALOG).toContain(m);
    }
  });
});
