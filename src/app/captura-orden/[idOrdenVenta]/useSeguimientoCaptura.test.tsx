import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parsearRegistros, type RegistroCaptura } from "./captura-sesion";
import { useSeguimientoCaptura } from "./useSeguimientoCaptura";

function registro(sobrescribir: Partial<RegistroCaptura> = {}): RegistroCaptura {
  return {
    idOrdenVenta: "ov-1",
    idOrdenTrabajo: "ot-1",
    folio: "OV-00001",
    estado: "procesando",
    idIntento: "id-1",
    at: Date.now(),
    ...sobrescribir,
  };
}

function guardado(): RegistroCaptura[] {
  return parsearRegistros(window.localStorage.getItem("polaria:captura:sesion"));
}

function respuesta(intentos: unknown[]) {
  return { ok: true, json: async () => ({ intentos }) };
}

describe("useSeguimientoCaptura", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sin fotos procesando no consulta nada", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    renderHook(() => useSeguimientoCaptura([registro({ estado: "lista" })]));
    await vi.advanceTimersByTimeAsync(10_000);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("pregunta el estado de la foto y, al terminar, la deja en lista en el registro", async () => {
    const fetchMock = vi.fn().mockResolvedValue(respuesta([{ idIntento: "id-1", estado: "lista", mensajeError: null }]));
    vi.stubGlobal("fetch", fetchMock);

    renderHook(() => useSeguimientoCaptura([registro()]));
    await vi.advanceTimersByTimeAsync(0);

    expect(fetchMock).toHaveBeenCalledWith(
      "/captura-orden/ov-1/api?intentos=id-1",
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(guardado()[0]).toMatchObject({ estado: "lista", idIntento: "id-1", folio: "OV-00001" });
  });

  it("si falló guarda el motivo para mostrarlo", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        respuesta([{ idIntento: "id-1", estado: "fallo", mensajeError: "La foto fue tomada mal." }]),
      ),
    );

    renderHook(() => useSeguimientoCaptura([registro()]));
    await vi.advanceTimersByTimeAsync(0);

    expect(guardado()[0]).toMatchObject({ estado: "fallo", mensaje: "La foto fue tomada mal." });
  });

  it("mientras siga procesando vuelve a preguntar cada 3 segundos y no toca el registro", async () => {
    const fetchMock = vi.fn().mockResolvedValue(respuesta([{ idIntento: "id-1", estado: "procesando", mensajeError: null }]));
    vi.stubGlobal("fetch", fetchMock);

    renderHook(() => useSeguimientoCaptura([registro()]));
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(3000);
    await vi.advanceTimersByTimeAsync(3000);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(guardado()).toEqual([]);
  });

  it("agrupa en una sola consulta las fotos de la misma OV y hace otra por cada OV distinta", async () => {
    const fetchMock = vi.fn().mockResolvedValue(respuesta([]));
    vi.stubGlobal("fetch", fetchMock);

    renderHook(() =>
      useSeguimientoCaptura([
        registro({ idIntento: "a", idOrdenTrabajo: "ot-1" }),
        registro({ idIntento: "b", idOrdenTrabajo: "ot-2" }),
        registro({ idIntento: "c", idOrdenVenta: "ov-2" }),
      ]),
    );
    await vi.advanceTimersByTimeAsync(0);

    const urls = fetchMock.mock.calls.map((llamada) => llamada[0] as string).sort();
    expect(urls).toEqual([
      "/captura-orden/ov-1/api?intentos=a,b",
      "/captura-orden/ov-2/api?intentos=c",
    ]);
  });

  it("una pestaña oculta no consulta (lo hace la que se está viendo)", async () => {
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    const fetchMock = vi.fn().mockResolvedValue(respuesta([]));
    vi.stubGlobal("fetch", fetchMock);

    renderHook(() => useSeguimientoCaptura([registro()]));
    await vi.advanceTimersByTimeAsync(9000);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("si la consulta falla (sin red) lo intenta de nuevo sin romper nada", async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error("sin red")).mockResolvedValue(
      respuesta([{ idIntento: "id-1", estado: "lista", mensajeError: null }]),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderHook(() => useSeguimientoCaptura([registro()]));
    await vi.advanceTimersByTimeAsync(0);
    expect(guardado()).toEqual([]);

    await vi.advanceTimersByTimeAsync(3000);
    expect(guardado()[0]?.estado).toBe("lista");
  });

  it("deja de consultar al desmontarse", async () => {
    const fetchMock = vi.fn().mockResolvedValue(respuesta([]));
    vi.stubGlobal("fetch", fetchMock);

    const { unmount } = renderHook(() => useSeguimientoCaptura([registro()]));
    await vi.advanceTimersByTimeAsync(0);
    unmount();
    await vi.advanceTimersByTimeAsync(9000);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
