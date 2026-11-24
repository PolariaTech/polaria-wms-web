import { describe, expect, it } from "vitest";
import { VisorAdjuntoCorreo } from "./VisorAdjuntoCorreo";

describe("VisorAdjuntoCorreo", () => {
  it("exporta el visor", () => {
    expect(typeof VisorAdjuntoCorreo).toBe("function");
  });
});
