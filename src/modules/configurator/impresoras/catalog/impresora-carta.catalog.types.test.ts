import { describe, expect, it } from "vitest";
import * as barrel from "./impresora-carta.catalog";
import * as part from "./impresora-carta.catalog.types";

describe("impresora-carta.catalog.types", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.IMPRESORA_TIPO_LABEL).toBe(part.IMPRESORA_TIPO_LABEL);
  });
});
