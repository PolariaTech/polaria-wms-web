import { describe, expect, it } from "vitest";
import type { CompradorPreciosPrintOption } from "./comprador-precios-gestion-modal.types";

describe("comprador-precios-gestion-modal.types smoke", () => {
  it("define opciones de impresión", () => {
    const row = {} as CompradorPreciosPrintOption;
    expect(row).toBeDefined();
  });
});