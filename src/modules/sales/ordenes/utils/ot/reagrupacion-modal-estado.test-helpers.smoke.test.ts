import { describe, expect, it } from "vitest";
import { correr, escribir, generar } from "./reagrupacion-modal-estado.test-helpers";

describe("reagrupacion-modal-estado.test-helpers", () => {
  it("exporta runners de acciones", () => {
    expect(typeof correr).toBe("function");
    expect(escribir("x").tipo).toBe("ESCRIBIR");
    expect(generar("req-1").tipo).toBe("GENERAR");
  });
});
