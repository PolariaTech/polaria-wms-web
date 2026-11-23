import { describe, expect, it } from "vitest";
import type { CompradorAltaFicha } from "./comprador-alta.types";

describe("comprador-alta.types smoke", () => {
  it("define tipos de ficha", () => {
    const sample = {} as CompradorAltaFicha;
    expect(sample).toBeDefined();
  });
});