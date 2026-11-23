import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useOvImpresion } from "./use-ov-impresion";

vi.mock("../../shared/services/sales.service", () => ({ getOrdenVentaDetalle: vi.fn() }));
vi.mock("../surtido/list-orden-surtido-capturas.client", () => ({
  listOrdenSurtidoCapturasClient: vi.fn(),
}));

describe("useOvImpresion", () => {
  it("expone el estado ocupado, el bloqueo y las acciones de impresión", () => {
    const { result } = renderHook(() =>
      useOvImpresion({
        codigoCuenta: "C-1",
        runScoped: (fn) => fn(),
        zonaHoraria: "America/Bogota",
        setFeedback: vi.fn(),
        showFeedback: vi.fn(),
        marcarCorreoNoEnviado: vi.fn(),
        quitarCorreoNoEnviado: vi.fn(),
        rowsRef: { current: [] },
      }),
    );
    const r = result.current;
    expect(r.busyAction).toBeNull();
    expect(r.printingLockRef.current).toBe(false);
    expect(r.seleccionOt).toBeNull();
    expect(r.pdfPreview).toBeNull();
    for (const accion of [
      r.loadPrintSheets,
      r.executePrint,
      r.reintentarEnvio,
      r.abrirSeleccionOt,
      r.openPdfPreview,
      r.setBusyAction,
      r.setSeleccionOt,
      r.setPdfPreview,
    ]) {
      expect(typeof accion).toBe("function");
    }
  });
});
