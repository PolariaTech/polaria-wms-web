import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useState } from "react";
import type { CampoDiscrepancia } from "../utils/pedido/map-pedido-extraido-to-form";
import { useClearFieldMarksOv } from "./clear-field-marks-ov";

function useHarness(params: {
  warnFields: Set<string>;
  valoresActuales: Record<string, string>;
  discrepanciasIniciales?: CampoDiscrepancia[];
}) {
  const [warnFields, setWarnFields] = useState(() => params.warnFields);
  const [, setAutoFields] = useState(() => new Set<string>());
  const [, setMissingFields] = useState(() => new Set<string>());
  const [discrepancias, setDiscrepancias] = useState<CampoDiscrepancia[]>(
    () => params.discrepanciasIniciales ?? [],
  );
  const clearFieldMarks = useClearFieldMarksOv({
    warnFields,
    valoresActuales: params.valoresActuales,
    setAutoFields,
    setWarnFields,
    setMissingFields,
    setDiscrepancias,
  });
  return { clearFieldMarks, discrepancias, warnFields };
}

describe("useClearFieldMarksOv", () => {
  it("sin edición manual no crea discrepancia al solo limpiar marcas", () => {
    const { result } = renderHook(() =>
      useHarness({
        warnFields: new Set(["centroConsumo"]),
        valoresActuales: { centroConsumo: "COMEDOR" },
      }),
    );
    act(() => {
      result.current.clearFieldMarks("centroConsumo");
    });
    expect(result.current.discrepancias).toEqual([]);
    expect(result.current.warnFields.has("centroConsumo")).toBe(false);
  });

  it("si el campo estaba en amarillo y el usuario lo cambia, registra Inicial/Definitivo", () => {
    const { result } = renderHook(() =>
      useHarness({
        warnFields: new Set(["centroConsumo"]),
        valoresActuales: { centroConsumo: "COMEDOR" },
      }),
    );
    act(() => {
      result.current.clearFieldMarks("centroConsumo", "XX COMEDOR");
    });
    expect(result.current.discrepancias).toEqual([
      {
        campo: "Centro de consumo",
        fieldKey: "centroConsumo",
        db: "COMEDOR",
        ia: "XX COMEDOR",
      },
    ]);
  });

  it("sigue actualizando Definitivo en tecleos siguientes tras quitar el amarillo", () => {
    const { result } = renderHook(() =>
      useHarness({
        warnFields: new Set(["correo"]),
        valoresActuales: { correo: "a@hilton.com" },
      }),
    );
    act(() => {
      result.current.clearFieldMarks("correo", "b@hilton.com");
    });
    act(() => {
      result.current.clearFieldMarks("correo", "c@hilton.com");
    });
    expect(result.current.discrepancias).toEqual([
      {
        campo: "Correo",
        fieldKey: "correo",
        db: "a@hilton.com",
        ia: "c@hilton.com",
      },
    ]);
  });

  it("no registra discrepancia si el valor nuevo es igual al de Mateo", () => {
    const { result } = renderHook(() =>
      useHarness({
        warnFields: new Set(["direccion"]),
        valoresActuales: { direccion: "Cancun" },
      }),
    );
    act(() => {
      result.current.clearFieldMarks("direccion", "Cancun");
    });
    expect(result.current.discrepancias).toEqual([]);
  });
});
