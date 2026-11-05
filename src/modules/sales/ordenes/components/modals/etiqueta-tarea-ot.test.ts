import { describe, expect, it } from "vitest";
import { ETIQUETA_TAREA, etiquetaTareaIndice } from "./etiqueta-tarea-ot";

describe("etiquetaTareaOt (REQ-225)", () => {
  it("usa TAREA en lugar de OT", () => {
    expect(ETIQUETA_TAREA).toBe("TAREA");
    expect(etiquetaTareaIndice(1, 10)).toBe("TAREA 1/10");
    expect(etiquetaTareaIndice(3)).toBe("TAREA 3");
  });
});
