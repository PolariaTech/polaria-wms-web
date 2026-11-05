import { describe, expect, it } from "vitest";
import {
  tooltipEliminarTareaOt,
  tooltipGuardarAvanceVenta,
} from "./orden-venta-footer-icon-tooltips";

describe("tooltips iconos pie OV (REQ-232)", () => {
  it("eliminar incluye el número de OT", () => {
    expect(tooltipEliminarTareaOt(3)).toBe("Eliminar esta tarea · TAREA 3");
  });

  it("guardar habla de toda la venta", () => {
    expect(tooltipGuardarAvanceVenta()).toMatch(/toda esta venta/i);
  });
});
