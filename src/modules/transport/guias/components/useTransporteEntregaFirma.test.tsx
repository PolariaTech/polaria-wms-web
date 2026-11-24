import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useTransporteEntregaFirma } from "./useTransporteEntregaFirma";

describe("useTransporteEntregaFirma", () => {
  it("sin dibujo no hay firma ni data url", () => {
    const { result } = renderHook(() => useTransporteEntregaFirma(true, 0));

    expect(result.current.hasFirma()).toBe(false);
    expect(result.current.resolveFirmaRaw()).toBe("");
  });

  it("captureFirma sin dibujo no cambia el estado", () => {
    const { result } = renderHook(() => useTransporteEntregaFirma(true, 2));

    act(() => result.current.captureFirma());
    expect(result.current.hasFirma()).toBe(false);
  });

  it("resetFirma y clearFirma son seguros sin canvas", () => {
    const { result } = renderHook(() => useTransporteEntregaFirma(true, 2));

    expect(() => {
      act(() => result.current.resetFirma());
      act(() => result.current.clearFirma());
    }).not.toThrow();
    expect(result.current.canvasRef.current).toBeNull();
  });
});
