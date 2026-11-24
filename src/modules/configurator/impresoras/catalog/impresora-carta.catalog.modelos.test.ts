import { describe, expect, it } from "vitest";
import * as barrel from "./impresora-carta.catalog";
import * as part from "./impresora-carta.catalog.modelos";

describe("impresora-carta.catalog.modelos", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.IMPRESORA_MODELOS_CATALOG).toBe(part.IMPRESORA_MODELOS_CATALOG);
  });
});
