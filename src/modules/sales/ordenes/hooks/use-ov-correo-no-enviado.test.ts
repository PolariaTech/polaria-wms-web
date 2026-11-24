import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VIGENCIA_MARCA_LOCAL_MS } from "../print/print-correo-fallo";
import { useOvCorreoNoEnviado } from "./use-ov-correo-no-enviado";

describe("useOvCorreoNoEnviado (REQ-189)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const usar = (servidor: Set<string> | undefined, reload = vi.fn().mockResolvedValue(undefined)) => ({
    reload,
    ...renderHook(() => useOvCorreoNoEnviado({ idsServidor: servidor, reload })),
  });

  it("sin marcas locales manda el servidor", () => {
    const { result } = usar(new Set(["ov-1"]));
    expect([...result.current.idsCorreoNoEnviado]).toEqual(["ov-1"]);
  });

  it("sin datos del servidor el conjunto empieza vacío", () => {
    const { result } = usar(undefined);
    expect(result.current.idsCorreoNoEnviado.size).toBe(0);
  });

  it("marcar agrega la OV al instante y quitar la oculta aunque el servidor la tenga", () => {
    const { result } = usar(new Set(["ov-1"]));
    act(() => result.current.marcarCorreoNoEnviado("ov-2"));
    expect(result.current.idsCorreoNoEnviado.has("ov-2")).toBe(true);

    act(() => result.current.quitarCorreoNoEnviado("ov-1"));
    expect(result.current.idsCorreoNoEnviado.has("ov-1")).toBe(false);
  });

  it("marcar tras quitar revierte la marca de quitado", () => {
    const { result } = usar(new Set(["ov-1"]));
    act(() => result.current.quitarCorreoNoEnviado("ov-1"));
    act(() => result.current.marcarCorreoNoEnviado("ov-1"));
    expect(result.current.idsCorreoNoEnviado.has("ov-1")).toBe(true);
  });

  it("al vencer la vigencia recarga la lista para que decida el servidor", async () => {
    const { result, reload } = usar(new Set());
    act(() => result.current.marcarCorreoNoEnviado("ov-9"));
    expect(reload).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(VIGENCIA_MARCA_LOCAL_MS + 100);
    });
    expect(reload).toHaveBeenCalledTimes(1);
    // Con la marca vencida el servidor (vacío) vuelve a mandar.
    expect(result.current.idsCorreoNoEnviado.has("ov-9")).toBe(false);
  });
});
