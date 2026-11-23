import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import { useOvSeleccionPdf } from "./use-ov-seleccion-pdf";

const fetchLog = vi.fn();
const tieneImpresion = vi.fn();
const construirPdf = vi.fn();
vi.mock("../services/orden-venta-log.client", () => ({
  fetchOrdenVentaLog: (...a: unknown[]) => fetchLog(...a),
}));
vi.mock("../print-batch/ya-impresas", () => ({
  logTieneImpresion: (...a: unknown[]) => tieneImpresion(...a),
}));
vi.mock("../utils/pdf/build-ov-pdf-con-timeout", () => ({
  buildOvPdfBlobConTimeout: (...a: unknown[]) => construirPdf(...a),
}));

const row = { idOrdenVenta: "ov-1", venta: "OV-1" } as OrdenVentaOperadorRow;
const hoja = (n: number) => ({ idOrdenTrabajo: `ot-${n}`, tareaIndex: n });

function armar(codigoCuenta: string | null = "C-1") {
  const ctx = {
    codigoCuenta,
    runScoped: <T,>(fn: () => Promise<T>) => fn(),
    printingLockRef: { current: false },
    setBusyAction: vi.fn(),
  };
  const loadPrintSheets = vi.fn().mockResolvedValue([hoja(1), hoja(2)]);
  const hook = renderHook(() => useOvSeleccionPdf(ctx, loadPrintSheets as never));
  return { ctx, loadPrintSheets, ...hook };
}

describe("useOvSeleccionPdf", () => {
  beforeEach(() => {
    fetchLog.mockReset().mockResolvedValue([]);
    tieneImpresion.mockReset().mockReturnValue(false);
    construirPdf.mockReset().mockResolvedValue(new Blob(["pdf"]));
  });

  it("abrir selección para imprimir marca «yaImpresa» si la bitácora lo indica (REQ-137)", async () => {
    tieneImpresion.mockReturnValue(true);
    const { result } = armar();
    act(() => result.current.abrirSeleccionOt(row, "imprimir"));
    expect(result.current.seleccionOt).toEqual({ row, accion: "imprimir", yaImpresa: false });
    await waitFor(() => expect(result.current.seleccionOt?.yaImpresa).toBe(true));
    expect(fetchLog).toHaveBeenCalledWith({ codigoCuenta: "C-1", idOrdenVenta: "ov-1" });
  });

  it("para descargar no consulta la bitácora", () => {
    const { result } = armar();
    act(() => result.current.abrirSeleccionOt(row, "descargar"));
    expect(result.current.seleccionOt?.accion).toBe("descargar");
    expect(fetchLog).not.toHaveBeenCalled();
  });

  it("si la bitácora falla no bloquea la selección", async () => {
    fetchLog.mockRejectedValue(new Error("x"));
    const { result } = armar();
    act(() => result.current.abrirSeleccionOt(row, "imprimir"));
    await waitFor(() => expect(fetchLog).toHaveBeenCalled());
    expect(result.current.seleccionOt?.yaImpresa).toBe(false);
  });

  it("no abre la selección si hay otra acción en curso", () => {
    const { result, ctx } = armar();
    ctx.printingLockRef.current = true;
    act(() => result.current.abrirSeleccionOt(row, "imprimir"));
    expect(result.current.seleccionOt).toBeNull();
  });

  it("previsualizar construye el PDF con todas las hojas y libera el bloqueo", async () => {
    const { result, ctx } = armar();
    await act(async () => {
      await result.current.openPdfPreview(row);
    });
    expect(ctx.setBusyAction).toHaveBeenNthCalledWith(1, { id: "ov-1", kind: "preview" });
    expect(construirPdf).toHaveBeenCalledWith([hoja(1), hoja(2)]);
    expect(result.current.pdfPreview).toMatchObject({ title: "Previsualizacion · OV-1", error: null });
    expect(result.current.pdfPreview?.blob).toBeInstanceOf(Blob);
    expect(ctx.printingLockRef.current).toBe(false);
    expect(ctx.setBusyAction).toHaveBeenLastCalledWith(null);
  });

  it("con OT elegidas el PDF lleva solo esas hojas", async () => {
    const { result } = armar();
    await act(async () => {
      await result.current.openPdfPreview(row, [2]);
    });
    expect(construirPdf).toHaveBeenCalledWith([hoja(2)]);
  });

  it("si el PDF falla guarda el mensaje del error (o el genérico)", async () => {
    construirPdf.mockRejectedValueOnce(new Error("timeout"));
    const { result } = armar();
    await act(async () => {
      await result.current.openPdfPreview(row);
    });
    expect(result.current.pdfPreview).toMatchObject({ blob: null, error: "timeout" });

    construirPdf.mockRejectedValueOnce("raro");
    await act(async () => {
      await result.current.openPdfPreview(row);
    });
    expect(result.current.pdfPreview?.error).toBe("No se pudo generar el PDF.");
  });

  it("sin cuenta no previsualiza", async () => {
    const a = armar(null);
    await act(async () => {
      await a.result.current.openPdfPreview(row);
    });
    expect(a.result.current.pdfPreview).toBeNull();
    expect(construirPdf).not.toHaveBeenCalled();
  });
});
