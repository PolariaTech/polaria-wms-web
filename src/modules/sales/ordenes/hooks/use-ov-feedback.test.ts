import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FEEDBACK_VERSION_NUEVA } from "../components/pages/ov-impresion-feedback";
import { MENSAJE_CORREO_NO_ENVIADO } from "../print/print-correo-fallo";
import { useOvFeedback } from "./use-ov-feedback";

const aFeedback = vi.fn();
vi.mock("../print/auto-print-ov-tras-emitir", () => ({
  autoPrintResultToFeedback: (...a: unknown[]) => aFeedback(...a),
}));

function usar() {
  const quitar = vi.fn();
  const hook = renderHook(() => useOvFeedback({ quitarCorreoNoEnviado: quitar }));
  return { quitar, ...hook };
}

describe("useOvFeedback", () => {
  beforeEach(() => {
    aFeedback.mockReset();
  });

  it("showFeedback arma el aviso con el detalle recortado como única línea", () => {
    const { result } = usar();
    act(() => result.current.showFeedback({ ok: true, title: "Listo", detail: "  impreso  " }));
    expect(result.current.feedback).toEqual({ ok: true, title: "Listo", lines: ["impreso"], retry: null });
    act(() => result.current.showFeedback({ ok: false, title: "Mal", detail: "  " }));
    expect(result.current.feedback?.lines).toEqual([]);
  });

  it("handleEmitSuccess confirma la OV (usa «OV» si el código viene vacío)", () => {
    const { result } = usar();
    act(() => result.current.handleEmitSuccess({ idOrdenVenta: "ov-1", codigo: "OV-5" }));
    expect(result.current.feedback).toMatchObject({
      ok: true,
      title: "OV-5 confirmada",
      lines: ["El pedido ya está confirmado y listo para bodega."],
    });
    act(() => result.current.handleEmitSuccess({ idOrdenVenta: "ov-1", codigo: "  " }));
    expect(result.current.feedback?.title).toBe("OV confirmada");
  });

  it("un resultado que no genera feedback no cambia nada", () => {
    aFeedback.mockReturnValue(null);
    const { result } = usar();
    act(() => result.current.handleAutoPrintResult({ status: "skipped" } as never));
    expect(result.current.feedback).toBeNull();
  });

  it("versión vieja pide recargar la página", () => {
    aFeedback.mockReturnValue({ ok: false, versionVieja: true });
    const { result } = usar();
    act(() => result.current.handleAutoPrintResult({ status: "error" } as never));
    expect(result.current.feedback).toEqual(FEEDBACK_VERSION_NUEVA);
  });

  it("fallo de impresión ofrece reintentar la última OV emitida", () => {
    aFeedback.mockReturnValue({ ok: false });
    const { result } = usar();
    act(() => result.current.handleEmitSuccess({ idOrdenVenta: "ov-1", codigo: "OV-1" }));
    act(() => result.current.handleAutoPrintResult({ status: "error" } as never));
    expect(result.current.feedback).toEqual({
      ok: false,
      title: MENSAJE_CORREO_NO_ENVIADO,
      lines: [],
      retry: { idOrdenVenta: "ov-1", venta: "OV-1", idBodega: null },
    });
  });

  it("impresión OK tras confirmar agrega la línea de impresión al mismo aviso y limpia la marca", () => {
    aFeedback.mockReturnValue({ ok: true, line: "Impreso en Epson", title: "t", detail: "d" });
    const { result, quitar } = usar();
    act(() => result.current.handleEmitSuccess({ idOrdenVenta: "ov-1", codigo: "OV-1" }));
    act(() => result.current.handleAutoPrintResult({ status: "ok" } as never));
    expect(quitar).toHaveBeenCalledWith("ov-1");
    expect(result.current.feedback).toMatchObject({
      ok: true,
      title: "OV-1 confirmada",
      lines: ["El pedido ya está confirmado y listo para bodega.", "Impreso en Epson"],
    });
  });

  it("impresión OK sin confirmación previa muestra su propio aviso", () => {
    aFeedback.mockReturnValue({ ok: true, line: "l", title: "Impreso", detail: "Detalle" });
    const { result, quitar } = usar();
    act(() => result.current.handleAutoPrintResult({ status: "ok" } as never));
    expect(quitar).not.toHaveBeenCalled();
    expect(result.current.feedback).toEqual({ ok: true, title: "Impreso", lines: ["Detalle"], retry: null });
  });
});
