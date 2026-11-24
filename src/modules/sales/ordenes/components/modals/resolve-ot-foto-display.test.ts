import { describe, expect, it } from "vitest";
import { resolveOtFotoDisplay } from "./resolve-ot-foto-display";

describe("resolveOtFotoDisplay", () => {
  it("prioriza props explícitas sobre el id parseado", () => {
    const display = resolveOtFotoDisplay({
      idOrdenTrabajo: "x",
      label: "Tarea A",
      numeroPedido: "123",
      centroConsumo: "Hotel",
    });
    expect(display.label).toBe("Tarea A");
    expect(display.numeroPedido).toBe("123");
    expect(display.centroConsumo).toBe("Hotel");
  });
});