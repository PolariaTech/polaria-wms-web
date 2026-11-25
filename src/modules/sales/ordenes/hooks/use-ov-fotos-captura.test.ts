import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import { useOvFotosCaptura } from "./use-ov-fotos-captura";

const fetchMock = vi.fn();
const row = { idOrdenVenta: "ov-1", venta: "OV-1" } as OrdenVentaOperadorRow;

function responder(body: unknown, ok = true) {
  fetchMock.mockResolvedValue({ ok, json: async () => body });
}

function armar() {
  const ctx = { printingLockRef: { current: false }, setBusyAction: vi.fn() };
  const hook = renderHook(() => useOvFotosCaptura(ctx));
  return { ctx, ...hook };
}

describe("useOvFotosCaptura", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sin OT carga la lista de OT con fotos y no bloquea volver a ellas", async () => {
    responder({ ordenesTrabajo: [{ id: "ot-1" }] });
    const { result, ctx } = armar();
    await act(async () => {
      await result.current.openFotosCaptura(row);
    });
    expect(ctx.setBusyAction).toHaveBeenNthCalledWith(1, { id: "ov-1", kind: "fotos" });
    expect(result.current.fotosPreview).toMatchObject({
      idOrdenVenta: "ov-1",
      title: "Fotos · OV-1",
      ordenesTrabajo: [{ id: "ot-1" }],
      selectedOt: null,
      loadingOts: false,
      lockToOt: false,
      error: null,
    });
    expect(ctx.printingLockRef.current).toBe(false);
    expect(ctx.setBusyAction).toHaveBeenLastCalledWith(null);
  });

  it("con OT (desde Cypher) carga solo sus fotos y bloquea la vista en esa OT", async () => {
    responder({ fotos: [{ idFoto: "f1", urlFoto: "http://x/1.jpg" }] });
    const { result } = armar();
    await act(async () => {
      await result.current.openFotosCaptura(row, " ot-7 ");
    });
    expect(fetchMock).toHaveBeenCalledWith("/captura-orden/ov-1/api?historial=1&ot=ot-7");
    expect(result.current.fotosPreview).toMatchObject({
      selectedOt: "ot-7",
      lockToOt: true,
      loadingFotos: false,
      fotos: [expect.objectContaining({ idFoto: "f1" })],
    });
  });

  it("si falla la carga guarda el error conservando el modo de la vista", async () => {
    responder({ error: "sin permiso" }, false);
    const { result } = armar();
    await act(async () => {
      await result.current.openFotosCaptura(row, "ot-7");
    });
    expect(result.current.fotosPreview).toMatchObject({
      error: "sin permiso",
      selectedOt: "ot-7",
      lockToOt: true,
      fotos: [],
    });
  });

  it("no abre si hay otra acción en curso", async () => {
    const { result, ctx } = armar();
    ctx.printingLockRef.current = true;
    await act(async () => {
      await result.current.openFotosCaptura(row);
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.fotosPreview).toBeNull();
  });

  it("selectFotosOt carga las fotos de la OT elegida sobre la vista abierta", async () => {
    responder({ ordenesTrabajo: [{ id: "ot-1" }] });
    const { result } = armar();
    await act(async () => {
      await result.current.openFotosCaptura(row);
    });
    responder({ fotos: [{ idFoto: "f9", urlFoto: "http://x/9.jpg" }] });
    await act(async () => {
      await result.current.selectFotosOt("ot-1");
    });
    expect(result.current.fotosPreview).toMatchObject({
      selectedOt: "ot-1",
      loadingFotos: false,
      fotos: [expect.objectContaining({ idFoto: "f9" })],
      ordenesTrabajo: [{ id: "ot-1" }],
    });
  });

  it("selectFotosOt sin vista abierta no hace nada; si falla guarda el error", async () => {
    const { result } = armar();
    await act(async () => {
      await result.current.selectFotosOt("ot-1");
    });
    expect(fetchMock).not.toHaveBeenCalled();

    responder({ ordenesTrabajo: [] });
    await act(async () => {
      await result.current.openFotosCaptura(row);
    });
    responder({ error: "x" }, false);
    await act(async () => {
      await result.current.selectFotosOt("ot-1");
    });
    expect(result.current.fotosPreview).toMatchObject({ error: "x", fotos: [], loadingFotos: false });
  });

  it("volverALasOt limpia la OT elegida y cerrarFotos descarta la vista", async () => {
    responder({ fotos: [] });
    const { result } = armar();
    await act(async () => {
      await result.current.openFotosCaptura(row, "ot-1");
    });
    act(() => result.current.volverALasOt());
    await waitFor(() => expect(result.current.fotosPreview?.selectedOt).toBeNull());
    act(() => result.current.cerrarFotos());
    expect(result.current.fotosPreview).toBeNull();
    // Tras cerrar, ya no hay OV de referencia para seleccionar OT.
    fetchMock.mockClear();
    await act(async () => {
      await result.current.selectFotosOt("ot-1");
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
