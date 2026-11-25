import { describe, expect, it } from "vitest";
import * as barrel from "./impresora-carta.catalog";
import * as part from "./impresora-carta.catalog.lookup";

describe("impresora-carta.catalog.lookup", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.getImpresoraMarcaById).toBe(part.getImpresoraMarcaById);
    expect(barrel.listImpresoraModelosByMarca).toBe(part.listImpresoraModelosByMarca);
    expect(barrel.findImpresoraMarcaByNombre).toBe(part.findImpresoraMarcaByNombre);
    expect(barrel.findImpresoraModeloByNombre).toBe(part.findImpresoraModeloByNombre);
  });
});
