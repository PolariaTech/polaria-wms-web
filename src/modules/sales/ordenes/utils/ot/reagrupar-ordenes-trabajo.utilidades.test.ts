import { describe, expect, it } from "vitest";
import {
  puedeReagruparOt,
  firmaEstadoReagrupacion,
} from "./reagrupar-ordenes-trabajo.utilidades";

describe("reagrupar-ordenes-trabajo.utilidades", () => {
  it("puedeReagruparOt solo en por_confirmar", () => {
    expect(puedeReagruparOt("por_confirmar", 2)).toBe(true);
    expect(puedeReagruparOt("confirmada", 2)).toBe(false);
  });

  it("firmaEstadoReagrupacion cambia con líneas", () => {
    const firmaA = firmaEstadoReagrupacion([], [{ nombre: "A", codigo: "C", cantidadInput: "1" }]);
    const firmaB = firmaEstadoReagrupacion(
      [],
      [{ nombre: "B", codigo: "C", cantidadInput: "1" }],
    );
    expect(firmaA).not.toBe(firmaB);
  });
});