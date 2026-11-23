import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FEEDBACK_VERSION_NUEVA } from "../components/pages/ov-impresion-feedback";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import {
  MENSAJE_CORREO_MAS_TARDE,
  MENSAJE_CORREO_NO_ENVIADO,
  TIPO_CORREO_NO_ENVIADO,
} from "../print/print-correo-fallo";
import { useOvEjecutarImpresion } from "./use-ov-ejecutar-impresion";

const imprimir = vi.fn();
const postLog = vi.fn();
const postLogOts = vi.fn();
vi.mock("../print/download-orden-tarea-almacen-pdf", () => ({
  printOrdenTareaAlmacenLandscape: (...a: unknown[]) => imprimir(...a),
}));
vi.mock("../services/orden-venta-log.client", () => ({
  postOrdenVentaLog: (...a: unknown[]) => postLog(...a),
  postOrdenVentaLogForOts: (...a: unknown[]) => postLogOts(...a),
}));
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: { getState: () => ({ session: { nombre: "Ana", idUsuario: "u-1" } }) },
}));

const row = { idOrdenVenta: "ov-1", venta: "OV-1", idBodega: "b-1" } as OrdenVentaOperadorRow;
const hoja = (n: number) => ({ idOrdenTrabajo: `ot-${n}`, tareaIndex: n });

function armar(hojas: unknown[] = [hoja(1), hoja(2)], codigoCuenta: string | null = "C-1") {
  const ctx = {
    codigoCuenta,
    printingLockRef: { current: false },
    setBusyAction: vi.fn(),
    setFeedback: vi.fn(),
    showFeedback: vi.fn(),
    marcarCorreoNoEnviado: vi.fn(),
    quitarCorreoNoEnviado: vi.fn(),
  };
  const loadPrintSheets = vi.fn().mockResolvedValue(hojas);
  const { result } = renderHook(() =>
    useOvEjecutarImpresion(ctx, loadPrintSheets as never),
  );
  return { ctx, loadPrintSheets, ejecutar: result.current };
}

describe("useOvEjecutarImpresion", () => {
  beforeEach(() => {
    imprimir.mockReset().mockResolvedValue({ queue: "enviada", impresora: "Epson" });
    postLog.mockReset().mockResolvedValue(undefined);
    postLogOts.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("sin cuenta o con otra acción en curso no hace nada", async () => {
    const a = armar(undefined, null);
    await a.ejecutar(row);
    expect(a.ctx.setBusyAction).not.toHaveBeenCalled();

    const b = armar();
    b.ctx.printingLockRef.current = true;
    await b.ejecutar(row);
    expect(imprimir).not.toHaveBeenCalled();
  });

  it("imprime, avisa, limpia la marca de correo, registra en bitácora y libera el bloqueo", async () => {
    const { ctx, ejecutar } = armar();
    await ejecutar(row);
    expect(ctx.setBusyAction).toHaveBeenNthCalledWith(1, { id: "ov-1", kind: "print" });
    expect(imprimir).toHaveBeenCalledWith(expect.any(Array), { codigoCuenta: "C-1" });
    expect(ctx.showFeedback).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
    expect(ctx.quitarCorreoNoEnviado).toHaveBeenCalledWith("ov-1");
    expect(postLogOts).toHaveBeenCalledWith(
      expect.objectContaining({
        idOrdenVenta: "ov-1",
        autorNombre: "Ana",
        idBodega: "b-1",
        idOrdenesTrabajo: ["ot-1", "ot-2"],
      }),
    );
    expect(ctx.printingLockRef.current).toBe(false);
    expect(ctx.setBusyAction).toHaveBeenLastCalledWith(null);
  });

  it("con OT elegidas imprime solo esas hojas", async () => {
    const { ejecutar } = armar([hoja(1), hoja(2), hoja(3)]);
    await ejecutar(row, "inicial", [2]);
    const enviadas = imprimir.mock.calls[0]![0] as Array<{ idOrdenTrabajo: string }>;
    expect(enviadas.map((h) => h.idOrdenTrabajo)).toEqual(["ot-2"]);
  });

  it("si no hay hojas falla y ofrece reintentar con las OT elegidas", async () => {
    const { ctx, ejecutar } = armar([]);
    await ejecutar(row, "inicial", [5]);
    expect(imprimir).not.toHaveBeenCalled();
    expect(ctx.setFeedback).toHaveBeenCalledWith({
      ok: false,
      title: MENSAJE_CORREO_NO_ENVIADO,
      lines: [],
      retry: { idOrdenVenta: "ov-1", venta: "OV-1", idBodega: "b-1", ots: [5] },
    });
    expect(ctx.printingLockRef.current).toBe(false);
  });

  it("un fallo en el reintento lo registra en bitácora y marca el correo como no enviado", async () => {
    imprimir.mockRejectedValue(new Error("impresora apagada"));
    const { ctx, ejecutar } = armar();
    await ejecutar(row, "reintento");
    expect(postLog).toHaveBeenCalledWith(
      expect.objectContaining({
        mensaje: MENSAJE_CORREO_MAS_TARDE,
        payloadExtra: { tipo: TIPO_CORREO_NO_ENVIADO, detalle: "impresora apagada" },
      }),
    );
    expect(ctx.marcarCorreoNoEnviado).toHaveBeenCalledWith("ov-1");
    expect(ctx.setFeedback).toHaveBeenCalledWith({
      ok: false,
      title: MENSAJE_CORREO_MAS_TARDE,
      lines: [],
      retry: null,
    });
  });

  it("un ChunkLoadError es versión vieja: recarga, no registra y libera el bloqueo", async () => {
    const chunk = Object.assign(new Error("chunk"), { name: "ChunkLoadError" });
    imprimir.mockRejectedValue(chunk);
    const { ctx, ejecutar } = armar();
    await ejecutar(row, "reintento");
    expect(ctx.setFeedback).toHaveBeenCalledWith(FEEDBACK_VERSION_NUEVA);
    expect(postLog).not.toHaveBeenCalled();
    expect(ctx.marcarCorreoNoEnviado).not.toHaveBeenCalled();
    expect(ctx.printingLockRef.current).toBe(false);
  });
});
