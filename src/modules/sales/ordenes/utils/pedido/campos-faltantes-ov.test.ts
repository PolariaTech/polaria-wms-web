import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAbrirCapturaOv, useAvisosValidacionOv } from "./campos-faltantes-ov";

const avisosBase = {
  discrepancias: [],
  fechaEntrega: "2020-01-01",
  fechaEntregaAtrasada: false,
  correo: "",
  warnFields: new Set<string>(),
  ordenCompraHotel: "",
  ordenesTrabajoForm: [],
  compradorLabel: "",
  editingId: "",
  operadorRowsForDuplicado: [],
  idOrdenVenta: null,
};

describe("useAvisosValidacionOv", () => {
  it("una fecha de entrega atrasada entra al aviso de revisión", () => {
    const { result } = renderHook(() =>
      useAvisosValidacionOv({ ...avisosBase, fechaEntregaAtrasada: true }),
    );
    expect(result.current.avisosValidacion).toEqual([
      expect.objectContaining({
        fieldKey: "fechaEntrega",
        db: "Hoy o posterior",
      }),
    ]);
    expect(result.current.avisosCatalogoValidacion).toHaveLength(1);
  });

  it("sin discrepancias ni orden de compra no hay avisos", () => {
    const { result } = renderHook(() => useAvisosValidacionOv(avisosBase));
    expect(result.current.avisosValidacion).toEqual([]);
    expect(result.current.avisoPotencialDuplicado).toBeNull();
  });
});

describe("useAbrirCapturaOv", () => {
  it("captura desde cero entra al formulario cuando el catálogo ya está listo", async () => {
    const setStartMode = vi.fn();
    const setError = vi.fn();
    const setStep = vi.fn();
    const ensureFormDataReady = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() =>
      useAbrirCapturaOv({
        setStartMode,
        setError,
        setStep,
        ensureFormDataReady,
        setIsCompradorCreateOpen: vi.fn(),
        setCompradores: vi.fn(),
        idComprador: "",
        handleSelectComprador: vi.fn(),
      }),
    );

    result.current.openFormFromScratch();
    await vi.waitFor(() => expect(setStep).toHaveBeenCalledWith("form"));
    expect(setStartMode).toHaveBeenCalledWith("scratch");
    expect(setError).toHaveBeenCalledWith(null);
  });
});
