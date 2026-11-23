import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useProcesamientoEstimado } from "./useProcesamientoEstimado";

describe("useProcesamientoEstimado", () => {
  it("sin secundario no hay desglose y el máximo sale del stock", () => {
    const { result } = renderHook(() =>
      useProcesamientoEstimado({
        secundarioSeleccionado: null,
        conversionUnidades: "10",
        cantidadElegida: 5,
        stockKg: 12.7,
      }),
    );

    expect(result.current.desgloseEstimado).toBeNull();
    expect(result.current.conversionValue).toBe(10);
    expect(result.current.perdidaPctDelCatalogo).toBe(0);
    expect(result.current.maxCantidad).toBeGreaterThanOrEqual(0);
  });
});
