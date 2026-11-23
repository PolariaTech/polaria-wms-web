import { describe, expect, it } from "vitest";
import * as barrel from "./impresora-carta.catalog";
import * as part from "./impresora-carta.catalog.marcas";

describe("impresora-carta.catalog.marcas", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.IMPRESORA_MARCAS_CATALOG).toBe(part.IMPRESORA_MARCAS_CATALOG);
  });
});
