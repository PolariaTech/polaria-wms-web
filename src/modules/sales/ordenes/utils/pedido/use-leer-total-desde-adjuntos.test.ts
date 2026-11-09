import { describe, expect, it } from "vitest";
import { useLeerTotalDesdeAdjuntos } from "./use-leer-total-desde-adjuntos";

describe("useLeerTotalDesdeAdjuntos", () => {
  it("exporta el hook (REQ-279 adjuntos)", () => {
    expect(typeof useLeerTotalDesdeAdjuntos).toBe("function");
  });
});
