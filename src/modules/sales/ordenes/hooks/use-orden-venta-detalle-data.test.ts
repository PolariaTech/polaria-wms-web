import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOrdenVentaDetalleData } from "./use-orden-venta-detalle-data";

const getDetalle = vi.fn();
vi.mock("../../shared/services/sales.service", () => ({
  getOrdenVentaDetalle: (...args: unknown[]) => getDetalle(...args),
}));
const withCuentaSchema = vi.fn((_cuenta: string, fn: () => unknown) => fn());
vi.mock("@/lib/supabase/cuenta-schema", () => ({
  withCuentaSchema: (cuenta: string, fn: () => unknown) => withCuentaSchema(cuenta, fn),
}));

const fila = { id: "ov-1", codigo: "OV-1", estado: "por_confirmar", lineas: [] };

function armar(parcial: { id?: string | null; cuenta?: string | null; inspect?: boolean } = {}) {
  const resetHija = vi.fn();
  const hook = renderHook(() =>
    useOrdenVentaDetalleData({
      idOrdenVenta: parcial.id === undefined ? "ov-1" : parcial.id,
      codigoCuenta: parcial.cuenta === undefined ? "C-1" : parcial.cuenta,
      inspect: parcial.inspect ?? false,
      resetHija,
    }),
  );
  return { ...hook, resetHija };
}

describe("useOrdenVentaDetalleData", () => {
  beforeEach(() => {
    getDetalle.mockReset();
    withCuentaSchema.mockClear();
  });

  it("sin id o sin cuenta no consulta y reinicia la OT elegida", () => {
    const { result, resetHija } = armar({ id: null });
    expect(getDetalle).not.toHaveBeenCalled();
    expect(result.current.orden).toBeNull();
    expect(resetHija).toHaveBeenCalled();
  });

  it("carga el detalle y apaga el indicador de carga", async () => {
    getDetalle.mockResolvedValue(fila);
    const { result } = armar();
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.orden).toEqual(fila);
    expect(getDetalle).toHaveBeenCalledWith({ codigoCuenta: "C-1", idOrdenVenta: "ov-1" });
    expect(withCuentaSchema).not.toHaveBeenCalled();
  });

  it("en inspección consulta dentro del esquema de la cuenta", async () => {
    getDetalle.mockResolvedValue(fila);
    const { result } = armar({ inspect: true });
    await waitFor(() => expect(result.current.orden).toEqual(fila));
    expect(withCuentaSchema).toHaveBeenCalledWith("C-1", expect.any(Function));
  });

  it("un Error se muestra con su mensaje; otro valor, con el genérico", async () => {
    getDetalle.mockRejectedValueOnce(new Error("sin permiso"));
    const a = armar();
    await waitFor(() => expect(a.result.current.error).toBe("sin permiso"));

    getDetalle.mockRejectedValueOnce("texto");
    const b = armar();
    await waitFor(() =>
      expect(b.result.current.error).toBe("No se pudo cargar el detalle de la venta."),
    );
  });

  it("reloadDetalle silencioso no enciende la carga y limpia el error de acción", async () => {
    getDetalle.mockResolvedValue(fila);
    const { result } = armar();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setActionError("algo"));
    getDetalle.mockResolvedValue({ ...fila, estado: "confirmada" });
    act(() => result.current.reloadDetalle({ silent: true }));
    expect(result.current.isLoading).toBe(false);
    await waitFor(() => expect(result.current.orden?.estado).toBe("confirmada"));
    expect(result.current.actionError).toBeNull();
  });
});
