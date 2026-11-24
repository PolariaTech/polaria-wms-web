import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import { MENSAJE_CORREO_MAS_TARDE } from "../print/print-correo-fallo";
import { useOvReintentarEnvio } from "./use-ov-reintentar-envio";

const autoPrint = vi.fn();
const postLog = vi.fn();
vi.mock("../print/auto-print-ov-tras-emitir", () => ({
  autoPrintOrdenVentaTrasEmitir: (...a: unknown[]) => autoPrint(...a),
}));
vi.mock("../services/orden-venta-log.client", () => ({
  postOrdenVentaLog: (...a: unknown[]) => postLog(...a),
}));
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: { getState: () => ({ session: { nombre: "Ana", idUsuario: "u-1" } }) },
}));

const target = { idOrdenVenta: "ov-1", venta: "OV-1", idBodega: "b-1", ots: [2] };

function armar(filas: OrdenVentaOperadorRow[] = []) {
  const ctx = {
    codigoCuenta: "C-1" as string | null,
    runScoped: <T,>(fn: () => Promise<T>) => fn(),
    printingLockRef: { current: false },
    setBusyAction: vi.fn(),
    setFeedback: vi.fn(),
    showFeedback: vi.fn(),
    marcarCorreoNoEnviado: vi.fn(),
    quitarCorreoNoEnviado: vi.fn(),
    rowsRef: { current: filas },
  };
  const executePrint = vi.fn();
  const { result } = renderHook(() => useOvReintentarEnvio(ctx, executePrint as never));
  return { ctx, executePrint, reintentar: result.current };
}

describe("useOvReintentarEnvio", () => {
  beforeEach(() => {
    autoPrint.mockReset();
    postLog.mockReset().mockResolvedValue(undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("si la OV sigue en el listado reintenta con executePrint y las mismas OT", () => {
    const fila = { idOrdenVenta: "ov-1" } as OrdenVentaOperadorRow;
    const { executePrint, reintentar } = armar([fila]);
    reintentar(target);
    expect(executePrint).toHaveBeenCalledWith(fila, "reintento", [2]);
    expect(autoPrint).not.toHaveBeenCalled();
  });

  it("si no está en el listado reimprime desde el servidor y avisa el éxito", async () => {
    autoPrint.mockResolvedValue({ status: "ok", queue: "enviada", impresora: "Epson", codigo: "", hojas: 1 });
    const { ctx, reintentar } = armar();
    reintentar(target);
    expect(ctx.printingLockRef.current).toBe(true);
    expect(ctx.setBusyAction).toHaveBeenCalledWith({ id: "ov-1", kind: "print" });
    await waitFor(() => expect(ctx.showFeedback).toHaveBeenCalledWith(expect.objectContaining({ ok: true })));
    expect(ctx.quitarCorreoNoEnviado).toHaveBeenCalledWith("ov-1");
    await waitFor(() => expect(ctx.printingLockRef.current).toBe(false));
    expect(ctx.setBusyAction).toHaveBeenLastCalledWith(null);
  });

  it("si falla registra en bitácora, marca el correo y avisa «más tarde»", async () => {
    autoPrint.mockResolvedValue({ status: "error", message: "sin papel" });
    const { ctx, reintentar } = armar();
    reintentar(target);
    await waitFor(() => expect(ctx.marcarCorreoNoEnviado).toHaveBeenCalledWith("ov-1"));
    expect(postLog).toHaveBeenCalledWith(
      expect.objectContaining({
        idOrdenVenta: "ov-1",
        idBodega: "b-1",
        mensaje: MENSAJE_CORREO_MAS_TARDE,
        payloadExtra: expect.objectContaining({ detalle: "sin papel" }),
      }),
    );
    expect(ctx.setFeedback).toHaveBeenCalledWith({
      ok: false,
      title: MENSAJE_CORREO_MAS_TARDE,
      lines: [],
      retry: null,
    });
  });

  it("un resultado que no es ok ni error usa el mensaje genérico", async () => {
    autoPrint.mockResolvedValue({ status: "skipped" });
    const { ctx, reintentar } = armar();
    reintentar(target);
    await waitFor(() => expect(postLog).toHaveBeenCalled());
    expect(postLog.mock.calls[0]![0].payloadExtra.detalle).toBe("No se pudo enviar a la impresora.");
    expect(ctx.marcarCorreoNoEnviado).toHaveBeenCalled();
  });

  it("con otra acción en curso no reimprime", () => {
    const a = armar();
    a.ctx.printingLockRef.current = true;
    a.reintentar(target);
    expect(autoPrint).not.toHaveBeenCalled();
    expect(a.ctx.setBusyAction).not.toHaveBeenCalled();
  });
});
